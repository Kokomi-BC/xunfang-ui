import request from '@/utils/request'

// 查询BOM列表
export function listBom(query) {
  return request({
    url: '/manufacture/bom/list',
    method: 'get',
    params: query
  })
}

// 查询BOM详情
export function getBom(id) {
  return request({
    url: '/manufacture/bom/' + id,
    method: 'get'
  })
}

// 新增BOM
export function addBom(data) {
  return request({
    url: '/manufacture/bom',
    method: 'post',
    data: data
  })
}

// 修改BOM
export function updateBom(data) {
  return request({
    url: '/manufacture/bom',
    method: 'put',
    data: data
  })
}

// 检出BOM
export function checkoutBom(data) {
  return request({
    url: '/manufacture/bom/checkout',
    method: 'put',
    data: data
  })
}

// 检入BOM
export function checkinBom(data) {
  return request({
    url: '/manufacture/bom/checkin',
    method: 'put',
    data: data
  })
}

// 单个删除BOM（按masterId）
export function delBom(masterId) {
  return request({
    url: '/manufacture/bom/delete/' + masterId,
    method: 'delete'
  })
}

// 批量删除BOM
export function delBomBatch(masterIds) {
  const ids = Array.isArray(masterIds) ? masterIds.join(',') : masterIds
  return request({
    url: '/manufacture/bom/batch/' + ids,
    method: 'delete'
  })
}
