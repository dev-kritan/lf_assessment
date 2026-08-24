"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = require("../src/app");
const knex_1 = __importDefault(require("../src/config/knex"));
require("./setup");
const app = (0, app_1.createApp)();
describe('Tags Endpoints (Usage, Update, Delete & Cascade)', () => {
    let authToken = '';
    let testTagId;
    let testEventId;
    beforeAll(async () => {
        // Login as Alice
        const res = await (0, supertest_1.default)(app).post('/api/v1/auth/login').send({
            email: 'alice@example.com',
            password: 'Password123!',
        });
        authToken = res.body.data.accessToken;
        // Create a dedicated tag for testing
        const tagRes = await (0, supertest_1.default)(app)
            .post('/api/v1/tags')
            .set('Authorization', `Bearer ${authToken}`)
            .send({ name: 'AutomatedTestTag', colorHex: '#10b981' });
        testTagId = tagRes.body.data.id;
        // Create a test event linked with this tag
        const eventRes = await (0, supertest_1.default)(app)
            .post('/api/v1/events')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
            title: 'Tag Test Conference',
            description: 'Testing tag associations and cascade functionality',
            location: 'San Francisco, CA',
            event_type: 'public',
            start_time: new Date(Date.now() + 86400000).toISOString(),
            tag_ids: [testTagId],
        });
        testEventId = eventRes.body.data.id;
    });
    afterAll(async () => {
        if (testEventId) {
            await (0, knex_1.default)('events').where({ id: testEventId }).delete();
        }
        if (testTagId) {
            await (0, knex_1.default)('tags').where({ id: testTagId }).delete();
        }
    });
    it('GET /api/v1/tags/:id/usage should return associated events and event count', async () => {
        const res = await (0, supertest_1.default)(app).get(`/api/v1/tags/${testTagId}/usage`);
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.tag.id).toBe(testTagId);
        expect(res.body.data.tag.name).toBe('AutomatedTestTag');
        expect(res.body.data.eventCount).toBeGreaterThanOrEqual(1);
        expect(Array.isArray(res.body.data.associatedEvents)).toBe(true);
        expect(res.body.data.associatedEvents.some((e) => e.id === testEventId)).toBe(true);
    });
    it('PUT /api/v1/tags/:id should reject unauthenticated request', async () => {
        const res = await (0, supertest_1.default)(app).put(`/api/v1/tags/${testTagId}`).send({
            name: 'UpdatedTagName',
        });
        expect(res.status).toBe(401);
    });
    it('PUT /api/v1/tags/:id should update tag name and color', async () => {
        const res = await (0, supertest_1.default)(app)
            .put(`/api/v1/tags/${testTagId}`)
            .set('Authorization', `Bearer ${authToken}`)
            .send({
            name: 'RenamedTestTag',
            colorHex: '#3b82f6',
        });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.name).toBe('RenamedTestTag');
        expect(res.body.data.colorHex).toBe('#3b82f6');
        // Verify in database
        const inDb = await (0, knex_1.default)('tags').where({ id: testTagId }).first();
        expect(inDb.name).toBe('RenamedTestTag');
        expect(inDb.color_hex).toBe('#3b82f6');
    });
    it('PUT /api/v1/tags/:id should reject duplicate tag name', async () => {
        // Create another tag
        const tag2 = await (0, supertest_1.default)(app)
            .post('/api/v1/tags')
            .set('Authorization', `Bearer ${authToken}`)
            .send({ name: 'AnotherUniqueTag', colorHex: '#e11d48' });
        const tag2Id = tag2.body.data.id;
        // Try to update testTagId to AnotherUniqueTag
        const res = await (0, supertest_1.default)(app)
            .put(`/api/v1/tags/${testTagId}`)
            .set('Authorization', `Bearer ${authToken}`)
            .send({ name: 'anotheruniquetag' });
        expect(res.status).toBe(409);
        // Clean up tag2
        await (0, knex_1.default)('tags').where({ id: tag2Id }).delete();
    });
    it('DELETE /api/v1/tags/:id should reject unauthenticated request', async () => {
        const res = await (0, supertest_1.default)(app).delete(`/api/v1/tags/${testTagId}`);
        expect(res.status).toBe(401);
    });
    it('DELETE /api/v1/tags/:id should delete tag and cascade delete from event_tags', async () => {
        // Verify association exists in event_tags
        const beforeEventTag = await (0, knex_1.default)('event_tags')
            .where({ event_id: testEventId, tag_id: testTagId })
            .first();
        expect(beforeEventTag).toBeDefined();
        const res = await (0, supertest_1.default)(app)
            .delete(`/api/v1/tags/${testTagId}`)
            .set('Authorization', `Bearer ${authToken}`);
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.deletedTag.id).toBe(testTagId);
        expect(res.body.data.affectedEventsCount).toBeGreaterThanOrEqual(1);
        // Verify tag is deleted from tags table
        const inDb = await (0, knex_1.default)('tags').where({ id: testTagId }).first();
        expect(inDb).toBeUndefined();
        // Verify cascaded from event_tags
        const afterEventTag = await (0, knex_1.default)('event_tags')
            .where({ tag_id: testTagId })
            .first();
        expect(afterEventTag).toBeUndefined();
        // Verify event still exists
        const eventStillExists = await (0, knex_1.default)('events').where({ id: testEventId }).first();
        expect(eventStillExists).toBeDefined();
    });
    it('GET /api/v1/tags/:id/usage on deleted tag should return 404', async () => {
        const res = await (0, supertest_1.default)(app).get(`/api/v1/tags/${testTagId}/usage`);
        expect(res.status).toBe(404);
    });
});
