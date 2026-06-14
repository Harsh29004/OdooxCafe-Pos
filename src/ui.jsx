// ---------------------------------------------------------------------------
// ui.jsx — shared styling + small reusable components.
//
// There is NO separate CSS file. All styling lives in inline `style={{...}}`
// objects. The `t` object below holds every colour we use (resolved from the
// old Tailwind palette) so we don't repeat hex codes everywhere.
//
// Things inline styles can't do on their own — hover, focus, keyboard escape —
// are handled with a little React state inside the small components here
// (Button, IconButton, Input, ...). Pages import these instead of repeating it.
// ---------------------------------------------------------------------------
import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

// ---- Colour palette (the whole app's design tokens) ----
export const t = {
  // Brand — Odoo purple
  brand50: '#f6f1f5', brand100: '#ecdfe9', brand200: '#d9bfd4', brand300: '#c098b8',
  brand400: '#a06d93', brand500: '#714B67', brand600: '#5f3e57', brand700: '#4d3247', brand900: '#2a1b27',
  // Accent — warm cafe amber
  accent50: '#fff8ed', accent100: '#ffefd3', accent300: '#ffc06d', accent400: '#ff9d32',
  accent500: '#f97f0a', accent600: '#e06105',
  // Slate (greys)
  slate50: '#f8fafc', slate100: '#f1f5f9', slate200: '#e2e8f0', slate300: '#cbd5e1',
  slate400: '#94a3b8', slate500: '#64748b', slate600: '#475569', slate700: '#334155',
  slate800: '#1e293b', slate900: '#0f172a',
  // Status colours
  emerald50: '#ecfdf5', emerald100: '#d1fae5', emerald400: '#34d399', emerald500: '#10b981', emerald600: '#059669', emerald700: '#047857',
  rose50: '#fff1f2', rose500: '#f43f5e', rose600: '#e11d48', rose700: '#be123c',
  amber50: '#fffbeb', amber100: '#fef3c7', amber500: '#f59e0b', amber600: '#d97706', amber700: '#b45309',
  blue100: '#dbeafe', blue600: '#2563eb', blue700: '#1d4ed8',
  sky300: '#7dd3fc', sky500: '#0ea5e9',
  white: '#ffffff',
}

export const shadow = {
  card: '0 1px 3px rgba(16,24,40,0.1), 0 1px 2px rgba(16,24,40,0.06)',
  soft: '0 2px 10px -2px rgba(16,24,40,0.08), 0 4px 24px -4px rgba(16,24,40,0.06)',
}

// A reusable "white rounded box" style used all over the app (was `.card`).
export const cardStyle = {
  borderRadius: 12,
  background: t.white,
  boxShadow: shadow.card,
  border: `1px solid ${t.slate100}`,
}

// Tiny helper: tells you if the screen is at least `px` wide, and updates on
// resize. Lets us swap layouts the way Tailwind's `lg:` breakpoints did.
export function useWide(px = 1024) {
  const [wide, setWide] = useState(typeof window !== 'undefined' ? window.innerWidth >= px : true)
  useEffect(() => {
    const onResize = () => setWide(window.innerWidth >= px)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [px])
  return wide
}

// ---- Button ----
// variant: primary | accent | ghost | outline | danger
const BTN_VARIANTS = {
  primary: { bg: t.brand500, bgHover: t.brand600, color: t.white, border: 'none' },
  accent: { bg: t.accent500, bgHover: t.accent600, color: t.white, border: 'none' },
  danger: { bg: t.rose500, bgHover: t.rose600, color: t.white, border: 'none' },
  ghost: { bg: 'transparent', bgHover: t.slate100, color: t.slate600, border: 'none' },
  outline: { bg: t.white, bgHover: t.slate50, color: t.slate700, border: `1px solid ${t.slate300}` },
}

export function Button({ variant = 'primary', size = 'md', style, disabled, children, ...props }) {
  const [hover, setHover] = useState(false)
  const v = BTN_VARIANTS[variant] || BTN_VARIANTS.primary
  const pad = size === 'sm' ? '6px 10px' : size === 'lg' ? '12px 16px' : '8px 16px'
  const fontSize = size === 'sm' ? 12 : size === 'lg' ? 16 : 14
  return (
    <button
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        borderRadius: 8, padding: pad, fontSize, fontWeight: 600,
        border: v.border, background: hover && !disabled ? v.bgHover : v.bg, color: v.color,
        cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1,
        transition: 'background .15s', whiteSpace: 'nowrap', userSelect: 'none',
        ...style,
      }}
      {...props}
    >
      {children}
    </button>
  )
}

// Small square icon button (the pencil / trash actions). Tints on hover.
export function IconButton({ color = t.slate400, hoverColor = t.brand600, hoverBg = t.slate100, style, children, ...props }) {
  const [hover, setHover] = useState(false)
  return (
    <button
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'grid', placeItems: 'center', borderRadius: 8, padding: 6, border: 'none',
        background: hover ? hoverBg : 'transparent', color: hover ? hoverColor : color,
        cursor: 'pointer', transition: 'all .15s', ...style,
      }}
      {...props}
    >
      {children}
    </button>
  )
}

// ---- Text inputs (input / select / textarea share the same look + focus ring) ----
const baseFieldStyle = {
  width: '100%', borderRadius: 8, border: `1px solid ${t.slate300}`, background: t.white,
  padding: '8px 12px', fontSize: 14, color: t.slate800, outline: 'none',
  transition: 'border-color .15s, box-shadow .15s', boxSizing: 'border-box', fontFamily: 'inherit',
}
function useFocusRing() {
  const [focus, setFocus] = useState(false)
  const ring = focus ? { borderColor: t.brand400, boxShadow: `0 0 0 3px ${t.brand100}` } : null
  return [ring, { onFocus: () => setFocus(true), onBlur: () => setFocus(false) }]
}

export function Input({ style, ...props }) {
  const [ring, handlers] = useFocusRing()
  return <input {...handlers} style={{ ...baseFieldStyle, ...ring, ...style }} {...props} />
}
export function Textarea({ style, ...props }) {
  const [ring, handlers] = useFocusRing()
  return <textarea {...handlers} style={{ ...baseFieldStyle, ...ring, ...style }} {...props} />
}
export function Select({ style, children, ...props }) {
  const [ring, handlers] = useFocusRing()
  return <select {...handlers} style={{ ...baseFieldStyle, ...ring, cursor: 'pointer', ...style }} {...props}>{children}</select>
}

// ---- Field (label + control + hint) ----
export const labelStyle = {
  marginBottom: 6, display: 'block', fontSize: 12, fontWeight: 600,
  textTransform: 'uppercase', letterSpacing: '0.05em', color: t.slate500,
}
export function Field({ label, children, hint }) {
  return (
    <div>
      {label && <label style={labelStyle}>{label}</label>}
      {children}
      {hint && <p style={{ marginTop: 4, fontSize: 12, color: t.slate400 }}>{hint}</p>}
    </div>
  )
}

// ---- Modal ----
const MODAL_SIZES = { sm: 384, md: 512, lg: 672, xl: 896 }
export function Modal({ open, onClose, title, children, footer, size = 'md' }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose?.()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.5)' }} />
      <div style={{ position: 'relative', width: '100%', maxWidth: MODAL_SIZES[size], ...cardStyle, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        {title && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${t.slate100}`, padding: '16px 20px' }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: t.slate800, margin: 0 }}>{title}</h3>
            <IconButton onClick={onClose}><X size={20} /></IconButton>
          </div>
        )}
        <div style={{ overflowY: 'auto', padding: '16px 20px' }}>{children}</div>
        {footer && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, borderTop: `1px solid ${t.slate100}`, padding: '16px 20px' }}>{footer}</div>
        )}
      </div>
    </div>
  )
}

// ---- Toggle switch ----
export function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      aria-pressed={checked}
      aria-label={label}
      style={{
        position: 'relative', display: 'inline-flex', alignItems: 'center', height: 24, width: 44,
        borderRadius: 999, border: 'none', cursor: 'pointer', transition: 'background .15s',
        background: checked ? t.brand500 : t.slate300, padding: 0,
      }}
    >
      <span style={{
        display: 'inline-block', height: 16, width: 16, borderRadius: 999, background: t.white,
        boxShadow: '0 1px 2px rgba(0,0,0,0.2)', transition: 'transform .15s',
        transform: checked ? 'translateX(24px)' : 'translateX(4px)',
      }} />
    </button>
  )
}

// ---- Badge / chip ----
const BADGE_COLORS = {
  slate: { bg: t.slate100, color: t.slate600 },
  green: { bg: t.emerald100, color: t.emerald700 },
  amber: { bg: t.amber100, color: t.amber700 },
  red: { bg: t.rose50, color: t.rose700 },
  blue: { bg: t.blue100, color: t.blue700 },
  purple: { bg: t.brand100, color: t.brand700 },
}
export function Badge({ children, color = 'slate', dot = false }) {
  const c = BADGE_COLORS[color] || BADGE_COLORS.slate
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4, borderRadius: 999,
      padding: '2px 10px', fontSize: 12, fontWeight: 600, background: c.bg, color: c.color,
    }}>
      {dot && <span style={{ height: 6, width: 6, borderRadius: 999, background: 'currentColor', opacity: 0.7 }} />}
      {children}
    </span>
  )
}

// ---- Empty state ----
export function EmptyState({ icon: Icon, title, subtitle, action }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      borderRadius: 12, border: `2px dashed ${t.slate200}`, padding: '64px 16px', textAlign: 'center',
    }}>
      {Icon && <Icon style={{ marginBottom: 12, height: 40, width: 40, color: t.slate300 }} />}
      <p style={{ fontWeight: 600, color: t.slate600, margin: 0 }}>{title}</p>
      {subtitle && <p style={{ marginTop: 4, fontSize: 14, color: t.slate400 }}>{subtitle}</p>}
      {action && <div style={{ marginTop: 16 }}>{action}</div>}
    </div>
  )
}

// ---- Page header (title + optional action buttons on the right) ----
export function PageHeader({ title, subtitle, children }) {
  return (
    <div style={{ marginBottom: 24, display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 }}>
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: t.slate800, margin: 0 }}>{title}</h1>
        {subtitle && <p style={{ marginTop: 4, fontSize: 14, color: t.slate500, margin: '4px 0 0' }}>{subtitle}</p>}
      </div>
      {children && <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>{children}</div>}
    </div>
  )
}
