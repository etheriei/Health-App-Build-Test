import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

// Waveform bars: [height, isAnnotated, label?]
const BARS = [
  [38,false],[55,false],[42,false],[70,true,'hoofdpijn'],[48,false],[36,false],
  [62,false],[44,false],[52,false],[38,false],[46,false],[60,false],[35,false],
  [58,false],[43,false],[49,false],[72,false],[40,false],[66,false],[37,false],
  [53,false],[41,false],[78,true,'hoofdpijn'],[84,true,'hoofdpijn'],[56,false],
  [45,false],[63,false],[38,false],[50,false],[44,false],[58,false],[36,false],
  [47,false],[65,false],[42,false],
]

function ControlBtn({ children, onClick, size = 52 }) {
  const [hover, setHover] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: size, height: size,
        borderRadius: '50%',
        border: 'none',
        background: hover ? '#d8e8f0' : '#deeaf0',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', color: '#1a5a7a', transition: 'background 0.15s',
        flexShrink: 0,
      }}
    >{children}</button>
  )
}

function StarRating({ value, onChange }) {
  const [hover, setHover] = useState(null)
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1,2,3,4,5].map(n => (
        <svg
          key={n}
          width="28" height="28" viewBox="0 0 24 24"
          style={{ cursor: 'pointer' }}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(null)}
          onClick={() => onChange(n)}
        >
          <path
            d="M12 2l2.9 6.1L22 9.2l-5 5 1.2 7-6.2-3.4L5.8 21.2l1.2-7-5-5 7.1-1.1z"
            fill={n <= (hover ?? value) ? '#22b4cc' : 'none'}
            stroke="#22b4cc"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      ))}
    </div>
  )
}

export default function ReplayPage() {
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(8)  // which bar the playhead is at
  const [rating, setRating] = useState(1)
  const intervalRef = useRef(null)

  useEffect(() => {
    if (playing) {
      intervalRef.current = setInterval(() => {
        setProgress(p => {
          if (p >= BARS.length - 1) { setPlaying(false); return p }
          return p + 1
        })
      }, 280)
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [playing])

  const stop = () => { setPlaying(false); setProgress(0) }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      background: '#fff', fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      {/* Top bar */}
      <div style={{ background: '#0d1929', height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
        <span style={{ color: '#9aa5b4', fontSize: 14, fontWeight: 300 }}>powered by</span>
        <span style={{ color: '#fff', fontSize: 16, letterSpacing: 0.2 }}>
          <span style={{ fontWeight: 300 }}>auto</span><span style={{ fontWeight: 700 }}>scriber</span>
        </span>
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: '32px 48px', position: 'relative' }}>
        {/* Meta row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
          <div>
            <div style={{ fontSize: 13.5, color: '#667085', lineHeight: 1.5 }}>
              Data will be automatically<br/>deleted in <strong>7 days</strong>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 13, color: '#667085', marginBottom: 8 }}>Rate our app again?</div>
            <StarRating value={rating} onChange={setRating} />
          </div>
        </div>

        {/* Waveform */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          gap: 5,
          height: 180,
          padding: '0 24px',
          marginBottom: 40,
          position: 'relative',
        }}>
          {BARS.map(([h, isAnn, label], i) => {
            const isPast = i < progress
            const isCurrent = i === progress
            const barColor = isAnn
              ? '#0d1929'
              : (isPast ? '#22b4cc' : '#b8dce8')

            return (
              <div
                key={i}
                onClick={() => setProgress(i)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  cursor: 'pointer',
                  position: 'relative',
                }}
              >
                {/* Playhead line */}
                {isCurrent && (
                  <div style={{
                    position: 'absolute',
                    bottom: 0, top: -8,
                    left: '50%', transform: 'translateX(-50%)',
                    width: 2, background: '#0d1929',
                    zIndex: 2,
                  }}/>
                )}
                <div
                  style={{
                    width: isAnn ? 28 : 16,
                    height: h,
                    background: barColor,
                    borderRadius: 3,
                    transition: 'background 0.2s',
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                  }}
                >
                  {isAnn && label && (
                    <span style={{
                      color: '#fff',
                      fontSize: 11,
                      fontWeight: 500,
                      writingMode: 'vertical-rl',
                      textOrientation: 'mixed',
                      transform: 'rotate(180deg)',
                      letterSpacing: 0.5,
                      userSelect: 'none',
                    }}>{label}</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Bottom row: logo + controls + share */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* LUMC logo placeholder */}
          <div style={{
            width: 72, height: 72,
            border: '2px solid #1a3f6f',
            display: 'grid', gridTemplateColumns: '1fr 1fr',
            padding: 4, gap: 2,
          }}>
            {['L','U','M','C'].map(l => (
              <div key={l} style={{
                background: l === 'L' || l === 'C' ? '#1a3f6f' : '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: l === 'L' || l === 'C' ? '#fff' : '#1a3f6f',
                fontSize: 14, fontWeight: 700,
              }}>{l}</div>
            ))}
          </div>

          {/* Playback controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <ControlBtn onClick={() => setProgress(0)}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M3 4v10M15 4L7 9l8 5V4z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </ControlBtn>
            <ControlBtn onClick={stop}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <rect x="4" y="4" width="10" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.6"/>
              </svg>
            </ControlBtn>
            <ControlBtn onClick={() => setPlaying(p => !p)} size={58}>
              {playing
                ? <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="4" y="3" width="4" height="14" rx="1.5" fill="currentColor"/><rect x="12" y="3" width="4" height="14" rx="1.5" fill="currentColor"/></svg>
                : <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M5 3l13 7-13 7V3z" fill="currentColor"/></svg>
              }
            </ControlBtn>
            <ControlBtn onClick={() => setPlaying(false)}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M15 4v10M3 4l8 5-8 5V4z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </ControlBtn>
            <ControlBtn onClick={() => setProgress(p => Math.max(0, p - 5))}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M3 9a6 6 0 1 0 6-6H6M3 9V5l3 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </ControlBtn>
          </div>

          {/* Share */}
          <button style={{
            padding: '10px 22px', borderRadius: 8,
            border: '1.5px solid #22b4cc', background: '#fff',
            color: '#22b4cc', fontSize: 13.5, fontWeight: 500,
            cursor: 'pointer', fontFamily: 'inherit',
            transition: 'background 0.1s',
          }}
            onMouseEnter={e => { e.target.style.background = '#e8f8fb' }}
            onMouseLeave={e => { e.target.style.background = '#fff' }}
          >
            Share with family
          </button>
        </div>
      </div>
    </div>
  )
}
