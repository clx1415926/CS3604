const db = require('../src/db');
const fs = require('fs');
const path = require('path');

const ACCOUNTS_DB = path.resolve(__dirname, '../../../Login_Register_Page/backend/data/accounts.db');
const TEST_USER_ID = 'u-concurrency-test-' + Date.now();

// Helper to add test user to accounts.db
function addTestUser() {
  const user = {
    user_id: TEST_USER_ID,
    username: 'concurrency_test',
    name: '并发测试用户',
    id_number: '110101200001010001',
    phone_number: '13900009999',
    status: 'active'
  };
  fs.appendFileSync(ACCOUNTS_DB, JSON.stringify(user) + '\n');
}

// Helper to remove test user
function removeTestUser() {
  if (fs.existsSync(ACCOUNTS_DB)) {
    const content = fs.readFileSync(ACCOUNTS_DB, 'utf8');
    const lines = content.split('\n').filter(line => !line.includes(TEST_USER_ID));
    fs.writeFileSync(ACCOUNTS_DB, lines.join('\n'));
  }
}

describe('Concurrency Test', () => {
  beforeAll(() => {
    addTestUser();
  });

  afterAll(() => {
    removeTestUser();
  });

  test('should handle concurrent auto-creation requests gracefully', async () => {
    // Simulate 50 concurrent requests
    const requests = Array(50).fill(null).map(() => db.getPassengers(TEST_USER_ID));
    
    await Promise.all(requests);

    // Check how many passengers created for this user
    const userPassengers = await db.getPassengers(TEST_USER_ID);
    const selfPassengers = userPassengers.filter(p => p.is_self);

    expect(selfPassengers.length).toBe(1);
    expect(selfPassengers[0].name).toBe('并发测试用户');
  });
});
