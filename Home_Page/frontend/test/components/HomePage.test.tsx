import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HomePage } from '../../src/components/HomePage';

describe('UI-HomePage', () => {
  // @InterfaceID: UI-HomePage
  // @AcceptanceCriteria: #1
  it('should render brand and welcome text on first paint', () => {
    render(<HomePage />);
    expect(screen.getByText(/欢迎登录12306|12306/i)).toBeInTheDocument();
  });

  // @InterfaceID: UI-HomePage
  // @AcceptanceCriteria: #2
  it('should display service hours text', () => {
    render(<HomePage />);
    expect(screen.getByText(/每日.*5:00.*次日1:00.*周二.*24:00/)).toBeInTheDocument();
  });

  // @InterfaceID: UI-HomePage
  // @AcceptanceCriteria: #3
  it('should display official safety tip about authorized app', () => {
    render(<HomePage />);
    expect(screen.getByText(/官方.*铁路12306.*未授权其他网站或APP/i)).toBeInTheDocument();
  });

  // @InterfaceID: UI-HomePage
  // @AcceptanceCriteria: #4
  it('should render five accessible buttons with names', () => {
    render(<HomePage />);
    ['登录注册','车票查询','订单管理','乘客管理','个人信息'].forEach(name => {
      expect(screen.getByRole('button', { name })).toBeInTheDocument();
    });
  });

  // @InterfaceID: UI-HomePage
  // @AcceptanceCriteria: #11
  it('should navigate to login/register when clicking button', async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    render(<HomePage onNavigate={onNavigate} />);
    await user.click(screen.getByRole('button', { name: '登录注册' }));
    expect(onNavigate).toHaveBeenCalledWith('/auth');
  });

  // @InterfaceID: UI-HomePage
  // @AcceptanceCriteria: #12
  it('should navigate to ticket search without login', async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    render(<HomePage onNavigate={onNavigate} />);
    await user.click(screen.getByRole('button', { name: '车票查询' }));
    expect(onNavigate).toHaveBeenCalledWith('/tickets/search');
  });

  // @InterfaceID: UI-HomePage
  // @AcceptanceCriteria: #5
  it('should intercept and prompt login for management buttons when not logged in', async () => {
    const user = userEvent.setup();
    const onLoginRequired = vi.fn();
    render(<HomePage onLoginRequired={onLoginRequired} />);
    for (const name of ['订单管理','乘客管理','个人信息']) {
      await user.click(screen.getByRole('button', { name }));
      expect(onLoginRequired).toHaveBeenCalled();
    }
  });

  // @InterfaceID: UI-HomePage
  // @AcceptanceCriteria: #6
  it('should navigate to management pages after login', async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    render(<HomePage onNavigate={onNavigate} />);
    await user.click(screen.getByRole('button', { name: '订单管理' }));
    expect(onNavigate).toHaveBeenCalledWith('/orders');
    await user.click(screen.getByRole('button', { name: '乘客管理' }));
    expect(onNavigate).toHaveBeenCalledWith('/passengers');
    await user.click(screen.getByRole('button', { name: '个人信息' }));
    expect(onNavigate).toHaveBeenCalledWith('/profile');
  });

  // @InterfaceID: UI-HomePage
  // @AcceptanceCriteria: #7
  it('should support keyboard navigation in defined order', async () => {
    render(<HomePage />);
    const order = ['登录注册','车票查询','订单管理','乘客管理','个人信息'].map(name =>
      screen.getByRole('button', { name })
    );
    expect(order.length).toBe(5);
  });

  // @InterfaceID: UI-HomePage
  // @AcceptanceCriteria: #8
  it('should stack vertically on small screens and keep min touch size', () => {
    render(<HomePage />);
    const container = screen.getByLabelText('HomePage');
    expect(container).toHaveClass('mobile-stack');
  });

  // @InterfaceID: UI-HomePage
  // @AcceptanceCriteria: #9
  it('should display friend links and compliance info in footer', () => {
    render(<HomePage />);
    expect(screen.getByText(/友情链接/)).toBeInTheDocument();
    expect(screen.getByText(/备案/)).toBeInTheDocument();
    expect(screen.getByText(/适老化无障碍服务/)).toBeInTheDocument();
  });

  // @InterfaceID: UI-HomePage
  // @AcceptanceCriteria: #10
  it('should show error feedback and retry/home actions on navigation failure', async () => {
    const onError = vi.fn();
    render(<HomePage onError={onError} />);
    const error = new Error('route failed');
    onError(error);
    expect(screen.getByRole('button', { name: '重试' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '返回首页' })).toBeInTheDocument();
  });
});