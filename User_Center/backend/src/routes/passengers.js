const db = require('../db');

async function getPassengers(query) {
  const keyword = query.name || '';
  const showFull = query.showFull === 'true';
  const list = await db.getPassengers(keyword, showFull);
  return { status: 200, body: { passengers: list } };
}

async function getPassengerById(id) {
  const p = await db.getPassengerById(id);
  if (!p) return { status: 404, body: { error: 'PASSENGER_NOT_FOUND' } };
  return { status: 200, body: p };
}

async function addPassenger(body) {
  const required = ['name', 'id_type', 'id_number', 'traveler_type'];
  for (const f of required) {
    if (!body[f]) return { status: 400, body: { error: `MISSING_${f.toUpperCase()}` } };
  }
  
  const allowedTypes = ['成人', '儿童', '学生', '残疾军人'];
  if (!allowedTypes.includes(body.traveler_type)) {
    return { status: 400, body: { error: 'INVALID_TRAVELER_TYPE' } };
  }
  
  if (body.id_type === '居民身份证') {
    if (!/^\d{17}[\dXx]$/.test(body.id_number)) {
       return { status: 400, body: { error: 'INVALID_ID_NUMBER_FORMAT' } };
    }
  }
  
  if (!/^[\u4e00-\u9fa5a-zA-Z·.]+$/.test(body.name)) {
      return { status: 400, body: { error: 'INVALID_NAME_FORMAT' } };
  }
  
  const result = await db.addPassenger(body);
  if (!result.ok) {
    if (result.error === 'LIMIT_REACHED') return { status: 403, body: { error: 'PASSENGER_LIMIT_EXCEEDED' } };
    return { status: 500, body: { error: 'INTERNAL_ERROR' } };
  }
  return { status: 201, body: result.passenger };
}

async function updatePassenger(passengerId, body) {
  const allowedUpdates = {};
  if (body.phone_number !== undefined) allowedUpdates.phone_number = body.phone_number;
  if (body.phone_country_code !== undefined) allowedUpdates.phone_country_code = body.phone_country_code;
  if (body.traveler_type !== undefined) {
      const allowedTypes = ['成人', '儿童', '学生', '残疾军人'];
      if (!allowedTypes.includes(body.traveler_type)) {
        return { status: 400, body: { error: 'INVALID_TRAVELER_TYPE' } };
      }
      allowedUpdates.traveler_type = body.traveler_type;
  }
  
  const result = await db.updatePassenger(passengerId, allowedUpdates);
  if (!result.ok) {
     if (result.error === 'NOT_FOUND') return { status: 404, body: { error: 'PASSENGER_NOT_FOUND' } };
     return { status: 500, body: { error: 'INTERNAL_ERROR' } };
  }
  return { status: 200, body: result.passenger };
}

async function deletePassenger(passengerId) {
  const result = await db.deletePassenger(passengerId);
  if (!result.ok) {
    if (result.error === 'NOT_FOUND') return { status: 404, body: { error: 'PASSENGER_NOT_FOUND' } };
    if (result.error === 'CANNOT_DELETE_SELF') return { status: 403, body: { error: 'CANNOT_DELETE_SELF' } };
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
