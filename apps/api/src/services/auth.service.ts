import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authRepository } from '../repositories/auth.repository';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret';

export class AuthService {
  async register(email: string, password_hash: string, name?: string) {
    const existingUser = await authRepository.findUserByEmail(email);
    if (existingUser) {
      throw new Error('Email already in use');
    }
    
    const hashed = await bcrypt.hash(password_hash, 10);
    const user = await authRepository.createUser({
      email,
      password_hash: hashed,
      name
    });
    
    return this.generateTokens(user.id);
  }

  async login(email: string, password_hash: string) {
    const user = await authRepository.findUserByEmail(email);
    if (!user || !user.password_hash) {
      throw new Error('Invalid credentials');
    }

    const isValid = await bcrypt.compare(password_hash, user.password_hash);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    return this.generateTokens(user.id);
  }

  private generateTokens(userId: string) {
    const accessToken = jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ id: userId }, REFRESH_SECRET, { expiresIn: '30d' });
    return { accessToken, refreshToken, userId };
  }
}

export const authService = new AuthService();
