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

  it('renders header with interactive buttons that open modals in-app', async () => {
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

    const docsBtn = screen.getByRole('button', { name: /View BONUS_ANSWERS\.md/i });
    expect(docsBtn).toBeInTheDocument();

    const sqlBtn = screen.getByRole('button', { name: /View bonus_solution\.sql/i });
    expect(sqlBtn).toBeInTheDocument();

    // Open SQL Modal
    fireEvent.click(sqlBtn);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Executable SQL')).toBeInTheDocument();
    expect(screen.getByText('167 Lines')).toBeInTheDocument();

    // Close SQL Modal
    const closeBtns = screen.getAllByRole('button', { name: /Close/i });
    fireEvent.click(closeBtns[0]);

    // Open Docs Modal
    fireEvent.click(docsBtn);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Solutions & Documentation')).toBeInTheDocument();
  });
});
