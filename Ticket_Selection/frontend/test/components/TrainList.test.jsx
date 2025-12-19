import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TrainList from '../../src/components/TrainList';

// 车次列表：验证空态渲染、车次/席别展示、预订行为（未登录拦截/已登录跳转）
describe('Feature: Train list rendering and booking', () => {
  beforeEach(() => {
    localStorage.clear();
    window.location.hash = '';
  });

  // trains 为空时，应展示“没有符合条件的车次”提示
  test('should show empty state when trains is empty', () => {
    render(<TrainList trains={[]} />);
    expect(screen.getByText('没有符合条件的车次。')).toBeInTheDocument();
  });

  // 渲染车次行：应展示车次号、站点、起步价，以及“有票”样式的座位可用性
  test('should render train rows and seat availability', () => {
    const trains = [
      {
        date: '2025-12-15',
        trainNo: 'G101',
        fromStation: '北京南站',
        toStation: '上海虹桥站',
        departTime: '08:00',
        arriveTime: '13:28',
        duration: '5小时28分',
        seats: [
          { type: '商务座', count: '有', price: 1748 },
          { type: '一等座', count: '有', price: 933 },
          { type: '二等座', count: '有', price: 553 },
        ],
        startingPrice: 553,
      },
    ];
    render(<TrainList trains={trains} />);

    expect(screen.getByText('G101')).toBeInTheDocument();
    expect(screen.getByText('北京南站')).toBeInTheDocument();
    expect(screen.getByText('上海虹桥站')).toBeInTheDocument();
    expect(screen.getByText('¥553起')).toBeInTheDocument();
    expect(screen.getAllByText('有').length).toBeGreaterThan(0);
  });

  // 未登录点击“预订”时，应提示先登录，不进行跳转
  test('should require login before booking', async () => {
    const trains = [
      {
        date: '2025-12-15',
        trainNo: 'G101',
        fromStation: '北京南站',
        toStation: '上海虹桥站',
        departTime: '08:00',
        arriveTime: '13:28',
        duration: '5小时28分',
        seats: [{ type: '二等座', count: '有', price: 553 }],
        startingPrice: 553,
      },
    ];
    render(<TrainList trains={trains} />);

    fireEvent.click(screen.getByRole('button', { name: '预订' }));

    await waitFor(() => {
      expect(screen.getByText('请先登录后预订')).toBeInTheDocument();
    });
  });

  // 已登录点击“预订”时，应跳转到订单填写页（测试环境下写入 hash）
  test('should navigate to order-filling page when logged in', async () => {
    localStorage.setItem('SESSION_ID', 'sid-123');
    const trains = [
      {
        date: '2025-12-15',
        trainNo: 'G101',
        fromStation: '北京南站',
        toStation: '上海虹桥站',
        departTime: '08:00',
        arriveTime: '13:28',
        duration: '5小时28分',
        seats: [{ type: '二等座', count: '有', price: 553 }],
        startingPrice: 553,
      },
    ];
    render(<TrainList trains={trains} />);

    fireEvent.click(screen.getByRole('button', { name: '预订' }));

    await waitFor(() => {
      expect(window.location.hash).toContain('order-filling');
      expect(window.location.hash).toContain('trainNo=G101');
      expect(window.location.hash).toContain('fromStation=%E5%8C%97%E4%BA%AC%E5%8D%97%E7%AB%99');
      expect(window.location.hash).toContain('sid=sid-123');
    });
  });
});
