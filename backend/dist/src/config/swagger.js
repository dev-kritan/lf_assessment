"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.swaggerSpec = void 0;
exports.setupSwagger = setupSwagger;
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
exports.swaggerSpec = {
    openapi: '3.0.0',
    info: {
        title: 'Event Planning Application API',
        version: '1.0.0',
        description: 'RESTful API for the Event Planning Application with Knex.js, MySQL, JWT + 2FA Authentication, RSVP Tracking, and Bonus Section SQL Analytics.',
        contact: {
            name: 'API Support',
        },
    },
    servers: [
        {
            url: 'http://localhost:5000/api/v1',
            description: 'Development Server',
        },
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
            },
        },
        schemas: {
            User: {
                type: 'object',
                properties: {
                    id: { type: 'integer' },
                    name: { type: 'string' },
                    email: { type: 'string', format: 'email' },
                    isEmailVerified: { type: 'boolean' },
                    twoFactorEnabled: { type: 'boolean' },
                    avatarUrl: { type: 'string' },
                },
            },
            Event: {
                type: 'object',
                properties: {
                    id: { type: 'integer' },
                    title: { type: 'string' },
                    description: { type: 'string' },
                    location: { type: 'string' },
                    eventType: { type: 'string', enum: ['public', 'private'] },
                    startTime: { type: 'string', format: 'date-time' },
                    endTime: { type: 'string', format: 'date-time', nullable: true },
                    capacity: { type: 'integer', nullable: true },
                    bannerUrl: { type: 'string', nullable: true },
                    tags: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                id: { type: 'integer' },
                                name: { type: 'string' },
                                colorHex: { type: 'string' },
                            },
                        },
                    },
                    rsvpStats: {
                        type: 'object',
                        properties: {
                            yes: { type: 'integer' },
                            maybe: { type: 'integer' },
                            no: { type: 'integer' },
                            total: { type: 'integer' },
                        },
                    },
                    creator: {
                        $ref: '#/components/schemas/User',
                    },
                },
            },
            ErrorResponse: {
                type: 'object',
                properties: {
                    success: { type: 'boolean', example: false },
                    error: {
                        type: 'object',
                        properties: {
                            message: { type: 'string' },
                            code: { type: 'string' },
                            details: { type: 'any' },
                        },
                    },
                },
            },
        },
    },
    paths: {
        '/auth/register': {
            post: {
                tags: ['Authentication'],
                summary: 'Register a new user',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['name', 'email', 'password'],
                                properties: {
                                    name: { type: 'string', example: 'Alice Johnson' },
                                    email: { type: 'string', example: 'alice@example.com' },
                                    password: { type: 'string', example: 'Password123!' },
                                },
                            },
                        },
                    },
                },
                responses: {
                    201: { description: 'Registration successful' },
                    400: { description: 'Validation failed' },
                    409: { description: 'Email already exists' },
                },
            },
        },
        '/auth/login': {
            post: {
                tags: ['Authentication'],
                summary: 'Login and receive JWT tokens',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['email', 'password'],
                                properties: {
                                    email: { type: 'string', example: 'alice@example.com' },
                                    password: { type: 'string', example: 'Password123!' },
                                    twoFactorCode: { type: 'string', example: '123456' },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: { description: 'Login successful (or 2FA required prompt)' },
                    401: { description: 'Invalid credentials' },
                },
            },
        },
        '/events': {
            get: {
                tags: ['Events'],
                summary: 'List events with search, tag, timeframe, sorting and pagination',
                parameters: [
                    { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
                    { name: 'limit', in: 'query', schema: { type: 'integer', default: 9 } },
                    { name: 'search', in: 'query', schema: { type: 'string' } },
                    { name: 'tag', in: 'query', schema: { type: 'string' } },
                    { name: 'event_type', in: 'query', schema: { type: 'string', enum: ['all', 'public', 'private'] } },
                    { name: 'timeframe', in: 'query', schema: { type: 'string', enum: ['all', 'upcoming', 'past'] } },
                    { name: 'sort_by', in: 'query', schema: { type: 'string', enum: ['date', 'popularity', 'created_at'] } },
                    { name: 'sort_order', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'] } },
                ],
                responses: {
                    200: { description: 'Paginated list of events' },
                },
            },
            post: {
                tags: ['Events'],
                summary: 'Create a new event',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['title', 'description', 'location', 'event_type', 'start_time'],
                                properties: {
                                    title: { type: 'string', example: 'Tech Innovation Summit' },
                                    description: { type: 'string', example: 'Detailed description of the upcoming conference.' },
                                    location: { type: 'string', example: 'Auditorium A' },
                                    event_type: { type: 'string', enum: ['public', 'private'] },
                                    start_time: { type: 'string', format: 'date-time' },
                                    end_time: { type: 'string', format: 'date-time' },
                                    capacity: { type: 'integer', example: 100 },
                                    banner_url: { type: 'string' },
                                    tag_ids: { type: 'array', items: { type: 'integer' } },
                                    new_tags: { type: 'array', items: { type: 'string' } },
                                },
                            },
                        },
                    },
                },
                responses: {
                    201: { description: 'Event created' },
                    401: { description: 'Unauthorized' },
                },
            },
        },
        '/events/{id}': {
            get: {
                tags: ['Events'],
                summary: 'Get details of a single event',
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                responses: {
                    200: { description: 'Event details' },
                    404: { description: 'Event not found' },
                },
            },
            put: {
                tags: ['Events'],
                summary: 'Update event (Creator only)',
                security: [{ bearerAuth: [] }],
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                responses: {
                    200: { description: 'Event updated' },
                    403: { description: 'Forbidden (Not creator)' },
                },
            },
            delete: {
                tags: ['Events'],
                summary: 'Delete event (Creator only)',
                security: [{ bearerAuth: [] }],
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                responses: {
                    200: { description: 'Event deleted' },
                    403: { description: 'Forbidden (Not creator)' },
                },
            },
        },
        '/events/bulk-delete': {
            post: {
                tags: ['Events'],
                summary: 'Bulk delete events (Creator only)',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['event_ids'],
                                properties: {
                                    event_ids: {
                                        type: 'array',
                                        items: { type: 'integer' },
                                    },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: { description: 'Events deleted successfully' },
                    403: { description: 'Forbidden: You can only delete events that you created' },
                },
            },
        },
        '/rsvps/bulk-delete': {
            post: {
                tags: ['RSVP'],
                summary: 'Bulk remove RSVPs for current user',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['event_ids'],
                                properties: {
                                    event_ids: {
                                        type: 'array',
                                        items: { type: 'integer' },
                                    },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: { description: 'RSVPs removed successfully' },
                },
            },
        },
        '/rsvps/events/{id}': {
            post: {
                tags: ['RSVP'],
                summary: 'Set RSVP response (yes, no, maybe)',
                security: [{ bearerAuth: [] }],
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['status'],
                                properties: {
                                    status: { type: 'string', enum: ['yes', 'no', 'maybe'] },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: { description: 'RSVP updated' },
                    400: { description: 'Capacity reached' },
                },
            },
            delete: {
                tags: ['RSVP'],
                summary: 'Delete/remove RSVP for event',
                security: [{ bearerAuth: [] }],
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                responses: {
                    200: { description: 'RSVP removed' },
                },
            },
        },
        '/bonus/q1': {
            get: {
                tags: ['Bonus Section'],
                summary: 'Execute Q1: Current Designation of Every Employee',
                responses: {
                    200: { description: 'Executed SQL result' },
                },
            },
        },
        '/bonus/q2': {
            get: {
                tags: ['Bonus Section'],
                summary: 'Execute Q2: Designation Timeline (LAG & LEAD)',
                responses: {
                    200: { description: 'Executed SQL result' },
                },
            },
        },
        '/bonus/q4': {
            get: {
                tags: ['Bonus Section'],
                summary: 'Execute Q4: Active Designation at Allocation Start',
                responses: {
                    200: { description: 'Executed SQL result' },
                },
            },
        },
    },
};
function setupSwagger(app) {
    app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(exports.swaggerSpec));
}
