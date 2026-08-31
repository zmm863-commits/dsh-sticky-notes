window.__ModuleLoader__.load({ id: "dsh-sticky-notes", factory: (require) => {
  var module = { exports: {} }; var exports = module.exports;
const { createElement, useCallback, useEffect, useRef, useState } = require("react");
const ReactDOM = require("react-dom/client");
const React = { createElement, useCallback, useEffect, useRef, useState };

const inject = ['slots'];

function apply(ctx) {
  const slots = ctx.slots
  if (!slots) return
  const api = (endpoint, payload) => fetch('/api/paopaocat-notes', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ endpoint, payload })
  }).then(res => res.json()).then(data => {
    if (data.error) throw new Error(data.error)
    return data
  })
  const panelController = {
    _open: false,
    _listeners: [],
    toggle() { this._open = !this._open; this._listeners.forEach(fn => { try { fn(this._open) } catch(e) {} }) },
    subscribe(fn) { this._listeners.push(fn); return () => { this._listeners = this._listeners.filter(f => f !== fn) } }
  }

  const COLORS = ['red', 'blue', 'yellow']
  const COLOR_BG = { red: '#7f1d1d', blue: '#1e3a5f', yellow: '#78350f' }
  const COLOR_BORDER = { red: '#b91c1c', blue: '#2a5a8f', yellow: '#a16207' }
  const COLOR_DOT = { red: '#dc2626', blue: '#3b82f6', yellow: '#eab308' }
  const COLOR_TEXT = { red: '#fbbf24', blue: '#ffffff', yellow: '#ef4444' }
  const COLOR_LABEL = { red: '急', blue: '常', yellow: '重' }
  const WAREHOUSE_KEY = 'paopaocat_warehouse_pwd'

  const BELL_CSS = '@keyframes bellShake{0%{transform:rotate(0)}10%{transform:rotate(14deg)}20%{transform:rotate(-12deg)}30%{transform:rotate(10deg)}40%{transform:rotate(-8deg)}50%{transform:rotate(6deg)}60%{transform:rotate(-4deg)}70%{transform:rotate(2deg)}80%{transform:rotate(-1deg)}100%{transform:rotate(0)}}@keyframes bellGlow{0%,100%{filter:drop-shadow(0 0 8px rgba(251,191,36,.3))}50%{filter:drop-shadow(0 0 24px rgba(251,191,36,.8))}}.paopaocat-bell{animation:bellShake .6s ease-in-out infinite,bellGlow 1.5s ease-in-out infinite}@keyframes fadeSlideIn{from{opacity:0;transform:translateY(-12px)}to{opacity:1;transform:translateY(0)}}.paopaocat-toast{animation:fadeSlideIn .3s ease-out}'

  function InjectStyle() {
    React.useEffect(() => {
      const style = document.createElement('style')
      style.textContent = BELL_CSS
      document.head.appendChild(style)
      return () => { document.head.removeChild(style) }
    }, [])
    return null
  }

  function ReminderDialog({ noteId, noteContent, onConfirm, onCancel }) {
    const [selectedTime, setSelectedTime] = React.useState('')
    const now = new Date()
    const minStr = new Date(now.getTime() + 60000).toISOString().slice(0, 16)
    React.useEffect(() => { setSelectedTime(new Date(now.getTime() + 5 * 60000).toISOString().slice(0, 16)) }, [])
    async function handleConfirm() {
      if (!selectedTime) return
      const reminderAt = new Date(selectedTime).getTime()
      try {
        const res = await api('update', { id: noteId, reminderAt })
        const diff = reminderAt - Date.now()
        const mins = Math.floor(diff / 60000)
        const secs = Math.floor((diff % 60000) / 1000)
        const timeStr = mins > 0 ? mins + '分' + (secs > 0 ? secs + '秒' : '') : secs + '秒'
        onConfirm(timeStr, res?.note)
      } catch (e) { console.error(e) }
    }
    return React.createElement('div', { style: { position: 'fixed', inset: 0, zIndex: 1001, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)' }, onClick: e => { if (e.target === e.currentTarget) onCancel() } },
      React.createElement('div', { style: { width: 320, background: '#0f172a', borderRadius: 16, boxShadow: '0 8px 40px rgba(0,0,0,0.5)', border: '1px solid #1e293b', overflow: 'hidden' } },
        React.createElement('div', { style: { padding: '16px 20px', borderBottom: '1px solid #1e293b' } }, React.createElement('h3', { style: { margin: 0, fontSize: 15, fontWeight: 600, color: '#e2e8f0' } }, '⏰ 设置提醒时间')),
        React.createElement('div', { style: { padding: '16px 20px' } },
          React.createElement('p', { style: { margin: '0 0 12px', fontSize: 13, color: '#94a3b8' } }, noteContent.length > 30 ? noteContent.slice(0, 30) + '...' : noteContent),
          React.createElement('input', { type: 'datetime-local', value: selectedTime, min: minStr, onChange: e => setSelectedTime(e.target.value), style: { width: '100%', padding: '10px', border: '1px solid #334155', borderRadius: 8, fontSize: 14, background: '#1e293b', color: '#e2e8f0', boxSizing: 'border-box' } }),
          React.createElement('p', { style: { margin: '8px 0 0', fontSize: 11, color: '#64748b' } }, '提醒时间需在当前时间之后'),
          React.createElement('div', { style: { display: 'flex', gap: 10, marginTop: 14 } },
            React.createElement('button', { onClick: handleConfirm, style: { flex: 1, padding: '10px', background: '#eab308', color: '#0f172a', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600 } }, '确定'),
            React.createElement('button', { onClick: onCancel, style: { flex: 1, padding: '10px', background: '#334155', color: '#e2e8f0', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14 } }, '取消')
          )
        )
      )
    )
  }

  function SetPinDialog({ noteId, onConfirm, onCancel }) {
    const [pin, setPin] = React.useState('')
    const [step, setStep] = React.useState('set')
    const [confirmPin, setConfirmPin] = React.useState('')
    const [error, setError] = React.useState('')
    async function handleConfirm() {
      if (!/^\d{3}$/.test(pin)) { setError('请输入三位数字'); return }
      if (step === 'set') { setConfirmPin(pin); setPin(''); setStep('confirm'); return }
      if (pin !== confirmPin) { setError('两次输入不一致'); setPin(''); return }
      const res = await api('update', { id: noteId, pin: pin })
      onConfirm(res?.note)
    }
    return React.createElement('div', { style: { position: 'fixed', inset: 0, zIndex: 1001, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)' }, onClick: e => { if (e.target === e.currentTarget) onCancel() } },
      React.createElement('div', { style: { width: 280, background: '#0f172a', borderRadius: 16, boxShadow: '0 8px 40px rgba(0,0,0,0.5)', border: '1px solid #1e293b', overflow: 'hidden' } },
        React.createElement('div', { style: { padding: '16px 20px', borderBottom: '1px solid #1e293b' } }, React.createElement('h3', { style: { margin: 0, fontSize: 15, fontWeight: 600, color: '#e2e8f0' } }, step === 'set' ? '🔒 设置三位密码' : '🔒 确认密码')),
        React.createElement('div', { style: { padding: '16px 20px' } },
          React.createElement('input', { type: 'password', maxLength: 3, value: pin, onChange: e => { setPin(e.target.value.replace(/[^0-9]/g, '')); setError('') }, onKeyDown: e => e.key === 'Enter' && handleConfirm(), placeholder: '•••', style: { width: '100%', padding: '12px', border: error ? '1px solid #ef4444' : '1px solid #334155', borderRadius: 8, fontSize: 24, textAlign: 'center', letterSpacing: 8, background: '#1e293b', color: '#e2e8f0', boxSizing: 'border-box', outline: 'none' } }),
          error && React.createElement('p', { style: { margin: '8px 0 0', fontSize: 12, color: '#ef4444' } }, error),
          React.createElement('div', { style: { display: 'flex', gap: 10, marginTop: 14 } },
            React.createElement('button', { onClick: handleConfirm, style: { flex: 1, padding: '10px', background: '#eab308', color: '#0f172a', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600 } }, step === 'set' ? '下一步' : '确定'),
            React.createElement('button', { onClick: onCancel, style: { flex: 1, padding: '10px', background: '#334155', color: '#e2e8f0', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14 } }, '取消')
          )
        )
      )
    )
  }

  function PinDialog({ noteId, onUnlock, onCancel }) {
    const [pin, setPin] = React.useState('')
    const [error, setError] = React.useState(false)
    async function handleSubmit() {
      if (!pin || pin.length !== 3) { setError(true); return }
      try {
        const res = await api('list')
        const note = res?.notes?.find(n => n.id === noteId)
        if (note && note.pin === pin) { onUnlock(note.content) } else { setError(true); setPin('') }
      } catch (e) { setError(true) }
    }
    return React.createElement('div', { style: { position: 'fixed', inset: 0, zIndex: 1002, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)' }, onClick: e => { if (e.target === e.currentTarget) onCancel() } },
      React.createElement('div', { style: { width: 280, background: '#0f172a', borderRadius: 16, boxShadow: '0 8px 40px rgba(0,0,0,0.5)', border: '1px solid #1e293b', overflow: 'hidden' } },
        React.createElement('div', { style: { padding: '16px 20px', borderBottom: '1px solid #1e293b' } }, React.createElement('h3', { style: { margin: 0, fontSize: 15, fontWeight: 600, color: '#e2e8f0' } }, '🔒 输入三位密码')),
        React.createElement('div', { style: { padding: '16px 20px' } },
          React.createElement('input', { type: 'password', maxLength: 3, value: pin, onChange: e => { setPin(e.target.value.replace(/[^0-9]/g, '')); setError(false) }, onKeyDown: e => e.key === 'Enter' && handleSubmit(), placeholder: '•••', style: { width: '100%', padding: '12px', border: error ? '1px solid #ef4444' : '1px solid #334155', borderRadius: 8, fontSize: 24, textAlign: 'center', letterSpacing: 8, background: '#1e293b', color: '#e2e8f0', boxSizing: 'border-box', outline: 'none' } }),
          error && React.createElement('p', { style: { margin: '8px 0 0', fontSize: 12, color: '#ef4444' } }, '密码错误'),
          React.createElement('div', { style: { display: 'flex', gap: 10, marginTop: 14 } },
            React.createElement('button', { onClick: handleSubmit, style: { flex: 1, padding: '10px', background: '#eab308', color: '#0f172a', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600 } }, '确定'),
            React.createElement('button', { onClick: onCancel, style: { flex: 1, padding: '10px', background: '#334155', color: '#e2e8f0', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14 } }, '取消')
          )
        )
      )
    )
  }

  function WarehousePasswordDialog({ mode, onConfirm, onCancel }) {
    const [pin, setPin] = React.useState('')
    const [confirmPin, setConfirmPin] = React.useState('')
    const [error, setError] = React.useState('')
    function handleSubmit() {
      if (mode === 'create') {
        if (!/^\d{3}$/.test(pin)) { setError('请输入三位数字'); return }
        if (pin !== confirmPin) { setError('两次输入不一致'); return }
        try { localStorage.setItem(WAREHOUSE_KEY, pin) } catch (e) {}
        onConfirm()
      } else {
        if (!pin) { setError('请输入密码'); return }
        const saved = localStorage.getItem(WAREHOUSE_KEY)
        if (pin === saved) { onConfirm() } else { setError('密码错误'); setPin('') }
      }
    }
    return React.createElement('div', { style: { position: 'fixed', inset: 0, zIndex: 2001, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)' }, onClick: e => { if (e.target === e.currentTarget) onCancel() } },
      React.createElement('div', { style: { width: 300, background: '#0f172a', borderRadius: 16, boxShadow: '0 8px 40px rgba(0,0,0,0.5)', border: '1px solid #1e293b', overflow: 'hidden' } },
        React.createElement('div', { style: { padding: '16px 20px', borderBottom: '1px solid #1e293b' } }, React.createElement('h3', { style: { margin: 0, fontSize: 15, fontWeight: 600, color: '#e2e8f0' } }, mode === 'create' ? '🔒 设置库房密码' : '🔒 输入库房密码')),
        React.createElement('div', { style: { padding: '16px 20px' } },
          mode === 'create' && React.createElement('div', { style: { marginBottom: 10, padding: '8px 12px', background: '#1e3a5f', borderRadius: 6, border: '1px solid #2a5a8f' } }, React.createElement('p', { style: { margin: 0, fontSize: 11, color: '#93c5fd' } }, '⚠️ 请务必保存好密码，后续每次进入都需要输入此密码！')),
          React.createElement('input', { type: 'password', maxLength: 3, value: pin, onChange: e => { setPin(e.target.value.replace(/[^0-9]/g, '')); setError('') }, onKeyDown: e => e.key === 'Enter' && handleSubmit(), placeholder: mode === 'create' ? '设置三位密码' : '输入密码', style: { width: '100%', padding: '12px', border: error ? '1px solid #ef4444' : '1px solid #334155', borderRadius: 8, fontSize: 24, textAlign: 'center', letterSpacing: 8, background: '#1e293b', color: '#e2e8f0', boxSizing: 'border-box', outline: 'none' } }),
          mode === 'create' && React.createElement('input', { type: 'password', maxLength: 3, value: confirmPin, onChange: e => { setConfirmPin(e.target.value.replace(/[^0-9]/g, '')); setError('') }, placeholder: '确认密码', style: { width: '100%', padding: '12px', border: '1px solid #334155', borderRadius: 8, fontSize: 24, textAlign: 'center', letterSpacing: 8, background: '#1e293b', color: '#e2e8f0', boxSizing: 'border-box', outline: 'none', marginTop: 10 } }),
          error && React.createElement('p', { style: { margin: '8px 0 0', fontSize: 12, color: '#ef4444' } }, error),
          React.createElement('div', { style: { display: 'flex', gap: 10, marginTop: 14 } },
            React.createElement('button', { onClick: handleSubmit, style: { flex: 1, padding: '10px', background: '#eab308', color: '#0f172a', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600 } }, '确定'),
            React.createElement('button', { onClick: onCancel, style: { flex: 1, padding: '10px', background: '#334155', color: '#e2e8f0', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14 } }, '取消')
          )
        )
      )
    )
  }

  function NoteCard({ n, editingId, editContent, editReminder, onStartEdit, onSaveEdit, onDelete, onTogglePin, onUnlock }) {
    const isLocked = n.color === 'yellow' && n.pin && !n.unlocked
    return React.createElement('div', { style: { background: COLOR_BG[n.color] || COLOR_BG.blue, border: '1px solid ' + (COLOR_BORDER[n.color] || COLOR_BORDER.blue), borderRadius: 10, padding: 10, marginBottom: 8 } },
      editingId === n.id
        ? React.createElement('div', null,
            React.createElement('textarea', { value: editContent, onChange: e => onStartEdit(n, 'content', e.target.value), style: { width: '100%', minHeight: 50, padding: 7, border: '1px solid #334155', borderRadius: 6, fontSize: 13, resize: 'vertical', outline: 'none', boxSizing: 'border-box', background: '#0f172a', color: '#e2e8f0' } }),
            React.createElement('div', { style: { marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 } },
              React.createElement('label', { style: { fontSize: 11, color: '#94a3b8', whiteSpace: 'nowrap' } }, '⏰:'),
              React.createElement('input', { type: 'datetime-local', value: editReminder, onChange: e => onStartEdit(n, 'reminder', e.target.value), style: { flex: 1, padding: '3px 6px', border: '1px solid #334155', borderRadius: 4, fontSize: 11, background: '#0f172a', color: '#e2e8f0' } })
            ),
            React.createElement('div', { style: { marginTop: 6, display: 'flex', gap: 6 } },
              React.createElement('button', { onClick: () => onSaveEdit(n.id), style: { padding: '5px 10px', background: '#eab308', color: '#0f172a', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 } }, '保存'),
              React.createElement('button', { onClick: () => onStartEdit(null), style: { padding: '5px 10px', background: '#334155', color: '#e2e8f0', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12 } }, '取消')
            )
          )
        : React.createElement('div', null,
            isLocked
              ? React.createElement('div', { onClick: () => onUnlock(n.id), style: { cursor: 'pointer', padding: '8px 0' } },
                  React.createElement('span', { style: { fontSize: 18, letterSpacing: 4, color: COLOR_TEXT[n.color] } }, '•••••'),
                  React.createElement('span', { style: { fontSize: 11, color: '#64748b', marginLeft: 8 } }, '点击输入密码查看')
                )
              : React.createElement('div', { style: { whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: 13, lineHeight: 1.5, color: COLOR_TEXT[n.color] } }, n.content),
            React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 } },
              React.createElement('span', { style: { fontSize: 10, color: '#94a3b8' } }, new Date(n.updatedAt).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })),
              n.reminderAt && React.createElement('span', { style: { fontSize: 10, color: n.reminderFired ? '#64748b' : '#fbbf24' } }, n.reminderFired ? '⏰ 已提醒' : '⏰ ' + new Date(n.reminderAt).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })),
              React.createElement('div', { style: { flex: 1 } }),
              React.createElement('button', { onClick: () => onTogglePin(n.id), title: '置顶', style: { background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, opacity: n.pinned ? 1 : 0.3, color: '#fff' } }, '📌'),
              React.createElement('button', { onClick: () => onStartEdit(n), title: '编辑', style: { background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#fff' } }, '✏️'),
              React.createElement('button', { onClick: () => onDelete(n.id), title: '删除', style: { background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#fff' } }, '🗑')
            )
          )
    )
  }

  function NotesPopup({ onClose }) {
    const [notes, setNotes] = React.useState([])
    const [newContent, setNewContent] = React.useState('')
    const [newColor, setNewColor] = React.useState('blue')
    const [editingId, setEditingId] = React.useState(null)
    const [editContent, setEditContent] = React.useState('')
    const [editReminder, setEditReminder] = React.useState('')
    const [pos, setPos] = React.useState(null)
    const [loaded, setLoaded] = React.useState(false)
    const [reminderDlg, setReminderDlg] = React.useState(null)
    const [pinCreateDlg, setPinCreateDlg] = React.useState(null)
    const [pinInputDlg, setPinInputDlg] = React.useState(null)
    const [toastMsg, setToastMsg] = React.useState(null)
    const [unlockedNotes, setUnlockedNotes] = React.useState(new Set())
    const dragRef = React.useRef({ dragging: false, offsetX: 0, offsetY: 0 })

    async function loadPos() {
      try { const r = await api('getSavedPos'); if (r?.pos) setPos(r.pos) } catch (e) {}
    }
    async function loadNotes() {
      try { const r = await api('list'); if (r?.notes) setNotes(r.notes) } catch (e) {}
    }

    React.useEffect(() => {
      (async () => { await loadNotes(); await loadPos(); setLoaded(true) })()
      const dispose = setInterval(() => loadNotes(), 5000)
      return () => { if (dispose) dispose() }
    }, [])

    function handleDragStart(e) {
      const rect = e.currentTarget.getBoundingClientRect()
      dragRef.current = { dragging: true, offsetX: e.clientX - rect.left, offsetY: e.clientY - rect.top }
      e.preventDefault()
    }
    React.useEffect(() => {
      const onMove = (e) => {
        if (!dragRef.current.dragging) return
        const np = { x: e.clientX - dragRef.current.offsetX, y: e.clientY - dragRef.current.offsetY }
        setPos(np); dragRef.current.lastPos = np
      }
      const onUp = () => {
        if (dragRef.current.dragging) { dragRef.current.dragging = false; if (dragRef.current.lastPos) api('savePos', { pos: dragRef.current.lastPos }) }
      }
      window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp)
      return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
    }, [])

    async function createNote() {
      if (!newContent.trim()) return
      const content = newContent; const color = newColor
      setNewContent('')
      try {
        const res = await api('create', { content, color })
        if (res?.note) {
          setNotes(prev => [res.note, ...prev])
          if (res.note.color === 'red') setReminderDlg({ id: res.note.id, content: res.note.content })
          else if (res.note.color === 'yellow') setPinCreateDlg({ id: res.note.id })
        }
      } catch (e) { console.error(e) }
    }

    async function saveEdit(id) {
      try {
        const update = { id, content: editContent }
        update.reminderAt = editReminder ? new Date(editReminder).getTime() : null
        const res = await api('update', update)
        if (res?.note) setNotes(prev => prev.map(n => n.id === id ? res.note : n))
        setEditingId(null); setEditContent(''); setEditReminder('')
      } catch (e) { console.error(e) }
    }
    async function deleteNote(id) {
      try { await api('delete', { id }); setNotes(prev => prev.filter(n => n.id !== id)) } catch (e) { console.error(e) }
    }
    async function togglePin(id) {
      try { const res = await api('togglePin', { id }); if (res?.note) setNotes(prev => prev.map(n => n.id === id ? res.note : n)) } catch (e) { console.error(e) }
    }
    function startEdit(n, field, value) {
      if (n === null) { setEditingId(null); setEditContent(''); setEditReminder(''); return }
      setEditingId(n.id); setEditContent(n.content)
      setEditReminder(n.reminderAt ? new Date(n.reminderAt).toISOString().slice(0, 16) : '')
      if (field === 'content') setEditContent(value)
      if (field === 'reminder') setEditReminder(value)
    }
    function handleUnlock(noteId) { setPinInputDlg({ id: noteId }) }

    const sorted = [...notes].sort((a, b) => { if (a.pinned !== b.pinned) return a.pinned ? -1 : 1; return b.updatedAt - a.updatedAt })
    const displayNotes = sorted.slice(0, 3)
    if (!loaded) return null
    const hasPos = pos && pos.x != null
    const posStyle = hasPos ? { position: 'fixed', left: pos.x, top: pos.y, margin: 0 } : { position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }

    return React.createElement('div', { style: { position: 'relative', zIndex: 1000 } },
      React.createElement('div', { style: { ...posStyle, background: hasPos ? 'transparent' : 'rgba(0,0,0,0.5)' }, onClick: e => { if (!hasPos && e.target === e.currentTarget) onClose() } },
        React.createElement('div', { style: { width: 360, maxHeight: '80vh', background: '#0f172a', borderRadius: 16, boxShadow: '0 8px 40px rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column', fontFamily: 'system-ui, -apple-system, sans-serif', overflow: 'hidden', border: '1px solid #1e293b' } },
          React.createElement('div', { onMouseDown: handleDragStart, style: { padding: '14px 18px', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'move', userSelect: 'none' } },
            React.createElement('h2', { style: { margin: 0, fontSize: 16, fontWeight: 600, color: '#e2e8f0' } }, '📝 泡泡猫的即时便签'),
            React.createElement('button', { onClick: onClose, onMouseDown: e => e.stopPropagation(), style: { background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#64748b', padding: '2px 6px' } }, '✕')
          ),
          React.createElement('div', { style: { padding: '10px 14px', borderBottom: '1px solid #1e293b', background: '#1e293b' } },
            React.createElement('div', { style: { display: 'flex', gap: 10, marginBottom: 8 } },
              COLORS.map(c => React.createElement('button', {
                key: c, onClick: () => setNewColor(c),
                style: {
                  width: newColor === c ? 44 : 36, height: newColor === c ? 44 : 36,
                  borderRadius: '50%', background: COLOR_DOT[c],
                  border: newColor === c ? '3px solid #fff' : '2px solid transparent',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: newColor === c ? 18 : 14, fontWeight: 700, color: '#fff',
                  transition: 'all 0.15s ease', transform: newColor === c ? 'scale(1.1)' : 'scale(1)'
                }
              }, COLOR_LABEL[c]))
            ),
            React.createElement('div', { style: { display: 'flex', gap: 8 } },
              React.createElement('input', { value: newContent, onChange: e => setNewContent(e.target.value), placeholder: '记录一下...', onKeyDown: e => e.key === 'Enter' && createNote(), style: { flex: 1, padding: '7px 10px', border: '1px solid #334155', borderRadius: 8, fontSize: 13, outline: 'none', background: '#0f172a', color: '#e2e8f0' } }),
              React.createElement('button', { onClick: createNote, style: { padding: '7px 14px', background: '#eab308', color: '#0f172a', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 } }, '添加')
            )
          ),
          toastMsg && React.createElement('div', { className: 'paopaocat-toast', style: { padding: '8px 14px', background: '#fbbf24', color: '#0f172a', fontSize: 13, fontWeight: 500 } }, toastMsg),
          React.createElement('div', { style: { flex: 1, overflow: 'auto', padding: '10px 14px' } },
            displayNotes.length === 0
              ? React.createElement('p', { style: { color: '#64748b', textAlign: 'center', marginTop: 30, fontSize: 13 } }, '还没有便签，写一条吧～')
              : displayNotes.map(n => React.createElement(NoteCard, { key: n.id, n: { ...n, unlocked: unlockedNotes.has(n.id) }, editingId: editingId, editContent: editContent, editReminder: editReminder, onStartEdit: startEdit, onSaveEdit: saveEdit, onDelete: deleteNote, onTogglePin: togglePin, onUnlock: handleUnlock }))
          )
        )
      ),
      reminderDlg && React.createElement(ReminderDialog, { noteId: reminderDlg.id, noteContent: reminderDlg.content, onConfirm: (timeStr, note) => { setReminderDlg(null); if (note) setNotes(prev => prev.map(n => n.id === note.id ? note : n)); setToastMsg('⏰ 将在 ' + timeStr + '后提醒你'); setTimeout(() => setToastMsg(null), 3000) }, onCancel: () => setReminderDlg(null) }),
      pinCreateDlg && React.createElement(SetPinDialog, { noteId: pinCreateDlg.id, onConfirm: (note) => { setPinCreateDlg(null); if (note) setNotes(prev => prev.map(n => n.id === note.id ? note : n)); setToastMsg('🔒 密码设置成功'); setTimeout(() => setToastMsg(null), 2000) }, onCancel: () => setPinCreateDlg(null) }),
      pinInputDlg && React.createElement(PinDialog, { noteId: pinInputDlg.id, onUnlock: () => { setPinInputDlg(null); setUnlockedNotes(prev => new Set(prev).add(pinInputDlg.id)) }, onCancel: () => setPinInputDlg(null) })
    )
  }

  function WarehousePanel({ onClose }) {
    const [notes, setNotes] = React.useState([])
    const [editingId, setEditingId] = React.useState(null)
    const [editContent, setEditContent] = React.useState('')
    const [editReminder, setEditReminder] = React.useState('')
    const [pinInputDlg, setPinInputDlg] = React.useState(null)
    const [unlockedNotes, setUnlockedNotes] = React.useState(new Set())
    const [pwdMode, setPwdMode] = React.useState(null)
    const [authed, setAuthed] = React.useState(false)

    React.useEffect(() => {
      const saved = localStorage.getItem(WAREHOUSE_KEY)
      if (saved) setPwdMode('login'); else setPwdMode('create')
    }, [])

    async function loadNotes() {
      try { const r = await api('list'); if (r?.notes) setNotes(r.notes) } catch (e) {}
    }
    React.useEffect(() => {
      if (authed) { loadNotes(); const d = setInterval(() => loadNotes(), 5000); return () => clearInterval(d) }
    }, [authed])

    async function saveEdit(id) {
      try {
        const update = { id, content: editContent }
        update.reminderAt = editReminder ? new Date(editReminder).getTime() : null
        const res = await api('update', update)
        if (res?.note) setNotes(prev => prev.map(n => n.id === id ? res.note : n))
        setEditingId(null); setEditContent(''); setEditReminder('')
      } catch (e) { console.error(e) }
    }
    async function deleteNote(id) {
      try { await api('delete', { id }); setNotes(prev => prev.filter(n => n.id !== id)) } catch (e) { console.error(e) }
    }
    async function togglePin(id) {
      try { const res = await api('togglePin', { id }); if (res?.note) setNotes(prev => prev.map(n => n.id === id ? res.note : n)) } catch (e) { console.error(e) }
    }
    function startEdit(n, field, value) {
      if (n === null) { setEditingId(null); setEditContent(''); setEditReminder(''); return }
      setEditingId(n.id); setEditContent(n.content)
      setEditReminder(n.reminderAt ? new Date(n.reminderAt).toISOString().slice(0, 16) : '')
      if (field === 'content') setEditContent(value)
      if (field === 'reminder') setEditReminder(value)
    }
    function handleUnlock(noteId) { setPinInputDlg({ id: noteId }) }

    const sorted = [...notes].sort((a, b) => { if (a.pinned !== b.pinned) return a.pinned ? -1 : 1; return b.updatedAt - a.updatedAt })

    if (pwdMode && !authed) {
      return React.createElement(WarehousePasswordDialog, { mode: pwdMode, onConfirm: () => { setAuthed(true); setPwdMode(null) }, onCancel: () => setPwdMode(null) })
    }

    return React.createElement('div', { style: { padding: 16, color: '#e2e8f0' } },
      React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 } },
        React.createElement('h3', { style: { margin: 0, fontSize: 16 } }, '🏪 便签库房 (' + notes.length + ')'),
        React.createElement('button', { onClick: onClose, style: { background: '#334155', color: '#e2e8f0', border: 'none', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontSize: 12 } }, '关闭')
      ),
      React.createElement('div', { style: { maxHeight: '60vh', overflow: 'auto' } },
        sorted.length === 0
          ? React.createElement('p', { style: { color: '#64748b', textAlign: 'center', marginTop: 30, fontSize: 13 } }, '库房空空如也')
          : sorted.map(n => React.createElement(NoteCard, { key: n.id, n: { ...n, unlocked: unlockedNotes.has(n.id) }, editingId: editingId, editContent: editContent, editReminder: editReminder, onStartEdit: startEdit, onSaveEdit: saveEdit, onDelete: deleteNote, onTogglePin: togglePin, onUnlock: handleUnlock }))
      ),
      pinInputDlg && React.createElement(PinDialog, { noteId: pinInputDlg.id, onUnlock: () => { setPinInputDlg(null); setUnlockedNotes(prev => new Set(prev).add(pinInputDlg.id)) }, onCancel: () => setPinInputDlg(null) })
    )
  }

  function ReminderBell({ reminder, onDismiss }) {
    React.useEffect(() => {
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
        const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain()
        osc.connect(gain); gain.connect(audioCtx.destination)
        osc.frequency.value = 880; osc.type = 'sine'
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1.5)
        osc.start(audioCtx.currentTime); osc.stop(audioCtx.currentTime + 1.5)
      } catch (e) {}
    }, [])
    return React.createElement('div', { onClick: () => onDismiss(reminder.id), style: { position: 'fixed', inset: 0, zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', cursor: 'pointer' } },
      React.createElement('div', { style: { textAlign: 'center' } },
        React.createElement('div', { className: 'paopaocat-bell', style: { fontSize: 80, display: 'inline-block' } }, '🔔'),
        React.createElement('div', { style: { fontSize: 20, fontWeight: 600, color: '#fbbf24', marginTop: 16 } }, '便签提醒'),
        React.createElement('div', { style: { fontSize: 16, color: '#e2e8f0', marginTop: 12, maxWidth: 300, wordBreak: 'break-word' } }, reminder.content),
        React.createElement('div', { style: { fontSize: 12, color: '#64748b', marginTop: 20 } }, '点击任意位置关闭')
      )
    )
  }

  function ReminderToast() {
    const [reminders, setReminders] = React.useState([])
    const [bellReminder, setBellReminder] = React.useState(null)
    const shownRef = React.useRef(new Set())
    async function check() {
      try {
        const res = await api('getPendingReminders')
        if (res?.reminders) {
          const newOnes = res.reminders.filter(r => !shownRef.current.has(r.id))
          if (newOnes.length > 0) { setBellReminder(newOnes[0]); newOnes.forEach(r => shownRef.current.add(r.id)) }
          setReminders(res.reminders)
        }
      } catch (e) {}
    }
    React.useEffect(() => { check(); const d = setInterval(() => check(), 5000); return () => clearInterval(d) }, [])
    async function dismiss(id) { await api('acknowledgeReminder', { id }); setReminders(prev => prev.filter(r => r.id !== id)); setBellReminder(null) }
    return React.createElement('div', null,
      bellReminder && React.createElement(ReminderBell, { reminder: bellReminder, onDismiss: dismiss }),
      reminders.map(r => React.createElement('div', { key: r.id, style: { position: 'fixed', top: 20, right: 20, zIndex: 2000, background: '#1e293b', border: '1px solid #fbbf24', borderRadius: 10, padding: '14px 18px', minWidth: 260, maxWidth: 320, boxShadow: '0 4px 16px rgba(0,0,0,0.3)' } },
        React.createElement('div', { style: { fontWeight: 600, marginBottom: 6, fontSize: 14, color: '#fbbf24' } }, '⏰ 便签提醒'),
        React.createElement('div', { style: { fontSize: 14, marginBottom: 10, wordBreak: 'break-word', color: '#e2e8f0' } }, r.content),
        React.createElement('button', { onClick: () => dismiss(r.id), style: { padding: '4px 12px', background: '#fbbf24', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 500, color: '#0f172a' } }, '知道了')
      ))
    )
  }

  slots.inject('conversation.input.left', () => slots.register(
    { name: 'conversation.input.left', id: 'sticky-notes-btn', order: 10 },
    (props) => React.createElement('button', {
      onClick: () => panelController.toggle(),
      title: '泡泡猫的即时便签',
      'aria-label': '泡泡猫的即时便签',
      style: {
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: 32, height: 32, padding: 0, flex: 'none',
        background: 'none', border: 'none', borderRadius: 6,
        cursor: 'pointer', fontSize: 18,
        color: '#94a3b8', transition: 'background 0.15s'
      },
      onMouseEnter: e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)',
      onMouseLeave: e => e.currentTarget.style.background = 'none'
    }, '📝')
  ))


  // 用独立 DOM 容器挂载面板，避免 slot reconcile 问题
  const panelRoot = document.createElement('div')
  panelRoot.dataset.stickyNotes = ''
  document.body.appendChild(panelRoot)
  const panelReactRoot = ReactDOM.createRoot(panelRoot)
  function renderPanel() {
    panelReactRoot.render(React.createElement(NotesPopup, { onClose: () => panelController.toggle() }))
  }
  function unmountPanel() {
    panelReactRoot.render(null)
  }
  panelController.subscribe(open => { if (open) renderPanel(); else unmountPanel() })

  // 注入 CSS 样式
  slots.inject('shell.overlay', () => slots.register(
    { name: 'shell.overlay', id: 'sticky-notes-style', order: 20 },
    () => React.createElement(InjectStyle)
  ))

  // 注入仓库面板到 shell overlay
  slots.inject('shell.overlay', () => slots.register(
    { name: 'shell.overlay', id: 'sticky-notes-warehouse', order: 35 },
    () => {
      const [open, setOpen] = React.useState(false)
      React.useEffect(() => { const h = () => setOpen(v => !v); window.addEventListener('paopaocat-warehouse', h); return () => window.removeEventListener('paopaocat-warehouse', h) }, [])
      if (!open) return null
      return React.createElement('div', { style: { position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' } },
        React.createElement('div', { style: { width: 480, maxHeight: '85vh', background: '#0f172a', borderRadius: 16, boxShadow: '0 8px 40px rgba(0,0,0,0.4)', overflow: 'hidden', border: '1px solid #1e293b' } },
          React.createElement(WarehousePanel, { onClose: () => setOpen(false) })
        )
      )
    }
  ))

  // 提醒 toast
  slots.inject('shell.overlay', () => slots.register(
    { name: 'shell.overlay', id: 'sticky-notes-reminder', order: 25 },
    () => React.createElement(ReminderToast)
  ))

  slots.inject('settings.section', () => slots.register(
    { name: 'settings.section', id: 'paopaocat-notes', order: 20, label: '📝 泡泡猫的即时便签' },
    (props) => React.createElement(WarehousePanel, { onClose: () => {} })
  ))

}

module.exports = { apply, inject };
return module.exports;
} });
