"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = require("../src/app");
require("./setup");
const app = (0, app_1.createApp)();
describe('RSVP System', () => {
    let userToken = '';
    let eventId = 1;
    beforeAll(async () => {
        const res = await (0, supertest_1.default)(app).post('/api/v1/auth/login').send({
            email: 'bob@example.com',
            password: 'Password123!',
        });
        userToken = res.body.data.accessToken;
    });
    it('should set RSVP status to yes', async () => {
        const res = await (0, supertest_1.default)(app)
            .post(`/api/v1/rsvps/events/${eventId}`)
            .set('Authorization', `Bearer ${userToken}`)
            .send({ status: 'yes' });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.status).toBe('yes');
        expect(res.body.data.rsvpStats.yes).toBeGreaterThan(0);
    });
    it('should update RSVP status to maybe', async () => {
        const res = await (0, supertest_1.default)(app)
            .post(`/api/v1/rsvps/events/${eventId}`)
            .set('Authorization', `Bearer ${userToken}`)
            .send({ status: 'maybe' });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.status).toBe('maybe');
    });
    it('should fetch list of attendees for an event', async () => {
        const res = await (0, supertest_1.default)(app).get(`/api/v1/rsvps/events/${eventId}/attendees`);
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
    });
    it('should fetch user RSVPs list', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/api/v1/rsvps/my-rsvps')
            .set('Authorization', `Bearer ${userToken}`);
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
    });
    it('should bulk delete/remove RSVPs for current user', async () => {
        // Set RSVP for event 2 as well
        await (0, supertest_1.default)(app)
            .post('/api/v1/rsvps/events/2')
            .set('Authorization', `Bearer ${userToken}`)
            .send({ status: 'yes' });
        // Bulk delete RSVPs for events 1 and 2
        const res = await (0, supertest_1.default)(app)
            .post('/api/v1/rsvps/bulk-delete')
            .set('Authorization', `Bearer ${userToken}`)
            .send({ event_ids: [1, 2] });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.removedCount).toBeGreaterThanOrEqual(1);
        // Verify user RSVPs list no longer contains event 1 or 2
        const rsvpListRes = await (0, supertest_1.default)(app)
            .get('/api/v1/rsvps/my-rsvps')
            .set('Authorization', `Bearer ${userToken}`);
        const remainingIds = rsvpListRes.body.data.map((r) => r.id);
        expect(remainingIds).not.toContain(1);
        expect(remainingIds).not.toContain(2);
    });
    it('should delete a single RSVP via DELETE endpoint', async () => {
        // Set RSVP
        await (0, supertest_1.default)(app)
            .post('/api/v1/rsvps/events/3')
            .set('Authorization', `Bearer ${userToken}`)
            .send({ status: 'yes' });
        // Delete RSVP
        const deleteRes = await (0, supertest_1.default)(app)
            .delete('/api/v1/rsvps/events/3')
            .set('Authorization', `Bearer ${userToken}`);
        expect(deleteRes.status).toBe(200);
        expect(deleteRes.body.success).toBe(true);
    });
});
