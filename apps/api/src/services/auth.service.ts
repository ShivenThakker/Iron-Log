import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { authRepository } from '../repositories/auth.repository';
import { redis } from '../lib/redis';
import { gamificationRepository } from '../repositories/gamification.repository';
import { AppError, UnauthorizedError, NotFoundError, BadRequestError } from '../utils/errors';
import { env } from '../lib/env';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

export class AuthService {
  async register(email: string, password_hash: string, name?: string) {
    const existingUser = await authRepository.findUserByEmail(email);
    if (existingUser) {
      throw new AppError('Email already in use', 409);
    }
    
    const hashed = await bcrypt.hash(password_hash, 10);
    const user = await authRepository.createUser({
      email,
      password_hash: hashed,
      name,
    });
    
    // Award 100 onboarding XP
    await gamificationRepository.awardXp(user.id, 100, 'Welcome to IronLog');

    return this.generateTokens(user.id);
  }

  async login(email: string, password_hash: string) {
    const user = await authRepository.findUserByEmail(email);
    if (!user || !user.password_hash) {
      // Execute dummy bcrypt to prevent account enumeration via timing discrepancy
      await bcrypt.compare(password_hash, '$2a$10$wT5g8.u8x4eP5N0K2eI8uuQzYj3hG8vK3oY6sL5nQ9rR1sU5vO2uC');
      throw new UnauthorizedError('Invalid credentials');
    }

    const isValid = await bcrypt.compare(password_hash, user.password_hash);
    if (!isValid) {
      throw new UnauthorizedError('Invalid credentials');
    }

    return this.generateTokens(user.id);
  }

  async refreshToken(refreshTokenString: string) {
    // Check if token was blacklisted
    const isBlacklisted = await redis.get(`blacklist:${refreshTokenString}`);
    if (isBlacklisted) {
      throw new UnauthorizedError('Token has been revoked');
    }

    try {
      const decoded = jwt.verify(refreshTokenString, env.JWT_REFRESH_SECRET, { algorithms: ['HS256'] }) as { id: string };
      const user = await authRepository.findUserById(decoded.id);
      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      await redis.set(`blacklist:${refreshTokenString}`, 'revoked', { ex: 30 * 24 * 3600 });

      return this.generateTokens(user.id);
    } catch {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }
  }

  async logout(refreshTokenString?: string) {
    if (refreshTokenString) {
      // Blacklist refresh token for 30 days
      await redis.set(`blacklist:${refreshTokenString}`, 'revoked', { ex: 30 * 24 * 3600 });
    }
    return { success: true, message: 'Logged out successfully' };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await authRepository.findUserById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (!user.password_hash) {
      throw new BadRequestError('Account does not have a password set (signed up with Google)');
    }

    const isValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValid) {
      throw new UnauthorizedError('Current password is incorrect');
    }

    if (newPassword.length < 8) {
      throw new BadRequestError('New password must be at least 8 characters');
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await authRepository.updatePassword(userId, hashed);

    return { success: true, message: 'Password updated successfully' };
  }

  async forgotPassword(email: string) {
    const normalized = email.trim().toLowerCase();
    const user = await authRepository.findUserByEmail(normalized);
    if (!user) {
      return {
        success: true,
        message: 'If an account exists with this email, password reset instructions have been sent.',
      };
    }

    const token = Math.floor(100000 + Math.random() * 900000).toString();
    try {
      await redis.set(`reset:${user.email}`, token, { ex: 900 });
    } catch (e) {
      console.warn('Redis error caching reset token:', e);
    }

    console.log(`[PASSWORD_RESET] Code for ${user.email}: ${token}`);

    return {
      success: true,
      message: 'If an account exists with this email, password reset instructions have been sent.',
      ...(process.env.NODE_ENV !== 'production' ? { devResetCode: token } : {}),
    };
  }

  async resetPassword(email: string, newPassword: string, token?: string) {
    const normalized = email.trim().toLowerCase();
    const user = await authRepository.findUserByEmail(normalized);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (token) {
      let storedToken: string | null = null;
      try {
        storedToken = await redis.get(`reset:${user.email}`);
      } catch (e) {
        console.warn('Redis error getting reset token:', e);
      }
      if (!storedToken || storedToken !== token) {
        throw new BadRequestError('Invalid or expired reset code');
      }
      try {
        await redis.del(`reset:${user.email}`);
      } catch {
        // ignore
      }
    }

    if (newPassword.length < 8) {
      throw new BadRequestError('New password must be at least 8 characters');
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await authRepository.updatePassword(user.id, hashed);

    return { success: true, message: 'Password has been reset successfully. You can now log in.' };
  }

  async googleAuth(idToken: string) {
    try {
      let email: string | undefined;
      let name: string | undefined;

      if (!GOOGLE_CLIENT_ID) {
        throw new AppError('Google sign-in is not configured on this server', 503);
      }

      const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      email = payload?.email;
      name = payload?.name;

      if (!email) {
        throw new UnauthorizedError('Unable to extract email from Google token');
      }

      if (!payload?.email_verified) {
        throw new UnauthorizedError('Google account email has not been verified');
      }

      let user = await authRepository.findUserByEmail(email);
      if (!user) {
        user = await authRepository.createUser({
          email,
          name: name || 'Athlete',
        });
        await gamificationRepository.awardXp(user.id, 100, 'Welcome to IronLog via Google');
      }

      return this.generateTokens(user.id);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Invalid token';
      throw new UnauthorizedError(`Google authentication failed: ${message}`);
    }
  }

  private generateTokens(userId: string) {
    const accessToken = jwt.sign({ id: userId }, env.JWT_SECRET, { algorithm: 'HS256', expiresIn: '15m' });
    const refreshToken = jwt.sign({ id: userId }, env.JWT_REFRESH_SECRET, { algorithm: 'HS256', expiresIn: '30d' });
    return { accessToken, refreshToken, userId };
  }
}

export const authService = new AuthService();
