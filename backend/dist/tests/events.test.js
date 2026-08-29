"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = require("../src/app");
require("./setup");
const app = (0, app_1.createApp)();
describe('Events Endpoints & Filtering', () => {
    let user1Token = '';
    let user2Token = '';
    let createdEventId;
    beforeAll(async () => {
        // Login as Alice (u1)
        const res1 = await (0, supertest_1.default)(app).post('/api/v1/auth/login').send({
            email: 'alice@example.com',
            password: 'Password123!',
        });
        user1Token = res1.body.data.accessToken;
        // Login as Bob (u2)
        const res2 = await (0, supertest_1.default)(app).post('/api/v1/auth/login').send({
            email: 'bob@example.com',
            password: 'Password123!',
        });
        user2Token = res2.body.data.accessToken;
    });
    it('should list public events without authentication', async () => {
        const res = await (0, supertest_1.default)(app).get('/api/v1/events');
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.meta.total).toBeGreaterThan(0);
    });
    it('should filter events by timeframe=upcoming', async () => {
        const res = await (0, supertest_1.default)(app).get('/api/v1/events?timeframe=upcoming');
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        res.body.data.forEach((evt) => {
            expect(evt.isPast).toBe(false);
        });
    });
    it('should filter events by timeframe=past', async () => {
        const res = await (0, supertest_1.default)(app).get('/api/v1/events?timeframe=past');
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        res.body.data.forEach((evt) => {
            expect(evt.isPast).toBe(true);
        });
    });
    it('should search events by keyword in title/location/description', async () => {
        const res = await (0, supertest_1.default)(app).get('/api/v1/events?search=Summit');
        expect(res.status).toBe(200);
        expect(res.body.data.length).toBeGreaterThanOrEqual(1);
        expect(res.body.data[0].title).toContain('Summit');
    });
    it('should filter events by tag name', async () => {
        const res = await (0, supertest_1.default)(app).get('/api/v1/events?tag=Workshop');
        expect(res.status).toBe(200);
        expect(res.body.data.length).toBeGreaterThan(0);
        res.body.data.forEach((evt) => {
            const tagNames = evt.tags.map((t) => t.name);
            expect(tagNames).toContain('Workshop');
        });
    });
    it('should create a new event when authenticated', async () => {
        const nextMonth = new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString();
        const res = await (0, supertest_1.default)(app)
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
        const res = await (0, supertest_1.default)(app)
            .put(`/api/v1/events/${createdEventId}`)
            .set('Authorization', `Bearer ${user1Token}`)
            .send({
            title: 'Updated: Cloud Native Kubernetes Conference',
            event_type: 'private',
            is_true_private: true,
        });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.title).toBe('Updated: Cloud Native Kubernetes Conference');
        expect(res.body.data.eventType).toBe('private');
        expect(res.body.data.isTruePrivate).toBe(true);
    });
    it('should reject update if the requester is NOT the creator', async () => {
        const res = await (0, supertest_1.default)(app)
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
        const res = await (0, supertest_1.default)(app)
            .delete(`/api/v1/events/${createdEventId}`)
            .set('Authorization', `Bearer ${user1Token}`);
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });
    it('should create custom tags and assign non-repeating randomized hex colors', async () => {
        const res1 = await (0, supertest_1.default)(app)
            .post('/api/v1/tags')
            .set('Authorization', `Bearer ${user1Token}`)
            .send({ name: 'TagAlpha' });
        const res2 = await (0, supertest_1.default)(app)
            .post('/api/v1/tags')
            .set('Authorization', `Bearer ${user1Token}`)
            .send({ name: 'TagBeta' });
        expect(res1.status).toBe(201);
        expect(res2.status).toBe(201);
        expect(res1.body.data.colorHex).toMatch(/^#[0-9a-fA-F]{6}$/);
        expect(res2.body.data.colorHex).toMatch(/^#[0-9a-fA-F]{6}$/);
        expect(res1.body.data.colorHex.toLowerCase()).not.toBe(res2.body.data.colorHex.toLowerCase());
    });
    it('should dynamically filter tag event counts based on event_type (public vs private)', async () => {
        // Create custom tag 'GoalTag'
        const tagRes = await (0, supertest_1.default)(app)
            .post('/api/v1/tags')
            .set('Authorization', `Bearer ${user1Token}`)
            .send({ name: 'GoalTag' });
        const goalTagId = tagRes.body.data.id;
        // Create 1 public event with GoalTag
        await (0, supertest_1.default)(app)
            .post('/api/v1/events')
            .set('Authorization', `Bearer ${user1Token}`)
            .send({
            title: 'Public Goal Event',
            description: 'Goal event that is public',
            location: 'Hall A',
            start_time: new Date(Date.now() + 86400000).toISOString(),
            event_type: 'public',
            tag_ids: [goalTagId],
        });
        // Create 1 private event with GoalTag
        await (0, supertest_1.default)(app)
            .post('/api/v1/events')
            .set('Authorization', `Bearer ${user1Token}`)
            .send({
            title: 'Private Goal Event',
            description: 'Goal event that is private',
            location: 'Room B',
            start_time: new Date(Date.now() + 86400000).toISOString(),
            event_type: 'private',
            tag_ids: [goalTagId],
        });
        // Query all tags with event_type=public
        const publicTagsRes = await (0, supertest_1.default)(app)
            .get('/api/v1/tags?event_type=public');
        expect(publicTagsRes.status).toBe(200);
        const publicGoalTag = publicTagsRes.body.data.find((t) => t.id === goalTagId);
        expect(publicGoalTag).toBeDefined();
        expect(publicGoalTag.eventCount).toBe(1);
        // Query all tags with event_type=private (as user1)
        const privateTagsRes = await (0, supertest_1.default)(app)
            .get('/api/v1/tags?event_type=private')
            .set('Authorization', `Bearer ${user1Token}`);
        expect(privateTagsRes.status).toBe(200);
        const privateGoalTag = privateTagsRes.body.data.find((t) => t.id === goalTagId);
        expect(privateGoalTag).toBeDefined();
        expect(privateGoalTag.eventCount).toBe(1);
        // Query all tags without filter (as user1 who can see both)
        const allTagsRes = await (0, supertest_1.default)(app)
            .get('/api/v1/tags')
            .set('Authorization', `Bearer ${user1Token}`);
        expect(allTagsRes.status).toBe(200);
        const allGoalTag = allTagsRes.body.data.find((t) => t.id === goalTagId);
        expect(allGoalTag).toBeDefined();
        expect(allGoalTag.eventCount).toBe(2);
    });
    it('should bulk delete created events for the authenticated creator', async () => {
        // Create 2 events
        const res1 = await (0, supertest_1.default)(app)
            .post('/api/v1/events')
            .set('Authorization', `Bearer ${user1Token}`)
            .send({
            title: 'Bulk Test Event 1',
            description: 'Testing bulk deletion',
            location: 'Hall A',
            event_type: 'public',
            start_time: new Date(Date.now() + 86400000).toISOString(),
        });
        const res2 = await (0, supertest_1.default)(app)
            .post('/api/v1/events')
            .set('Authorization', `Bearer ${user1Token}`)
            .send({
            title: 'Bulk Test Event 2',
            description: 'Testing bulk deletion',
            location: 'Hall B',
            event_type: 'public',
            start_time: new Date(Date.now() + 172800000).toISOString(),
        });
        const id1 = res1.body.data.id;
        const id2 = res2.body.data.id;
        // Reject bulk delete when another user tries to delete them
        const forbiddenRes = await (0, supertest_1.default)(app)
            .post('/api/v1/events/bulk-delete')
            .set('Authorization', `Bearer ${user2Token}`)
            .send({ event_ids: [id1, id2] });
        expect(forbiddenRes.status).toBe(403);
        // Creator successfully bulk deletes
        const deleteRes = await (0, supertest_1.default)(app)
            .post('/api/v1/events/bulk-delete')
            .set('Authorization', `Bearer ${user1Token}`)
            .send({ event_ids: [id1, id2] });
        expect(deleteRes.status).toBe(200);
        expect(deleteRes.body.success).toBe(true);
        expect(deleteRes.body.data.deletedCount).toBe(2);
        // Verify events no longer exist
        const check1 = await (0, supertest_1.default)(app).get(`/api/v1/events/${id1}`);
        expect(check1.status).toBe(404);
    });
});
