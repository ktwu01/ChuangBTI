import { drawRadar } from './chart.js'
import { generateShareImage } from './share.js'

const LEVEL_LABEL = { L: '低', M: '中', H: '高' }
const LEVEL_CLASS = { L: 'level-low', M: 'level-mid', H: 'level-high' }

/**
 * 渲染测试结果
 */
export function renderResult(result, userLevels, dimOrder, dimDefs, config) {
  const { primary, secondary, rankings, mode } = result
  const ui = config.display?.ui || {}

  // Kicker
  const kicker = document.getElementById('result-kicker')
  if (mode === 'drunk') kicker.textContent = ui.resultKickerDrunk || '敬局彩蛋已触发'
  else if (mode === 'fallback') kicker.textContent = ui.resultKickerFallback || '模型对不上账 · 已兜底'
  else kicker.textContent = ui.resultKickerNormal || '你的 ChuangBTI 创始人原型'

  const matchLabel = ui.matchLabel || 'ChuangBTI 脑回路重合度'
  const exactLabel = ui.exactLabel || '十五维精准对齐'
  const secondaryLabel = ui.secondaryLabel || '清醒版次佳原型'

  // 主类型
  document.getElementById('result-code').textContent = primary.code
  document.getElementById('result-name').textContent = primary.cn

  // 匹配度
  document.getElementById('result-badge').textContent =
    `${matchLabel} ${primary.similarity}%` +
    (primary.exact != null ? ` · ${exactLabel} ${primary.exact}/15` : '')

  // Intro & 描述
  document.getElementById('result-intro').textContent = primary.intro || ''
  document.getElementById('result-desc').textContent = primary.desc || ''

  const secLabelEl = document.getElementById('secondary-label-static')
  if (secLabelEl) secLabelEl.textContent = secondaryLabel

  // 次要匹配
  const secEl = document.getElementById('result-secondary')
  if (secondary && (mode === 'drunk' || mode === 'fallback')) {
    secEl.style.display = ''
    document.getElementById('secondary-info').textContent =
      `${secondary.code}（${secondary.cn}）· ${matchLabel} ${secondary.similarity}%`
  } else {
    secEl.style.display = 'none'
  }

  // 雷达图
  const canvas = document.getElementById('radar-chart')
  drawRadar(canvas, userLevels, dimOrder, dimDefs)

  // 维度详情
  const detailEl = document.getElementById('dimensions-detail')
  detailEl.innerHTML = ''
  for (const dim of dimOrder) {
    const level = userLevels[dim] || 'M'
    const def = dimDefs[dim]
    if (!def) continue

    const row = document.createElement('div')
    row.className = 'dim-row'
    row.innerHTML = `
      <div class="dim-header">
        <span class="dim-name">${def.name}</span>
        <span class="dim-level ${LEVEL_CLASS[level]}">${LEVEL_LABEL[level]}</span>
      </div>
      <div class="dim-desc">${def.levels[level]}</div>
    `
    detailEl.appendChild(row)
  }

  const dimTitle = document.getElementById('dimensions-section-title')
  if (dimTitle && ui.dimensionsSectionTitle) dimTitle.textContent = ui.dimensionsSectionTitle
  const topTitle = document.getElementById('top-section-title')
  if (topTitle && ui.topListTitle) topTitle.textContent = ui.topListTitle
  const topSub = document.getElementById('top-section-sub')
  if (topSub) {
    topSub.textContent = ui.topListSub || ''
    topSub.style.display = ui.topListSub ? '' : 'none'
  }

  const flairs = Array.isArray(ui.topRankFlairs) ? ui.topRankFlairs : []

  // TOP 5
  const topEl = document.getElementById('top-list')
  topEl.innerHTML = ''
  const top5 = rankings.slice(0, 5)
  top5.forEach((t, i) => {
    const flair = flairs[i] || ''
    const item = document.createElement('div')
    item.className = 'top-item'
    item.innerHTML = `
      <span class="top-rank">#${i + 1}</span>
      <div class="top-middle">
        <div class="top-row-main">
          <span class="top-code">${t.code}</span>
          <span class="top-name">${t.cn}</span>
        </div>
        ${flair ? `<span class="top-flair">${flair}</span>` : ''}
      </div>
      <span class="top-sim">${t.similarity}%</span>
    `
    topEl.appendChild(item)
  })

  // 免责声明（funNote 可含 <br>、链接等 HTML）
  const disclaimerEl = document.getElementById('disclaimer')
  const noteHtml =
    mode === 'normal' ? config.display.funNote : config.display.funNoteSpecial
  disclaimerEl.innerHTML = noteHtml || ''

  // 下载分享图
  const btnDownload = document.getElementById('btn-download')
  btnDownload.onclick = () => {
    generateShareImage(primary, userLevels, dimOrder, dimDefs, mode, config)
  }

  // 复制 AI Agent 命令
  const btnAgent = document.getElementById('btn-agent')
  btnAgent.onclick = () => {
    const cmd =
      'git clone https://github.com/ktwu01/ChuangBTI.git && cd ChuangBTI && npm install && npm run dev'
    navigator.clipboard.writeText(cmd).then(() => {
      btnAgent.textContent = '已复制!'
      setTimeout(() => { btnAgent.textContent = '复制一键部署命令' }, 2000)
    })
  }
}
