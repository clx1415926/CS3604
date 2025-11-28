import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { describe, test, expect, beforeEach } from 'vitest';
import OrderFilling from '../../src/components/OrderFilling';

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('OrderFilling Synchronization', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    localStorage.clear();
  });

  test('should sync passengers from User_Center', async () => {
    // Mock session profile fetch
    mockFetch.mockImplementation((url) => {
      const u = String(url);
      if (u.includes('/api/v1/auth/session/profile')) {
        return Promise.resolve({ ok: true, json: async () => ({ username: 'testuser', name: 'Test User' }) });
      }
      if (u.includes('8083/api/v1/passengers')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            passengers: [
              { passenger_id: 'p-100', name: 'SyncUser1', id_type: '居民身份证', id_number: '110101199001011234', verified_status: '已通过' },
              { passenger_id: 'p-101', name: 'SyncUser2', id_type: '护照', id_number: 'P12345678', verified_status: '已通过' }
            ]
          })
        });
      }
      return Promise.resolve({ ok: false });
    });

    render(<OrderFilling />);

    // Check if passengers from User_Center are rendered
    await waitFor(() => {
      expect(screen.getByText('SyncUser1')).toBeInTheDocument();
      expect(screen.getByText('SyncUser2')).toBeInTheDocument();
    });

    // Check masking logic
    // 110101199001011234 -> 110101********1234
    await waitFor(() => {
      expect(screen.getByText((content) => content.includes('110101********1234'))).toBeInTheDocument();
    });
  });

  test('should handle sync failure gracefully', async () => {
    mockFetch.mockImplementation((url) => {
      const u = String(url);
      if (u.includes('8083/api/v1/passengers')) {
        return Promise.reject(new Error('Network error'));
      }
      return Promise.resolve({ ok: false });
    });

    // Mock console.error to suppress output
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<OrderFilling />);

    // Should fallback to default/empty or handle error without crashing
    // The component has a fallback to default data in test env, so we might see '张三'
    await waitFor(() => {
      expect(screen.getByText('张三')).toBeInTheDocument();
    });

    consoleSpy.mockRestore();
  });

  test('should handle large data set', async () => {
    const largeList = Array.from({ length: 100 }, (_, i) => ({
      passenger_id: `p-${i}`,
      name: `User${i}`,
      id_type: '居民身份证',
      id_number: `11010119900101${1000 + i}`,
      verified_status: '已通过'
    }));

    mockFetch.mockImplementation((url) => {
      const u = String(url);
      if (u.includes('8083/api/v1/passengers')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ passengers: largeList })
        });
      }
      return Promise.resolve({ ok: false });
    });

    const start = performance.now();
    render(<OrderFilling />);
    const end = performance.now();
    
    // Just ensure it renders without timeout
    await waitFor(() => {
      expect(screen.getByText('User99')).toBeInTheDocument();
    });
    
    // Basic performance check (rendering 100 items shouldn't take > 1s in test)
    expect(end - start).toBeLessThan(1000); 
  });
});
