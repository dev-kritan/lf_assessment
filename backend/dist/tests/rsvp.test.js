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
            email: 'carol@example.com',
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
});
