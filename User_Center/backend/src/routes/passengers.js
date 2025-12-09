const db = require('../db');
const { validateIdCard18, convert15to18, validatePhone } = require('../utils/security');

async function getPassengers(userId, query) {
  if (!userId) return { status: 401, body: { error: 'UNAUTHORIZED' } };
  const keyword = query.name || '';
  const showFull = query.showFull === 'true';
  const list = await db.getPassengers(userId, keyword, showFull);
  return { status: 200, body: { passengers: list } };
}

async function getPassengerById(userId, id) {
  if (!userId) return { status: 401, body: { error: 'UNAUTHORIZED' } };
  const p = await db.getPassengerById(id, userId);
  if (!p) return { status: 404, body: { error: 'PASSENGER_NOT_FOUND' } };
  return { status: 200, body: p };
}

async function addPassenger(userId, body) {
  if (!userId) return { status: 401, body: { error: 'UNAUTHORIZED' } };
  const required = ['name', 'id_type', 'id_number', 'traveler_type', 'phone_number'];
  for (const f of required) {
    if (!body[f]) return { status: 400, body: { error: `MISSING_${f.toUpperCase()}` } };
  }
  
  const allowedTypes = ['成人', '儿童', '学生', '残疾军人'];
  if (!allowedTypes.includes(body.traveler_type)) {
    return { status: 400, body: { error: 'INVALID_TRAVELER_TYPE' } };
  }
  
  // Strict Validation
  if (body.id_type === '居民身份证') {
    let id = body.id_number;
    if (id.length === 15) {
       id = convert15to18(id);
       body.id_number = id; // Auto upgrade
    }
    if (!validateIdCard18(id)) {
       return { status: 400, body: { error: 'INVALID_ID_NUMBER_FORMAT', message: '身份证号码格式错误或无效' } };
    }
  }
  
  // Phone Validation
  const countryCode = body.phone_country_code || '+86';
  if (!validatePhone(countryCode, body.phone_number)) {
      return { status: 400, body: { error: 'INVALID_PHONE_FORMAT', message: '手机号格式错误' } };
  }
  
  if (!/^[\u4e00-\u9fa5a-zA-Z·.]+$/.test(body.name)) {
      return { status: 400, body: { error: 'INVALID_NAME_FORMAT' } };
  }
  
  const result = await db.addPassenger(userId, body);
  if (!result.ok) {
    if (result.error === 'LIMIT_REACHED') return { status: 403, body: { error: 'PASSENGER_LIMIT_EXCEEDED' } };
    if (result.error === 'DUPLICATE_PASSENGER') return { status: 409, body: { error: 'PASSENGER_ALREADY_EXISTS', message: '该证件号码已存在' } };
    return { status: 500, body: { error: 'INTERNAL_ERROR' } };
  }
  return { status: 201, body: result.passenger };
}

async function updatePassenger(userId, passengerId, body) {
  if (!userId) return { status: 401, body: { error: 'UNAUTHORIZED' } };
  const allowedUpdates = {};
  
  if (body.phone_number !== undefined) {
      const code = body.phone_country_code || '+86'; 
      // Note: If phone_country_code is not provided in update, we might need to fetch existing?
      // For simplicity, if only phone_number is updated, we assume +86 or we should require both?
      // Let's be safe: if country code provided, use it. If not, we can't strictly validate unless we fetch.
      // But usually updates send the full form data. 
      // Let's assume +86 if not provided for now or check if we can get the existing one.
      // Actually, looking at the code, we are building allowedUpdates.
      
      // Let's validate if provided.
      if (!validatePhone(code, body.phone_number)) {
          return { status: 400, body: { error: 'INVALID_PHONE_FORMAT', message: '手机号格式错误' } };
      }
      allowedUpdates.phone_number = body.phone_number;
  }
  if (body.phone_country_code !== undefined) allowedUpdates.phone_country_code = body.phone_country_code;
  
  if (body.traveler_type !== undefined) {
      const allowedTypes = ['成人', '儿童', '学生', '残疾军人'];
      if (!allowedTypes.includes(body.traveler_type)) {
        return { status: 400, body: { error: 'INVALID_TRAVELER_TYPE' } };
      }
      allowedUpdates.traveler_type = body.traveler_type;
  }

  // Pass identity fields to DB to handle specific restrictions (e.g. Self passenger)
  if (body.name !== undefined) allowedUpdates.name = body.name;
  if (body.id_type !== undefined) allowedUpdates.id_type = body.id_type;
  if (body.id_number !== undefined) allowedUpdates.id_number = body.id_number;
  
  const result = await db.updatePassenger(passengerId, userId, allowedUpdates);
  if (!result.ok) {
     if (result.error === 'NOT_FOUND') return { status: 404, body: { error: 'PASSENGER_NOT_FOUND' } };
     if (result.error === 'CANNOT_UPDATE_SELF_IDENTITY') return { status: 403, body: { error: 'CANNOT_UPDATE_SELF_IDENTITY', message: '关键身份信息需通过实名认证流程修改' } };
     return { status: 500, body: { error: 'INTERNAL_ERROR' } };
  }
  return { status: 200, body: result.passenger };
}

async function deletePassenger(userId, passengerId) {
  if (!userId) return { status: 401, body: { error: 'UNAUTHORIZED' } };
  const result = await db.deletePassenger(passengerId, userId);
  if (!result.ok) {
    if (result.error === 'NOT_FOUND') return { status: 404, body: { error: 'PASSENGER_NOT_FOUND' } };
    if (result.error === 'CANNOT_DELETE_SELF') return { status: 403, body: { error: 'CANNOT_DELETE_SELF', message: '该乘车人为系统自动添加，不可删除' } };
    return { status: 500, body: { error: 'INTERNAL_ERROR' } };
  }
  return { status: 204, body: {} };
}

module.exports = {
  getPassengers,
  getPassengerById,
  addPassenger,
  updatePassenger,
  deletePassenger,
};
