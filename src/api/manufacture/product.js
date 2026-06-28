import request from '@/utils/request'

// 小工具：判断是否 FormData
const isFormData = (v) => typeof FormData !== 'undefined' && v instanceof FormData

// 列表
export function listProduct(query) {
  return request({
    url: '/manufacture/product/list',
    method: 'get',
    params: query
  })
}

// 详情
export function getProduct(id) {
  return request({
    url: '/manufacture/product/' + id,
    method: 'get'
  })
}

/**
 * 新增（支持两种用法）
 * 1) addProduct(formData)                    // 直接传 FormData
 * 2) addProduct(jsonData, rawFile)           // 传普通对象 + 文件，函数自动拼 FormData
 */
export function addProduct(data, file) {
  return sendWithOptionalFile({ url: '/manufacture/product', method: 'post', data, file })
}

/**
 * 修改（支持两种用法）
 * 1) updateProduct(formData)
 * 2) updateProduct(jsonData, rawFile)
 */
export function updateProduct(data, file) {
  return sendWithOptionalFile({ url: '/manufacture/product', method: 'put', data, file })
}

/**
 * 单个删除
 */
export function delProduct(masterId) {
  return request({
    url: '/manufacture/product/delete/' + masterId,
    method: 'delete'
  })
}

/**
 * 批量删除
 */
export function delProductBatch(masterIds) {
  const ids = Array.isArray(masterIds) ? masterIds.join(',') : masterIds
  return request({
    url: '/manufacture/product/batch/' + ids,
    method: 'delete'
  })
}

/**
 * 检出
 */
export function checkOut(data) {
  return request({
    url: '/manufacture/product/checkout',
    method: 'put',
    data
  })
}

/**
 * 检入
 */
export function checkIn(data) {
  return request({
    url: '/manufacture/product/checkin',
    method: 'put',
    data
  })
}

/**
 * 状态更新
 */
export function updateStatus(data) {
  return request({
    url: '/manufacture/product/updateStatus',
    method: 'put',
    data
  })
}

/** 统一工具：有文件或已是 FormData 就走 multipart；否则走 JSON */
function sendWithOptionalFile({ url, method, data, file }) {
  // 1) 已经是 FormData：直接发
  if (isFormData(data)) {
    return request({ url, method, data })
  }
  // 2) 传了原始文件：拼 FormData
  if (file) {
    const fd = new FormData()
    fd.append('data', new Blob([JSON.stringify(data || {})], { type: 'application/json' }))
    fd.append('file', file, file.name)
    return request({ url, method, data: fd })
  }
  // 3) 纯 JSON
  return request({ url, method, data })
}
