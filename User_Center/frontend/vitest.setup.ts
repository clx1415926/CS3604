import '@testing-library/jest-dom'; 
import { cleanup } from '@testing-library/react';

const baseFetch =
  (globalThis as any).fetch && typeof (globalThis as any).fetch.mockClear === 'function'
    ? (globalThis as any).fetch
    : ((globalThis as any).fetch = (vi as any).fn());

beforeEach(() => {
  (globalThis as any).fetch = baseFetch;
  if (baseFetch && typeof (baseFetch as any).mockClear === 'function') (baseFetch as any).mockClear();
});

// afterEach is global due to globals: true
afterEach(() => {
  cleanup();
  (globalThis as any).fetch = baseFetch;
  if (baseFetch && typeof (baseFetch as any).mockClear === 'function') (baseFetch as any).mockClear();
});
