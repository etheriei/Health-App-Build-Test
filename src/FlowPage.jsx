import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

// ── Data ──────────────────────────────────────────────────────────────────────

const CATEGORIES = ['PROBLEEM', 'MEDIKATIE', 'KONDITIE', 'DIAGNOSTIEK', 'AANBIEDER']

const INIT_ANNS = [
  {
    id: 1, word: 'Hoofdpijn', type: 'PROBLEEM',
    aanwezig: 'EXPERIENCED', tense: 'PRESENT',
    aanvangN: '1', aanvangUnit: 'WEEKS',
    locatie: 'links', eigenschap: 'STEKENDE',
  },
  {
    id: 2, word: 'Buikpijn', type: 'PROBLEEM',
    aanwezig: 'EXPERIENCED', tense: null,
    aanvangN: '', aanvangUnit: null, locatie: '', eigenschap: '',
  },
  {
    id: 3, word: 'Paracetamol', type: 'MEDIKATIE',
    aanwezig: 'EXPERIENCED', tense: null,
    aanvangN: '', aanvangUnit: null, locatie: '', eigenschap: '',
  },
]

const TRANSCRIPT = [
  {
    id: 1, speaker: 'patient',
    parts: [
      { t: 'Hoi, dokter, Ik heb ' },
      { word: 'hoofdpijn', annId: 1, type: 'PROBLEEM' },
      { t: ', Ik heb ' },
      { word: 'buikpijn', annId: 2, type: 'PROBLEEM' },
      { t: '.' },
    ],
  },
  { id: 2, speaker: 'doctor', parts: [{ t: 'Gebruikt u medicijnen?' }] },
  {
    id: 3, speaker: 'patient',
    parts: [
      { t: 'Ik gebruik ' },
      { word: 'paracetamol', annId: 3, type: 'MEDIKATIE' },
      { t: '.' },
    ],
  },
]

// ── Sub-components ────────────────────────────────────────────────────────────

function PatientAvatar({ type }) {
  const bg = type === 'patient' ? '#1a3f6f' : '#22b4cc'
  return (
    <svg width="30" height="30" viewBox="0 0 30 30">
      <circle cx="15" cy="15" r="15" fill={bg}/>
      <circle cx="15" cy="11" r="4.5" fill="rgba(255,255,255,0.9)"/>
      <path d="M6 26c0-5 4-8 9-8s9 3 9 8" fill="rgba(255,255,255,0.9)"/>
      {type === 'doctor' && (
        <path d="M15 19v4M13 21h4" stroke={bg} strokeWidth="1.5" strokeLinecap="round"/>
      )}
    </svg>
  )
}

function WordChip({ word, type }) {
  const colors = {
    PROBLEEM:    { bg: '#1a9eb8', color: '#fff' },
    MEDIKATIE:   { bg: '#c8eef5', color: '#0d7a90' },
    KONDITIE:    { bg: '#d4f0e8', color: '#0a7a55' },
    DIAGNOSTIEK: { bg: '#fde8cc', color: '#954d00' },
    AANBIEDER:   { bg: '#e0d4f7', color: '#5a2ea6' },
  }
  const s = colors[type] ?? { bg: '#e0e3e8', color: '#475467' }
  return (
    <span style={{
      display: 'inline-block',
      background: s.bg, color: s.color,
      borderRadius: 4, padding: '1px 6px',
      fontSize: 'inherit', lineHeight: 'inherit',
      fontWeight: 500,
    }}>{word}</span>
  )
}

function AnnCard({ ann, onChange }) {
  const UNITS = ['DAYS', 'WEEKS', 'MONTHS', 'YEARS']
  const tb = (val, cur, key) => (
    <button
      style={{
        padding: '2px 8px', borderRadius: 4,
        border: cur === val ? 'none' : '1px solid #d0d5dd',
        background: cur === val ? '#22b4cc' : '#fff',
        color: cur === val ? '#fff' : '#475467',
        fontSize: 11, fontWeight: cur === val ? 600 : 400,
        cursor: 'pointer', fontFamily: 'inherit',
      }}
      onClick={() => onChange({ ...ann, [key]: cur === val ? null : val })}
    >{val}</button>
  )

  return (
    <div style={{
      background: '#fff', border: '1px solid #e5e8ed',
      borderRadius: 8, marginBottom: 8, overflow: 'hidden',
    }}>
      <div style={{ padding: '9px 14px', fontSize: 14, fontWeight: 600, color: '#22b4cc' }}>
        {ann.word}
      </div>
      {/* Aanwezig (assertation) */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '6px 14px', gap: 8, borderTop: '1px solid #f2f4f7' }}>
        <span style={{ fontSize: 12, color: '#9aa5b4', width: 76, flexShrink: 0 }}>Aanwezig</span>
        <div style={{ display: 'flex', gap: 5 }}>
          {tb('EXPERIENCED', ann.aanwezig, 'aanwezig')}
          {tb('NOT EXPERIENCED', ann.aanwezig, 'aanwezig')}
        </div>
      </div>
      {/* Tense */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '6px 14px', gap: 8, borderTop: '1px solid #f2f4f7' }}>
        <span style={{ fontSize: 12, color: '#9aa5b4', width: 76, flexShrink: 0 }}>Aanwezig</span>
        <div style={{ display: 'flex', gap: 5 }}>
          {tb('PRESENT', ann.tense, 'tense')}
          {tb('PAST', ann.tense, 'tense')}
        </div>
      </div>
      {/* Aanvang (onset) */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '6px 14px', gap: 6, borderTop: '1px solid #f2f4f7' }}>
        <span style={{ fontSize: 12, color: '#9aa5b4', width: 76, flexShrink: 0 }}>Aanvang</span>
        <input
          type="number" min="0"
          value={ann.aanvangN}
          onChange={e => onChange({ ...ann, aanvangN: e.target.value })}
          style={{
            width: 38, padding: '2px 6px', border: '1px solid #d0d5dd',
            borderRadius: 4, fontSize: 12, textAlign: 'center',
            fontFamily: 'inherit', outline: 'none',
          }}
        />
        <div style={{ display: 'flex', gap: 4 }}>
          {UNITS.map(u => tb(u, ann.aanvangUnit, 'aanvangUnit'))}
        </div>
      </div>
      {/* Locatie */}
      {(ann.locatie !== undefined) && (
        <div style={{ display: 'flex', alignItems: 'center', padding: '6px 14px', gap: 8, borderTop: '1px solid #f2f4f7' }}>
          <span style={{ fontSize: 12, color: '#9aa5b4', width: 76, flexShrink: 0 }}>Locatie</span>
          <input
            value={ann.locatie}
            onChange={e => onChange({ ...ann, locatie: e.target.value })}
            placeholder="—"
            style={{
              border: 'none', outline: 'none', fontSize: 13, color: '#344054',
              fontFamily: 'inherit', background: 'transparent', width: '100%',
            }}
          />
        </div>
      )}
      {/* Eigenschap */}
      {(ann.eigenschap !== undefined) && ann.eigenschap && (
        <div style={{ display: 'flex', alignItems: 'center', padding: '6px 14px', gap: 8, borderTop: '1px solid #f2f4f7' }}>
          <span style={{ fontSize: 12, color: '#9aa5b4', width: 76, flexShrink: 0 }}>Eigenschap</span>
          <span style={{
            background: '#f0f2f5', borderRadius: 4,
            padding: '2px 8px', fontSize: 11, fontWeight: 600, color: '#475467',
          }}>{ann.eigenschap}</span>
        </div>
      )}
    </div>
  )
}

function BodyFigure() {
  return (
    <svg width="72" height="160" viewBox="0 0 72 160" fill="none" style={{ opacity: 0.45 }}>
      <ellipse cx="36" cy="18" rx="12" ry="14" fill="#b8e0ec" stroke="#8ecce0" strokeWidth="1.5"/>
      <rect x="31" y="30" width="10" height="7" rx="3" fill="#b8e0ec" stroke="#8ecce0" strokeWidth="1.2"/>
      <path d="M18 37 Q14 52 15 78 Q16 90 36 92 Q56 90 57 78 Q58 52 54 37 Q46 35 36 34 Q26 35 18 37Z" fill="#b8e0ec" stroke="#8ecce0" strokeWidth="1.5"/>
      <path d="M18 40 Q9 55 7 74 Q6 82 10 84" stroke="#b8e0ec" strokeWidth="9" strokeLinecap="round"/>
      <path d="M54 40 Q63 55 65 74 Q66 82 62 84" stroke="#b8e0ec" strokeWidth="9" strokeLinecap="round"/>
      <path d="M28 92 Q24 118 23 148" stroke="#b8e0ec" strokeWidth="10" strokeLinecap="round"/>
      <path d="M44 92 Q48 118 49 148" stroke="#b8e0ec" strokeWidth="10" strokeLinecap="round"/>
    </svg>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function FlowPage() {
  const navigate = useNavigate()
  const [anns, setAnns] = useState(INIT_ANNS)
  const [expanded, setExpanded] = useState({ PROBLEEM: true })
  const [notes, setNotes] = useState('')
  const [search, setSearch] = useState('')
  const [recording, setRecording] = useState(false)

  const byType = (type) => anns.filter(a => a.type === type)
  const toggleCat = (cat) => setExpanded(e => ({ ...e, [cat]: !e[cat] }))
  const updateAnn = (updated) => setAnns(prev => prev.map(a => a.id === updated.id ? updated : a))

  const iconBtn = (children, onClick, active) => (
    <button onClick={onClick} style={{
      width: 38, height: 38, borderRadius: 8,
      border: '1px solid #e0e3e8', background: active ? '#f0f8ff' : '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      cursor: 'pointer', color: active ? '#22b4cc' : '#667085',
    }}>{children}</button>
  )

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#fff', fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* Top bar */}
      <div style={{ background: '#0d1929', height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <span style={{ color: '#fff', fontSize: 17, letterSpacing: 0.3 }}>
          <span style={{ fontWeight: 300 }}>auto</span><span style={{ fontWeight: 700 }}>scriber</span>
          <span style={{ fontWeight: 300, marginLeft: 6 }}>FLOW</span>
        </span>
        <span style={{ background: 'rgba(34,180,204,0.25)', color: '#22b4cc', borderRadius: 10, fontSize: 10, fontWeight: 600, padding: '2px 7px', letterSpacing: 0.3 }}>beta</span>
      </div>

      {/* Nav */}
      <div style={{ background: '#fff', borderBottom: '1px solid #eaecf0', height: 54, display: 'flex', alignItems: 'center', padding: '0 24px', gap: 6 }}>
        {/* Logo circle */}
        <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg, #22b4cc 0%, #1a8ab0 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 6 }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            {[[3,14],[6,10],[9,18],[12,8],[15,16]].map(([x,h],i) => (
              <rect key={i} x={x} y={20-h} width="2.5" height={h} rx="1.25" fill="white"/>
            ))}
          </svg>
        </div>
        <button style={{ background: 'none', border: 'none', fontFamily: 'inherit', fontSize: 14, fontWeight: 700, color: '#0d1929', cursor: 'pointer', padding: '4px 8px', borderBottom: '2px solid #0d1929', marginRight: 4 }}>Actieve scribe</button>
        <button style={{ background: 'none', border: 'none', fontFamily: 'inherit', fontSize: 14, color: '#667085', cursor: 'pointer', padding: '4px 8px' }}>Archief</button>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}>
          {[
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="3" width="12" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><path d="M5 14h6M8 12v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>,
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 5h10M5 8h6M7 11h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/><path d="M8 7v1.5L9.5 10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><circle cx="8" cy="5.5" r="0.7" fill="currentColor"/></svg>,
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
          ].map((icon, i) => (
            <button key={i} style={{ width: 32, height: 32, borderRadius: 7, border: '1px solid #e5e8ed', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#667085' }}>{icon}</button>
          ))}
        </div>
      </div>

      {/* Patient row */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '14px 24px', borderBottom: '1px solid #eaecf0' }}>
        <span style={{ fontSize: 20 }}>🇳🇱</span>
        <span style={{ fontSize: 22, fontWeight: 700, color: '#0d1929', margin: '0 12px 0 8px' }}>Koen</span>
        <span style={{ fontSize: 13, color: '#9aa5b4' }}>Geen_template</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          {[
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M10 2.5a2.5 2.5 0 110 5 2.5 2.5 0 010-5zM4.5 6a2 2 0 110 4 2 2 0 010-4zM10 9.5c2.2 0 4 1.3 4 3H6c0-1.7 1.8-3 4-3z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>,
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M7.5 2a5.5 5.5 0 100 11 5.5 5.5 0 000-11z" stroke="currentColor" strokeWidth="1.4"/><path d="M7.5 5v2.5l1.5 1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>,
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M13 7.5A5.5 5.5 0 112 7.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><path d="M10.5 5l2.5 2.5-2.5 2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>,
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M2 2l11 11M13 2L2 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
          ].map((icon, i) => iconBtn(icon, i === 1 ? () => setRecording(r => !r) : undefined, i === 1 && recording))}
        </div>
      </div>

      {/* Content */}
      <div style={{ display: 'flex', flex: 1, padding: '20px 24px', gap: 24 }}>

        {/* Left: transcript */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Search */}
          <div style={{ position: 'relative', marginBottom: 18 }}>
            <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9aa5b4' }} width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.4"/>
              <path d="M9.5 9.5L12 12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="zoek symptomen.."
              style={{
                width: '100%', padding: '9px 14px 9px 34px',
                border: '1px solid #e0e3e8', borderRadius: 8,
                fontSize: 14, color: '#344054', fontFamily: 'inherit', outline: 'none',
              }}
            />
          </div>

          {/* Timestamp */}
          <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.1em', color: '#9aa5b4', textTransform: 'uppercase', marginBottom: 12 }}>
            Opname gestart 10:48
          </div>

          {/* Messages */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {TRANSCRIPT.map(msg => (
              <div key={msg.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <PatientAvatar type={msg.speaker} />
                <div style={{
                  padding: '9px 14px',
                  background: msg.speaker === 'doctor' ? '#e8f8fb' : '#fff',
                  border: msg.speaker === 'patient' ? '1px solid #f0f2f5' : 'none',
                  borderRadius: 10, fontSize: 14, lineHeight: 1.6, color: '#344054',
                  maxWidth: 480,
                }}>
                  {msg.parts.map((p, i) =>
                    p.word
                      ? <WordChip key={i} word={p.word} type={p.type} />
                      : <span key={i}>{p.t}</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.1em', color: '#9aa5b4', textTransform: 'uppercase', marginTop: 18 }}>
            Opname gepauzeerd 10:48
          </div>
        </div>

        {/* Right: symptom panel */}
        <div style={{ width: 340, flexShrink: 0 }}>
          {/* Free text notes */}
          <input
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Vrije tekst notities"
            style={{
              width: '100%', padding: '10px 14px',
              border: '1px solid #e0e3e8', borderRadius: 8,
              fontSize: 13.5, color: '#344054', fontFamily: 'inherit', outline: 'none',
              marginBottom: 6,
            }}
          />

          {/* Category list */}
          {CATEGORIES.map(cat => {
            const items = byType(cat)
            const isOpen = expanded[cat]
            return (
              <div key={cat}>
                <div
                  onClick={() => toggleCat(cat)}
                  style={{
                    display: 'flex', alignItems: 'center',
                    padding: '10px 2px', borderTop: '1px solid #f2f4f7',
                    cursor: 'pointer', userSelect: 'none',
                  }}
                >
                  <span style={{ fontSize: 14, color: '#22b4cc', fontWeight: 300, marginRight: 10, width: 16, textAlign: 'center' }}>
                    {isOpen ? '−' : '+'}
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: '#667085', flex: 1 }}>{cat}</span>
                  <span style={{ fontSize: 13, fontWeight: 500, color: items.length ? '#0d1929' : '#c4cdd8' }}>{items.length}</span>
                </div>
                {isOpen && items.map(ann => (
                  <AnnCard key={ann.id} ann={ann} onChange={updateAnn} />
                ))}
              </div>
            )
          })}

          {/* Body diagram */}
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24, marginBottom: 8 }}>
            <BodyFigure />
          </div>
        </div>
      </div>
    </div>
  )
}
