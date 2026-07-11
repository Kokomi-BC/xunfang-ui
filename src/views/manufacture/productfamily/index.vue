<template>
  <div class="app-container">
    <!-- 查询区域 -->
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="中文名称" prop="productFamilyNameCn">
        <el-input
          v-model="queryParams.productFamilyNameCn"
          placeholder="请输入产品族中文名称"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="英文名称" prop="productFamilyNameEn">
        <el-input
          v-model="queryParams.productFamilyNameEn"
          placeholder="请输入产品族英文名称"
          clearable
          @keyup.enter="handleQuery"
        />
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
        <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete">删除</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" />
    </el-row>

    <!-- 表格 -->
    <el-table
      ref="familyTable"
      v-loading="loading"
      :data="familyList"
      v-column-resize
      @selection-change="handleSelectionChange"
      row-key="id"
    >
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column v-if="false" label="id" align="center" prop="id" />
      <el-table-column label="产品族编码" align="center">
        <template #default="{ row }">PF{{ row.id }}</template>
      </el-table-column>
      <el-table-column label="产品族中文名称" align="center" prop="productFamilyNameCn" />
      <el-table-column label="产品族英文名称" align="center" prop="productFamilyNameEn" />
      <el-table-column label="描述说明" align="center" prop="description" />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(row)">修改</el-button>
          <el-button link type="danger" icon="Delete" @click="handleDelete(row)">删除</el-button>
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

    <!-- 添加或修改产品族对话框 -->
    <el-dialog :title="title" v-model="open" width="500px" append-to-body>
      <el-form ref="familyRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="中文名称" prop="productFamilyNameCn">
          <el-input v-model="form.productFamilyNameCn" placeholder="请输入产品族中文名称" />
        </el-form-item>
        <el-form-item label="英文名称" prop="productFamilyNameEn">
          <el-input v-model="form.productFamilyNameEn" placeholder="请输入产品族英文名称" />
        </el-form-item>
        <el-form-item label="描述说明" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入描述说明" />
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

<script setup name="Family">
import { getCurrentInstance, ref, reactive, toRefs } from "vue"
import { listFamily, getFamily, delFamily, batchDelFamily, addFamily, updateFamily } from "@/api/manufacture/productfamily"

const { proxy } = getCurrentInstance()

const familyList = ref([])
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
    productFamilyNameCn: null,
    productFamilyNameEn: null
  },
  rules: {
    productFamilyNameCn: [{ required: true, message: "产品族中文名称不能为空", trigger: "blur" }],
    productFamilyNameEn: [{ required: true, message: "产品族英文名称不能为空", trigger: "blur" }]
  }
})
const { queryParams, form, rules } = toRefs(data)

/** 提取 id */
function extractId(row) {
  if (!row || typeof row !== 'object') return null
  const cand = row.id ?? row.productFamilyId ?? row.productFamilyCode ?? null
  if (cand === null || cand === undefined) return null
  const s = String(cand).trim()
  return s.length ? s : null
}

/** 列表 */
function getList() {
  loading.value = true
  listFamily(queryParams.value)
    .then(res => {
      const rows = res.rows || []
      familyList.value = rows.map(item => ({
        ...item,
        id: extractId(item) ?? String(item.id ?? '')
      }))
      total.value = res.total || 0
      ids.value = []
      single.value = true
      multiple.value = true
    })
    .catch(err => console.error('getList error', err))
    .finally(() => (loading.value = false))
}

/** 重置 */
function cancel() {
  open.value = false
  reset()
}
function reset() {
  form.value = {
    id: null,
    productFamilyCode: null,
    productFamilyNameCn: null,
    productFamilyNameEn: null,
    description: null
  }
  try { proxy.resetForm("familyRef") } catch (e) {}
}

/** 查询 */
function handleQuery() {
  queryParams.value.pageNum = 1
  getList()
}
function resetQuery() {
  try { proxy.resetForm("queryRef") } catch (e) {}
  handleQuery()
}

/** 多选 */
function handleSelectionChange(selection) {
  const extracted = selection.map(item => extractId(item)).filter(Boolean)
  ids.value = extracted
  single.value = ids.value.length !== 1
  multiple.value = ids.value.length === 0
}

/** 新增 */
function handleAdd() {
  reset()
  open.value = true
  title.value = "添加产品族"
}

/** 修改 */
function handleUpdate(row) {
  reset()
  const _id = extractId(row) ?? ids.value[0]
  if (!_id) {
    proxy.$modal.msgWarning("未能获取到要修改的 ID，请检查数据结构")
    return
  }
  getFamily(_id).then(res => {
    form.value = res.data || {}
    open.value = true
    title.value = "修改产品族"
  })
}

/** 提交 */
function submitForm() {
  proxy.$refs["familyRef"].validate(valid => {
    if (!valid) return
    const api = form.value.id ? updateFamily : addFamily
    api(form.value).then(() => {
      proxy.$modal.msgSuccess(form.value.id ? "修改成功" : "新增成功")
      open.value = false
      getList()
    })
  })
}

/** 删除（单个/批量） */
function handleDelete(row) {
  // 单个删除
  if (row && typeof row === 'object' && !(row instanceof PointerEvent)) {
    const id = extractId(row)
    if (!id) {
      proxy.$modal.msgWarning("未能获取到要删除的 ID，请检查数据结构")
      return
    }
    proxy.$modal
      .confirm(`是否确认删除产品族编号为「${id}」的数据项？`)
      .then(() => delFamily(id))
      .then(() => {
        proxy.$modal.msgSuccess("删除成功")
        ids.value = []
        getList()
      })
      .catch(() => {})
    return
  }

  // 批量删除
  if (ids.value.length === 0) {
    proxy.$modal.msgWarning("请先选择要删除的数据")
    return
  }
  const showList = ids.value.join(',')
  proxy.$modal
    .confirm(`是否确认删除选中的 ${ids.value.length} 条数据（ID: ${showList}）？`)
    .then(() => {
      return batchDelFamily(ids.value)
    })
    .then(() => {
      proxy.$modal.msgSuccess("删除成功")
      ids.value = []
      getList()
    })
    .catch(() => {})
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
</style>
