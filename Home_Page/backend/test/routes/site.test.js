const request = require('supertest');
const { app } = require('../../src/app');

describe('API-GET-HomeMetadata', () => {
  // @InterfaceID: API-GET-HomeMetadata
  // @AcceptanceCriteria: #1
  test('should return 200 and include serviceHours and officialSafetyTip', async () => {
    const res = await request(app).get('/api/site/metadata');
    expect(res.status).toBe(200);
    expect(typeof res.body.serviceHours).toBe('string');
    expect(res.body.serviceHours).toMatch(/每日.*5:00.*次日1:00.*周二.*24:00/);
    expect(typeof res.body.officialSafetyTip).toBe('string');
    expect(res.body.officialSafetyTip.length).toBeGreaterThan(0);
  });

  // @InterfaceID: API-GET-HomeMetadata
  // @AcceptanceCriteria: #2
  test('should include at least one railway official friend link', async () => {
    const res = await request(app).get('/api/site/metadata');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.friendLinks)).toBe(true);
    const names = res.body.friendLinks.map(x => x.name);
    expect(names.some(n => /铁路|12306|中国铁路/i.test(n))).toBe(true);
  });

  // @InterfaceID: API-GET-HomeMetadata
  // @AcceptanceCriteria: #3
  test('should include compliance policeRecord and icpRecord', async () => {
    const res = await request(app).get('/api/site/metadata');
    expect(res.status).toBe(200);
    expect(res.body.compliance).toBeDefined();
    expect(typeof res.body.compliance.policeRecord).toBe('string');
    expect(typeof res.body.compliance.icpRecord).toBe('string');
  });

  // @InterfaceID: API-GET-HomeMetadata
  // @AcceptanceCriteria: #4
  test('should include accessibility elderlyServiceEntry and description', async () => {
    const res = await request(app).get('/api/site/metadata');
    expect(res.status).toBe(200);
    expect(res.body.accessibility).toBeDefined();
    expect(typeof res.body.accessibility.elderlyServiceEntry).toBe('string');
    expect(typeof res.body.accessibility.description).toBe('string');
  });
});