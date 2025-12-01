import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PassengerEdit from '../../src/pages/PassengerEdit';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;


// Mock window.location.hash
const mockLocation = {
  hash: '',
};
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
});

describe('PassengerEdit', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    mockLocation.hash = '';
    vi.clearAllMocks();
  });

  test('should render form elements', () => {
    render(<PassengerEdit />);
    expect(screen.getByText('基本信息')).toBeInTheDocument();
    expect(screen.getByText('*姓名：')).toBeInTheDocument();
    expect(screen.getByText('*证件类型：')).toBeInTheDocument();
    expect(screen.getByText('*证件号码：')).toBeInTheDocument();
    expect(screen.getByText('*手机号码：')).toBeInTheDocument();
    expect(screen.getByText('*旅客类型：')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '下一步' })).toBeInTheDocument();
  });

  test('should validate required fields', async () => {
    render(<PassengerEdit />);
    
    // Submit empty form
    fireEvent.click(screen.getByRole('button', { name: '下一步' }));
    
    // It should show the first error: "请输入姓名"
    expect(await screen.findByText('请输入姓名')).toBeInTheDocument();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  test('should validate name format', async () => {
    render(<PassengerEdit />);
    
    const inputs = screen.getAllByRole('textbox');
    // Name
    fireEvent.change(inputs[0], { target: { value: 'Test@123' } });
    
    fireEvent.click(screen.getByRole('button', { name: '下一步' }));
    
    expect(await screen.findByText('姓名只能包含汉字、字母、点(.)或中点(·)')).toBeInTheDocument();
  });

  test('should validate ID card format', async () => {
    render(<PassengerEdit />);
    
    const inputs = screen.getAllByRole('textbox');
    fireEvent.change(inputs[0], { target: { value: '张三' } });
    // Invalid ID
    fireEvent.change(inputs[1], { target: { value: '12345' } });
    
    fireEvent.click(screen.getByRole('button', { name: '下一步' }));
    
    expect(await screen.findByText('身份证号码格式不正确')).toBeInTheDocument();
  });

  test('should show name rule popup', async () => {
    render(<PassengerEdit />);
    
    const ruleLink = screen.getByText('姓名填写规则');
    fireEvent.click(ruleLink);
    
    expect(screen.getByText('确认姓名中生僻字无法输入时，可用生僻字拼音或同音字替代。')).toBeInTheDocument();
    
    const closeBtn = screen.getByRole('button', { name: '关闭' });
    fireEvent.click(closeBtn);
    
    expect(screen.queryByText('确认姓名中生僻字无法输入时，可用生僻字拼音或同音字替代。')).not.toBeInTheDocument();
  });

  test('should submit valid form data', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ passenger_id: '123' }),
    });
    // Alert mock
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});

    render(<PassengerEdit />);

    // Fill form (using placeholder or structure)
    // Since inputs don't have placeholders or labels directly associated via 'for' in the simple code,
    // we might need to rely on container structure or just finding inputs.
    // The code uses simple labels and inputs.
    // "姓名：" label is separate from input.
    // Let's use generic input selection or IDs if I added them. I didn't add IDs.
    // I can assume order or add IDs. Or just use getAllByRole('textbox').
    
    // Let's improve the component to be more testable or use slightly brittle selectors for now.
    // Actually, I can use display values to find inputs if I change them.
    // Or, I can update the component to include accessibility attributes.
    // But since I can't easily change the component just for testing without rewriting, 
    // I'll try to find inputs by their proximity or type.
    
    const inputs = screen.getAllByRole('textbox');
    // 0: Name, 1: ID Number, 2: Phone
    fireEvent.change(inputs[0], { target: { value: '王五' } });
    fireEvent.change(inputs[1], { target: { value: '110101199003071111' } });
    fireEvent.change(inputs[2], { target: { value: '13900001111' } });
    
    // Selects
    const selects = screen.getAllByRole('combobox');
    // 0: ID Type, 1: Traveler Type
    fireEvent.change(selects[0], { target: { value: '居民身份证' } });
    fireEvent.change(selects[1], { target: { value: '成人' } });

    fireEvent.click(screen.getByRole('button', { name: '下一步' }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    const callArg = mockFetch.mock.calls[0][1];
    const body = JSON.parse(callArg.body);
    expect(body.name).toBe('王五');
    expect(body.id_number).toBe('110101199003071111');
    expect(body.phone_number).toBe('13900001111');
    
    expect(alertMock).toHaveBeenCalledWith('添加成功');
    expect(window.location.hash).toBe('#/otn/view/passengers.html');
  });

  test('should handle API errors', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'PASSENGER_LIMIT_EXCEEDED' }),
    });

    render(<PassengerEdit />);

    const inputs = screen.getAllByRole('textbox');
    fireEvent.change(inputs[0], { target: { value: '王五' } });
    fireEvent.change(inputs[1], { target: { value: '110101199003071111' } });
    fireEvent.change(inputs[2], { target: { value: '13900001111' } });

    fireEvent.click(screen.getByRole('button', { name: '下一步' }));

    expect(await screen.findByText('常用联系人已超过上限(15人)')).toBeInTheDocument();
  });
});
