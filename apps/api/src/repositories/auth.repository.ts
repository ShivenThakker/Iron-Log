import { PrismaClient, User, Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';

// singleton imported

export class AuthRepository {
  async findUserByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  }

  async createUser(data: Prisma.UserCreateInput): Promise<User> {
    return prisma.user.create({ data });
  }

  async findUserById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  }

  async updatePassword(id: string, password_hash: string): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: { password_hash },
    });
  }
}

export const authRepository = new AuthRepository();
