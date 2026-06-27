<template>
  <div class="app-container">
    <!-- 搜索表单 -->
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="80px">
      <el-form-item label="Part名称" prop="partName">
        <el-input v-model="queryParams.partName" placeholder="请输入Part名称" clearable style="width: 200px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="Part种类" prop="partType">
        <el-select v-model="queryParams.partType" placeholder="请选择" clearable style="width: 90px;">
          <el-option label="原材料" value="Ma" />
          <el-option label="半成品" value="Sfp" />
          <el-option label="成品" value="Pro" />
          <el-option label="耗材类" value="Rhy" />
          <el-option label="其它" value="Oth" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择" clearable style="width: 90px;">
          <el-option label="启用" value="Enable" />
          <el-option label="停用" value="Disable" />
        </el-select>
      </el-form-item>
      <el-form-item label="购制属性" prop="purchaseOrManufacture">
        <el-select v-model="queryParams.purchaseOrManufacture" placeholder="请选择" clearable style="width: 90px;">
          <el-option label="购买" value="Pur" />
          <el-option label="自制" value="Manu" />
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
        <el-button type="danger" plain icon="Delete" :disabled="multiple || hasCheckedOutSelected" @click="handleBatchDelete">删除</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" />
    </el-row>

    <!-- 表格区 -->
    <el-table v-loading="loading" :data="partList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="" width="40" align="center">
        <template #default="scope">
          <el-icon v-if="wsCode(scope.row) === 'CHECKED_OUT'" class="lock-red"><Lock /></el-icon>
        </template>
      </el-table-column>
      <el-table-column label="Part编码" align="center" min-width="100">
        <template #default="scope">
          <el-tooltip placement="top" :disabled="!scope.row.id">
            <template #content>
              <div class="clamp-tooltip">PN{{ scope.row.id }}</div>
            </template>
            <div class="clamp2 inline-block">PN{{ scope.row.id }}</div>
          </el-tooltip>
        </template>
      </el-table-column>
      <el-table-column label="中文名称" align="center" min-width="120">
        <template #default="scope">
          <el-tooltip placement="top" :disabled="!scope.row.partName">
            <template #content>
              <div class="clamp-tooltip">{{ scope.row.partName }}</div>
            </template>
            <div class="clamp2 inline-block">{{ scope.row.partName }}</div>
          </el-tooltip>
        </template>
      </el-table-column>
      <el-table-column label="英文名称" align="center" min-width="120">
        <template #default="scope">
          <el-tooltip placement="top" :disabled="!scope.row.partNameEn">
            <template #content>
              <div class="clamp-tooltip">{{ scope.row.partNameEn }}</div>
            </template>
            <div class="clamp2 inline-block">{{ scope.row.partNameEn }}</div>
          </el-tooltip>
        </template>
      </el-table-column>
      <el-table-column label="Part种类" align="center" prop="partType" min-width="90">
        <template #default="scope">
          <span>{{ formatPartType(scope.row.partType) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="规格型号" align="center" min-width="120">
        <template #default="scope">
          <el-tooltip placement="top" :disabled="!scope.row.specificationsModel">
            <template #content>
              <div class="clamp-tooltip">{{ scope.row.specificationsModel }}</div>
            </template>
            <div class="clamp2 inline-block">{{ scope.row.specificationsModel }}</div>
          </el-tooltip>
        </template>
      </el-table-column>
      <el-table-column label="单位" align="center" prop="unit" min-width="80" :show-overflow-tooltip="true" />
      <el-table-column label="Part版本" align="center" prop="displayVersion" min-width="90">
        <template #default="scope">
          <span>{{ scope.row.displayVersion || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="购制属性" align="center" prop="purchaseOrManufacture" min-width="90">
        <template #default="scope">
          <span>{{ formatPurchaseAttr(scope.row.purchaseOrManufacture) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="状态" align="center" prop="status" min-width="80">
        <template #default="scope">
          <span>{{ formatStatus(scope.row.status) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="附件" align="center" min-width="120">
        <template #default="scope">
          <div v-if="scope.row.fileName">
            <div class="clamp2 inline-block" style="cursor: pointer; color: #409EFF;" @click="downloadFile(scope.row)">
              {{ scope.row.fileName }}
            </div>
          </div>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="Part说明" align="center" min-width="140">
        <template #default="scope">
          <el-tooltip placement="top" :disabled="!scope.row.partDeclaration">
            <template #content>
              <div class="clamp-tooltip">{{ scope.row.partDeclaration }}</div>
            </template>
            <div class="clamp2 inline-block">{{ scope.row.partDeclaration }}</div>
          </el-tooltip>
        </template>
      </el-table-column>
      <el-table-column label="创建日期" align="center" min-width="100">
        <template #default="scope">
          <span>{{ parseTime(scope.row.createTime, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="220">
        <template #default="scope">
          <el-button v-if="wsCode(scope.row) === 'CHECKED_IN'" link type="success" icon="Unlock" @click="confirmCheckout(scope.row)">检出</el-button>
          <el-button v-if="wsCode(scope.row) === 'CHECKED_OUT'" link type="primary" icon="Edit" @click="handleUpdate(scope.row)">修改</el-button>
          <el-button v-if="wsCode(scope.row) === 'CHECKED_OUT'" link type="warning" icon="Lock" @click="confirmCheckin(scope.row)">检入</el-button>
          <el-button v-if="wsCode(scope.row) === 'CHECKED_IN'" link type="danger" icon="Delete" @click="handleDelete(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <pagination
      v-show="total > 0"
      :total="total"
      v-model:page="queryParams.pageNum"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />

    <!-- 新增/修改弹窗 -->
    <el-dialog :title="title" v-model="open" width="700px" append-to-body>
      <el-form ref="partRef" :model="form" :rules="rules" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="中文名称" prop="partName">
              <el-input v-model="form.partName" placeholder="请输入中文名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="英文名称" prop="partNameEn">
              <el-input v-model="form.partNameEn" placeholder="请输入英文名称" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Part种类" prop="partType">
              <el-select v-model="form.partType" placeholder="请选择Part种类">
                <el-option label="原材料" value="Ma" />
                <el-option label="半成品" value="Sfp" />
                <el-option label="成品" value="Pro" />
                <el-option label="包材" value="Rhy" />
                <el-option label="其它" value="Oth" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-select v-model="form.status" placeholder="请选择状态">
                <el-option label="启用" value="Enable" />
                <el-option label="停用" value="Disable" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="单位" prop="unit">
              <el-select v-model="form.unit" placeholder="请选择单位" filterable remote reserve-keyword
                :remote-method="remoteMethodUnit" :loading="unitLoading">
                <el-option v-for="item in unitOptions" :key="item.id" :label="item.unitName" :value="item.unitName" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="购制属性" prop="purchaseOrManufacture">
              <el-select v-model="form.purchaseOrManufacture" placeholder="请选择购制属性">
                <el-option label="购买" value="Pur" />
                <el-option label="自制" value="Manu" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="规格型号" prop="specificationsModel">
          <el-input v-model="form.specificationsModel" placeholder="请输入规格型号" />
        </el-form-item>

        <!-- 文件上传 -->
        <el-form-item label="产品文件">
          <el-upload ref="uploadRef" class="upload-one wide" :auto-upload="false" :multiple="false"
            list-type="text" :file-list="fileList" :before-upload="handleBeforeAdd"
            :on-change="onFileChange" :on-remove="onFileRemove"
            accept=".png,.jpg,.jpeg,.gif,.bmp,.webp,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt">
            <el-button type="primary">选择文件</el-button>
            <template #tip v-if="!fileList.length">
              <div class="el-upload__tip">请选择小于 5MB 的图片或文档（png/jpg/pdf/word/excel/ppt/txt）</div>
            </template>
          </el-upload>
        </el-form-item>

        <el-form-item label="Part说明" prop="partDeclaration">
          <el-input type="textarea" v-model="form.partDeclaration" placeholder="请输入说明" />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="Part">
import { getCurrentInstance, ref, reactive, toRefs } from "vue"
import { ElMessage } from "element-plus"
import { Lock } from '@element-plus/icons-vue'
import { listPart, getPart, delPart, addPart, updatePart, checkOut, checkIn } from "@/api/manufacture/part"
import { listUnit } from "@/api/manufacture/unit"
import { downloadByStream } from '@/utils/download'

const { proxy } = getCurrentInstance()

/** 数据源 */
const partList = ref([])
const unitOptions = ref([])
const fileList = ref([])          // el-upload 受控列表
let selectedRawFile = null

const open = ref(false)
const loading = ref(true)
const showSearch = ref(true)
const selectedRows = ref([])
const single = ref(true)
const multiple = ref(true)
const hasCheckedOutSelected = ref(false)   // 批量删除禁用判断
const unitLoading = ref(false)
const total = ref(0)
const title = ref("")
const uploadRef = ref(null)

/** 表单与查询参数 */
const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    partName: null,
    partType: null,
    status: null,
    purchaseOrManufacture: null
  },
  rules: {
    partType: [{ required: true, message: "请选择Part种类", trigger: "change" }],
    partName: [{ required: true, message: "Part名称不能为空", trigger: "blur" }]
  }
})
const { queryParams, form, rules } = toRefs(data)

/** 列表 */
function getList() {
  loading.value = true
  listPart(queryParams.value).then(res => {
    partList.value = res.rows || []
    total.value = res.total || 0
  }).finally(() => loading.value = false)
}

/** 单位远程搜索 */
function remoteMethodUnit(keyword) {
  unitLoading.value = true
  listUnit({ pageNum: 1, pageSize: 100, ...(keyword ? { unitName: keyword } : {}) })
    .then(res => { unitOptions.value = res.rows || [] })
    .finally(() => { unitLoading.value = false })
}

/** 上传处理 */
function handleBeforeAdd() {
  if (fileList.value.length) {
    uploadRef.value?.clearFiles?.()
    fileList.value = []
    selectedRawFile = null
  }
  return true
}

function onFileChange(file) {
  selectedRawFile = file?.raw || null
  fileList.value = selectedRawFile ? [file] : []
  form.value.clearFile = false
}

function onFileRemove() {
  selectedRawFile = null
  fileList.value = []
  form.value.clearFile = true
}

/** 取消/重置 */
function cancel() { open.value = false; reset() }

function reset() {
  form.value = {
    id: null, partType: null, partCode: null, partName: null,
    partNameEn: null, specificationsModel: null, unit: null,
    purchaseOrManufacture: null, status: null, photo: null,
    partDeclaration: null, createTime: null, clearFile: false
  }
  selectedRawFile = null
  fileList.value = []
  proxy.resetForm("partRef")
}

/** 搜索/重置搜索 */
function handleQuery() { queryParams.value.pageNum = 1; getList() }
function resetQuery() { proxy.resetForm("queryRef"); handleQuery() }

/** 多选（禁用批量删除的依据） */
function handleSelectionChange(selection) {
  selectedRows.value = selection
  single.value = selection.length != 1
  multiple.value = !selection.length
  hasCheckedOutSelected.value = selection.some(r => wsCode(r) === 'CHECKED_OUT')
}

/** 新增 */
function handleAdd() {
  reset()
  open.value = true
  title.value = "新增Part"
  remoteMethodUnit("")
}

/** 修改（仅检出态允许） */
function handleUpdate(row) {
  if (wsCode(row) !== 'CHECKED_OUT') {
    ElMessage.warning('请先检出，再进行修改')
    return
  }
  reset()
  const _id = row.id
  getPart(_id).then(res => {
    const d = res.data || {}
    form.value = { ...d, clearFile: false }
    const fileName = d.fileName || row.fileName || null
    fileList.value = fileName ? [{ name: fileName, url: "", status: "success" }] : []
    open.value = true
    title.value = "修改Part"
    remoteMethodUnit("")
  })
}

/** 提交（新增/修改 + 可无附件） */
function submitForm() {
  proxy.$refs["partRef"].validate(async (valid) => {
    if (!valid) return
    if (!form.value.id) {
      await addPart(form.value, selectedRawFile)
      proxy.$modal.msgSuccess("新增成功")
    } else {
      await updatePart(form.value, selectedRawFile)
      proxy.$modal.msgSuccess("修改成功")
    }
    open.value = false
    getList()
  })
}

/** 删除（批量 & 单个；含检出禁止） */
function handleDelete(row) {
  const rows = row ? [row] : selectedRows.value
  if (!rows.length) return ElMessage.warning('请先选择要删除的数据')
  if (rows.some(r => wsCode(r) === 'CHECKED_OUT')) {
    ElMessage.warning('包含检出状态的数据，不能删除')
    return
  }
  const ids = rows.map(r => r?.masterId).filter(Boolean)
  if (!ids.length) return ElMessage.error('所选数据缺少 masterId')
  const tip = ids.length === 1 ? ids[0] : `${ids.length} 条`
  proxy.$modal.confirm(`是否确认删除（${tip}）？`)
    .then(() => delPart(ids.join(',')))
    .then(() => { proxy.$modal.msgSuccess('删除成功'); getList() })
    .catch(() => {})
}

/** 批量删除 */
function handleBatchDelete() {
  handleDelete(null)
}

/** 下载文件 */
function downloadFile(row) {
  if (!row.fileDownloadUrl) return ElMessage.error('无下载地址')
  const filename = row.fileName || 'download'
  const url = row.fileDownloadUrl + (filename ? `&filename=${encodeURIComponent(filename)}` : '')
  downloadByStream(url, filename).catch(e => ElMessage.error(e?.message || '下载失败'))
}

/** 统一工作状态显示为 CHECKED_IN / CHECKED_OUT */
const wsCode = (row) => {
  let v = row?.uiWorkingState || row?.workingStateAlias || row?.workingStateCode || row?.workingState
  if (!v) return ''
  if (typeof v === 'string') {
    const s = v.trim()
    if (s.startsWith('{') && s.endsWith('}')) {
      try {
        const obj = JSON.parse(s)
        v = obj.alias || obj.ALIAS || obj.code || obj.CODE || ''
      } catch { v = s }
    } else { v = s }
  } else if (typeof v === 'object') {
    v = v?.alias || v?.ALIAS || v?.code || v?.CODE || ''
  }
  v = String(v).toUpperCase()
  if (v === 'INWORK') return 'CHECKED_OUT'
  if (v === 'CHECKED_IN') return 'CHECKED_IN'
  return v
}

/** 检出/检入（带 PN{id} 的二次确认） */
function confirmCheckout(row) {
  if (!row?.masterId) return ElMessage.error('缺少 masterId，无法检出')
  const pn = `PN${row.id || ''}`
  proxy.$modal.confirm(`是否确认检出Part编码为"${pn}"的数据项？`)
    .then(() => checkOut(row.masterId))
    .then(() => { proxy.$modal.msgSuccess('检出成功'); getList() })
    .catch(() => {})
}

function confirmCheckin(row) {
  if (!row?.masterId) return ElMessage.error('缺少 masterId，无法检入')
  const pn = `PN${row.id || ''}`
  proxy.$modal.confirm(`是否确认检入Part编码为"${pn}"的数据项？`)
    .then(() => checkIn(row.masterId))
    .then(() => { proxy.$modal.msgSuccess('检入成功'); getList() })
    .catch(() => {})
}

/** 格式化辅助函数 */
function formatPartType(val) {
  const map = { 'Ma': '原材料', 'Sfp': '半成品', 'Pro': '成品', 'Rhy': '耗材类', 'Oth': '其它' }
  return map[val] || '-'
}

function formatPurchaseAttr(val) {
  const map = { 'Pur': '购买', 'Manu': '自制' }
  return map[val] || '-'
}

function formatStatus(val) {
  const map = { 'Enable': '启用', 'Disable': '停用' }
  return map[val] || '-'
}

getList()
</script>

<style scoped>
/* 默认单元格的单行省略策略保持，但对 .clamp2 局部覆盖为两行 */
:deep(.el-table .cell) {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

/* 两行截断 + 悬浮完整显示的文本容器 */
.clamp2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;           /* 关键：两行 */
  -webkit-box-orient: vertical;
  overflow: hidden;
  white-space: normal !important;   /* 覆盖表格默认nowrap */
  word-break: break-all;            /* 避免长词不换行 */
  line-height: 20px;
  max-height: 40px;                 /* 2 * line-height */
}

.inline-block { display: inline-block; max-width: 100%; }

/* Tooltip 容器适配较长文本 */
.clamp-tooltip {
  max-width: 600px;
  white-space: normal;
  word-break: break-word;
}

/* 小红锁外观 */
.lock-red { color: #F56C6C; font-size: 16px; vertical-align: middle; }

/* 上传区域铺满一行 */
.upload-one.wide { width: 100%; }
.upload-one.wide .el-upload-list,
.upload-one.wide .el-upload-list__item,
.upload-one.wide .el-upload-list__item-name { max-width: none; width: 100%; }
.upload-one.wide .el-upload-list__item-name { white-space: normal; word-break: break-all; }
.upload-one.wide .el-upload__tip { margin-left: 8px; }
</style>
