import request from '@/utils/request'

// 查询BOM明细列表
export function listBomItem(query) {
  return request({
    url: '/manufacture/bomItem/list',
    method: 'get',
    params: query
  })
}

// 查询BOM明细详情
export function getBomItem(id) {
  return request({
    url: '/manufacture/bomItem/' + id,
    method: 'get'
  })
}

// 批量新增BOM明细
export function batchAddBomItem(data) {
  return request({
    url: '/manufacture/bomItem/batch',
    method: 'post',
    data: data
  })
}

// 修改BOM明细
export function updateBomItem(data) {
  return request({
    url: '/manufacture/bomItem',
    method: 'put',
    data: data
  })
}

// 单个删除BOM明细
export function delBomItem(id) {
  return request({
    url: '/manufacture/bomItem/' + id,
    method: 'delete'
  })
}

// 批量删除BOM明细
export function delBomItemBatch(ids) {
  const idStr = Array.isArray(ids) ? ids.join(',') : ids
  return request({
    url: '/manufacture/bomItem/batch/' + idStr,
    method: 'delete'
  })
}
