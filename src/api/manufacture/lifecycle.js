import request from "@/utils/request"

// 生命周期模板列表
export function listLifecycleTemplates(params) {
  return request({
    url: "/manufacture/lifecycle/lifecycleTemplateList",
    method: "get",
    params
  })
}

/**
 * 获取业务操作列表
 * @param {string} templateId
 * @param {string} operation  create / edit / checkout / checkin
 * @param {string} stateId    可选
 */
export function getLifecycleBusiness({ templateId, operation = "create", stateId = "" }) {
  return request({
    url: "/manufacture/lifecycle/lifeBusinessList",
    method: "get",
    params: { templateId, operation, stateId }
  })
}

/**
 * 获取生命周期状态列表
 */
export function getLifecycleStates({ templateId, businessOperationId, stateId = "", operation }) {
  return request({
    url: "/manufacture/lifecycle/lifeState",
    method: "get",
    params: { templateId, businessOperationId, stateId, operation }
  })
}
