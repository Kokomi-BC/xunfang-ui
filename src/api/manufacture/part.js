import request from '@/utils/request'

// 查询部件管理列表
export function listPart(query) {
  return request({
    url: '/manufacture/part/list',
    method: 'get',
    params: query
  })
}

// 查询部件管理详细
export function getPart(id) {
  return request({
    url: '/manufacture/part/' + id,
    method: 'get'
  })
}

// 统一的 addPart：使用 FormData 提交 data(+file)
export function addPart(data, file) {
  const fd = new FormData()
  fd.append('data', new Blob([JSON.stringify(data)], { type: 'application/json' }))
  if (file) fd.append('file', file, file.name)
  return request({
    url: '/manufacture/part',
    method: 'post',
    data: fd,
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

// 修改部件管理（同样使用 FormData）
export function updatePart(data, file) {
  const fd = new FormData()
  fd.append('data', new Blob([JSON.stringify(data)], { type: 'application/json' }))
  if (file) fd.append('file', file, file.name)
  return request({
    url: '/manufacture/part',
    method: 'put',
    data: fd,
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

// 删除部件管理（masterIds 支持逗号分隔批量）
export function delPart(masterIds) {
  return request({
    url: '/manufacture/part/' + masterIds,
    method: 'delete'
  })
}

// 检出（仅需要 masterId）
export function checkOut(masterId) {
  return request({
    url: '/manufacture/part/checkout',
    method: 'put',
    data: { masterId, workCopyType: 'BOTH' }
  })
}

// 检入（仅需要 masterId）
export function checkIn(masterId) {
  return request({
    url: '/manufacture/part/checkin',
    method: 'put',
    data: { masterId }
  })
}

// 检出并修改
export function checkoutAndUpdate(data) {
  return request({
    url: '/manufacture/part/checkOutAndUpdateXfPart',
    method: 'put',
    data
  })
}
