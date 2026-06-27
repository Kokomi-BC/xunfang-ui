import request from '@/utils/request'

// 查询产品族列表
export function listFamily(query) {
  return request({
    url: '/manufacture/family/list',
    method: 'get',
    params: query
  })
}

// 查询产品族详细
export function getFamily(id) {
  return request({
    url: '/manufacture/family/' + id,
    method: 'get'
  })
}

// 新增产品族
export function addFamily(data) {
  return request({
    url: '/manufacture/family',
    method: 'post',
    data: data
  })
}

// 修改产品族
export function updateFamily(data) {
  return request({
    url: '/manufacture/family',
    method: 'put',
    data: data
  })
}

// 单个删除产品族
export function delFamily(id) {
  return request({
    url: '/manufacture/family/delete/' + id,
    method: 'delete'
  })
}

// 批量删除产品族
export function batchDelFamily(ids) {
  if (!Array.isArray(ids)) ids = [ids]
  const safeIds = ids.map(i => (i === null || i === undefined ? '' : String(i).trim())).filter(Boolean)
  if (safeIds.length === 0) {
    return Promise.reject(new Error('没有可删除的 id'))
  }
  return request({
    url: '/manufacture/family/' + safeIds.join(','),
    method: 'delete'
  })
}
