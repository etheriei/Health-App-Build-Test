import { useState, useRef, useEffect, useCallback } from 'react'
import './App.css'

// ─── Data ────────────────────────────────────────────────────────────────────

const WORDS = [
  'Hoi','dokter.','Ik','heb','last','van','hoofdpijn.','Oh','kan','je',
  'hem','beschrijven?','Ja','het','is','een','hele','stekende','hoofdpijn.',
  'Vooral','aan','de','linker','kant','Wanneer','is','hij','begonnen?',
  'Vorige','week','begon','het.','Ik','heb','ook','paracetamol','geprobeerd,',
  '500mg,','dat','werkt','well','aardig.'
]

const CODES = [
  { label: 'Hoofdpijn',              code: '25064002' },
  { label: 'Kortadenig',             code: '3'        },
  { label: 'Vermoeid',               code: '6'        },
  { label: 'Hartkloppingen',         code: '7'        },
  { label: 'Orthopneu',              code: '62744007' },
  { label: 'Dyspnoe',                code: '267036007'},
  { label: 'Oedeem',                 code: '267038008'},
  { label: 'Problemen met eetlust',  code: '289163007'},
  { label: 'Paracetamol',            code: '387517004'},
  { label: 'Migraine',               code: '37796009' },
]

const EL_TYPES   = ['problem','medication','condition','diagnostics','provider','social']
const FMT_CODES  = ['snomed_ct','g_standard']
const ASSERTIONS = ['experienced','not_experienced','theoretical','others_experienced']
const TENSES     = ['past','present']
const ONSETS     = ['days','weeks','months','years']
const PROV_TYPES = ['other','current_encounter']
const PROV_STATS = ['established','not_established','unknown']

const TYPE_COLOR = {
  problem:'chip-problem', medication:'chip-medication', condition:'chip-condition',
  diagnostics:'chip-diagnostics', provider:'chip-provider', social:'chip-social',
}

function newAnn(label, indices) {
  return {
    id: Date.now() + Math.random(),
    label,
    indices,          // array of word indices
    elementType: 'problem',
    formatCode: 'snomed_ct',
    code: null,
    assertionStatus: 'experienced',
    tense: 'present',
    onset: null,
    onsetValue: '',
    providerType: null,
    providerStatus: null,
    providerTense: null,
    saved: false,
  }
}

const SEED = newAnn('hoofdpijn', [6])
Object.assign(SEED, { id: 1, code: { label:'Hoofdpijn', code:'25064002' }, onset:'weeks', onsetValue:'1', saved: true })

// ─── Logo ─────────────────────────────────────────────────────────────────────

function Logo() {
  const bars = [
    [28,'#4db8d4'],[16,'#29a0c0'],[38,'#1480b0'],
    [22,'#1270a0'],[12,'#105c8c'],
  ]
  return (
    <svg width="32" height="40" viewBox="0 0 32 40" fill="none">
      {bars.map(([h, fill], i) => (
        <rect key={i} x={i*7} y={(40-h)/2} width="5" height={h} rx="2.5" fill={fill}/>
      ))}
    </svg>
  )
}

// ─── ToggleGroup ──────────────────────────────────────────────────────────────

function ToggleGroup({ options, value, onChange, required }) {
  return (
    <div className="tg">
      {options.map(opt => (
        <button
          key={opt}
          className={`tb${value === opt ? ' on' : ''}`}
          onClick={() => { if (required && value === opt) return; onChange(value === opt ? null : opt) }}
        >{opt}</button>
      ))}
    </div>
  )
}

// ─── CodeSearch ───────────────────────────────────────────────────────────────

function CodeSearch({ value, onChange }) {
  const display = value ? `${value.label}   ${value.code}` : ''
  const [q, setQ] = useState(display)
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => { setQ(value ? `${value.label}   ${value.code}` : '') }, [value])
  useEffect(() => {
    const h = e => { if (!ref.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const term = q.split('   ')[0].toLowerCase()
  const filtered = CODES.filter(c =>
    c.label.toLowerCase().includes(term) || c.code.includes(q)
  )

  return (
    <div className="code-wrap" ref={ref}>
      <input
        className="code-inp"
        value={q}
        placeholder="Search code..."
        onChange={e => { setQ(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
      />
      <span className="code-chevron">▾</span>
      {open && (
        <div className="code-drop">
          {filtered.length === 0
            ? <div className="code-opt"><span className="code-no">No results</span></div>
            : filtered.map(c => (
              <div
                key={c.code}
                className={`code-opt${value?.code === c.code ? ' c-sel' : ''}`}
                onMouseDown={() => { onChange(c); setQ(`${c.label}   ${c.code}`); setOpen(false) }}
              >
                <span>{c.label}</span>
                <span className="code-no">{c.code}</span>
              </div>
            ))
          }
        </div>
      )}
    </div>
  )
}

// ─── QueuePanel ───────────────────────────────────────────────────────────────

function QueuePanel() {
  return (
    <div className="queue-card">
      <button className="q-btn q-primary">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M2 7.5L5.5 11L12 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Mark as done
      </button>
      <button className="q-btn">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.4"/>
          <path d="M7 4V7L9 8.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
        Continue later
      </button>
      <button className="q-btn">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M7 2L13 12H1L7 2Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
          <path d="M7 6V9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          <circle cx="7" cy="10.5" r="0.7" fill="currentColor"/>
        </svg>
        Skip - problem
      </button>
      <button className="q-btn">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="5" cy="4" r="1.8" stroke="currentColor" strokeWidth="1.3"/>
          <circle cx="10" cy="4" r="1.8" stroke="currentColor" strokeWidth="1.3"/>
          <path d="M1 12c0-2.2 1.8-3 4-3s4 .8 4 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
          <path d="M11.5 8.5C12.8 8.5 13.5 9.2 13.5 10.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
        </svg>
        Skip - personal data
      </button>
    </div>
  )
}

// ─── AnnotationForm ───────────────────────────────────────────────────────────

function AnnotationForm({ ann, onChange, onDelete, onSave, dirty }) {
  const [flashing, setFlashing] = useState(null)
  const timerRef = useRef(null)

  const update = (patch, section) => {
    onChange({ ...ann, ...patch, saved: false })
    if (section) {
      clearTimeout(timerRef.current)
      setFlashing(section)
      timerRef.current = setTimeout(() => setFlashing(null), 1200)
    }
  }

  useEffect(() => () => clearTimeout(timerRef.current), [])

  const isProvider = ann.elementType === 'provider'
  const sec = name => `ann-sec${flashing === name ? ' flashing' : ''}${name === 'code' ? ' teal-sec' : ''}`

  return (
    <div className="ann-form">
      <div className={sec('type')}>
        <div className="sec-lbl">element_type</div>
        <ToggleGroup required options={EL_TYPES} value={ann.elementType}
          onChange={v => update({ elementType: v ?? 'problem' }, 'type')} />
      </div>

      <div className={sec('code')}>
        <div className="sec-lbl">format_code</div>
        <ToggleGroup required options={FMT_CODES} value={ann.formatCode}
          onChange={v => update({ formatCode: v ?? 'snomed_ct' }, null)} />
        <div className="sec-lbl">code</div>
        <CodeSearch value={ann.code} onChange={v => update({ code: v }, null)} />
      </div>

      {!isProvider && <>
        <div className={sec('assertion')}>
          <div className="sec-lbl">assertation_status</div>
          <ToggleGroup options={ASSERTIONS} value={ann.assertionStatus}
            onChange={v => update({ assertionStatus: v }, 'assertion')} />
        </div>
        <div className={sec('tense')}>
          <div className="sec-lbl">tense</div>
          <ToggleGroup options={TENSES} value={ann.tense}
            onChange={v => update({ tense: v }, 'tense')} />
        </div>
        <div className={sec('onset')}>
          <div className="sec-lbl">onset</div>
          <ToggleGroup options={ONSETS} value={ann.onset}
            onChange={v => update({ onset: v }, 'onset')} />
          <input
            className="onset-inp"
            type="number"
            min="0"
            placeholder="Number..."
            value={ann.onsetValue ?? ''}
            onChange={e => update({ onsetValue: e.target.value }, 'onset')}
          />
        </div>
      </>}

      {isProvider && <>
        <div className={sec('ptype')}>
          <div className="sec-lbl">provider_type</div>
          <ToggleGroup options={PROV_TYPES} value={ann.providerType}
            onChange={v => update({ providerType: v }, 'ptype')} />
        </div>
        <div className={sec('pstatus')}>
          <div className="sec-lbl">provider_status</div>
          <ToggleGroup options={PROV_STATS} value={ann.providerStatus}
            onChange={v => update({ providerStatus: v }, 'pstatus')} />
        </div>
        <div className={sec('ptense')}>
          <div className="sec-lbl">provider_tense</div>
          <ToggleGroup options={TENSES} value={ann.providerTense}
            onChange={v => update({ providerTense: v }, 'ptense')} />
        </div>
      </>}

      <div className="form-actions">
        <button className={`btn-save${dirty ? ' has-unsaved' : ''}`} onClick={onSave}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M1.5 6.5L4.5 9.5L10.5 3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Save
        </button>
        <button className="btn-delete" onClick={onDelete}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 2L10 10M10 2L2 10" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
          </svg>
          Delete
        </button>
      </div>
    </div>
  )
}

// ─── SaveToast ────────────────────────────────────────────────────────────────

function SaveToast({ leaving }) {
  return (
    <div className={`toast${leaving ? ' leaving' : ''}`}>
      <div className="toast-check">
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M1.5 5L4 7.5L8.5 2.5" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      Annotation saved
    </div>
  )
}

// ─── DeleteModal ──────────────────────────────────────────────────────────────

function DeleteModal({ onCancel, onConfirm }) {
  return (
    <div className="overlay" onClick={onCancel}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-warn">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M10 3L18 17H2L10 3Z" stroke="#d97706" strokeWidth="1.6" strokeLinejoin="round"/>
            <path d="M10 8V12" stroke="#d97706" strokeWidth="1.6" strokeLinecap="round"/>
            <circle cx="10" cy="14.5" r="0.9" fill="#d97706"/>
          </svg>
        </div>
        <div className="modal-title">Delete Annotation</div>
        <div className="modal-sub">This action cannot be undone</div>
        <div className="modal-btns">
          <button className="modal-cancel" onClick={onCancel}>Cancel</button>
          <button className="modal-confirm" onClick={onConfirm}>Confirm</button>
        </div>
      </div>
    </div>
  )
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [anns, setAnns]             = useState([SEED])
  const [activeId, setActiveId]     = useState(null)
  const [deleteTarget, setDelTarget]= useState(null)
  const [toast, setToast]           = useState(null) // null | 'show' | 'leaving'
  const [dragStart, setDragStart]   = useState(null)
  const [dragCur, setDragCur]       = useState(null)
  const [dragging, setDragging]     = useState(false)
  const toastTimer = useRef(null)

  const activeAnn = anns.find(a => a.id === activeId) ?? null

  // map each word index → annotation id
  const idxMap = new Map()
  anns.forEach(a => a.indices.forEach(i => idxMap.set(i, a.id)))

  // drag range (in-progress)
  const dragRange = dragging && dragStart !== null && dragCur !== null
    ? [Math.min(dragStart, dragCur), Math.max(dragStart, dragCur)]
    : null

  // keyboard shortcuts
  useEffect(() => {
    const handler = e => {
      if (e.key === 'Escape') setActiveId(null)
      if ((e.key === 'Delete' || e.key === 'Backspace') && activeId && !e.target.matches('input')) {
        setDelTarget(activeId)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [activeId])

  // mouse up anywhere → finish drag
  useEffect(() => {
    const up = () => {
      if (!dragging) return
      if (dragStart !== null && dragCur !== null) {
        const from = Math.min(dragStart, dragCur)
        const to   = Math.max(dragStart, dragCur)
        // only create multi-word if range spans >1 word
        if (from !== to) {
          const indices = []
          for (let i = from; i <= to; i++) {
            if (!idxMap.has(i)) indices.push(i)
          }
          if (indices.length > 0) {
            const label = indices.map(i => WORDS[i].replace(/[.,?!]/g,'')).join(' ')
            const ann = newAnn(label, indices)
            setAnns(prev => [...prev, ann])
            setActiveId(ann.id)
          }
        }
      }
      setDragging(false)
      setDragStart(null)
      setDragCur(null)
    }
    window.addEventListener('mouseup', up)
    return () => window.removeEventListener('mouseup', up)
  }, [dragging, dragStart, dragCur, idxMap])

  const showToast = () => {
    clearTimeout(toastTimer.current)
    setToast('show')
    toastTimer.current = setTimeout(() => {
      setToast('leaving')
      setTimeout(() => setToast(null), 200)
    }, 2200)
  }

  const handleWordMouseDown = (idx) => {
    if (idxMap.has(idx)) return // don't start drag on annotated word
    setDragStart(idx)
    setDragCur(idx)
    setDragging(true)
  }

  const handleWordMouseEnter = (idx) => {
    if (dragging) setDragCur(idx)
  }

  const handleWordClick = (word, idx) => {
    if (dragging) return
    const existingId = idxMap.get(idx)
    if (existingId !== undefined) {
      setActiveId(existingId === activeId ? null : existingId)
      return
    }
    const clean = word.replace(/[.,?!]/g, '')
    const ann = newAnn(clean, [idx])
    setAnns(prev => [...prev, ann])
    setActiveId(ann.id)
  }

  const handleRemoveWord = (e, annId) => {
    e.stopPropagation()
    setDelTarget(annId)
  }

  const handleChange = updated =>
    setAnns(prev => prev.map(a => a.id === updated.id ? updated : a))

  const handleSave = () => {
    setAnns(prev => prev.map(a => a.id === activeId ? { ...a, saved: true } : a))
    showToast()
  }

  const confirmDelete = () => {
    setAnns(prev => prev.filter(a => a.id !== deleteTarget))
    if (activeId === deleteTarget) setActiveId(null)
    setDelTarget(null)
  }

  const dirty = activeAnn ? !activeAnn.saved : false

  return (
    <div className="app">
      <nav className="navbar">
        <div className="logo"><Logo />autoscriber</div>
        <div className="nav-user">
          thomas@autoscriber.com
          <div className="avatar">T</div>
        </div>
      </nav>

      <div className="main">
        <div className="left-col">
          {/* Transcript */}
          <div className="panel">
            <div className="panel-title">Transcript</div>
            <div className="transcript">
              {WORDS.map((word, idx) => {
                const annId = idxMap.get(idx)
                const inDrag = dragRange && idx >= dragRange[0] && idx <= dragRange[1]

                if (annId !== undefined) {
                  const ann = anns.find(a => a.id === annId)
                  const colorCls = TYPE_COLOR[ann?.elementType] ?? 'chip-default'
                  const isActive = annId === activeId
                  // only render once for first index of multi-word
                  if (ann && ann.indices[0] !== idx) return null
                  return (
                    <span key={idx}>
                      <span
                        className={`w-chip ${colorCls}${isActive ? ' chip-active' : ''}`}
                        onClick={() => handleWordClick(word, idx)}
                      >
                        {ann?.label ?? word}
                        <span className="chip-remove" onClick={e => handleRemoveWord(e, annId)}>×</span>
                      </span>{' '}
                    </span>
                  )
                }

                return (
                  <span key={idx}>
                    <span
                      className={`w${inDrag ? ' in-drag' : ''}`}
                      onMouseDown={() => handleWordMouseDown(idx)}
                      onMouseEnter={() => handleWordMouseEnter(idx)}
                      onClick={() => handleWordClick(word, idx)}
                    >
                      {word}
                    </span>{' '}
                  </span>
                )
              })}
            </div>
          </div>

          {/* Annotated elements */}
          <div className="panel">
            <div className="panel-title">Annotated Elements</div>
            <div className="elements-bar">
              {anns.length === 0
                ? <span className="no-el">No annotations yet — click a word above</span>
                : anns.map(a => {
                  const colorCls = TYPE_COLOR[a.elementType] ?? 'chip-default'
                  return (
                    <div
                      key={a.id}
                      className={`el-chip ${colorCls}${a.id === activeId ? ' sel' : ''}`}
                      onClick={() => setActiveId(a.id === activeId ? null : a.id)}
                    >
                      <span className="el-chip-dot" />
                      {a.label}
                    </div>
                  )
                })
              }
            </div>
          </div>
        </div>

        <div className="right">
          {activeAnn
            ? <AnnotationForm
                ann={activeAnn}
                onChange={handleChange}
                onDelete={() => setDelTarget(activeId)}
                onSave={handleSave}
                dirty={dirty}
              />
            : <QueuePanel />
          }
        </div>
      </div>

      <footer>2022 Autoscriber B.V.</footer>

      {toast && <SaveToast leaving={toast === 'leaving'} />}

      {deleteTarget !== null && (
        <DeleteModal onCancel={() => setDelTarget(null)} onConfirm={confirmDelete} />
      )}
    </div>
  )
}
