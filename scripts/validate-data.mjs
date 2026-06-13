import fs from 'node:fs'
import { calcDimensionScores, determineResult, matchType, parsePattern, scoresToLevels } from '../src/engine.js'

const readJSON = (path) => JSON.parse(fs.readFileSync(path, 'utf8'))

const questions = readJSON('data/questions.json')
const dimensions = readJSON('data/dimensions.json')
const types = readJSON('data/types.json')
const config = readJSON('data/config.json')

const errors = []
const assert = (condition, message) => {
  if (!condition) errors.push(message)
}

const dimOrder = dimensions.order || []
const dimSet = new Set(dimOrder)

assert(dimOrder.length === 15, `expected 15 dimensions, got ${dimOrder.length}`)

const dimCounts = Object.fromEntries(dimOrder.map((dim) => [dim, 0]))
for (const question of questions.main || []) {
  assert(question.id, 'main question missing id')
  assert(dimSet.has(question.dim), `main question ${question.id} has unknown dimension ${question.dim}`)
  dimCounts[question.dim] = (dimCounts[question.dim] || 0) + 1
  assert(Array.isArray(question.options) && question.options.length === 3, `main question ${question.id} must have 3 options`)
  for (const option of question.options || []) {
    assert([1, 2, 3].includes(option.value), `main question ${question.id} option has invalid value ${option.value}`)
  }
}

for (const [dim, count] of Object.entries(dimCounts)) {
  assert(count === 2, `dimension ${dim} must have 2 main questions, got ${count}`)
}

const specialQuestions = new Map((questions.special || []).map((question) => [question.id, question]))
assert(specialQuestions.has(config.drinkGate?.questionId), `missing drink gate question ${config.drinkGate?.questionId}`)
assert(specialQuestions.has('drink_gate_q2'), 'missing drink_gate_q2')

const allTypes = [...(types.standard || []), ...(types.special || [])]
const codes = new Set()
const patterns = new Set()
for (const type of allTypes) {
  assert(type.code, 'type missing code')
  assert(!codes.has(type.code), `duplicate type code ${type.code}`)
  codes.add(type.code)
  for (const key of ['cn', 'intro', 'desc']) {
    assert(type[key], `type ${type.code} missing ${key}`)
  }
}

for (const type of types.standard || []) {
  const flat = parsePattern(type.pattern || '').join('')
  assert(flat.length === dimOrder.length, `type ${type.code} pattern length must be ${dimOrder.length}, got ${flat.length}`)
  assert(/^[LMH]+$/.test(flat), `type ${type.code} pattern has invalid characters`)
  assert(!patterns.has(flat), `duplicate standard pattern ${type.pattern}`)
  patterns.add(flat)
}

const specialCodes = new Set((types.special || []).map((type) => type.code))
assert(specialCodes.has('HHHH'), 'missing special result HHHH')
assert(specialCodes.has('DRUNK'), 'missing special result DRUNK')

for (const type of allTypes) {
  const figurePath = `public/figures/${type.code}.svg`
  assert(fs.existsSync(figurePath), `missing figure asset ${figurePath}`)
}

const thresholds = config.scoring?.levelThresholds
const sampleAnswers = {}
for (const question of questions.main || []) {
  sampleAnswers[question.id] = 2
}
const sampleScores = calcDimensionScores(sampleAnswers, questions.main)
const sampleLevels = scoresToLevels(sampleScores, thresholds)
assert(Object.keys(sampleLevels).length === dimOrder.length, 'sample scoring did not produce all dimensions')

const first = types.standard?.[0]
if (first) {
  const exactLevels = Object.fromEntries(dimOrder.map((dim, index) => [dim, parsePattern(first.pattern)[index]]))
  const exactMatch = matchType(exactLevels, dimOrder, first.pattern, config.scoring?.maxDistance)
  assert(exactMatch.distance === 0, 'exact match distance must be 0')
  assert(exactMatch.exact === dimOrder.length, `exact match count must be ${dimOrder.length}`)
  assert(exactMatch.similarity === 100, 'exact match similarity must be 100')

  const normalResult = determineResult(exactLevels, dimOrder, types.standard, types.special, config.scoring)
  assert(normalResult.primary.code === first.code, `exact result should resolve to ${first.code}, got ${normalResult.primary.code}`)

  const drunkResult = determineResult(exactLevels, dimOrder, types.standard, types.special, {
    ...config.scoring,
    isDrunk: true,
  })
  assert(drunkResult.primary.code === 'DRUNK', `drunk override should resolve to DRUNK, got ${drunkResult.primary.code}`)

  const fallbackResult = determineResult(exactLevels, dimOrder, types.standard, types.special, {
    ...config.scoring,
    fallbackThreshold: 101,
  })
  assert(fallbackResult.primary.code === 'HHHH', `fallback override should resolve to HHHH, got ${fallbackResult.primary.code}`)
}

if (errors.length) {
  console.error(errors.map((error) => `- ${error}`).join('\n'))
  process.exit(1)
}

console.log(`Validated ${questions.main.length} main questions, ${dimOrder.length} dimensions, ${types.standard.length} standard types, and ${allTypes.length} figure assets.`)
