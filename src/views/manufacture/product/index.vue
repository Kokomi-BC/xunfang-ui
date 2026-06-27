<template>
  <div class="app-container">
    <!-- 搜索区域 -->
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="100px">
      <el-form-item label="产品名称" prop="productName">
        <el-input v-model="queryParams.productName" placeholder="请输入产品名称" clearable @keyup.enter="handleQuery" />
      </el-form-item>

      <!-- 产品族：远程下拉 -->
      <el-form-item label="产品族名称" prop="productFamily">
        <el-select
          v-model="queryParams.productFamily"
          placeholder="请选择产品族"
          filterable remote clearable reserve-keyword
          :remote-method="remoteMethodFamily"
          :loading="familyLoading"
          style="width: 220px;"
        >
          <el-option
            v-for="f in familyOptions"
            :key="f.id"
            :label="f.productFamilyNameCn"
            :value="f.productFamilyNameCn"
          />
        </el-select>
      </el-form-item>

      <!-- 产品类别 -->
      <el-form-item label="产品类别" prop="category">
        <el-select v-model="queryParams.category" placeholder="请选择" clearable style="width: 120px;">
          <el-option v-for="op in categoryDict" :key="op.value" :label="op.label" :value="op.value" />
        </el-select>
      </el-form-item>

      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 工具栏 -->
    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="primary" plain icon="Plus" @click="handleAdd">新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger" plain icon="Delete"
          :disabled="multiple || hasCheckedOutSelected"
          @click="handleBatchDelete"
        >删除</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" />
    </el-row>

    <!-- 表格 -->
    <el-table v-loading="loading" :data="productList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column v-if="false" label="id" align="center" prop="id" />
      <el-table-column width="28" align="center">
        <template #default="{ row }">
          <el-icon v-if="wsCode(row)==='CHECKED_OUT'" class="lock-red"><Lock /></el-icon>
        </template>
      </el-table-column>

      <el-table-column label="产品编码" width="160" align="center">
        <template #default="{ row }"><div class="wrap-scroll">PO{{ row.id }}</div></template>
      </el-table-column>
      <el-table-column label="产品名称" width="220" align="center">
        <template #default="{ row }"><div class="wrap-scroll">{{ row.productName }}</div></template>
      </el-table-column>
      <el-table-column label="产品族" width="180" align="center">
        <template #default="{ row }"><div class="wrap-scroll">{{ row.productFamily }}</div></template>
      </el-table-column>
      <el-table-column label="产品类别" width="110" align="center">
        <template #default="{ row }">{{ categoryLabel(row.category) }}</template>
      </el-table-column>
      <el-table-column label="产品版本" width="100" align="center" prop="displayVersion" />
      <el-table-column label="产品规格" prop="specificationModels" width="200" align="center" show-overflow-tooltip />
      <el-table-column label="生命周期状态" width="120" align="center">
        <template #default="{ row }"><el-tag :type="lcTag(lcName(row))">{{ lcName(row) }}</el-tag></template>
      </el-table-column>
      <el-table-column label="产品文件" width="140" align="center">
        <template #default="{ row }">
          <el-link
            v-if="row.fileNameNoExt && row.fileDownloadUrl"
            type="primary" :underline="true"
            @click="downloadFile(row)"
          >{{ row.fileNameNoExt }}</el-link>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="产品描述" prop="productDescribe" width="220" align="center" show-overflow-tooltip />
      <el-table-column label="创建日期" align="center" prop="createTime" width="180">
        <template #default="scope">
          <span>{{ parseTime(scope.row.createTime, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>

      <!-- 操作 -->
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="360">
        <template #default="{ row }">
          <template v-if="wsCode(row)==='CHECKED_IN'">
            <el-button link type="primary" icon="Upload" @click="openFlowDlg('checkout', row)">检出</el-button>
            <el-button link type="danger" icon="Delete" @click="handleSingleDelete(row)">删除</el-button>
          </template>
          <template v-else-if="wsCode(row)==='CHECKED_OUT'">
            <el-button link type="primary" icon="Edit" @click="handleUpdate(row)">修改</el-button>
            <el-button link type="success" icon="Download" @click="openFlowDlg('checkin', row)">检入</el-button>
          </template>
          <!-- 更新生命周期状态：始终可见 -->
          <el-button link type="warning" icon="Edit" @click="openStatusDlg(row)">更新状态</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination
      v-show="total > 0"
      :total="total"
      v-model:page="queryParams.pageNum"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />

    <!-- 新增或修改弹窗 -->
    <el-dialog :title="title" v-model="open" width="760px" append-to-body>
      <el-form ref="productRef" :model="form" :rules="rules" label-width="120px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="产品名称" prop="productName">
              <el-input v-model="form.productName" placeholder="请输入产品名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="产品族" prop="productFamily">
              <el-select
                v-model="form.productFamily"
                placeholder="请选择产品族"
                filterable remote clearable reserve-keyword
                :remote-method="remoteMethodFamily"
                :loading="familyLoading"
              >
                <el-option
                  v-for="f in familyOptions"
                  :key="f.id"
                  :label="f.productFamilyNameCn"
                  :value="f.productFamilyNameCn"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="产品类别" prop="category">
              <el-select v-model="form.category" placeholder="请选择产品类别">
                <el-option v-for="op in categoryDict" :key="op.value" :label="op.label" :value="op.value" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="产品规格" prop="specificationModels">
              <el-input v-model="form.specificationModels" placeholder="请输入产品规格" />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 新增（create）联动区 -->
        <el-row v-if="!form.id" :gutter="20">
          <el-col :span="24">
            <el-form-item label="生命周期模板" prop="lifecycleTemplateId" :required="isCreate">
              <el-select
                v-model="form.lifecycleTemplateId"
                placeholder="请选择生命周期模板"
                filterable clearable
                :loading="lifeTplLoading"
                @visible-change="v => v && loadLifecycleTemplates()"
                @change="onTemplateChange"
                style="width: 100%"
              >
                <el-option
                  v-for="tpl in lifecycleTemplateOptions"
                  :key="tpl.id"
                  :label="tpl.name || tpl.businessCode || tpl.id"
                  :value="tpl.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row v-if="!form.id" :gutter="20">
          <el-col :span="12">
            <el-form-item label="业务操作" prop="operation" :required="isCreate">
              <el-select
                v-model="form.operation"
                placeholder="请选择业务操作"
                :disabled="!form.lifecycleTemplateId"
                :loading="lifeOpLoading"
                @change="onOperationChange"
              >
                <el-option
                  v-for="op in createBizOptions"
                  :key="op.id || op.operation || op.name"
                  :label="op.name || op.operation || '创建'"
                  :value="op.operation || 'create'"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="目标生命周期状态" prop="lifecycleStateId" :required="isCreate">
              <el-select
                v-model="form.lifecycleStateId"
                placeholder="请选择状态"
                :disabled="!form.operation"
                :loading="lifeStateLoading"
                clearable
                @change="onStatePicked"
              >
                <el-option
                  v-for="st in lifecycleStateOptions"
                  :key="st.id"
                  :label="st.name || st.internalName || st.description || st.businessCode"
                  :value="st.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 文件上传 -->
        <el-form-item label="产品文件">
          <el-upload
            ref="uploadRef"
            class="upload-one wide"
            :auto-upload="false"
            :multiple="false"
            list-type="text"
            :file-list="fileList"
            :before-upload="handleBeforeAdd"
            :on-change="onFileChange"
            :on-remove="onFileRemove"
            accept=".png,.jpg,.jpeg,.gif,.bmp,.webp,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
          >
            <el-button type="primary">选择文件</el-button>
            <template #tip v-if="!fileList.length">
              <div class="el-upload__tip">请选择小于 5MB 的图片或文档（png/jpg/pdf/word/excel/ppt/txt）</div>
            </template>
          </el-upload>
        </el-form-item>

        <el-form-item label="产品描述" prop="productDescribe">
          <el-input
            type="textarea"
            v-model="form.productDescribe"
            placeholder="请输入产品描述"
            :autosize="{ minRows: 3, maxRows: 8 }"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 检出/检入弹窗 -->
    <el-dialog :title="flowDlg.mode==='checkout' ? '检出' : '检入'" v-model="flowDlg.open" width="560px" append-to-body>
      <el-form ref="flowFormRef" :model="flowDlg.form" :rules="flowRules" label-width="110px">
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="生命周期模板">
              <el-select v-model="flowDlg.form.lifecycleTemplateId" disabled style="width:100%">
                <el-option
                  v-for="tpl in flowDlg.tplOptions"
                  :key="tpl.id"
                  :label="tpl.name || tpl.businessCode || tpl.id"
                  :value="tpl.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="业务操作" prop="businessOperationId" required>
              <el-select
                v-model="flowDlg.form.businessOperationId"
                placeholder="请选择业务操作"
                :loading="flowDlg.loading.business"
                @change="onBizChange"
                style="width:100%"
              >
                <el-option
                  v-for="bo in flowDlg.bizOptions"
                  :key="bo.id"
                  :label="bo.name || bo.operation || bo.id"
                  :value="bo.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="目标生命周期状态" prop="lifecycleStateId" required>
              <el-select
                v-model="flowDlg.form.lifecycleStateId"
                placeholder="请选择状态"
                :loading="flowDlg.loading.states"
                style="width:100%"
              >
                <el-option
                  v-for="st in flowDlg.stateOptions"
                  :key="st.id"
                  :label="st.name || st.internalName || st.description || st.businessCode"
                  :value="st.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button type="primary" @click="confirmFlowDlg">确 定</el-button>
        <el-button @click="flowDlg.open=false">取 消</el-button>
      </template>
    </el-dialog>

    <!-- 更新状态弹窗 -->
    <el-dialog title="更新状态" v-model="statusDlg.open" width="560px" append-to-body>
      <el-form ref="statusFormRef" :model="statusDlg.form" :rules="statusRules" label-width="110px">
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="生命周期模板">
              <el-select v-model="statusDlg.form.lifecycleTemplateId" disabled style="width:100%">
                <el-option
                  v-for="tpl in statusDlg.tplOptions"
                  :key="tpl.id"
                  :label="tpl.name || tpl.businessCode || tpl.id"
                  :value="tpl.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="业务操作" prop="businessOperationId" required>
              <el-select
                v-model="statusDlg.form.businessOperationId"
                placeholder="请选择"
                :loading="statusDlg.loading.business"
                @change="onStatusBizChange"
                style="width:100%"
              >
                <el-option
                  v-for="bo in statusDlg.bizOptions"
                  :key="bo.id || bo.operation"
                  :label="bo.name || bo.operation || bo.id"
                  :value="bo.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="目标生命周期状态" prop="lifecycleStateId" required>
              <el-select
                v-model="statusDlg.form.lifecycleStateId"
                placeholder="请选择"
                :disabled="!statusDlg.form.businessOperationId"
                :loading="statusDlg.loading.states"
                style="width:100%"
              >
                <el-option
                  v-for="st in statusDlg.stateOptions"
                  :key="st.id"
                  :label="st.name || st.internalName || st.description || st.businessCode"
                  :value="st.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button type="primary" @click="confirmStatusDlg">确 定</el-button>
        <el-button @click="statusDlg.open=false">取 消</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="Product">
import { ref, reactive, toRefs, getCurrentInstance, computed } from "vue"
import { ElMessage } from "element-plus"
import {
  listProduct, getProduct, addProduct, updateProduct,
  delProduct, delProductBatch,
  checkOut as checkoutProduct, checkIn as checkinProduct,
  updateStatus
} from "@/api/manufacture/product"
import { listFamily } from "@/api/manufacture/productfamily"
import { downloadWithAxios } from "@/utils/download-axios-clean"
import {
  listLifecycleTemplates,
  getLifecycleBusiness,
  getLifecycleStates
} from "@/api/manufacture/lifecycle"

const { proxy } = getCurrentInstance()

/** 列表与分页 */
const productList = ref([])
const loading = ref(true)
const showSearch = ref(true)
const ids = ref([])
const single = ref(true)
const multiple = ref(true)
const total = ref(0)
const title = ref("")
const open = ref(false)

/** 选择集里是否包含检出数据（用于批量删除禁用） */
const hasCheckedOutSelected = ref(false)
const selectedRows = ref([])

/** 生命周期（创建用） */
const lifecycleTemplateOptions = ref([])
const lifecycleStateOptions = ref([])
const lifeTplLoading = ref(false)
const lifeOpLoading = ref(false)
const lifeStateLoading = ref(false)

/** 仅新增用：create 操作返回 */
const createBizOptions = ref([])

/** 字典 */
const categoryDict = [
  { label: "定制", value: "CU" },
  { label: "标准", value: "ST" }
]

/** ------- 工具函数 ------- **/
const parseMaybeJson = (val) => {
  if (typeof val === "string") {
    const s = val.trim()
    if ((s.startsWith("{") && s.endsWith("}")) || (s.startsWith("[") && s.endsWith("]"))) {
      try { return JSON.parse(s) } catch (e) {}
    }
  }
  return val
}
const codeOfCategory = (val) => {
  const v = parseMaybeJson(val)
  if (!v) return null
  if (typeof v === "string") return v
  return v.alias || v.code || v.value || null
}
const categoryLabel = (val) => {
  const v = parseMaybeJson(val)
  if (v && typeof v === "object") {
    const code = v.alias || v.code
    const hit = categoryDict.find(x => x.value === code)
    return hit ? hit.label : (v.cnName || v.enName || code || "-")
  } else {
    const hit = categoryDict.find(x => x.value === v)
    return hit ? hit.label : (v || "-")
  }
}
const lcName = (row) => {
  if (row.lifecycleStateName) return row.lifecycleStateName
  const v = parseMaybeJson(row.lifecycleState)
  if (v && typeof v === "object") {
    return v.name || v.internalName || v.nameEn || v.businessCode || v.id || "-"
  }
  return v || "-"
}
const lcTag = (name) => {
  const k = (name || "").toLowerCase()
  if (k.includes("待开发") || k.includes("tobedeveloped")) return "info"
  if (k.includes("开发中") || k.includes("indevelopment")) return "warning"
  if (k.includes("试产中") || k.includes("trial"))        return "warning"
  if (k.includes("量产中") || k.includes("volume"))       return "success"
  if (k.includes("停产中") || k.includes("cease"))        return "danger"
  return ""
}

/** ========= 工作状态解析（展示） ========= */
const wsCode = (row) => {
  const norm = (s) => {
    if (!s) return ''
    let x = String(s).trim().toUpperCase().replace(/[\s\-]+/g, '_')
    if (x === 'CHECKEDIN') x = 'CHECKED_IN'
    if (x === 'CHECKEDOUT') x = 'CHECKED_OUT'
    if (x === 'INWORK') x = 'CHECKED_OUT'
    return x
  }
  if (row && row.uiWorkingState) return norm(row.uiWorkingState)
  const ws = row?.workingState
  if (ws && typeof ws === 'object') return norm(ws.alias || ws.code || ws.value)
  if (typeof ws === 'string') {
    const s = ws.trim()
    if ((s.startsWith('{') && s.endsWith('}')) || (s.startsWith('[') && s.endsWith(']'))) {
      try { const obj = JSON.parse(s); return norm(obj.alias || obj.code || obj.value) } catch {}
    }
    return norm(s)
  }
  if (row?.workingStateAlias) return norm(row.workingStateAlias)
  if (row?.workingStateCode)  return norm(row.workingStateCode)
  return ''
}

/** ★ 原始工作状态（用于提交到后端） */
const wsRaw = (row) => {
  const norm = (s) => {
    if (!s) return ''
    let x = String(s).trim().toUpperCase().replace(/[\s\-]+/g, '_')
    if (x === 'CHECKEDIN') x = 'CHECKED_IN'
    if (x === 'CHECKEDOUT') x = 'CHECKED_OUT'
    return x
  }
  const ws = row?.workingState
  if (ws && typeof ws === 'object') return norm(ws.alias || ws.code || ws.value)
  if (typeof ws === 'string') {
    const s = ws.trim()
    if ((s.startsWith('{') && s.endsWith('}')) || (s.startsWith('[') && s.endsWith(']'))) {
      try { const obj = JSON.parse(s); return norm(obj.alias || obj.code || obj.value) } catch {}
    }
    return norm(s)
  }
  if (row?.workingStateCode)  return norm(row.workingStateCode)
  if (row?.uiWorkingState)    return norm(row.uiWorkingState)
  return ''
}

/** 产品族远程下拉 */
const familyOptions = ref([])
const familyLoading = ref(false)

/** 上传 */
const uploadRef = ref(null)
const fileList = ref([])
let selectedRawFile = null

/** 表单与查询 */
const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    productCode: null,
    productName: null,
    productFamily: null,
    category: null,
    productVersion: null,
    specificationModels: null,
    productStatus: null,
    productDescribe: null,
    createUser: null,
    updateUser: null
  },
  rules: {
    productName: [{ required: true, message: "产品名称不能为空", trigger: "blur" }],
    productFamily: [{ required: true, message: "请选择产品族", trigger: "change" }],
    category: [{ required: true, message: "请选择产品类别", trigger: "change" }],
    lifecycleTemplateId: [
      { trigger: "change", validator: (_, v, cb) => (!form.value.id && !v) ? cb(new Error("请选择生命周期模板")) : cb() }
    ],
    operation: [
      { trigger: "change", validator: (_, v, cb) => (!form.value.id && !v) ? cb(new Error("请选择业务操作")) : cb() }
    ],
    lifecycleStateId: [
      { trigger: "change", validator: (_, v, cb) => (!form.value.id && !v) ? cb(new Error("请选择目标生命周期状态")) : cb() }
    ]
  }
})
const { queryParams, form, rules } = toRefs(data)
const isCreate = computed(() => !form.value.id)

/** 族远程查询 */
function remoteMethodFamily(keyword) {
  familyLoading.value = true
  listFamily({ pageNum: 1, pageSize: 50, productFamilyNameCn: keyword || "" })
    .then((res) => { familyOptions.value = res?.rows || [] })
    .finally(() => { familyLoading.value = false })
}

/** 列表 */
function getList() {
  loading.value = true
  listProduct(queryParams.value).then((response) => {
    productList.value = response.rows || []
    total.value = response.total || 0
    loading.value = false
  })
}

/** 下载 */
function downloadFile(row) {
  if (!row.fileDownloadUrl) { ElMessage.error("无下载地址"); return }
  const filename = row.fileName || "download"
  const sep = row.fileDownloadUrl.includes("?") ? "&" : "?"
  const url = row.fileDownloadUrl + (filename ? `${sep}filename=${encodeURIComponent(filename)}` : "")
  downloadWithAxios(url, filename).catch((e) => ElMessage.error(e?.message || "下载失败"))
}

/** 弹窗控制：新增/修改 */
function cancel() { open.value = false; reset() }
function handleAdd() {
  reset()
  open.value = true
  title.value = "添加产品信息"
  remoteMethodFamily("")
}
function handleUpdate(row) {
  if (wsCode(row) !== 'CHECKED_OUT') {
    ElMessage.warning('请先检出，再进行修改')
    return
  }
  reset()
  const _id = row.id || ids.value
  getProduct(_id).then((response) => {
    form.value = response.data || {}
    form.value.category = codeOfCategory(form.value.category)
    fileList.value = response.data?.fileName ? [{ name: response.data.fileName, url: "", status: "success" }] : []
    form.value.fileId = response.data?.fileId || null
    form.value.fileName = response.data?.fileName || null
    form.value.fileDownloadUrl = response.data?.fileDownloadUrl || null
    form.value.clearFile = false
    selectedRawFile = null
    open.value = true
    title.value = "修改产品信息"
    remoteMethodFamily(form.value.productFamily || "")
  })
}

/** 重置表单 */
function reset() {
  form.value = {
    id: null, productCode: null, productName: null, productFamily: null,
    category: null, productVersion: null, specificationModels: null,
    productStatus: null, productDescribe: null, createUser: null, updateUser: null,
    lifecycleTemplateId: null, operation: null, lifecycleStateId: null,
    lifecycleStateName: null, createTime: null,
    clearFile: false, fileId: null, fileName: null, fileDownloadUrl: null
  }
  uploadRef.value?.clearFiles?.()
  selectedRawFile = null
  fileList.value = []
  try { proxy.resetForm("productRef") } catch (e) {}
  lifecycleTemplateOptions.value = []
  lifecycleStateOptions.value = []
  createBizOptions.value = []
}

/** 选择变化 */
function handleSelectionChange(selection) {
  selectedRows.value = selection
  ids.value = selection.map(item => item.masterId || item.id)
  single.value = selection.length != 1
  multiple.value = !selection.length
  hasCheckedOutSelected.value = selection.some(item => wsCode(item) === 'CHECKED_OUT')
}

/** 批量删除 */
function handleBatchDelete() {
  const rows = selectedRows.value
  if (!rows.length) return ElMessage.warning('请先选择要删除的数据')
  if (rows.some(r => wsCode(r) === 'CHECKED_OUT')) {
    ElMessage.warning('包含检出状态的数据，不能删除')
    return
  }
  const idsToDelete = rows.map(r => r?.masterId || r?.id).filter(Boolean)
  if (!idsToDelete.length) return ElMessage.error('所选数据缺少 masterId')
  const tip = idsToDelete.length === 1 ? idsToDelete[0] : `${idsToDelete.length} 条`
  proxy.$modal.confirm(`是否确认批量删除（${tip}）？`)
    .then(() => delProductBatch(idsToDelete))
    .then(() => { proxy.$modal.msgSuccess('批量删除成功'); getList() })
    .catch(() => {})
}

/** 搜索/重置 */
function handleQuery() { queryParams.value.pageNum = 1; getList() }
function resetQuery() { try { proxy.resetForm("queryRef") } catch (e) {}; handleQuery() }

/** 上传校验 */
const MAX_SIZE = 5 * 1024 * 1024
const ALLOWED_EXT = /\.(png|jpe?g|gif|bmp|webp|pdf|docx?|xlsx?|pptx?|txt)$/i
function validateFile(file) {
  if (!ALLOWED_EXT.test(file.name)) {
    ElMessage.error("仅支持图片/文档：png、jpg、jpeg、gif、bmp、webp、pdf、doc/docx、xls/xlsx、ppt/pptx、txt")
    return false
  }
  if (file.size > MAX_SIZE) { ElMessage.error("文件大小不能超过 5MB"); return false }
  return true
}
function handleBeforeAdd(file) {
  if (fileList.value.length) { uploadRef.value?.clearFiles?.(); fileList.value = []; selectedRawFile = null }
  return validateFile(file)
}
function onFileChange(file) {
  if (!file?.raw) return
  if (!validateFile(file.raw)) { uploadRef.value?.clearFiles?.(); fileList.value = []; selectedRawFile = null; return }
  selectedRawFile = file.raw
  fileList.value  = [file]
  form.value.clearFile = false
}
function onFileRemove() { selectedRawFile = null; fileList.value = []; form.value.clearFile = true }

/** 提交（新增/修改 + 可选附件） */
async function submitForm() {
  const formVm = proxy.$refs["productRef"]
  if (!formVm) return
  const ok = await formVm.validate().catch(() => false)
  if (!ok) return

  const isAdd = !form.value.id
  const payload = { ...form.value }
  payload.category = codeOfCategory(payload.category)

  const fd = new FormData()
  fd.append("data", new Blob([JSON.stringify(payload)], { type: "application/json" }))
  if (selectedRawFile) fd.append("file", selectedRawFile)

  try {
    if (isAdd) { await addProduct(fd); proxy.$modal.msgSuccess("新增成功") }
    else { await updateProduct(fd); proxy.$modal.msgSuccess("修改成功") }
    open.value = false
    getList()
  } catch (e) {
    ElMessage.error(e?.msg || e?.message || "提交失败")
  }
}

/** 单个删除 */
function handleSingleDelete(row) {
  if (wsCode(row) === 'CHECKED_OUT') { ElMessage.warning('检出状态的数据不能删除'); return }
  if (!row?.masterId) return ElMessage.error('缺少 masterId，无法删除')
  const tip = `PN${row.id || ''}`
  proxy.$modal.confirm(`是否确认删除（${tip}）？`)
    .then(() => delProduct(row.masterId))
    .then(() => { proxy.$modal.msgSuccess('删除成功'); getList() })
    .catch(() => {})
}

/** ================= 检出 / 检入 ================= */
const flowDlg = reactive({
  open: false,
  mode: 'checkout',
  row: null,
  form: {
    masterId: '', operation: 'checkout', lifecycleTemplateId: '',
    businessOperationId: '', lifecycleStateId: '', currentStateId: ''
  },
  tplOptions: [], bizOptions: [], stateOptions: [],
  loading: { templates: false, business: false, states: false }
})

const flowFormRef = ref(null)
const flowRules = {
  businessOperationId: [{ required: true, message: '请选择业务操作', trigger: 'change' }],
  lifecycleStateId: [{ required: true, message: '请选择目标生命周期状态', trigger: 'change' }]
}

function openFlowDlg(mode, row) {
  flowDlg.mode = mode
  flowDlg.open = true
  flowDlg.row = row
  flowDlg.form.operation = mode
  flowDlg.form.masterId = row.masterId || row.id
  flowDlg.form.currentStateId = (row?.lifecycleState && row.lifecycleState.id) || row?.lifecycleStateId || ""
  const tplId = row?.lifecycleTemplate?.id || row?.lifecycleTemplateId || ''
  flowDlg.form.lifecycleTemplateId = tplId
  flowDlg.form.businessOperationId = ''
  flowDlg.form.lifecycleStateId = ''
  flowDlg.bizOptions = []
  flowDlg.stateOptions = []
  loadFlowTemplates(tplId).then(() => { pickNextBusinessAndStates() })
}
async function loadFlowTemplates(prefillId) {
  flowDlg.loading.templates = true
  try {
    const res = await listLifecycleTemplates({
      "master.businessCode": "LCT00000009", latest: true, pageNum: 1, pageSize: 50
    })
    flowDlg.tplOptions = res?.rows || res?.data || []
    if (prefillId && !flowDlg.tplOptions.some(t => t.id === prefillId)) {
      flowDlg.tplOptions.unshift({ id: prefillId, name: '' })
    }
  } finally { flowDlg.loading.templates = false }
}
async function pickNextBusinessAndStates() {
  const tplId = flowDlg.form.lifecycleTemplateId
  const op = flowDlg.form.operation
  const curStateId = flowDlg.form.currentStateId || undefined
  if (!tplId || !op) return
  flowDlg.loading.business = true
  try {
    const bizRes = await getLifecycleBusiness({ templateId: tplId, operation: op, stateId: curStateId })
    const list = Array.isArray(bizRes?.data) ? bizRes.data : (bizRes?.data ? [bizRes.data] : [])
    flowDlg.bizOptions = list
    let picked = null, targets = []
    for (const bo of list) {
      const r = await getLifecycleStates({ templateId: tplId, businessOperationId: bo.id, stateId: curStateId, operation: op })
      const arr = r?.data || r?.rows || []
      if (Array.isArray(arr) && arr.length) { picked = bo; targets = arr; break }
    }
    if (!picked) { flowDlg.stateOptions = []; flowDlg.form.businessOperationId=''; flowDlg.form.lifecycleStateId=''; return }
    flowDlg.form.businessOperationId = picked.id
    flowDlg.stateOptions = targets
    flowDlg.form.lifecycleStateId = targets[0]?.id || ''
  } finally { flowDlg.loading.business = false }
}
function onBizChange() { flowDlg.form.lifecycleStateId = ''; loadFlowStates() }
async function loadFlowStates() {
  const tplId = flowDlg.form.lifecycleTemplateId
  const boId  = flowDlg.form.businessOperationId
  if (!tplId || !boId) { flowDlg.stateOptions = []; return }
  flowDlg.loading.states = true
  try {
    const stateRes = await getLifecycleStates({
      templateId: tplId, businessOperationId: boId,
      stateId: flowDlg.form.currentStateId || undefined, operation: flowDlg.form.operation
    })
    const arr = stateRes?.data || stateRes?.rows || []
    flowDlg.stateOptions = Array.isArray(arr) ? arr : (arr ? [arr] : [])
    flowDlg.form.lifecycleStateId = flowDlg.stateOptions.length ? flowDlg.stateOptions[0].id : ''
  } finally { flowDlg.loading.states = false }
}
async function confirmFlowDlg() {
  const ok = await flowFormRef.value?.validate().catch(() => false)
  if (!ok) return
  const { masterId, lifecycleTemplateId, lifecycleStateId } = flowDlg.form
  const payload = { masterId, lifecycleTemplate: { id: lifecycleTemplateId }, lifecycleState: { id: lifecycleStateId } }
  try {
    if (flowDlg.mode === 'checkout') {
      await checkoutProduct({ ...payload, workCopyType: 'BOTH' })
      proxy.$modal.msgSuccess('检出成功')
    } else {
      await checkinProduct({ ...payload, viewNo: '' })
      proxy.$modal.msgSuccess('检入成功')
    }
    flowDlg.open = false; getList()
  } catch (e) { ElMessage.error(e?.msg || e?.message || '操作失败') }
}

/** ============ 新增页：生命周期（create） ============ */
function loadLifecycleTemplates() {
  if (lifeTplLoading.value) return
  lifeTplLoading.value = true
  listLifecycleTemplates({ "master.businessCode": "LCT00000009", latest: true, pageNum: 1, pageSize: 50 })
    .then((res) => { lifecycleTemplateOptions.value = (res?.rows || res?.data || []) })
    .finally(() => (lifeTplLoading.value = false))
}
function onTemplateChange() {
  form.value.operation = null; form.value.lifecycleStateId = null; form.value.lifecycleStateName = null
  lifecycleStateOptions.value = []; createBizOptions.value = []; refreshBusinessAndStates()
}
function onOperationChange() {
  form.value.lifecycleStateId = null; form.value.lifecycleStateName = null
  lifecycleStateOptions.value = []; refreshStatesOnly()
}
function refreshBusinessAndStates() {
  const tplId = form.value.lifecycleTemplateId; const op = form.value.operation || "create"
  if (!tplId) return
  lifeOpLoading.value = true
  getLifecycleBusiness({ templateId: tplId, operation: op })
    .then((res) => {
      const list = Array.isArray(res?.data) ? res.data : (res?.data ? [res.data] : [])
      createBizOptions.value = list.length ? list : [{ operation: 'create', name: '创建' }]
      if (!form.value.operation && createBizOptions.value.length) {
        form.value.operation = createBizOptions.value[0].operation || 'create'
      }
      return refreshStatesOnly()
    })
    .finally(() => (lifeOpLoading.value = false))
}
function refreshStatesOnly() {
  const tplId = form.value.lifecycleTemplateId
  const chosen = createBizOptions.value.find(op => (op.operation || 'create') === (form.value.operation || 'create'))
  const businessOperationId = chosen?.id
  if (!tplId || !businessOperationId) return
  lifeStateLoading.value = true
  return getLifecycleStates({ templateId: tplId, businessOperationId })
    .then((res2) => {
      const arr = res2?.data || res2?.rows || []
      lifecycleStateOptions.value = Array.isArray(arr) ? arr : (arr ? [arr] : [])
      form.value.lifecycleStateId = lifecycleStateOptions.value.length ? lifecycleStateOptions.value[0].id : null
    })
    .finally(() => (lifeStateLoading.value = false))
}
function onStatePicked(val) {
  const st = lifecycleStateOptions.value.find((x) => x.id === val)
  form.value.lifecycleStateName = st?.name || st?.internalName || st?.description || null
}

/** ================= ★ 更新状态（operation 固定 edit） ================= */
const statusDlg = reactive({
  open: false, row: null,
  form: { id: '', lifecycleTemplateId: '', businessOperationId: '', lifecycleStateId: '', workingState: '' },
  tplOptions: [], bizOptions: [], stateOptions: [],
  loading: { business: false, states: false }
})

const statusFormRef = ref(null)
const statusRules = {
  businessOperationId: [{ required: true, message: '请选择业务操作', trigger: 'change' }],
  lifecycleStateId: [{ required: true, message: '请选择目标生命周期状态', trigger: 'change' }]
}

function openStatusDlg(row) {
  statusDlg.open = true; statusDlg.row = row
  statusDlg.form.id = row.id || row.masterId || ''
  statusDlg.form.workingState = wsRaw(row) || ''
  const tplId = row?.lifecycleTemplate?.id || row?.lifecycleTemplateId || ''
  statusDlg.form.lifecycleTemplateId = tplId
  statusDlg.tplOptions = tplId ? [{ id: tplId, name: row?.lifecycleTemplate?.name || '' }] : []
  statusDlg.form.businessOperationId = ''; statusDlg.form.lifecycleStateId = ''; statusDlg.stateOptions = []
  loadStatusBusiness()
}
async function loadStatusBusiness() {
  const tplId = statusDlg.form.lifecycleTemplateId
  if (!tplId) { statusDlg.bizOptions = []; statusDlg.stateOptions = []; return }
  statusDlg.loading.business = true
  try {
    const res = await getLifecycleBusiness({ templateId: tplId, operation: 'edit', stateId: '' })
    const list = (res?.rows || res?.data || [])
    statusDlg.bizOptions = Array.isArray(list) ? list : (list ? [list] : [])
  } finally { statusDlg.loading.business = false }
}
function onStatusBizChange() { statusDlg.form.lifecycleStateId = ''; loadStatusStates() }
async function loadStatusStates() {
  const tplId = statusDlg.form.lifecycleTemplateId; const boId = statusDlg.form.businessOperationId
  if (!tplId || !boId) { statusDlg.stateOptions = []; return }
  statusDlg.loading.states = true
  try {
    const r = await getLifecycleStates({ templateId: tplId, businessOperationId: boId, operation: 'edit', stateId: '' })
    const arr = r?.data || r?.rows || []
    statusDlg.stateOptions = Array.isArray(arr) ? arr : (arr ? [arr] : [])
  } finally { statusDlg.loading.states = false }
}
async function confirmStatusDlg() {
  const ok = await statusFormRef.value?.validate().catch(() => false)
  if (!ok) return
  const { id, lifecycleTemplateId, lifecycleStateId, workingState } = statusDlg.form
  const payload = { id, workingState: workingState || '', lifecycleTemplate: { id: lifecycleTemplateId }, lifecycleState: { id: lifecycleStateId } }
  try {
    await updateStatus(payload)
    proxy.$modal.msgSuccess('更新成功'); statusDlg.open = false; getList()
  } catch (e) { ElMessage.error(e?.msg || e?.message || '更新失败') }
}

getList()
</script>

<style scoped>
:deep(.el-table .cell) {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}
.lock-red { color: #F56C6C; font-size: 16px; vertical-align: middle; }
.wrap-scroll {
  white-space: normal !important;
  word-break: break-all;
  line-height: 18px;
  max-height: 54px;
  overflow-y: auto;
  padding-right: 4px;
}
.upload-one.wide { width: 100%; }
.upload-one.wide .el-upload-list,
.upload-one.wide .el-upload-list__item,
.upload-one.wide .el-upload-list__item-name { max-width: none; width: 100%; }
.upload-one.wide .el-upload-list__item-name { white-space: normal; word-break: break-all; }
.upload-one.wide .el-upload__tip { margin-left: 8px; }
</style>
