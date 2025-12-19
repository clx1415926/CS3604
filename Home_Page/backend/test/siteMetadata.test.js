/**
 * 文件说明：测试首页元数据组装逻辑（getSiteMetadata），确保字段完整并正确组合服务时间。
 */

jest.mock('../src/data/serviceHours', () => {
  return {
    getServiceHours: jest.fn(() => 'MOCK_SERVICE_HOURS'),
  };
});

const { getSiteMetadata } = require('../src/data/siteMetadata');
const { getServiceHours } = require('../src/data/serviceHours');

describe('Feature: 首页元数据组装', () => {
  it('应返回包含品牌、欢迎语、服务时间与合规信息的结构（Happy Path）', () => {
    // 验证目标：作为“首页展示契约”，关键字段必须存在且类型正确
    const meta = getSiteMetadata();

    expect(getServiceHours).toHaveBeenCalledTimes(1);
    expect(meta).toEqual(
      expect.objectContaining({
        logoText: '中国铁路12306',
        welcomeText: '欢迎登录12306',
        serviceHours: 'MOCK_SERVICE_HOURS',
        officialSafetyTip: expect.any(String),
        friendLinks: expect.any(Array),
        compliance: expect.any(Object),
        accessibility: expect.any(Object),
      }),
    );
  });

  it('友情链接与无障碍字段应具备可用的最小信息（Edge Case）', () => {
    // 验证目标：前端可直接使用这些字段渲染链接与无障碍提示
    const meta = getSiteMetadata();

    expect(meta.friendLinks.length).toBeGreaterThan(0);
    expect(meta.friendLinks[0]).toEqual(
      expect.objectContaining({
        name: expect.any(String),
        url: expect.stringMatching(/^https?:\/\//),
      }),
    );

    expect(meta.accessibility).toEqual(
      expect.objectContaining({
        elderlyServiceEntry: expect.any(String),
        description: expect.any(String),
      }),
    );
  });
});

