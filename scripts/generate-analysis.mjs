import fs from 'node:fs'

const questions = JSON.parse(fs.readFileSync('data/questions.json', 'utf8'))
const dimensions = JSON.parse(fs.readFileSync('data/dimensions.json', 'utf8'))
const types = JSON.parse(fs.readFileSync('data/types.json', 'utf8'))
const config = JSON.parse(fs.readFileSync('data/config.json', 'utf8'))

const dimOrder = dimensions.order
const num = { L: 1, M: 2, H: 3 }
const label = { L: '低', M: '中', H: '高' }
const flat = (pattern) => pattern.replace(/-/g, '')
const vector = (pattern) => [...flat(pattern)].map((level) => num[level])
const sum = (pattern) => vector(pattern).reduce((total, value) => total + value, 0)
const distance = (a, b) => vector(a).reduce((total, value, index) => total + Math.abs(value - vector(b)[index]), 0)

function row(values) {
  return `| ${values.join(' | ')} |`
}

function countsByDimension() {
  return dimOrder.map((dim, index) => {
    const counts = { L: 0, M: 0, H: 0 }
    for (const type of types.standard) {
      counts[flat(type.pattern)[index]] += 1
    }
    const total = counts.L + counts.M + counts.H
    const entropy = -['L', 'M', 'H']
      .map((level) => counts[level] / total)
      .filter(Boolean)
      .reduce((acc, p) => acc + p * Math.log2(p), 0)
    return { dim, def: dimensions.definitions[dim], counts, entropy }
  })
}

function pairs() {
  const out = []
  for (let i = 0; i < types.standard.length; i++) {
    for (let j = i + 1; j < types.standard.length; j++) {
      out.push({
        a: types.standard[i],
        b: types.standard[j],
        distance: distance(types.standard[i].pattern, types.standard[j].pattern),
      })
    }
  }
  return out
}

const pairRows = pairs()
const closest = [...pairRows].sort((a, b) => a.distance - b.distance).slice(0, 12)
const farthest = [...pairRows].sort((a, b) => b.distance - a.distance).slice(0, 12)
const distributions = countsByDimension()

const questionCounts = Object.fromEntries(dimOrder.map((dim) => [dim, 0]))
for (const question of questions.main) questionCounts[question.dim] += 1

const lines = []
lines.push('# ChuangBTI · 创始人整活测评 — 数据分析报告')
lines.push('')
lines.push('> 本文档由 `npm run generate:analysis` 根据当前 `data/*.json` 生成。请以仓库数据文件为真源；本测试仅供娱乐，与 MBTI、临床心理学或职业鉴定无关。')
lines.push('')
lines.push('## 数据资产')
lines.push('')
lines.push(row(['文件', '作用']))
lines.push(row(['---', '---']))
lines.push(row(['`data/config.json`', '展示文案、评分阈值、饭局门控、最大距离与兜底阈值']))
lines.push(row(['`data/dimensions.json`', '五模型、十五维顺序、各维 L/M/H 文案']))
lines.push(row(['`data/questions.json`', '30 道主问卷题与 2 道特殊饭局门控题']))
lines.push(row(['`data/types.json`', '25 个标准类型与 2 个特殊结果']))
lines.push(row(['`public/figures/*.svg`', '每个结果对应的分享/结果页视觉资产']))
lines.push('')
lines.push('## 当前结构')
lines.push('')
lines.push(`- 主问题：${questions.main.length} 道；每个维度题数：${dimOrder.map((dim) => `${dim}=${questionCounts[dim]}`).join('、')}`)
lines.push(`- 特殊问题：${questions.special.length} 道（${questions.special.map((question) => question.id).join('、')}）`)
lines.push(`- 维度：${dimOrder.length} 个，顺序为 ${dimOrder.join('、')}`)
lines.push(`- 标准类型：${types.standard.length} 个；特殊结果：${types.special.map((type) => type.code).join('、')}`)
lines.push(`- 阈值：L=${config.scoring.levelThresholds.L.join('-')}，M=${config.scoring.levelThresholds.M.join('-')}，H=${config.scoring.levelThresholds.H.join('-')}；兜底阈值=${config.scoring.fallbackThreshold}%`)
lines.push('')
lines.push('## 十五维概览')
lines.push('')
lines.push(row(['维度', '名称', 'L', 'M', 'H']))
lines.push(row(['---', '---', '---', '---', '---']))
for (const dim of dimOrder) {
  const def = dimensions.definitions[dim]
  lines.push(row([dim, def.name, def.levels.L, def.levels.M, def.levels.H]))
}
lines.push('')
lines.push('## 标准类型清单')
lines.push('')
lines.push(row(['#', '代码', '中文名', '模式串', '维度和', '一句话']))
lines.push(row(['---', '---', '---', '---', '---', '---']))
types.standard.forEach((type, index) => {
  lines.push(row([String(index + 1), type.code, type.cn, type.pattern, String(sum(type.pattern)), type.intro]))
})
lines.push('')
lines.push('## 特殊结果')
lines.push('')
lines.push(row(['代码', '中文名', '触发条件']))
lines.push(row(['---', '---', '---']))
lines.push(row(['HHHH', types.special.find((type) => type.code === 'HHHH')?.cn || '', `最佳标准类型相似度低于 ${config.scoring.fallbackThreshold}% 时兜底`]))
lines.push(row(['DRUNK', types.special.find((type) => type.code === 'DRUNK')?.cn || '', '饭局门控追问命中时覆盖主结果，并保留清醒版次佳原型']))
lines.push('')
lines.push('## 类型矩阵')
lines.push('')
lines.push(row(['类型', ...dimOrder]))
lines.push(row(['---', ...dimOrder.map(() => '---')]))
for (const type of types.standard) {
  lines.push(row([type.code, ...flat(type.pattern)]))
}
lines.push('')
lines.push('## 维度分布')
lines.push('')
lines.push(row(['维度', '名称', 'L', 'M', 'H', '区分力']))
lines.push(row(['---', '---', '---', '---', '---', '---']))
for (const item of distributions) {
  lines.push(row([
    item.dim,
    item.def.name,
    String(item.counts.L),
    String(item.counts.M),
    String(item.counts.H),
    item.entropy >= 1.55 ? '高' : item.entropy >= 1.45 ? '中' : '低',
  ]))
}
lines.push('')
lines.push('## 最近类型对')
lines.push('')
lines.push(row(['类型 A', '类型 B', '曼哈顿距离']))
lines.push(row(['---', '---', '---']))
for (const pair of closest) {
  lines.push(row([`${pair.a.code}（${pair.a.cn}）`, `${pair.b.code}（${pair.b.cn}）`, String(pair.distance)]))
}
lines.push('')
lines.push('## 最远类型对')
lines.push('')
lines.push(row(['类型 A', '类型 B', '曼哈顿距离']))
lines.push(row(['---', '---', '---']))
for (const pair of farthest) {
  lines.push(row([`${pair.a.code}（${pair.a.cn}）`, `${pair.b.code}（${pair.b.cn}）`, String(pair.distance)]))
}
lines.push('')
lines.push('## 评分管道')
lines.push('')
lines.push('1. 用户完成 30 道主问题，饭局门控题随机插入。')
lines.push('2. `calcDimensionScores` 按维度累加，每维 2 道题，总分范围 2-6。')
lines.push(`3. \`scoresToLevels\` 按阈值映射：2-3=${label.L}（L），4=${label.M}（M），5-6=${label.H}（H）。`)
lines.push(`4. \`determineResult\` 将用户 15 维向量与 ${types.standard.length} 个标准类型做曼哈顿距离匹配，相似度公式为 \`round((1 - distance / ${config.scoring.maxDistance}) * 100)\`。`)
lines.push('5. 排序规则为距离升序、精准命中数降序、相似度降序。')
lines.push('6. 特殊覆盖优先级：DRUNK 饭局彩蛋 > HHHH 兜底 > 正常最佳匹配。')
lines.push('')
lines.push('## 维护检查')
lines.push('')
lines.push('- 改题目、维度、类型或图像后运行 `npm test`。')
lines.push('- 改类型目录后运行 `npm run generate:figures && npm run generate:analysis`。')
lines.push('- 改 UI 或分享图后运行 `npm run build` 并打开本地预览检查。')

fs.writeFileSync('docs/analysis.md', `${lines.join('\n')}\n`)
console.log('Generated docs/analysis.md')
