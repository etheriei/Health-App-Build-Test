import { useState, useRef, useEffect } from 'react'

const WORDS = [
  'Hoi','dokter.','Ik','heb','last','van','hoofdpijn.','Oh','kan','je',
  'hem','beschrijven?','Ja','het','is','een','hele','stekende','hoofdpijn.',
  'Vooral','aan','de','linker','kant','Wanneer','is','hij','begonnen?',
  'Vorige','week','begon','het.','Ik','heb','ook','paracetamol','geprobeerd,',
  '500mg,','dat','werkt','well','aardig.'
]

const CODES = [
  { label: 'Hoofdpijn', code: '25064002' },
  { label: 'Kortadenig', code: '3' },
  { label: 'Vermoeid', code: '6' },
  { label: 'Hartkloppingen', code: '7' },
  { label: 'Orthopnoe', code: '62744007' },
  { label: 'Dyspnoe', code: '267036007' },
  { label: 'Oedeem', code: '267038008' },
  { label: 'Problemen met eetlust', code: '289163007' },
  { label: 'Paracetamol', code: '387517004' },
  { label: 'Migraine', code: '37796009' },
]

const EL_TYPES   = ['problem','medication','condition','diagnostics','provider','social']
const FMT_CODES  = ['snomed_ct','g_standard']
const ASSERTIONS = ['experienced','not_experienced','theoretical','others_experienced']
const TENSES     = ['past','present']
const ONSETS     = ['days','weeks','months','years']
const PROV_TYPES = ['other','current_encounter']
const PROV_STATS = ['established','not_established','unknown']

const TYPE_COLOR = {
  problem:'#1d6db8', medication:'#16a34a', condition:'#7c3aed',
  diagnostics:'#c2410c', provider:'#0891b2', social:'#be185d',
}

function newAnn(label, indices) {
  return {
    id: Date.now() + Math.random(), label, indices,
    elementType: 'problem', formatCode: 'snomed_ct', code: null,
    assertionStatus: 'experienced', tense: 'present',
    onset: null, onsetValue: '', providerType: null,
    providerStatus: null, providerTense: null, saved: false,
  }
}

const SEED = newAnn('hoofdpijn', [6])
Object.assign(SEED, { id: 1, code: { label:'Hoofdpijn', code:'25064002' }, onset:'weeks', onsetValue:'1', saved: true })

// ── Sub-components ────────────────────────────────────────────────────────────

function Logo() {
  const bars = [[28,'#4db8d4'],[16,'#29a0c0'],[38,'#1480b0'],[22,'#1270a0'],[12,'#105c8c']]
  return (
    <svg width="30" height="38" viewBox="0 0 30 38" fill="none">
      {bars.map(([h,fill],i) => <rect key={i} x={i*7} y={(38-h)/2} width="5" height={h} rx="2.5" fill={fill}/>)}
    </svg>
  )
}

function ToggleGroup({ options, value, onChange, required }) {
  return (
    <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
      {options.map(opt => (
        <button key={opt}
          onClick={() => { if (required && value === opt) return; onChange(value === opt ? null : opt) }}
          style={{
            padding: '4px 10px', borderRadius: 6,
            border: value === opt ? 'none' : '1px solid #d5d9e2',
            background: value === opt ? '#1c2333' : '#fff',
            color: value === opt ? '#fff' : '#475467',
            fontFamily:'inherit', fontSize: 12, fontWeight: value === opt ? 500 : 400,
            cursor: 'pointer', lineHeight: 1.5,
          }}
        >{opt}</button>
      ))}
    </div>
  )
}

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
  const filtered = CODES.filter(c => c.label.toLowerCase().includes(term) || c.code.includes(q))

  return (
    <div ref={ref} style={{ position:'relative' }}>
      <div style={{ position:'relative' }}>
        <input value={q} placeholder="Search code..."
          onChange={e => { setQ(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          style={{
            width:'100%', padding:'7px 26px 7px 10px',
            border:'1px solid #d5d9e2', borderRadius:6,
            fontFamily:'inherit', fontSize:13, color:'#1c2333', outline:'none',
          }}
        />
        <span style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', color:'#9aa5b4', fontSize:11, pointerEvents:'none' }}>▾</span>
      </div>
      {open && (
        <div style={{
          position:'absolute', top:'calc(100% + 4px)', left:0, right:0,
          background:'#fff', borderRadius:7, border:'1px solid #e5e8ed',
          boxShadow:'0 6px 20px rgba(0,0,0,0.1)', zIndex:50, overflow:'hidden',
        }}>
          {filtered.length === 0
            ? <div style={{ padding:'8px 12px', fontSize:13, color:'#b0b8c4' }}>No results</div>
            : filtered.map(c => (
              <div key={c.code}
                onMouseDown={() => { onChange(c); setQ(`${c.label}   ${c.code}`); setOpen(false) }}
                style={{
                  display:'flex', justifyContent:'space-between', alignItems:'center',
                  padding:'8px 12px', fontSize:13, color:'#344054', cursor:'pointer',
                  background: value?.code === c.code ? '#eff6ff' : '#fff',
                }}
                onMouseEnter={e => e.currentTarget.style.background='#f5faff'}
                onMouseLeave={e => e.currentTarget.style.background = value?.code === c.code ? '#eff6ff' : '#fff'}
              >
                <span>{c.label}</span>
                <span style={{ color:'#b0b8c4', fontSize:11.5 }}>{c.code}</span>
              </div>
            ))
          }
        </div>
      )}
    </div>
  )
}

function QueuePanel() {
  const btns = [
    { label:'Mark as done', primary:true,
      icon:<path d="M2 7.5L5.5 11L12 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/> },
    { label:'Continue later',
      icon:<><circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.4"/><path d="M8 5v3L10 9.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></> },
    { label:'Skip - problem',
      icon:<><path d="M8 2L14 13H2L8 2Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/><path d="M8 6.5V9.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><circle cx="8" cy="11" r="0.7" fill="currentColor"/></> },
    { label:'Skip - personal data',
      icon:<><circle cx="5.5" cy="4" r="2" stroke="currentColor" strokeWidth="1.3"/><circle cx="10.5" cy="4" r="2" stroke="currentColor" strokeWidth="1.3"/><path d="M1 12.5c0-2.2 2-3 4.5-3s4.5.8 4.5 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><path d="M12 8.5c1.3 0 2.2.8 2.2 2.2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></> },
  ]
  return (
    <div style={{ background:'#fff', borderRadius:10, border:'1px solid #e5e8ed', padding:14, display:'flex', flexDirection:'column', gap:7 }}>
      {btns.map(b => (
        <button key={b.label} style={{
          display:'flex', alignItems:'center', gap:9, width:'100%',
          padding:'10px 14px', borderRadius:7,
          border: b.primary ? 'none' : '1px solid #e4e7ec',
          background: b.primary ? '#0f1623' : '#fff',
          color: b.primary ? '#fff' : '#344054',
          fontFamily:'inherit', fontSize:13.5, fontWeight:500,
          cursor:'pointer', textAlign:'left',
        }}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">{b.icon}</svg>
          {b.label}
        </button>
      ))}
    </div>
  )
}

function AnnForm({ ann, onChange, onDelete, onSave, dirty }) {
  const [flash, setFlash] = useState(null)
  const timer = useRef(null)
  const isProvider = ann.elementType === 'provider'

  const upd = (patch, sec) => {
    onChange({ ...ann, ...patch, saved: false })
    if (sec) { clearTimeout(timer.current); setFlash(sec); timer.current = setTimeout(() => setFlash(null), 1100) }
  }
  useEffect(() => () => clearTimeout(timer.current), [])

  const sec = (name, extra = '') => ({
    padding: '12px 15px', borderBottom: '1px solid #f0f2f5',
    display:'flex', flexDirection:'column', gap:8,
    background: flash === name ? '#dcfce7' : 'transparent',
    transition: flash === name ? 'none' : 'background 0.8s',
    ...( extra === 'last' && { borderBottom:'none' }),
  })

  return (
    <div style={{ background:'#fff', borderRadius:10, border:'1px solid #e5e8ed', overflow:'hidden' }}>
      <div style={sec('type')}>
        <div style={{ fontSize:11, color:'#98a2b3', fontWeight:500 }}>element_type</div>
        <ToggleGroup required options={EL_TYPES} value={ann.elementType} onChange={v => upd({ elementType: v ?? 'problem' }, 'type')} />
      </div>
      <div style={{ ...sec('code'), background:'#1a91a8' }}>
        <div style={{ fontSize:11, color:'rgba(255,255,255,0.7)', fontWeight:500 }}>format_code</div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
          {FMT_CODES.map(opt => (
            <button key={opt} onClick={() => upd({ formatCode: opt })}
              style={{
                padding:'4px 10px', borderRadius:6,
                border: ann.formatCode === opt ? 'none' : '1px solid rgba(255,255,255,0.35)',
                background: ann.formatCode === opt ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.12)',
                color: ann.formatCode === opt ? '#1a91a8' : 'rgba(255,255,255,0.9)',
                fontFamily:'inherit', fontSize:12, fontWeight: ann.formatCode === opt ? 600 : 400, cursor:'pointer',
              }}
            >{opt}</button>
          ))}
        </div>
        <div style={{ fontSize:11, color:'rgba(255,255,255,0.7)', fontWeight:500 }}>code</div>
        <div style={{ position:'relative' }}>
          <CodeSearch value={ann.code} onChange={v => upd({ code: v })} />
        </div>
      </div>

      {!isProvider && <>
        <div style={sec('assertion')}>
          <div style={{ fontSize:11, color:'#98a2b3', fontWeight:500 }}>assertation_status</div>
          <ToggleGroup options={ASSERTIONS} value={ann.assertionStatus} onChange={v => upd({ assertionStatus: v }, 'assertion')} />
        </div>
        <div style={sec('tense')}>
          <div style={{ fontSize:11, color:'#98a2b3', fontWeight:500 }}>tense</div>
          <ToggleGroup options={TENSES} value={ann.tense} onChange={v => upd({ tense: v }, 'tense')} />
        </div>
        <div style={sec('onset','last')}>
          <div style={{ fontSize:11, color:'#98a2b3', fontWeight:500 }}>onset</div>
          <ToggleGroup options={ONSETS} value={ann.onset} onChange={v => upd({ onset: v }, 'onset')} />
          <input type="number" min="0" placeholder="Number..." value={ann.onsetValue ?? ''}
            onChange={e => upd({ onsetValue: e.target.value }, 'onset')}
            style={{ padding:'7px 10px', borderRadius:6, border:'1px solid #d5d9e2', fontFamily:'inherit', fontSize:13, outline:'none' }}
          />
        </div>
      </>}

      {isProvider && <>
        <div style={sec('ptype')}>
          <div style={{ fontSize:11, color:'#98a2b3', fontWeight:500 }}>provider_type</div>
          <ToggleGroup options={PROV_TYPES} value={ann.providerType} onChange={v => upd({ providerType: v }, 'ptype')} />
        </div>
        <div style={sec('pstatus')}>
          <div style={{ fontSize:11, color:'#98a2b3', fontWeight:500 }}>provider_status</div>
          <ToggleGroup options={PROV_STATS} value={ann.providerStatus} onChange={v => upd({ providerStatus: v }, 'pstatus')} />
        </div>
        <div style={sec('ptense','last')}>
          <div style={{ fontSize:11, color:'#98a2b3', fontWeight:500 }}>provider_tense</div>
          <ToggleGroup options={TENSES} value={ann.providerTense} onChange={v => upd({ providerTense: v }, 'ptense')} />
        </div>
      </>}

      <div style={{ display:'flex', gap:8, padding:'12px 15px', borderTop:'1px solid #f0f2f5' }}>
        <button onClick={onSave} style={{
          display:'flex', alignItems:'center', gap:6, padding:'8px 16px',
          borderRadius:7, background:'#0f1623', color:'#fff', border:'none',
          fontFamily:'inherit', fontSize:13, fontWeight:500, cursor:'pointer',
          position:'relative',
        }}>
          {dirty && <span style={{ position:'absolute', top:5, right:5, width:7, height:7, background:'#f59e0b', borderRadius:'50%', border:'1.5px solid #0f1623' }}/>}
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1.5 6L4.5 9L10.5 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Save
        </button>
        <button onClick={onDelete} style={{
          display:'flex', alignItems:'center', gap:6, padding:'8px 16px',
          borderRadius:7, background:'#fff', color:'#475467',
          border:'1px solid #d5d9e2', fontFamily:'inherit', fontSize:13, fontWeight:500, cursor:'pointer',
        }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 2L10 10M10 2L2 10" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>
          Delete
        </button>
      </div>
    </div>
  )
}

function DeleteModal({ onCancel, onConfirm }) {
  return (
    <div onClick={onCancel} style={{ position:'fixed', inset:0, background:'rgba(242,244,247,0.7)', backdropFilter:'blur(5px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100 }}>
      <div onClick={e => e.stopPropagation()} style={{ background:'#fff', borderRadius:12, border:'1px solid #e5e8ed', boxShadow:'0 20px 60px rgba(0,0,0,0.14)', padding:'28px 32px 24px', width:368, display:'flex', flexDirection:'column', alignItems:'center', gap:6, textAlign:'center' }}>
        <div style={{ width:46, height:46, borderRadius:'50%', background:'#fffaeb', border:'1px solid #fde68a', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:4 }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 3L18 17H2L10 3Z" stroke="#d97706" strokeWidth="1.6" strokeLinejoin="round"/><path d="M10 8V12" stroke="#d97706" strokeWidth="1.6" strokeLinecap="round"/><circle cx="10" cy="14.5" r="0.9" fill="#d97706"/></svg>
        </div>
        <div style={{ fontSize:17, fontWeight:700, color:'#0f1623', marginTop:2 }}>Delete Annotation</div>
        <div style={{ fontSize:13, color:'#98a2b3', marginBottom:4 }}>This action cannot be undone</div>
        <div style={{ display:'flex', gap:9, width:'100%', marginTop:8 }}>
          <button onClick={onCancel} style={{ flex:1, padding:'9px 0', borderRadius:7, border:'1px solid #d5d9e2', background:'#fff', fontFamily:'inherit', fontSize:13.5, fontWeight:500, color:'#344054', cursor:'pointer' }}>Cancel</button>
          <button onClick={onConfirm} style={{ flex:1, padding:'9px 0', borderRadius:7, border:'none', background:'#1d6db8', color:'#fff', fontFamily:'inherit', fontSize:13.5, fontWeight:600, cursor:'pointer' }}>Confirm</button>
        </div>
      </div>
    </div>
  )
}

function SaveToast({ leaving }) {
  return (
    <div style={{
      position:'fixed', top:76, right:32,
      background:'#0f1623', color:'#fff', borderRadius:8,
      padding:'11px 16px', fontSize:13.5, fontWeight:500,
      display:'flex', alignItems:'center', gap:8,
      boxShadow:'0 8px 24px rgba(0,0,0,0.18)', zIndex:200,
      opacity: leaving ? 0 : 1, transition: leaving ? 'opacity 0.2s' : 'none',
      animation: leaving ? 'none' : 'toastIn 0.2s ease-out',
    }}>
      <div style={{ width:18, height:18, background:'#16a34a', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1.5 5L4 7.5L8.5 2.5" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </div>
      Annotation saved
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function AnnotatePage() {
  const [anns, setAnns]             = useState([SEED])
  const [activeId, setActiveId]     = useState(null)
  const [deleteTarget, setDelTarget]= useState(null)
  const [toast, setToast]           = useState(null)
  const [dragStart, setDragStart]   = useState(null)
  const [dragCur, setDragCur]       = useState(null)
  const [dragging, setDragging]     = useState(false)
  const toastTimer = useRef(null)

  const activeAnn = anns.find(a => a.id === activeId) ?? null
  const byIndex = new Map()
  anns.forEach(a => a.indices.forEach(i => byIndex.set(i, a.id)))

  const dragRange = dragging && dragStart !== null && dragCur !== null
    ? [Math.min(dragStart, dragCur), Math.max(dragStart, dragCur)] : null

  useEffect(() => {
    const h = e => {
      if (e.key === 'Escape') setActiveId(null)
      if ((e.key === 'Delete' || e.key === 'Backspace') && activeId && !e.target.matches('input'))
        setDelTarget(activeId)
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [activeId])

  useEffect(() => {
    const up = () => {
      if (!dragging) return
      if (dragStart !== null && dragCur !== null && dragStart !== dragCur) {
        const from = Math.min(dragStart, dragCur), to = Math.max(dragStart, dragCur)
        const indices = []
        for (let i = from; i <= to; i++) { if (!byIndex.has(i)) indices.push(i) }
        if (indices.length > 0) {
          const label = indices.map(i => WORDS[i].replace(/[.,?!]/g,'')).join(' ')
          const ann = newAnn(label, indices)
          setAnns(prev => [...prev, ann])
          setActiveId(ann.id)
        }
      }
      setDragging(false); setDragStart(null); setDragCur(null)
    }
    window.addEventListener('mouseup', up)
    return () => window.removeEventListener('mouseup', up)
  }, [dragging, dragStart, dragCur])

  const showToast = () => {
    clearTimeout(toastTimer.current)
    setToast('show')
    toastTimer.current = setTimeout(() => { setToast('leaving'); setTimeout(() => setToast(null), 200) }, 2200)
  }

  const handleWordClick = (word, idx) => {
    if (dragging) return
    const existingId = byIndex.get(idx)
    if (existingId !== undefined) { setActiveId(existingId === activeId ? null : existingId); return }
    const ann = newAnn(word.replace(/[.,?!]/g,''), [idx])
    setAnns(prev => [...prev, ann])
    setActiveId(ann.id)
  }

  const confirmDelete = () => {
    setAnns(prev => prev.filter(a => a.id !== deleteTarget))
    if (activeId === deleteTarget) setActiveId(null)
    setDelTarget(null)
  }

  return (
    <div style={{ fontFamily:"'Inter',system-ui,sans-serif", background:'#f4f5f7', minHeight:'100vh', display:'flex', flexDirection:'column', WebkitFontSmoothing:'antialiased' }}>
      {/* Navbar */}
      <nav style={{ height:62, background:'#fff', borderBottom:'1px solid #e5e8ed', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 32px', position:'sticky', top:0, zIndex:40 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:17, fontWeight:600, color:'#0f1623', letterSpacing:-0.2 }}>
          <Logo />autoscriber
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:9, fontSize:13.5, color:'#667085' }}>
          thomas@autoscriber.com
          <div style={{ width:33, height:33, borderRadius:'50%', background:'#eff6ff', border:'1px solid #dbeafe', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:600, color:'#1d6db8' }}>T</div>
        </div>
      </nav>

      <div style={{ display:'flex', gap:20, padding:'28px 32px', flex:1, maxWidth:1160, margin:'0 auto', width:'100%', alignItems:'flex-start' }}>
        <div style={{ flex:1, minWidth:0, display:'flex', flexDirection:'column', gap:14 }}>
          {/* Transcript */}
          <div style={{ background:'#fff', borderRadius:10, border:'1px solid #e5e8ed' }}>
            <div style={{ fontSize:10.5, fontWeight:700, letterSpacing:'0.11em', textTransform:'uppercase', color:'#98a2b3', padding:'15px 20px 10px' }}>Transcript</div>
            <div style={{ padding:'0 20px 20px', fontSize:14, lineHeight:1.9, color:'#344054', userSelect:'none' }}>
              {WORDS.map((word, idx) => {
                const annId = byIndex.get(idx)
                const inDrag = dragRange && idx >= dragRange[0] && idx <= dragRange[1]
                if (annId !== undefined) {
                  const ann = anns.find(a => a.id === annId)
                  if (ann && ann.indices[0] !== idx) return null
                  const color = TYPE_COLOR[ann?.elementType] ?? '#475467'
                  const isActive = annId === activeId
                  return (
                    <span key={idx}>
                      <span
                        onClick={() => handleWordClick(word, idx)}
                        style={{
                          display:'inline-block', position:'relative',
                          background: color, color:'#fff', borderRadius:4,
                          padding:'1px 18px 1px 5px', cursor:'pointer',
                          outline: isActive ? '2.5px solid #93c5fd' : 'none',
                          outlineOffset: isActive ? 1 : 0,
                        }}
                      >
                        {ann?.label ?? word}
                        <span
                          onClick={e => { e.stopPropagation(); setDelTarget(annId) }}
                          style={{ position:'absolute', right:4, top:'50%', transform:'translateY(-50%)', fontSize:11, opacity:0, transition:'opacity 0.12s', cursor:'pointer', color:'rgba(255,255,255,0.8)' }}
                          onMouseEnter={e => e.target.style.opacity=1}
                          onMouseLeave={e => e.target.style.opacity=0}
                        >×</span>
                      </span>{' '}
                    </span>
                  )
                }
                return (
                  <span key={idx}>
                    <span
                      style={{ cursor:'pointer', borderRadius:3, padding:'1px 2px', background: inDrag ? '#dbeafe' : 'transparent', display:'inline' }}
                      onMouseDown={() => { setDragStart(idx); setDragCur(idx); setDragging(true) }}
                      onMouseEnter={() => { if (dragging) setDragCur(idx) }}
                      onClick={() => handleWordClick(word, idx)}
                    >{word}</span>{' '}
                  </span>
                )
              })}
            </div>
          </div>

          {/* Annotated elements */}
          <div style={{ background:'#fff', borderRadius:10, border:'1px solid #e5e8ed' }}>
            <div style={{ fontSize:10.5, fontWeight:700, letterSpacing:'0.11em', textTransform:'uppercase', color:'#98a2b3', padding:'15px 20px 10px' }}>Annotated Elements</div>
            <div style={{ padding:'0 20px 16px', display:'flex', flexWrap:'wrap', gap:6, minHeight:20 }}>
              {anns.length === 0
                ? <span style={{ fontSize:12.5, color:'#c8d0dc' }}>No annotations yet — click a word above</span>
                : anns.map(a => (
                  <div key={a.id} onClick={() => setActiveId(a.id === activeId ? null : a.id)}
                    style={{ display:'inline-flex', alignItems:'center', gap:5, borderRadius:5, padding:'3px 10px', fontSize:12.5, fontWeight:500, cursor:'pointer', userSelect:'none', background: TYPE_COLOR[a.elementType] ?? '#475467', color:'#fff', filter: a.id === activeId ? 'brightness(0.82)' : 'none' }}>
                    <span style={{ width:6, height:6, borderRadius:'50%', background:'rgba(255,255,255,0.55)' }}/>
                    {a.label}
                  </div>
                ))
              }
            </div>
          </div>
        </div>

        <div style={{ width:335, flexShrink:0 }}>
          {activeAnn
            ? <AnnForm
                ann={activeAnn}
                onChange={u => setAnns(prev => prev.map(a => a.id === u.id ? u : a))}
                onDelete={() => setDelTarget(activeId)}
                onSave={() => {
                  setAnns(prev => prev.map(a => a.id === activeId ? { ...a, saved:true } : a))
                  showToast()
                }}
                dirty={!activeAnn.saved}
              />
            : <QueuePanel />
          }
        </div>
      </div>

      <footer style={{ padding:'14px 32px', fontSize:12, color:'#c4cdd8', borderTop:'1px solid #e5e8ed', background:'#fff' }}>
        2022 Autoscriber B.V.
      </footer>

      {toast && <SaveToast leaving={toast === 'leaving'} />}
      {deleteTarget !== null && <DeleteModal onCancel={() => setDelTarget(null)} onConfirm={confirmDelete} />}
    </div>
  )
}
