const React = require('react');
const { render, screen, fireEvent } = require('@testing-library/react');
const TrainList = require('../../src/components/TrainList').default || require('../../src/components/TrainList');

const sampleTrains = [{
  date: '2025-12-15',
  trainNo: 'G101',
  fromStation: '北京南站',
  toStation: '上海虹桥站',
  departTime: '08:00',
  arriveTime: '13:28',
  duration: '5小时28分',
  seats: [{ type: '二等座', count: '有', price: 553 }],
  startingPrice: 553,
}];

test('shows friendly error when booking without login', async () => {
  render(React.createElement(TrainList, { trains: sampleTrains }));
  const btn = await screen.findByRole('button', { name: '预订' });
  fireEvent.click(btn);
  const msg = await screen.findByText('请先登录后预订');
  expect(msg).toBeInTheDocument();
});

test('sends booking request with Authorization and handles success', async () => {
  const orig = global.fetch;
  global.fetch = jest.fn().mockResolvedValue({ status: 201, text: () => Promise.resolve('') });
  const setHref = jest.fn();
  delete window.location;
  window.location = { href: '', assign: setHref };
  Object.defineProperty(window, 'location', { writable: true, value: window.location });
  window.localStorage.setItem('SESSION_ID', 'tok-A');
  render(React.createElement(TrainList, { trains: sampleTrains }));
  const btn = await screen.findByRole('button', { name: '预订' });
  fireEvent.click(btn);
  expect(global.fetch).toHaveBeenCalled();
  const args = global.fetch.mock.calls[0];
  expect(args[0]).toContain('/api/v1/orders');
  expect(args[1].headers.Authorization).toContain('Bearer tok-A');
  global.fetch = orig;
});