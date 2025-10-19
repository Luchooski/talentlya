import { describe, expect, it } from 'vitest';
import { LoginInputSchema } from './auth.dto';
import { app as buildApp } from '../../app';

describe('auth dto', () => {
  it('rejects invalid email', () => {
    const res = LoginInputSchema.safeParse({ email: 'x', password: '12345678' });
    expect(res.success).toBe(false);
  });
  it('accepts valid login', () => {
    const res = LoginInputSchema.safeParse({ email: 'a@b.com', password: '12345678' });
    expect(res.success).toBe(true);
  });
});

describe('not found middleware', () => {
  it('returns 404 JSON', async () => {
    const app = buildApp;
    const res = await app.inject({ method: 'GET', url: '/api/v1/does-not-exist' });
    expect(res.statusCode).toBe(404);
    const json = res.json();
    expect(json).toHaveProperty('error.code', 'NOT_FOUND');
  });
});
