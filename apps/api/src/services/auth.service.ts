import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';

export class AuthService {
  static async register(email: string, passwordString: string, fullName?: string) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new Error('Email already in use');

    const passwordHash = await bcrypt.hash(passwordString, 10);

    const user = await prisma.user.create({
      data: { email, passwordHash, fullName },
    });
    
    return this.generateTokens(user.id, user.email);
  }

  static async login(email: string, passwordString: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || (!user.passwordHash)) throw new Error('Invalid credentials');

    const isValid = await bcrypt.compare(passwordString, user.passwordHash);
    if (!isValid) throw new Error('Invalid credentials');

    return this.generateTokens(user.id, user.email);
  }

  static async refresh(token: string) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'supersecret') as { id: string, email: string };
      const user = await prisma.user.findUnique({ where: { id: decoded.id } });
      if (!user) throw new Error('User not found');
      return this.generateTokens(user.id, user.email);
    } catch (e) {
      throw new Error('Invalid refresh token');
    }
  }

  private static generateTokens(id: string, email: string) {
    const access = jwt.sign({ id, email }, process.env.JWT_SECRET || 'supersecret', { expiresIn: '15m' });
    const refresh = jwt.sign({ id, email }, process.env.JWT_REFRESH_SECRET || 'supersecret', { expiresIn: '30d' });
    return { accessToken: access, refreshToken: refresh, user: { id, email } };
  }
}
