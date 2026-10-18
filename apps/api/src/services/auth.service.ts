import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { authRepository } from '../repositories/auth.repository';
import { redis } from '../lib/redis';
import { gamificationRepository } from '../repositories/gamification.repository';
import { AppError, UnauthorizedError } from '../utils/errors';
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
      const decoded = jwt.verify(refreshTokenString, env.JWT_REFRESH_SECRET) as { id: string };
      const user = await authRepository.findUserById(decoded.id);
      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      // Rotate tokens: blacklist old refresh token for remaining duration (e.g. 7 days)
      await redis.set(`blacklist:${refreshTokenString}`, 'revoked', { ex: 7 * 24 * 3600 });

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

  async googleAuth(idToken: string) {
    try {
      let email: string | undefined;
      let name: string | undefined;

      if (GOOGLE_CLIENT_ID) {
        const ticket = await googleClient.verifyIdToken({
          idToken,
          audience: GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        email = payload?.email;
        name = payload?.name;
      } else {
        // Fallback for development decoding if CLIENT_ID not provided
        const decoded = jwt.decode(idToken) as any;
        email = decoded?.email;
        name = decoded?.name;
      }

      if (!email) {
        throw new UnauthorizedError('Unable to extract email from Google token');
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
    } catch (err: any) {
      throw new UnauthorizedError(`Google authentication failed: ${err.message || 'Invalid token'}`);
    }
  }

  private generateTokens(userId: string) {
    const accessToken = jwt.sign({ id: userId }, env.JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ id: userId }, env.JWT_REFRESH_SECRET, { expiresIn: '30d' });
    return { accessToken, refreshToken, userId };
  }
}

export const authService = new AuthService();
