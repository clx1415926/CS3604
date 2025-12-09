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

  test('should render form elements correctly', () => {
    render(<PassengerEdit />);
    
    // Headers
    expect(screen.getByText('基本信息')).toBeInTheDocument();
    expect(screen.getAllByText(/联系方式/).length).toBeGreaterThan(0);
    expect(screen.getByText('附加信息')).toBeInTheDocument();

    // Labels (using regex to handle split spans)
    expect(screen.getByText(/姓名：/)).toBeInTheDocument();
    expect(screen.getByText(/证件类型：/)).toBeInTheDocument();
    expect(screen.getByText(/证件号码：/)).toBeInTheDocument();
    expect(screen.getByText(/手机号码：/)).toBeInTheDocument();
    expect(screen.getByText(/优惠\(待\)类型：/)).toBeInTheDocument();

    // Buttons
    expect(screen.getByRole('button', { name: '保存' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '取消' })).toBeInTheDocument();

    // Ensure SMS elements are NOT present
    expect(screen.queryByText(/验证码：/)).not.toBeInTheDocument();
    expect(screen.queryByText(/获取验证码/)).not.toBeInTheDocument();
  });

  test('should validate required fields', async () => {
    render(<PassengerEdit />);
    
    // Submit empty form
    fireEvent.click(screen.getByRole('button', { name: '保存' }));
    
    // It should show the error message. 
    // Since validation is sequential in the code, 'name' is checked first usually or all at once.
    // My code sets fieldErrors.
    
    // Check for field error messages
    // Note: The component might show "请输入姓名" as a field error.
    // Let's check if validation prevents submission and shows error.
    
    // Trigger blur to show field errors or just submit
    const nameInput = screen.getByPlaceholderText('请输入姓名');
    fireEvent.blur(nameInput);
    
    expect(await screen.findByText('请输入姓名')).toBeInTheDocument();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  test('should validate name format', async () => {
    render(<PassengerEdit />);
    
    const nameInput = screen.getByPlaceholderText('请输入姓名');
    fireEvent.change(nameInput, { target: { value: 'Test@123' } });
    fireEvent.blur(nameInput);
    
    expect(await screen.findByText('姓名只能包含汉字、字母、点(.)或中点(·)，且长度为2-20位')).toBeInTheDocument();
  });

  test('should validate ID card format', async () => {
    render(<PassengerEdit />);
    
    const nameInput = screen.getByPlaceholderText('请输入姓名');
    fireEvent.change(nameInput, { target: { value: '张三' } });
    
    const idInput = screen.getByPlaceholderText('请输入证件号码');
    fireEvent.change(idInput, { target: { value: '12345' } });
    fireEvent.blur(idInput);
    
    expect(await screen.findByText('身份证号码格式不正确')).toBeInTheDocument();
  });

  test('should submit valid form data without SMS verification', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ passenger_id: '123' }),
    });
    // Alert mock
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});

    render(<PassengerEdit />);

    // Fill form
    fireEvent.change(screen.getByPlaceholderText('请输入姓名'), { target: { value: '王五' } });
    fireEvent.change(screen.getByPlaceholderText('请输入证件号码'), { target: { value: '110101199003071110' } });
    fireEvent.change(screen.getByPlaceholderText('请输入手机号码'), { target: { value: '13900001111' } });
    
    // Selects (ID Type is default 居民身份证, Traveler Type is default 成人)

    fireEvent.click(screen.getByRole('button', { name: '保存' }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    const callArg = mockFetch.mock.calls[0][1];
    const body = JSON.parse(callArg.body);
    expect(body.name).toBe('王五');
    expect(body.id_number).toBe('110101199003071110');
    expect(body.phone_number).toBe('13900001111');
    // Ensure no SMS code in body
    expect(body.code).toBeUndefined();
    expect(body.verification_code).toBeUndefined();
    
    expect(alertMock).toHaveBeenCalledWith('添加成功');
    expect(window.location.hash).toBe('#/otn/view/passengers.html');
  });

  test('should handle API errors', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'PASSENGER_LIMIT_EXCEEDED' }),
    });

    render(<PassengerEdit />);

    fireEvent.change(screen.getByPlaceholderText('请输入姓名'), { target: { value: '王五' } });
    fireEvent.change(screen.getByPlaceholderText('请输入证件号码'), { target: { value: '110101199003071110' } });
    fireEvent.change(screen.getByPlaceholderText('请输入手机号码'), { target: { value: '13900001111' } });

    fireEvent.click(screen.getByRole('button', { name: '保存' }));

    expect(await screen.findByText('常用联系人已超过上限(15人)')).toBeInTheDocument();
  });
});
