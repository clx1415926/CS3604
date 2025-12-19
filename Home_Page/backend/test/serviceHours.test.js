/**
 * 文件说明：测试服务时间文案生成（getServiceHours），确保与业务规则一致。
 */

const { getServiceHours } = require('../src/data/serviceHours');

describe('Feature: 服务时间文案', () => {
  it('应包含购票业务的每日服务时间与周二特殊规则（Happy Path）', () => {
    // 验证目标：文案对外展示时必须包含两个关键信息段
    const txt = getServiceHours();

    expect(typeof txt).toBe('string');
    expect(txt).toContain('购票相关业务');
    expect(txt).toContain('每日');
    expect(txt).toContain('5:00');
    expect(txt).toContain('次日');
    expect(txt).toContain('周二');
    expect(txt).toContain('24:00');
  });

  it('不应返回空字符串（Edge Case）', () => {
    // 验证目标：避免前端渲染空白导致用户无法获知服务时间
    const txt = getServiceHours();
    expect(txt.trim().length).toBeGreaterThan(0);
  });
});

