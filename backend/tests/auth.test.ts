import request from 'supertest';
import { createApp } from '../src/app';
import './setup';

const app = createApp();

const getCookies = (res: request.Response) => {
  const raw = res.headers['set-cookie'];
  return Array.isArray(raw) ? raw.join(';') : String(raw || '');
};

describe('Auth Endpoints & 2FA / Refresh Tokens', () => {
  const testUser = {
    name: 'John Developer',
    email: 'john.developer@example.com',
    password: 'Password123!',
  };

  let accessToken = '';
  let refreshToken = '';
  let verificationToken = '';
  let userId: number;

  it('should register a new user successfully and send verification email', async () => {
    const res = await request(app).post('/api/v1/auth/register').send(testUser);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(testUser.email.toLowerCase());
    expect(res.body.data.user.isEmailVerified).toBe(false);
    expect(res.body.data.verificationToken).toBeDefined();

    verificationToken = res.body.data.verificationToken;
    userId = res.body.data.user.id;
  });

  it('should allow unverified user to log in with isEmailVerified: false', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: testUser.email,
      password: testUser.password,
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.isEmailVerified).toBe(false);
  });

  it('should verify email successfully via verification token', async () => {
    const res = await request(app).post('/api/v1/auth/verify-email').send({
      token: verificationToken,
      uid: userId,
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.alreadyVerified).toBe(false);
  });

  it('should fail registration with duplicate email', async () => {
    const res = await request(app).post('/api/v1/auth/register').send(testUser);

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('EMAIL_EXISTS');
  });

  it('should fail registration with invalid email or short password', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      name: 'J',
      email: 'not-an-email',
      password: '123',
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should login an existing verified user and set HttpOnly cookies', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: testUser.email,
      password: testUser.password,
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();

    const cookies = getCookies(res);
    expect(cookies).toContain('accessToken=');
    expect(cookies).toContain('refreshToken=');

    accessToken = res.body.data.accessToken;
    refreshToken = res.body.data.refreshToken;
  });

  it('should fail login with wrong password', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: testUser.email,
      password: 'WrongPassword!',
    });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('should authenticate user profile via cookie without Bearer header', async () => {
    const res = await request(app)
      .get('/api/v1/auth/profile')
      .set('Cookie', [`accessToken=${accessToken}`]);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe(testUser.email);
  });

  it('should refresh access token using cookie and rotate refresh token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/refresh-token')
      .set('Cookie', [`refreshToken=${refreshToken}`]);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();

    // Verify rotated new refresh token is different
    const newRefreshToken = res.body.data.refreshToken;
    expect(newRefreshToken).not.toBe(refreshToken);

    // Test token reuse detection: old refreshToken should now be rejected as already revoked
    const reuseRes = await request(app)
      .post('/api/v1/auth/refresh-token')
      .send({ refreshToken });

    expect(reuseRes.status).toBe(401);
    expect(reuseRes.body.error.code).toBe('TOKEN_REUSE_DETECTED');

    // Update refreshToken pointer for subsequent tests
    refreshToken = newRefreshToken;
    accessToken = res.body.data.accessToken;
  });

  it('should fetch authenticated user profile with Bearer token', async () => {
    const res = await request(app)
      .get('/api/v1/auth/profile')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe(testUser.email);
  });

  it('should setup 2FA and return QR code data', async () => {
    const res = await request(app)
      .post('/api/v1/2fa/setup')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.secret).toBeDefined();
    expect(res.body.data.qrCode).toBeDefined();
  });

  it('should logout and clear auth cookies', async () => {
    const res = await request(app)
      .post('/api/v1/auth/logout')
      .set('Cookie', [`refreshToken=${refreshToken}`]);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const cookies = getCookies(res);
    expect(cookies).toContain('accessToken=;');
    expect(cookies).toContain('refreshToken=;');
  });
});
