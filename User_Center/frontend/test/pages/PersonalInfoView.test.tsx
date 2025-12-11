import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import PersonalInfoView from '../../src/pages/PersonalInfoView';

// Mock fetch
global.fetch = vi.fn((url) => {
  const urlString = String(url);
  if (urlString.includes('/auth/session/account')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        username: 'bladewa7tz',
        name: '林瑞康',
        country: '中国China',
        id_type: '居民身份证',
        id_number_masked: '3101**********617',
        phone_country_code: '+86',
        phone_masked: '133****3768',
        email_masked: '',
        traveler_type: '成人',
        verified_status: 'VERIFIED'
      }),
    });
  }
  return Promise.reject('Unknown URL');
});

beforeEach(() => {
  localStorage.setItem('SESSION_ID', 'mock-sid');
  vi.clearAllMocks();
});

// @InterfaceID: UI-PersonalInfoView
// @AcceptanceCriteria: #1
test('should render three information sections with correct layout', async () => {
  render(<PersonalInfoView />);
  
  // Wait for data load
  await waitFor(() => {
      expect(screen.getByText('基本信息')).toBeInTheDocument();
  });
  
  expect(screen.getByText('联系方式')).toBeInTheDocument();
  expect(screen.getByText('附加信息')).toBeInTheDocument();
});

// @InterfaceID: UI-PersonalInfoView
// @AcceptanceCriteria: #2
test('should display basic info correctly', async () => {
  render(<PersonalInfoView />);
  await waitFor(() => screen.getByText('bladewa7tz'));

  expect(screen.getByText('林瑞康')).toBeInTheDocument();
  expect(screen.getByText('中国China')).toBeInTheDocument();
  expect(screen.getByText('居民身份证')).toBeInTheDocument();
  expect(screen.getByText('3101**********617')).toBeInTheDocument();
  expect(screen.getByText('已通过')).toBeInTheDocument();
});

// @InterfaceID: UI-PersonalInfoView
// @AcceptanceCriteria: #3
test('should display contact info and edit button', async () => {
  render(<PersonalInfoView />);
  await waitFor(() => screen.getByText((content) => content.includes('133****3768')));

  expect(screen.getByText((content) => content.includes('(+86) 133****3768'))).toBeInTheDocument();
  expect(screen.getByText('已通过核验')).toBeInTheDocument(); // The link

  // Find Edit buttons - there should be 2 (Contact and Additional)
  const editButtons = screen.getAllByText('编辑');
  expect(editButtons.length).toBeGreaterThanOrEqual(2);
  
  // Click the first edit button (Contact info)
  fireEvent.click(editButtons[0]);
  expect(screen.getByText('收起')).toBeInTheDocument();
  expect(screen.getByText('去手机核验更改 >')).toBeInTheDocument();
});
