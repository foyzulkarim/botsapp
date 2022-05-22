import { get, post, put, del } from '/src/services/http-service';

export async function search(params) {
  return await post('/api/botengines/search', params);
}

export async function count(params, options) {
  return await post('/api/botengines/count', params, options);
}

export async function getById(id, options) {
  return await get(`/api/botengines/detail?id=${id}`, {}, options);
}

export async function update(params) {
  return await put('/api/botengines/update', params);
}

export async function save(params) {
  return await post('/api/botengines/create', params);
}

export async function remove(id, options) {
  return await del(`/api/botengines/delete?id=${id}`, {}, options);
}

export async function searchPhone(params) {
  return await post('/api/phones/search', params);
}