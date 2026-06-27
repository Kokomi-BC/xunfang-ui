<template>
  <div class="app-container">
    <!-- 搜索表单 -->
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="单位名称" prop="unitName">
        <el-input v-model="queryParams.unitName" placeholder="请输入单位名称" clearable style="width: 200px" @keyup.enter="handleQuery" />
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
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <!-- 表格区 -->
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

    <!-- 分页 -->
    <pagination
      v-show="total > 0"
      :total="total"
      v-model:page="queryParams.pageNum"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />

    <!-- 批量新增弹窗 -->
    <el-dialog :title="title" v-model="open" width="500px" append-to-body>
      <div v-for="(item, index) in units" :key="index" class="unit-item">
        <span class="unit-index">{{ index + 1 }}</span>
        <el-input v-model="item.name" placeholder="单位名称" style="width: 200px; margin-right: 10px;" />
        <el-button v-if="units.length > 1" type="danger" icon="Minus" circle size="small" @click="removeUnit(index)" />
      </div>

      <div style="margin-top: 10px;">
        <el-button type="primary" icon="Plus" circle size="small" @click="addUnitRow" />
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="open = false">关 闭</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

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
