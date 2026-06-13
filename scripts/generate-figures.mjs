import fs from 'node:fs'

const types = JSON.parse(fs.readFileSync('data/types.json', 'utf8'))
const outDir = 'public/figures'

fs.mkdirSync(outDir, { recursive: true })

const palettes = [
  ['#17324d', '#f2d16b', '#f45b69', '#f7fbff'],
  ['#264653', '#2a9d8f', '#e9c46a', '#fff8e7'],
  ['#33272a', '#ff8fab', '#9bf6ff', '#fff0f3'],
  ['#21382f', '#8ecae6', '#fb8500', '#f8f9fa'],
  ['#2f1b45', '#b8f2e6', '#ffa69e', '#fffdf7'],
  ['#1f2933', '#c6f91f', '#ff206e', '#f8fafc'],
  ['#2b2d42', '#ef233c', '#8d99ae', '#edf2f4'],
  ['#003049', '#f77f00', '#d62828', '#fefae0'],
  ['#2d3047', '#93b7be', '#e0ca3c', '#f5f3f5'],
  ['#233d4d', '#fe7f2d', '#a1c181', '#fcca46'],
]

const levelWeight = { L: 0.28, M: 0.55, H: 0.82 }
const levelLabel = { L: '低', M: '中', H: '高' }

const escapeHTML = (value) => String(value).replace(/[&<>"']/g, (char) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&apos;',
}[char]))

const flatPattern = (pattern = '') => pattern.replace(/-/g, '')

function hashCode(text) {
  let hash = 0
  for (const char of text) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  }
  return hash
}

function patternFor(type) {
  if (type.pattern) return flatPattern(type.pattern)
  return type.code === 'DRUNK' ? 'HHMHHHMMHHHMMHH' : 'LMLMLMLMLMLMLML'
}

function signaturePath(pattern, seed) {
  const points = []
  const cx = 480
  const cy = 310
  const maxR = 205
  const phase = (seed % 31) / 31
  for (let i = 0; i < pattern.length; i++) {
    const angle = -Math.PI / 2 + (Math.PI * 2 * (i + phase * 0.12)) / pattern.length
    const r = maxR * (levelWeight[pattern[i]] || 0.55)
    const wobble = ((seed >> (i % 8)) & 7) - 3
    points.push(`${(cx + Math.cos(angle) * (r + wobble)).toFixed(1)},${(cy + Math.sin(angle) * (r + wobble)).toFixed(1)}`)
  }
  return points.join(' ')
}

function bars(pattern, accent, muted) {
  return [...pattern].map((level, index) => {
    const x = 100 + index * 25
    const h = Math.round(26 + (levelWeight[level] || 0.55) * 96)
    const y = 565 - h
    return `<rect x="${x}" y="${y}" width="14" height="${h}" rx="7" fill="${level === 'H' ? accent : muted}" opacity="${level === 'L' ? '0.45' : level === 'M' ? '0.7' : '0.96'}" />`
  }).join('\n    ')
}

function ringTicks(pattern, accent, muted) {
  return [...pattern].map((level, index) => {
    const angle = -90 + index * (360 / pattern.length)
    const color = level === 'H' ? accent : muted
    return `<rect x="474" y="70" width="12" height="42" rx="6" fill="${color}" opacity="${level === 'L' ? '0.35' : level === 'M' ? '0.65' : '1'}" transform="rotate(${angle} 480 310)" />`
  }).join('\n    ')
}

function figureSVG(type, index) {
  const pattern = patternFor(type)
  const seed = hashCode(`${type.code}:${type.cn}:${pattern}`)
  const [base, accent, hot, paper] = palettes[index % palettes.length]
  const muted = index % 2 === 0 ? '#d6e2e6' : '#eadde7'
  const poly = signaturePath(pattern, seed)
  const exactText = type.pattern ? type.pattern : 'SPECIAL-RESULT'
  const sum = [...pattern].reduce((total, level) => total + ({ L: 1, M: 2, H: 3 }[level] || 2), 0)
  const spark = type.code.length * 8 + (seed % 60)

  return `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="640" viewBox="0 0 960 640" role="img" aria-labelledby="title desc">
  <title id="title">${escapeHTML(type.code)} · ${escapeHTML(type.cn)}</title>
  <desc id="desc">ChuangBTI result figure for ${escapeHTML(type.cn)}.</desc>
  <rect width="960" height="640" rx="44" fill="${paper}" />
  <path d="M0 518 C180 430 280 634 456 548 C640 458 718 512 960 420 L960 640 L0 640 Z" fill="${base}" opacity="0.13" />
  <circle cx="760" cy="126" r="${spark}" fill="${hot}" opacity="0.16" />
  <circle cx="166" cy="160" r="${90 + (seed % 28)}" fill="${accent}" opacity="0.13" />
  <g transform="translate(0 10)">
    <circle cx="480" cy="300" r="226" fill="${base}" opacity="0.055" />
    <circle cx="480" cy="300" r="176" fill="none" stroke="${base}" stroke-opacity="0.13" stroke-width="2" />
    <circle cx="480" cy="300" r="112" fill="none" stroke="${base}" stroke-opacity="0.13" stroke-width="2" />
    ${ringTicks(pattern, accent, muted)}
    <polygon points="${poly}" fill="${accent}" fill-opacity="0.2" stroke="${base}" stroke-width="6" stroke-linejoin="round" />
    <polygon points="${poly}" fill="none" stroke="${hot}" stroke-width="2" stroke-linejoin="round" opacity="0.7" />
    <circle cx="480" cy="310" r="58" fill="${paper}" stroke="${base}" stroke-width="4" />
    <text x="480" y="322" text-anchor="middle" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="36" font-weight="900" fill="${base}">${escapeHTML(type.code)}</text>
  </g>
  <text x="72" y="82" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="30" font-weight="800" fill="${base}">ChuangBTI</text>
  <text x="72" y="128" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="64" font-weight="900" fill="${base}">${escapeHTML(type.cn)}</text>
  <text x="72" y="170" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="24" font-weight="600" fill="${hot}">${escapeHTML(type.intro)}</text>
  <g>
    ${bars(pattern, accent, muted)}
  </g>
  <text x="72" y="584" font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="20" font-weight="700" fill="${base}" opacity="0.75">${escapeHTML(exactText)}</text>
  <text x="888" y="584" text-anchor="end" font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="20" font-weight="800" fill="${hot}">${sum}/45 · ${levelLabel[pattern[0]]}</text>
</svg>
`
}

const allTypes = [...(types.standard || []), ...(types.special || [])]
for (const [index, type] of allTypes.entries()) {
  fs.writeFileSync(`${outDir}/${type.code}.svg`, figureSVG(type, index))
}

console.log(`Generated ${allTypes.length} figure assets in ${outDir}`)
