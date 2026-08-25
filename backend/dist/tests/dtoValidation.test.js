"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = require("../src/app");
require("./setup");
const app = (0, app_1.createApp)();
describe('Controller-level DTO Validation Tests', () => {
    let userToken = '';
    beforeAll(async () => {
        const res = await (0, supertest_1.default)(app).post('/api/v1/auth/login').send({
            email: 'alice@example.com',
            password: 'Password123!',
        });
        userToken = res.body.data.accessToken;
    });
    describe('Auth DTO Validation', () => {
        it('should return 400 with detailed error when registration fields are missing or invalid', async () => {
            const res = await (0, supertest_1.default)(app).post('/api/v1/auth/register').send({
                name: 'A', // too short (< 2)
                email: 'not-an-email',
                password: '123', // too short (< 6)
            });
            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.error.code).toBe('VALIDATION_ERROR');
            expect(Array.isArray(res.body.error.details)).toBe(true);
            expect(res.body.error.details.length).toBeGreaterThanOrEqual(3);
        });
        it('should return 400 with detailed error when login email is malformed', async () => {
            const res = await (0, supertest_1.default)(app).post('/api/v1/auth/login').send({
                email: 'invalid-email',
                password: 'somepassword',
            });
            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.error.code).toBe('VALIDATION_ERROR');
            expect(res.body.error.details[0].field).toBe('email');
        });
    });
    describe('Event DTO Validation', () => {
        it('should return 400 when creating event with end_time before start_time', async () => {
            const res = await (0, supertest_1.default)(app)
                .post('/api/v1/events')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                title: 'Valid Title Here',
                description: 'Valid long description for testing purposes',
                location: 'Valid Location',
                event_type: 'public',
                start_time: '2027-01-02T10:00:00Z',
                end_time: '2027-01-01T10:00:00Z', // Before start_time
            });
            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.error.code).toBe('VALIDATION_ERROR');
            expect(res.body.error.details[0].message).toContain('End time must be after start time');
        });
        it('should return 400 when creating event with invalid event_type', async () => {
            const res = await (0, supertest_1.default)(app)
                .post('/api/v1/events')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                title: 'Valid Title Here',
                description: 'Valid long description for testing purposes',
                location: 'Valid Location',
                event_type: 'unknown_type',
                start_time: '2027-01-02T10:00:00Z',
            });
            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.error.code).toBe('VALIDATION_ERROR');
        });
    });
    describe('Tag DTO Validation', () => {
        it('should return 400 when creating a tag with invalid hex color', async () => {
            const res = await (0, supertest_1.default)(app)
                .post('/api/v1/tags')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                name: 'ValidTagName',
                colorHex: 'not-a-hex',
            });
            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.error.code).toBe('VALIDATION_ERROR');
            expect(res.body.error.details[0].field).toBe('colorHex');
            expect(res.body.error.details[0].message).toContain('hex color');
        });
        it('should return 400 when tag ID param is non-numeric', async () => {
            const res = await (0, supertest_1.default)(app).get('/api/v1/tags/not-a-number/usage');
            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.error.code).toBe('VALIDATION_ERROR');
        });
    });
    describe('RSVP & 2FA DTO Validation', () => {
        it('should return 400 when setting RSVP with invalid status', async () => {
            const res = await (0, supertest_1.default)(app)
                .post('/api/v1/rsvps/events/1')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                status: 'definitely_not_a_valid_status',
            });
            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.error.code).toBe('VALIDATION_ERROR');
        });
        it('should return 400 when 2FA token is not 6 digits', async () => {
            const res = await (0, supertest_1.default)(app)
                .post('/api/v1/2fa/enable')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                token: '1234', // too short
            });
            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.error.code).toBe('VALIDATION_ERROR');
        });
    });
});
