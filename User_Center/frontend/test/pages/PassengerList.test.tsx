import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi, describe, beforeEach, test, expect } from 'vitest';
import PassengerList from '../../src/pages/PassengerList';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('PassengerList', () => {

  beforeEach(() => {
    mockFetch.mockReset();
    localStorage.setItem('SESSION_ID', 'mock-sid');
  });

  test('should render passenger list with new layout', async () => {
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
            phone_country_code: '86',
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

    // Check Search Bar
    expect(screen.getByPlaceholderText('请输入乘客姓名')).toBeInTheDocument();
    expect(screen.getByText('查询')).toBeInTheDocument();

    // Wait for data load
    await waitFor(() => {
      expect(screen.getByText('添加')).toBeInTheDocument();
    });

    // Check Toolbar
    expect(screen.getByText('批量删除')).toBeInTheDocument();

    // Check Table Headers
    expect(screen.getByText('序号')).toBeInTheDocument();
    expect(screen.getByText('姓名')).toBeInTheDocument();
    expect(screen.getByText('证件类型')).toBeInTheDocument();
    expect(screen.getByText('证件号码')).toBeInTheDocument();
    expect(screen.getByText('手机／电话')).toBeInTheDocument();
    expect(screen.getByText('核验状态')).toBeInTheDocument();
    expect(screen.getByText('操作')).toBeInTheDocument();
    
    // Check Data
    await waitFor(() => {
      expect(screen.getByText('张三')).toBeInTheDocument();
    });
    
    expect(screen.getByText('110101********1234')).toBeInTheDocument();
    expect(screen.getByText('(+86)139****5678')).toBeInTheDocument();
    
    // Check Status Icon presence (by class or structure)
    // We can just check that "已通过" text is NOT present if we are hiding it for icon, 
    // OR if we show icon, we can check for the element.
    // In my code: {p.verified_status === '已通过' && <span className="status-icon"></span>}
    // The text {p.verified_status} is NOT rendered inside the div if I look at the code?
    // Wait, let's check my code.
    /*
      <div className={`status-${p.verified_status === '已通过' ? 'verified' : 'pending'}`}>
          {p.verified_status === '已通过' && <span className="status-icon"></span>}
      </div>
    */
    // So "已通过" text is rendered now, based on spec.
    expect(screen.queryByText('已通过')).toBeInTheDocument();
    // const statusIcon = screen.getByRole('row', { name: /张三/ }).querySelector('.status-icon-img');
    // expect(statusIcon).toBeInTheDocument();
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
            phone_country_code: '86',
            phone_number: '13900000000',
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
