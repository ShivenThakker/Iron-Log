import { describe, it, expect } from 'vitest';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { env } from '../src/lib/env';

describe('Auth Security & JWT Standards', () => {
  it('signs and verifies access token with HS256 algorithm', () => {
    const userId = 'usr-test-123';
    const token = jwt.sign({ id: userId }, env.JWT_SECRET, {
      algorithm: 'HS256',
      expiresIn: '15m',
    });

    const decoded = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] }) as { id: string };
    expect(decoded.id).toBe(userId);
  });

  it('rejects tokens signed with an unauthorized algorithm', () => {
    const userId = 'usr-test-123';
    // Generate a token without algorithm specification or forged
    const token = jwt.sign({ id: userId }, env.JWT_SECRET, {
      algorithm: 'HS384',
    });

    expect(() => {
      jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] });
    }).toThrow();
  });

  it('hashes passwords and verifies match with bcrypt', async () => {
    const rawPassword = 'ObsidianSecurePassword123!';
    const hash = await bcrypt.hash(rawPassword, 10);

    expect(hash).not.toBe(rawPassword);
    const isMatch = await bcrypt.compare(rawPassword, hash);
    expect(isMatch).toBe(true);

    const isWrong = await bcrypt.compare('WrongPassword456', hash);
    expect(isWrong).toBe(false);
  });

  it('enforces separate secrets for access and refresh tokens', () => {
    expect(env.JWT_SECRET).toBeDefined();
    expect(env.JWT_REFRESH_SECRET).toBeDefined();
    expect(env.JWT_SECRET).not.toBe(env.JWT_REFRESH_SECRET);
  });

  it('validates changePassword payload correctly', async () => {
    const { changePasswordSchema } = await import('../src/validators/auth.validator');
    
    // Valid case
    const valid = changePasswordSchema.safeParse({
      current_password: 'OldPassword123!',
      new_password: 'NewStrongPassword456!',
    });
    expect(valid.success).toBe(true);

    // Short new password
    const shortPass = changePasswordSchema.safeParse({
      current_password: 'OldPassword123!',
      new_password: 'short',
    });
    expect(shortPass.success).toBe(false);

    // Missing current password
    const missingCurrent = changePasswordSchema.safeParse({
      current_password: '',
      new_password: 'NewStrongPassword456!',
    });
    expect(missingCurrent.success).toBe(false);
  });
});
