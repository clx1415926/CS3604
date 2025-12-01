import '@testing-library/jest-dom'; 
import { cleanup } from '@testing-library/react';

// afterEach is global due to globals: true
afterEach(() => {
  cleanup();
});

