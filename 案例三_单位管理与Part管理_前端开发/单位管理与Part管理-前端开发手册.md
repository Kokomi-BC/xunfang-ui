# 单位管理与 Part 管理 — 前端开发手册

## 目录

1. [环境与预制](#1-环境与预制)
2. [页面与路由](#2-页面与路由)
3. [API 定义](#3-api-定义)
4. [单位管理实现（含"批量新增"）](#4-单位管理实现含批量新增)
5. [Part 管理实现（上传/回显/替换/删除/下载、检出/检入）](#5-part-管理实现上传回显替换删除下载检出检入)
6. [新增知识点清单](#6-新增知识点清单)
7. [自测清单](#7-自测清单)
8. [常见问题（FAQ）](#8-常见问题faq)

---

## 1. 环境与预制

### 1.1 前端技术栈

- **框架**：Vue 3 + Vite + Element Plus（RuoYi-Vue 基座）
- **统一网关前缀**：`/dev-api`
- **模块前缀**：`/manufacture`
- **登录态**：所有请求自动通过 axios 拦截器携带 `Authorization: Bearer <Token>`

### 1.2 新增工具 — 下载工具 `downloadByStream`

基于 `fetch` 实现，无 axios 拦截器干扰，专用于流式下载二进制文件。

**文件路径**：`src/utils/download.js`

```js
import { getToken } from '@/utils/auth'

export async function downloadByStream(path, filename) {
  const finalUrl = `/dev-api${path}`
  const headers = {}
  const token = getToken && getToken()
  if (token) headers['Authorization'] = 'Bearer ' + token
  const res = await fetch(finalUrl, { method: 'GET', credentials: 'include', headers })
  // ... 省略 JSON 错误判断 + Blob 保存 ...
}
```

> **为什么不用 axios？** 默认 axios 实例有响应拦截器，会将二进制流当作 JSON 解析，导致下载失败。故使用干净的 `fetch` 版本。

---

## 2. 页面与路由

### 2.1 路由建议

| 功能 | 文件路径 |
|------|---------|
| 单位管理页面 | `/src/views/manufacture/unit/index.vue` |
| Part 管理页面 | `/src/views/manufacture/part/index.vue` |
| 单位管理 API | `/src/api/manufacture/unit.js` |
| Part 管理 API | `/src/api/manufacture/part.js` |

### 2.2 菜单配置

**菜单路径**：制造管理 → 单位管理 / Part 管理

在 **菜单管理** 中添加路由时，组件路径分别配置为：

- `views/manufacture/unit/index.vue`
- `views/manufacture/part/index.vue`

### 2.3 目录创建步骤

```
src/views/manufacture/
├── unit/
│   └── index.vue          ← 单位管理主页面
└── part/
    └── index.vue          ← Part 管理主页面

src/api/manufacture/
├── unit.js                ← 单位管理 API
└── part.js                ← Part 管理 API
```

创建完成后，运行前端代码，在菜单中配置路由确保可访问。初始时页面显示"单位主界面"/"Part 管理主界面"占位文字。

---

## 3. API 定义

### 3.1 单位管理 API — `src/api/manufacture/unit.js`

```js
import request from '@/utils/request'

// 查询单位列表
export function listUnit(query) {
  return request({
    url: '/manufacture/unit/list',
    method: 'get',
    params: query
  })
}

// 查询单位详细
export function getUnit(id) {
  return request({
    url: '/manufacture/unit/' + id,
    method: 'get'
  })
}

// 新增单位（支持批量——传入数组）
export function addUnit(data) {
  return request({
    url: '/manufacture/unit',
    method: 'post',
    data: data
  })
}

// 修改单位
export function updateUnit(data) {
  return request({
    url: '/manufacture/unit',
    method: 'put',
    data: data
  })
}

// 删除单位
export function delUnit(id) {
  return request({
    url: '/manufacture/unit/' + id,
    method: 'delete'
  })
}
```

### 3.2 Part 管理 API — `src/api/manufacture/part.js`

```js
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
```

---

## 4. 单位管理实现（含"批量新增"）

### 4.1 模板结构（`index.vue`）

页面分为以下几个区域：

1. **搜索表单** — 按单位名称过滤
2. **工具栏** — 新增按钮 + 右侧工具栏
3. **表格区** — 展示单位列表（单位编码 UN{id}、单位名称、操作）
4. **分页** — 支持分页查询
5. **弹窗** — 批量新增单位（一次可添加多行）

#### 搜索表单

```html
<el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="68px">
  <el-form-item label="单位名称" prop="unitName">
    <el-input v-model="queryParams.unitName" placeholder="请输入单位名称" clearable @keyup.enter="handleQuery" />
  </el-form-item>
  <el-form-item>
    <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
    <el-button icon="Refresh" @click="resetQuery">重置</el-button>
  </el-form-item>
</el-form>
```

#### 工具栏

```html
<el-row :gutter="10" class="mb8">
  <el-col :span="1.5">
    <el-button type="primary" plain icon="Plus" @click="handleAdd">新增</el-button>
  </el-col>
  <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
</el-row>
```

#### 表格区

```html
<el-table v-loading="loading" :data="unitList" @selection-change="handleSelectionChange">
  <el-table-column v-if="false" label="id" align="center" prop="id" />
  <el-table-column label="单位编码" align="center">
    <template #default="scope">
      UN{{ scope.row.id }}
    </template>
  </el-table-column>
  <el-table-column label="单位名称" align="center" prop="unitName" />
  <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
    <template #default="scope">
      <el-button link type="danger" icon="Delete" @click="handleDelete(scope.row)">删除</el-button>
    </template>
  </el-table-column>
</el-table>

<pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum"
  v-model:limit="queryParams.pageSize" @pagination="getList" />
```

#### 批量新增弹窗

核心设计：**一次弹窗内可新增多行**，点击 `+` 动态增加输入行，点击"确定"一次性提交数组到后端。

```html
<el-dialog :title="title" v-model="open" width="500px" append-to-body>
  <div v-for="(item, index) in units" :key="index" class="unit-item">
    <span class="unit-index">{{ index + 1 }}</span>
    <el-input v-model="item.name" placeholder="单位名称" style="width: 200px; margin-right: 10px;" />
    <el-button v-if="units.length > 1" type="danger" icon="Minus" circle size="small"
      @click="removeUnit(index)" />
  </div>

  <div style="margin-top: 10px;">
    <el-button type="primary" icon="Plus" circle size="small" @click="addUnitRow" />
  </div>

  <template #footer>
    <el-button type="primary" @click="submitForm">确 定</el-button>
    <el-button @click="open = false">关 闭</el-button>
  </template>
</el-dialog>
```

### 4.2 JS 逻辑与 CSS 样式

```vue
<script setup name="Unit">
/* 解决与本地方法重名：API 的 addUnit 改名为 addUnitApi */
import { listUnit, getUnit, delUnit, addUnit as addUnitApi, updateUnit } from "@/api/manufacture/unit"

const { proxy } = getCurrentInstance()
const unitList = ref([])
const open = ref(false)
const loading = ref(true)
const showSearch = ref(true)
const ids = ref([])
const single = ref(true)
const multiple = ref(true)
const total = ref(0)
const title = ref("")
/* 动态新增行输入框 */
const units = ref([{ name: "" }])
const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    unitCode: null,
    unitName: null
  },
  rules: {
    unitName: [
      { required: true, message: "单位名称不能为空", trigger: "blur" }
    ],
  }
})
const { queryParams, form, rules } = toRefs(data)

/** 查询单位列表 */
function getList() {
  loading.value = true
  listUnit(queryParams.value).then(response => {
    unitList.value = response.rows
    total.value = response.total
    loading.value = false
  })
}

/** 搜索按钮操作 */
function handleQuery() {
  queryParams.value.pageNum = 1
  getList()
}

/** 重置按钮操作 */
function resetQuery() {
  proxy.resetForm("queryRef")
  handleQuery()
}

/** 多选框选中数据 */
function handleSelectionChange(selection) {
  ids.value = selection.map(item => item.id)
  single.value = selection.length != 1
  multiple.value = !selection.length
}

/** 新增按钮操作 */
function handleAdd() {
  form.value = {}
  units.value = [{ name: "" }]   // 打开新增对话框时重置
  open.value = true
  title.value = "添加单位"
}

/** 提交按钮 */
async function submitForm() {
  if (form.value.id != null) {
    // 修改逻辑
    updateUnit(form.value).then(() => {
      proxy.$modal.msgSuccess("修改成功")
      open.value = false
      getList()
    })
  } else {
    // 新增逻辑：一次性传整个数组
    try {
      const payload = units.value.map(unit => {
        if (!unit.name) {
          proxy.$modal.msgError("单位名称不能为空")
          throw new Error("单位名称不能为空")
        }
        return { unitName: unit.name }
      })
      await addUnitApi(payload)   // 传数组
      proxy.$modal.msgSuccess("新增成功")
      open.value = false
      getList()
    } catch (e) {
      proxy.$modal.msgError("提交失败")
    }
  }
}

/** 动态添加一行 */
function addUnitRow() {
  units.value.push({ name: "" })
}

/** 删除一行 */
function removeUnit(index) {
  units.value.splice(index, 1)
}

/** 删除按钮操作 */
function handleDelete(row) {
  const _ids = row.id || ids.value
  proxy.$modal.confirm(`是否确认删除单位名称为"${row.unitName}"的数据项？`).then(function() {
    return delUnit(_ids)
  }).then(() => {
    getList()
    proxy.$modal.msgSuccess("删除成功")
  }).catch(() => {})
}

getList()
</script>

<style scoped>
.unit-item {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}
.unit-index {
  width: 20px;
  display: inline-block;
}
</style>
```

### 4.3 界面效果

| 功能 | 效果 |
|------|------|
| 搜索表单 | 顶部搜索区域，输入单位名称后搜索/重置 |
| 新增按钮 | 点击弹出批量新增弹窗 |
| 表格显示 | 展示单位编码(UN{id})、单位名称、删除操作 |
| 批量新增弹窗 | 点击 `+` 增加行，`-` 移除行，确定后一次性提交数组 |
| 分页 | 底部页码切换 |

---

## 5. Part 管理实现（上传/回显/替换/删除/下载、检出/检入）

### 5.1 列表与过滤项

支持按以下条件过滤：

- **Part 名称**：文本输入
- **Part 种类**：下拉选择（原材料 Ma / 半成品 Sfp / 成品 Pro / 耗材类 Rhy / 其它 Oth）
- **状态**：下拉选择（启用 Enable / 停用 Disable）
- **购制属性**：下拉选择（购买 Pur / 自制 Manu）

创建日期格式化显示；版本显示 `displayVersion`；部分文本使用两行省略（clamp2）+ 悬浮 tooltip 展示完整内容。

### 5.2 单位下拉的「远程搜索」

```js
function remoteMethodUnit(keyword) {
  unitLoading.value = true
  listUnit({ pageNum: 1, pageSize: 100, ...(keyword ? { unitName: keyword } : {}) })
    .then(res => unitOptions.value = res.rows || [])
    .finally(() => unitLoading.value = false)
}
```

### 5.3 附件上传与三种态

新增/修改均走 `multipart/form-data`，前端把业务 `data(JSON)` 与文件 `file` 一起放入 FormData。

修改时附件有三种态：

| 状态 | 行为 | 前端处理 |
|------|------|---------|
| **A. 选择新文件** | 替换原附件 | 传入选中的 `selectedRawFile` |
| **B. 删除文件** | 清空附件 | 设置 `form.clearFile = true` |
| **C. 不动文件** | 保持原附件 | 不传 file 且 `clearFile = false` |

```js
// 受控文件列表
const fileList = ref([])
let selectedRawFile = null

function handleBeforeAdd() {
  uploadRef.value?.clearFiles?.()
  fileList.value = []
  selectedRawFile = null
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

// 提交（新增/修改）
proxy.$refs['partRef'].validate(async (valid) => {
  if (!valid) return
  if (!form.value.id) await addPart(form.value, selectedRawFile)
  else await updatePart(form.value, selectedRawFile)
  proxy.$modal.msgSuccess(form.value.id ? '修改成功' : '新增成功')
  open.value = false
  getList()
})
```

### 5.4 附件"下载预览名"与 Token 透传

后端通过 `FileProxyController` 统一透传文件流，并设置 `Content-Disposition`；前端 `downloadByStream` 自动拼接 `/dev-api` 且携带登录 Token，能兼容 302 跳转与中文文件名。

```js
// 列表中下载
function downloadFile(row) {
  if (!row.fileDownloadUrl) return ElMessage.error('无下载地址')
  const filename = row.fileName || 'download'
  const url = row.fileDownloadUrl + (filename ? `&filename=${encodeURIComponent(filename)}` : '')
  downloadByStream(url, filename)
}
```

### 5.5 工作流：检出 / 检入

**状态机规则：**

- `CHECKED_IN`（已检入）→ 可 **检出**、可 **删除**
- `CHECKED_OUT`（检出中）→ 可 **修改**、可 **检入**，**禁止删除**
- 包含 `CHECKED_OUT` 的选择将禁用批量删除按钮

**删除使用 masterId**（非版本 id），后端接口支持逗号分隔批量。

```js
const wsCode = (row) => {
  let v = row?.uiWorkingState || row?.workingStateAlias || row?.workingStateCode || row?.workingState
  if (!v) return ''
  if (typeof v === 'string') {
    const s = v.trim()
    if (s.startsWith('{') && s.endsWith('}')) {
      try { const o = JSON.parse(s); v = o.alias || o.code || '' } catch { v = s }
    } else v = s
  } else if (typeof v === 'object') {
    v = v?.alias || v?.code || ''
  }
  v = String(v).toUpperCase()
  if (v === 'INWORK') return 'CHECKED_OUT'
  if (v === 'CHECKED_IN') return 'CHECKED_IN'
  return v
}

function confirmCheckout(row) {
  const pn = `PN${row.id || ''}`
  proxy.$modal.confirm(`是否确认检出Part编码为"${pn}"的数据项？`)
    .then(() => checkOut(row.masterId))
    .then(() => { proxy.$modal.msgSuccess('检出成功'); getList() })
}

function confirmCheckin(row) {
  const pn = `PN${row.id || ''}`
  proxy.$modal.confirm(`是否确认检入Part编码为"${pn}"的数据项？`)
    .then(() => checkIn(row.masterId))
    .then(() => { proxy.$modal.msgSuccess('检入成功'); getList() })
}
```

### 5.6 模板结构（`index.vue`）

#### 搜索表单

```html
<el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="80px">
  <el-form-item label="Part名称" prop="partName">
    <el-input v-model="queryParams.partName" placeholder="请输入Part名称" clearable @keyup.enter="handleQuery" />
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
```

#### 工具栏

```html
<el-row :gutter="10" class="mb8">
  <el-col :span="1.5">
    <el-button type="primary" plain icon="Plus" @click="handleAdd">新增</el-button>
  </el-col>
  <el-col :span="1.5">
    <el-button type="danger" plain icon="Delete" :disabled="multiple || hasCheckedOutSelected"
      @click="handleBatchDelete">删除</el-button>
  </el-col>
  <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" />
</el-row>
```

#### 表格区

表格包含以下列：

| 列 | 说明 |
|----|------|
| 选择框 | 多选，用于批量删除 |
| 锁图标 | 检出状态显示红色锁 `<Lock />` |
| Part 编码 | `PN{id}`，两行省略 + tooltip |
| 中文名称 | 两行省略 + tooltip |
| 英文名称 | 两行省略 + tooltip |
| Part 种类 | 中文名称映射 |
| 规格型号 | 两行省略 + tooltip |
| 单位 | 单位名称 |
| Part 版本 | `displayVersion` |
| 购制属性 | 中文名称映射 |
| 状态 | 中文名称映射 |
| 附件 | 文件名两行省略 + 点击下载 |
| Part 说明 | 两行省略 + tooltip |
| 创建日期 | `{y}-{m}-{d}` 格式化 |
| 操作 | 检出/修改/检入/删除（按工作流状态显示） |

#### 弹窗（新增/修改）

```html
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
            <el-option v-for="item in unitOptions" :key="item.id" :label="item.unitName"
              :value="item.unitName" />
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
```

### 5.7 JS 逻辑与 CSS 样式

```vue
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
```

---

## 6. 新增知识点清单（务必掌握）

1. **单位管理支持「批量新增」**：一次弹窗渲染多行，并一次 POST 数组给后端。
2. **Part 管理使用 `multipart/form-data`**：同一接口既可传业务 JSON 又可传文件；修改时需覆盖三种附件态（替换/删除/保留）。
3. **下载链路**：通过 `FileProxyController` 透传、前端 `downloadByStream` 自动附带 Token，并提取服务端 `Content-Disposition` 作为最终文件名。
4. **检出/检入工作流**：新增 `wsCode` 归一工具、UI 禁用策略与 `masterId` 维度的删除约束。
5. **文本显示细节**：两行省略（`clamp2`）+ 悬浮全部文本的 tooltip；附件名也做了两行省略与点击下载。

---

## 7. 自测清单（按步骤打勾）

| # | 测试项 | 预期结果 |
|---|--------|---------|
| □ | 单位：搜索、分页 | 搜索过滤正确、分页正常切换 |
| □ | 单位：批量新增三行 | 弹窗可添加多行，一次提交成功 |
| □ | 单位：删除 | 删除其中一条成功 |
| □ | Part：四个过滤项 | 按名称/种类/状态/购制属性过滤有结果 |
| □ | Part：单位远程搜索 | 下拉可搜索已添加的单位 |
| □ | Part：新增携带附件 | 列表显示 `fileNameNoExt`，下载能拿到正确中文文件名 |
| □ | Part：修改不选文件 | 保持原附件不变 |
| □ | Part：修改选新文件 | 替换原附件成功 |
| □ | Part：修改手动移除文件 | `clearFile=true` 后端清空附件 |
| □ | Part：检出 | `CHECKED_IN` → 检出成功进入 `CHECKED_OUT` |
| □ | Part：检入 | `CHECKED_OUT` → 修改并检入成功 |
| □ | Part：批量删除禁用 | 选中包含 `CHECKED_OUT` 的行，删除按钮禁用 |
| □ | Part：批量删除可用 | 仅选 `CHECKED_IN` 的行可删除 |
| □ | Part：按 masterId 删除 | 后端按 masterId 批量删除成功 |

---

## 8. 常见问题（FAQ）

### Q1：为何 Part 的新增/修改要用 FormData？

**A1**：同时传 JSON + 文件，避免双次请求；后端可一次性解析 `data` 与 `file`，配合 `clearFile` 三态覆盖"替换/删除/保留"。

### Q2：为何不能删除 CHECKED_OUT 的行？

**A2**：该状态代表"正在编辑的工作副本"，强制删除会破坏版本一致性，业务要求先检入回到 `CHECKED_IN` 才允许删除。

### Q3：下载为什么不用项目默认 axios 实例？

**A3**：默认实例有响应拦截器，会把二进制流当 JSON 解析；故提供干净的 `downloadByStream`（基于 fetch）版本。

### Q4：文件名为什么能正确显示中文？

**A4**：后端设置 `Content-Disposition` 并兼容 `filename` 与 `filename*`；前端按 RFC 5987 解析，失败时兜底使用传参 `filename`。
