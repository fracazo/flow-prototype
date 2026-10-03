import markdown from '../../flows.md?raw'
import { frameOf } from '../device/devices.ts'
import { screens } from '../screens/index.ts'

export const EDGE_TYPES = ['happy', 'branch', 'refusal', 'back', 'sheet', 'inline'] as const

export type EdgeType = (typeof EDGE_TYPES)[number]

export type Edge = {
  type: EdgeType
  target: string
}

export type Beat = {
  id: string
  flowId: string
  title: string
  why: string
  screen: string
  copy: Record<string, string>
  edges: Edge[]
  end: boolean
}

export type Flow = {
  id: string
  name: string
  summary: string
  beats: Beat[]
}

export type Product = {
  name: string
  promise: string
  device: string
  flows: Flow[]
}

export type IssueLevel = 'error' | 'hint'

export type Issue = {
  level: IssueLevel
  beatId?: string
  message: string
}

export type ParsedFlows = {
  product: Product
  issues: Issue[]
}

const EDGE_TYPE_SET = new Set<string>(EDGE_TYPES)

function isEdgeType(value: string): value is EdgeType {
  return EDGE_TYPE_SET.has(value)
}

function emptyBeat(id: string, flowId: string, title: string): Beat {
  return {
    id,
    flowId,
    title,
    why: '',
    screen: '',
    copy: {},
    edges: [],
    end: false,
  }
}

export function parseFlows(source: string, implementedIds: ReadonlySet<string>): ParsedFlows {
  const lines = source.replace(/\r\n/g, '\n').split('\n')
  const product: Product = { name: '', promise: '', device: '', flows: [] }
  const issues: Issue[] = []

  let flow: Flow | null = null
  let beat: Beat | null = null
  let mode: 'root' | 'copy' | 'edges' = 'root'

  const flushBeat = () => {
    if (beat && flow) flow.beats.push(beat)
    beat = null
    mode = 'root'
  }

  for (const raw of lines) {
    const line = raw.trim()
    if (!line) continue

    if (line.startsWith('### ')) {
      flushBeat()
      const match = /^###\s+(\S+)\s+\|\s+(.+)$/.exec(line)
      if (!flow || !match) {
        issues.push({ level: 'error', message: `Could not read beat heading: ${line}` })
        continue
      }
      beat = emptyBeat(match[1], flow.id, match[2].trim())
      continue
    }

    if (line.startsWith('## ')) {
      flushBeat()
      const match = /^##\s+(.+?)\s+\|\s+(.+)$/.exec(line)
      if (!match) {
        issues.push({ level: 'error', message: `Could not read flow heading: ${line}` })
        flow = null
        continue
      }
      const rawId = match[1].trim()
      const id = /^shared$/i.test(rawId) ? 'S' : rawId
      flow = { id, name: match[2].trim(), summary: '', beats: [] }
      product.flows.push(flow)
      continue
    }

    if (line.startsWith('# ')) {
      product.name = line.slice(2).trim()
      continue
    }

    if (/^device:\s*/i.test(line) && !beat) {
      product.device = line.replace(/^device:\s*/i, '').trim()
      continue
    }

    if (line.startsWith('>')) {
      const text = line.replace(/^>\s?/, '').trim()
      if (!flow && !product.promise) product.promise = text
      else if (flow && !beat && !flow.summary) flow.summary = text
      continue
    }

    if (!beat) continue

    if (/^copy:\s*$/i.test(line)) {
      mode = 'copy'
      continue
    }

    if (/^edges:\s*$/i.test(line)) {
      mode = 'edges'
      continue
    }

    if (/^why:\s*/i.test(line)) {
      beat.why = line.replace(/^why:\s*/i, '').trim()
      mode = 'root'
      continue
    }

    if (/^screen:\s*/i.test(line)) {
      beat.screen = line.replace(/^screen:\s*/i, '').trim()
      mode = 'root'
      continue
    }

    if (/^end:\s*true\s*$/i.test(line)) {
      beat.end = true
      mode = 'root'
      continue
    }

    if (mode === 'copy' && line.startsWith('-')) {
      const match = /^-\s+([^:]+):\s*(.*)$/.exec(line)
      if (!match) {
        issues.push({
          level: 'error',
          beatId: beat.id,
          message: `Could not read copy on ${beat.id}: ${line}`,
        })
        continue
      }
      const key = match[1].trim()
      if (key in beat.copy) {
        issues.push({
          level: 'error',
          beatId: beat.id,
          message: `Duplicate copy key "${key}" on ${beat.id}.`,
        })
      }
      beat.copy[key] = match[2].trim()
      continue
    }

    if (mode === 'edges' && line.startsWith('-')) {
      const match = /^-\s+(\S+)\s+->\s+(\S+)\s*$/.exec(line)
      if (!match || !isEdgeType(match[1])) {
        issues.push({
          level: 'error',
          beatId: beat.id,
          message: `Unknown edge on ${beat.id}: ${line}`,
        })
        continue
      }
      beat.edges.push({ type: match[1], target: match[2] })
      continue
    }

    issues.push({
      level: 'error',
      beatId: beat.id,
      message: `Unrecognized line on ${beat.id}: ${line}`,
    })
  }

  flushBeat()

  if (!product.name) {
    issues.push({ level: 'error', message: 'flows.md has no product name.' })
  }

  const chosen = frameOf(product.device)
  if (chosen.error) issues.push({ level: 'error', message: chosen.error })

  const beats = product.flows.flatMap((item) => item.beats)
  const ids = new Set<string>()

  for (const item of beats) {
    if (ids.has(item.id)) {
      issues.push({
        level: 'error',
        beatId: item.id,
        message: `Beat ${item.id} is defined more than once.`,
      })
    }
    ids.add(item.id)

    const prefix = item.id.split('.')[0]
    if (prefix !== item.flowId) {
      issues.push({
        level: 'error',
        beatId: item.id,
        message: `Beat ${item.id} sits in flow ${item.flowId}. Its id should start with ${item.flowId}.`,
      })
    }

    if (!item.why) {
      issues.push({
        level: 'error',
        beatId: item.id,
        message: `${item.id} has no why.`,
      })
    }

    if (!implementedIds.has(item.id)) {
      issues.push({
        level: 'error',
        beatId: item.id,
        message: `${item.id} has no screen component yet.`,
      })
    }

    if (item.edges.length === 0 && !item.end) {
      issues.push({
        level: 'error',
        beatId: item.id,
        message: `${item.id} has no outgoing edge and is not marked end.`,
      })
    }
  }

  for (const item of beats) {
    for (const edge of item.edges) {
      if (!ids.has(edge.target)) {
        issues.push({
          level: 'error',
          beatId: item.id,
          message: `${item.id} ${edge.type} points to ${edge.target}, and that beat does not exist.`,
        })
      }
    }
  }

  const rank: Record<IssueLevel, number> = { error: 0, hint: 1 }
  issues.sort((a, b) => rank[a.level] - rank[b.level] || (a.beatId ?? '').localeCompare(b.beatId ?? ''))

  return { product, issues }
}

export const prototype = parseFlows(markdown, new Set(Object.keys(screens)))
