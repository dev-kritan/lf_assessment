import request from 'supertest';
import { createApp } from '../src/app';
import db from '../src/config/knex';
import { DB_TABLES } from '../src/constants';
import { EmailService } from '../src/services/email.service';
import './setup';

const app = createApp();

describe('Email Verification & Nodemailer Integration', () => {
  const newUser = {
    name: 'Verification Tester',
    email: 'verify.tester@example.com',
    password: 'Password123!',
  };

  let rawToken = '';
  let userId: number;

  it('should register user with SHA-256 hashed token and 24h expiration', async () => {
    const res = await request(app).post('/api/v1/auth/register').send(newUser);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.isEmailVerified).toBe(false);
    expect(res.body.data.verificationToken).toBeDefined();

    rawToken = res.body.data.verificationToken;
    userId = res.body.data.user.id;

    // Verify in DB that token is stored as a 64-character SHA-256 hash, NOT the raw token
    const dbUser = await db(DB_TABLES.USERS).where({ id: userId }).first();
    expect(dbUser).toBeDefined();
    expect(dbUser.is_email_verified).toBe(0); // or false
    expect(dbUser.email_verification_token).toBeDefined();
    expect(dbUser.email_verification_token).not.toBe(rawToken); // Stored as hash!
    expect(dbUser.email_verification_token.length).toBe(64); // SHA-256 hex length
    expect(dbUser.verification_token_expires_at).toBeDefined();

    // Verify token expiration is approximately 24 hours from now
    const expiresAt = new Date(dbUser.verification_token_expires_at).getTime();
    const now = Date.now();
    const hoursDiff = (expiresAt - now) / (1000 * 60 * 60);
    expect(hoursDiff).toBeGreaterThan(23);
    expect(hoursDiff).toBeLessThanOrEqual(24.1);

    // Verify Nodemailer EmailService sent verification email
    expect(EmailService.lastSentEmail).toBeDefined();
    expect(EmailService.lastSentEmail.to).toBe(newUser.email.toLowerCase());
    expect(EmailService.lastSentEmail.verificationUrl).toContain(`token=${rawToken}`);
    expect(EmailService.lastSentEmail.verificationUrl).toContain(`uid=${userId}`);
  });

  it('should allow login for unverified user with isEmailVerified: false', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: newUser.email,
      password: newUser.password,
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.user.isEmailVerified).toBe(false);
  });

  it('should reject invalid or tampered verification token', async () => {
    const res = await request(app).post('/api/v1/auth/verify-email').send({
      token: 'tampered-invalid-token-12345',
      uid: userId,
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_VERIFICATION_TOKEN');
  });

  it('should reject expired verification token with VERIFICATION_TOKEN_EXPIRED', async () => {
    // Manually set expiration to past
    await db(DB_TABLES.USERS)
      .where({ id: userId })
      .update({
        verification_token_expires_at: new Date(Date.now() - 3600 * 1000), // 1 hour ago
      });

    const res = await request(app).post('/api/v1/auth/verify-email').send({
      token: rawToken,
      uid: userId,
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VERIFICATION_TOKEN_EXPIRED');
  });

  it('should resend verification email with a new 24h token', async () => {
    const res = await request(app).post('/api/v1/auth/resend-verification').send({
      email: newUser.email,
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.message).toContain('verification link has been sent');

    // Retrieve updated token from DB and EmailService
    const dbUser = await db(DB_TABLES.USERS).where({ id: userId }).first();
    const expiresAt = new Date(dbUser.verification_token_expires_at).getTime();
    expect(expiresAt).toBeGreaterThan(Date.now());

    expect(EmailService.lastSentEmail).toBeDefined();
    expect(EmailService.lastSentEmail.to).toBe(newUser.email.toLowerCase());
    rawToken = EmailService.lastSentEmail.rawToken || EmailService.lastSentEmail.verificationUrl.split('token=')[1].split('&')[0];
  });

  it('should return generic response when resending for non-existent email (no enumeration)', async () => {
    const res = await request(app).post('/api/v1/auth/resend-verification').send({
      email: 'nonexistent-user-999@example.com',
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.message).toContain('verification link has been sent');
  });

  it('should verify email successfully via GET /api/v1/auth/verify-email', async () => {
    const res = await request(app)
      .get(`/api/v1/auth/verify-email?token=${rawToken}&uid=${userId}`)
      .set('Accept', 'application/json');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.alreadyVerified).toBe(false);

    // Verify in DB that is_email_verified is true and token fields are cleared
    const dbUser = await db(DB_TABLES.USERS).where({ id: userId }).first();
    expect(Boolean(dbUser.is_email_verified)).toBe(true);
    expect(dbUser.email_verification_token).toBeNull();
    expect(dbUser.verification_token_expires_at).toBeNull();
  });

  it('should handle already-verified user gracefully when clicking link again (Step 7)', async () => {
    const res = await request(app).post('/api/v1/auth/verify-email').send({
      token: rawToken,
      uid: userId,
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.alreadyVerified).toBe(true);
    expect(res.body.data.message).toContain('already verified');
  });

  it('should allow login once email has been verified', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: newUser.email,
      password: newUser.password,
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.user.isEmailVerified).toBe(true);
  });

  it('should enforce rate limiting on resend verification endpoint when requested with test flag', async () => {
    const testEmail = 'ratelimit.tester@example.com';

    // Make 3 requests (allowed)
    for (let i = 0; i < 3; i++) {
      const res = await request(app)
        .post('/api/v1/auth/resend-verification')
        .set('x-test-rate-limit', 'true')
        .send({ email: testEmail });
      expect(res.status).toBe(200);
    }

    // 4th request should be rate-limited
    const blockedRes = await request(app)
      .post('/api/v1/auth/resend-verification')
      .set('x-test-rate-limit', 'true')
      .send({ email: testEmail });

    expect(blockedRes.status).toBe(429);
    expect(blockedRes.body.success).toBe(false);
    expect(blockedRes.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
  });

  describe('Unverified User Permissions & Access Control', () => {
    let unverifiedToken = '';
    let verifiedToken = '';
    let truePrivateEventId: number;
    let standardPrivateEventId: number;
    let publicEventId: number;

    beforeAll(async () => {
      // Login as Carol (unverified user in seeds)
      const carolRes = await request(app).post('/api/v1/auth/login').send({
        email: 'carol@example.com',
        password: 'Password123!',
      });
      expect(carolRes.status).toBe(200);
      expect(carolRes.body.data.user.isEmailVerified).toBe(false);
      unverifiedToken = carolRes.body.data.accessToken;

      // Login as Alice (verified user in seeds)
      const aliceRes = await request(app).post('/api/v1/auth/login').send({
        email: 'alice@example.com',
        password: 'Password123!',
      });
      expect(aliceRes.status).toBe(200);
      expect(aliceRes.body.data.user.isEmailVerified).toBe(true);
      verifiedToken = aliceRes.body.data.accessToken;

      // Alice creates 1 public, 1 standard private, and 1 true private event
      const pubRes = await request(app)
        .post('/api/v1/events')
        .set('Authorization', `Bearer ${verifiedToken}`)
        .send({
          title: 'Public Community Showcase',
          description: 'Open to everyone in the tech ecosystem.',
          location: 'Main Auditorium',
          event_type: 'public',
          start_time: new Date(Date.now() + 86400000).toISOString(),
        });
      publicEventId = pubRes.body.data.id;

      const stdRes = await request(app)
        .post('/api/v1/events')
        .set('Authorization', `Bearer ${verifiedToken}`)
        .send({
          title: 'Standard Private Guild Meetup',
          description: 'Private meetup for members.',
          location: 'Room B',
          event_type: 'private',
          is_true_private: false,
          start_time: new Date(Date.now() + 86400000).toISOString(),
        });
      standardPrivateEventId = stdRes.body.data.id;

      const truePrivRes = await request(app)
        .post('/api/v1/events')
        .set('Authorization', `Bearer ${verifiedToken}`)
        .send({
          title: 'Executive Board Secret Strategy',
          description: 'True private executive session.',
          location: 'Secret Chamber',
          event_type: 'private',
          is_true_private: true,
          start_time: new Date(Date.now() + 86400000).toISOString(),
        });
      truePrivateEventId = truePrivRes.body.data.id;
    });

    it('unverified user can view public events and standard private events, but NOT true private events in list', async () => {
      const res = await request(app)
        .get('/api/v1/events')
        .set('Authorization', `Bearer ${unverifiedToken}`);

      expect(res.status).toBe(200);
      const eventIds = res.body.data.map((e: any) => e.id);
      expect(eventIds).toContain(publicEventId);
      expect(eventIds).toContain(standardPrivateEventId);
      expect(eventIds).not.toContain(truePrivateEventId);
    });

    it('verified user CAN see true private events in event list', async () => {
      const res = await request(app)
        .get('/api/v1/events')
        .set('Authorization', `Bearer ${verifiedToken}`);

      expect(res.status).toBe(200);
      const eventIds = res.body.data.map((e: any) => e.id);
      expect(eventIds).toContain(publicEventId);
      expect(eventIds).toContain(standardPrivateEventId);
      expect(eventIds).toContain(truePrivateEventId);
    });

    it('unverified user receives 403 PRIVATE_EVENT_FORBIDDEN when accessing true private event by ID', async () => {
      const res = await request(app)
        .get(`/api/v1/events/${truePrivateEventId}`)
        .set('Authorization', `Bearer ${unverifiedToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('PRIVATE_EVENT_FORBIDDEN');
    });

    it('unverified user receives masked/protected fields on standard private events, while public events remain fully visible', async () => {
      const pubRes = await request(app)
        .get(`/api/v1/events/${publicEventId}`)
        .set('Authorization', `Bearer ${unverifiedToken}`);
      expect(pubRes.status).toBe(200);
      expect(pubRes.body.data.location).toBe('Main Auditorium');

      const stdRes = await request(app)
        .get(`/api/v1/events/${standardPrivateEventId}`)
        .set('Authorization', `Bearer ${unverifiedToken}`);
      expect(stdRes.status).toBe(200);
      expect(stdRes.body.data.location).toContain('Protected');
      expect(stdRes.body.data.description).toContain('Protected');
      expect(stdRes.body.data.creator.name).toBe('Private Organizer');
      expect(stdRes.body.data.attendees).toEqual([]);

      const verifiedRes = await request(app)
        .get(`/api/v1/events/${standardPrivateEventId}`)
        .set('Authorization', `Bearer ${verifiedToken}`);
      expect(verifiedRes.status).toBe(200);
      expect(verifiedRes.body.data.location).toBe('Room B');
      expect(verifiedRes.body.data.description).toBe('Private meetup for members.');
      expect(verifiedRes.body.data.creator.name).not.toBe('Private Organizer');
    });

    it('unverified user is blocked from creating events with 403 EMAIL_NOT_VERIFIED', async () => {
      const res = await request(app)
        .post('/api/v1/events')
        .set('Authorization', `Bearer ${unverifiedToken}`)
        .send({
          title: 'Unverified Hackathon',
          description: 'Should be rejected',
          location: 'Hall X',
          event_type: 'public',
          start_time: new Date(Date.now() + 86400000).toISOString(),
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('EMAIL_NOT_VERIFIED');
    });

    it('unverified user is blocked from responding to RSVPs with 403 EMAIL_NOT_VERIFIED', async () => {
      const res = await request(app)
        .post(`/api/v1/events/${publicEventId}/rsvps`)
        .set('Authorization', `Bearer ${unverifiedToken}`)
        .send({ status: 'yes' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('EMAIL_NOT_VERIFIED');
    });

    it('unverified user can request verification email from authenticated profile endpoint', async () => {
      const res = await request(app)
        .post('/api/v1/auth/request-verification')
        .set('Authorization', `Bearer ${unverifiedToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.verificationUrl).toBeDefined();
      expect(res.body.data.verificationToken).toBeDefined();
      expect(EmailService.lastSentEmail.to).toBe('carol@example.com');
    });
  });
});
