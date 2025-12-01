const React = require('react');
const { render, screen, fireEvent, act } = require('@testing-library/react');
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
  await act(async () => { fireEvent.click(btn); });
  const msg = await screen.findByText('请先登录后预订');
  expect(msg).toBeInTheDocument();
});

test('sends booking request with Authorization header', async () => {
  const orig = global.fetch;
  global.fetch = jest.fn().mockResolvedValue({ status: 400, text: () => Promise.resolve('Bad') });
  window.localStorage.setItem('SESSION_ID', 'tok-A');
  render(React.createElement(TrainList, { trains: sampleTrains }));
  const btn = await screen.findByRole('button', { name: '预订' });
  await act(async () => { fireEvent.click(btn); });
  expect(global.fetch).toHaveBeenCalled();
  const orderArgs = global.fetch.mock.calls[1];
  expect(orderArgs[0]).toContain('/api/v1/orders');
  expect(orderArgs[1].headers.Authorization).toContain('Bearer tok-A');
  global.fetch = orig;
});

// @InterfaceID: UI-TrainList
// @AcceptanceCriteria: N/A
// @BugID: BUG-TS-BookingFlow-001
test('should route to passenger selection and seat selection before order submission - BUG-TS-BookingFlow-001 Regression', async () => {
  const origFetch = global.fetch;
  global.fetch = jest.fn().mockResolvedValue({ status: 400, text: () => Promise.resolve('Bad') });
  window.localStorage.setItem('SESSION_ID', 'tok-A');
  render(React.createElement(TrainList, { trains: sampleTrains }));
  const btn = await screen.findByRole('button', { name: '预订' });
  await act(async () => { fireEvent.click(btn); });
  expect(global.fetch).toHaveBeenCalled();
  const firstUrl = global.fetch.mock.calls[0][0];
  expect(firstUrl).toContain('/api/v1/seats/lock');
  global.fetch = origFetch;
});

// @InterfaceID: UI-TrainList
// @AcceptanceCriteria: N/A
// @BugID: BUG-TS-TrainMismatch-002
test('should navigate to order page with query parameters - BUG-TS-TrainMismatch-002 Regression', async () => {
  window.localStorage.setItem('SESSION_ID', 'sid-user-1');
  render(React.createElement(TrainList, { trains: sampleTrains }));
  const btn = await screen.findByRole('button', { name: '预订' });
  await act(async () => { fireEvent.click(btn); });
  expect(window.location.hash).toContain('#order-filling?');
  const qp = new URLSearchParams(window.location.hash.split('?')[1] || '');
  expect(qp.get('trainNo')).toBe('G101');
  expect(qp.get('fromStation')).toBe('北京南站');
  expect(qp.get('toStation')).toBe('上海虹桥站');
  expect(qp.get('date')).toBe('2025-12-15');
});