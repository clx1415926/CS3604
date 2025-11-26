const db = require('../../src/db/index');

// @InterfaceID: DB-MaskPII
// @AcceptanceCriteria: #1
test('should mask ID number showing first 4 and last 3', () => {
  const masked = db.maskPII({ id_number: '430112199912345014' });
  expect(masked.id_number_masked).toMatch(/^\d{4}\*+\d{3}$/);
});

// @InterfaceID: DB-MaskPII
// @AcceptanceCriteria: #2
test('should mask phone number with country code, first3, ****, last4', () => {
  const masked = db.maskPII({ phone_country_code: '+86', phone_number: '13812347076' });
  expect(masked.phone_number_masked).toBe('(+86) 138****7076');
});

// @InterfaceID: DB-MaskPII
// @AcceptanceCriteria: #3
test('should mask email showing first2 and domain', () => {
  const masked = db.maskPII({ email: '24abcdef78@qq.com' });
  expect(masked.email_masked).toBe('24******78@qq.com');
});

// @InterfaceID: DB-GetCountryCallingCodes
// @AcceptanceCriteria: #1
test('should return country codes list including +86', async () => {
  const res = await db.getCountryCallingCodes();
  expect(res.codes).toEqual(expect.arrayContaining([expect.objectContaining({ code: '+86' })]));
});
