
// Mock security utils
jest.mock('../../src/utils/security', () => {
  const original = jest.requireActual('../../src/utils/security');
  return {
    ...original,
    validateIdCard18: (id) => true,
    convert15to18: (id) => id,
    validatePhone: () => true
  };
});

const {
  getPassengers,
  addPassenger,
  updatePassenger,
  deletePassenger,
} = require('../../src/routes/passengers');

describe('Self Passenger Logic', () => {
  const USER_ID = 'u-super'; // System admin user who should have self passenger

  test('should auto-create self passenger on getPassengers if missing', async () => {
    // 1. Get list, ensure self exists
    const res = await getPassengers(USER_ID, {});
    expect(res.status).toBe(200);
    const self = res.body.passengers.find(p => p.is_self);
    expect(self).toBeDefined();
    expect(self.user_id).toBe(USER_ID);
    // Expect '张三' (default data) or '系统管理员' (auto-created from profile)
    expect(['张三', '系统管理员']).toContain(self.name); 
  });

  test('should allow updating non-critical info for self passenger', async () => {
    // Get self ID
    const listRes = await getPassengers(USER_ID, {});
    const self = listRes.body.passengers.find(p => p.is_self);
    
    // Update phone
    const updateRes = await updatePassenger(USER_ID, self.passenger_id, {
      phone_number: '13811112222'
    });
    
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.phone_number).toMatch(/138\*{4}2222/); // Masked response
  });

  test('should BLOCK updating critical info for self passenger', async () => {
    // Get self ID
    const listRes = await getPassengers(USER_ID, {});
    const self = listRes.body.passengers.find(p => p.is_self);
    
    // Try to update name
    const updateRes = await updatePassenger(USER_ID, self.passenger_id, {
      name: 'New Name'
    });
    
    expect(updateRes.status).toBe(403);
    expect(updateRes.body.error).toBe('CANNOT_UPDATE_SELF_IDENTITY');
    
    // Try to update ID number
    const updateRes2 = await updatePassenger(USER_ID, self.passenger_id, {
      id_number: '110101199001019999'
    });
    
    expect(updateRes2.status).toBe(403);
    expect(updateRes2.body.error).toBe('CANNOT_UPDATE_SELF_IDENTITY');
  });

  test('should BLOCK deleting self passenger', async () => {
    // Get self ID
    const listRes = await getPassengers(USER_ID, {});
    const self = listRes.body.passengers.find(p => p.is_self);
    
    const deleteRes = await deletePassenger(USER_ID, self.passenger_id);
    
    expect(deleteRes.status).toBe(403);
    expect(deleteRes.body.error).toBe('CANNOT_DELETE_SELF');
  });
});
