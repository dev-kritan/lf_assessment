import request from 'supertest';
import { createApp } from '../src/app';
import './setup';

const app = createApp();

describe('Events Endpoints & Filtering', () => {
  let user1Token = '';
  let user2Token = '';
  let createdEventId: number;

  beforeAll(async () => {
    // Login as Alice (u1)
    const res1 = await request(app).post('/api/v1/auth/login').send({
      email: 'alice@example.com',
      password: 'Password123!',
    });
    user1Token = res1.body.data.accessToken;

    // Login as Bob (u2)
    const res2 = await request(app).post('/api/v1/auth/login').send({
      email: 'bob@example.com',
      password: 'Password123!',
    });
    user2Token = res2.body.data.accessToken;
  });

  it('should list public events without authentication', async () => {
    const res = await request(app).get('/api/v1/events');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta.total).toBeGreaterThan(0);
  });

  it('should filter events by timeframe=upcoming', async () => {
    const res = await request(app).get('/api/v1/events?timeframe=upcoming');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    res.body.data.forEach((evt: any) => {
      expect(evt.isPast).toBe(false);
    });
  });

  it('should filter events by timeframe=past', async () => {
    const res = await request(app).get('/api/v1/events?timeframe=past');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    res.body.data.forEach((evt: any) => {
      expect(evt.isPast).toBe(true);
    });
  });

  it('should search events by keyword in title/location/description', async () => {
    const res = await request(app).get('/api/v1/events?search=Summit');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data[0].title).toContain('Summit');
  });

  it('should filter events by tag name', async () => {
    const res = await request(app).get('/api/v1/events?tag=Workshop');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    res.body.data.forEach((evt: any) => {
      const tagNames = evt.tags.map((t: any) => t.name);
      expect(tagNames).toContain('Workshop');
    });
  });

  it('should create a new event when authenticated', async () => {
    const nextMonth = new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString();
    const res = await request(app)
      .post('/api/v1/events')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        title: 'Cloud Native Kubernetes Conference',
        description: 'Deep dive into Kubernetes architecture, service meshes, and CI/CD pipelines.',
        location: 'Silicon Oasis Tech Park, Auditorium 1',
        event_type: 'public',
        start_time: nextMonth,
        capacity: 150,
        new_tags: ['DevOps', 'Cloud'],
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Cloud Native Kubernetes Conference');
    expect(res.body.data.isCreator).toBe(true);
    createdEventId = res.body.data.id;
  });

  it('should update event if the requester is the creator', async () => {
    const res = await request(app)
      .put(`/api/v1/events/${createdEventId}`)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        title: 'Updated: Cloud Native Kubernetes Conference',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Updated: Cloud Native Kubernetes Conference');
  });

  it('should reject update if the requester is NOT the creator', async () => {
    const res = await request(app)
      .put(`/api/v1/events/${createdEventId}`)
      .set('Authorization', `Bearer ${user2Token}`)
      .send({
        title: 'Hacked Title By Bob',
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('should delete event if the requester is the creator', async () => {
    const res = await request(app)
      .delete(`/api/v1/events/${createdEventId}`)
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
