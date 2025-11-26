const {
  getUserProfile,
  patchTravelerType,
  getPhoneVerificationContext,
  postPhoneChange,
  getCountryCodes,
} = require('../../src/routes/profile');

// @InterfaceID: API-GET-UserProfile
// @AcceptanceCriteria: #1
test('should return three sections with masked fields', async () => {
  const res = await getUserProfile();
  expect(res.status).toBe(200);
  expect(res.body.basic_info).toBeDefined();
  expect(res.body.contact_info).toBeDefined();
  expect(res.body.additional_info).toBeDefined();
  expect(res.body.basic_info.id_number_masked).toMatch(/\*/);
  expect(res.body.contact_info.phone_number_masked).toMatch(/\*/);
  expect(res.body.contact_info.email_masked).toMatch(/\*/);
});

// @InterfaceID: API-GET-UserProfile
// @AcceptanceCriteria: #2
test('should align fields with UI and no edit controls in basic info', async () => {
  const res = await getUserProfile();
  expect(Object.keys(res.body.basic_info)).toEqual(
    expect.arrayContaining(['name', 'country_region', 'id_type', 'id_number_masked', 'id_verified_status'])
  );
  expect(res.body.basic_info.editable).toBeFalsy();
});

// @InterfaceID: API-PATCH-TravelerType
// @AcceptanceCriteria: #1
test('should accept four traveler types and return 200 with success message', async () => {
  const res = await patchTravelerType({ traveler_type: '学生' });
  expect(res.status).toBe(200);
  expect(res.body.success).toBe(true);
  expect(res.body.traveler_type).toBe('学生');
  expect(res.body.message).toBe('修改成功');
});

// @InterfaceID: API-GET-PhoneVerificationContext
// @AcceptanceCriteria: #1
test('should return masked original phone and verification status', async () => {
  const res = await getPhoneVerificationContext();
  expect(res.status).toBe(200);
  expect(res.body.phone_number_masked).toMatch(/\*{4}/);
  expect(res.body.phone_verified_status).toBeDefined();
});

// @InterfaceID: API-POST-PhoneChange
// @AcceptanceCriteria: #1
test('should require correct password and validate phone format', async () => {
  const wrongPassword = await postPhoneChange({ phone_country_code: '+86', phone_number: '12345', login_password: 'wrong' });
  expect(wrongPassword.status).toBe(401);
  const invalidPhone = await postPhoneChange({ phone_country_code: '+86', phone_number: '12345', login_password: 'CorrectPass1!' });
  expect(invalidPhone.status).toBe(400);
});

// @InterfaceID: API-POST-PhoneChange
// @AcceptanceCriteria: #2
test('should reject same-as-old phone and return 422; occupied returns 409', async () => {
  const sameAsOld = await postPhoneChange({ phone_country_code: '+86', phone_number: '13800000000', login_password: 'CorrectPass1!' });
  expect(sameAsOld.status).toBe(422);
  const taken = await postPhoneChange({ phone_country_code: '+86', phone_number: '13900139000', login_password: 'CorrectPass1!' });
  expect(taken.status).toBe(409);
});

// @InterfaceID: API-POST-PhoneChange
// @AcceptanceCriteria: #3
test('should succeed and return masked new phone, then redirect to profile', async () => {
  const res = await postPhoneChange({ phone_country_code: '+86', phone_number: '13900139000', login_password: 'CorrectPass1!' });
  expect(res.status).toBe(200);
  expect(res.body.success).toBe(true);
  expect(res.body.phone_number_masked).toMatch(/\*{4}/);
  expect(res.redirect_to).toBe('/otn/view/information.html');
});

// @InterfaceID: API-GET-CountryCodes
// @AcceptanceCriteria: #1
test('should include +86 in country calling codes', async () => {
  const res = await getCountryCodes();
  expect(res.status).toBe(200);
  expect(res.body.codes).toEqual(expect.arrayContaining([expect.objectContaining({ code: '+86' })]));
});
