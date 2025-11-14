const { getServiceHours } = require('./serviceHours');

function getSiteMetadata() {
  return {
    logoText: '中国铁路12306',
    welcomeText: '欢迎登录12306',
    serviceHours: getServiceHours(),
    officialSafetyTip:
      '官方 APP 为“铁路12306”，目前铁路未授权其他网站或 APP 开展类似服务内容，请注意辨识。',
    friendLinks: [
      { name: '铁路12306', url: 'https://kyfw.12306.cn/' },
      { name: '中国铁路', url: 'https://www.china-railway.com.cn/' },
    ],
    compliance: {
      policeRecord: '京公网安备 XXXXXX 号',
      icpRecord: '京ICP备XXXXXX号-1',
    },
    accessibility: {
      elderlyServiceEntry: '/accessibility',
      description: '适老化无障碍服务入口说明',
    },
  };
}

module.exports = { getSiteMetadata };