<template>
  <div class="app-container">
    <!-- 查询表单 -->
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="采购订单号" prop="purchaseOrderCode" label-width="auto">
        <el-input
          v-model="queryParams.purchaseOrderCode"
          placeholder="请输入采购订单号"
          clearable
          style="width: 200px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="采购日期">
        <el-date-picker
          v-model="queryParams.purchaseDateStart"
          type="date"
          value-format="YYYY-MM-DD"
          placeholder="开始日期"
          style="width: 150px"
          clearable
        />
        <span style="margin: 0 6px;">—</span>
        <el-date-picker
          v-model="queryParams.purchaseDateEnd"
          type="date"
          value-format="YYYY-MM-DD"
          placeholder="结束日期"
          style="width: 150px"
          clearable
        />
      </el-form-item>
      <el-form-item label="供应商名称" prop="supplierName" label-width="auto">
        <el-input
          v-model="queryParams.supplierName"
          placeholder="请输入供应商名称"
          clearable
          style="width: 200px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="物料编号" prop="materialCode">
        <el-input
          v-model="queryParams.materialCode"
          placeholder="请输入物料编号"
          clearable
          style="width: 200px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="物料名称" prop="materialName">
        <el-input
          v-model="queryParams.materialName"
          placeholder="请输入物料名称"
          clearable
          style="width: 200px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="订单状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择订单状态" clearable style="width: 200px">
          <el-option label="待确认" value="1" />
          <el-option label="已确认" value="2" />
          <el-option label="已发货" value="3" />
          <el-option label="已完成" value="4" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 按钮区 -->
    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="primary" plain icon="Plus" @click="handleAdd">新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete">删除</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <!-- 表格区 -->
    <el-table v-loading="loading" :data="orderList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" :selectable="isSelectable" />
      <el-table-column label="序号" type="index" width="60" align="center" :index="indexMethod" />
      <el-table-column v-if="false" label="采购订单id" align="center" prop="id" />
      <el-table-column label="采购订单号" align="center" prop="purchaseOrderCode" />
      <el-table-column label="采购日期" align="center" prop="purchaseDate" width="180">
        <template #default="scope">
          <span>{{ parseTime(scope.row.purchaseDate, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="供应商名称" align="center" prop="supplierName" :show-overflow-tooltip="true" />
      <el-table-column label="供应商联系人" align="center" prop="supplierLinkMan" />
      <el-table-column label="物料编号" align="center" prop="materialCode" />
      <el-table-column label="物料名称" align="center" prop="materialName" :show-overflow-tooltip="true" />
      <el-table-column label="规格型号" align="center" prop="specificationsModels" :show-overflow-tooltip="true" />
      <el-table-column label="采购数量" align="center" prop="purchaseQuantity" />
      <el-table-column label="单位" align="center" prop="unit" />
      <el-table-column label="单价（元）" align="center" prop="unitPrice" :formatter="formatPrice" />
      <el-table-column label="总价格（元）" align="center" prop="totalPrice" :formatter="formatPrice" />
      <el-table-column label="订单状态" align="center" prop="status">
        <template #default="scope">
          <span>{{ formatStatus(scope.row.status) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="备注" align="center" prop="remark" :show-overflow-tooltip="true" />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="260">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)">修改</el-button>
          <el-button link type="danger" icon="Delete" @click="handleDelete(scope.row)">删除</el-button>
          <el-button v-if="scope.row.status == '1'" link type="success" @click="() => changeOrderStatus(scope.row, '2')">确认</el-button>
          <el-button v-if="scope.row.status == '2'" link type="warning" @click="() => changeOrderStatus(scope.row, '3')">已发货</el-button>
          <el-button v-if="scope.row.status == '3'" link type="success" @click="() => changeOrderStatus(scope.row, '4')">已完成</el-button>
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

    <!-- 添加或修改采购订单对话框 -->
    <el-dialog :title="title" v-model="open" width="500px" append-to-body>
      <el-form ref="orderRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="采购订单号" prop="purchaseOrderCode" label-width="auto">
          <el-input v-model="form.purchaseOrderCode" placeholder="请输入采购订单号" />
        </el-form-item>
        <el-form-item label="采购日期" prop="purchaseDate">
          <el-date-picker
            v-model="form.purchaseDate"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="请选择采购日期"
            clearable
          />
        </el-form-item>
        <el-form-item label="供应商名称" prop="supplierName" label-width="auto">
          <el-input v-model="form.supplierName" readonly placeholder="请选择供应商" @click="openSup" />
        </el-form-item>
        <el-form-item label="供应商联系人" prop="supplierLinkMan" label-width="auto">
          <el-input v-model="form.supplierLinkMan" readonly placeholder="自动填充" disabled />
        </el-form-item>
        <el-form-item label="物料编号" prop="materialCode">
          <el-input v-model="form.materialCode" placeholder="请输入物料编号" />
        </el-form-item>
        <el-form-item label="物料名称" prop="materialName">
          <el-input v-model="form.materialName" placeholder="请输入物料名称" />
        </el-form-item>
        <el-form-item label="规格型号" prop="specificationsModels">
          <el-input v-model="form.specificationsModels" placeholder="请输入规格型号" />
        </el-form-item>
        <el-form-item label="采购数量" prop="purchaseQuantity">
          <el-input v-model.number="form.purchaseQuantity" placeholder="请输入采购数量" @input="calcTotalPrice" />
        </el-form-item>
        <el-form-item label="单位" prop="unit">
          <el-input v-model="form.unit" placeholder="请输入单位" />
        </el-form-item>
        <el-form-item label="单价" prop="unitPrice">
          <el-input v-model.number="form.unitPrice" placeholder="请输入单价" @input="calcTotalPrice" @blur="roundUnitPrice">
            <template #append>元</template>
          </el-input>
        </el-form-item>
        <el-form-item label="总价格" prop="totalPrice">
          <el-input v-model="form.totalPrice" disabled>
            <template #append>元</template>
          </el-input>
        </el-form-item>
        <el-form-item label="订单状态" prop="status">
          <el-select v-model="form.status">
            <el-option label="待确认" value="1" />
            <el-option label="已确认" value="2" />
            <el-option label="已发货" value="3" />
            <el-option label="已完成" value="4" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" placeholder="请输入备注" type="textarea" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 供应商选择对话框 -->
    <el-dialog :title="supTitle" v-model="supplierOpen" width="1200px" @close="clearSupplierSelection" append-to-body>
      <el-table v-loading="supLoading" :data="supplierList">
        <el-table-column align="center" width="80" label="选择">
          <template #default="scope">
            <el-radio v-model="selectedSupplierId" :value="scope.row.id" @change="handleSupplierSelect(scope.row)" />
          </template>
        </el-table-column>
        <el-table-column v-if="false" label="供应商id" align="center" prop="id" />
        <el-table-column label="供应商编码" align="center" prop="supplierCode" />
        <el-table-column label="供应商名称" align="center" prop="supplierName" />
        <el-table-column label="供应商联系人" align="center" prop="linkMan" />
        <el-table-column label="联系电话" align="center" prop="linkPhone" />
        <el-table-column label="联系邮箱" align="center" prop="linkEmail" :show-overflow-tooltip="true" />
        <el-table-column label="供应商类型" align="center" prop="supplierType">
          <template #default="scope">
            <span>{{ formatSupplierType(scope.row) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="联系地址" align="center" prop="address" :show-overflow-tooltip="true" />
        <el-table-column label="供货范围" align="center" prop="scopeOfSupply" :show-overflow-tooltip="true" />
        <el-table-column label="合作状态" align="center" prop="cooperativeStatus">
          <template #default="scope">
            <span>{{ formatCooperativeStatus(scope.row) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="备注" align="center" prop="remark" :show-overflow-tooltip="true" />
      </el-table>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="confirmSelectSupplier">确 定</el-button>
          <el-button @click="cancelSelectSupplier">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="Order">
import { listPurchaseOrder, getPurchaseOrder, delPurchaseOrder, addPurchaseOrder, updatePurchaseOrder } from "@/api/manufacture/purchaseorder"
import { listSupplier } from "@/api/manufacture/supplier"

const { proxy } = getCurrentInstance()

const orderList = ref([])
const open = ref(false)
const supplierOpen = ref(false)
const loading = ref(true)
const supLoading = ref(false)
const showSearch = ref(true)
const ids = ref([])
const single = ref(true)
const multiple = ref(true)
const total = ref(0)
const title = ref("")
const supTitle = ref("")

const supplierList = ref([])
const selectedSupplierId = ref(null)
const curRow = ref(null)

const data = reactive({
  form: { status: "1" },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    purchaseOrderCode: null,
    purchaseDateStart: null,
    purchaseDateEnd: null,
    supplierName: null,
    materialCode: null,
    materialName: null,
    status: null
  },
  rules: {
    purchaseOrderCode: [{ required: true, message: "采购订单号不能为空", trigger: "blur" }],
    purchaseDate: [{ required: true, message: "采购日期不能为空", trigger: "change" }],
    supplierName: [{ required: true, message: "供应商名称不能为空", trigger: "change" }],
    materialCode: [{ required: true, message: "物料编号不能为空", trigger: "blur" }],
    materialName: [{ required: true, message: "物料名称不能为空", trigger: "blur" }],
    purchaseQuantity: [{ required: true, message: "采购数量不能为空", trigger: "blur" }],
    unitPrice: [{ required: true, message: "单价不能为空", trigger: "blur" }]
  }
})

const { queryParams, form, rules } = toRefs(data)

// ========== 数据获取与重置 ==========

/** 查询采购订单列表 */
function getList() {
  loading.value = true
  listPurchaseOrder(queryParams.value).then(response => {
    orderList.value = response.rows
    total.value = response.total
    loading.value = false
  })
}

/** 序号计算 */
function indexMethod(index) {
  return (queryParams.value.pageNum - 1) * queryParams.value.pageSize + index + 1
}

/** 取消按钮 */
function cancel() {
  open.value = false
  reset()
}

/** 表单重置 */
function reset() {
  form.value = {
    id: null,
    purchaseOrderCode: null,
    purchaseDate: null,
    supplierName: null,
    supplierLinkMan: null,
    materialCode: null,
    materialName: null,
    specificationsModels: null,
    purchaseQuantity: null,
    unit: null,
    unitPrice: null,
    totalPrice: null,
    status: "1",
    remark: null
  }
  proxy.resetForm("orderRef")
}

/** 搜索按钮操作 */
function handleQuery() {
  queryParams.value.pageNum = 1
  getList()
}

/** 重置按钮操作 */
function resetQuery() {
  proxy.resetForm("queryRef")
  queryParams.value.purchaseDateStart = null
  queryParams.value.purchaseDateEnd = null
  handleQuery()
}

// ========== 表格选择与行操作 ==========

/** 多选框选中数据 */
function handleSelectionChange(selection) {
  ids.value = selection.map(item => item.id)
  single.value = selection.length != 1
  multiple.value = !selection.length
}

/** 新增按钮操作 */
function handleAdd() {
  reset()
  open.value = true
  title.value = "添加采购订单"
}

/** 修改按钮操作 */
function handleUpdate(row) {
  reset()
  const _id = row.id || ids.value
  getPurchaseOrder(_id).then(response => {
    form.value = response.data
    // 价格保留两位小数
    if (form.value.unitPrice != null) form.value.unitPrice = Number(form.value.unitPrice).toFixed(2)
    if (form.value.totalPrice != null) form.value.totalPrice = Number(form.value.totalPrice).toFixed(2)
    open.value = true
    title.value = "修改采购订单"
  })
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs["orderRef"].validate(valid => {
    if (valid) {
      if (form.value.id != null) {
        updatePurchaseOrder(form.value).then(() => {
          proxy.$modal.msgSuccess("修改成功")
          open.value = false
          getList()
        })
      } else {
        addPurchaseOrder(form.value).then(() => {
          proxy.$modal.msgSuccess("新增成功")
          open.value = false
          getList()
        })
      }
    }
  })
}

/** 删除按钮操作 */
function handleDelete(row) {
  const _ids = row.id || ids.value
  proxy.$modal.confirm('是否确认删除采购订单编号为"' + _ids + '"的数据项？').then(function () {
    return delPurchaseOrder(_ids)
  }).then(() => {
    getList()
    proxy.$modal.msgSuccess("删除成功")
  }).catch(() => {})
}

// ========== 表单计算与状态格式化 ==========

/** 计算总价格 */
function calcTotalPrice() {
  const quantity = Number(form.value.purchaseQuantity || 0)
  const price = Number(form.value.unitPrice || 0)
  form.value.totalPrice = (quantity * price).toFixed(2)
}

/** 单价失焦时强制保留两位小数 */
function roundUnitPrice() {
  if (form.value.unitPrice !== null && form.value.unitPrice !== undefined && form.value.unitPrice !== '') {
    form.value.unitPrice = Number(form.value.unitPrice).toFixed(2)
    calcTotalPrice()
  }
}

/** 订单状态格式化 */
function formatStatus(status) {
  const map = { '1': '待确认', '2': '已确认', '3': '已发货', '4': '已完成' }
  return map[status] || '-'
}

/** 价格保留两位小数 */
function formatPrice(row, column, cellValue) {
  if (cellValue === null || cellValue === undefined || cellValue === '') return '-'
  return Number(cellValue).toFixed(2)
}

/** 订单状态流转 */
function changeOrderStatus(row, newStatus) {
  const updated = { ...row, status: newStatus }
  updatePurchaseOrder(updated).then(() => {
    proxy.$modal.msgSuccess("订单状态已更新为：" + formatStatus(newStatus))
    getList()
  }).catch(() => {
    proxy.$modal.msgError("状态更新失败")
  })
}

// ========== 供应商选择相关 ==========

/** 打开供应商选择弹窗 */
function openSup() {
  getSupList()
  selectedSupplierId.value = null
  curRow.value = null
  supplierOpen.value = true
  supTitle.value = "请选择供应商"
}

/** 获取供应商列表（用于选择弹窗） */
function getSupList() {
  supLoading.value = true
  listSupplier({ pageNum: 1, pageSize: 100 }).then(response => {
    supplierList.value = response.rows
    supLoading.value = false
  })
}

/** 确认选择供应商 */
function confirmSelectSupplier() {
  if (!curRow.value) {
    proxy.$modal.msgWarning("请选择一个供应商")
    return
  }
  form.value.supplierName = curRow.value.supplierName
  form.value.supplierLinkMan = curRow.value.linkMan
  supplierOpen.value = false
}

/** 取消选择供应商 */
function cancelSelectSupplier() {
  supplierOpen.value = false
}

/** 关闭弹窗时清除选择 */
function clearSupplierSelection() {
  selectedSupplierId.value = null
  curRow.value = null
}

/** 单选供应商 */
function handleSupplierSelect(row) {
  curRow.value = row
}

// ========== 格式化函数 ==========

/** 供应商类型格式化 */
function formatSupplierType(row) {
  const map = { '1': '原材料供应商', '2': '设备供应商', '3': '零件供应商' }
  return map[row.supplierType] || '-'
}

/** 合作状态格式化 */
function formatCooperativeStatus(row) {
  const map = { '1': '合作中', '2': '已暂停', '3': '已中止' }
  return map[row.cooperativeStatus] || '-'
}

// ========== 选择框控制 ==========

/** 只有状态为"待确认"的订单显示选择框 */
function isSelectable(row) {
  return row.status == '1'
}

// ========== 页面初始化 ==========
getList()
</script>
