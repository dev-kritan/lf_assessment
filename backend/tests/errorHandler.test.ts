import request from 'supertest';
import { createApp } from '../src/app';
import './setup';
import knex from '../src/config/knex';

const app = createApp();

describe('Graceful Error Handling & RESTful Endpoints', () => {
  let authToken: string;
  let testEventId: number;

  beforeAll(async () => {
    // Seed and create a test user
    const email = `rest_test_${Date.now()}@example.com`;
    const regRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'REST Tester',
        email,
        password: 'Password123!',
      });

    await request(app)
      .post('/api/v1/auth/verify-email')
      .send({
        token: regRes.body.data.verificationToken,
        uid: regRes.body.data.user.id,
      });

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email,
        password: 'Password123!',
      });

    authToken = loginRes.body.data.accessToken;

    // Create an event for nested route testing
    const eventRes = await request(app)
      .post('/api/v1/events')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'REST Convention Test Event',
        description: 'Testing nested resource routes and error handling',
        location: 'Test Center',
        eventType: 'public',
        startTime: new Date(Date.now() + 86400000).toISOString(),
      });

    testEventId = eventRes.body.data.id;
  });

  afterAll(async () => {
    await knex.destroy();
  });

  describe('Global 404 & Malformed Request Handling', () => {
    it('returns 404 with structured error JSON for undefined endpoints', async () => {
      const res = await request(app).get('/api/v1/non-existent-endpoint');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toHaveProperty('message');
      expect(res.body.error.code).toBe('ROUTE_NOT_FOUND');
    });

    it('returns 400 with structured error when sending malformed JSON payload', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .set('Content-Type', 'application/json')
        .send('{"email": "broken_json');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('JSON');
    });
  });

  describe('RESTful Nested Subresources', () => {
    it('allows setting RSVP via canonical nested POST /api/v1/events/:id/rsvps', async () => {
      const res = await request(app)
        .post(`/api/v1/events/${testEventId}/rsvps`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'yes' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('yes');
    });

    it('fetches attendees via canonical nested GET /api/v1/events/:id/attendees', async () => {
      const res = await request(app).get(`/api/v1/events/${testEventId}/attendees`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('fetches current user RSVPs via canonical GET /api/v1/rsvps/me', async () => {
      const res = await request(app)
        .get('/api/v1/rsvps/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('supports nested 2FA routes under /api/v1/auth/2fa/setup', async () => {
      const res = await request(app)
        .post('/api/v1/auth/2fa/setup')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('qrCode');
    });
  });
});
