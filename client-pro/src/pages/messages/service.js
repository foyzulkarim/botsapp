import { get, post, put, del } from '/src/services/http-service';

export async function search(params) {
  return await post('/api/messages/search', params);
}

export async function count(params, options) {
  return await post('/api/messages/count', params, options);
}

export async function getById(id, options) {
  return await get(`/api/messages/detail?id=${id}`, {}, options);
}

export async function update(params) {
  return await put('/api/messages/update', params);
}

export async function save(params) {
  return await post('/api/messages/create', params);
}

export async function remove(id, options) {
  return await del(`/api/messages/delete?id=${id}`, {}, options);
}

export async function searchPhone(params) {
  return await post('/api/phones/search', params);
}
