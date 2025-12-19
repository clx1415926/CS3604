function getServiceHours() {
  const daily = '购票相关业务每日5:00至次日1:00';
  const tuesday = '（周二为5:00至24:00）';
  return `${daily}${tuesday}`;
}

module.exports = { getServiceHours };
