import request from 'supertest';
import { createApp } from '../src/app';
import './setup';

const app = createApp();

describe('Assessment Bonus SQL Queries (Q1, Q2, Q4)', () => {
  it('should fetch raw bonus tables', async () => {
    const res = await request(app).get('/api/v1/bonus/data');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.empDesignationLog.length).toBe(24);
    expect(res.body.data.empAllocationLog.length).toBe(12);
  });

  it('should execute Q1 and return current designation of every employee', async () => {
    const res = await request(app).get('/api/v1/bonus/q1');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.rows.length).toBe(9);

    const rows = res.body.data.rows;
    // Alice Johnson (EMP001) latest designation on 2024-02-10 is Senior Developer
    const emp1 = rows.find((r: any) => r.emp_id === 'EMP001');
    expect(emp1).toBeDefined();
    expect(emp1.emp_name).toBe('Alice Johnson');
    expect(emp1.current_designation).toBe('Senior Developer');

    // Bob Martinez (EMP002) latest on 2024-09-20 is Mid Developer
    const emp2 = rows.find((r: any) => r.emp_id === 'EMP002');
    expect(emp2.current_designation).toBe('Mid Developer');

    // Irene Novak (EMP009) is Senior Developer
    const emp9 = rows.find((r: any) => r.emp_id === 'EMP009');
    expect(emp9.current_designation).toBe('Senior Developer');
  });

  it('should execute Q2 and return timeline with previous and next designations', async () => {
    const res = await request(app).get('/api/v1/bonus/q2');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.rows.length).toBe(24);

    const rows = res.body.data.rows;
    const aliceRows = rows.filter((r: any) => r.emp_id === 'EMP001');
    expect(aliceRows.length).toBe(3);

    // First row for Alice (T001: 2024-02-01)
    expect(aliceRows[0].previous_designation).toBeNull();
    expect(aliceRows[0].designation).toBe('Associate Developer');
    expect(aliceRows[0].next_designation).toBe('Mid Developer');

    // Second row for Alice (T002: 2024-02-05)
    expect(aliceRows[1].previous_designation).toBe('Associate Developer');
    expect(aliceRows[1].designation).toBe('Mid Developer');
    expect(aliceRows[1].next_designation).toBe('Senior Developer');

    // Third row for Alice (T003: 2024-02-10)
    expect(aliceRows[2].previous_designation).toBe('Mid Developer');
    expect(aliceRows[2].designation).toBe('Senior Developer');
    expect(aliceRows[2].next_designation).toBeNull();
  });

  it('should execute Q4 and return active designation at project allocation start', async () => {
    const res = await request(app).get('/api/v1/bonus/q4');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.rows.length).toBe(12);

    const rows = res.body.data.rows;
    
    // A001: EMP001 joined Project Alpha on 2024-02-03.
    // On 2024-02-03, Alice was Associate Developer (became Mid on 2024-02-05).
    const a001 = rows.find((r: any) => r.allocation_id === 'A001');
    expect(a001).toBeDefined();
    expect(a001.emp_name).toBe('Alice Johnson');
    expect(a001.project_name).toBe('Project Alpha');
    expect(a001.designation_at_allocation).toBe('Associate Developer');

    // A002: EMP001 joined Project Beta on 2024-05-01.
    // On 2024-05-01, Alice had become Senior Developer (on 2024-02-10).
    const a002 = rows.find((r: any) => r.allocation_id === 'A002');
    expect(a002.designation_at_allocation).toBe('Senior Developer');

    // A003: EMP002 joined Project Alpha on 2024-05-10.
    // Bob was Mid Developer (became Mid on 2024-05-02).
    const a003 = rows.find((r: any) => r.allocation_id === 'A003');
    expect(a003.designation_at_allocation).toBe('Mid Developer');
  });
});
