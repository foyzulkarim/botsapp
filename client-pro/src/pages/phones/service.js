import { get, post, put, del } from '/src/services/http-service';

export async function search(params) {
  return await post('/api/phones/search', params);
}

export async function count(params, options) {
  return await post('/api/phones/count', params, options);
}

export async function getById(id, options) {
  return await get(`/api/phones/detail?id=${id}`, {}, options);
}

export async function update(params) {
  return await put('/api/phones/update', params);
}

export async function save(params) {
  return await post('/api/phones/create', params);
}

export async function remove(id, options) {
  return await del(`/api/phones/delete?id=${id}`, {}, options);
}
