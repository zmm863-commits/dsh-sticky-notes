import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'

const name = 'dsh-sticky-notes'
const inject = ['webServer']
const NOTES_PATH = '/dsh/paopaocat-notes.json'

let notes = []
let pendingReminders = []
let savedPos = null

async function load() {
  try {
    const text = readFileSync(NOTES_PATH, 'utf-8')
    const data = JSON.parse(text)
    if (Array.isArray(data.notes)) notes = data.notes
    if (data.savedPos) savedPos = data.savedPos
  } catch { notes = [] }
}

async function save() {
  try {
    if (!existsSync(dirname(NOTES_PATH))) mkdirSync(dirname(NOTES_PATH), { recursive: true })
    writeFileSync(NOTES_PATH, JSON.stringify({ notes, savedPos }, null, 2))
  } catch (e) { console.error('paopaocat-notes: save failed', e) }
}

load()

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8) }

async function handle(endpoint, payload) {
  switch (endpoint) {
    case 'list': return { notes: notes.map(n => ({ ...n })) }
    case 'getSavedPos': return { pos: savedPos }
    case 'savePos': savedPos = payload?.pos || null; await save(); return { ok: true }
    case 'create': {
      const n = { id: uid(), content: payload?.content || '', color: payload?.color || 'blue', pinned: false, createdAt: Date.now(), updatedAt: Date.now(), reminderAt: payload?.reminderAt || null, reminderFired: false, pin: payload?.pin || null }
      notes.unshift(n); await save(); return { note: { ...n } }
    }
    case 'update': {
      const n = notes.find(x => x.id === payload?.id)
      if (!n) return { error: 'not found' }
      if (payload?.content !== undefined) n.content = payload.content
      if (payload?.color !== undefined) n.color = payload.color
      if (payload?.reminderAt !== undefined) { n.reminderAt = payload.reminderAt; n.reminderFired = false }
      if (payload?.pin !== undefined) n.pin = payload.pin
      n.updatedAt = Date.now(); await save(); return { note: { ...n } }
    }
    case 'delete': {
      const i = notes.findIndex(x => x.id === payload?.id)
      if (i === -1) return { error: 'not found' }
      notes.splice(i, 1); await save(); return { ok: true }
    }
    case 'togglePin': {
      const n = notes.find(x => x.id === payload?.id)
      if (!n) return { error: 'not found' }
      n.pinned = !n.pinned; n.updatedAt = Date.now(); await save(); return { note: { ...n } }
    }
    case 'getPendingReminders': return { reminders: [...pendingReminders] }
    case 'acknowledgeReminder': pendingReminders = pendingReminders.filter(r => r.id !== payload?.id); return { ok: true }
    default: return { error: 'unknown endpoint: ' + endpoint }
  }
}

function apply(ctx) {
  // 提醒轮询
  const timer = ctx.get('timer')
  let reminderDispose = null
  if (timer) {
    reminderDispose = timer.interval(() => {
      const now = Date.now()
      let changed = false
      for (const n of notes) {
        if (n.reminderAt && !n.reminderFired && n.reminderAt <= now) {
          n.reminderFired = true
          pendingReminders.push({ id: n.id, content: n.content, firedAt: now })
          changed = true
        }
      }
      if (changed) save()
    }, 30000)
  }

  // HTTP 路由：POST /api/paopaocat-notes { endpoint, payload }
  const handler = async (req, res) => {
    if (req.method !== 'POST') {
      res.writeHead(405, { 'content-type': 'text/plain', allow: 'POST' })
      res.end()
      return
    }
    const chunks = []
    for await (const chunk of req) chunks.push(chunk)
    const body = Buffer.concat(chunks).toString()
    let payload
    try { payload = JSON.parse(body) } catch {
      res.writeHead(400, { 'content-type': 'application/json' })
      res.end(JSON.stringify({ error: 'invalid JSON' }))
      return
    }
    try {
      const result = await handle(payload?.endpoint, payload?.payload)
      res.writeHead(200, { 'content-type': 'application/json' })
      res.end(JSON.stringify(result))
    } catch (err) {
      res.writeHead(500, { 'content-type': 'application/json' })
      res.end(JSON.stringify({ error: String(err) }))
    }
  }

  let disposeRoute = null
  if (ctx.webServer) {
    disposeRoute = ctx.webServer.register({
      kind: 'prefix',
      path: '/api/paopaocat-notes',
      handler
    })
  }

  return () => {
    if (reminderDispose) reminderDispose()
    if (disposeRoute) disposeRoute()
  }
}

export { apply, inject, name }
