<template>
  <div class="app-container">
    <!-- 查询表单 -->
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="供应商编码" prop="supplierCode" label-width="auto">
        <el-input
          v-model="queryParams.supplierCode"
          placeholder="请输入供应商编码"
          clearable
          style="width: 200px"
          @keyup.enter="handleQuery"
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
      <el-form-item label="供应商类型" prop="supplierType" label-width="auto">
        <el-select v-model="queryParams.supplierType" placeholder="请选择供应商类型" clearable style="width: 200px">
          <el-option label="原材料供应商" value="1" />
          <el-option label="设备供应商" value="2" />
          <el-option label="零件供应商" value="3" />
        </el-select>
      </el-form-item>
      <el-form-item label="合作状态" prop="cooperativeStatus" label-width="auto">
        <el-select v-model="queryParams.cooperativeStatus" placeholder="请选择合作状态" clearable style="width: 200px">
          <el-option label="合作中" value="1" />
          <el-option label="已暂停" value="2" />
          <el-option label="已中止" value="3" />
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
    <el-table v-loading="loading" :data="supplierList" v-column-resize @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="序号" type="index" width="60" align="center" :index="indexMethod" />
      <el-table-column v-if="false" label="供应商id" align="center" prop="id" />
      <el-table-column label="供应商编码" align="center" prop="supplierCode" />
      <el-table-column label="供应商名称" align="center" prop="supplierName" :show-overflow-tooltip="true" />
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
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="150" fixed="right">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)">修改</el-button>
          <el-button link type="danger" icon="Delete" @click="handleDelete(scope.row)">删除</el-button>
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

    <!-- 添加或修改对话框 -->
    <el-dialog :title="title" v-model="open" width="500px" append-to-body>
      <el-form ref="supplierRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="供应商编码" prop="supplierCode">
          <el-input v-model="form.supplierCode" placeholder="请输入供应商编码" />
        </el-form-item>
        <el-form-item label="供应商名称" prop="supplierName">
          <el-input v-model="form.supplierName" placeholder="请输入供应商名称" />
        </el-form-item>
        <el-form-item label="供应商联系人" prop="linkMan">
          <el-input v-model="form.linkMan" placeholder="请输入供应商联系人" />
        </el-form-item>
        <el-form-item label="联系电话" prop="linkPhone">
          <el-input v-model="form.linkPhone" placeholder="请输入联系电话" />
        </el-form-item>
        <el-form-item label="联系邮箱" prop="linkEmail">
          <el-input v-model="form.linkEmail" placeholder="请输入联系邮箱" />
        </el-form-item>
        <el-form-item label="供应商类型" prop="supplierType">
          <el-select v-model="form.supplierType" placeholder="请选择供应商类型">
            <el-option label="原材料供应商" value="1" />
            <el-option label="设备供应商" value="2" />
            <el-option label="零件供应商" value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="联系地址" prop="address">
          <el-input v-model="form.address" placeholder="请输入联系地址" />
        </el-form-item>
        <el-form-item label="供货范围" prop="scopeOfSupply">
          <el-input v-model="form.scopeOfSupply" placeholder="请输入供货范围" />
        </el-form-item>
        <el-form-item label="合作状态" prop="cooperativeStatus">
          <el-select v-model="form.cooperativeStatus" placeholder="请选择合作状态">
            <el-option label="合作中" value="1" />
            <el-option label="已暂停" value="2" />
            <el-option label="已中止" value="3" />
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
  </div>
</template>

<script setup name="Supplier">
import { listSupplier, getSupplier, delSupplier, addSupplier, updateSupplier } from "@/api/manufacture/supplier"

const { proxy } = getCurrentInstance()

const supplierList = ref([])
const open = ref(false)
const loading = ref(true)
const showSearch = ref(true)
const ids = ref([])
const single = ref(true)
const multiple = ref(true)
const total = ref(0)
const title = ref("")

const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    supplierCode: null,
    supplierName: null,
    supplierType: null,
    cooperativeStatus: null
  },
  rules: {
    supplierCode: [{ required: true, message: "供应商编码不能为空", trigger: "blur" }],
    supplierName: [{ required: true, message: "供应商名称不能为空", trigger: "blur" }],
    linkEmail: [
      { type: "email", message: "请输入正确的邮箱地址", trigger: ["blur", "change"] }
    ],
    linkPhone: [
      { min: 7, max: 15, message: "联系电话长度在 7 到 15 个字符", trigger: "blur" }
    ]
  }
})

const { queryParams, form, rules } = toRefs(data)

/** 查询供应商列表 */
function getList() {
  loading.value = true
  listSupplier(queryParams.value).then(response => {
    supplierList.value = response.rows
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
    supplierCode: null,
    supplierName: null,
    linkMan: null,
    linkPhone: null,
    linkEmail: null,
    supplierType: null,
    address: null,
    scopeOfSupply: null,
    cooperativeStatus: null,
    remark: null
  }
  proxy.resetForm("supplierRef")
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
  reset()
  open.value = true
  title.value = "添加供应商信息"
}

/** 修改按钮操作 */
function handleUpdate(row) {
  reset()
  const _id = row.id || ids.value
  getSupplier(_id).then(response => {
    form.value = response.data
    open.value = true
    title.value = "修改供应商信息"
  })
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs["supplierRef"].validate(valid => {
    if (valid) {
      if (form.value.id != null) {
        updateSupplier(form.value).then(() => {
          proxy.$modal.msgSuccess("修改成功")
          open.value = false
          getList()
        })
      } else {
        addSupplier(form.value).then(() => {
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
  proxy.$modal.confirm('是否确认删除供应商信息编号为"' + _ids + '"的数据项？').then(function () {
    return delSupplier(_ids)
  }).then(() => {
    getList()
    proxy.$modal.msgSuccess("删除成功")
  }).catch(() => {})
}

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

getList()
</script>
