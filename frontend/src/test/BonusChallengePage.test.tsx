import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { BonusChallengePage } from '../pages/BonusChallengePage';
import { ToastProvider } from '../contexts/ToastContext';
import { bonusApi } from '../api/bonus.api';

vi.mock('../api/bonus.api', () => ({
  bonusApi: {
    getBonusData: vi.fn(),
    runQ1: vi.fn(),
    runQ2: vi.fn(),
    runQ4: vi.fn(),
  },
}));

const mockRawData = {
  empDesignationLog: [
    { txn_id: 'T001', emp_id: 'EMP001', emp_name: 'Alice Johnson', designation: 'Associate Developer', effective_date: '2024-02-01' },
  ],
  empAllocationLog: [
    { allocation_id: 'A001', emp_id: 'EMP001', project_name: 'Project Alpha', allocated_role: 'Developer', allocation_start: '2024-02-03' },
  ],
};

const mockQ1Result = {
  sql: 'WITH RankedDesignations AS (...) SELECT ...',
  count: 1,
  rows: [
    { emp_id: 'EMP001', emp_name: 'Alice Johnson', current_designation: 'Senior Developer' },
  ],
};

const mockQ2Result = {
  sql: 'SELECT emp_id, effective_date, LAG(designation) ...',
  count: 1,
  rows: [
    { emp_id: 'EMP001', effective_date: '2024-02-01', previous_designation: null, designation: 'Associate Developer', next_designation: 'Mid Developer' },
  ],
};

const mockQ4Result = {
  sql: 'WITH ActiveDesignationPerAllocation AS (...) SELECT ...',
  count: 1,
  rows: [
    { allocation_id: 'A001', emp_id: 'EMP001', emp_name: 'Alice Johnson', project_name: 'Project Alpha', allocated_role: 'Developer', allocation_start: '2024-02-03', designation_at_allocation: 'Associate Developer' },
  ],
};

describe('BonusChallengePage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(bonusApi.getBonusData).mockResolvedValue({ success: true, data: mockRawData as any });
    vi.mocked(bonusApi.runQ1).mockResolvedValue({ success: true, data: mockQ1Result as any });
    vi.mocked(bonusApi.runQ2).mockResolvedValue({ success: true, data: mockQ2Result as any });
    vi.mocked(bonusApi.runQ4).mockResolvedValue({ success: true, data: mockQ4Result as any });
  });

  it('renders clean header and allows switching to Q4 Strategy & Reasoning tab', async () => {
    render(
      <BrowserRouter>
        <ToastProvider>
          <BonusChallengePage />
        </ToastProvider>
      </BrowserRouter>
    );

    // Wait for initial data to load
    await waitFor(() => {
      expect(screen.getByText('Question 1: Current Designation of Every Employee')).toBeInTheDocument();
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    });

    // Ensure removed buttons are not present
    expect(screen.queryByRole('button', { name: /View BONUS_ANSWERS\.md/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /View bonus_solution\.sql/i })).not.toBeInTheDocument();

    // Click Q4 Strategy & Reasoning Tab
    const strategyTabBtn = screen.getByTestId('strategy-tab-btn');
    expect(strategyTabBtn).toBeInTheDocument();
    fireEvent.click(strategyTabBtn);

    // Verify Strategy content is rendered answering the 3 core questions
    await waitFor(() => {
      expect(screen.getByText('Multiple Designations Over Time')).toBeInTheDocument();
      expect(screen.getByText('Active State Without End Date')).toBeInTheDocument();
      expect(screen.getByText('No Prior Designation Record')).toBeInTheDocument();
    });
  });
});
