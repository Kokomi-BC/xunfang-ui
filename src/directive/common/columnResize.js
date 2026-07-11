/**
 * v-column-resize 指令
 * 使 el-table 列宽可自由拖拽调整
 *
 * 用法: <el-table v-column-resize ...>
 *
 * 功能:
 * 1. 鼠标悬停列表头右侧边缘出现拖拽手柄
 * 2. 按住拖拽可调整列宽
 * 3. 双击手柄自动适配该列内容宽度
 */

const stateMap = new WeakMap()

// 全局共享的拖拽事件（只绑定一次）
let globalDragging = null
let globalMouseMove = null
let globalMouseUp = null

function ensureGlobalEvents() {
  if (globalMouseMove) return
  globalMouseMove = (e) => {
    if (!globalDragging) return
    const { cellIndex, startX, startWidth, tableEl, allStartWidths } = globalDragging
    const diff = e.pageX - startX
    const MIN_W = 36

    // 获取所有列元素
    const hCols = tableEl.querySelector('.el-table__header-wrapper table')?.querySelectorAll('colgroup col')
    const bCols = tableEl.querySelector('.el-table__body-wrapper table')?.querySelectorAll('colgroup col')
    const allThs = tableEl.querySelectorAll('.el-table__header-wrapper thead tr:last-child th')
    const totalCols = allThs.length

    // 辅助：设置某列宽度
    const setCol = (ci, w) => {
      const wp = w + 'px'
      if (hCols?.[ci]) hCols[ci].style.setProperty('width', wp, 'important')
      if (bCols?.[ci]) bCols[ci].style.setProperty('width', wp, 'important')
      if (allThs[ci]) { allThs[ci].style.setProperty('width', wp, 'important'); allThs[ci].style.setProperty('min-width', wp, 'important') }
      tableEl.querySelectorAll(`.el-table__body-wrapper td:nth-child(${ci + 1})`).forEach(td => {
        td.style.setProperty('width', wp, 'important')
        td.style.setProperty('min-width', wp, 'important')
      })
      tableEl.querySelectorAll(`.el-table__body-wrapper td:nth-child(${ci + 1}) .cell`).forEach(cell => {
        cell.style.setProperty('max-width', 'none', 'important')
      })
    }

    // 计算可用伸缩量
    let maxGrow = 0, maxShrink = startWidth - MIN_W
    for (let i = cellIndex + 1; i < totalCols; i++) {
      maxGrow += Math.max(0, allStartWidths[i] - MIN_W)
    }

    // actualDiff: 当前列实际宽度变化量（正=变宽, 负=变窄）
    const actualDiff = diff > 0
      ? Math.min(diff, maxGrow)                         // 右拖：不能超过后续列可缩总量
      : Math.max(diff, -maxShrink)                      // 左拖：不能低于最小宽度

    // 当前列
    const curW = startWidth + actualDiff
    setCol(cellIndex, curW)

    if (actualDiff > 0) {
      // 右拖 → 从后续列"借用"宽度
      let remaining = actualDiff
      for (let i = cellIndex + 1; i < totalCols && remaining > 0; i++) {
        const available = Math.max(0, allStartWidths[i] - MIN_W)
        const take = Math.min(remaining, available)
        if (take > 0) {
          setCol(i, allStartWidths[i] - take)
          remaining -= take
        }
      }
    } else if (actualDiff < 0) {
      // 左拖 → 把释放的宽度给下一列
      const ni = cellIndex + 1
      if (allThs[ni]) {
        setCol(ni, allStartWidths[ni] - actualDiff)     // -actualDiff 为正
      }
    }
  }
  globalMouseUp = () => {
    if (!globalDragging) return
    const { tableEl } = globalDragging

    // 1. 读取所有列的最终渲染宽度
    const allThs = tableEl.querySelectorAll('.el-table__header-wrapper thead tr:last-child th')
    const widths = Array.from(allThs).map(t => t.getBoundingClientRect().width)

    // 2. 固化宽度到两个 colgroup
    const hCols = tableEl.querySelector('.el-table__header-wrapper table')?.querySelectorAll('colgroup col')
    const bCols = tableEl.querySelector('.el-table__body-wrapper table')?.querySelectorAll('colgroup col')
    widths.forEach((w, i) => {
      const wp = w + 'px'
      if (hCols?.[i]) hCols[i].style.setProperty('width', wp, 'important')
      if (bCols?.[i]) bCols[i].style.setProperty('width', wp, 'important')
    })

    // 3. 清除所有内联宽度（th/td/.cell），让 colgroup 接管
    const clearEl = (el) => { el.style.removeProperty('width'); el.style.removeProperty('min-width'); el.style.removeProperty('max-width') }
    allThs.forEach(clearEl)
    tableEl.querySelectorAll('.el-table__body-wrapper td').forEach(clearEl)
    tableEl.querySelectorAll('.el-table__body-wrapper .cell').forEach(clearEl)
    tableEl.querySelectorAll('.el-table__header-wrapper .cell').forEach(clearEl)

    // 4. 强制浏览器重排
    void tableEl.offsetHeight

    tableEl.classList.remove('el-table--resizing')
    document.body.style.userSelect = ''
    document.body.style.cursor = ''
    globalDragging = null
  }
  document.addEventListener('mousemove', globalMouseMove)
  document.addEventListener('mouseup', globalMouseUp)
}

function getTableEl(el) {
  if (el.classList.contains('el-table')) return el
  return el.querySelector('.el-table')
}

function setupResize(el) {
  const tableEl = getTableEl(el)
  if (!tableEl || stateMap.has(el)) return

  ensureGlobalEvents()

  const state = { tableEl, handles: [], initRetry: 0 }
  stateMap.set(el, state)
  tryInit(state)
}

function tryInit(state) {
  const ths = state.tableEl.querySelectorAll('.el-table__header-wrapper thead tr:last-child th')
  if (!ths.length) {
    if (state.initRetry < 10) { state.initRetry++; requestAnimationFrame(() => tryInit(state)) }
    return
  }

  // 先清理旧手柄再创建新的
  state.handles.forEach(({ handle }) => handle.remove())
  state.handles = []

  ths.forEach((th, index) => {
    if (index === ths.length - 1) return
    if (th.classList.contains('el-table-column--selection') ||
        th.classList.contains('el-table__expand-column')) return
    if (th.querySelector('.col-resize-handle')) return

    const handle = document.createElement('div')
    handle.className = 'col-resize-handle'
    handle.addEventListener('dblclick', (e) => {
      e.preventDefault(); e.stopPropagation()
      autoFit(state, index)
    })
    handle.addEventListener('mousedown', (e) => {
      e.preventDefault(); e.stopPropagation()

      // 用 DOM cellIndex 精确定位列位置
      const ci = th.cellIndex
      const allThs = state.tableEl.querySelectorAll('.el-table__header-wrapper thead tr:last-child th')
      const allStartWidths = Array.from(allThs).map(t => t.getBoundingClientRect().width)

      globalDragging = {
        cellIndex: ci, th,
        startX: e.pageX,
        startWidth: allStartWidths[ci],
        allStartWidths,
        tableEl: state.tableEl
      }
      document.body.style.userSelect = 'none'
      document.body.style.cursor = 'col-resize'
      th.classList.add('col-resizing')
      state.tableEl.classList.add('el-table--resizing')
    })
    th.appendChild(handle)
    state.handles.push({ handle, th, index })
  })
}

function autoFit(state, index) {
  const tableEl = state.tableEl
  const allThs = tableEl.querySelectorAll('.el-table__header-wrapper thead tr:last-child th')
  const headerTh = allThs[index]

  // 修正为 cellIndex
  const ci = headerTh?.cellIndex ?? index
  const headerText = headerTh ? (headerTh.textContent || '').replace(/\s/g, '') : ''
  let maxW = headerText.length * 16 + 40

  const rows = tableEl.querySelectorAll('.el-table__body-wrapper tbody tr')
  for (let i = 0; i < Math.min(rows.length, 50); i++) {
    const td = rows[i].querySelectorAll('td')[ci]
    if (!td) continue
    const text = td.textContent || ''
    const cn = (text.match(/[\u4e00-\u9fff]/g) || []).length
    const w = cn * 14 + (text.length - cn) * 8 + 32
    if (w > maxW) maxW = w
  }

  const finalW = Math.min(600, Math.max(36, Math.ceil(maxW)))

  // 更新 colgroup（!important 防止 Element Plus 覆盖）
  const hCols = tableEl.querySelector('.el-table__header-wrapper table')?.querySelectorAll('colgroup col')
  const bCols = tableEl.querySelector('.el-table__body-wrapper table')?.querySelectorAll('colgroup col')
  const wp = finalW + 'px'
  if (hCols?.[ci]) hCols[ci].style.setProperty('width', wp, 'important')
  if (bCols?.[ci]) bCols[ci].style.setProperty('width', wp, 'important')
  if (headerTh) { headerTh.style.setProperty('width', wp, 'important'); headerTh.style.setProperty('min-width', wp, 'important') }

  // 清除该列 td/.cell 内联宽度 + 强制重排
  const clearEl = (el) => { el.style.removeProperty('width'); el.style.removeProperty('min-width'); el.style.removeProperty('max-width') }
  tableEl.querySelectorAll(`.el-table__body-wrapper td:nth-child(${ci + 1})`).forEach(clearEl)
  tableEl.querySelectorAll(`.el-table__body-wrapper td:nth-child(${ci + 1}) .cell`).forEach(clearEl)
  void tableEl.offsetHeight
}

function cleanup(el) {
  const state = stateMap.get(el)
  if (!state) return
  state.handles.forEach(({ handle }) => handle.remove())
  state.handles = []
  stateMap.delete(el)
}

const ColumnResize = {
  mounted(el) {
    requestAnimationFrame(() => { setTimeout(() => setupResize(el), 150) })
  },
  updated(el) {
    const state = stateMap.get(el)
    if (state?.tableEl) {
      // 数据变化后只重建手柄，不修改表格布局
      setTimeout(() => tryInit(state), 100)
    }
  },
  unmounted(el) { cleanup(el) }
}

export default ColumnResize
