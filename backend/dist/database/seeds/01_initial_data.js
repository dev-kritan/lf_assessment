"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seed = seed;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
async function seed(knex) {
    // Clear existing entries in reverse dependency order
    await knex('emp_allocation_log').del();
    await knex('emp_designation_log').del();
    await knex('refresh_tokens').del();
    await knex('rsvps').del();
    await knex('event_tags').del();
    await knex('events').del();
    await knex('tags').del();
    await knex('users').del();
    const passwordHash = await bcryptjs_1.default.hash('Password123!', 10);
    // 1. Insert Users
    const [user1Id] = await knex('users').insert([
        {
            name: 'Alice Johnson',
            email: 'alice@example.com',
            password_hash: passwordHash,
            is_email_verified: true,
            avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
        },
    ]);
    const [user2Id] = await knex('users').insert([
        {
            name: 'Bob Martinez',
            email: 'bob@example.com',
            password_hash: passwordHash,
            is_email_verified: true,
            avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        },
    ]);
    const [user3Id] = await knex('users').insert([
        {
            name: 'Carol Smith',
            email: 'carol@example.com',
            password_hash: passwordHash,
            is_email_verified: false,
            avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
        },
    ]);
    // Normalize IDs in case client returns an array of objects or numbers
    const u1 = typeof user1Id === 'object' ? user1Id.id || 1 : (user1Id || 1);
    const u2 = typeof user2Id === 'object' ? user2Id.id || 2 : (user2Id || 2);
    const u3 = typeof user3Id === 'object' ? user3Id.id || 3 : (user3Id || 3);
    // 2. Insert Tags
    await knex('tags').insert([
        { name: 'Birthday', color_hex: '#ec4899' },
        { name: 'Conference', color_hex: '#3b82f6' },
        { name: 'Workshop', color_hex: '#10b981' },
        { name: 'Meetup', color_hex: '#f59e0b' },
        { name: 'Tech', color_hex: '#8b5cf6' },
        { name: 'Networking', color_hex: '#06b6d4' },
        { name: 'Design', color_hex: '#f43f5e' },
    ]);
    const tags = await knex('tags').select('id', 'name');
    const tagMap = new Map(tags.map(t => [t.name, t.id]));
    // Dates for upcoming & past events
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const inFiveDays = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const inTenDays = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);
    const inTwoWeeks = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    const inEighteenDays = new Date(now.getTime() + 18 * 24 * 60 * 60 * 1000);
    const inTwentyDays = new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000);
    const inOneMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    // 3. Insert 10 Events
    const eventsData = [
        {
            creator_id: u1,
            title: 'Global Tech Summit 2026',
            description: 'The premier annual conference bringing together world-class software engineers, AI researchers, and tech innovators for keynote talks, panels, and networking sessions.',
            location: 'Grand Convention Center, Hall A & Virtual Livestream',
            event_type: 'public',
            start_time: nextWeek,
            end_time: new Date(nextWeek.getTime() + 8 * 60 * 60 * 1000),
            capacity: 350,
            banner_url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1000&auto=format&fit=crop&q=80',
        },
        {
            creator_id: u1,
            title: 'Full-Stack TypeScript & Cloud Workshop',
            description: 'Hands-on intensive code-along building scalable REST APIs, microservices, and modern React frontends with TypeScript and Docker.',
            location: 'Innovation Hub, Tech Room 4B',
            event_type: 'public',
            start_time: tomorrow,
            end_time: new Date(tomorrow.getTime() + 4 * 60 * 60 * 1000),
            capacity: 40,
            banner_url: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=1000&auto=format&fit=crop&q=80',
        },
        {
            creator_id: u2,
            title: 'Alice’s Milestone 30th Birthday Celebration',
            description: 'Join us for an evening of celebration, cake cutting, cocktails, and memories on the rooftop terrace!',
            location: 'Skyline Lounge & Rooftop, 42nd Floor',
            event_type: 'private',
            start_time: inTwoWeeks,
            end_time: new Date(inTwoWeeks.getTime() + 5 * 60 * 60 * 1000),
            capacity: 50,
            banner_url: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=1000&auto=format&fit=crop&q=80',
        },
        {
            creator_id: u2,
            title: 'Product Design & UI/UX Meetup',
            description: 'Discussing the latest trends in design systems, micro-interactions, accessibility patterns, and UX research methodologies.',
            location: 'Creative Quarter Co-working Space',
            event_type: 'public',
            start_time: inOneMonth,
            end_time: new Date(inOneMonth.getTime() + 3 * 60 * 60 * 1000),
            capacity: 80,
            banner_url: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=1000&auto=format&fit=crop&q=80',
        },
        {
            creator_id: u1,
            title: 'AI & Next-Gen Large Language Models Forum',
            description: 'Exploring state-of-the-art developments in generative AI, local model deployments, agents architecture, and enterprise security.',
            location: 'Silicon Oasis Auditorium 2',
            event_type: 'public',
            start_time: inFiveDays,
            end_time: new Date(inFiveDays.getTime() + 6 * 60 * 60 * 1000),
            capacity: 250,
            banner_url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=1000&auto=format&fit=crop&q=80',
        },
        {
            creator_id: u2,
            title: 'DevOps & Kubernetes Production Masterclass',
            description: 'Practical deep dive into container orchestration, GitOps with ArgoCD, cluster monitoring, and zero-downtime rollouts.',
            location: 'Cloud Academy Training Center',
            event_type: 'public',
            start_time: inTenDays,
            end_time: new Date(inTenDays.getTime() + 5 * 60 * 60 * 1000),
            capacity: 60,
            banner_url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1000&auto=format&fit=crop&q=80',
        },
        {
            creator_id: u1,
            title: 'Annual Tech Founders Charity Gala',
            description: 'Connecting innovators, angel investors, and philanthropy leaders to support open tech education initiatives.',
            location: 'Metropolitan Ballroom, Grand Hotel',
            event_type: 'public',
            start_time: inTwentyDays,
            end_time: new Date(inTwentyDays.getTime() + 4 * 60 * 60 * 1000),
            capacity: 150,
            banner_url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=1000&auto=format&fit=crop&q=80',
        },
        {
            creator_id: u2,
            title: 'Seed & Series-A Startup Pitch Night',
            description: 'Exclusive private pitch showcase for selected early-stage technology founders pitching before top venture partners.',
            location: 'Venture Studio Level 18, Bay Tower',
            event_type: 'private',
            start_time: inEighteenDays,
            end_time: new Date(inEighteenDays.getTime() + 3 * 60 * 60 * 1000),
            capacity: 45,
            banner_url: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=1000&auto=format&fit=crop&q=80',
        },
        {
            creator_id: u1,
            title: 'Frontend Developers Quarterly Meetup (Past)',
            description: 'A look back at modern CSS architecture, React 19 server components, and state management techniques in 2026.',
            location: 'Downtown Tech Hub, Auditorium',
            event_type: 'public',
            start_time: lastWeek,
            end_time: new Date(lastWeek.getTime() + 3 * 60 * 60 * 1000),
            capacity: 120,
            banner_url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1000&auto=format&fit=crop&q=80',
        },
        {
            creator_id: u2,
            title: 'Winter Engineering Hackathon 2026 (Past)',
            description: '48 hours of non-stop coding, innovating, and building groundbreaking open-source tools with peer mentorship.',
            location: 'Silicon District Campus, Building 3',
            event_type: 'public',
            start_time: lastMonth,
            end_time: new Date(lastMonth.getTime() + 48 * 60 * 60 * 1000),
            capacity: 200,
            banner_url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1000&auto=format&fit=crop&q=80',
        },
    ];
    await knex('events').insert(eventsData);
    const createdEvents = await knex('events').select('id', 'title');
    const eventMap = new Map(createdEvents.map(e => [e.title, e.id]));
    // 4. Map Event Tags
    const eventTagsToInsert = [
        { event_id: eventMap.get('Global Tech Summit 2026'), tag_id: tagMap.get('Conference') },
        { event_id: eventMap.get('Global Tech Summit 2026'), tag_id: tagMap.get('Tech') },
        { event_id: eventMap.get('Global Tech Summit 2026'), tag_id: tagMap.get('Networking') },
        { event_id: eventMap.get('Full-Stack TypeScript & Cloud Workshop'), tag_id: tagMap.get('Workshop') },
        { event_id: eventMap.get('Full-Stack TypeScript & Cloud Workshop'), tag_id: tagMap.get('Tech') },
        { event_id: eventMap.get('Alice’s Milestone 30th Birthday Celebration'), tag_id: tagMap.get('Birthday') },
        { event_id: eventMap.get('Product Design & UI/UX Meetup'), tag_id: tagMap.get('Design') },
        { event_id: eventMap.get('Product Design & UI/UX Meetup'), tag_id: tagMap.get('Meetup') },
        { event_id: eventMap.get('AI & Next-Gen Large Language Models Forum'), tag_id: tagMap.get('Tech') },
        { event_id: eventMap.get('AI & Next-Gen Large Language Models Forum'), tag_id: tagMap.get('Conference') },
        { event_id: eventMap.get('DevOps & Kubernetes Production Masterclass'), tag_id: tagMap.get('Workshop') },
        { event_id: eventMap.get('DevOps & Kubernetes Production Masterclass'), tag_id: tagMap.get('Tech') },
        { event_id: eventMap.get('Annual Tech Founders Charity Gala'), tag_id: tagMap.get('Networking') },
        { event_id: eventMap.get('Annual Tech Founders Charity Gala'), tag_id: tagMap.get('Meetup') },
        { event_id: eventMap.get('Seed & Series-A Startup Pitch Night'), tag_id: tagMap.get('Networking') },
        { event_id: eventMap.get('Seed & Series-A Startup Pitch Night'), tag_id: tagMap.get('Tech') },
        { event_id: eventMap.get('Frontend Developers Quarterly Meetup (Past)'), tag_id: tagMap.get('Tech') },
        { event_id: eventMap.get('Frontend Developers Quarterly Meetup (Past)'), tag_id: tagMap.get('Meetup') },
        { event_id: eventMap.get('Winter Engineering Hackathon 2026 (Past)'), tag_id: tagMap.get('Workshop') },
        { event_id: eventMap.get('Winter Engineering Hackathon 2026 (Past)'), tag_id: tagMap.get('Tech') },
    ].filter(et => et.event_id && et.tag_id);
    if (eventTagsToInsert.length > 0) {
        await knex('event_tags').insert(eventTagsToInsert);
    }
    // 5. Insert Sample RSVPs
    const summitId = eventMap.get('Global Tech Summit 2026');
    const workshopId = eventMap.get('Full-Stack TypeScript & Cloud Workshop');
    const birthdayId = eventMap.get('Alice’s Milestone 30th Birthday Celebration');
    const aiForumId = eventMap.get('AI & Next-Gen Large Language Models Forum');
    const devopsId = eventMap.get('DevOps & Kubernetes Production Masterclass');
    const galaId = eventMap.get('Annual Tech Founders Charity Gala');
    const pitchId = eventMap.get('Seed & Series-A Startup Pitch Night');
    const rsvpsToInsert = [];
    if (summitId) {
        rsvpsToInsert.push({ event_id: summitId, user_id: u1, status: 'yes' }, { event_id: summitId, user_id: u2, status: 'maybe' }, { event_id: summitId, user_id: u3, status: 'yes' });
    }
    if (workshopId) {
        rsvpsToInsert.push({ event_id: workshopId, user_id: u2, status: 'yes' }, { event_id: workshopId, user_id: u3, status: 'maybe' });
    }
    if (birthdayId) {
        rsvpsToInsert.push({ event_id: birthdayId, user_id: u1, status: 'yes' }, { event_id: birthdayId, user_id: u2, status: 'yes' });
    }
    if (aiForumId) {
        rsvpsToInsert.push({ event_id: aiForumId, user_id: u1, status: 'yes' }, { event_id: aiForumId, user_id: u2, status: 'yes' }, { event_id: aiForumId, user_id: u3, status: 'maybe' });
    }
    if (devopsId) {
        rsvpsToInsert.push({ event_id: devopsId, user_id: u2, status: 'yes' }, { event_id: devopsId, user_id: u1, status: 'maybe' });
    }
    if (galaId) {
        rsvpsToInsert.push({ event_id: galaId, user_id: u1, status: 'yes' }, { event_id: galaId, user_id: u3, status: 'yes' });
    }
    if (pitchId) {
        rsvpsToInsert.push({ event_id: pitchId, user_id: u2, status: 'yes' }, { event_id: pitchId, user_id: u1, status: 'yes' });
    }
    if (rsvpsToInsert.length > 0) {
        await knex('rsvps').insert(rsvpsToInsert);
    }
    // 6. Insert Bonus Section Sample Data (From Pages 4-6 of PDF)
    await knex('emp_designation_log').insert([
        { txn_id: 'T001', emp_id: 'EMP001', emp_name: 'Alice Johnson', designation: 'Associate Developer', effective_date: '2024-02-01' },
        { txn_id: 'T002', emp_id: 'EMP001', emp_name: 'Alice Johnson', designation: 'Mid Developer', effective_date: '2024-02-05' },
        { txn_id: 'T003', emp_id: 'EMP001', emp_name: 'Alice Johnson', designation: 'Senior Developer', effective_date: '2024-02-10' },
        { txn_id: 'T004', emp_id: 'EMP002', emp_name: 'Bob Martinez', designation: 'Mid Developer', effective_date: '2024-05-02' },
        { txn_id: 'T005', emp_id: 'EMP002', emp_name: 'Bob Martinez', designation: 'Senior Developer', effective_date: '2024-07-15' },
        { txn_id: 'T006', emp_id: 'EMP002', emp_name: 'Bob Martinez', designation: 'Mid Developer', effective_date: '2024-09-20' },
        { txn_id: 'T007', emp_id: 'EMP003', emp_name: 'Carol Smith', designation: 'Mid Developer', effective_date: '2024-08-06' },
        { txn_id: 'T008', emp_id: 'EMP003', emp_name: 'Carol Smith', designation: 'Mid Developer', effective_date: '2024-08-06' },
        { txn_id: 'T009', emp_id: 'EMP004', emp_name: 'David Lee', designation: 'Associate Developer', effective_date: '2024-01-10' },
        { txn_id: 'T010', emp_id: 'EMP004', emp_name: 'David Lee', designation: 'Associate Developer', effective_date: '2024-04-10' },
        { txn_id: 'T011', emp_id: 'EMP004', emp_name: 'David Lee', designation: 'Mid Developer', effective_date: '2024-09-10' },
        { txn_id: 'T012', emp_id: 'EMP005', emp_name: 'Eva Chen', designation: 'Senior Developer', effective_date: '2024-06-15' },
        { txn_id: 'T013', emp_id: 'EMP005', emp_name: 'Eva Chen', designation: 'Mid Developer', effective_date: '2024-03-01' },
        { txn_id: 'T014', emp_id: 'EMP005', emp_name: 'Eva Chen', designation: 'Senior Developer', effective_date: '2024-11-20' },
        { txn_id: 'T015', emp_id: 'EMP006', emp_name: 'Frank Patel', designation: 'Associate Developer', effective_date: '2024-01-01' },
        { txn_id: 'T016', emp_id: 'EMP006', emp_name: 'Frank Patel', designation: 'Mid Developer', effective_date: '2024-05-10' },
        { txn_id: 'T017', emp_id: 'EMP006', emp_name: 'Frank Patel', designation: 'Mid Developer', effective_date: '2024-05-10' },
        { txn_id: 'T018', emp_id: 'EMP007', emp_name: 'Grace Kim', designation: 'Senior Developer', effective_date: '2023-03-03' },
        { txn_id: 'T019', emp_id: 'EMP007', emp_name: 'Grace Kim', designation: 'Resigned', effective_date: '2023-06-30' },
        { txn_id: 'T020', emp_id: 'EMP007', emp_name: 'Grace Kim', designation: 'Associate Developer', effective_date: '2024-01-15' },
        { txn_id: 'T021', emp_id: 'EMP007', emp_name: 'Grace Kim', designation: 'Mid Developer', effective_date: '2024-07-15' },
        { txn_id: 'T022', emp_id: 'EMP008', emp_name: 'Henry Walsh', designation: 'Associate Developer', effective_date: '2024-06-01' },
        { txn_id: 'T023', emp_id: 'EMP008', emp_name: 'Henry Walsh', designation: 'Mid Developer', effective_date: '2024-06-01' },
        { txn_id: 'T024', emp_id: 'EMP009', emp_name: 'Irene Novak', designation: 'Senior Developer', effective_date: '2024-09-01' },
    ]);
    await knex('emp_allocation_log').insert([
        { allocation_id: 'A001', emp_id: 'EMP001', project_name: 'Project Alpha', allocated_role: 'Developer', allocation_start: '2024-02-03', allocation_end: '2024-04-30' },
        { allocation_id: 'A002', emp_id: 'EMP001', project_name: 'Project Beta', allocated_role: 'Tech Lead', allocation_start: '2024-05-01', allocation_end: '2024-09-30' },
        { allocation_id: 'A003', emp_id: 'EMP002', project_name: 'Project Alpha', allocated_role: 'Developer', allocation_start: '2024-05-10', allocation_end: '2024-08-31' },
        { allocation_id: 'A004', emp_id: 'EMP002', project_name: 'Project Gamma', allocated_role: 'Senior Contributor', allocation_start: '2024-09-01', allocation_end: null },
        { allocation_id: 'A005', emp_id: 'EMP003', project_name: 'Project Beta', allocated_role: 'Developer', allocation_start: '2024-08-06', allocation_end: '2024-12-31' },
        { allocation_id: 'A006', emp_id: 'EMP004', project_name: 'Project Delta', allocated_role: 'Developer', allocation_start: '2024-02-01', allocation_end: '2024-10-31' },
        { allocation_id: 'A007', emp_id: 'EMP005', project_name: 'Project Alpha', allocated_role: 'Senior Contributor', allocation_start: '2024-04-01', allocation_end: '2024-07-31' },
        { allocation_id: 'A008', emp_id: 'EMP005', project_name: 'Project Gamma', allocated_role: 'Tech Lead', allocation_start: '2024-08-01', allocation_end: null },
        { allocation_id: 'A009', emp_id: 'EMP006', project_name: 'Project Delta', allocated_role: 'Developer', allocation_start: '2024-03-01', allocation_end: '2024-06-30' },
        { allocation_id: 'A010', emp_id: 'EMP007', project_name: 'Project Beta', allocated_role: 'Developer', allocation_start: '2024-02-01', allocation_end: '2024-06-30' },
        { allocation_id: 'A011', emp_id: 'EMP008', project_name: 'Project Alpha', allocated_role: 'Developer', allocation_start: '2024-07-01', allocation_end: null },
        { allocation_id: 'A012', emp_id: 'EMP009', project_name: 'Project Gamma', allocated_role: 'Senior Contributor', allocation_start: '2024-10-01', allocation_end: null },
    ]);
}
