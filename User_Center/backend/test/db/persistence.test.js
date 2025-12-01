const db = require('../../src/db/index');
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../../src/db/data.json');

describe('Persistence', () => {
  test('should persist new passenger to disk', async () => {
    // 1. Add passenger
    const newPassenger = {
      name: 'PersistenceTestUser',
      id_type: '居民身份证',
      id_number: '110101199001011234',
      phone_country_code: '+86',
      phone_number: '13900009999',
      traveler_type: '成人',
    };
    const result = await db.addPassenger(newPassenger);
    expect(result.ok).toBe(true);
    const pid = result.passenger.passenger_id;

    // 2. Read file directly
    const fileContent = fs.readFileSync(DATA_FILE, 'utf8');
    const data = JSON.parse(fileContent);

    // 3. Verify passenger in file
    const savedPassenger = data.passengers.find(p => p.passenger_id === pid);
    expect(savedPassenger).toBeDefined();
    expect(savedPassenger.name).toBe('PersistenceTestUser');

    // 4. Delete passenger
    await db.deletePassenger(pid);

    // 5. Verify removal from file
    const fileContentAfter = fs.readFileSync(DATA_FILE, 'utf8');
    const dataAfter = JSON.parse(fileContentAfter);
    const deletedPassenger = dataAfter.passengers.find(p => p.passenger_id === pid);
    expect(deletedPassenger).toBeUndefined();
  });

  test('should handle concurrent additions correctly', async () => {
    const COUNT = 10;
    const promises = [];
    for (let i = 0; i < COUNT; i++) {
      promises.push(db.addPassenger({
        name: `ConcurrentUser${i}`,
        id_type: '居民身份证',
        id_number: `11010119900101100${i}`,
        phone_country_code: '+86',
        phone_number: `1390000000${i}`,
        traveler_type: '成人',
      }));
    }
    
    await Promise.all(promises);

    // Verify in-memory state
    const passengers = await db.getPassengers('ConcurrentUser', true);
    expect(passengers.length).toBe(COUNT);

    // Verify file persistence
    const fileContent = fs.readFileSync(DATA_FILE, 'utf8');
    const data = JSON.parse(fileContent);
    const savedConcurrentUsers = data.passengers.filter(p => p.name.startsWith('ConcurrentUser'));
    expect(savedConcurrentUsers.length).toBe(COUNT);
    
    // Cleanup
    for (const p of savedConcurrentUsers) {
      await db.deletePassenger(p.passenger_id);
    }
  });
});
