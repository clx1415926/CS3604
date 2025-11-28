import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { describe, test, expect, beforeEach } from 'vitest';
import OrderFilling from '../../src/components/OrderFilling';

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('OrderFilling Refresh Logic', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    localStorage.clear();
  });

  test('should refresh passenger list when button is clicked', async () => {
    // Setup fetch mock
    mockFetch.mockImplementation((url) => {
      const u = String(url);
      if (u.includes('8083/api/v1/passengers')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ 
            passengers: [
              { passenger_id: 'p-1', name: 'InitialUser', id_number: '123456789012345678', verified_status: '已通过' }
            ] 
          })
        });
      }
      return Promise.resolve({ ok: false });
    });

    render(<OrderFilling />);

    await waitFor(() => {
      expect(screen.getByText('InitialUser')).toBeInTheDocument();
    });

    // Update mock for refresh
    mockFetch.mockImplementation((url) => {
      const u = String(url);
      if (u.includes('8083/api/v1/passengers')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ 
            passengers: [
              { passenger_id: 'p-1', name: 'InitialUser', id_number: '123456789012345678', verified_status: '已通过' },
              { passenger_id: 'p-2', name: 'NewUser', id_number: '987654321098765432', verified_status: '已通过' }
            ] 
          })
        });
      }
      return Promise.resolve({ ok: false });
    });

    // Click refresh button
    const refreshBtn = screen.getByText('刷新列表');
    fireEvent.click(refreshBtn);

    // Should show new user
    await waitFor(() => {
      expect(screen.getByText('NewUser')).toBeInTheDocument();
    });
  });

  test('should show error message on sync failure', async () => {
    // Initial success
    mockFetch.mockImplementation((url) => {
      const u = String(url);
      if (u.includes('8083/api/v1/passengers')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ passengers: [] })
        });
      }
      return Promise.resolve({ ok: false });
    });

    render(<OrderFilling />);

    // Mock failure for refresh
    // We need to wait for initial render to complete or use a variable to switch behavior
    // But since we click the button, we can just change the implementation
    
    // Ensure initial render is done
    // await waitFor(() => expect(screen.queryByText('刷新列表')).toBeInTheDocument());

    mockFetch.mockImplementation((url) => {
      const u = String(url);
      if (u.includes('8083/api/v1/passengers')) {
        return Promise.reject(new Error('Network Error'));
      }
      return Promise.resolve({ ok: false });
    });

    const refreshBtn = screen.getByText('刷新列表');
    fireEvent.click(refreshBtn);

    await waitFor(() => {
      expect(screen.getByText('获取联系人失败，请检查网络或稍后重试')).toBeInTheDocument();
    });
  });
});
