import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import PassengerList from '../../src/pages/PassengerList';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('PassengerList', () => {

  beforeEach(() => {
    mockFetch.mockReset();
  });

  test('should render passenger list', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        passengers: [
          {
            passenger_id: '1',
            name: '张三',
            id_type: '居民身份证',
            id_number: '110101199003071234',
            id_number_masked: '110101********1234',
            phone_number: '13912345678',
            phone_number_masked: '139****5678',
            traveler_type: '成人',
            verified_status: '已通过',
            is_self: false,
          }
        ]
      }),
    });

    render(<PassengerList />);

    expect(screen.getByText(/当前位置：个人中心 > 常用信息管理 > 乘车人/)).toBeInTheDocument();
    
    await waitFor(() => {

      expect(screen.getByText('张三')).toBeInTheDocument();
    });
    
    expect(screen.getByText('110101********1234')).toBeInTheDocument();
    expect(screen.getByText('139****5678')).toBeInTheDocument();
    expect(screen.getByText('已通过')).toBeInTheDocument();
  });

  test('should handle delete', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        passengers: [
          {
            passenger_id: '2',
            name: '李四',
            id_type: '居民身份证',
            id_number: '110101199003075678',
            traveler_type: '成人',
            verified_status: '已通过',
            is_self: false,
          }
        ]
      }),
    });

    render(<PassengerList />);
    
    await waitFor(() => {
      expect(screen.getByText('李四')).toBeInTheDocument();
    });

    // Mock delete success
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });
    // Mock refresh list (empty)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ passengers: [] }),
    });

    const deleteBtn = screen.getByText('删除');
    
    // Mock confirm
    vi.spyOn(window, 'confirm').mockImplementation(() => true);
    
    fireEvent.click(deleteBtn);
    
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/passengers/2'), expect.objectContaining({ method: 'DELETE' }));
    });
  });
});
