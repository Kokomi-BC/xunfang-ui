<template>
  <div class="app-container">
    <!-- ========== Tab 切换：BOM主表 / BOM明细 ========== -->
    <el-tabs v-model="activeTab" type="border-card" @tab-change="onTabChange" @tab-remove="onTabRemove">
      <!-- ==================== Tab 1: BOM 主表管理 ==================== -->
      <el-tab-pane label="BOM 主表管理" name="bom">
        <!-- 搜索区域 -->
        <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="80px" size="small">
          <el-form-item label="BOM编码" prop="bomCode">
            <el-input v-model="queryParams.bomCode" placeholder="请输入BOM编码" clearable @keyup.enter="handleQuery" />
          </el-form-item>
          <el-form-item label="BOM名称" prop="bomName">
            <el-input v-model="queryParams.bomName" placeholder="请输入BOM名称" clearable @keyup.enter="handleQuery" />
          </el-form-item>
          <el-form-item label="产品名称" prop="productName">
            <el-input v-model="queryParams.productName" placeholder="请输入产品名称" clearable @keyup.enter="handleQuery" />
          </el-form-item>
          <el-form-item label="BOM类型" prop="bomType">
            <el-select v-model="queryParams.bomType" placeholder="全部" clearable style="width: 130px;">
              <el-option v-for="op in bomTypeDict" :key="op.value" :label="op.label" :value="op.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="BOM状态" prop="bomStatus">
            <el-select v-model="queryParams.bomStatus" placeholder="全部" clearable style="width: 130px;">
              <el-option v-for="op in bomStatusDict" :key="op.value" :label="op.label" :value="op.value" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="Search" size="small" @click="handleQuery">搜索</el-button>
            <el-button icon="Refresh" size="small" @click="resetQuery">重置</el-button>
          </el-form-item>
        </el-form>

        <!-- 工具栏 -->
        <el-row :gutter="10" class="mb8">
          <el-col :span="1.5">
            <el-button type="primary" plain icon="Plus" size="small" @click="handleAdd">新增</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="danger" plain icon="Delete" size="small" :disabled="multiple || hasCheckedOutSelected" @click="handleBatchDelete">删除</el-button>
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" />
        </el-row>

        <!-- BOM 主表表格 -->
        <el-table v-loading="loading" :data="bomList" v-column-resize :row-class-name="bomRowClassName" @selection-change="handleSelectionChange">
          <el-table-column type="selection" width="45" align="center" :selectable="bomRowSelectable" />
          <el-table-column label="BOM编码" min-width="110" align="center" prop="bomCode" show-overflow-tooltip />
          <el-table-column label="BOM名称" min-width="130" align="center" prop="bomName" show-overflow-tooltip />
          <el-table-column label="产品名称" min-width="110" align="center" prop="productName" show-overflow-tooltip />
          <el-table-column label="产品族" min-width="100" align="center" prop="productFamily" show-overflow-tooltip />
          <el-table-column label="BOM类型" width="80" align="center">
            <template #default="{ row }">{{ row.bomTypeCnName || row.bomTypeAlias || row.bomType || '-' }}</template>
          </el-table-column>
          <el-table-column label="BOM状态" min-width="85" align="center">
            <template #default="{ row }">
              <el-tag :type="statusTagType(row.bomStatusColor)" size="small">{{ row.bomStatusCnName || row.bomStatus || '-' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="版本" width="55" align="center" prop="displayVersion" />
          <el-table-column label="描述" min-width="120" align="center" prop="bomDescription" show-overflow-tooltip />
          <el-table-column label="创建时间" width="150" align="center" prop="createTime">
            <template #default="{ row }">
              <span>{{ parseTime(row.createTime, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="270" fixed="right">
            <template #default="{ row }">
              <template v-if="wsCode(row)==='CHECKED_IN'">
                <el-button link type="primary" icon="Upload" @click="handleCheckout(row)">检出</el-button>
                <el-button link type="danger" icon="Delete" @click="handleSingleDelete(row)">删除</el-button>
              </template>
              <template v-else-if="wsCode(row)==='CHECKED_OUT'">
                <el-button link type="primary" icon="Edit" @click="handleUpdate(row)">修改</el-button>
                <el-button link type="success" icon="Download" @click="handleCheckin(row)">检入</el-button>
              </template>
              <el-button link type="info" icon="View" @click="viewItems(row)">明细</el-button>
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
      </el-tab-pane>

      <!-- ==================== 动态 BOM 明细标签页 ==================== -->
      <el-tab-pane
        v-for="bom in openedBoms"
        :key="'bom_' + (bom.masterId || bom.id)"
        :name="'bom_' + (bom.masterId || bom.id)"
        closable
      >
        <template #label>
          <span>{{ bom.bomName || bom.bomCode }}</span>
        </template>

        <!-- 明细搜索 -->
        <el-form :model="itemQueryParams" ref="itemQueryRef" :inline="true" label-width="80px" size="small">
          <el-form-item label="Part编码" prop="partCode">
            <el-input v-model="itemQueryParams.partCode" placeholder="请输入Part编码" clearable @keyup.enter="getItemList" />
          </el-form-item>
          <el-form-item label="Part名称" prop="partName">
            <el-input v-model="itemQueryParams.partName" placeholder="请输入Part名称" clearable @keyup.enter="getItemList" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="Search" size="small" @click="getItemList">搜索</el-button>
            <el-button icon="Refresh" size="small" @click="resetItemQuery">重置</el-button>
          </el-form-item>
        </el-form>

        <!-- 明细工具栏 -->
        <el-row :gutter="10" class="mb8">
          <el-col :span="1.5">
            <el-button type="primary" plain icon="Plus" size="small" @click="showItemBatchAdd">批量新增明细</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="danger" plain icon="Delete" size="small" :disabled="itemMultiple" @click="handleItemBatchDelete">批量删除</el-button>
          </el-col>
        </el-row>

        <!-- 明细表格 -->
        <el-table v-loading="itemLoading" :data="itemList" v-column-resize @selection-change="handleItemSelectionChange">
          <el-table-column type="selection" width="45" align="center" />
          <el-table-column label="行号" width="55" align="center" prop="lineNo" />
          <el-table-column label="Part编码" min-width="100" align="center" prop="partCode" show-overflow-tooltip />
          <el-table-column label="Part名称" min-width="120" align="center" prop="partName" show-overflow-tooltip />
          <el-table-column label="Part类型" width="80" align="center" prop="partType" />
          <el-table-column label="数量" width="80" align="center" prop="quantity" />
          <el-table-column label="单位" width="65" align="center" prop="unit" />
          <el-table-column label="备注" min-width="120" align="center" prop="remarks" show-overflow-tooltip />
          <el-table-column label="排序" width="70" align="center" prop="sortOrder" />
          <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="130" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" icon="Edit" @click="handleItemUpdate(row)">修改</el-button>
              <el-button link type="danger" icon="Delete" @click="handleItemSingleDelete(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <pagination
          v-show="itemTotal > 0"
          :total="itemTotal"
          v-model:page="itemQueryParams.pageNum"
          v-model:limit="itemQueryParams.pageSize"
          @pagination="getItemList"
        />
      </el-tab-pane>
    </el-tabs>

    <!-- ==================== BOM 新增/修改弹窗 ==================== -->
    <el-dialog :title="bomTitle" v-model="bomOpen" width="650px" append-to-body>
      <el-form ref="bomRef" :model="bomForm" :rules="bomRules" label-width="100px" size="small">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="BOM编码" prop="bomCode">
              <el-input v-model="bomForm.bomCode" placeholder="请输入BOM编码" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="BOM名称" prop="bomName">
              <el-input v-model="bomForm.bomName" placeholder="请输入BOM名称" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="产品名称" prop="productName">
              <el-input v-model="bomForm.productName" placeholder="请输入产品名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="产品族" prop="productFamily">
              <el-input v-model="bomForm.productFamily" placeholder="请输入产品族" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="BOM类型" prop="bomType">
              <el-select v-model="bomForm.bomType" placeholder="请选择BOM类型" style="width:100%">
                <el-option v-for="op in bomTypeDict" :key="op.value" :label="op.label" :value="op.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="BOM状态" prop="bomStatus">
              <el-select v-model="bomForm.bomStatus" placeholder="请选择BOM状态" style="width:100%">
                <el-option v-for="op in bomStatusDict" :key="op.value" :label="op.label" :value="op.value" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="BOM描述" prop="bomDescription">
          <el-input
            type="textarea"
            v-model="bomForm.bomDescription"
            placeholder="请输入BOM描述"
            :autosize="{ minRows: 3, maxRows: 6 }"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitBomForm">确 定</el-button>
          <el-button @click="bomCancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- ==================== BOM 明细批量新增弹窗 ==================== -->
    <el-dialog title="批量新增明细" v-model="itemBatchOpen" width="900px" append-to-body>
      <div style="margin-bottom:10px;">
        <el-button type="primary" size="small" icon="Plus" @click="addItemRow">添加行</el-button>
        <span style="margin-left:12px;color:#909399;font-size:13px;">共 {{ itemBatchRows.length }} 行</span>
      </div>
      <el-table :data="itemBatchRows" border stripe>
        <el-table-column label="行号" width="70" align="center">
          <template #default="{ $index }">{{ $index + 1 }}</template>
        </el-table-column>
        <el-table-column label="Part编码" width="150" align="center">
          <template #default="{ row }">
            <el-input v-model="row.partCode" placeholder="Part编码" size="small" />
          </template>
        </el-table-column>
        <el-table-column label="Part名称" width="180" align="center">
          <template #default="{ row }">
            <el-input v-model="row.partName" placeholder="Part名称" size="small" />
          </template>
        </el-table-column>
        <el-table-column label="Part类型" width="120" align="center">
          <template #default="{ row }">
            <el-select v-model="row.partType" placeholder="类型" size="small" style="width:100%">
              <el-option v-for="t in partTypeDict" :key="t" :label="t" :value="t" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="数量" width="100" align="center">
          <template #default="{ row }">
            <el-input-number v-model="row.quantity" :min="1" size="small" controls-position="right" style="width:100%" />
          </template>
        </el-table-column>
        <el-table-column label="单位" width="100" align="center">
          <template #default="{ row }">
            <el-select v-model="row.unit" placeholder="单位" size="small" filterable allow-create clearable style="width:100%">
              <el-option v-for="u in unitList" :key="u" :label="u" :value="u" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="备注" min-width="140" align="center">
          <template #default="{ row }">
            <el-input v-model="row.remarks" placeholder="备注" size="small" />
          </template>
        </el-table-column>
        <el-table-column label="排序" width="90" align="center">
          <template #default="{ row }">
            <el-input-number v-model="row.sortOrder" :min="0" size="small" controls-position="right" style="width:100%" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="60" align="center">
          <template #default="{ $index }">
            <el-button link type="danger" icon="Delete" size="small" @click="removeItemRow($index)" />
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitItemBatch">确 定</el-button>
          <el-button @click="itemBatchOpen = false">取 消</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- ==================== BOM 明细单条修改弹窗 ==================== -->
    <el-dialog title="修改明细" v-model="itemEditOpen" width="700px" append-to-body>
      <el-form ref="itemEditRef" :model="itemEditForm" :rules="itemEditRules" label-width="100px" size="small">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="行号" prop="lineNo">
              <el-input-number v-model="itemEditForm.lineNo" :min="1" controls-position="right" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Part编码" prop="partCode">
              <el-input v-model="itemEditForm.partCode" placeholder="Part编码" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Part名称" prop="partName">
              <el-input v-model="itemEditForm.partName" placeholder="Part名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Part类型" prop="partType">
              <el-select v-model="itemEditForm.partType" placeholder="类型" style="width:100%">
                <el-option v-for="t in partTypeDict" :key="t" :label="t" :value="t" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="数量" prop="quantity">
              <el-input-number v-model="itemEditForm.quantity" :min="1" controls-position="right" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="单位" prop="unit">
              <el-select v-model="itemEditForm.unit" placeholder="单位" filterable allow-create clearable style="width:100%">
                <el-option v-for="u in unitList" :key="u" :label="u" :value="u" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="排序" prop="sortOrder">
              <el-input-number v-model="itemEditForm.sortOrder" :min="0" controls-position="right" style="width:100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="备注" prop="remarks">
          <el-input v-model="itemEditForm.remarks" placeholder="备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitItemEdit">确 定</el-button>
          <el-button @click="itemEditOpen = false">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="Bom">
import { ref, reactive, toRefs, getCurrentInstance } from "vue"
import { ElMessage } from "element-plus"
import {
  listBom, getBom, addBom, updateBom,
  checkoutBom, checkinBom,
  delBom, delBomBatch
} from "@/api/manufacture/bom"
import {
  listBomItem, batchAddBomItem, updateBomItem,
  delBomItem, delBomItemBatch
} from "@/api/manufacture/bomItem"
import { listUnit } from "@/api/manufacture/unit"

const { proxy } = getCurrentInstance()

// ==================== Tab 状态 ====================
const activeTab = ref("bom")
const currentBom = ref(null)
const openedBoms = ref([])

// ==================== 字典 ====================
const bomTypeDict = [
  { label: "工程BOM", value: "EBOM" },
  { label: "制造BOM", value: "MBOM" },
  { label: "销售BOM", value: "SBOM" }
]
const bomStatusDict = [
  { label: "草稿", value: "Draft" },
  { label: "已审批", value: "Approved" },
  { label: "生效", value: "Active" },
  { label: "废弃", value: "Obsolete" }
]
const partTypeDict = ["成品", "半成品", "原材料", "工艺辅料"]
const unitList = ref([])

function getUnitList() {
  listUnit({ pageNum: 1, pageSize: 999 }).then(res => {
    unitList.value = (res.rows || []).map(u => u.unitCode || u.unitName || u.name).filter(Boolean)
  }).catch(() => {})
}

/** BOM状态 → Element tag type */
function statusTagType(color) {
  const map = { green: "success", blue: "primary", red: "danger", gray: "info" }
  return map[color] || ""
}

/** 字典值提取（兼容对象/字符串） */
function extractDictValue(val) {
  if (!val) return null
  if (typeof val === 'object') return val.alias || val.value || val.code || val.key || ''
  return val
}

// ==================== BOM 主表 ====================
const bomList = ref([])
const loading = ref(true)
const showSearch = ref(true)
const ids = ref([])
const single = ref(true)
const multiple = ref(true)
const total = ref(0)
const bomTitle = ref("")
const bomOpen = ref(false)
const hasCheckedOutSelected = ref(false)
const selectedRows = ref([])

const data = reactive({
  bomForm: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    bomCode: null,
    bomName: null,
    productName: null,
    bomType: null,
    bomStatus: null
  },
  bomRules: {
    bomCode: [{ required: true, message: "BOM编码不能为空", trigger: "blur" }],
    bomName: [{ required: true, message: "BOM名称不能为空", trigger: "blur" }],
    productName: [{ required: true, message: "产品名称不能为空", trigger: "blur" }],
    productFamily: [{ required: true, message: "产品族不能为空", trigger: "blur" }],
    bomType: [{ required: true, message: "请选择BOM类型", trigger: "change" }],
    bomStatus: [{ required: true, message: "请选择BOM状态", trigger: "change" }]
  }
})
const { queryParams, bomForm, bomRules } = toRefs(data)

/** 工作状态解析 */
function wsCode(row) {
  if (row?.uiWorkingState) return row.uiWorkingState
  const alias = row?.workingStateAlias
  if (alias) {
    const u = String(alias).toUpperCase()
    if (u === "INWORK") return "CHECKED_OUT"
    if (u === "CHECKED_IN") return "CHECKED_IN"
    return u
  }
  return ""
}

/** 复选框可选（已检出不可选） */
function bomRowSelectable(row) {
  return wsCode(row) !== 'CHECKED_OUT'
}

/** 行样式（检出状态红色左边框标记） */
function bomRowClassName({ row }) {
  return wsCode(row) === 'CHECKED_OUT' ? 'row-checked-out' : ''
}

/** 列表 */
function getList() {
  loading.value = true
  listBom(queryParams.value).then((response) => {
    bomList.value = response.rows || []
    total.value = response.total || 0
    loading.value = false
  }).catch(() => { loading.value = false })
}

/** 选择变化 */
function handleSelectionChange(selection) {
  selectedRows.value = selection
  ids.value = selection.map(item => item.masterId || item.id)
  single.value = selection.length != 1
  multiple.value = !selection.length
  hasCheckedOutSelected.value = selection.some(item => wsCode(item) === 'CHECKED_OUT')
}

/** 搜索/重置 */
function handleQuery() { queryParams.value.pageNum = 1; getList() }
function resetQuery() { try { proxy.resetForm("queryRef") } catch (e) {}; handleQuery() }

/** 新增 */
function handleAdd() {
  resetBomForm()
  bomOpen.value = true
  bomTitle.value = "新增BOM"
}

/** 修改（需检出） */
function handleUpdate(row) {
  if (wsCode(row) !== 'CHECKED_OUT') {
    ElMessage.warning('请先检出，再进行修改')
    return
  }
  resetBomForm()
  // 先用列表行数据立即填充，确保弹出即有默认值
  bomForm.value = {
    id: row.id ?? row.masterId ?? null,
    bomCode: row.bomCode ?? null,
    bomName: row.bomName ?? null,
    productName: row.productName ?? null,
    productFamily: row.productFamily ?? null,
    bomType: row.bomTypeAlias || extractDictValue(row.bomType),
    bomStatus: row.bomStatusAlias || extractDictValue(row.bomStatus),
    bomDescription: row.bomDescription ?? null
  }
  bomOpen.value = true
  bomTitle.value = "修改BOM"
  // 异步拉取最新数据覆盖
  getBom(row.masterId || row.id).then((response) => {
    const d = response.data || response
    bomForm.value = {
      id: d.id ?? d.masterId ?? bomForm.value.id,
      bomCode: d.bomCode ?? bomForm.value.bomCode,
      bomName: d.bomName ?? bomForm.value.bomName,
      productName: d.productName ?? bomForm.value.productName,
      productFamily: d.productFamily ?? bomForm.value.productFamily,
      bomType: d.bomTypeAlias || extractDictValue(d.bomType) || bomForm.value.bomType,
      bomStatus: d.bomStatusAlias || extractDictValue(d.bomStatus) || bomForm.value.bomStatus,
      bomDescription: d.bomDescription ?? bomForm.value.bomDescription
    }
  }).catch(() => {})
}

/** 检出 */
function handleCheckout(row) {
  proxy.$modal.confirm(`确认检出 BOM「${row.bomName || row.bomCode}」？`)
    .then(() => checkoutBom({ masterId: row.masterId }))
    .then((res) => { proxy.$modal.msgSuccess(res.msg || "检出成功"); getList() })
    .catch(() => {})
}

/** 检入 */
function handleCheckin(row) {
  proxy.$modal.confirm(`确认检入 BOM「${row.bomName || row.bomCode}」？`)
    .then(() => checkinBom({ masterId: row.masterId }))
    .then((res) => { proxy.$modal.msgSuccess(res.msg || "检入成功"); getList() })
    .catch(() => {})
}

/** 单个删除 */
function handleSingleDelete(row) {
  if (wsCode(row) === 'CHECKED_OUT') {
    ElMessage.warning('请先检入，再进行删除')
    return
  }
  proxy.$modal.confirm(`确认删除 BOM「${row.bomName || row.bomCode}」？`)
    .then(() => delBom(row.masterId))
    .then((res) => { proxy.$modal.msgSuccess(res.msg || "删除成功"); getList() })
    .catch(() => {})
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
  proxy.$modal.confirm(`确认批量删除（${tip}）？`)
    .then(() => delBomBatch(idsToDelete))
    .then((res) => { proxy.$modal.msgSuccess(res.msg || "批量删除成功"); getList() })
    .catch(() => {})
}

/** 提交BOM表单 */
function submitBomForm() {
  proxy.$refs["bomRef"].validate((valid) => {
    if (!valid) return
    if (bomForm.value.id) {
      updateBom(bomForm.value).then((res) => {
        proxy.$modal.msgSuccess(res.msg || "修改成功")
        bomOpen.value = false
        getList()
      })
    } else {
      addBom(bomForm.value).then((res) => {
        proxy.$modal.msgSuccess(res.msg || "新增成功")
        bomOpen.value = false
        getList()
      })
    }
  })
}

function bomCancel() { bomOpen.value = false; resetBomForm() }
function resetBomForm() {
  bomForm.value = {
    id: null, bomCode: null, bomName: null, productName: null,
    productFamily: null, bomType: null, bomStatus: null, bomDescription: null
  }
  try { proxy.resetForm("bomRef") } catch (e) {}
}

/** 查看明细 */
function viewItems(row) {
  const bomKey = String(row.masterId || row.id)
  if (!openedBoms.value.find(b => String(b.masterId || b.id) === bomKey)) {
    openedBoms.value.push(row)
  }
  activeTab.value = "bom_" + bomKey
}

function onTabChange(name) {
  if (name === "bom") {
    currentBom.value = null
  } else if (name.startsWith("bom_")) {
    const bomId = name.replace("bom_", "")
    currentBom.value = openedBoms.value.find(b => String(b.masterId || b.id) === bomId) || null
    if (currentBom.value) {
      itemQueryParams.value.pageNum = 1
      getItemList()
    }
  }
}

/** 关闭明细标签 */
function onTabRemove(name) {
  if (!name.startsWith("bom_")) return
  const bomId = name.replace("bom_", "")
  const idx = openedBoms.value.findIndex(b => String(b.masterId || b.id) === bomId)
  if (idx < 0) return
  openedBoms.value.splice(idx, 1)
  if (activeTab.value === name) {
    if (openedBoms.value.length > 0) {
      const next = openedBoms.value[Math.min(idx, openedBoms.value.length - 1)]
      activeTab.value = "bom_" + String(next.masterId || next.id)
    } else {
      activeTab.value = "bom"
    }
  }
}

// ==================== BOM 明细 ====================
const itemList = ref([])
const itemLoading = ref(false)
const itemTotal = ref(0)
const itemIds = ref([])
const itemSingle = ref(true)
const itemMultiple = ref(true)
const itemBatchOpen = ref(false)
const itemEditOpen = ref(false)
const itemBatchRows = ref([])

const itemData = reactive({
  itemQueryParams: {
    pageNum: 1,
    pageSize: 10,
    bomId: null,
    partCode: null,
    partName: null
  },
  itemEditForm: {},
  itemEditRules: {
    partCode: [{ required: true, message: "Part编码不能为空", trigger: "blur" }],
    partName: [{ required: true, message: "Part名称不能为空", trigger: "blur" }],
    quantity: [{ required: true, message: "数量不能为空", trigger: "blur" }]
  }
})
const { itemQueryParams, itemEditForm, itemEditRules } = toRefs(itemData)

function getItemList() {
  if (!currentBom.value) return
  itemQueryParams.value.bomId = currentBom.value.masterId || currentBom.value.id
  itemLoading.value = true
  listBomItem(itemQueryParams.value).then((response) => {
    itemList.value = response.rows || []
    itemTotal.value = response.total || 0
    itemLoading.value = false
  }).catch(() => { itemLoading.value = false })
}

function resetItemQuery() {
  itemQueryParams.value.partCode = null
  itemQueryParams.value.partName = null
  getItemList()
}

function handleItemSelectionChange(selection) {
  itemIds.value = selection.map(item => item.id)
  itemSingle.value = selection.length != 1
  itemMultiple.value = !selection.length
}

/** 批量新增明细 */
function showItemBatchAdd() {
  itemBatchRows.value = [makeEmptyItemRow()]
  itemBatchOpen.value = true
}

function makeEmptyItemRow() {
  return {
    partCode: "", partName: "", partType: "原材料",
    quantity: 1, unit: "个", remarks: "", sortOrder: 10
  }
}

function addItemRow() {
  itemBatchRows.value.push(makeEmptyItemRow())
}

function removeItemRow(index) {
  if (itemBatchRows.value.length <= 1) {
    ElMessage.warning("至少保留一行")
    return
  }
  itemBatchRows.value.splice(index, 1)
}

function submitItemBatch() {
  const items = itemBatchRows.value.map((row, i) => ({
    bomId: currentBom.value.masterId || currentBom.value.id,
    bomCode: currentBom.value.bomCode,
    lineNo: i + 1,
    partCode: row.partCode,
    partName: row.partName,
    partType: row.partType,
    quantity: Number(row.quantity) || 1,
    unit: row.unit,
    remarks: row.remarks,
    sortOrder: Number(row.sortOrder) || (i + 1) * 10
  }))

  // 简单校验
  const emptyCode = items.find(item => !item.partCode)
  if (emptyCode) { ElMessage.warning("Part编码不能为空"); return }

  batchAddBomItem(items).then((res) => {
    proxy.$modal.msgSuccess(res.msg || "批量新增成功")
    itemBatchOpen.value = false
    getItemList()
  })
}

/** 单条修改 */
function handleItemUpdate(row) {
  itemEditForm.value = {
    ...row,
    quantity: row.quantity != null ? Number(row.quantity) : 1,
    sortOrder: row.sortOrder != null ? Number(row.sortOrder) : 0,
    lineNo: row.lineNo != null ? Number(row.lineNo) : 1
  }
  itemEditOpen.value = true
}

function submitItemEdit() {
  proxy.$refs["itemEditRef"].validate((valid) => {
    if (!valid) return
    updateBomItem(itemEditForm.value).then((res) => {
      proxy.$modal.msgSuccess(res.msg || "修改成功")
      itemEditOpen.value = false
      getItemList()
    })
  })
}

/** 单条删除 */
function handleItemSingleDelete(row) {
  proxy.$modal.confirm(`确认删除明细行「${row.partCode}」？`)
    .then(() => delBomItem(row.id))
    .then((res) => { proxy.$modal.msgSuccess(res.msg || "删除成功"); getItemList() })
    .catch(() => {})
}

/** 批量删除 */
function handleItemBatchDelete() {
  const idsToDelete = itemIds.value
  if (!idsToDelete.length) return ElMessage.warning('请先选择要删除的数据')
  proxy.$modal.confirm(`确认批量删除 ${idsToDelete.length} 条明细？`)
    .then(() => delBomItemBatch(idsToDelete))
    .then((res) => { proxy.$modal.msgSuccess(res.msg || "批量删除成功"); getItemList() })
    .catch(() => {})
}

// ==================== 初始化 ====================
getUnitList()
getList()
</script>

<style scoped>
.lock-red {
  color: #f56c6c;
  font-size: 16px;
}
</style>
