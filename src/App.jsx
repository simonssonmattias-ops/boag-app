import { useState, useEffect, useRef } from 'react'
import { supabase } from './lib/supabase'
import boagLogo from './logo.png'

const VAPID_PUBLIC_KEY = 'BGa571xWDsBI4qHgNhzpVj2WYc18RP3rqEikIKUVdcqPAHqcrG18-BBQXOSoiNeaLym8hwRsBFi7AllRNn1OXxI'

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)))
}

async function sendPush(title, body, tag = 'boag') {
  try {
    const { data: subs } = await supabase.from('push_subscriptions').select('subscription')
    if (!subs?.length) return
    await fetch('/api/send-push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscriptions: subs.map(s => s.subscription), title, body, tag })
    })
  } catch (e) { console.warn('Push misslyckades:', e) }
}

async function loadJsPDF() {
  const { jsPDF } = await import('https://cdn.jsdelivr.net/npm/jspdf@2.5.1/+esm')
  return jsPDF
}

// ─── Constants ───────────────────────────────────────────────
const COMPANIES = [
  { id: 'mark',      name: 'BOAG Mark AB',       color: '#1a1a1a', bg: 'linear-gradient(135deg,#1a1a1a,#333)' },
  { id: 'bygg',      name: 'BOAG Bygg AB',        color: '#1a6ab5', bg: 'linear-gradient(135deg,#1a6ab5,#144f8a)' },
  { id: 'transport', name: 'BOAG Transport AB',   color: '#2d8f4e', bg: 'linear-gradient(135deg,#2d8f4e,#1f6636)' },
  { id: 'mbmark',    name: 'MB Mark & Hyr AB',    color: '#e40303', bg: 'linear-gradient(135deg, #e40303 0%, #ff8c00 20%, #ffed00 40%, #008026 60%, #004dff 80%, #750787 100%)' },
]

// ─── Helpers ─────────────────────────────────────────────────
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2) }
function today() { return new Date().toISOString().slice(0, 10) }
function r1(n) { return Math.round((n || 0) * 10) / 10 }
function fmt(d) { if (!d) return ''; return new Date(d + 'T12:00:00').toLocaleDateString('sv-SE', { day: 'numeric', month: 'short', year: 'numeric' }) }
function fmtSz(b) { if (b < 1024) return b + 'B'; if (b < 1048576) return (b / 1024).toFixed(0) + 'KB'; return (b / 1048576).toFixed(1) + 'MB' }
function ini(n) { return n.split(' ').map(x => x[0]).join('').slice(0, 2).toUpperCase() }
function fileInfo(t) {
  if (t?.startsWith('image/')) return { icon: '🖼', bg: '#FEF0E6' }
  if (t === 'application/pdf') return { icon: '📄', bg: '#FEECEC' }
  if (t?.includes('word')) return { icon: '📝', bg: '#E8F0FE' }
  return { icon: '📎', bg: '#F0EFE8' }
}

// ─── Icons ───────────────────────────────────────────────────
const Icon = {
  home: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  grid: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>,
  proj: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>,
  dag:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><line x1="9" y1="7" x2="15" y2="7"/><line x1="9" y1="11" x2="15" y2="11"/></svg>,
  tid:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  rap:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  back: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="15" height="15"><polyline points="15 18 9 12 15 6"/></svg>,
  del:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="13" height="13"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>,
  up:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>,
  cam:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="15" height="15"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>,
  gear: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="18" height="18"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  pin:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="12" height="12"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  prt:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="13" height="13"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>,
  ok:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12"><polyline points="20 6 9 17 4 12"/></svg>,
  x2:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  plus: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
}

// ─── App ─────────────────────────────────────────────────────
export default function App() {
  const [sess, setSess] = useState(() => { try { return JSON.parse(localStorage.getItem('boag_session')) } catch { return null } })
  const [employees, setEmployees] = useState([])
  const [projects, setProjects] = useState([])
  const [dagbok, setDagbok] = useState([])
  const [tid, setTid] = useState([])
  const [ata, setAta] = useState([])
  const [ann, setAnn] = useState([])
  const [files, setFiles] = useState({})
  const [kunder, setKunder] = useState([])
  const [korsedlar, setKorsedlar] = useState([])
  const [svetsprotokoll, setSvetsprotokoll] = useState([])
  const [massbalans, setMassbalans] = useState([])
  const [masskommentarer, setMasskommentarer] = useState([])
  const [veckoplanning, setVeckoplanning] = useState([])
  const [attest, setAttest] = useState([])
  const [lager, setLager] = useState([])
  const [anbud, setAnbud] = useState([])
  const [mainTab, setMainTab] = useState('home')
  const [activeCo, setActiveCo] = useState(null)
  const [coTab, setCoTab] = useState('projects')
  const [showSettings, setShowSettings] = useState(false)
  const [lb, setLb] = useState(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    const [
      { data: emps }, { data: projs }, { data: dag },
      { data: tids }, { data: atas }, { data: anns }, { data: fls },
      { data: kunds }, { data: kors }, { data: svets },
      { data: mass }, { data: masskомm },
      { data: vecka }, { data: atts }, { data: lagerData }, { data: anbudData }
    ] = await Promise.all([
      supabase.from('employees').select('*').order('name'),
      supabase.from('projects').select('*').order('created_at', { ascending: false }),
      supabase.from('dagbok').select('*').order('date', { ascending: false }),
      supabase.from('tid').select('*').order('date', { ascending: false }),
      supabase.from('ata').select('*').order('created_at', { ascending: false }),
      supabase.from('announcements').select('*').order('created_at', { ascending: false }),
      supabase.from('project_files').select('*'),
      supabase.from('kunder').select('*').order('name'),
      supabase.from('korsedlar').select('*').order('date', { ascending: false }),
      supabase.from('svetsprotokoll').select('*').order('date', { ascending: false }),
      supabase.from('massbalans').select('*').order('created_at', { ascending: false }),
      supabase.from('masskommentarer').select('*').order('created_at', { ascending: true }),
      supabase.from('veckoplanning').select('*').order('datum', { ascending: true }),
      supabase.from('attest').select('*').order('created_at', { ascending: false }),
      supabase.from('lager').select('*').order('kategori', { ascending: true }),
      supabase.from('anbud').select('*').order('created_at', { ascending: false }),
    ])
    setEmployees(emps || [])
    setProjects(projs || [])
    setDagbok(dag || [])
    setTid(tids || [])
    setAta(atas || [])
    setAnn(anns || [])
    const fMap = {}
    ;(fls || []).forEach(f => { if (!fMap[f.project_id]) fMap[f.project_id] = []; fMap[f.project_id].push(f) })
    setFiles(fMap)
    setKunder(kunds || [])
    setKorsedlar(kors || [])
    setSvetsprotokoll(svets || [])
    setMassbalans(mass || [])
    setMasskommentarer(masskомm || [])
    setVeckoplanning(vecka || [])
    setAttest(atts || [])
    setLager(lagerData || [])
    setAnbud(anbudData || [])
    setLoaded(true)
  }

  const login = async (emp) => {
    setSess(emp)
    localStorage.setItem('boag_session', JSON.stringify(emp))
    setMainTab('home')
    // Register service worker and subscribe to push
    setTimeout(() => registerPush(emp), 2000)
  }

  const registerPush = async (emp) => {
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) return
      const reg = await navigator.serviceWorker.register('/sw.js')
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') return
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      })
      // Save subscription to Supabase
      await supabase.from('push_subscriptions').upsert({
        id: emp.id,
        employee_name: emp.name,
        subscription: sub.toJSON(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' })
    } catch (e) { console.warn('Push-registrering misslyckades:', e) }
  }
  const logout = () => { setSess(null); localStorage.removeItem('boag_session') }

  // ── Employee CRUD ──
  const addEmployee = async (data) => {
    const row = { id: uid(), ...data }
    await supabase.from('employees').insert(row)
    setEmployees(e => [...e, row].sort((a, b) => a.name.localeCompare(b.name)))
  }
  const updateEmployee = async (id, data) => {
    await supabase.from('employees').update(data).eq('id', id)
    setEmployees(e => e.map(x => x.id === id ? { ...x, ...data } : x))
  }
  const deleteEmployee = async (id) => {
    await supabase.from('employees').delete().eq('id', id)
    setEmployees(e => e.filter(x => x.id !== id))
  }

  // ── Project CRUD ──
  const addProject = async (data) => {
    const row = { id: uid(), ...data, created_at: today() }
    await supabase.from('projects').insert(row)
    setProjects(p => [row, ...p])
    // Auto-synka beställare till kundlistan om den inte redan finns
    if (data.client?.trim()) {
      const exists = kunder.some(k => k.name.trim().toLowerCase() === data.client.trim().toLowerCase())
      if (!exists) {
        const kundRow = { id: uid(), name: data.client.trim(), contact: data.contact_name || '', phone: data.contact_phone || '', email: data.contact_email || '' }
        await supabase.from('kunder').insert(kundRow)
        setKunder(k => [...k, kundRow].sort((a, b) => a.name.localeCompare(b.name)))
      }
    }
  }
  const updateProject = async (id, data) => {
    await supabase.from('projects').update(data).eq('id', id)
    setProjects(p => p.map(x => x.id === id ? { ...x, ...data } : x))
    if (data.client?.trim()) {
      const exists = kunder.some(k => k.name.trim().toLowerCase() === data.client.trim().toLowerCase())
      if (!exists) {
        const kundRow = { id: uid(), name: data.client.trim(), contact: data.contact_name || '', phone: data.contact_phone || '', email: data.contact_email || '' }
        await supabase.from('kunder').insert(kundRow)
        setKunder(k => [...k, kundRow].sort((a, b) => a.name.localeCompare(b.name)))
      }
    }
  }
  const deleteProject = async (id) => {
    await supabase.from('projects').delete().eq('id', id)
    setProjects(p => p.filter(x => x.id !== id))
  }

  // ── Dagbok CRUD ──
  const addDagbok = async (data) => {
    const row = { id: data.id || uid(), ...data }
    await supabase.from('dagbok').insert(row)
    setDagbok(d => [row, ...d])
    return row
  }
  const updateDagbok = async (id, data) => {
    await supabase.from('dagbok').update(data).eq('id', id)
    setDagbok(d => d.map(x => x.id === id ? { ...x, ...data } : x))
  }
  const deleteDagbok = async (id) => {
    await supabase.from('dagbok').delete().eq('id', id)
    await supabase.from('tid').delete().eq('entry_id', id)
    setDagbok(d => d.filter(x => x.id !== id))
    setTid(t => t.filter(x => x.entry_id !== id))
  }

  // ── Tid CRUD ──
  const addTid = async (data) => {
    const row = { id: uid(), ...data }
    await supabase.from('tid').insert(row)
    setTid(t => [row, ...t])
  }
  const deleteTid = async (id) => {
    await supabase.from('tid').delete().eq('id', id)
    setTid(t => t.filter(x => x.id !== id))
  }
  const deleteTidByEntry = async (entryId) => {
    await supabase.from('tid').delete().eq('entry_id', entryId)
    setTid(t => t.filter(x => x.entry_id !== entryId))
  }

  // ── ÄTA CRUD ──
  const addAta = async (data) => {
    const row = { id: uid(), ...data, status: 'pending', created_at: today() }
    await supabase.from('ata').insert(row)
    setAta(a => [row, ...a])
    sendPush('⚠️ Ny ÄTA inkommen', `${data.employee} — ${data.description?.slice(0, 60)}`, 'ata')
  }
  const updateAta = async (id, data) => {
    await supabase.from('ata').update(data).eq('id', id)
    setAta(a => a.map(x => x.id === id ? { ...x, ...data } : x))
  }
  const deleteAta = async (id) => {
    await supabase.from('ata').delete().eq('id', id)
    setAta(a => a.filter(x => x.id !== id))
  }

  // ── Announcements CRUD ──
  const addAnn = async (data) => {
    const row = { id: uid(), ...data }
    await supabase.from('announcements').insert(row)
    setAnn(a => [row, ...a])
    sendPush('📢 Nytt anslag — BOAG', data.title, 'anslag')
  }
  const deleteAnn = async (id) => {
    await supabase.from('announcements').delete().eq('id', id)
    setAnn(a => a.filter(x => x.id !== id))
  }

  // ── Files CRUD ──
  const addFile = async (projectId, company, fileData) => {
    const row = { id: uid(), project_id: projectId, company, ...fileData }
    await supabase.from('project_files').insert(row)
    setFiles(f => ({ ...f, [projectId]: [...(f[projectId] || []), row] }))
  }
  const deleteFile = async (projectId, fileId) => {
    await supabase.from('project_files').delete().eq('id', fileId)
    setFiles(f => ({ ...f, [projectId]: (f[projectId] || []).filter(x => x.id !== fileId) }))
  }

  // ── Kunder CRUD ──
  const addKund = async (data) => {
    const row = { id: uid(), ...data }
    await supabase.from('kunder').insert(row)
    setKunder(k => [...k, row].sort((a, b) => a.name.localeCompare(b.name)))
  }
  const updateKund = async (id, data) => {
    await supabase.from('kunder').update(data).eq('id', id)
    setKunder(k => k.map(x => x.id === id ? { ...x, ...data } : x))
  }
  const deleteKund = async (id) => {
    await supabase.from('kunder').delete().eq('id', id)
    setKunder(k => k.filter(x => x.id !== id))
  }

  // ── Körsedlar CRUD ──
  const addKorsedel = async (data) => {
    const row = { id: uid(), ...data, created_at: new Date().toISOString() }
    await supabase.from('korsedlar').insert(row)
    setKorsedlar(k => [row, ...k])
    const kundNamn = kunder.find(x => x.id === data.kund_id)?.name || ''
    sendPush('🚛 Ny körsedel', `${data.forare} — ${kundNamn}${data.markning ? ' · ' + data.markning : ''}`, 'korsedel')
  }
  const deleteKorsedel = async (id) => {
    await supabase.from('korsedlar').delete().eq('id', id)
    setKorsedlar(k => k.filter(x => x.id !== id))
  }
  const updateKorsedel = async (id, data) => {
    await supabase.from('korsedlar').update(data).eq('id', id)
    setKorsedlar(k => k.map(x => x.id === id ? { ...x, ...data } : x))
  }

  // ── Svetsprotokoll CRUD ──
  const addSvets = async (data) => {
    const row = { id: uid(), ...data, created_at: new Date().toISOString() }
    await supabase.from('svetsprotokoll').insert(row)
    setSvetsprotokoll(s => [row, ...s])
  }
  const deleteSvets = async (id) => {
    await supabase.from('svetsprotokoll').delete().eq('id', id)
    setSvetsprotokoll(s => s.filter(x => x.id !== id))
  }

  // ── Massbalans CRUD ──
  const addMassbalans = async (data) => {
    const row = { id: uid(), ...data, created_at: new Date().toISOString() }
    await supabase.from('massbalans').insert(row)
    setMassbalans(m => [row, ...m])
    sendPush('⛏️ Ny masspost', `${data.projekt} — ${data.adress}`, 'massbalans')
  }
  const updateMassbalans = async (id, data) => {
    await supabase.from('massbalans').update(data).eq('id', id)
    setMassbalans(m => m.map(x => x.id === id ? { ...x, ...data } : x))
  }
  const deleteMassbalans = async (id) => {
    await supabase.from('massbalans').delete().eq('id', id)
    setMassbalans(m => m.filter(x => x.id !== id))
  }
  const addMasskommentar = async (data) => {
    const row = { id: uid(), ...data, created_at: new Date().toISOString() }
    await supabase.from('masskommentarer').insert(row)
    setMasskommentarer(m => [...m, row])
  }

  // ── Veckoplanning CRUD ──
  const addVeckopost = async (data) => {
    const row = { id: uid(), ...data, created_at: new Date().toISOString() }
    await supabase.from('veckoplanning').insert(row)
    setVeckoplanning(v => [...v, row].sort((a,b) => a.datum.localeCompare(b.datum)))
  }
  const deleteVeckopost = async (id) => {
    await supabase.from('veckoplanning').delete().eq('id', id)
    setVeckoplanning(v => v.filter(x => x.id !== id))
  }
  const updateVeckopost = async (id, data) => {
    await supabase.from('veckoplanning').update(data).eq('id', id)
    setVeckoplanning(v => v.map(x => x.id === id ? { ...x, ...data } : x))
  }

  // ── Attest CRUD ──
  const addAttest = async (data) => {
    const row = { id: uid(), ...data, status: 'väntar', created_at: new Date().toISOString() }
    await supabase.from('attest').insert(row)
    setAttest(a => [row, ...a])
    sendPush('✅ Ny attest att godkänna', `${data.employee_name} — ${data.datum}`, 'attest')
  }
  const updateAttest = async (id, data) => {
    await supabase.from('attest').update(data).eq('id', id)
    setAttest(a => a.map(x => x.id === id ? { ...x, ...data } : x))
  }
  const deleteAttest = async (id) => {
    await supabase.from('attest').delete().eq('id', id)
    setAttest(a => a.filter(x => x.id !== id))
  }

  // ── Lager CRUD ──
  const addLagerItem = async (data) => {
    const row = { id: uid(), ...data, created_at: new Date().toISOString() }
    await supabase.from('lager').insert(row)
    setLager(l => [...l, row].sort((a, b) => a.kategori.localeCompare(b.kategori)))
  }
  const updateLagerItem = async (id, data) => {
    await supabase.from('lager').update(data).eq('id', id)
    setLager(l => l.map(x => x.id === id ? { ...x, ...data } : x))
  }
  const deleteLagerItem = async (id) => {
    await supabase.from('lager').delete().eq('id', id)
    setLager(l => l.filter(x => x.id !== id))
  }

  // ── Anbud CRUD ──
  const addAnbud = async (data) => {
    const row = { id: uid(), ...data, created_at: new Date().toISOString() }
    await supabase.from('anbud').insert(row)
    setAnbud(a => [row, ...a])
  }
  const updateAnbud = async (id, data) => {
    await supabase.from('anbud').update(data).eq('id', id)
    setAnbud(a => a.map(x => x.id === id ? { ...x, ...data } : x))
  }
  const deleteAnbud = async (id) => {
    await supabase.from('anbud').delete().eq('id', id)
    setAnbud(a => a.filter(x => x.id !== id))
  }

  if (!loaded) return <div className="empty" style={{ paddingTop: 80 }}>Laddar BOAG...</div>
  if (!sess) return <LoginScreen employees={employees} onSelect={login} />

  const isAdmin = sess.role === 'admin'
  const co = activeCo ? COMPANIES.find(c => c.id === activeCo) : null

  // ── Inside a company ──
  if (activeCo && co) {
    const cProjects = isAdmin ? projects.filter(p => p.company === activeCo) : projects.filter(p => p.company === activeCo && (p.assigned_to || []).includes(sess.id))
    const cDagbok = dagbok.filter(d => d.company === activeCo)
    const cTid = tid.filter(t => t.company === activeCo)
    const cAta = ata.filter(a => a.company === activeCo)
    const cKorsedlar = korsedlar.filter(k => k.company === activeCo)
    const cSvets = svetsprotokoll.filter(s => s.company === activeCo)

    const lagerIcon = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16"><path d="M5 8h14M5 8a2 2 0 1 0 0-4h14a2 2 0 1 0 0 4M5 8v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8M10 12h4"/></svg>
    const cLager = lager.filter(l => l.company === activeCo)
    const isTransport = activeCo === 'transport'
    const isMbmark = activeCo === 'mbmark'

    let tabs = []
    if (isTransport) {
      tabs = [
        { k: 'korsedlar', l: 'Körsedlar', i: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16"><rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 5v3h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg> },
        ...(isAdmin ? [{ k: 'rapport', l: 'Rapport', i: Icon.rap }] : [])
      ]
    } else if (isMbmark) {
      tabs = [
        { k: 'projekt', l: 'Projekt', i: Icon.proj },
        { k: 'svets', l: 'Svets', i: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg> },
        { k: 'lager', l: 'Lager', i: lagerIcon },
        ...(isAdmin ? [{ k: 'rapport', l: 'Rapport', i: Icon.rap }] : [])
      ]
    } else {
      tabs = [
        { k: 'projects', l: 'Projekt', i: Icon.proj },
        { k: 'lager', l: 'Lager', i: lagerIcon },
        ...(isAdmin ? [{ k: 'rapport', l: 'Rapport', i: Icon.rap }] : [])
      ]
    }

    return (
      <div className="app" style={{ '--accent': co.color }}>
        {lb && <div className="lightbox" onClick={() => setLb(null)}><button className="lightbox-close" onClick={() => setLb(null)}>×</button><img src={lb} alt="" /></div>}
        <div className="sub-topbar">
          <button className="back-btn" onClick={() => { setActiveCo(null); setMainTab('bolag') }}><svg viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="1.8" width="20" height="20"><polyline points="15 18 9 12 15 6"/></svg></button>
          <div style={{ width: 8, height: 8, borderRadius: 4, background: co.color, flexShrink: 0 }} />
          <div className="sub-topbar-name">{co.name}</div>
          <div style={{ marginLeft: 'auto' }}>
            <button className="user-chip" onClick={logout}><div className={isAdmin ? 'dot-admin' : sess.role === 'ue' ? 'dot-ue' : 'dot-emp'} />{sess.name.split(' ')[0]}<span style={{ color: '#888', fontSize: 10 }}>× byt</span></button>
          </div>
        </div>
        <nav className="nav">{tabs.map(t => <button key={t.k} className={`nav-btn${coTab === t.k ? ' active' : ''}`} onClick={() => setCoTab(t.k)}>{t.i}{t.l}</button>)}</nav>
        <div className="content">
          {/* Mark & Bygg */}
          {coTab === 'projects' && <ProjektTab co={co} projects={cProjects} allProjects={projects} employees={employees} sess={sess} isAdmin={isAdmin} dagbok={cDagbok} tid={cTid} ata={cAta} files={files} addProject={addProject} updateProject={updateProject} deleteProject={deleteProject} addAta={addAta} updateAta={updateAta} deleteAta={deleteAta} addFile={addFile} deleteFile={deleteFile} setLb={setLb} addDagbok={addDagbok} updateDagbok={updateDagbok} addTid={addTid} deleteDagbok={deleteDagbok} deleteTid={deleteTid} deleteTidByEntry={deleteTidByEntry} />}
          {coTab === 'arbetsdag' && <ArbetsdagTab co={co} projects={cProjects} dagbok={cDagbok} tid={cTid} employees={employees} addDagbok={addDagbok} updateDagbok={updateDagbok} deleteDagbok={deleteDagbok} addTid={addTid} deleteTid={deleteTid} deleteTidByEntry={deleteTidByEntry} sess={sess} isAdmin={isAdmin} setLb={setLb} />}
          {/* Transport */}
          {coTab === 'korsedlar' && <KorsedlarTab co={co} korsedlar={cKorsedlar} kunder={kunder} employees={employees} sess={sess} isAdmin={isAdmin} addKorsedel={addKorsedel} deleteKorsedel={deleteKorsedel} updateKorsedel={updateKorsedel} />}
          {/* MB Mark */}
          {coTab === 'projekt' && <ProjektTab co={co} projects={cProjects} allProjects={projects} employees={employees} sess={sess} isAdmin={isAdmin} dagbok={cDagbok} tid={cTid} ata={cAta} files={files} addProject={addProject} updateProject={updateProject} deleteProject={deleteProject} addAta={addAta} updateAta={updateAta} deleteAta={deleteAta} addFile={addFile} deleteFile={deleteFile} setLb={setLb} addDagbok={addDagbok} updateDagbok={updateDagbok} addTid={addTid} deleteDagbok={deleteDagbok} deleteTid={deleteTid} deleteTidByEntry={deleteTidByEntry} />}
          {coTab === 'svets' && <SvetsprotokollTab co={co} svetsprotokoll={cSvets} projects={cProjects} sess={sess} isAdmin={isAdmin} addSvets={addSvets} deleteSvets={deleteSvets} />}
          {/* Rapport (alla bolag) */}
          {coTab === 'lager' && <LagerTab co={co} lager={cLager} sess={sess} isAdmin={isAdmin} addLagerItem={addLagerItem} updateLagerItem={updateLagerItem} deleteLagerItem={deleteLagerItem} />}
          {coTab === 'rapport' && isAdmin && !isTransport && <RapportTab co={co} projects={cProjects} dagbok={cDagbok} tid={cTid} ata={cAta} />}
          {coTab === 'rapport' && isAdmin && isTransport && <TransportRapportTab co={co} korsedlar={cKorsedlar} kunder={kunder} />}
        </div>
      </div>
    )
  }

  // ── Main koncern level ──
  return (
    <div className="app" style={{ '--accent': '#1a1a1a' }}>
      {lb && <div className="lightbox" onClick={() => setLb(null)}><button className="lightbox-close">×</button><img src={lb} alt="" /></div>}
      {showSettings && <SettingsSheet employees={employees} addEmployee={addEmployee} updateEmployee={updateEmployee} deleteEmployee={deleteEmployee} kunder={kunder} addKund={addKund} updateKund={updateKund} deleteKund={deleteKund} onClose={() => setShowSettings(false)} />}
      <div className="topbar">
        <div className="topbar-left">
          <img src={boagLogo} className="topbar-logo" alt="BOAG" />
          <div className="topbar-sep" />
          <span className="topbar-label">KONCERN</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {isAdmin && <button className="gear-btn" onClick={() => setShowSettings(true)}>{Icon.gear}</button>}
          <button className="user-chip" onClick={logout}><div className={isAdmin ? 'dot-admin' : 'dot-emp'} />{sess.name.split(' ')[0]}<span style={{ color: '#888', fontSize: 10 }}>× byt</span></button>
        </div>
      </div>
      <nav className="nav">
        <button className={`nav-btn${mainTab === 'home' ? ' active' : ''}`} onClick={() => setMainTab('home')}>{Icon.home}Hem</button>
        <button className={`nav-btn${mainTab === 'bolag' ? ' active' : ''}`} onClick={() => setMainTab('bolag')}>{Icon.grid}Bolag</button>
        <button className={`nav-btn${mainTab === 'plan' ? ' active' : ''}`} onClick={() => setMainTab('plan')}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>Plan</button>
        <button className={`nav-btn${mainTab === 'attest' ? ' active' : ''}`} onClick={() => setMainTab('attest')}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>Attest{attest.filter(a=>a.status==='väntar'&&isAdmin).length>0?` ●`:''}</button>
        <button className={`nav-btn${mainTab === 'kom' ? ' active' : ''}`} onClick={() => setMainTab('kom')}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>Forum</button>
        <button className={`nav-btn${mainTab === 'mass' ? ' active' : ''}`} onClick={() => setMainTab('mass')}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/><line x1="3" y1="12" x2="21" y2="12"/></svg>Massor</button>
        <button className={`nav-btn${mainTab === 'ajoj' ? ' active' : ''}`} onClick={() => setMainTab('ajoj')}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>Aj & Oj</button>
        {isAdmin && <button className={`nav-btn${mainTab === 'anbud' ? ' active' : ''}`} onClick={() => setMainTab('anbud')}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>Anbud</button>}
      </nav>
      <div className="content">
        {mainTab === 'home' && <HomeTab ann={ann} addAnn={addAnn} deleteAnn={deleteAnn} sess={sess} isAdmin={isAdmin} />}
        {mainTab === 'bolag' && <BolagTab projects={projects} tid={tid} ata={ata} onSelect={(id) => { setActiveCo(id); setCoTab('projects') }} />}
        {mainTab === 'plan' && <VeckoplaningTab sess={sess} isAdmin={isAdmin} veckoplanning={veckoplanning} employees={employees} projects={projects} addVeckopost={addVeckopost} updateVeckopost={updateVeckopost} deleteVeckopost={deleteVeckopost} />}
        {mainTab === 'attest' && <AttestTab sess={sess} isAdmin={isAdmin} attest={attest} addAttest={addAttest} updateAttest={updateAttest} deleteAttest={deleteAttest} employees={employees} projects={projects} />}
        {mainTab === 'kom' && <KommunikationTab sess={sess} />}
        {mainTab === 'mass' && <MassbalansTab sess={sess} isAdmin={isAdmin} massbalans={massbalans} masskommentarer={masskommentarer} addMassbalans={addMassbalans} updateMassbalans={updateMassbalans} deleteMassbalans={deleteMassbalans} addMasskommentar={addMasskommentar} employees={employees} />}
        {mainTab === 'ajoj' && <AjOjTab sess={sess} isAdmin={isAdmin} projects={projects} employees={employees} />}
        {mainTab === 'anbud' && isAdmin && <AnbudTab />}
      </div>
    </div>
  )
}

// ─── Login Screen ─────────────────────────────────────────────
function LoginScreen({ employees, onSelect }) {
  const [sel, setSel] = useState(null)
  const [pin, setPin] = useState('')
  const [err, setErr] = useState('')
  const [shake, setShake] = useState(false)
  const [loginTab, setLoginTab] = useState('employee')

  const handleDigit = (d) => {
    if (pin.length >= 4) return
    const np = pin + d
    setPin(np); setErr('')
    if (np.length === 4) {
      setTimeout(() => {
        if (np === sel.pin) { onSelect(sel) }
        else { setErr('Fel PIN-kod'); setShake(true); setTimeout(() => { setPin(''); setShake(false) }, 400) }
      }, 180)
    }
  }

  if (sel) return (
    <div className="login-screen">
      <div style={{ textAlign: 'center', marginBottom: 4 }}>
        <img src={boagLogo} className="login-logo" alt="BOAG" />
        <div className="login-divider" />
        <div className="login-label">KONCERNAPP</div>
      </div>
      <div className="pin-screen">
        <div className="pin-avatar-wrap">
          <div className={`avatar ${sel.role === 'admin' ? 'av-admin' : sel.role === 'ue' ? 'av-ue' : 'av-emp'}`} style={{ width: 52, height: 52, fontSize: 18, margin: '0 auto' }}>{ini(sel.name)}</div>
          <div className="pin-name">{sel.name}</div>
          <div className="pin-role">{sel.role === 'admin' ? 'Administratör' : sel.role === 'ue' ? 'Underentreprenör' : 'Anställd'}</div>
        </div>
        <div className="pin-dots">{[0,1,2,3].map(i => <div key={i} className={`pin-dot${pin.length > i ? ' filled' : ''}${shake ? ' error' : ''}`} />)}</div>
        <div className="pin-error">{err}</div>
        <div className="pin-grid">
          {[1,2,3,4,5,6,7,8,9].map(n => <button key={n} className="pin-btn" onClick={() => handleDigit(String(n))}>{n}</button>)}
          <div />
          <button className="pin-btn" onClick={() => handleDigit('0')}>0</button>
          <button className="pin-btn pin-btn-del" onClick={() => setPin(p => p.slice(0, -1))}>⌫</button>
        </div>
        <div className="pin-back" onClick={() => { setSel(null); setPin(''); setErr('') }}>← Välj annan person</div>
      </div>
    </div>
  )

  const tabs = [
    { k: 'employee', l: 'Anställda', roles: ['employee'] },
    { k: 'admin', l: 'Tjänstemän', roles: ['admin'] },
    { k: 'ue', l: 'UE', roles: ['ue'] },
  ]
  const filtered = employees.filter(e => tabs.find(t => t.k === loginTab)?.roles.includes(e.role))

  return (
    <div className="login-screen">
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <img src={boagLogo} className="login-logo" alt="BOAG" />
        <div className="login-divider" />
        <div className="login-label">KONCERNAPP</div>
      </div>
      <div style={{ display: 'flex', background: 'rgba(255,255,255,.08)', borderRadius: 10, padding: 3, gap: 2, marginBottom: 20, width: '100%', maxWidth: 340 }}>
        {tabs.map(t => (
          <button key={t.k} onClick={() => setLoginTab(t.k)} style={{ flex: 1, padding: '7px 4px', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', background: loginTab === t.k ? '#fff' : 'transparent', color: loginTab === t.k ? '#1a1a1a' : 'rgba(255,255,255,.5)', transition: 'all .15s' }}>{t.l}</button>
        ))}
      </div>
      {filtered.length === 0 && <div style={{ fontSize: 13, color: 'rgba(255,255,255,.3)', marginBottom: 12 }}>Inga {tabs.find(t=>t.k===loginTab)?.l.toLowerCase()} registrerade</div>}
      {filtered.map(emp => (
        <div key={emp.id} className="emp-card" onClick={() => setSel(emp)}>
          <div className={`avatar ${emp.role === 'admin' ? 'av-admin' : emp.role === 'ue' ? 'av-ue' : 'av-emp'}`}>{ini(emp.name)}</div>
          <div><div className="emp-name">{emp.name}</div><div className="emp-role-label">{emp.role === 'admin' ? 'Administratör' : emp.role === 'ue' ? 'Underentreprenör' : 'Anställd'}</div></div>
          <span style={{ marginLeft: 'auto', fontSize: 20, color: 'rgba(255,255,255,.2)' }}>›</span>
        </div>
      ))}
    </div>
  )
}

// ─── Settings Sheet ───────────────────────────────────────────
function SettingsSheet({ employees, addEmployee, updateEmployee, deleteEmployee, kunder, addKund, updateKund, deleteKund, onClose }) {
  const [section, setSection] = useState('personal')
  const [view, setView] = useState('list')
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState({ name: '', role: 'employee', pin: '', phone: '' })
  const [kundForm, setKundForm] = useState({ name: '', contact: '', phone: '', email: '' })
  const [pinErr, setPinErr] = useState('')

  const startEdit = (emp) => { setEditId(emp.id); setForm({ name: emp.name, role: emp.role, pin: emp.pin, phone: emp.phone || '' }); setView('edit') }
  const startEditKund = (k) => { setEditId(k.id); setKundForm({ name: k.name, contact: k.contact || '', phone: k.phone || '', email: k.email || '' }); setView('editkund') }

  const saveEmp = () => {
    if (!form.name.trim()) return
    if (!/^\d{4}$/.test(form.pin)) { setPinErr('PIN måste vara exakt 4 siffror'); return }
    addEmployee({ name: form.name.trim(), role: form.role, pin: form.pin, phone: form.phone.trim() })
    setForm({ name: '', role: 'employee', pin: '', phone: '' }); setPinErr(''); setView('list')
  }
  const saveEdit = () => {
    if (!form.name.trim()) return
    if (!/^\d{4}$/.test(form.pin)) { setPinErr('PIN måste vara exakt 4 siffror'); return }
    updateEmployee(editId, { name: form.name.trim(), role: form.role, pin: form.pin, phone: form.phone.trim() })
    setEditId(null); setForm({ name: '', role: 'employee', pin: '', phone: '' }); setPinErr(''); setView('list')
  }
  const delEmp = (id) => {
    if (employees.find(e => e.id === id)?.role === 'admin' && employees.filter(e => e.role === 'admin').length <= 1) { alert('Måste finnas minst en admin.'); return }
    deleteEmployee(id)
  }
  const saveKund = () => {
    if (!kundForm.name.trim()) return
    addKund({ name: kundForm.name.trim(), contact: kundForm.contact.trim(), phone: kundForm.phone.trim(), email: kundForm.email.trim() })
    setKundForm({ name: '', contact: '', phone: '', email: '' }); setView('list')
  }
  const saveEditKund = () => {
    if (!kundForm.name.trim()) return
    updateKund(editId, { name: kundForm.name.trim(), contact: kundForm.contact.trim(), phone: kundForm.phone.trim(), email: kundForm.email.trim() })
    setEditId(null); setKundForm({ name: '', contact: '', phone: '', email: '' }); setView('list')
  }

  const pencilIcon = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="13" height="13"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>

  const empFormUI = (onSave, onCancel, isEdit) => (
    <div>
      <div className="field-group"><div className="field-label">Namn *</div><input className="field" placeholder="T.ex. Erik Johansson" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} autoFocus /></div>
      <div className="field-group"><div className="field-label">Roll</div>
        <select className="field" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
          <option value="employee">Anställd</option><option value="ue">Underentreprenör (UE)</option><option value="admin">Administratör</option>
        </select>
      </div>
      <div className="field-group"><div className="field-label">Telefonnummer</div><input className="field" type="tel" placeholder="T.ex. 0701234567" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
      <div className="field-group">
        <div className="field-label">PIN-kod (4 siffror) *</div>
        <input className="field" type="tel" inputMode="numeric" pattern="[0-9]*" maxLength={4} placeholder="T.ex. 1234" value={form.pin} onChange={e => { setForm({ ...form, pin: e.target.value.replace(/\D/g, '').slice(0, 4) }); setPinErr('') }} />
        {pinErr && <div style={{ fontSize: 12, color: '#e24b4a', marginTop: 4 }}>{pinErr}</div>}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn-primary" style={{ flex: 1, marginTop: 0 }} onClick={onSave}>{isEdit ? 'Spara ändringar' : 'Spara'}</button>
        <button style={{ marginTop: 0, padding: '10px 16px', background: 'transparent', border: '0.5px solid rgba(0,0,0,.2)', borderRadius: 8, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }} onClick={onCancel}>Avbryt</button>
      </div>
    </div>
  )

  const kundFormUI = (onSave, onCancel) => (
    <div>
      <div className="field-group"><div className="field-label">Kundnamn *</div><input className="field" placeholder="T.ex. Bostadsbolaget" value={kundForm.name} onChange={e => setKundForm({ ...kundForm, name: e.target.value })} autoFocus /></div>
      <div className="field-group"><div className="field-label">Kontaktperson</div><input className="field" placeholder="T.ex. Anna Lindström" value={kundForm.contact} onChange={e => setKundForm({ ...kundForm, contact: e.target.value })} /></div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div className="field-group"><div className="field-label">Telefon</div><input className="field" type="tel" placeholder="070-000 00 00" value={kundForm.phone} onChange={e => setKundForm({ ...kundForm, phone: e.target.value })} /></div>
        <div className="field-group"><div className="field-label">E-post</div><input className="field" type="email" placeholder="anna@kund.se" value={kundForm.email} onChange={e => setKundForm({ ...kundForm, email: e.target.value })} /></div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn-primary" style={{ flex: 1, marginTop: 0 }} onClick={onSave}>Spara</button>
        <button style={{ marginTop: 0, padding: '10px 16px', background: 'transparent', border: '0.5px solid rgba(0,0,0,.2)', borderRadius: 8, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }} onClick={onCancel}>Avbryt</button>
      </div>
    </div>
  )

  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet" onClick={e => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div style={{ display: 'flex', background: '#F0EFE8', borderRadius: 8, padding: 3, gap: 2, marginBottom: 14 }}>
          {[{ k: 'personal', l: '👷 Personal' }, { k: 'kunder', l: '🏢 Kunder' }].map(t => (
            <button key={t.k} onClick={() => { setSection(t.k); setView('list') }} style={{ flex: 1, padding: '7px 4px', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', background: section === t.k ? '#fff' : 'transparent', color: section === t.k ? '#1a1a1a' : '#888' }}>{t.l}</button>
          ))}
        </div>

        {section === 'personal' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 15, fontWeight: 700 }}>{view === 'add' ? 'Lägg till' : view === 'edit' ? 'Redigera' : 'Personal'}</div>
              {view === 'list' && <button className="btn-add" onClick={() => { setForm({ name: '', role: 'employee', pin: '', phone: '' }); setView('add') }}>{Icon.plus} Lägg till</button>}
            </div>
            {view === 'list' && (
              <div>
                <div className="info-box"><strong>Hur anställda loggar in:</strong> Dela URL:en via SMS. De öppnar i mobilen, väljer namn och anger PIN.</div>
                {employees.map(emp => (
                  <div key={emp.id} className="emp-row">
                    <div className={`avatar ${emp.role === 'admin' ? 'av-admin-light' : emp.role === 'ue' ? 'av-ue-light' : 'av-emp-light'}`} style={{ width: 36, height: 36, fontSize: 12 }}>{ini(emp.name)}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>{emp.name}</div>
                      <div style={{ display: 'flex', gap: 6, marginTop: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                        <span className={emp.role === 'admin' ? 'role-badge-admin' : emp.role === 'ue' ? 'role-badge-ue' : 'role-badge-emp'}>{emp.role === 'admin' ? 'Admin' : emp.role === 'ue' ? 'UE' : 'Anställd'}</span>
                        <span style={{ fontSize: 11, color: '#888' }}>{Icon.pin} {emp.pin}</span>
                        {emp.phone && <span style={{ fontSize: 11, color: '#888' }}>📞 {emp.phone}</span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 5 }}>
                      <button style={{ padding: '4px 8px', background: 'transparent', border: '0.5px solid rgba(0,0,0,.2)', borderRadius: 8, cursor: 'pointer' }} onClick={() => startEdit(emp)}>{pencilIcon}</button>
                      {emp.role !== 'admin' && <button className="btn-danger" style={{ padding: '4px 8px' }} onClick={() => delEmp(emp.id)}>{Icon.del}</button>}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {view === 'add' && empFormUI(saveEmp, () => { setView('list'); setForm({ name: '', role: 'employee', pin: '', phone: '' }); setPinErr('') }, false)}
            {view === 'edit' && empFormUI(saveEdit, () => { setView('list'); setEditId(null); setForm({ name: '', role: 'employee', pin: '', phone: '' }); setPinErr('') }, true)}
          </div>
        )}

        {section === 'kunder' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 15, fontWeight: 700 }}>{view === 'add' ? 'Ny kund' : view === 'editkund' ? 'Redigera kund' : 'Kundlista'}</div>
              {view === 'list' && <button className="btn-add" onClick={() => { setKundForm({ name: '', contact: '', phone: '', email: '' }); setView('add') }}>{Icon.plus} Lägg till</button>}
            </div>
            {view === 'list' && (
              <div>
                {kunder.length === 0 && <div style={{ fontSize: 13, color: '#888', marginBottom: 10 }}>Inga kunder ännu.</div>}
                {kunder.map(k => (
                  <div key={k.id} className="emp-row">
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: '#E8F0FE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>🏢</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>{k.name}</div>
                      <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>
                        {k.contact && <span>{k.contact}</span>}
                        {k.phone && <span> · 📞 {k.phone}</span>}
                        {k.email && <span> · ✉️ {k.email}</span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 5 }}>
                      <button style={{ padding: '4px 8px', background: 'transparent', border: '0.5px solid rgba(0,0,0,.2)', borderRadius: 8, cursor: 'pointer' }} onClick={() => startEditKund(k)}>{pencilIcon}</button>
                      <button className="btn-danger" style={{ padding: '4px 8px' }} onClick={() => deleteKund(k.id)}>{Icon.del}</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {view === 'add' && kundFormUI(saveKund, () => { setView('list'); setKundForm({ name: '', contact: '', phone: '', email: '' }) })}
            {view === 'editkund' && kundFormUI(saveEditKund, () => { setView('list'); setEditId(null); setKundForm({ name: '', contact: '', phone: '', email: '' }) })}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Home (Anslagstavla) ──────────────────────────────────────
function HomeTab({ ann, addAnn, deleteAnn, sess, isAdmin }) {
  const [showForm, setShowForm] = useState(false)
  const [f, setF] = useState({ title: '', text: '', priority: 'normal', pinned: false, author: sess.name, date: today() })

  const submit = async () => {
    if (!f.title.trim()) return
    await addAnn(f)
    setF({ title: '', text: '', priority: 'normal', pinned: false, author: sess.name, date: today() })
    setShowForm(false)
  }

  const pinned = ann.filter(a => a.pinned)
  const regular = ann.filter(a => !a.pinned)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div><div style={{ fontSize: 15, fontWeight: 700 }}>Anslagstavla</div><div style={{ fontSize: 12, color: '#888', marginTop: 1 }}>Gäller hela koncernen</div></div>
        {isAdmin && !showForm && <button style={{ background: '#1a1a1a', border: 'none', color: '#fff', borderRadius: 8, padding: '7px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }} onClick={() => setShowForm(true)}>+ Nytt anslag</button>}
      </div>

      {isAdmin && showForm && (
        <div className="card" style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Nytt anslag</div>
          <div className="field-group"><div className="field-label">Rubrik *</div><input className="field" placeholder="T.ex. Möte fredag kl 08:00" value={f.title} onChange={e => setF({ ...f, title: e.target.value })} /></div>
          <div className="field-group"><div className="field-label">Text</div><textarea className="field" placeholder="Information till alla i koncernen..." value={f.text} onChange={e => setF({ ...f, text: e.target.value })} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div className="field-group"><div className="field-label">Prioritet</div>
              <select className="field" value={f.priority} onChange={e => setF({ ...f, priority: e.target.value })}>
                <option value="normal">Normal</option><option value="viktig">Viktig</option><option value="bradsk">Brådskande</option>
              </select>
            </div>
            <div className="field-group" style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flex: 1 }}>
                <span style={{ fontSize: 13 }}>Fäst överst</span>
                <div className={`checkbox${f.pinned ? ' checked' : ''}`} style={{ '--accent': '#1a1a1a' }} onClick={() => setF({ ...f, pinned: !f.pinned })}>
                  {f.pinned && <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>✓</span>}
                </div>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-primary" style={{ flex: 1, marginTop: 0, background: '#1a1a1a' }} onClick={submit}>Publicera</button>
            <button className="btn-secondary" style={{ marginTop: 0 }} onClick={() => setShowForm(false)}>Avbryt</button>
          </div>
        </div>
      )}

      {pinned.map(a => (
        <div key={a.id} className="ann-pinned">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div><div className="ann-pinned-title">{Icon.pin} {a.title}</div>{a.text && <div style={{ fontSize: 13, marginTop: 3, lineHeight: 1.5 }}>{a.text}</div>}</div>
            {isAdmin && <button className="btn-danger" style={{ padding: '3px 7px', marginLeft: 8, flexShrink: 0 }} onClick={() => deleteAnn(a.id)}>{Icon.del}</button>}
          </div>
          <div className="ann-meta">{fmt(a.date)} · {a.author}</div>
        </div>
      ))}

      {ann.length === 0 && <div className="empty">Inga anslag ännu.</div>}

      {regular.map(a => (
        <div key={a.id} className="ann-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
                <div className="ann-title">{a.title}</div>
                {a.priority !== 'normal' && <span className={`badge badge-${a.priority}`}>{a.priority === 'viktig' ? 'Viktig' : 'Brådskande'}</span>}
              </div>
              {a.text && <div className="ann-text">{a.text}</div>}
            </div>
            {isAdmin && <button className="btn-danger" style={{ padding: '3px 7px', marginLeft: 8, flexShrink: 0 }} onClick={() => deleteAnn(a.id)}>{Icon.del}</button>}
          </div>
          <div className="ann-meta">{fmt(a.date)} · {a.author}</div>
        </div>
      ))}
    </div>
  )
}

// ─── Bolag Tab ────────────────────────────────────────────────
function BolagTab({ projects, tid, ata, onSelect }) {
  return (
    <div>
      <div className="sec">Välj bolag</div>
      {COMPANIES.map(co => {
        const active = projects.filter(p => p.company === co.id && p.status === 'active').length
        const n = new Date(), m = new Date(n); m.setDate(n.getDate() - n.getDay() + 1)
        const wkH = r1(tid.filter(t => t.company === co.id && t.date >= m.toISOString().slice(0, 10)).reduce((a, t) => a + (t.hours || 0), 0))
        const pend = ata.filter(a => a.company === co.id && a.status === 'pending').length
        return (
          <div key={co.id} className="company-card" style={{ background: co.bg }} onClick={() => onSelect(co.id)}>
            <div className="company-name">{co.name}</div>
            <div className="company-stats">
              <span className="company-stat">{active} aktiva projekt</span>
              {wkH > 0 && <span className="company-stat">· {wkH}h denna vecka</span>}
              {pend > 0 && <span className="company-ata-badge">{pend} ÄTA väntar</span>}
            </div>
            <div className="company-arrow">›</div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Projekt Tab ──────────────────────────────────────────────
function ProjektTab({ co, projects, allProjects, employees, sess, isAdmin, dagbok, tid, ata, files, addProject, updateProject, deleteProject, addAta, updateAta, deleteAta, addFile, deleteFile, setLb, addDagbok, updateDagbok, addTid, deleteDagbok, deleteTid, deleteTidByEntry }) {
  const [view, setView] = useState('list')
  const [selId, setSelId] = useState(null)
  const [ptab, setPtab] = useState('arbetsdag')
  const [form, setForm] = useState({ name: '', client: '', address: '', contact_name: '', contact_email: '', contact_phone: '', start_date: today(), status: 'active', description: '', assigned_to: [] })
  const [editForm, setEditForm] = useState(null)
  const [pdfLoading, setPdfLoading] = useState(false)
  const fRef = useRef()

  const proj = selId ? allProjects.find(p => p.id === selId) : null

  const togAssign = (pId, eId) => {
    const p = allProjects.find(x => x.id === pId)
    const cur = p.assigned_to || []
    updateProject(pId, { assigned_to: cur.includes(eId) ? cur.filter(x => x !== eId) : [...cur, eId] })
  }

  const togAllAssign = (pId) => {
    const p = allProjects.find(x => x.id === pId)
    const allEmpIds = employees.filter(e => e.role !== 'admin').map(e => e.id)
    const cur = p.assigned_to || []
    const allSelected = allEmpIds.every(id => cur.includes(id))
    updateProject(pId, { assigned_to: allSelected ? [] : allEmpIds })
  }

  const startEdit = (p) => {
    setEditForm({ name: p.name, client: p.client || '', address: p.address || '', contact_name: p.contact_name || '', contact_email: p.contact_email || '', contact_phone: p.contact_phone || '', start_date: p.start_date || today(), description: p.description || '' })
    setView('edit')
  }

  const saveEdit = async () => {
    if (!editForm.name.trim()) return
    await updateProject(proj.id, editForm)
    setEditForm(null)
    setView('detail')
  }
  const handleFile = (e, pId) => {
    const file = e.target.files[0]; if (!file) return
    const r = new FileReader(); r.onload = ev => addFile(pId, co.id, { name: file.name, type: file.type, size: file.size, data: ev.target.result, uploaded_at: today(), uploaded_by: sess.name }); r.readAsDataURL(file); e.target.value = ''
  }
  const openFile = f => { if (f.type?.startsWith('image/')) { setLb(f.data); return }; const a = document.createElement('a'); a.href = f.data; a.download = f.name; a.click() }

  if (view === 'summary' && proj) {
    const pD = [...dagbok.filter(d => d.project_id === proj.id)].sort((a, b) => a.date.localeCompare(b.date))
    const pA = ata.filter(a => a.project_id === proj.id)
    const pT = tid.filter(t => t.project_id === proj.id)
    const th = r1(pT.reduce((s, t) => s + (t.hours || 0), 0))
    const byE = {}; pT.forEach(t => { byE[t.employee] = r1((byE[t.employee] || 0) + t.hours) })

    const downloadPDF = async () => {
      setPdfLoading(true)
      try {
        const JsPDF = await loadJsPDF()
        const doc = new JsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
        const pw = 210; const margin = 16; const cw = pw - margin * 2
        let y = margin

        // Header
        doc.setFillColor(26, 26, 26)
        doc.rect(0, 0, pw, 28, 'F')
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(16); doc.setFont('helvetica', 'bold')
        doc.text('BOAG', margin, 12)
        doc.setFontSize(8); doc.setFont('helvetica', 'normal')
        doc.text('KONCERNAPP', margin, 18)
        doc.setFontSize(9)
        doc.text(co.name.toUpperCase(), pw - margin, 12, { align: 'right' })
        doc.text(fmt(today()), pw - margin, 18, { align: 'right' })
        y = 38

        // Project title
        doc.setTextColor(0, 0, 0)
        doc.setFontSize(18); doc.setFont('helvetica', 'bold')
        doc.text(proj.name, margin, y); y += 8
        if (proj.client) { doc.setFontSize(11); doc.setFont('helvetica', 'normal'); doc.setTextColor(100, 100, 100); doc.text(proj.client, margin, y); y += 6 }
        if (proj.contact_name) { doc.setFontSize(10); doc.text(`Kontakt: ${proj.contact_name}${proj.contact_phone ? ' · ' + proj.contact_phone : ''}`, margin, y); y += 5 }
        y += 4

        // Stats row
        const stats = [{ l: 'Timmar', v: th + 'h' }, { l: 'Dagbok', v: String(pD.length) }, { l: 'ÄTA', v: String(pA.length) }, { l: 'Filer', v: String((files[proj.id] || []).length) }]
        const sw = cw / 4
        stats.forEach((s, i) => {
          const x = margin + i * sw
          doc.setFillColor(240, 239, 232)
          doc.roundedRect(x, y, sw - 3, 16, 2, 2, 'F')
          doc.setFontSize(8); doc.setTextColor(120, 120, 120); doc.setFont('helvetica', 'normal')
          doc.text(s.l, x + (sw - 3) / 2, y + 5, { align: 'center' })
          doc.setFontSize(14); doc.setTextColor(0, 0, 0); doc.setFont('helvetica', 'bold')
          doc.text(s.v, x + (sw - 3) / 2, y + 12, { align: 'center' })
        })
        y += 22

        const checkPage = (needed = 10) => { if (y + needed > 280) { doc.addPage(); y = margin } }

        // Timmar per person
        if (Object.keys(byE).length > 0) {
          checkPage(20)
          doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(80, 80, 80)
          doc.text('TIMMAR PER PERSON', margin, y); y += 5
          doc.setDrawColor(220, 220, 220); doc.line(margin, y, margin + cw, y); y += 4
          Object.entries(byE).forEach(([emp, hrs]) => {
            checkPage(7)
            doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.setTextColor(0, 0, 0)
            doc.text(emp, margin, y)
            doc.setFont('helvetica', 'bold'); doc.text(hrs + 'h', margin + cw, y, { align: 'right' })
            y += 6
          })
          y += 4
        }

        // Dagbok
        if (pD.length > 0) {
          checkPage(20)
          doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(80, 80, 80)
          doc.text('DAGBOK', margin, y); y += 5
          doc.setDrawColor(220, 220, 220); doc.line(margin, y, margin + cw, y); y += 4
          for (const d of pD) {
            checkPage(14)
            doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(60, 60, 60)
            doc.text(`${fmt(d.date)} · ${d.employee}`, margin, y); y += 5
            doc.setFont('helvetica', 'normal'); doc.setTextColor(0, 0, 0)
            const lines = doc.splitTextToSize(d.text || '', cw)
            lines.forEach(line => { checkPage(5); doc.text(line, margin, y); y += 4.5 })
            if (d.photos && d.photos.length > 0) {
              y += 2
              const imgSize = 38; const gap = 3
              let x = margin
              for (const photoData of d.photos) {
                if (x + imgSize > margin + cw) { x = margin; y += imgSize + gap }
                const yBefore = y
                checkPage(imgSize + gap)
                if (y !== yBefore) x = margin // page broke, restart row
                try {
                  const fmtMatch = photoData.match(/^data:image\/(\w+);/)
                  const imgFmt = fmtMatch ? fmtMatch[1].toUpperCase().replace('JPG', 'JPEG') : 'JPEG'
                  doc.addImage(photoData, imgFmt, x, y, imgSize, imgSize)
                } catch (e) { console.error('Image error', e) }
                x += imgSize + gap
              }
              y += imgSize + gap + 2
            }
            y += 3
          }
          y += 2
        }

        // ÄTA
        if (pA.length > 0) {
          checkPage(20)
          doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(80, 80, 80)
          doc.text('ÄTA-LISTA', margin, y); y += 5
          doc.setDrawColor(220, 220, 220); doc.line(margin, y, margin + cw, y); y += 4
          pA.forEach(a => {
            checkPage(14)
            const statusTxt = a.status === 'approved' ? 'Godkänd' : a.status === 'rejected' ? 'Avvisad' : 'Väntar'
            doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(60, 60, 60)
            doc.text(`${fmt(a.created_at)} · ${a.employee}`, margin, y)
            doc.setTextColor(a.status === 'approved' ? 26 : a.status === 'rejected' ? 163 : 184, a.status === 'approved' ? 122 : a.status === 'rejected' ? 45 : 75, a.status === 'approved' ? 60 : a.status === 'rejected' ? 45 : 18)
            doc.text(statusTxt, margin + cw, y, { align: 'right' }); y += 5
            doc.setFont('helvetica', 'normal'); doc.setTextColor(0, 0, 0)
            const lines = doc.splitTextToSize(a.description || '', cw)
            lines.forEach(line => { checkPage(5); doc.text(line, margin, y); y += 4.5 })
            if (a.hours > 0 || a.material) { doc.setTextColor(120, 120, 120); doc.text(`${a.hours > 0 ? a.hours + 'h ' : ''}${a.material || ''}`, margin, y); y += 4.5 }
            y += 3
          })
        }

        // Footer
        const pages = doc.getNumberOfPages()
        for (let i = 1; i <= pages; i++) {
          doc.setPage(i)
          doc.setFontSize(8); doc.setTextColor(160, 160, 160)
          doc.text(`BOAG Koncernapp · Genererad ${fmt(today())}`, margin, 292)
          doc.text(`${i} / ${pages}`, pw - margin, 292, { align: 'right' })
        }

        doc.save(`${proj.name.replace(/\s+/g, '_')}_sammanstallning.pdf`)
      } catch (e) { console.error(e); alert('Kunde inte generera PDF') }
      setPdfLoading(false)
    }

    return (
      <div>
        <button className="btn-back" onClick={() => setView('detail')}>{Icon.back} Tillbaka</button>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <button className="btn-primary" style={{ marginTop: 0, background: '#1a1a1a', display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }} onClick={downloadPDF} disabled={pdfLoading}>
            {pdfLoading ? '⏳ Genererar...' : '⬇ Ladda ned PDF'}
          </button>
        </div>
        <div className="summary-wrap">
          <div className="summary-header">
            <img src={boagLogo} style={{ height: 20, width: 'auto', marginBottom: 6 }} alt="BOAG" />
            <div style={{ fontSize: 10, fontWeight: 700, color: co.color, letterSpacing: .5, marginBottom: 4 }}>{co.name.toUpperCase()}</div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>{proj.name}</div>
            {proj.client && <div style={{ fontSize: 13, color: '#888', marginTop: 2 }}>{proj.client}</div>}
            <div style={{ fontSize: 11, color: '#aaa', marginTop: 3 }}>Dagbokssammanställning · {fmt(today())}</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
            {[{ l: 'Timmar', v: th + 'h' }, { l: 'Dagbok', v: pD.length }, { l: 'ÄTA', v: pA.length }, { l: 'Filer', v: (files[proj.id] || []).length }].map(({ l, v }) => (
              <div key={l} style={{ background: '#F0EFE8', borderRadius: 8, padding: '9px 11px' }}><div style={{ fontSize: 11, color: '#888' }}>{l}</div><div style={{ fontSize: 18, fontWeight: 700 }}>{v}</div></div>
            ))}
          </div>
          {Object.keys(byE).length > 0 && <div style={{ marginBottom: 14 }}><div className="sec">Timmar per person</div><div className="card" style={{ padding: '4px 12px' }}>{Object.entries(byE).map(([emp, hrs]) => <div key={emp} className="summary-row"><span>{emp}</span><span style={{ fontWeight: 700, color: co.color }}>{hrs}h</span></div>)}</div></div>}
          {pD.length > 0 && <div style={{ marginBottom: 14 }}><div className="sec">Dagbok</div>{pD.map(d => <div key={d.id} className="summary-entry"><div className="summary-date" style={{ color: co.color }}>{fmt(d.date)} · {d.employee}</div><div className="summary-text">{d.text}</div>{d.photos?.length > 0 && <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{d.photos.length} foto(n)</div>}</div>)}</div>}
          {pA.length > 0 && <div style={{ marginBottom: 14 }}><div className="sec">ÄTA-lista</div>{pA.map(a => <div key={a.id} className="summary-entry"><div className="summary-date" style={{ color: co.color, display: 'flex', gap: 7 }}>{fmt(a.created_at)} · {a.employee}<span className={`badge badge-ata-${a.status === 'approved' ? 'a' : a.status === 'rejected' ? 'r' : 'p'}`}>{a.status === 'approved' ? 'Godkänd' : a.status === 'rejected' ? 'Avvisad' : 'Väntar'}</span></div><div className="summary-text">{a.description}</div></div>)}</div>}
          <div style={{ marginTop: 12, padding: '8px', background: '#F0EFE8', borderRadius: 8, fontSize: 11, color: '#888', textAlign: 'center' }}>Genererad {fmt(today())}</div>
        </div>
      </div>
    )
  }

  if (view === 'edit' && proj && editForm) return (
    <div>
      <button className="btn-back" onClick={() => { setView('detail'); setEditForm(null) }}>{Icon.back} Tillbaka</button>
      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>Redigera projekt</div>
      <div className="field-group"><div className="field-label">Projektnamn *</div><input className="field" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} /></div>
      <div className="field-group"><div className="field-label">Beställare</div><input className="field" value={editForm.client} onChange={e => setEditForm({ ...editForm, client: e.target.value })} /></div>
      <div className="field-group"><div className="field-label">Adress</div><input className="field" placeholder="T.ex. Mölndalsvägen 45, Göteborg" value={editForm.address} onChange={e => setEditForm({ ...editForm, address: e.target.value })} /></div>
      <div className="field-group"><div className="field-label">Beskrivning</div><textarea className="field" value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} /></div>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#888', marginBottom: 6 }}>KONTAKTPERSON</div>
      <div className="field-group"><div className="field-label">Namn</div><input className="field" value={editForm.contact_name} onChange={e => setEditForm({ ...editForm, contact_name: e.target.value })} /></div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div className="field-group"><div className="field-label">Telefon</div><input className="field" type="tel" value={editForm.contact_phone} onChange={e => setEditForm({ ...editForm, contact_phone: e.target.value })} /></div>
        <div className="field-group"><div className="field-label">E-post</div><input className="field" type="email" value={editForm.contact_email} onChange={e => setEditForm({ ...editForm, contact_email: e.target.value })} /></div>
      </div>
      <div className="field-group"><div className="field-label">Startdatum</div><input className="field" type="date" value={editForm.start_date} onChange={e => setEditForm({ ...editForm, start_date: e.target.value })} /></div>
      <button className="btn-primary" style={{ background: co.color }} onClick={saveEdit}>Spara ändringar</button>
    </div>
  )

  if (view === 'detail' && proj) {
    const pFiles = files[proj.id] || []
    const pAta = ata.filter(a => a.project_id === proj.id)
    const pTid = tid.filter(t => t.project_id === proj.id)
    const pDag = dagbok.filter(d => d.project_id === proj.id)
    const pendA = pAta.filter(a => a.status === 'pending').length
    const aEmps = employees.filter(e => (proj.assigned_to || []).includes(e.id))
    return (
      <div>
        <button className="btn-back" onClick={() => setView('list')}>{Icon.back} Alla projekt</button>
        <div className="card" style={{ marginBottom: 10 }}>
          <div className="card-row"><div className="proj-name">{proj.name}</div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
              <span className={`badge badge-${proj.status === 'active' ? 'active' : proj.status === 'plan' ? 'plan' : 'done'}`}>{proj.status === 'active' ? 'Pågående' : proj.status === 'plan' ? 'Planerad' : 'Avslutat'}</span>
              {isAdmin && <select style={{ fontSize: 11, border: '0.5px solid rgba(0,0,0,.2)', borderRadius: 6, padding: '3px 6px', background: '#fff', fontFamily: 'inherit', cursor: 'pointer' }} value={proj.status} onChange={e => updateProject(proj.id, { status: e.target.value })}>
                <option value="plan">Planerad</option>
                <option value="active">Pågående</option>
                <option value="done">Avslutat</option>
              </select>}
            </div>
          </div>
          {proj.client && <div className="proj-sub">{proj.client}</div>}
          {proj.address && <div style={{ fontSize: 13, color: '#888', marginTop: 3 }}>📍 {proj.address}</div>}
          {proj.description && <div style={{ fontSize: 13, color: '#1a1a1a', marginTop: 8, lineHeight: 1.5 }}>{proj.description}</div>}
          {(proj.contact_name || proj.contact_email || proj.contact_phone) && (
            <div style={{ background: '#F0EFE8', borderRadius: 8, padding: '8px 10px', marginTop: 8 }}>
              <div style={{ fontSize: 11, color: '#888', fontWeight: 600, marginBottom: 4 }}>KONTAKTPERSON</div>
              {proj.contact_name && <div style={{ fontSize: 13, fontWeight: 600 }}>{proj.contact_name}</div>}
              <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                {proj.contact_phone && <a href={`tel:${proj.contact_phone}`} style={{ fontSize: 12, color: '#1a6ab5', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3 }}>📞 {proj.contact_phone}</a>}
                {proj.contact_email && <a href={`mailto:${proj.contact_email}`} style={{ fontSize: 12, color: '#1a6ab5', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3 }}>✉️ {proj.contact_email}</a>}
              </div>
            </div>
          )}
          <div className="divider" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 13 }}>
            <div><div className="field-label">Start</div>{fmt(proj.start_date)}</div>
            <div><div className="field-label">Tim / poster</div><span style={{ color: co.color, fontWeight: 700 }}>{r1(pTid.reduce((s, t) => s + (t.hours || 0), 0))}h · {pDag.length} poster</span></div>
          </div>
          {aEmps.length > 0 && <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 8 }}>{aEmps.map(e => <div key={e.id} className="tag">{ini(e.name)} {e.name.split(' ')[0]}</div>)}</div>}
          {isAdmin && <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
            <button className="btn-secondary" style={{ fontSize: 12, padding: '5px 10px' }} onClick={() => setView('summary')}>{Icon.prt} Sammanställning</button>
            <button className="btn-secondary" style={{ fontSize: 12, padding: '5px 10px' }} onClick={() => startEdit(proj)}>✏️ Redigera projekt</button>
          </div>}
        </div>
        <div className="sub-tabs">
          {[{ k: 'arbetsdag', l: 'Arbetsdag' }, { k: 'info', l: 'Info' }, { k: 'filer', l: `Filer${pFiles.length > 0 ? ` (${pFiles.length})` : ''}` }, { k: 'ata', l: `ÄTA${pendA > 0 ? ' ●' : ''}` }, ...(isAdmin ? [{ k: 'ekonomi', l: 'Ekonomi' }] : [])].map(t => <button key={t.k} className={`sub-tab${ptab === t.k ? ' active' : ''}`} onClick={() => setPtab(t.k)}>{t.l}</button>)}
        </div>
        {ptab === 'arbetsdag' && <ProjektArbetsdagPanel proj={proj} co={co} dagbok={pDag} tid={pTid} employees={employees} sess={sess} isAdmin={isAdmin} addDagbok={addDagbok} updateDagbok={updateDagbok} addTid={addTid} deleteDagbok={deleteDagbok} deleteTid={deleteTid} deleteTidByEntry={deleteTidByEntry} setLb={setLb} />}
        {ptab === 'info' && isAdmin && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <div className="sec" style={{ marginBottom: 0 }}>Tilldelade anställda</div>
              <button onClick={() => togAllAssign(proj.id)} style={{ fontSize: 11, color: co.color, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
                {employees.filter(e => e.role !== 'admin').every(e => (proj.assigned_to || []).includes(e.id)) ? 'Avmarkera alla' : 'Välj alla'}
              </button>
            </div>
            <div className="card" style={{ padding: '4px 12px' }}>
              {employees.filter(e => e.role !== 'admin').map(emp => {
                const on = (proj.assigned_to || []).includes(emp.id)
                return (
                  <div key={emp.id} className="toggle-row">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="avatar av-emp-light" style={{ width: 28, height: 28, fontSize: 11 }}>{ini(emp.name)}</div>
                      <span style={{ fontSize: 14 }}>{emp.name}</span>
                    </div>
                    <div className={`checkbox${on ? ' checked' : ''}`} onClick={() => togAssign(proj.id, emp.id)}>{on && <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>✓</span>}</div>
                  </div>
                )
              })}
            </div>
            <button className="btn-danger" style={{ width: '100%', padding: 8, marginTop: 12 }} onClick={() => { deleteProject(proj.id); setView('list') }}>{Icon.del} Ta bort projekt</button>
          </div>
        )}
        {ptab === 'filer' && (
          <div className="card" style={{ padding: '8px 12px' }}>
            {pFiles.length === 0 && <div style={{ fontSize: 13, color: '#888', padding: '6px 0' }}>Inga filer uppladdade</div>}
            {pFiles.map(f => {
              const fi = fileInfo(f.type)
              return (
                <div key={f.id} className="file-row">
                  <div className="file-icon" style={{ background: fi.bg }}>{fi.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</div>
                    <div style={{ fontSize: 11, color: '#888' }}>{fmt(f.uploaded_at)} · {fmtSz(f.size)}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 5 }}>
                    <button className="btn-orange" onClick={() => openFile(f)}>{f.type?.startsWith('image/') ? 'Visa' : 'Hämta'}</button>
                    {isAdmin && <button className="btn-danger" onClick={() => deleteFile(proj.id, f.id)}>{Icon.del}</button>}
                  </div>
                </div>
              )
            })}
            {isAdmin && (
              <>
                <input type="file" ref={fRef} style={{ display: 'none' }} accept="image/*,.pdf,.doc,.docx,.dwg,.xlsx" onChange={e => handleFile(e, proj.id)} />
                <button className="upload-btn" style={{ marginTop: 8 }} onClick={() => fRef.current.click()}>{Icon.up} Ladda upp (ritning, PDF, bild...)</button>
              </>
            )}
          </div>
        )}
        {ptab === 'ata' && <AtaPanel pAta={pAta} isAdmin={isAdmin} sess={sess} projId={proj.id} company={co.id} addAta={addAta} updateAta={updateAta} deleteAta={deleteAta} />}
        {ptab === 'ekonomi' && isAdmin && <EkonomiPanel projId={proj.id} co={co} pTid={pTid} />}
      </div>
    )
  }

  if (view === 'add') return (
    <div>
      <button className="btn-back" onClick={() => setView('list')}>{Icon.back} Tillbaka</button>
      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>Nytt projekt — {co.name}</div>
      {['name', 'client'].map(k => <div key={k} className="field-group"><div className="field-label">{k === 'name' ? 'Projektnamn *' : 'Beställare'}</div><input className="field" placeholder={k === 'name' ? 'T.ex. VA Mölndals väg' : 'Kund / beställare'} value={form[k]} onChange={e => setForm({ ...form, [k]: e.target.value })} /></div>)}
      <div className="field-group"><div className="field-label">Adress</div><input className="field" placeholder="T.ex. Mölndalsvägen 45, Göteborg" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
      <div style={{ background: '#F0EFE8', borderRadius: 10, padding: '10px 12px', marginBottom: 10 }}>
        <div style={{ fontSize: 12, color: '#888', marginBottom: 8, fontWeight: 600 }}>KONTAKTPERSON</div>
        <div className="field-group" style={{ marginBottom: 8 }}><div className="field-label">Namn</div><input className="field" placeholder="T.ex. Anna Lindström" value={form.contact_name} onChange={e => setForm({ ...form, contact_name: e.target.value })} /></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div className="field-group" style={{ marginBottom: 0 }}><div className="field-label">E-post</div><input className="field" type="email" placeholder="anna@foretag.se" value={form.contact_email} onChange={e => setForm({ ...form, contact_email: e.target.value })} /></div>
          <div className="field-group" style={{ marginBottom: 0 }}><div className="field-label">Telefon</div><input className="field" type="tel" placeholder="070-000 00 00" value={form.contact_phone} onChange={e => setForm({ ...form, contact_phone: e.target.value })} /></div>
        </div>
      </div>
      <div className="field-group"><div className="field-label">Startdatum</div><input className="field" type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} /></div>
      <div className="field-group"><div className="field-label">Status</div>
        <select className="field" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
          <option value="plan">Planerad</option><option value="active">Pågående</option><option value="done">Avslutat</option>
        </select>
      </div>
      <div className="field-group">
        <div className="field-label">Tilldelade anställda</div>
        <div className="card" style={{ padding: '4px 12px' }}>
          {employees.filter(e => e.role !== 'admin').map(emp => {
            const on = (form.assigned_to || []).includes(emp.id)
            return <div key={emp.id} className="toggle-row"><span style={{ fontSize: 14 }}>{emp.name}</span><div className={`checkbox${on ? ' checked' : ''}`} onClick={() => setForm({ ...form, assigned_to: on ? form.assigned_to.filter(x => x !== emp.id) : [...form.assigned_to, emp.id] })}>{on && <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>✓</span>}</div></div>
          })}
        </div>
      </div>
      <div className="field-group"><div className="field-label">Beskrivning</div><textarea className="field" placeholder="Kort beskrivning..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
      <button className="btn-primary" onClick={async () => { if (!form.name.trim()) return; await addProject({ ...form, company: co.id }); setForm({ name: '', client: '', address: '', contact_name: '', contact_email: '', contact_phone: '', start_date: today(), status: 'active', description: '', assigned_to: [] }); setView('list') }}>Skapa projekt</button>
    </div>
  )

  const gr = { active: projects.filter(p => p.status === 'active'), plan: projects.filter(p => p.status === 'plan'), done: projects.filter(p => p.status === 'done') }
  return (
    <div>
      {Object.entries({ active: 'Pågående', plan: 'Planerade', done: 'Avslutade' }).map(([k, l]) =>
        gr[k].length > 0 && (
          <div key={k}>
            <div className="sec">{l} projekt</div>
            {gr[k].map(p => {
              const ae = employees.filter(e => (p.assigned_to || []).includes(e.id))
              const pa = ata.filter(a => a.project_id === p.id && a.status === 'pending').length
              return (
                <div key={p.id} className="card" style={{ cursor: 'pointer' }} onClick={() => { setSelId(p.id); setPtab('arbetsdag'); setView('detail') }}>
                  <div className="card-row">
                    <div style={{ flex: 1 }}>
                      <div className="proj-name">{p.name}</div>
                      <div className="proj-sub">{p.client || '—'}</div>
                      {ae.length > 0 && <div style={{ display: 'flex', gap: 4, marginTop: 5, flexWrap: 'wrap' }}>{ae.map(e => <span key={e.id} className="tag" style={{ fontSize: 11 }}>{ini(e.name)}</span>)}</div>}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5 }}>
                      <span className={`badge badge-${p.status === 'active' ? 'active' : p.status === 'plan' ? 'plan' : 'done'}`}>{p.status === 'active' ? 'Pågående' : p.status === 'plan' ? 'Planerad' : 'Avslutat'}</span>
                      {pa > 0 && <span style={{ fontSize: 11, color: '#B84B12', fontWeight: 700 }}>{pa} ÄTA</span>}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )
      )}
      {projects.length === 0 && <div className="empty">Inga projekt för {co.name} ännu.</div>}
      {isAdmin && <button className="btn-primary" style={{ marginTop: 8 }} onClick={() => setView('add')}>+ Nytt projekt</button>}
    </div>
  )
}

// ─── ÄTA Panel ────────────────────────────────────────────────
// ─── Ekonomi Panel (per projekt) ──────────────────────────────
const FAKTURA_STATUS = [
  { k: 'skickad', l: 'Skickad', color: '#1a6ab5', bg: '#EFF6FF' },
  { k: 'betald', l: 'Betald', color: '#1a7a3c', bg: '#ECFDF5' },
  { k: 'forfallen', l: 'Förfallen', color: '#a32d2d', bg: '#FEF2F2' },
]

function EkonomiPanel({ projId, co, pTid }) {
  const [fakturor, setFakturor] = useState([])
  const [plan, setPlan] = useState([])
  const [levFakturor, setLevFakturor] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [section, setSection] = useState('fakturor')
  const [view, setView] = useState('list')
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState({ fakturanummer: '', datum: today(), belopp: '', beskrivning: '', status: 'skickad' })
  const [planForm, setPlanForm] = useState({ beskrivning: '', planerat_datum: today(), planerat_belopp: '' })
  const [planEditId, setPlanEditId] = useState(null)
  const [levForm, setLevForm] = useState({ leverantor: '', fakturanummer: '', datum: today(), belopp: '', beskrivning: '', status: 'obetald', bild_data: null })
  const [levEditId, setLevEditId] = useState(null)
  const [levScanning, setLevScanning] = useState(false)
  const levFileRef = useRef()

  useEffect(() => {
    Promise.all([
      supabase.from('projektfaktura').select('*').eq('project_id', projId).order('datum', { ascending: false }),
      supabase.from('betalningsplan').select('*').eq('project_id', projId).order('planerat_datum', { ascending: true }),
      supabase.from('leverantorsfaktura').select('*').eq('project_id', projId).order('datum', { ascending: false }),
    ]).then(([f, p, l]) => { setFakturor(f.data || []); setPlan(p.data || []); setLevFakturor(l.data || []); setLoaded(true) })
  }, [projId])

  // ── Fakturor ──
  const save = async () => {
    if (!form.beskrivning.trim() || !form.belopp) return
    if (editId) {
      await supabase.from('projektfaktura').update({ ...form, belopp: parseFloat(form.belopp) || 0 }).eq('id', editId)
      setFakturor(f => f.map(x => x.id === editId ? { ...x, ...form, belopp: parseFloat(form.belopp) || 0 } : x))
    } else {
      const row = { id: uid(), project_id: projId, ...form, belopp: parseFloat(form.belopp) || 0, created_at: new Date().toISOString() }
      await supabase.from('projektfaktura').insert(row)
      setFakturor(f => [row, ...f])
    }
    setForm({ fakturanummer: '', datum: today(), belopp: '', beskrivning: '', status: 'skickad' })
    setEditId(null); setView('list')
  }
  const del = async (id) => { await supabase.from('projektfaktura').delete().eq('id', id); setFakturor(f => f.filter(x => x.id !== id)) }
  const startEdit = (f) => { setForm({ fakturanummer: f.fakturanummer || '', datum: f.datum, belopp: String(f.belopp), beskrivning: f.beskrivning, status: f.status }); setEditId(f.id); setView('form') }

  // ── Betalningsplan ──
  const savePlan = async () => {
    if (!planForm.beskrivning.trim()) return
    if (planEditId) {
      await supabase.from('betalningsplan').update({ ...planForm, planerat_belopp: parseFloat(planForm.planerat_belopp) || 0 }).eq('id', planEditId)
      setPlan(p => p.map(x => x.id === planEditId ? { ...x, ...planForm, planerat_belopp: parseFloat(planForm.planerat_belopp) || 0 } : x).sort((a, b) => a.planerat_datum.localeCompare(b.planerat_datum)))
    } else {
      const row = { id: uid(), project_id: projId, ...planForm, planerat_belopp: parseFloat(planForm.planerat_belopp) || 0, fakturerad: false, created_at: new Date().toISOString() }
      await supabase.from('betalningsplan').insert(row)
      setPlan(p => [...p, row].sort((a, b) => a.planerat_datum.localeCompare(b.planerat_datum)))
    }
    setPlanForm({ beskrivning: '', planerat_datum: today(), planerat_belopp: '' })
    setPlanEditId(null); setView('list')
  }
  const togPlanKlar = async (item) => {
    await supabase.from('betalningsplan').update({ fakturerad: !item.fakturerad }).eq('id', item.id)
    setPlan(p => p.map(x => x.id === item.id ? { ...x, fakturerad: !x.fakturerad } : x))
  }
  const delPlan = async (id) => { await supabase.from('betalningsplan').delete().eq('id', id); setPlan(p => p.filter(x => x.id !== id)) }
  const startEditPlan = (item) => { setPlanForm({ beskrivning: item.beskrivning, planerat_datum: item.planerat_datum, planerat_belopp: String(item.planerat_belopp) }); setPlanEditId(item.id); setView('planform') }

  // ── Leverantörsfakturor ──
  const handleLevFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const isPdf = file.type === 'application/pdf'
    const r = new FileReader()
    r.onload = async (ev) => {
      const base64Data = ev.target.result.split(',')[1]
      setLevForm(f => ({ ...f, bild_data: ev.target.result }))
      setLevScanning(true)
      try {
        const res = await fetch('/api/scan-invoice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ base64Data, mediaType: file.type, isPdf })
        })
        const parsed = await res.json()
        if (!res.ok || !parsed.success) throw new Error(parsed.error || 'Kunde inte läsa fakturan')
        setLevForm(f => ({ ...f, leverantor: parsed.leverantor || '', fakturanummer: parsed.fakturanummer || '', datum: parsed.datum || today(), belopp: String(parsed.belopp || ''), beskrivning: parsed.beskrivning || '' }))
      } catch (err) {
        console.error(err)
        alert('Kunde inte läsa av fakturan automatiskt. Fyll i uppgifterna manuellt.')
      }
      setLevScanning(false)
    }
    r.readAsDataURL(file)
    e.target.value = ''
  }

  const saveLev = async () => {
    if (!levForm.leverantor.trim() || !levForm.belopp) return
    if (levEditId) {
      await supabase.from('leverantorsfaktura').update({ ...levForm, belopp: parseFloat(levForm.belopp) || 0 }).eq('id', levEditId)
      setLevFakturor(l => l.map(x => x.id === levEditId ? { ...x, ...levForm, belopp: parseFloat(levForm.belopp) || 0 } : x))
    } else {
      const row = { id: uid(), project_id: projId, ...levForm, belopp: parseFloat(levForm.belopp) || 0, created_at: new Date().toISOString() }
      await supabase.from('leverantorsfaktura').insert(row)
      setLevFakturor(l => [row, ...l])
    }
    setLevForm({ leverantor: '', fakturanummer: '', datum: today(), belopp: '', beskrivning: '', status: 'obetald', bild_data: null })
    setLevEditId(null); setView('list')
  }
  const delLev = async (id) => { await supabase.from('leverantorsfaktura').delete().eq('id', id); setLevFakturor(l => l.filter(x => x.id !== id)) }
  const startEditLev = (f) => { setLevForm({ leverantor: f.leverantor, fakturanummer: f.fakturanummer || '', datum: f.datum, belopp: String(f.belopp), beskrivning: f.beskrivning || '', status: f.status, bild_data: f.bild_data || null }); setLevEditId(f.id); setView('levform') }
  const togLevBetald = async (item) => {
    const newStatus = item.status === 'betald' ? 'obetald' : 'betald'
    await supabase.from('leverantorsfaktura').update({ status: newStatus }).eq('id', item.id)
    setLevFakturor(l => l.map(x => x.id === item.id ? { ...x, status: newStatus } : x))
  }

  const totaltFakt = fakturor.reduce((s, f) => s + (f.belopp || 0), 0)
  const betalt = fakturor.filter(f => f.status === 'betald').reduce((s, f) => s + (f.belopp || 0), 0)
  const obetalt = totaltFakt - betalt
  const totalTimmar = r1(pTid.reduce((s, t) => s + (t.hours || 0), 0))
  const nastaPlan = plan.filter(p => !p.fakturerad).sort((a, b) => a.planerat_datum.localeCompare(b.planerat_datum))[0]
  const planeratTotalt = plan.reduce((s, p) => s + (p.planerat_belopp || 0), 0)
  const totaltLevKostnad = levFakturor.reduce((s, f) => s + (f.belopp || 0), 0)
  const levObetalt = levFakturor.filter(f => f.status === 'obetald').reduce((s, f) => s + (f.belopp || 0), 0)
  const resultat = totaltFakt - totaltLevKostnad

  if (!loaded) return <div className="empty">Laddar...</div>

  if (view === 'form') return (
    <div>
      <button className="btn-back" onClick={() => { setView('list'); setEditId(null); setForm({ fakturanummer: '', datum: today(), belopp: '', beskrivning: '', status: 'skickad' }) }}>{Icon.back} Tillbaka</button>
      <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>{editId ? 'Redigera faktura' : 'Ny faktura'}</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div className="field-group"><div className="field-label">Fakturanummer</div><input className="field" placeholder="T.ex. 2026-0142" value={form.fakturanummer} onChange={e => setForm({ ...form, fakturanummer: e.target.value })} /></div>
        <div className="field-group"><div className="field-label">Datum</div><input className="field" type="date" value={form.datum} onChange={e => setForm({ ...form, datum: e.target.value })} /></div>
      </div>
      <div className="field-group"><div className="field-label">Belopp (kr) *</div><input className="field" type="number" placeholder="0" value={form.belopp} onChange={e => setForm({ ...form, belopp: e.target.value })} /></div>
      <div className="field-group"><div className="field-label">Vad faktureras? *</div><textarea className="field" rows={3} placeholder="T.ex. Etapp 1 — schaktarbete och ledningsdragning" value={form.beskrivning} onChange={e => setForm({ ...form, beskrivning: e.target.value })} /></div>
      <div className="field-group"><div className="field-label">Status</div>
        <div className="chip-group">{FAKTURA_STATUS.map(s => <div key={s.k} className={`chip${form.status === s.k ? ' selected' : ''}`} style={form.status === s.k ? { background: s.color, borderColor: s.color } : {}} onClick={() => setForm({ ...form, status: s.k })}>{s.l}</div>)}</div>
      </div>
      <button className="btn-primary" style={{ background: co.color }} onClick={save} disabled={!form.beskrivning.trim() || !form.belopp}>{editId ? 'Spara ändringar' : 'Lägg till faktura'}</button>
    </div>
  )

  if (view === 'levform') return (
    <div>
      <button className="btn-back" onClick={() => { setView('list'); setLevEditId(null); setLevForm({ leverantor: '', fakturanummer: '', datum: today(), belopp: '', beskrivning: '', status: 'obetald', bild_data: null }) }}>{Icon.back} Tillbaka</button>
      <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>{levEditId ? 'Redigera leverantörsfaktura' : 'Ny leverantörsfaktura'}</div>

      {!levEditId && (
        <div onClick={() => levFileRef.current?.click()} style={{ border: '1.5px dashed rgba(0,0,0,.2)', borderRadius: 10, padding: 18, textAlign: 'center', cursor: 'pointer', marginBottom: 14, background: '#FAFAF8' }}>
          {levScanning ? (
            <div style={{ fontSize: 13, color: '#888' }}>⏳ Läser av fakturan...</div>
          ) : levForm.bild_data ? (
            <div>
              {levForm.bild_data.startsWith('data:application/pdf') ? (
                <div style={{ fontSize: 32, marginBottom: 4 }}>📄</div>
              ) : (
                <img src={levForm.bild_data} style={{ maxHeight: 120, borderRadius: 6, marginBottom: 6 }} />
              )}
              <div style={{ fontSize: 12, color: levForm.leverantor ? '#1a7a3c' : '#B84B12' }}>{levForm.leverantor ? '✓ Faktura inläst — kontrollera uppgifterna nedan' : 'Bild uppladdad — fyll i uppgifterna manuellt nedan'}</div>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: 24, marginBottom: 4 }}>📷</div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Fota eller välj fakturabild</div>
              <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>Läser av leverantör, belopp och datum automatiskt</div>
            </div>
          )}
          <input ref={levFileRef} type="file" accept="image/*,.pdf" onChange={handleLevFile} style={{ display: 'none' }} />
        </div>
      )}

      <div className="field-group"><div className="field-label">Leverantör *</div><input className="field" placeholder="T.ex. Swerock AB" value={levForm.leverantor} onChange={e => setLevForm({ ...levForm, leverantor: e.target.value })} /></div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div className="field-group"><div className="field-label">Fakturanummer</div><input className="field" value={levForm.fakturanummer} onChange={e => setLevForm({ ...levForm, fakturanummer: e.target.value })} /></div>
        <div className="field-group"><div className="field-label">Datum</div><input className="field" type="date" value={levForm.datum} onChange={e => setLevForm({ ...levForm, datum: e.target.value })} /></div>
      </div>
      <div className="field-group"><div className="field-label">Belopp (kr) *</div><input className="field" type="number" placeholder="0" value={levForm.belopp} onChange={e => setLevForm({ ...levForm, belopp: e.target.value })} /></div>
      <div className="field-group"><div className="field-label">Vad avser fakturan?</div><textarea className="field" rows={2} placeholder="T.ex. Bärlager 0-32, 60 ton" value={levForm.beskrivning} onChange={e => setLevForm({ ...levForm, beskrivning: e.target.value })} /></div>
      <div className="field-group"><div className="field-label">Status</div>
        <div className="chip-group">
          <div className={`chip${levForm.status === 'obetald' ? ' selected' : ''}`} style={levForm.status === 'obetald' ? { background: '#a32d2d', borderColor: '#a32d2d' } : {}} onClick={() => setLevForm({ ...levForm, status: 'obetald' })}>Obetald</div>
          <div className={`chip${levForm.status === 'betald' ? ' selected' : ''}`} style={levForm.status === 'betald' ? { background: '#1a7a3c', borderColor: '#1a7a3c' } : {}} onClick={() => setLevForm({ ...levForm, status: 'betald' })}>Betald</div>
        </div>
      </div>
      <button className="btn-primary" style={{ background: co.color }} onClick={saveLev} disabled={!levForm.leverantor.trim() || !levForm.belopp || levScanning}>{levEditId ? 'Spara ändringar' : 'Lägg till faktura'}</button>
    </div>
  )

  if (view === 'planform') return (
    <div>
      <button className="btn-back" onClick={() => { setView('list'); setPlanEditId(null); setPlanForm({ beskrivning: '', planerat_datum: today(), planerat_belopp: '' }) }}>{Icon.back} Tillbaka</button>
      <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>{planEditId ? 'Redigera betalningspost' : 'Ny betalningspost'}</div>
      <div className="field-group"><div className="field-label">Beskrivning *</div><input className="field" placeholder="T.ex. Etapp 2 — Stomresning" value={planForm.beskrivning} onChange={e => setPlanForm({ ...planForm, beskrivning: e.target.value })} /></div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div className="field-group"><div className="field-label">Planerat datum</div><input className="field" type="date" value={planForm.planerat_datum} onChange={e => setPlanForm({ ...planForm, planerat_datum: e.target.value })} /></div>
        <div className="field-group"><div className="field-label">Planerat belopp (kr)</div><input className="field" type="number" placeholder="0" value={planForm.planerat_belopp} onChange={e => setPlanForm({ ...planForm, planerat_belopp: e.target.value })} /></div>
      </div>
      <button className="btn-primary" style={{ background: co.color }} onClick={savePlan} disabled={!planForm.beskrivning.trim()}>{planEditId ? 'Spara ändringar' : 'Lägg till i betalningsplan'}</button>
    </div>
  )

  return (
    <div>
      <div className="stat-grid" style={{ marginBottom: 10 }}>
        <div className="stat-card"><div className="stat-label">Fakturerat</div><div className="stat-val" style={{ color: co.color, fontSize: 15 }}>{totaltFakt.toLocaleString('sv-SE')} kr</div></div>
        <div className="stat-card"><div className="stat-label">Lev.kostnader</div><div className="stat-val" style={{ fontSize: 15 }}>{totaltLevKostnad.toLocaleString('sv-SE')} kr</div></div>
      </div>
      <div style={{ background: resultat >= 0 ? '#E6F7EE' : '#FEECEC', borderRadius: 10, padding: '10px 14px', marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: resultat >= 0 ? '#1a7a3c' : '#a32d2d' }}>Resultat (fakturerat − lev.kostnader)</span>
        <span style={{ fontSize: 16, fontWeight: 700, color: resultat >= 0 ? '#1a7a3c' : '#a32d2d' }}>{resultat.toLocaleString('sv-SE')} kr</span>
      </div>
      <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#888', marginBottom: 12, flexWrap: 'wrap' }}>
        <span>Betalt till oss: <strong style={{ color: '#1a7a3c' }}>{betalt.toLocaleString('sv-SE')} kr</strong></span>
        <span>Obetalt till oss: <strong style={{ color: '#1a1a1a' }}>{obetalt.toLocaleString('sv-SE')} kr</strong></span>
        {levObetalt > 0 && <span>Vi ska betala: <strong style={{ color: '#a32d2d' }}>{levObetalt.toLocaleString('sv-SE')} kr</strong></span>}
        {totalTimmar > 0 && <span>Snitt/timme: <strong style={{ color: '#1a1a1a' }}>{Math.round(totaltFakt / totalTimmar).toLocaleString('sv-SE')} kr</strong></span>}
      </div>

      {nastaPlan && (
        <div style={{ background: '#FEF0E6', border: '1px solid #E05D1A33', borderRadius: 10, padding: '10px 14px', marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#B84B12', textTransform: 'uppercase' }}>📅 Nästa faktura</div>
          <div style={{ fontSize: 14, fontWeight: 600, marginTop: 3 }}>{nastaPlan.beskrivning}</div>
          <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{fmt(nastaPlan.planerat_datum)}{nastaPlan.planerat_belopp > 0 ? ' · ' + nastaPlan.planerat_belopp.toLocaleString('sv-SE') + ' kr' : ''}</div>
        </div>
      )}

      <div style={{ display: 'flex', background: '#F0EFE8', borderRadius: 10, padding: 3, gap: 2, marginBottom: 12 }}>
        {[{ k: 'fakturor', l: `Fakturor (${fakturor.length})` }, { k: 'lev', l: `Lev.fakturor (${levFakturor.length})` }, { k: 'plan', l: `Betalningsplan (${plan.length})` }].map(s => (
          <button key={s.k} onClick={() => setSection(s.k)} style={{ flex: 1, padding: '8px 4px', border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', background: section === s.k ? '#fff' : 'transparent', color: section === s.k ? '#1a1a1a' : '#888' }}>{s.l}</button>
        ))}
      </div>

      {section === 'fakturor' && (
        <div>
          <button className="btn-primary" style={{ background: co.color, marginBottom: 12 }} onClick={() => setView('form')}>+ Lägg till faktura</button>
          {fakturor.length === 0 && <div className="empty">Inga fakturor registrerade ännu.</div>}
          {fakturor.map(f => {
            const st = FAKTURA_STATUS.find(s => s.k === f.status)
            return (
              <div key={f.id} className="card" style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: '#888' }}>{f.fakturanummer ? f.fakturanummer + ' · ' : ''}{fmt(f.datum)}</div>
                    <div style={{ fontSize: 13, marginTop: 4 }}>{f.beskrivning}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5, marginLeft: 8 }}>
                    <div style={{ fontSize: 15, fontWeight: 700 }}>{f.belopp.toLocaleString('sv-SE')} kr</div>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 600, background: st?.bg, color: st?.color }}>{st?.l}</span>
                    <div style={{ display: 'flex', gap: 5 }}>
                      <button style={{ padding: '3px 7px', background: 'transparent', border: '0.5px solid rgba(0,0,0,.2)', borderRadius: 6, cursor: 'pointer', fontSize: 12 }} onClick={() => startEdit(f)}>✏️</button>
                      <button className="btn-danger" style={{ padding: '3px 7px' }} onClick={() => del(f.id)}>{Icon.del}</button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {section === 'lev' && (
        <div>
          <button className="btn-primary" style={{ background: co.color, marginBottom: 12 }} onClick={() => setView('levform')}>📷 Lägg till leverantörsfaktura</button>
          {levFakturor.length === 0 && <div className="empty">Inga leverantörsfakturor registrerade ännu.</div>}
          {levFakturor.map(f => (
            <div key={f.id} className="card" style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{f.leverantor}</div>
                  <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{f.fakturanummer ? f.fakturanummer + ' · ' : ''}{fmt(f.datum)}</div>
                  {f.beskrivning && <div style={{ fontSize: 13, marginTop: 4 }}>{f.beskrivning}</div>}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5, marginLeft: 8 }}>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{f.belopp.toLocaleString('sv-SE')} kr</div>
                  <button onClick={() => togLevBetald(f)} style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20, border: 'none', cursor: 'pointer', fontFamily: 'inherit', background: f.status === 'betald' ? '#E6F7EE' : '#FEECEC', color: f.status === 'betald' ? '#1a7a3c' : '#a32d2d' }}>{f.status === 'betald' ? '✓ Betald' : 'Obetald'}</button>
                  <div style={{ display: 'flex', gap: 5 }}>
                    <button style={{ padding: '3px 7px', background: 'transparent', border: '0.5px solid rgba(0,0,0,.2)', borderRadius: 6, cursor: 'pointer', fontSize: 12 }} onClick={() => startEditLev(f)}>✏️</button>
                    <button className="btn-danger" style={{ padding: '3px 7px' }} onClick={() => delLev(f.id)}>{Icon.del}</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {section === 'plan' && (
        <div>
          <button className="btn-primary" style={{ background: co.color, marginBottom: 12 }} onClick={() => setView('planform')}>+ Ny betalningspost</button>
          {planeratTotalt > 0 && <div style={{ fontSize: 12, color: '#888', marginBottom: 10 }}>Totalt planerat: <strong style={{ color: '#1a1a1a' }}>{planeratTotalt.toLocaleString('sv-SE')} kr</strong></div>}
          {plan.length === 0 && <div className="empty">Ingen betalningsplan upplagd ännu.</div>}
          {plan.map(p => (
            <div key={p.id} className="card" style={{ marginBottom: 8, opacity: p.fakturerad ? 0.55 : 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: '#888' }}>{fmt(p.planerat_datum)}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}>{p.beskrivning}</div>
                  {p.planerat_belopp > 0 && <div style={{ fontSize: 13, marginTop: 2 }}>{p.planerat_belopp.toLocaleString('sv-SE')} kr</div>}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5, marginLeft: 8 }}>
                  <button onClick={() => togPlanKlar(p)} style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 20, border: 'none', cursor: 'pointer', fontFamily: 'inherit', background: p.fakturerad ? '#E6F7EE' : '#1a1a1a', color: p.fakturerad ? '#1a7a3c' : '#fff' }}>{p.fakturerad ? '✓ Fakturerad' : 'Markera fakturerad'}</button>
                  <div style={{ display: 'flex', gap: 5 }}>
                    <button style={{ padding: '3px 7px', background: 'transparent', border: '0.5px solid rgba(0,0,0,.2)', borderRadius: 6, cursor: 'pointer', fontSize: 12 }} onClick={() => startEditPlan(p)}>✏️</button>
                    <button className="btn-danger" style={{ padding: '3px 7px' }} onClick={() => delPlan(p.id)}>{Icon.del}</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Arbetsdag Panel (per projekt) ────────────────────────────
function ProjektArbetsdagPanel({ proj, co, dagbok, tid, employees, sess, isAdmin, addDagbok, updateDagbok, addTid, deleteDagbok, deleteTid, deleteTidByEntry, setLb }) {
  const [view, setView] = useState('list')
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState({ date: today(), employee: sess.name, text: '', photos: [], hours: '8.5', description: '', extraPersons: [] })
  const camRef = useRef()
  const galleryRef = useRef()

  const addPhoto = e => {
    const files = Array.from(e.target.files)
    files.forEach(file => {
      const r = new FileReader()
      r.onload = ev => setForm(f => ({ ...f, photos: [...f.photos, ev.target.result] }))
      r.readAsDataURL(file)
    })
    e.target.value = ''
  }
  const removePhoto = i => setForm(f => ({ ...f, photos: f.photos.filter((_, j) => j !== i) }))

  const addExtraPerson = () => setForm(f => ({ ...f, extraPersons: [...f.extraPersons, { name: '', hours: '8.5' }] }))
  const updateExtra = (i, key, val) => setForm(f => { const ep = [...f.extraPersons]; ep[i] = { ...ep[i], [key]: val }; return { ...f, extraPersons: ep } })
  const removeExtra = i => setForm(f => ({ ...f, extraPersons: f.extraPersons.filter((_, j) => j !== i) }))

  const resetForm = () => setForm({ date: today(), employee: sess.name, text: '', photos: [], hours: '8.5', description: '', extraPersons: [] })

  const submit = async () => {
    const entryId = editId || uid()
    if (editId) {
      await updateDagbok(editId, { date: form.date, employee: form.employee, text: form.text, photos: form.photos })
      await deleteTidByEntry(editId)
      // Radera även gamla tid-rader utan entry_id (bakåtkompatibilitet)
      const oldTid = tid.filter(t => !t.entry_id && t.date === form.date && t.project_id === proj.id)
      for (const t of oldTid) { await supabase.from('tid').delete().eq('id', t.id) }
    } else {
      await addDagbok({ id: entryId, project_id: proj.id, company: co.id, date: form.date, employee: form.employee, text: form.text, photos: form.photos })
    }
    if (form.hours) {
      await addTid({ entry_id: entryId, project_id: proj.id, company: co.id, date: form.date, employee: form.employee, hours: parseFloat(form.hours) || 0, description: form.description })
    }
    for (const ep of form.extraPersons) {
      if (ep.name && ep.hours) {
        await addTid({ entry_id: entryId, project_id: proj.id, company: co.id, date: form.date, employee: ep.name, hours: parseFloat(ep.hours) || 0, description: form.description })
      }
    }
    resetForm()
    setEditId(null)
    setView('list')
  }

  const startEdit = (d) => {
    const linked = tid.filter(t => t.entry_id === d.id)
    const fallback = tid.filter(t => !t.entry_id && t.date === d.date && t.project_id === d.project_id)
    const useRows = linked.length > 0 ? linked : fallback
    const main = useRows.find(t => t.employee === d.employee)
    const others = useRows.filter(t => t !== main)
    setForm({
      date: d.date, employee: d.employee, text: d.text || '', photos: d.photos || [],
      hours: main ? String(main.hours) : '', description: main?.description || '',
      extraPersons: others.map(t => ({ name: t.employee, hours: String(t.hours) }))
    })
    setEditId(d.id)
    setView('add')
  }

  const combined = [...dagbok].sort((a, b) => b.date?.localeCompare(a.date))
  const totalH = r1(tid.reduce((s, t) => s + (t.hours || 0), 0))
  const entryHours = (d) => r1(tid.filter(t => t.entry_id === d.id).reduce((s, t) => s + (t.hours || 0), 0))

  if (view === 'add') return (
    <div>
      <button className="btn-back" onClick={() => { setView('list'); setEditId(null); resetForm() }}>{Icon.back} Tillbaka</button>
      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>{editId ? 'Redigera arbetsdag' : 'Ny arbetsdag'} — {proj.name}</div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div className="field-group"><div className="field-label">Datum</div><input className="field" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></div>
        <div className="field-group"><div className="field-label">Utförd av</div>
          {editId
            ? <select className="field" value={form.employee} onChange={e => setForm({ ...form, employee: e.target.value })}>
                {employees.filter(e => e.role !== 'admin').map(e => <option key={e.id} value={e.name}>{e.name}</option>)}
              </select>
            : <input className="field" value={form.employee} readOnly style={{ background: '#F0EFE8' }} />}
        </div>
      </div>

      <div style={{ background: '#F0EFE8', borderRadius: 10, padding: '10px 12px', marginBottom: 10 }}>
        <div style={{ fontSize: 12, color: '#888', fontWeight: 600, marginBottom: 8 }}>TIMMAR</div>
        <div className="hours-row">
          <input className="hours-input" type="number" min="0" max="24" step="0.5" value={form.hours} onChange={e => setForm({ ...form, hours: e.target.value })} />
          <span style={{ fontSize: 13, color: '#888' }}>tim</span>
          {[4, 6, 8, 8.5, 10].map(n => <button key={n} className="btn-secondary" style={{ padding: '4px 7px', fontSize: 12 }} onClick={() => setForm({ ...form, hours: String(n) })}>{n}h</button>)}
        </div>

        {form.extraPersons.map((ep, i) => (
          <div key={i} style={{ display: 'flex', gap: 6, marginTop: 8, alignItems: 'center' }}>
            <select className="field" style={{ flex: 2 }} value={ep.name} onChange={e => updateExtra(i, 'name', e.target.value)}>
              <option value="">Välj kollega...</option>
              {employees.filter(e => e.name !== form.employee && e.role !== 'admin').map(e => <option key={e.id} value={e.name}>{e.name}</option>)}
            </select>
            <input className="hours-input" type="number" min="0" max="24" step="0.5" value={ep.hours} onChange={e => updateExtra(i, 'hours', e.target.value)} style={{ width: 52 }} />
            <span style={{ fontSize: 12, color: '#888' }}>h</span>
            <button className="btn-danger" style={{ padding: '4px 7px' }} onClick={() => removeExtra(i)}>×</button>
          </div>
        ))}
        <button onClick={addExtraPerson} style={{ marginTop: 8, background: 'none', border: '0.5px dashed rgba(0,0,0,.25)', borderRadius: 8, padding: '6px 12px', fontSize: 12, color: '#666', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'inherit' }}>+ Lägg till kollega</button>
      </div>

      <div className="field-group"><div className="field-label">Beskrivning av arbete</div><input className="field" placeholder="Valfritt" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
      <div className="field-group"><div className="field-label">Dagbok</div><textarea className="field" rows={3} placeholder="Vad har gjorts idag..." value={form.text} onChange={e => setForm({ ...form, text: e.target.value })} /></div>

      <div className="field-group">
        <div className="field-label">Foton</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
          {form.photos.map((p, i) => (
            <div key={i} style={{ position: 'relative' }}>
              <img src={p} style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8 }} />
              <button onClick={() => removePhoto(i)} style={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: '50%', background: '#a32d2d', color: '#fff', border: 'none', fontSize: 11, cursor: 'pointer', lineHeight: 1 }}>×</button>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-secondary" style={{ flex: 1, padding: '8px' }} onClick={() => camRef.current?.click()}>📷 Kamera</button>
          <button className="btn-secondary" style={{ flex: 1, padding: '8px' }} onClick={() => galleryRef.current?.click()}>🖼 Galleri</button>
        </div>
        <input type="file" ref={camRef} accept="image/*" capture="environment" style={{ display: 'none' }} onChange={addPhoto} />
        <input type="file" ref={galleryRef} accept="image/*" multiple style={{ display: 'none' }} onChange={addPhoto} />
      </div>

      <button className="btn-primary" style={{ background: co.color }} onClick={submit}>{editId ? 'Spara ändringar' : 'Spara'}</button>
    </div>
  )

  return (
    <div>
      <div className="stat-grid" style={{ marginBottom: 12 }}>
        <div className="stat-card"><div className="stat-label">Timmar i projektet</div><div className="stat-val" style={{ color: co.color, fontSize: 16 }}>{totalH}h</div></div>
        <div className="stat-card"><div className="stat-label">Dagbokposter</div><div className="stat-val" style={{ fontSize: 16 }}>{combined.length}</div></div>
      </div>
      <button className="btn-primary" style={{ background: co.color, marginBottom: 12 }} onClick={() => { resetForm(); setEditId(null); setView('add') }}>+ Ny arbetsdag</button>

      {combined.length === 0 && <div className="empty">Inga dagbokposter ännu.</div>}
      {combined.map(d => {
        const canEdit = isAdmin || d.employee === sess.name
        const h = entryHours(d)
        return (
          <div key={d.id} className="entry-card" style={{ marginBottom: 8 }}>
            <div className="card-row">
              <div>
                <div style={{ fontSize: 12, color: '#888' }}>{fmt(d.date)} · {d.employee}</div>
                {d.text && <div style={{ fontSize: 13, marginTop: 4, whiteSpace: 'pre-wrap' }}>{d.text}</div>}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                {h > 0 && <span style={{ fontSize: 15, fontWeight: 700, color: co.color }}>{h}h</span>}
                {canEdit && (
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button style={{ padding: '3px 6px', background: 'transparent', border: '0.5px solid rgba(0,0,0,.2)', borderRadius: 6, cursor: 'pointer', fontSize: 12 }} onClick={() => startEdit(d)}>✏️</button>
                    <button className="btn-danger" style={{ padding: '3px 6px' }} onClick={() => deleteDagbok(d.id)}>{Icon.del}</button>
                  </div>
                )}
              </div>
            </div>
            {d.photos?.length > 0 && <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>{d.photos.map((p, i) => <img key={i} src={p} style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 6, cursor: 'pointer' }} onClick={() => setLb?.(p)} />)}</div>}
          </div>
        )
      })}
    </div>
  )
}

function AtaPanel({ pAta, isAdmin, sess, projId, company, addAta, updateAta, deleteAta }) {
  const [showForm, setShowForm] = useState(false)
  const [f, setF] = useState({ description: '', date: today(), hours: '', material: '' })
  const submit = async () => {
    if (!f.description.trim()) return
    await addAta({ project_id: projId, company, ...f, hours: parseFloat(f.hours) || 0, employee: sess.name })
    setF({ description: '', date: today(), hours: '', material: '' }); setShowForm(false)
  }
  return (
    <div>
      {pAta.length === 0 && !showForm && <div style={{ fontSize: 13, color: '#888', padding: '8px 0' }}>Inga ÄTA-poster.</div>}
      {pAta.map(a => (
        <div key={a.id} className="ata-card">
          <div className="card-row">
            <div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{a.description}</div>
              <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{fmt(a.created_at)} · {a.employee}</div>
              {(a.hours || a.material) && <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{a.hours > 0 ? a.hours + 'h ' : ''}{a.material ? '· ' + a.material : ''}</div>}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5 }}>
              <span className={`badge badge-ata-${a.status === 'approved' ? 'a' : a.status === 'rejected' ? 'r' : 'p'}`}>{a.status === 'approved' ? 'Godkänd' : a.status === 'rejected' ? 'Avvisad' : 'Väntar'}</span>
              {isAdmin && a.status === 'pending' && <div style={{ display: 'flex', gap: 5 }}><button className="btn-success" style={{ padding: '3px 6px' }} onClick={() => updateAta(a.id, { status: 'approved' })}>{Icon.ok} OK</button><button className="btn-danger" style={{ padding: '3px 6px' }} onClick={() => updateAta(a.id, { status: 'rejected' })}>{Icon.x2}</button></div>}
              {isAdmin && <button className="btn-danger" style={{ padding: '3px 6px' }} onClick={() => deleteAta(a.id)}>{Icon.del}</button>}
            </div>
          </div>
        </div>
      ))}
      {!showForm && <button className="btn-primary" style={{ marginTop: 4 }} onClick={() => setShowForm(true)}>+ Ny ÄTA-post</button>}
      {showForm && (
        <div className="card" style={{ marginTop: 8 }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Ny ÄTA-post</div>
          <div className="field-group"><div className="field-label">Beskrivning *</div><textarea className="field" placeholder="Beskriv ändring/tilläggsarbete..." value={f.description} onChange={e => setF({ ...f, description: e.target.value })} /></div>
          <div className="field-group"><div className="field-label">Datum</div><input className="field" type="date" value={f.date} onChange={e => setF({ ...f, date: e.target.value })} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div className="field-group"><div className="field-label">Timmar</div><input className="field" type="number" min="0" step="0.5" placeholder="0" value={f.hours} onChange={e => setF({ ...f, hours: e.target.value })} /></div>
            <div className="field-group"><div className="field-label">Material/kostnad</div><input className="field" placeholder="T.ex. 2 500 kr" value={f.material} onChange={e => setF({ ...f, material: e.target.value })} /></div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-primary" style={{ flex: 1, marginTop: 0 }} onClick={submit}>Skicka in</button>
            <button className="btn-secondary" style={{ marginTop: 0 }} onClick={() => setShowForm(false)}>Avbryt</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Arbetsdag Tab (Dagbok + Tid kombinerat) ──────────────────
function ArbetsdagTab({ co, projects, dagbok, tid, employees, addDagbok, updateDagbok, deleteDagbok, addTid, deleteTid, deleteTidByEntry, sess, isAdmin, setLb }) {
  const [subTab, setSubTab] = useState('list')
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState({
    project_id: '', date: today(), employee: sess.name,
    text: '', photos: [], hours: '8', description: '',
    extraPersons: [] // [{name, hours}]
  })
  const camRef = useRef()
  const galleryRef = useRef()

  const ap = projects.filter(p => p.status !== 'done')

  const addPhoto = e => {
    const files = Array.from(e.target.files)
    files.forEach(file => {
      const r = new FileReader()
      r.onload = ev => setForm(f => ({ ...f, photos: [...f.photos, ev.target.result] }))
      r.readAsDataURL(file)
    })
    e.target.value = ''
  }

  const addExtraPerson = () => setForm(f => ({ ...f, extraPersons: [...f.extraPersons, { name: '', hours: '8' }] }))
  const updateExtra = (i, key, val) => setForm(f => { const ep = [...f.extraPersons]; ep[i] = { ...ep[i], [key]: val }; return { ...f, extraPersons: ep } })
  const removeExtra = i => setForm(f => ({ ...f, extraPersons: f.extraPersons.filter((_, j) => j !== i) }))

  const resetForm = () => setForm({ project_id: '', date: today(), employee: sess.name, text: '', photos: [], hours: '8', description: '', extraPersons: [] })

  const submit = async () => {
    if (!form.project_id) return
    const entryId = editId || uid()
    if (editId) {
      await updateDagbok(editId, { project_id: form.project_id, date: form.date, employee: form.employee, text: form.text, photos: form.photos })
      await deleteTidByEntry(editId)
    } else {
      await addDagbok({ id: entryId, project_id: form.project_id, company: co.id, date: form.date, employee: form.employee, text: form.text, photos: form.photos })
    }
    if (form.hours) {
      await addTid({ entry_id: entryId, project_id: form.project_id, company: co.id, date: form.date, employee: form.employee, hours: parseFloat(form.hours) || 0, description: form.description })
    }
    for (const ep of form.extraPersons) {
      if (ep.name && ep.hours) {
        await addTid({ entry_id: entryId, project_id: form.project_id, company: co.id, date: form.date, employee: ep.name, hours: parseFloat(ep.hours) || 0, description: form.description })
      }
    }
    resetForm()
    setEditId(null)
    setSubTab('list')
  }

  const startEdit = (d) => {
    const linked = tid.filter(t => t.entry_id === d.id)
    const fallback = tid.filter(t => !t.entry_id && t.date === d.date && t.project_id === d.project_id)
    const useRows = linked.length > 0 ? linked : fallback
    const main = useRows.find(t => t.employee === d.employee)
    const others = useRows.filter(t => t !== main)
    setForm({
      project_id: d.project_id, date: d.date, employee: d.employee, text: d.text || '', photos: d.photos || [],
      hours: main ? String(main.hours) : '', description: main?.description || '',
      extraPersons: others.map(t => ({ name: t.employee, hours: String(t.hours) }))
    })
    setEditId(d.id)
    setSubTab('add')
  }

  // Combine and sort dagbok+tid by date
  const combined = [
    ...dagbok.map(d => ({ ...d, _type: 'dag' })),
  ].sort((a, b) => b.date?.localeCompare(a.date))

  const wk = () => { const n = new Date(), m = new Date(n); m.setDate(n.getDate() - n.getDay() + 1); return r1(tid.filter(t => t.date >= m.toISOString().slice(0, 10)).reduce((a, t) => a + (t.hours || 0), 0)) }
  const totalH = r1(tid.reduce((s, t) => s + (t.hours || 0), 0))
  const entryHours = (d) => r1(tid.filter(t => t.entry_id === d.id).reduce((s, t) => s + (t.hours || 0), 0))

  if (subTab === 'add') return (
    <div>
      <button className="btn-back" onClick={() => { setSubTab('list'); setEditId(null); resetForm() }}>{Icon.back} Tillbaka</button>
      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>{editId ? 'Redigera arbetsdag' : 'Ny arbetsdag'}</div>

      <div className="field-group"><div className="field-label">Projekt *</div>
        {ap.length === 0 ? <div style={{ fontSize: 13, color: '#888' }}>Inga aktiva projekt</div> :
          <div className="chip-group">{ap.map(p => <div key={p.id} className={`chip${form.project_id === p.id ? ' selected' : ''}`} onClick={() => setForm({ ...form, project_id: p.id })}>{p.name}</div>)}</div>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div className="field-group"><div className="field-label">Datum</div><input className="field" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></div>
        <div className="field-group"><div className="field-label">Utförd av</div>
          {editId
            ? <select className="field" value={form.employee} onChange={e => setForm({ ...form, employee: e.target.value })}>
                {employees.filter(e => e.role !== 'admin').map(e => <option key={e.id} value={e.name}>{e.name}</option>)}
              </select>
            : <input className="field" value={form.employee} readOnly style={{ background: '#F0EFE8' }} />}
        </div>
      </div>

      {/* Timmar */}
      <div style={{ background: '#F0EFE8', borderRadius: 10, padding: '10px 12px', marginBottom: 10 }}>
        <div style={{ fontSize: 12, color: '#888', fontWeight: 600, marginBottom: 8 }}>TIMMAR</div>
        <div className="hours-row">
          <input className="hours-input" type="number" min="0" max="24" step="0.5" value={form.hours} onChange={e => setForm({ ...form, hours: e.target.value })} />
          <span style={{ fontSize: 13, color: '#888' }}>tim</span>
          {[4, 6, 8, 8.5, 10].map(n => <button key={n} className="btn-secondary" style={{ padding: '4px 7px', fontSize: 12 }} onClick={() => setForm({ ...form, hours: String(n) })}>{n}h</button>)}
        </div>

        {/* Extra kollegor */}
        {form.extraPersons.map((ep, i) => (
          <div key={i} style={{ display: 'flex', gap: 6, marginTop: 8, alignItems: 'center' }}>
            <select className="field" style={{ flex: 2 }} value={ep.name} onChange={e => updateExtra(i, 'name', e.target.value)}>
              <option value="">Välj kollega...</option>
              {employees.filter(e => e.name !== form.employee && e.role !== 'admin').map(e => <option key={e.id} value={e.name}>{e.name}</option>)}
            </select>
            <input className="hours-input" type="number" min="0" max="24" step="0.5" value={ep.hours} onChange={e => updateExtra(i, 'hours', e.target.value)} style={{ width: 52 }} />
            <span style={{ fontSize: 12, color: '#888' }}>h</span>
            <button className="btn-danger" style={{ padding: '4px 7px' }} onClick={() => removeExtra(i)}>×</button>
          </div>
        ))}
        <button onClick={addExtraPerson} style={{ marginTop: 8, background: 'none', border: '0.5px dashed rgba(0,0,0,.25)', borderRadius: 8, padding: '6px 12px', fontSize: 12, color: '#666', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'inherit' }}>+ Lägg till kollega</button>
      </div>

      {/* Dagbok */}
      <div className="field-group"><div className="field-label">Dagboksanteckning</div><textarea className="field" placeholder="Beskriv dagens arbete..." value={form.text} onChange={e => setForm({ ...form, text: e.target.value })} /></div>

      {/* Foton — kamera + galleri */}
      <div className="field-group">
        <div className="field-label">Foton</div>
        <input type="file" ref={camRef} accept="image/*" capture="environment" style={{ display: 'none' }} onChange={addPhoto} />
        <input type="file" ref={galleryRef} accept="image/*" multiple style={{ display: 'none' }} onChange={addPhoto} />
        <div className="photo-grid">
          {form.photos.map((src, i) => <div key={i} className="photo-wrap"><img src={src} className="photo-thumb" alt="" /><button className="photo-del" onClick={() => setForm(f => ({ ...f, photos: f.photos.filter((_, j) => j !== i) }))}>×</button></div>)}
          <div className="photo-add-btn" onClick={() => camRef.current.click()}>{Icon.cam}<span>Kamera</span></div>
          <div className="photo-add-btn" onClick={() => galleryRef.current.click()} style={{ fontSize: 18 }}>🖼<span style={{ fontSize: 11 }}>Galleri</span></div>
        </div>
      </div>

      <button className="btn-primary" onClick={submit} disabled={!form.project_id}>{editId ? 'Spara ändringar' : 'Spara arbetsdag'}</button>
    </div>
  )

  return (
    <div>
      <div className="stat-grid">
        <div className="stat-card"><div className="stat-label">Denna vecka</div><div className="stat-val" style={{ color: co.color }}>{wk()}h</div></div>
        <div className="stat-card"><div className="stat-label">Totalt</div><div className="stat-val">{totalH}h</div></div>
      </div>
      {combined.length === 0 && <div className="empty">Inga poster ännu.</div>}
      {combined.map(entry => {
        const proj = projects.find(p => p.id === entry.project_id)
        const h = entryHours(entry)
        const canEdit = isAdmin || entry.employee === sess.name
        return (
          <div key={entry.id} className="entry-card">
            <div className="card-row">
              <div>
                <div style={{ fontSize: 12, color: '#888' }}>{fmt(entry.date)}</div>
                {proj && <div style={{ fontSize: 13, fontWeight: 700, color: co.color, marginTop: 2 }}>{proj.name}</div>}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                {h > 0 && <span style={{ fontSize: 16, fontWeight: 700, color: co.color }}>{h}h</span>}
                {canEdit && (
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button style={{ padding: '3px 6px', background: 'transparent', border: '0.5px solid rgba(0,0,0,.2)', borderRadius: 6, cursor: 'pointer', fontSize: 12 }} onClick={() => startEdit(entry)}>✏️</button>
                    <button className="btn-danger" style={{ padding: '3px 6px' }} onClick={() => deleteDagbok(entry.id)}>{Icon.del}</button>
                  </div>
                )}
              </div>
            </div>
            <div className="tag" style={{ marginTop: 4 }}>👤 {entry.employee}</div>
            {entry.text && <div className="entry-text" style={{ marginTop: 6 }}>{entry.text}</div>}
            {entry.photos?.length > 0 && <div className="photo-grid" style={{ marginTop: 8 }}>{entry.photos.map((src, i) => <img key={i} src={src} className="photo-thumb" alt="" onClick={() => setLb(src)} />)}</div>}
          </div>
        )
      })}
      <button className="btn-primary" style={{ marginTop: 8 }} onClick={() => { resetForm(); setEditId(null); setSubTab('add') }}>+ Ny arbetsdag</button>
    </div>
  )
}

// ─── Kommunikation Tab ────────────────────────────────────────
// ─── Lager Tab ────────────────────────────────────────────────
const LAGER_KATEGORIER = ['Rör', 'Kopplingar', 'Schaktbrädor', 'Massor', 'Verktyg', 'Betong', 'Armering', 'Isolering', 'Övrigt']
const LAGER_ENHETER = ['st', 'm', 'm²', 'm³', 'kg', 'ton', 'pall', 'säck', 'rulle']

function LagerTab({ co, lager, sess, isAdmin, addLagerItem, updateLagerItem, deleteLagerItem }) {
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState(null)
  const [filterKat, setFilterKat] = useState('alla')
  const [form, setForm] = useState({ namn: '', kategori: 'Rör', mangd: '', enhet: 'st', min_mangd: '', plats: '', notering: '' })

  const submit = async () => {
    if (!form.namn.trim()) return
    if (editId) {
      await updateLagerItem(editId, { ...form, mangd: parseFloat(form.mangd) || 0, min_mangd: parseFloat(form.min_mangd) || 0 })
      setEditId(null)
    } else {
      await addLagerItem({ ...form, company: co.id, mangd: parseFloat(form.mangd) || 0, min_mangd: parseFloat(form.min_mangd) || 0 })
    }
    setForm({ namn: '', kategori: 'Rör', mangd: '', enhet: 'st', min_mangd: '', plats: '', notering: '' })
    setShowForm(false)
  }

  const startEdit = (item) => {
    setEditId(item.id)
    setForm({ namn: item.namn, kategori: item.kategori, mangd: String(item.mangd), enhet: item.enhet, min_mangd: String(item.min_mangd || ''), plats: item.plats || '', notering: item.notering || '' })
    setShowForm(true)
  }

  const getStatus = (item) => {
    if (item.mangd <= 0) return { label: 'Tomt', color: '#e24b4a', bg: '#FEECEC' }
    if (item.min_mangd > 0 && item.mangd <= item.min_mangd) return { label: 'Lågt', color: '#B84B12', bg: '#FEF0E6' }
    return { label: 'OK', color: '#1a7a3c', bg: '#E6F7EE' }
  }

  const kategorier = ['alla', ...LAGER_KATEGORIER.filter(k => lager.some(l => l.kategori === k))]
  const filtered = filterKat === 'alla' ? lager : lager.filter(l => l.kategori === filterKat)
  const grouped = {}
  filtered.forEach(l => { if (!grouped[l.kategori]) grouped[l.kategori] = []; grouped[l.kategori].push(l) })

  const tomma = lager.filter(l => l.mangd <= 0).length
  const laga = lager.filter(l => l.min_mangd > 0 && l.mangd > 0 && l.mangd <= l.min_mangd).length

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700 }}>Lager</div>
          <div style={{ fontSize: 12, color: '#888', marginTop: 1 }}>
            {lager.length} artiklar
            {tomma > 0 && <span style={{ color: '#e24b4a', marginLeft: 6 }}>· {tomma} tomma</span>}
            {laga > 0 && <span style={{ color: '#B84B12', marginLeft: 6 }}>· {laga} låga</span>}
          </div>
        </div>
        {isAdmin && !showForm && <button style={{ background: co.color, border: 'none', color: '#fff', borderRadius: 8, padding: '7px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }} onClick={() => { setEditId(null); setForm({ namn: '', kategori: 'Rör', mangd: '', enhet: 'st', min_mangd: '', plats: '', notering: '' }); setShowForm(true) }}>+ Lägg till</button>}
      </div>

      {/* Form */}
      {showForm && isAdmin && (
        <div className="card" style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>{editId ? 'Redigera artikel' : 'Ny artikel'}</div>
          <div className="field-group"><div className="field-label">Namn *</div><input className="field" placeholder="T.ex. PVC-rör 110mm" value={form.namn} onChange={e => setForm({ ...form, namn: e.target.value })} autoFocus /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div className="field-group"><div className="field-label">Kategori</div>
              <select className="field" value={form.kategori} onChange={e => setForm({ ...form, kategori: e.target.value })}>
                {LAGER_KATEGORIER.map(k => <option key={k}>{k}</option>)}
              </select>
            </div>
            <div className="field-group"><div className="field-label">Enhet</div>
              <select className="field" value={form.enhet} onChange={e => setForm({ ...form, enhet: e.target.value })}>
                {LAGER_ENHETER.map(e => <option key={e}>{e}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div className="field-group"><div className="field-label">Antal/Mängd *</div><input className="field" type="number" min="0" step="0.5" placeholder="0" value={form.mangd} onChange={e => setForm({ ...form, mangd: e.target.value })} /></div>
            <div className="field-group"><div className="field-label">Larmgräns (lågt)</div><input className="field" type="number" min="0" step="0.5" placeholder="T.ex. 10" value={form.min_mangd} onChange={e => setForm({ ...form, min_mangd: e.target.value })} /></div>
          </div>
          <div className="field-group"><div className="field-label">Plats i lager</div><input className="field" placeholder="T.ex. Hyllla A3, Container 2" value={form.plats} onChange={e => setForm({ ...form, plats: e.target.value })} /></div>
          <div className="field-group"><div className="field-label">Notering</div><input className="field" placeholder="T.ex. Beställ från Tyréns vid lågt" value={form.notering} onChange={e => setForm({ ...form, notering: e.target.value })} /></div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-primary" style={{ flex: 1, marginTop: 0, background: co.color }} onClick={submit}>{editId ? 'Spara ändringar' : 'Lägg till'}</button>
            <button className="btn-secondary" style={{ marginTop: 0 }} onClick={() => { setShowForm(false); setEditId(null) }}>Avbryt</button>
          </div>
        </div>
      )}

      {/* Category filter */}
      {kategorier.length > 2 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12, overflowX: 'auto', paddingBottom: 2 }}>
          {kategorier.map(k => (
            <button key={k} onClick={() => setFilterKat(k)} style={{ padding: '4px 10px', borderRadius: 20, border: `0.5px solid ${filterKat === k ? co.color : 'rgba(0,0,0,.15)'}`, background: filterKat === k ? co.color : '#fff', color: filterKat === k ? '#fff' : '#666', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', fontWeight: filterKat === k ? 600 : 400 }}>
              {k === 'alla' ? 'Alla' : k}
            </button>
          ))}
        </div>
      )}

      {lager.length === 0 && <div className="empty">Inga artiklar i lagret ännu.{isAdmin ? ' Tryck + för att lägga till.' : ''}</div>}

      {Object.entries(grouped).map(([kat, items]) => (
        <div key={kat}>
          <div className="sec">{kat}</div>
          {items.map(item => {
            const st = getStatus(item)
            return (
              <div key={item.id} className="card" style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{item.namn}</div>
                    {item.plats && <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>📍 {item.plats}</div>}
                    {item.notering && <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{item.notering}</div>}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: co.color }}>{item.mangd} <span style={{ fontSize: 13, fontWeight: 400, color: '#888' }}>{item.enhet}</span></div>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 600, background: st.bg, color: st.color }}>{st.label}</span>
                  </div>
                </div>
                {isAdmin && (
                  <div style={{ display: 'flex', gap: 6, marginTop: 10, alignItems: 'center' }}>
                    <div style={{ fontSize: 12, color: '#888', marginRight: 4 }}>Justera:</div>
                    {[-10, -5, -1, +1, +5, +10].map(d => (
                      <button key={d} onClick={() => updateLagerItem(item.id, { mangd: Math.max(0, (item.mangd || 0) + d) })} style={{ padding: '3px 7px', background: d < 0 ? '#FEECEC' : '#E6F7EE', border: 'none', borderRadius: 6, fontSize: 12, cursor: 'pointer', color: d < 0 ? '#a32d2d' : '#1a7a3c', fontFamily: 'inherit', fontWeight: 600 }}>
                        {d > 0 ? '+' : ''}{d}
                      </button>
                    ))}
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: 5 }}>
                      <button style={{ padding: '4px 8px', background: 'transparent', border: '0.5px solid rgba(0,0,0,.2)', borderRadius: 8, cursor: 'pointer' }} onClick={() => startEdit(item)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="13" height="13"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <button className="btn-danger" style={{ padding: '4px 8px' }} onClick={() => deleteLagerItem(item.id)}>{Icon.del}</button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}


// ─── Anbudssystem Tab ─────────────────────────────────────────
const ANBUD_STATUS = {
  KALKYLERAS: { label: 'Kalkyleras', color: '#B45309', bg: '#FEF3C7' },
  INLAMNAT:   { label: 'Inlämnat',   color: '#1a6ab5', bg: '#EFF6FF' },
  VUNNIT:     { label: 'Vunnit',     color: '#1a7a3c', bg: '#ECFDF5' },
  FORLORAT:   { label: 'Förlorat',   color: '#a32d2d', bg: '#FEF2F2' },
}

function fmtKr(n) {
  if (!n && n !== 0) return '–'
  return Number(n).toLocaleString('sv-SE', { maximumFractionDigits: 0 }) + ' kr'
}

function AnbudTab() {
  const [anbud, setAnbud] = useState([])
  const [view, setView] = useState('list')
  const [editId, setEditId] = useState(null)
  const [filter, setFilter] = useState('ALL')
  const [form, setForm] = useState({ projektnamn: '', bestallare: '', ort: '', bolag: '', anbudssumma: '', anbudsdatum: today(), status: 'KALKYLERAS', tilldelning: '', notering: '' })
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    supabase.from('anbud').select('*').order('anbudsdatum', { ascending: false })
      .then(({ data }) => { setAnbud(data || []); setLoaded(true) })
  }, [])

  const save = async () => {
    if (!form.projektnamn.trim() || !form.anbudssumma || !form.bestallare.trim()) return
    if (editId) {
      await supabase.from('anbud').update({ ...form, anbudssumma: parseFloat(form.anbudssumma) || 0 }).eq('id', editId)
      setAnbud(a => a.map(x => x.id === editId ? { ...x, ...form } : x))
    } else {
      const row = { id: uid(), ...form, anbudssumma: parseFloat(form.anbudssumma) || 0, created_at: new Date().toISOString() }
      await supabase.from('anbud').insert(row)
      setAnbud(a => [row, ...a])
    }
    setForm({ projektnamn: '', bestallare: '', ort: '', bolag: '', anbudssumma: '', anbudsdatum: today(), status: 'KALKYLERAS', tilldelning: '', notering: '' })
    setEditId(null); setView('list')
  }

  const del = async (id) => {
    await supabase.from('anbud').delete().eq('id', id)
    setAnbud(a => a.filter(x => x.id !== id))
  }

  const startEdit = (p) => { setForm({ ...p, anbudssumma: String(p.anbudssumma), bolag: p.bolag || '' }); setEditId(p.id); setView('form') }

  const filtered = filter === 'ALL' ? anbud : anbud.filter(p => p.status === filter)
  const vunnit = anbud.filter(p => p.status === 'VUNNIT')
  const totalAnbud = anbud.reduce((s, p) => s + (p.anbudssumma || 0), 0)
  const vunnetVarde = vunnit.reduce((s, p) => s + (p.anbudssumma || 0), 0)
  const hitRate = anbud.length > 0 ? Math.round((vunnit.length / anbud.length) * 100) : 0

  if (!loaded) return <div className="empty">Laddar...</div>

  if (view === 'form') return (
    <div>
      <button className="btn-back" onClick={() => { setView('list'); setEditId(null); setForm({ projektnamn: '', bestallare: '', ort: '', bolag: '', anbudssumma: '', anbudsdatum: today(), status: 'KALKYLERAS', tilldelning: '', notering: '' }) }}>{Icon.back} Tillbaka</button>
      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>{editId ? 'Redigera anbud' : 'Nytt anbud'}</div>
      <div className="field-group"><div className="field-label">Projektnamn *</div><input className="field" placeholder="T.ex. VA Skogsgläntan" value={form.projektnamn} onChange={e => setForm({ ...form, projektnamn: e.target.value })} autoFocus /></div>
      <div className="field-group"><div className="field-label">Bolag</div>
        <div className="chip-group">
          {['Mark', 'Bygg', 'Transport', 'MB Mark'].map(b => <div key={b} className={`chip${form.bolag === b ? ' selected' : ''}`} onClick={() => setForm({ ...form, bolag: b })}>{b}</div>)}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div className="field-group"><div className="field-label">Beställare *</div><input className="field" placeholder="T.ex. Förbo AB" value={form.bestallare} onChange={e => setForm({ ...form, bestallare: e.target.value })} /></div>
        <div className="field-group"><div className="field-label">Ort</div><input className="field" placeholder="T.ex. Mölnlycke" value={form.ort} onChange={e => setForm({ ...form, ort: e.target.value })} /></div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div className="field-group"><div className="field-label">Anbudssumma (kr) *</div><input className="field" type="number" placeholder="0" value={form.anbudssumma} onChange={e => setForm({ ...form, anbudssumma: e.target.value })} /></div>
        <div className="field-group"><div className="field-label">Anbudsdatum</div><input className="field" type="date" value={form.anbudsdatum} onChange={e => setForm({ ...form, anbudsdatum: e.target.value })} /></div>
      </div>
      <div className="field-group"><div className="field-label">Status</div>
        <div className="chip-group">{Object.entries(ANBUD_STATUS).map(([k, s]) => <div key={k} className={`chip${form.status === k ? ' selected' : ''}`} style={form.status === k ? { background: s.color, borderColor: s.color } : {}} onClick={() => setForm({ ...form, status: k })}>{s.label}</div>)}</div>
      </div>
      {form.status === 'VUNNIT' && <div className="field-group"><div className="field-label">Tilldelning (%)</div><input className="field" type="number" min="0" max="200" placeholder="T.ex. 92" value={form.tilldelning} onChange={e => setForm({ ...form, tilldelning: e.target.value })} /></div>}
      <div className="field-group"><div className="field-label">Notering</div><textarea className="field" rows={3} placeholder="Kommentar, varför vi vann/förlorade..." value={form.notering} onChange={e => setForm({ ...form, notering: e.target.value })} /></div>
      {form.anbudssumma && <div style={{ background: '#F0EFE8', borderRadius: 8, padding: '10px 14px', marginBottom: 10, display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: 12, color: '#888' }}>Anbudssumma</span><span style={{ fontSize: 18, fontWeight: 700 }}>{fmtKr(form.anbudssumma)}</span></div>}
      <button className="btn-primary" style={{ background: '#1a1a1a' }} onClick={save}>{editId ? 'Spara ändringar' : 'Lägg till anbud'}</button>
    </div>
  )

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div><div style={{ fontSize: 15, fontWeight: 700 }}>Anbudssystem</div><div style={{ fontSize: 12, color: '#888', marginTop: 1 }}>{anbud.length} anbud totalt</div></div>
        <button style={{ background: '#1a1a1a', border: 'none', color: '#fff', borderRadius: 8, padding: '7px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }} onClick={() => setView('form')}>+ Nytt anbud</button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 14 }}>
        <div className="stat-card"><div className="stat-label">Hit rate</div><div className="stat-val" style={{ color: '#1a7a3c' }}>{hitRate}%</div></div>
        <div className="stat-card"><div className="stat-label">Vunnet värde</div><div className="stat-val" style={{ fontSize: 15 }}>{(vunnetVarde/1000000).toFixed(1)} Mkr</div></div>
        <div className="stat-card"><div className="stat-label">Totalt anbud</div><div className="stat-val" style={{ fontSize: 15 }}>{(totalAnbud/1000000).toFixed(1)} Mkr</div></div>
      </div>

      {/* Filter */}
      <div className="sub-tabs" style={{ marginBottom: 12 }}>
        <button className={`sub-tab${filter === 'ALL' ? ' active' : ''}`} onClick={() => setFilter('ALL')}>Alla</button>
        {Object.entries(ANBUD_STATUS).map(([k, s]) => <button key={k} className={`sub-tab${filter === k ? ' active' : ''}`} onClick={() => setFilter(k)}>{s.label}</button>)}
      </div>

      {filtered.length === 0 && <div className="empty">Inga anbud hittades.</div>}
      {filtered.map(p => {
        const st = ANBUD_STATUS[p.status]
        return (
          <div key={p.id} className="card" style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{p.projektnamn}</div>
                <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{p.bestallare}{p.ort ? ' · ' + p.ort : ''}{p.bolag ? ' · ' + p.bolag : ''}{p.anbudsdatum ? ' · ' + fmt(p.anbudsdatum) : ''}</div>
                {p.notering && <div style={{ fontSize: 12, color: '#888', marginTop: 4, fontStyle: 'italic' }}>{p.notering}</div>}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5, marginLeft: 8 }}>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{fmtKr(p.anbudssumma)}</div>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 600, background: st.bg, color: st.color }}>{st.label}</span>
                {p.tilldelning && <span style={{ fontSize: 11, color: '#1a7a3c' }}>Tilldeln. {p.tilldelning}%</span>}
                <div style={{ display: 'flex', gap: 5 }}>
                  <button style={{ padding: '3px 7px', background: 'transparent', border: '0.5px solid rgba(0,0,0,.2)', borderRadius: 6, cursor: 'pointer', fontSize: 12 }} onClick={() => startEdit(p)}>✏️</button>
                  <button className="btn-danger" style={{ padding: '3px 7px' }} onClick={() => del(p.id)}>{Icon.del}</button>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Aj & Oj — Tillbud + Skyddsronder ─────────────────────────
const TILLBUD_TYP = [
  { k: 'tillbud', l: '⚠️ Tillbud', desc: 'Hände inget men kunde gått illa' },
  { k: 'olycka', l: '🚑 Olycka', desc: 'Personskada inträffade' },
  { k: 'risk', l: '👁️ Riskobservation', desc: 'Upptäckt risk innan något hänt' },
]
const TILLBUD_ALLVAR = [
  { k: 'lindrig', l: 'Lindrig', color: '#1a7a3c', bg: '#E6F7EE' },
  { k: 'allvarlig', l: 'Allvarlig', color: '#B84B12', bg: '#FEF0E6' },
  { k: 'mycket_allvarlig', l: 'Mycket allvarlig', color: '#a32d2d', bg: '#FEECEC' },
]
const SKYDDSROND_PUNKTER = [
  { k: 'ppe', l: 'Personlig skyddsutrustning', desc: 'Hjälm, skor, väst, hörselskydd används korrekt' },
  { k: 'schakt', l: 'Schaktning & schaktstöd', desc: 'Slänter, schaktbox eller spont enligt krav, fri höjd' },
  { k: 'maskiner', l: 'Maskiner & fordon', desc: 'Backkamera/larm fungerar, daglig tillsyn gjord' },
  { k: 'avsparrning', l: 'Avspärrningar', desc: 'Tydliga, hela, korrekt skyltade' },
  { k: 'ledningar', l: 'Ledningar i mark', desc: 'Ledningskollen kontrollerad, markerade innan schakt' },
  { k: 'fallrisk', l: 'Fallrisk & öppningar', desc: 'Schakt, brunnar och hål täckta eller avspärrade' },
  { k: 'ordning', l: 'Ordning & reda', desc: 'Material upplagt säkert, fria gångvägar' },
  { k: 'el', l: 'Elsäkerhet', desc: 'Kablar, eluttag, skarvsladdar i gott skick' },
  { k: 'brand', l: 'Brandsäkerhet', desc: 'Brandsläckare tillgänglig och kontrollerad' },
  { k: 'kemikalier', l: 'Kemikalier & bränsle', desc: 'Korrekt förvarade, märkta, invallning vid behov' },
  { k: 'trafik', l: 'Trafiksäkerhet', desc: 'Skyltning mot allmän väg, gångtrafikanter' },
]

function AjOjTab({ sess, isAdmin, projects, employees }) {
  const [section, setSection] = useState('tillbud')
  return (
    <div>
      <div style={{ display: 'flex', background: '#F0EFE8', borderRadius: 10, padding: 3, gap: 2, marginBottom: 14 }}>
        {[{ k: 'tillbud', l: '🩹 Tillbud' }, { k: 'skyddsrond', l: '🛡️ Skyddsronder' }].map(t => (
          <button key={t.k} onClick={() => setSection(t.k)} style={{ flex: 1, padding: '9px 4px', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', background: section === t.k ? '#fff' : 'transparent', color: section === t.k ? '#1a1a1a' : '#888' }}>{t.l}</button>
        ))}
      </div>
      {section === 'tillbud' && <TillbudSection sess={sess} isAdmin={isAdmin} projects={projects} />}
      {section === 'skyddsrond' && <SkyddsrondSection sess={sess} isAdmin={isAdmin} projects={projects} />}
    </div>
  )
}

function TillbudSection({ sess, isAdmin, projects }) {
  const [tillbud, setTillbud] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [view, setView] = useState('list')
  const [filter, setFilter] = useState('alla')
  const [form, setForm] = useState({ datum: today(), typ: 'tillbud', allvar: 'lindrig', plats: '', beskrivning: '', orsak: '', atgard: '', rapporterad_av: sess.name })

  useEffect(() => {
    supabase.from('tillbud').select('*').order('created_at', { ascending: false }).then(({ data }) => { setTillbud(data || []); setLoaded(true) })
  }, [])

  const submit = async () => {
    if (!form.beskrivning.trim() || !form.plats.trim()) return
    const row = { id: uid(), ...form, status: 'oppen', created_at: new Date().toISOString() }
    await supabase.from('tillbud').insert(row)
    setTillbud(t => [row, ...t])
    if (form.allvar !== 'lindrig') sendPush('🚨 ' + (form.allvar === 'mycket_allvarlig' ? 'Mycket allvarligt tillbud' : 'Allvarligt tillbud'), `${form.plats} — ${form.beskrivning.slice(0, 60)}`, 'tillbud')
    setForm({ datum: today(), typ: 'tillbud', allvar: 'lindrig', plats: '', beskrivning: '', orsak: '', atgard: '', rapporterad_av: sess.name })
    setView('list')
  }

  const updateStatus = async (id, status) => {
    await supabase.from('tillbud').update({ status }).eq('id', id)
    setTillbud(t => t.map(x => x.id === id ? { ...x, status } : x))
  }
  const del = async (id) => { await supabase.from('tillbud').delete().eq('id', id); setTillbud(t => t.filter(x => x.id !== id)) }

  const filtered = filter === 'alla' ? tillbud : tillbud.filter(t => t.status === filter)
  const oppna = tillbud.filter(t => t.status === 'oppen').length

  if (!loaded) return <div className="empty">Laddar...</div>

  if (view === 'add') return (
    <div>
      <button className="btn-back" onClick={() => setView('list')}>{Icon.back} Tillbaka</button>
      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>Nytt tillbud</div>

      <div className="field-group"><div className="field-label">Typ</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {TILLBUD_TYP.map(t => (
            <div key={t.k} onClick={() => setForm({ ...form, typ: t.k })} style={{ padding: '10px 12px', borderRadius: 8, border: `1.5px solid ${form.typ === t.k ? '#E05D1A' : 'rgba(0,0,0,.1)'}`, background: form.typ === t.k ? '#FEF0E6' : '#fff', cursor: 'pointer' }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{t.l}</div>
              <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{t.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div className="field-group"><div className="field-label">Datum</div><input className="field" type="date" value={form.datum} onChange={e => setForm({ ...form, datum: e.target.value })} /></div>
        <div className="field-group"><div className="field-label">Rapporterad av</div><input className="field" value={form.rapporterad_av} readOnly style={{ background: '#F0EFE8' }} /></div>
      </div>

      <div className="field-group"><div className="field-label">Plats / Projekt *</div><input className="field" placeholder="T.ex. VA Mölndalsvägen" value={form.plats} onChange={e => setForm({ ...form, plats: e.target.value })} /></div>

      <div className="field-group"><div className="field-label">Allvarlighetsgrad</div>
        <div className="chip-group">{TILLBUD_ALLVAR.map(a => <div key={a.k} className={`chip${form.allvar === a.k ? ' selected' : ''}`} style={form.allvar === a.k ? { background: a.color, borderColor: a.color } : {}} onClick={() => setForm({ ...form, allvar: a.k })}>{a.l}</div>)}</div>
      </div>

      <div className="field-group"><div className="field-label">Vad hände? *</div><textarea className="field" rows={3} placeholder="Beskriv vad som hände..." value={form.beskrivning} onChange={e => setForm({ ...form, beskrivning: e.target.value })} /></div>
      <div className="field-group"><div className="field-label">Trolig orsak</div><textarea className="field" rows={2} placeholder="Vad orsakade det?" value={form.orsak} onChange={e => setForm({ ...form, orsak: e.target.value })} /></div>
      <div className="field-group"><div className="field-label">Åtgärd vidtagen</div><textarea className="field" rows={2} placeholder="Vad gjordes direkt på plats?" value={form.atgard} onChange={e => setForm({ ...form, atgard: e.target.value })} /></div>

      <button className="btn-primary" style={{ background: '#1a1a1a' }} onClick={submit} disabled={!form.beskrivning.trim() || !form.plats.trim()}>Rapportera</button>
    </div>
  )

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div><div style={{ fontSize: 15, fontWeight: 700 }}>Tillbud & olyckor</div><div style={{ fontSize: 12, color: '#888', marginTop: 1 }}>{oppna} öppna ärenden</div></div>
        <button style={{ background: '#1a1a1a', border: 'none', color: '#fff', borderRadius: 8, padding: '7px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }} onClick={() => setView('add')}>+ Rapportera</button>
      </div>

      <div className="sub-tabs" style={{ marginBottom: 12 }}>
        {[{ k: 'alla', l: 'Alla' }, { k: 'oppen', l: 'Öppna' }, { k: 'atgardad', l: 'Åtgärdade' }, { k: 'stangd', l: 'Stängda' }].map(f => (
          <button key={f.k} className={`sub-tab${filter === f.k ? ' active' : ''}`} onClick={() => setFilter(f.k)}>{f.l}</button>
        ))}
      </div>

      {filtered.length === 0 && <div className="empty">Inga rapporterade ärenden.</div>}
      {filtered.map(t => {
        const typ = TILLBUD_TYP.find(x => x.k === t.typ)
        const allvar = TILLBUD_ALLVAR.find(x => x.k === t.allvar)
        return (
          <div key={t.id} className="card" style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 4, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>{typ?.l}</span>
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 600, background: allvar?.bg, color: allvar?.color }}>{allvar?.l}</span>
                </div>
                <div style={{ fontSize: 13, color: '#888' }}>{fmt(t.datum)} · {t.plats}</div>
                <div style={{ fontSize: 14, marginTop: 6 }}>{t.beskrivning}</div>
                {t.orsak && <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}><strong>Orsak:</strong> {t.orsak}</div>}
                {t.atgard && <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}><strong>Åtgärd:</strong> {t.atgard}</div>}
                <div style={{ fontSize: 11, color: '#aaa', marginTop: 6 }}>Rapporterad av {t.rapporterad_av}</div>
              </div>
              {isAdmin && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginLeft: 8 }}>
                  <select style={{ fontSize: 11, border: '0.5px solid rgba(0,0,0,.2)', borderRadius: 6, padding: '3px 6px', background: '#fff', fontFamily: 'inherit' }} value={t.status} onChange={e => updateStatus(t.id, e.target.value)}>
                    <option value="oppen">Öppen</option>
                    <option value="atgardad">Åtgärdad</option>
                    <option value="stangd">Stängd</option>
                  </select>
                  <button className="btn-danger" style={{ padding: '3px 7px' }} onClick={() => del(t.id)}>{Icon.del}</button>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function SkyddsrondSection({ sess, isAdmin, projects }) {
  const [ronder, setRonder] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [view, setView] = useState('list')
  const [selId, setSelId] = useState(null)
  const [svar, setSvar] = useState({})
  const [form, setForm] = useState({ datum: today(), plats: '', utford_av: sess.name, kommentar: '' })

  useEffect(() => {
    supabase.from('skyddsronder').select('*').order('created_at', { ascending: false }).then(({ data }) => { setRonder(data || []); setLoaded(true) })
  }, [])

  const startNew = () => {
    const init = {}
    SKYDDSROND_PUNKTER.forEach(p => { init[p.k] = { status: '', kommentar: '' } })
    setSvar(init)
    setForm({ datum: today(), plats: '', utford_av: sess.name, kommentar: '' })
    setView('add')
  }

  const setSvarStatus = (k, status) => setSvar(s => ({ ...s, [k]: { ...s[k], status } }))
  const setSvarKommentar = (k, kommentar) => setSvar(s => ({ ...s, [k]: { ...s[k], kommentar } }))

  const submit = async () => {
    if (!form.plats.trim()) return
    const brister = Object.entries(svar).filter(([k, v]) => v.status === 'brist')
    const row = { id: uid(), ...form, svar, antal_brister: brister.length, created_at: new Date().toISOString() }
    await supabase.from('skyddsronder').insert(row)
    setRonder(r => [row, ...r])
    if (brister.length > 0) sendPush('🛡️ Skyddsrond med brister', `${form.plats} — ${brister.length} brist(er) noterade`, 'skyddsrond')
    setView('list')
  }

  const del = async (id) => { await supabase.from('skyddsronder').delete().eq('id', id); setRonder(r => r.filter(x => x.id !== id)) }

  const sel = selId ? ronder.find(r => r.id === selId) : null

  if (!loaded) return <div className="empty">Laddar...</div>

  if (view === 'detail' && sel) return (
    <div>
      <button className="btn-back" onClick={() => { setView('list'); setSelId(null) }}>{Icon.back} Tillbaka</button>
      <div className="card" style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 15, fontWeight: 700 }}>{sel.plats}</div>
        <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{fmt(sel.datum)} · Utförd av {sel.utford_av}</div>
        {sel.antal_brister > 0 && <div style={{ fontSize: 12, color: '#a32d2d', marginTop: 4, fontWeight: 600 }}>⚠️ {sel.antal_brister} brist(er) noterade</div>}
      </div>
      {SKYDDSROND_PUNKTER.map(p => {
        const v = sel.svar?.[p.k] || {}
        const statusInfo = v.status === 'ok' ? { l: '✅ OK', color: '#1a7a3c', bg: '#E6F7EE' } : v.status === 'brist' ? { l: '⚠️ Brist', color: '#a32d2d', bg: '#FEECEC' } : { l: '– Ej aktuellt', color: '#888', bg: '#F0EFE8' }
        return (
          <div key={p.k} className="card" style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 600 }}>{p.l}</div><div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{p.desc}</div></div>
              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 600, background: statusInfo.bg, color: statusInfo.color, flexShrink: 0, marginLeft: 8 }}>{statusInfo.l}</span>
            </div>
            {v.kommentar && <div style={{ fontSize: 13, color: '#666', marginTop: 6, fontStyle: 'italic' }}>{v.kommentar}</div>}
          </div>
        )
      })}
      {sel.kommentar && <div className="card"><div className="sec" style={{ marginTop: 0 }}>Övrig kommentar</div>{sel.kommentar}</div>}
      {isAdmin && <button className="btn-danger" style={{ width: '100%', padding: 8, marginTop: 8 }} onClick={() => { del(sel.id); setView('list'); setSelId(null) }}>{Icon.del} Ta bort skyddsrond</button>}
    </div>
  )

  if (view === 'add') return (
    <div>
      <button className="btn-back" onClick={() => setView('list')}>{Icon.back} Tillbaka</button>
      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>Ny skyddsrond</div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div className="field-group"><div className="field-label">Datum</div><input className="field" type="date" value={form.datum} onChange={e => setForm({ ...form, datum: e.target.value })} /></div>
        <div className="field-group"><div className="field-label">Utförd av</div><input className="field" value={form.utford_av} readOnly style={{ background: '#F0EFE8' }} /></div>
      </div>
      <div className="field-group"><div className="field-label">Plats / Projekt *</div><input className="field" placeholder="T.ex. VA Mölndalsvägen" value={form.plats} onChange={e => setForm({ ...form, plats: e.target.value })} /></div>

      <div className="sec">Kontrollpunkter</div>
      {SKYDDSROND_PUNKTER.map(p => (
        <div key={p.k} className="card" style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{p.l}</div>
          <div style={{ fontSize: 12, color: '#888', marginTop: 2, marginBottom: 8 }}>{p.desc}</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {[{ k: 'ok', l: '✅ OK' }, { k: 'brist', l: '⚠️ Brist' }, { k: 'ej_aktuellt', l: '– Ej aktuellt' }].map(s => (
              <button key={s.k} onClick={() => setSvarStatus(p.k, s.k)} style={{ flex: 1, padding: '6px 4px', fontSize: 12, borderRadius: 8, border: `1.5px solid ${svar[p.k]?.status === s.k ? '#1a1a1a' : 'rgba(0,0,0,.12)'}`, background: svar[p.k]?.status === s.k ? '#1a1a1a' : '#fff', color: svar[p.k]?.status === s.k ? '#fff' : '#666', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>{s.l}</button>
            ))}
          </div>
          {svar[p.k]?.status === 'brist' && <input className="field" style={{ marginTop: 8 }} placeholder="Beskriv bristen..." value={svar[p.k]?.kommentar || ''} onChange={e => setSvarKommentar(p.k, e.target.value)} />}
        </div>
      ))}

      <div className="field-group"><div className="field-label">Övrig kommentar</div><textarea className="field" rows={2} placeholder="Allmänna observationer..." value={form.kommentar} onChange={e => setForm({ ...form, kommentar: e.target.value })} /></div>

      <button className="btn-primary" style={{ background: '#1a1a1a' }} onClick={submit} disabled={!form.plats.trim()}>Spara skyddsrond</button>
    </div>
  )

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div><div style={{ fontSize: 15, fontWeight: 700 }}>Skyddsronder</div><div style={{ fontSize: 12, color: '#888', marginTop: 1 }}>{ronder.length} utförda</div></div>
        <button style={{ background: '#1a1a1a', border: 'none', color: '#fff', borderRadius: 8, padding: '7px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }} onClick={startNew}>+ Ny skyddsrond</button>
      </div>
      {ronder.length === 0 && <div className="empty">Inga skyddsronder utförda ännu.</div>}
      {ronder.map(r => (
        <div key={r.id} className="card" style={{ marginBottom: 8, cursor: 'pointer' }} onClick={() => { setSelId(r.id); setView('detail') }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div><div style={{ fontSize: 14, fontWeight: 700 }}>{r.plats}</div><div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{fmt(r.datum)} · {r.utford_av}</div></div>
            {r.antal_brister > 0 ? <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 600, background: '#FEECEC', color: '#a32d2d' }}>{r.antal_brister} brist(er)</span> : <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 600, background: '#E6F7EE', color: '#1a7a3c' }}>✓ Inga brister</span>}
          </div>
        </div>
      ))}
    </div>
  )
}

function KommunikationTab({ sess }) {
  const [posts, setPosts] = useState([])
  const [form, setForm] = useState({ title: '', text: '', category: 'general' })
  const [showForm, setShowForm] = useState(false)
  const [loaded, setLoaded] = useState(false)

  const CATEGORIES = [
    { k: 'general', l: '💬 Allmänt', color: '#1a6ab5' },
    { k: 'massor', l: '🪨 Massor', color: '#7c3aed' },
    { k: 'maskiner', l: '🚛 Maskiner', color: '#2d8f4e' },
    { k: 'personal', l: '👷 Personal', color: '#E05D1A' },
    { k: 'material', l: '🧱 Material', color: '#b45309' },
  ]

  useEffect(() => { loadPosts() }, [])

  const loadPosts = async () => {
    const { data } = await supabase.from('kommunikation').select('*').order('created_at', { ascending: false }).limit(50)
    setPosts(data || []); setLoaded(true)
  }

  const submit = async () => {
    if (!form.title.trim()) return
    const row = { id: uid(), title: form.title.trim(), text: form.text.trim(), category: form.category, author: sess.name, created_at: new Date().toISOString() }
    await supabase.from('kommunikation').insert(row)
    setPosts(p => [row, ...p])
    setForm({ title: '', text: '', category: 'general' }); setShowForm(false)
  }

  const del = async (id) => {
    await supabase.from('kommunikation').delete().eq('id', id)
    setPosts(p => p.filter(x => x.id !== id))
  }

  const cat = k => CATEGORIES.find(c => c.k === k)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div><div style={{ fontSize: 15, fontWeight: 700 }}>Forum</div><div style={{ fontSize: 12, color: '#888', marginTop: 1 }}>Hela koncernen</div></div>
        {!showForm && <button style={{ background: '#1a1a1a', border: 'none', color: '#fff', borderRadius: 8, padding: '7px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }} onClick={() => setShowForm(true)}>+ Nytt inlägg</button>}
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Nytt inlägg</div>
          <div className="field-group">
            <div className="field-label">Kategori</div>
            <div className="chip-group">{CATEGORIES.map(c => <div key={c.k} className={`chip${form.category === c.k ? ' selected' : ''}`} style={form.category === c.k ? { background: c.color, borderColor: c.color } : {}} onClick={() => setForm({ ...form, category: c.k })}>{c.l}</div>)}</div>
          </div>
          <div className="field-group"><div className="field-label">Rubrik *</div><input className="field" placeholder="T.ex. Har 50 ton massor över på Mölndal..." value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
          <div className="field-group"><div className="field-label">Beskrivning</div><textarea className="field" placeholder="Mer info, kontaktuppgifter..." value={form.text} onChange={e => setForm({ ...form, text: e.target.value })} /></div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-primary" style={{ flex: 1, marginTop: 0, background: '#1a1a1a' }} onClick={submit}>Publicera</button>
            <button className="btn-secondary" style={{ marginTop: 0 }} onClick={() => setShowForm(false)}>Avbryt</button>
          </div>
        </div>
      )}

      {!loaded && <div className="empty">Laddar...</div>}
      {loaded && posts.length === 0 && <div className="empty">Inga inlägg ännu. Starta diskussionen!</div>}
      {posts.map(p => {
        const c = cat(p.category)
        const canDel = sess.role === 'admin' || p.author === sess.name
        return (
          <div key={p.id} className="ann-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 600, background: c?.color + '22', color: c?.color }}>{c?.l || p.category}</span>
                </div>
                <div className="ann-title">{p.title}</div>
                {p.text && <div className="ann-text" style={{ marginTop: 4 }}>{p.text}</div>}
              </div>
              {canDel && <button className="btn-danger" style={{ padding: '3px 7px', marginLeft: 8, flexShrink: 0 }} onClick={() => del(p.id)}>{Icon.del}</button>}
            </div>
            <div className="ann-meta">{p.author} · {new Date(p.created_at).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
          </div>
        )
      })}
    </div>
  )
}

// ─── SMS Tab ──────────────────────────────────────────────────
function SmsTab({ employees }) {
  const [msg, setMsg] = useState('')
  const [sel, setSel] = useState([])
  const [status, setStatus] = useState(null)
  const [sending, setSending] = useState(false)

  const withPhone = employees.filter(e => e.phone)
  const togSel = (id) => setSel(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])
  const allSel = withPhone.length > 0 && sel.length === withPhone.length
  const togAll = () => setSel(allSel ? [] : withPhone.map(e => e.id))

  const send = async () => {
    if (!msg.trim() || sel.length === 0) return
    setSending(true); setStatus(null)
    try {
      const recipients = employees.filter(e => sel.includes(e.id))
      const res = await fetch('/api/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, recipients: recipients.map(e => ({ name: e.name, phone: e.phone })) })
      })
      const data = await res.json()
      if (data.success) { setStatus({ ok: true, text: `SMS skickat till ${sel.length} person(er)!` }); setMsg(''); setSel([]) }
      else { setStatus({ ok: false, text: data.error || 'Något gick fel' }) }
    } catch { setStatus({ ok: false, text: 'Kunde inte skicka — kontrollera Twilio-inställningar' }) }
    setSending(false)
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div><div style={{ fontSize: 15, fontWeight: 700 }}>Skicka SMS</div><div style={{ fontSize: 12, color: '#888', marginTop: 1 }}>Till anställda och UE</div></div>
      </div>

      {withPhone.length === 0 && (
        <div className="info-box">Inga anställda har telefonnummer inlagt. Gå till ⚙️ och lägg till telefonnummer på dina anställda.</div>
      )}

      {withPhone.length > 0 && (
        <>
          <div className="sec">Välj mottagare</div>
          <div className="card" style={{ padding: '4px 12px', marginBottom: 12 }}>
            <div className="toggle-row">
              <span style={{ fontSize: 14, fontWeight: 600 }}>Välj alla</span>
              <div className={`checkbox${allSel ? ' checked' : ''}`} onClick={togAll}>{allSel && <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>✓</span>}</div>
            </div>
            {withPhone.map(emp => (
              <div key={emp.id} className="toggle-row">
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: 14 }}>{emp.name}</span>
                  <span style={{ fontSize: 11, color: '#888' }}>{emp.phone}</span>
                </div>
                <div className={`checkbox${sel.includes(emp.id) ? ' checked' : ''}`} onClick={() => togSel(emp.id)}>{sel.includes(emp.id) && <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>✓</span>}</div>
              </div>
            ))}
          </div>

          <div className="field-group">
            <div className="field-label">Meddelande *</div>
            <textarea className="field" placeholder="T.ex. Möte imorgon kl 07:00 på kontoret..." value={msg} onChange={e => setMsg(e.target.value)} style={{ minHeight: 100 }} />
            <div style={{ fontSize: 11, color: '#888', marginTop: 3 }}>{msg.length} tecken</div>
          </div>

          {status && (
            <div style={{ background: status.ok ? '#E6F7EE' : '#FEECEC', border: `0.5px solid ${status.ok ? '#2d9e5a' : '#e24b4a'}`, borderRadius: 8, padding: '10px 12px', marginBottom: 10, fontSize: 13, color: status.ok ? '#1a7a3c' : '#a32d2d' }}>
              {status.ok ? '✓ ' : '⚠ '}{status.text}
            </div>
          )}

          <button className="btn-primary" style={{ background: sel.length === 0 || !msg.trim() ? '#ccc' : '#1a1a1a' }} onClick={send} disabled={sending || sel.length === 0 || !msg.trim()}>
            {sending ? 'Skickar...' : `Skicka SMS till ${sel.length} person(er)`}
          </button>
        </>
      )}

      <div style={{ marginTop: 16, background: '#F0EFE8', borderRadius: 8, padding: '10px 12px', fontSize: 12, color: '#888', lineHeight: 1.6 }}>
        <strong style={{ color: '#1a1a1a' }}>Kräver Twilio-uppsättning</strong><br />
        Lägg till <code>TWILIO_ACCOUNT_SID</code>, <code>TWILIO_AUTH_TOKEN</code> och <code>TWILIO_PHONE_NUMBER</code> i Vercel Environment Variables.
      </div>
    </div>
  )
}
// ─── Körsedlar Tab (Transport) ────────────────────────────────
function KorsedlarTab({ co, korsedlar, kunder, employees, sess, isAdmin, addKorsedel, deleteKorsedel, updateKorsedel }) {
  const [view, setView] = useState('list')
  const [filter, setFilter] = useState('alla')
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState({ date: today(), forare: sess.name, kund_id: '', markning: '', fordon: '', antal_lass: '', timmar: '', pristyp: 'lopande', pris: '', notering: '' })

  const submit = async () => {
    if (!form.kund_id) return
    if (editId) {
      await updateKorsedel(editId, { ...form, antal_lass: parseFloat(form.antal_lass) || 0, timmar: parseFloat(form.timmar) || 0, pris: parseFloat(form.pris) || 0 })
    } else {
      await addKorsedel({ ...form, company: co.id, antal_lass: parseFloat(form.antal_lass) || 0, timmar: parseFloat(form.timmar) || 0, pris: parseFloat(form.pris) || 0, fakturerad: false })
    }
    setForm({ date: today(), forare: sess.name, kund_id: '', markning: '', fordon: '', antal_lass: '', timmar: '', pristyp: 'lopande', pris: '', notering: '' })
    setEditId(null)
    setView('list')
  }

  const startEdit = (k) => {
    setForm({ date: k.date, forare: k.forare, kund_id: k.kund_id || '', markning: k.markning || '', fordon: k.fordon || '', antal_lass: String(k.antal_lass || ''), timmar: String(k.timmar || ''), pristyp: k.pristyp || 'lopande', pris: String(k.pris || ''), notering: k.notering || '' })
    setEditId(k.id)
    setView('add')
  }

  const getKund = (id) => kunder.find(k => k.id === id)
  const filtered = filter === 'alla' ? korsedlar : filter === 'fakturerad' ? korsedlar.filter(k => k.fakturerad) : korsedlar.filter(k => !k.fakturerad)
  const totalH = r1(filtered.reduce((s, k) => s + (k.timmar || 0), 0))
  const totalLass = filtered.reduce((s, k) => s + (k.antal_lass || 0), 0)
  const ejFakturerade = korsedlar.filter(k => !k.fakturerad).length

  if (view === 'add') return (
    <div>
      <button className="btn-back" onClick={() => { setView('list'); setEditId(null); setForm({ date: today(), forare: sess.name, kund_id: '', markning: '', fordon: '', antal_lass: '', timmar: '', pristyp: 'lopande', pris: '', notering: '' }) }}>{Icon.back} Tillbaka</button>
      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>{editId ? 'Redigera körsedel' : 'Ny körsedel'}</div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div className="field-group"><div className="field-label">Datum</div><input className="field" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></div>
        <div className="field-group"><div className="field-label">Förare</div>
          <select className="field" value={form.forare} onChange={e => setForm({ ...form, forare: e.target.value })}>
            {employees.filter(e => e.role !== 'admin').map(e => <option key={e.id} value={e.name}>{e.name}</option>)}
            <option value={sess.name}>{sess.name}</option>
          </select>
        </div>
      </div>

      <div className="field-group"><div className="field-label">Kund *</div>
        {kunder.length === 0
          ? <div style={{ fontSize: 13, color: '#888' }}>Inga kunder — lägg till via ⚙️</div>
          : <select className="field" value={form.kund_id} onChange={e => setForm({ ...form, kund_id: e.target.value })}>
              <option value="">Välj kund...</option>
              {kunder.map(k => <option key={k.id} value={k.id}>{k.name}</option>)}
            </select>}
      </div>

      <div className="field-group"><div className="field-label">Märkning / Uppdrag</div><input className="field" placeholder="T.ex. Schaktmassor Mölndal → Deponi, proj 2401" value={form.markning} onChange={e => setForm({ ...form, markning: e.target.value })} /></div>
      <div className="field-group"><div className="field-label">Fordon (reg.nr)</div><input className="field" placeholder="T.ex. ABC123" value={form.fordon} onChange={e => setForm({ ...form, fordon: e.target.value.toUpperCase() })} /></div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div className="field-group"><div className="field-label">Antal lass</div><input className="field" type="number" min="0" step="1" placeholder="0" value={form.antal_lass} onChange={e => setForm({ ...form, antal_lass: e.target.value })} /></div>
        <div className="field-group"><div className="field-label">Timmar</div><input className="field" type="number" min="0" step="0.5" placeholder="0" value={form.timmar} onChange={e => setForm({ ...form, timmar: e.target.value })} /></div>
      </div>

      <div className="field-group"><div className="field-label">Pristyp</div>
        <div className="chip-group">
          {[{ k: 'fast', l: '💰 Fast pris' }, { k: 'lopande', l: '⏱ Löpande' }].map(p => (
            <div key={p.k} className={`chip${form.pristyp === p.k ? ' selected' : ''}`} onClick={() => setForm({ ...form, pristyp: p.k })}>{p.l}</div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div className="field-group"><div className="field-label">Pris (kr)</div><input className="field" type="number" min="0" placeholder="0" value={form.pris} onChange={e => setForm({ ...form, pris: e.target.value })} /></div>
        <div className="field-group"><div className="field-label">Notering</div><input className="field" placeholder="Valfri kommentar" value={form.notering} onChange={e => setForm({ ...form, notering: e.target.value })} /></div>
      </div>

      <button className="btn-primary" onClick={submit} disabled={!form.kund_id}>{editId ? 'Spara ändringar' : 'Spara körsedel'}</button>
    </div>
  )

  // Gruppera per vecka
  const getWeekKey = (dateStr) => {
    const d = new Date(dateStr + 'T12:00:00')
    const mon = new Date(d)
    mon.setDate(d.getDate() - ((d.getDay() + 6) % 7))
    return mon.toISOString().slice(0, 10)
  }
  const getWeekLabel = (monStr) => {
    const mon = new Date(monStr + 'T12:00:00')
    const sun = new Date(mon); sun.setDate(mon.getDate() + 6)
    const opts = { day: 'numeric', month: 'short' }
    return `${mon.toLocaleDateString('sv-SE', opts)} – ${sun.toLocaleDateString('sv-SE', opts)}`
  }
  const getWeekNum = (monStr) => {
    const d = new Date(monStr + 'T12:00:00')
    const jan1 = new Date(d.getFullYear(), 0, 1)
    return Math.ceil(((d - jan1) / 86400000 + jan1.getDay() + 1) / 7)
  }

  const weekGroups = {}
  filtered.forEach(k => {
    const wk = getWeekKey(k.date)
    if (!weekGroups[wk]) weekGroups[wk] = []
    weekGroups[wk].push(k)
  })
  const sortedWeeks = Object.keys(weekGroups).sort((a, b) => b.localeCompare(a))

  return (
    <div>
      <div className="stat-grid">
        <div className="stat-card"><div className="stat-label">Timmar</div><div className="stat-val" style={{ color: co.color }}>{totalH}h</div></div>
        <div className="stat-card"><div className="stat-label">Lass</div><div className="stat-val">{totalLass}</div></div>
      </div>

      {isAdmin && (
        <div className="sub-tabs" style={{ marginBottom: 12 }}>
          <button className={`sub-tab${filter === 'alla' ? ' active' : ''}`} onClick={() => setFilter('alla')}>Alla</button>
          <button className={`sub-tab${filter === 'ej_fakturerad' ? ' active' : ''}`} onClick={() => setFilter('ej_fakturerad')}>Ej fakturerad {ejFakturerade > 0 ? `(${ejFakturerade})` : ''}</button>
          <button className={`sub-tab${filter === 'fakturerad' ? ' active' : ''}`} onClick={() => setFilter('fakturerad')}>Fakturerad</button>
        </div>
      )}

      {filtered.length === 0 && <div className="empty">Inga körsedlar {filter !== 'alla' ? 'i denna vy' : 'ännu'}.</div>}

      {sortedWeeks.map(wk => {
        const rows = weekGroups[wk].sort((a, b) => b.date.localeCompare(a.date))
        const wkH = r1(rows.reduce((s, k) => s + (k.timmar || 0), 0))
        const wkLass = rows.reduce((s, k) => s + (k.antal_lass || 0), 0)
        const allFakt = rows.every(k => k.fakturerad)
        return (
          <div key={wk} style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#555' }}>
                Vecka {getWeekNum(wk)} · {getWeekLabel(wk)}
              </div>
              <div style={{ fontSize: 11, color: '#888', display: 'flex', gap: 8 }}>
                {wkH > 0 && <span>{wkH}h</span>}
                {wkLass > 0 && <span>{wkLass} lass</span>}
                {allFakt && <span style={{ color: '#1a7a3c', fontWeight: 600 }}>✓ Fakturerad</span>}
              </div>
            </div>
            {rows.map(k => {
              const kund = getKund(k.kund_id)
              const canDel = isAdmin || k.forare === sess.name
              return (
                <div key={k.id} className="entry-card" style={{ marginBottom: 6, opacity: k.fakturerad ? 0.6 : 1 }}>
                  <div className="card-row">
                    <div>
                      <div style={{ fontSize: 12, color: '#888' }}>{fmt(k.date)}</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: co.color, marginTop: 2 }}>{kund?.name || '—'}</div>
                      {k.markning && <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>{k.markning}</div>}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                      {k.timmar > 0 && <span style={{ fontSize: 15, fontWeight: 700, color: co.color }}>{k.timmar}h</span>}
                      {k.antal_lass > 0 && <span style={{ fontSize: 12, color: '#888' }}>{k.antal_lass} lass</span>}
                      {canDel && <div style={{ display: 'flex', gap: 4 }}>
                        <button style={{ padding: '3px 6px', background: 'transparent', border: '0.5px solid rgba(0,0,0,.2)', borderRadius: 6, cursor: 'pointer', fontSize: 12 }} onClick={() => startEdit(k)}>✏️</button>
                        <button className="btn-danger" style={{ padding: '3px 6px' }} onClick={() => deleteKorsedel(k.id)}>{Icon.del}</button>
                      </div>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                    <div className="tag">👤 {k.forare}</div>
                    {k.fordon && <div className="tag">🚛 {k.fordon}</div>}
                    {k.pris > 0 && <div className="tag">{k.pristyp === 'fast' ? '💰' : '⏱'} {k.pris.toLocaleString('sv-SE')} kr</div>}
                    {isAdmin && (
                      <button onClick={() => updateKorsedel(k.id, { fakturerad: !k.fakturerad })} style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 20, border: 'none', cursor: 'pointer', fontFamily: 'inherit', background: k.fakturerad ? '#E6F7EE' : '#1a1a1a', color: k.fakturerad ? '#1a7a3c' : '#fff' }}>
                        {k.fakturerad ? '✓ Fakturerad' : 'Markera fakturerad'}
                      </button>
                    )}
                    {!isAdmin && k.fakturerad && <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 600, color: '#1a7a3c' }}>✓ Fakturerad</span>}
                  </div>
                </div>
              )
            })}
          </div>
        )
      })}
      <button className="btn-primary" style={{ marginTop: 8 }} onClick={() => setView('add')}>+ Ny körsedel</button>
    </div>
  )
}

// ─── Transport Rapport Tab ────────────────────────────────────
function TransportRapportTab({ co, korsedlar, kunder }) {
  const [filter, setFilter] = useState('kund')
  const [pdfLoading, setPdfLoading] = useState(false)

  const byKund = {}
  korsedlar.forEach(k => {
    const namn = kunder.find(x => x.id === k.kund_id)?.name || 'Okänd'
    if (!byKund[namn]) byKund[namn] = { timmar: 0, lass: 0, pris: 0, rader: [] }
    byKund[namn].timmar = r1(byKund[namn].timmar + (k.timmar || 0))
    byKund[namn].lass += k.antal_lass || 0
    byKund[namn].pris += k.pris || 0
    byKund[namn].rader.push(k)
  })

  const byForare = {}
  korsedlar.forEach(k => {
    if (!byForare[k.forare]) byForare[k.forare] = { timmar: 0, lass: 0, rader: [] }
    byForare[k.forare].timmar = r1(byForare[k.forare].timmar + (k.timmar || 0))
    byForare[k.forare].lass += k.antal_lass || 0
    byForare[k.forare].rader.push(k)
  })

  const downloadPDF = async () => {
    setPdfLoading(true)
    try {
      const JsPDF = await loadJsPDF()
      const doc = new JsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pw = 210; const margin = 16; const cw = pw - margin * 2; let y = margin

      doc.setFillColor(26, 26, 26); doc.rect(0, 0, pw, 28, 'F')
      doc.setTextColor(255, 255, 255); doc.setFontSize(16); doc.setFont('helvetica', 'bold')
      doc.text('BOAG', margin, 12)
      doc.setFontSize(8); doc.setFont('helvetica', 'normal')
      doc.text('TRANSPORT AB', margin, 18)
      doc.text(fmt(today()), pw - margin, 18, { align: 'right' })
      y = 36

      doc.setTextColor(0, 0, 0); doc.setFontSize(16); doc.setFont('helvetica', 'bold')
      doc.text('Körsammanställning', margin, y); y += 10

      Object.entries(byKund).forEach(([namn, data], idx) => {
        if (idx > 0) { doc.addPage(); y = margin }
        doc.setFontSize(13); doc.setFont('helvetica', 'bold'); doc.setTextColor(45, 143, 78)
        doc.text(namn, margin, y); y += 6
        doc.setDrawColor(200, 200, 200); doc.line(margin, y, margin + cw, y); y += 5
        data.rader.forEach(r => {
          if (y > 270) { doc.addPage(); y = margin }
          doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(0, 0, 0)
          doc.text(fmt(r.date), margin, y)
          doc.text(r.forare, margin + 30, y)
          doc.text(r.markning || '—', margin + 65, y)
          if (r.timmar > 0) doc.text(r.timmar + 'h', margin + cw - 20, y, { align: 'right' })
          if (r.antal_lass > 0) doc.text(r.antal_lass + ' lass', margin + cw, y, { align: 'right' })
          y += 5
        })
        y += 3
        doc.setDrawColor(220, 220, 220); doc.line(margin, y, margin + cw, y); y += 6
        doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(0, 0, 0)
        doc.text(`Summa: ${data.timmar}h · ${data.lass} lass${data.pris > 0 ? ' · ' + data.pris.toLocaleString('sv-SE') + ' kr' : ''}`, margin, y)
      })

      const pages = doc.getNumberOfPages()
      for (let i = 1; i <= pages; i++) {
        doc.setPage(i); doc.setFontSize(8); doc.setTextColor(160, 160, 160)
        doc.text(`BOAG Transport AB · Genererad ${fmt(today())}`, margin, 292)
        doc.text(`${i} / ${pages}`, pw - margin, 292, { align: 'right' })
      }
      doc.save(`Transport_sammanstallning_${today()}.pdf`)
    } catch (e) { console.error(e) }
    setPdfLoading(false)
  }

  const totalH = r1(korsedlar.reduce((s, k) => s + (k.timmar || 0), 0))
  const totalLass = korsedlar.reduce((s, k) => s + (k.antal_lass || 0), 0)
  const totalPris = korsedlar.reduce((s, k) => s + (k.pris || 0), 0)

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <button className="btn-primary" style={{ marginTop: 0, background: '#1a1a1a', fontSize: 13 }} onClick={downloadPDF} disabled={pdfLoading}>{pdfLoading ? '⏳ Genererar...' : '⬇ PDF för fakturering'}</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 14 }}>
        <div className="stat-card"><div className="stat-label">Timmar</div><div className="stat-val" style={{ fontSize: 18 }}>{totalH}h</div></div>
        <div className="stat-card"><div className="stat-label">Lass</div><div className="stat-val" style={{ fontSize: 18 }}>{totalLass}</div></div>
        <div className="stat-card"><div className="stat-label">Pris</div><div className="stat-val" style={{ fontSize: 14 }}>{totalPris.toLocaleString('sv-SE')} kr</div></div>
      </div>
      <div className="sub-tabs" style={{ marginBottom: 14 }}>
        <button className={`sub-tab${filter === 'kund' ? ' active' : ''}`} onClick={() => setFilter('kund')}>Per kund</button>
        <button className={`sub-tab${filter === 'forare' ? ' active' : ''}`} onClick={() => setFilter('forare')}>Per förare</button>
      </div>
      {filter === 'kund' && Object.entries(byKund).map(([namn, data]) => (
        <div key={namn} className="card">
          <div className="card-row"><div style={{ fontSize: 14, fontWeight: 700 }}>{namn}</div><div style={{ fontSize: 13, color: co.color, fontWeight: 700 }}>{data.timmar}h · {data.lass} lass</div></div>
          {data.pris > 0 && <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{data.pris.toLocaleString('sv-SE')} kr</div>}
        </div>
      ))}
      {filter === 'forare' && Object.entries(byForare).map(([namn, data]) => (
        <div key={namn} className="card">
          <div className="card-row"><div style={{ fontSize: 14, fontWeight: 700 }}>👤 {namn}</div><div style={{ fontSize: 13, color: co.color, fontWeight: 700 }}>{data.timmar}h · {data.lass} lass</div></div>
        </div>
      ))}
      {korsedlar.length === 0 && <div className="empty">Inga körsedlar att rapportera.</div>}
    </div>
  )
}

// ─── Svetsprotokoll Tab (MB Mark) ─────────────────────────────
function SvetsprotokollTab({ co, svetsprotokoll, projects, sess, isAdmin, addSvets, deleteSvets }) {
  const [view, setView] = useState('list')
  const [form, setForm] = useState({ date: today(), svetsare: sess.name, project_id: '', rortyp: '', dimension: '', skarv_nr: '', svetsmetod: 'IR', pristyp: 'per_skarv', pris_per_skarv: '', antal_skarvar: '1', notering: '' })

  const submit = async () => {
    if (!form.svetsare) return
    await addSvets({ ...form, company: co.id, antal_skarvar: parseInt(form.antal_skarvar) || 1, pris_per_skarv: parseFloat(form.pris_per_skarv) || 0 })
    setForm({ date: today(), svetsare: sess.name, project_id: '', rortyp: '', dimension: '', skarv_nr: '', svetsmetod: 'IR', pristyp: 'per_skarv', pris_per_skarv: '', antal_skarvar: '1', notering: '' })
    setView('list')
  }

  const totalSkarvar = svetsprotokoll.reduce((s, p) => s + (p.antal_skarvar || 0), 0)

  if (view === 'add') return (
    <div>
      <button className="btn-back" onClick={() => setView('list')}>{Icon.back} Tillbaka</button>
      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>Nytt svetsprotokoll</div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div className="field-group"><div className="field-label">Datum</div><input className="field" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></div>
        <div className="field-group"><div className="field-label">Svetsare</div><input className="field" value={form.svetsare} readOnly style={{ background: '#F0EFE8' }} /></div>
      </div>

      {projects.length > 0 && (
        <div className="field-group"><div className="field-label">Projekt</div>
          <div className="chip-group">{projects.map(p => <div key={p.id} className={`chip${form.project_id === p.id ? ' selected' : ''}`} onClick={() => setForm({ ...form, project_id: p.id })}>{p.name}</div>)}</div>
        </div>
      )}

      <div style={{ background: '#F0EFE8', borderRadius: 10, padding: '10px 12px', marginBottom: 10 }}>
        <div style={{ fontSize: 12, color: '#888', fontWeight: 600, marginBottom: 8 }}>RÖRINFORMATION</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div className="field-group" style={{ marginBottom: 0 }}><div className="field-label">Rörtyp</div><input className="field" placeholder="T.ex. PE100, PEX" value={form.rortyp} onChange={e => setForm({ ...form, rortyp: e.target.value })} /></div>
          <div className="field-group" style={{ marginBottom: 0 }}><div className="field-label">Dimension (mm)</div><input className="field" placeholder="T.ex. 110, 160, 315" value={form.dimension} onChange={e => setForm({ ...form, dimension: e.target.value })} /></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
          <div className="field-group" style={{ marginBottom: 0 }}><div className="field-label">Skarv nr</div><input className="field" placeholder="T.ex. S-001" value={form.skarv_nr} onChange={e => setForm({ ...form, skarv_nr: e.target.value })} /></div>
          <div className="field-group" style={{ marginBottom: 0 }}><div className="field-label">Svetsmetod</div>
            <select className="field" value={form.svetsmetod} onChange={e => setForm({ ...form, svetsmetod: e.target.value })}>
              <option value="IR">IR (Infraröd)</option>
              <option value="EL">EL-svets</option>
              <option value="Spegel">Spegelsvets</option>
              <option value="Annat">Annat</option>
            </select>
          </div>
        </div>
      </div>

      <div className="field-group"><div className="field-label">Pristyp</div>
        <div className="chip-group">
          {[{ k: 'per_skarv', l: '🔧 Per skarv' }, { k: 'lopande', l: '⏱ Löpande' }].map(p => (
            <div key={p.k} className={`chip${form.pristyp === p.k ? ' selected' : ''}`} onClick={() => setForm({ ...form, pristyp: p.k })}>{p.l}</div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div className="field-group"><div className="field-label">Antal skarvar</div><input className="field" type="number" min="1" step="1" value={form.antal_skarvar} onChange={e => setForm({ ...form, antal_skarvar: e.target.value })} /></div>
        {form.pristyp === 'per_skarv' && <div className="field-group"><div className="field-label">Pris/skarv (kr)</div><input className="field" type="number" min="0" placeholder="0" value={form.pris_per_skarv} onChange={e => setForm({ ...form, pris_per_skarv: e.target.value })} /></div>}
      </div>

      <div className="field-group"><div className="field-label">Notering</div><textarea className="field" placeholder="Svetsparametrar, avvikelser, kontrollresultat..." value={form.notering} onChange={e => setForm({ ...form, notering: e.target.value })} /></div>

      <button className="btn-primary" onClick={submit}>Spara svetsprotokoll</button>
    </div>
  )

  return (
    <div>
      <div className="stat-grid">
        <div className="stat-card"><div className="stat-label">Totalt skarvar</div><div className="stat-val" style={{ color: co.color }}>{totalSkarvar}</div></div>
        <div className="stat-card"><div className="stat-label">Protokoll</div><div className="stat-val">{svetsprotokoll.length}</div></div>
      </div>
      {svetsprotokoll.length === 0 && <div className="empty">Inga svetsprotokoll ännu.</div>}
      {svetsprotokoll.map(p => {
        const proj = projects.find(x => x.id === p.project_id)
        const canDel = isAdmin || p.svetsare === sess.name
        const totPris = p.pristyp === 'per_skarv' ? (p.antal_skarvar || 0) * (p.pris_per_skarv || 0) : 0
        return (
          <div key={p.id} className="entry-card">
            <div className="card-row">
              <div>
                <div style={{ fontSize: 12, color: '#888' }}>{fmt(p.date)}</div>
                {proj && <div style={{ fontSize: 13, fontWeight: 700, color: co.color, marginTop: 2 }}>{proj.name}</div>}
                <div style={{ fontSize: 13, marginTop: 2 }}>{p.rortyp} {p.dimension && `Ø${p.dimension}mm`} · {p.svetsmetod}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: co.color }}>{p.antal_skarvar} skarv{p.antal_skarvar > 1 ? 'ar' : ''}</span>
                {p.skarv_nr && <span style={{ fontSize: 11, color: '#888' }}>{p.skarv_nr}</span>}
                {canDel && <button className="btn-danger" style={{ padding: '3px 6px' }} onClick={() => deleteSvets(p.id)}>{Icon.del}</button>}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
              <div className="tag">👤 {p.svetsare}</div>
              {p.pristyp === 'per_skarv' && totPris > 0 && <div className="tag">🔧 {totPris.toLocaleString('sv-SE')} kr</div>}
              {p.pristyp === 'lopande' && <div className="tag">⏱ Löpande</div>}
            </div>
            {p.notering && <div style={{ fontSize: 12, color: '#888', marginTop: 6 }}>{p.notering}</div>}
          </div>
        )
      })}
      <button className="btn-primary" style={{ marginTop: 8 }} onClick={() => setView('add')}>+ Nytt svetsprotokoll</button>
    </div>
  )
}

// ─── Massbalansering Tab ──────────────────────────────────────
const MATERIAL_TYPES = [
  'Bärlager', 'Obundet bärlager', 'Kringfyllning', 'Schaktmassor', 
  'Lera', 'Berg/sprängsten', 'Sand', 'Makadam', 'Återfyllning', 'Annat'
]

function MassbalansTab({ sess, isAdmin, massbalans, masskommentarer, addMassbalans, updateMassbalans, deleteMassbalans, addMasskommentar, employees }) {
  const [view, setView] = useState('list')
  const [selId, setSelId] = useState(null)
  const [aiResult, setAiResult] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [filter, setFilter] = useState('all')
  const [form, setForm] = useState({
    projekt: '', adress: '', company: '',
    overskott: [{ typ: 'Schaktmassor', mangd: '', enhet: 'm³' }],
    behov: [{ typ: 'Bärlager', mangd: '', enhet: 'm³' }],
    kontakt: sess.name, status: 'aktiv', notering: ''
  })
  const [komText, setKomText] = useState('')

  const COMPANIES_LIST = ['BOAG Mark AB', 'BOAG Bygg AB', 'BOAG Transport AB', 'MB Mark & Hyr AB']

  const addOvskRow = () => setForm(f => ({ ...f, overskott: [...f.overskott, { typ: 'Schaktmassor', mangd: '', enhet: 'm³' }] }))
  const addBehovRow = () => setForm(f => ({ ...f, behov: [...f.behov, { typ: 'Bärlager', mangd: '', enhet: 'm³' }] }))
  const updOvsk = (i, k, v) => setForm(f => { const o = [...f.overskott]; o[i] = { ...o[i], [k]: v }; return { ...f, overskott: o } })
  const updBehov = (i, k, v) => setForm(f => { const b = [...f.behov]; b[i] = { ...b[i], [k]: v }; return { ...f, behov: b } })
  const remOvsk = (i) => setForm(f => ({ ...f, overskott: f.overskott.filter((_, j) => j !== i) }))
  const remBehov = (i) => setForm(f => ({ ...f, behov: f.behov.filter((_, j) => j !== i) }))

  const submit = async () => {
    if (!form.projekt.trim() || !form.adress.trim()) return
    await addMassbalans({ ...form })
    setForm({ projekt: '', adress: '', company: '', overskott: [{ typ: 'Schaktmassor', mangd: '', enhet: 'm³' }], behov: [{ typ: 'Bärlager', mangd: '', enhet: 'm³' }], kontakt: sess.name, status: 'aktiv', notering: '' })
    setView('list')
  }

  const sendKom = async () => {
    if (!komText.trim()) return
    await addMasskommentar({ massbalans_id: selId, author: sess.name, text: komText.trim() })
    setKomText('')
  }

  const runAI = async () => {
    setAiLoading(true); setAiResult(null)
    const aktiva = massbalans.filter(m => m.status === 'aktiv')
    if (aktiva.length < 2) { setAiResult({ text: 'Det behövs minst 2 aktiva poster för att hitta matchningar.', matches: [] }); setAiLoading(false); return }

    const prompt = `Du är en expert på massbalansering inom mark- och anläggning i Sverige.

Här är aktiva massposter från BOAG-koncernens projekt:

${aktiva.map((m, i) => `${i+1}. Projekt: "${m.projekt}" | Adress: ${m.adress} | Bolag: ${m.company || 'okänt'}
   Överskott: ${(m.overskott||[]).map(o => `${o.mangd || '?'} ${o.enhet} ${o.typ}`).join(', ') || 'inget'}
   Behov: ${(m.behov||[]).map(b => `${b.mangd || '?'} ${b.enhet} ${b.typ}`).join(', ') || 'inget'}
   Kontakt: ${m.kontakt || 'okänd'}`).join('\n\n')}

Analysera dessa poster och:
1. Identifiera de bästa matchningarna (överskott möter behov)
2. Rangordna matchningarna efter lämplighet
3. Notera om BOAG Transport bör kontaktas för transport

Svara på svenska i JSON-format:
{
  "sammanfattning": "kort analys",
  "matchningar": [
    {
      "rang": 1,
      "fran_projekt": "projektnamn",
      "till_projekt": "projektnamn", 
      "material": "materialtyp",
      "mangd": "mängd och enhet",
      "motivering": "kort motivering",
      "transport_behov": true/false
    }
  ],
  "rekommendation": "övergripande rekommendation"
}`

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{ role: 'user', content: prompt }]
        })
      })
      const data = await res.json()
      const raw = data.content?.find(c => c.type === 'text')?.text || ''
      const clean = raw.replace(/```json|```/g, '').trim()
      const parsed = JSON.parse(clean)
      setAiResult(parsed)
    } catch (e) {
      setAiResult({ sammanfattning: 'Kunde inte analysera just nu, försök igen.', matchningar: [], rekommendation: '' })
    }
    setAiLoading(false)
  }

  const sel = selId ? massbalans.find(m => m.id === selId) : null
  const selKomm = masskommentarer.filter(k => k.massbalans_id === selId)
  const filtered = filter === 'all' ? massbalans : massbalans.filter(m => m.status === filter)

  // Detail view
  if (view === 'detail' && sel) return (
    <div>
      <button className="btn-back" onClick={() => { setView('list'); setSelId(null) }}>{Icon.back} Tillbaka</button>
      <div className="card" style={{ marginBottom: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{sel.projekt}</div>
            <div style={{ fontSize: 13, color: '#888', marginTop: 2 }}>📍 {sel.adress}</div>
            {sel.company && <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{sel.company}</div>}
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 600, background: sel.status === 'aktiv' ? '#E6F7EE' : sel.status === 'matchad' ? '#E8F0FE' : '#F0EFE8', color: sel.status === 'aktiv' ? '#1a7a3c' : sel.status === 'matchad' ? '#1a56a4' : '#888' }}>{sel.status === 'aktiv' ? '✅ Aktiv' : sel.status === 'matchad' ? '🔗 Matchad' : '✓ Klar'}</span>
            {(isAdmin || sel.kontakt === sess.name) && (
              <select style={{ fontSize: 11, border: '0.5px solid rgba(0,0,0,.2)', borderRadius: 6, padding: '2px 4px', background: '#fff', fontFamily: 'inherit' }} value={sel.status} onChange={e => updateMassbalans(sel.id, { status: e.target.value })}>
                <option value="aktiv">Aktiv</option>
                <option value="matchad">Matchad</option>
                <option value="klar">Klar</option>
              </select>
            )}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>
          {sel.overskott?.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#888', marginBottom: 6 }}>📤 ÖVERSKOTT</div>
              {sel.overskott.map((o, i) => <div key={i} style={{ fontSize: 13, padding: '4px 8px', background: '#FEF0E6', borderRadius: 6, marginBottom: 4 }}>{o.mangd && `${o.mangd} ${o.enhet} `}{o.typ}</div>)}
            </div>
          )}
          {sel.behov?.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#888', marginBottom: 6 }}>📥 BEHOV</div>
              {sel.behov.map((b, i) => <div key={i} style={{ fontSize: 13, padding: '4px 8px', background: '#E8F0FE', borderRadius: 6, marginBottom: 4 }}>{b.mangd && `${b.mangd} ${b.enhet} `}{b.typ}</div>)}
            </div>
          )}
        </div>
        {sel.notering && <div style={{ fontSize: 13, color: '#666', marginTop: 10, borderTop: '0.5px solid rgba(0,0,0,.08)', paddingTop: 8 }}>{sel.notering}</div>}
        <div style={{ fontSize: 12, color: '#888', marginTop: 8 }}>👤 Kontakt: {sel.kontakt}</div>
        {(isAdmin || sel.kontakt === sess.name) && (
          <button className="btn-danger" style={{ width: '100%', marginTop: 10, padding: 8 }} onClick={() => { deleteMassbalans(sel.id); setView('list'); setSelId(null) }}>{Icon.del} Ta bort post</button>
        )}
      </div>

      <div className="sec">Kommentarer</div>
      {selKomm.length === 0 && <div style={{ fontSize: 13, color: '#888', marginBottom: 10 }}>Inga kommentarer ännu.</div>}
      {selKomm.map(k => (
        <div key={k.id} className="entry-card" style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 12, color: '#888' }}>{k.author} · {new Date(k.created_at).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
          <div style={{ fontSize: 14, marginTop: 4 }}>{k.text}</div>
        </div>
      ))}
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <input className="field" placeholder="Skriv en kommentar..." value={komText} onChange={e => setKomText(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendKom()} />
        <button className="btn-orange" style={{ flexShrink: 0 }} onClick={sendKom}>Skicka</button>
      </div>
    </div>
  )

  // Add view
  if (view === 'add') return (
    <div>
      <button className="btn-back" onClick={() => setView('list')}>{Icon.back} Tillbaka</button>
      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>Ny masspost</div>

      <div className="field-group"><div className="field-label">Projektnamn *</div><input className="field" placeholder="T.ex. VA Mölndals väg" value={form.projekt} onChange={e => setForm({ ...form, projekt: e.target.value })} autoFocus /></div>
      <div className="field-group"><div className="field-label">Adress *</div><input className="field" placeholder="T.ex. Mölndalsvägen 45, Göteborg" value={form.adress} onChange={e => setForm({ ...form, adress: e.target.value })} /></div>
      <div className="field-group"><div className="field-label">Bolag</div>
        <div className="chip-group">{COMPANIES_LIST.map(c => <div key={c} className={`chip${form.company === c ? ' selected' : ''}`} onClick={() => setForm({ ...form, company: c })}>{c.replace('BOAG ', '').replace(' AB', '')}</div>)}</div>
      </div>

      <div style={{ background: '#FEF0E6', borderRadius: 10, padding: '10px 12px', marginBottom: 10 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#888', marginBottom: 8 }}>📤 ÖVERSKOTT (material som kan lämnas)</div>
        {form.overskott.map((o, i) => (
          <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6, alignItems: 'center' }}>
            <select className="field" style={{ flex: 2 }} value={o.typ} onChange={e => updOvsk(i, 'typ', e.target.value)}>
              {MATERIAL_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
            <input className="field" type="number" min="0" style={{ flex: 1 }} placeholder="m³" value={o.mangd} onChange={e => updOvsk(i, 'mangd', e.target.value)} />
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e24b4a', fontSize: 16 }} onClick={() => remOvsk(i)}>×</button>
          </div>
        ))}
        <button onClick={addOvskRow} style={{ fontSize: 12, color: '#B84B12', background: 'none', border: '0.5px dashed #E05D1A', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontFamily: 'inherit' }}>+ Lägg till material</button>
      </div>

      <div style={{ background: '#E8F0FE', borderRadius: 10, padding: '10px 12px', marginBottom: 10 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#888', marginBottom: 8 }}>📥 BEHOV (material som behövs)</div>
        {form.behov.map((b, i) => (
          <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6, alignItems: 'center' }}>
            <select className="field" style={{ flex: 2 }} value={b.typ} onChange={e => updBehov(i, 'typ', e.target.value)}>
              {MATERIAL_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
            <input className="field" type="number" min="0" style={{ flex: 1 }} placeholder="m³" value={b.mangd} onChange={e => updBehov(i, 'mangd', e.target.value)} />
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e24b4a', fontSize: 16 }} onClick={() => remBehov(i)}>×</button>
          </div>
        ))}
        <button onClick={addBehovRow} style={{ fontSize: 12, color: '#1a56a4', background: 'none', border: '0.5px dashed #1a6ab5', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontFamily: 'inherit' }}>+ Lägg till behov</button>
      </div>

      <div className="field-group"><div className="field-label">Notering</div><textarea className="field" placeholder="Extra info, tidsperiod, krav på material..." value={form.notering} onChange={e => setForm({ ...form, notering: e.target.value })} /></div>
      <button className="btn-primary" onClick={submit} disabled={!form.projekt.trim() || !form.adress.trim()}>Publicera masspost</button>
    </div>
  )

  // List view
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700 }}>Massbalansering</div>
          <div style={{ fontSize: 12, color: '#888', marginTop: 1 }}>Hela koncernen · {massbalans.filter(m=>m.status==='aktiv').length} aktiva poster</div>
        </div>
        <button style={{ background: '#1a1a1a', border: 'none', color: '#fff', borderRadius: 8, padding: '7px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }} onClick={() => setView('add')}>+ Ny post</button>
      </div>

      {/* AI Analysis */}
      <div style={{ background: 'linear-gradient(135deg, #1a1a2e, #16213e)', borderRadius: 12, padding: '14px', marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: aiResult ? 10 : 0 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>🤖 AI-matchning</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,.5)', marginTop: 2 }}>Analyserar överskott mot behov</div>
          </div>
          <button onClick={runAI} disabled={aiLoading} style={{ background: aiLoading ? 'rgba(255,255,255,.1)' : '#E05D1A', border: 'none', color: '#fff', borderRadius: 8, padding: '8px 14px', fontSize: 12, fontWeight: 600, cursor: aiLoading ? 'default' : 'pointer', fontFamily: 'inherit' }}>
            {aiLoading ? '⏳ Analyserar...' : '✨ Analysera nu'}
          </button>
        </div>
        {aiResult && (
          <div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,.8)', marginBottom: 10, lineHeight: 1.5 }}>{aiResult.sammanfattning}</div>
            {aiResult.matchningar?.map((m, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,.08)', borderRadius: 8, padding: '10px 12px', marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#E05D1A' }}>#{m.rang} Matchning</span>
                  {m.transport_behov && <span style={{ fontSize: 11, background: '#2d8f4e', color: '#fff', padding: '2px 7px', borderRadius: 20 }}>🚛 Transport</span>}
                </div>
                <div style={{ fontSize: 13, color: '#fff', marginBottom: 3 }}>
                  <span style={{ color: '#FEA06D' }}>{m.fran_projekt}</span>
                  <span style={{ color: 'rgba(255,255,255,.4)' }}> → </span>
                  <span style={{ color: '#7ab4f5' }}>{m.till_projekt}</span>
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,.6)' }}>{m.material} · {m.mangd}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,.45)', marginTop: 3 }}>{m.motivering}</div>
              </div>
            ))}
            {aiResult.rekommendation && (
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,.5)', borderTop: '0.5px solid rgba(255,255,255,.1)', paddingTop: 8, marginTop: 4 }}>{aiResult.rekommendation}</div>
            )}
          </div>
        )}
      </div>

      {/* Filter */}
      <div className="sub-tabs" style={{ marginBottom: 12 }}>
        {[{ k: 'all', l: 'Alla' }, { k: 'aktiv', l: '✅ Aktiva' }, { k: 'matchad', l: '🔗 Matchade' }, { k: 'klar', l: '✓ Klara' }].map(f => (
          <button key={f.k} className={`sub-tab${filter === f.k ? ' active' : ''}`} onClick={() => setFilter(f.k)}>{f.l}</button>
        ))}
      </div>

      {filtered.length === 0 && <div className="empty">Inga massposter {filter !== 'all' ? 'med denna status' : 'ännu'}.</div>}
      {filtered.map(m => (
        <div key={m.id} className="card" style={{ cursor: 'pointer' }} onClick={() => { setSelId(m.id); setView('detail') }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{m.projekt}</div>
              <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>📍 {m.adress}</div>
              <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                {m.overskott?.filter(o=>o.typ).map((o, i) => <span key={i} style={{ fontSize: 11, padding: '2px 8px', background: '#FEF0E6', color: '#B84B12', borderRadius: 20 }}>📤 {o.mangd ? o.mangd+'m³ ' : ''}{o.typ}</span>)}
                {m.behov?.filter(b=>b.typ).map((b, i) => <span key={i} style={{ fontSize: 11, padding: '2px 8px', background: '#E8F0FE', color: '#1a56a4', borderRadius: 20 }}>📥 {b.mangd ? b.mangd+'m³ ' : ''}{b.typ}</span>)}
              </div>
            </div>
            <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 600, flexShrink: 0, marginLeft: 8, background: m.status === 'aktiv' ? '#E6F7EE' : m.status === 'matchad' ? '#E8F0FE' : '#F0EFE8', color: m.status === 'aktiv' ? '#1a7a3c' : m.status === 'matchad' ? '#1a56a4' : '#888' }}>{m.status === 'aktiv' ? '✅ Aktiv' : m.status === 'matchad' ? '🔗 Matchad' : '✓ Klar'}</span>
          </div>
          <div style={{ fontSize: 11, color: '#aaa', marginTop: 8 }}>👤 {m.kontakt} {m.company ? '· ' + m.company : ''} · {masskommentarer.filter(k=>k.massbalans_id===m.id).length} kommentarer</div>
        </div>
      ))}
    </div>
  )
}

// ─── Veckoplanning Tab ────────────────────────────────────────
function VeckoplaningTab({ sess, isAdmin, veckoplanning, employees, projects, addVeckopost, updateVeckopost, deleteVeckopost }) {
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    fran_datum: today(), till_datum: today(),
    selected_employees: [],
    project_name: '', company: '', notering: ''
  })

  const COMPANIES_LIST = ['BOAG Mark AB', 'BOAG Bygg AB', 'BOAG Transport AB', 'MB Mark & Hyr AB']

  const getWeekDates = (offset = 0) => {
    const now = new Date()
    const mon = new Date(now)
    mon.setDate(now.getDate() - ((now.getDay() + 6) % 7) + offset * 7)
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(mon); d.setDate(mon.getDate() + i)
      return d.toISOString().slice(0, 10)
    })
  }

  const [weekOffset, setWeekOffset] = useState(0)
  const weekDates = getWeekDates(weekOffset)
  const DAY_NAMES = ['Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag', 'Söndag']

  // Get all dates in range
  const getDatesInRange = (from, to) => {
    const dates = []
    const cur = new Date(from + 'T12:00:00')
    const end = new Date(to + 'T12:00:00')
    while (cur <= end) {
      dates.push(cur.toISOString().slice(0, 10))
      cur.setDate(cur.getDate() + 1)
    }
    return dates
  }

  const toggleEmployee = (emp) => {
    setForm(f => {
      const exists = f.selected_employees.find(e => e.id === emp.id)
      return {
        ...f,
        selected_employees: exists
          ? f.selected_employees.filter(e => e.id !== emp.id)
          : [...f.selected_employees, { id: emp.id, name: emp.name }]
      }
    })
  }

  const toggleAllEmployees = () => {
    const all = employees.filter(e => e.role !== 'admin')
    setForm(f => f.selected_employees.length === all.length
      ? { ...f, selected_employees: [] }
      : { ...f, selected_employees: all.map(e => ({ id: e.id, name: e.name })) }
    )
  }

  const submit = async () => {
    if (!form.selected_employees.length) return
    setSaving(true)
    const dates = getDatesInRange(form.fran_datum, form.till_datum)
    for (const emp of form.selected_employees) {
      for (const datum of dates) {
        await addVeckopost({
          datum, employee_id: emp.id, employee_name: emp.name,
          project_name: form.project_name, company: form.company, notering: form.notering
        })
      }
    }
    setForm({ fran_datum: today(), till_datum: today(), selected_employees: [], project_name: '', company: '', notering: '' })
    setSaving(false)
    setShowForm(false)
  }

  const myPosts = isAdmin ? veckoplanning : veckoplanning.filter(v => v.employee_id === sess.id || v.employee_name === sess.name)
  const postsByDate = {}
  weekDates.forEach(d => { postsByDate[d] = myPosts.filter(v => v.datum === d) })
  const fmtDay = (d) => new Date(d + 'T12:00:00').toLocaleDateString('sv-SE', { weekday: 'short', day: 'numeric', month: 'short' })

  const allEmps = employees.filter(e => e.role !== 'admin')
  const allSelected = form.selected_employees.length === allEmps.length

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700 }}>Veckoplanning</div>
          <div style={{ fontSize: 12, color: '#888', marginTop: 1 }}>{isAdmin ? 'Alla anställda' : sess.name}</div>
        </div>
        {isAdmin && !showForm && <button style={{ background: '#1a1a1a', border: 'none', color: '#fff', borderRadius: 8, padding: '7px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }} onClick={() => setShowForm(true)}>+ Planera</button>}
      </div>

      {/* Add form */}
      {isAdmin && showForm && (
        <div className="card" style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Ny planering</div>

          {/* Date range */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div className="field-group"><div className="field-label">Från datum *</div><input className="field" type="date" value={form.fran_datum} onChange={e => setForm({ ...form, fran_datum: e.target.value, till_datum: e.target.value > form.till_datum ? e.target.value : form.till_datum })} /></div>
            <div className="field-group"><div className="field-label">Till datum *</div><input className="field" type="date" value={form.till_datum} onChange={e => setForm({ ...form, till_datum: e.target.value })} /></div>
          </div>

          {/* Date range preview */}
          {form.fran_datum && form.till_datum && (
            <div style={{ fontSize: 12, color: '#888', marginBottom: 10, background: '#F0EFE8', borderRadius: 6, padding: '5px 10px' }}>
              📅 {getDatesInRange(form.fran_datum, form.till_datum).length} dag(ar) valda
            </div>
          )}

          {/* Employees */}
          <div className="field-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <div className="field-label" style={{ marginBottom: 0 }}>Anställda *</div>
              <button onClick={toggleAllEmployees} style={{ fontSize: 11, color: '#1a1a1a', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>{allSelected ? 'Avmarkera alla' : 'Välj alla'}</button>
            </div>
            <div className="card" style={{ padding: '4px 12px' }}>
              {allEmps.map(emp => {
                const sel = form.selected_employees.find(e => e.id === emp.id)
                return (
                  <div key={emp.id} className="toggle-row" onClick={() => toggleEmployee(emp)} style={{ cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className={`avatar ${emp.role === 'ue' ? 'av-ue-light' : 'av-emp-light'}`} style={{ width: 28, height: 28, fontSize: 11 }}>{ini(emp.name)}</div>
                      <span style={{ fontSize: 14 }}>{emp.name}</span>
                    </div>
                    <div className={`checkbox${sel ? ' checked' : ''}`}>{sel && <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>✓</span>}</div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="field-group"><div className="field-label">Projekt / Arbetsplats</div>
            <input className="field" placeholder="T.ex. VA Mölndalsvägen" value={form.project_name} onChange={e => setForm({ ...form, project_name: e.target.value })} />
          </div>
          <div className="field-group"><div className="field-label">Bolag</div>
            <div className="chip-group">{COMPANIES_LIST.map(c => <div key={c} className={`chip${form.company === c ? ' selected' : ''}`} onClick={() => setForm({ ...form, company: c })}>{c.replace('BOAG ', '').replace(' AB', '')}</div>)}</div>
          </div>
          <div className="field-group"><div className="field-label">Notering (gäller alla valda dagar)</div>
            <input className="field" placeholder="T.ex. Hämta verktyg 07:00, samling på plats" value={form.notering} onChange={e => setForm({ ...form, notering: e.target.value })} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-primary" style={{ flex: 1, marginTop: 0, background: '#1a1a1a' }} onClick={submit} disabled={saving || !form.selected_employees.length}>
              {saving ? '⏳ Sparar...' : `Spara ${form.selected_employees.length > 0 ? `(${form.selected_employees.length} pers × ${getDatesInRange(form.fran_datum, form.till_datum).length} dag)` : ''}`}
            </button>
            <button className="btn-secondary" style={{ marginTop: 0 }} onClick={() => setShowForm(false)}>Avbryt</button>
          </div>
        </div>
      )}

      {/* Week navigator */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', borderRadius: 10, padding: '8px 12px', marginBottom: 12, border: '0.5px solid rgba(0,0,0,.1)' }}>
        <button onClick={() => setWeekOffset(w => w - 1)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#888', padding: '0 8px' }}>‹</button>
        <div style={{ fontSize: 13, fontWeight: 600 }}>
          {weekOffset === 0 ? 'Denna vecka' : weekOffset === 1 ? 'Nästa vecka' : weekOffset === -1 ? 'Förra veckan' : `${new Date(weekDates[0]).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' })} — ${new Date(weekDates[6]).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' })}`}
        </div>
        <button onClick={() => setWeekOffset(w => w + 1)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#888', padding: '0 8px' }}>›</button>
      </div>

      {/* Week view */}
      {weekDates.map((d, di) => {
        const posts = postsByDate[d] || []
        const isToday = d === today()
        const isPast = d < today()
        return (
          <div key={d} style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: isToday ? '#E05D1A' : isPast ? '#bbb' : '#555', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
              {DAY_NAMES[di]} {fmtDay(d)}
              {isToday && <span style={{ fontSize: 10, background: '#E05D1A', color: '#fff', padding: '1px 6px', borderRadius: 20 }}>Idag</span>}
            </div>
            {posts.length === 0 ? (
              <div style={{ fontSize: 12, color: '#ccc', padding: '8px 12px', background: '#fafaf9', borderRadius: 8, border: '0.5px dashed rgba(0,0,0,.1)' }}>—</div>
            ) : (
              <div style={{ background: '#fff', border: `0.5px solid ${isToday ? '#E05D1A44' : 'rgba(0,0,0,.08)'}`, borderRadius: 8, padding: '8px 12px' }}>
                {/* Group by project */}
                {Object.entries(posts.reduce((acc, p) => {
                  const key = p.project_name || '—'
                  if (!acc[key]) acc[key] = { posts: [], company: p.company, notering: p.notering }
                  acc[key].posts.push(p)
                  return acc
                }, {})).map(([proj, data]) => (
                  <div key={proj} style={{ marginBottom: 6, paddingBottom: 6, borderBottom: '0.5px solid rgba(0,0,0,.06)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>{proj}</div>
                        {data.company && <div style={{ fontSize: 11, color: '#888' }}>{data.company}</div>}
                        {data.notering && <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>{data.notering}</div>}
                        {isAdmin && (
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
                            {data.posts.map(p => (
                              <span key={p.id} style={{ fontSize: 11, background: '#F0EFE8', padding: '2px 7px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 4 }}>
                                {ini(p.employee_name)} {p.employee_name.split(' ')[0]}
                                <button onClick={() => deleteVeckopost(p.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e24b4a', fontSize: 12, padding: 0, lineHeight: 1 }}>×</button>
                              </span>
                            ))}
                          </div>
                        )}
                        {!isAdmin && <div className="tag" style={{ marginTop: 4 }}>👤 {data.posts[0]?.employee_name}</div>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Attest Tab ───────────────────────────────────────────────
function AttestTab({ sess, isAdmin, attest, addAttest, updateAttest, deleteAttest, employees, projects }) {
  const [showForm, setShowForm] = useState(false)
  const [subTab, setSubTab] = useState(isAdmin ? 'väntar' : 'mina')
  const [form, setForm] = useState({ datum: today(), typ: 'tid', timmar: '', ob_timmar: '', milersattning: '', km: '', utlagg: '', utlagg_beskr: '', projekt: '', notering: '' })

  const submit = async () => {
    if (!form.datum) return
    await addAttest({ ...form, employee_id: sess.id, employee_name: sess.name })
    setForm({ datum: today(), typ: 'tid', timmar: '', ob_timmar: '', milersattning: '', km: '', utlagg: '', utlagg_beskr: '', projekt: '', notering: '' })
    setShowForm(false)
  }

  const approve = (id) => updateAttest(id, { status: 'godkänd', attested_by: sess.name, attested_at: new Date().toISOString() })
  const reject = (id) => updateAttest(id, { status: 'avvisad', attested_by: sess.name, attested_at: new Date().toISOString() })

  const waiting = attest.filter(a => a.status === 'väntar')
  const mine = attest.filter(a => a.employee_id === sess.id || a.employee_name === sess.name)
  const approved = attest.filter(a => a.status === 'godkänd')

  const fmtAttest = (a) => {
    const parts = []
    if (a.timmar) parts.push(`${a.timmar}h`)
    if (a.ob_timmar) parts.push(`OB: ${a.ob_timmar}h`)
    if (a.km) parts.push(`${a.km} km`)
    if (a.utlagg) parts.push(`Utlägg: ${a.utlagg} kr`)
    return parts.join(' · ')
  }

  const AttestCard = ({ a, showActions }) => (
    <div className="card" style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 12, color: '#888' }}>{fmt(a.datum)}</div>
          <div style={{ fontSize: 14, fontWeight: 700, marginTop: 2 }}>{a.employee_name}</div>
          {a.projekt && <div style={{ fontSize: 12, color: '#888', marginTop: 1 }}>{a.projekt}</div>}
          <div style={{ fontSize: 13, color: '#1a1a1a', marginTop: 4 }}>{fmtAttest(a)}</div>
          {a.notering && <div style={{ fontSize: 12, color: '#888', marginTop: 3 }}>{a.notering}</div>}
          {a.utlagg_beskr && <div style={{ fontSize: 12, color: '#888' }}>📝 {a.utlagg_beskr}</div>}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
          <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 600, background: a.status === 'godkänd' ? '#E6F7EE' : a.status === 'avvisad' ? '#FEECEC' : '#FEF0E6', color: a.status === 'godkänd' ? '#1a7a3c' : a.status === 'avvisad' ? '#a32d2d' : '#B84B12' }}>
            {a.status === 'godkänd' ? '✓ Godkänd' : a.status === 'avvisad' ? '✗ Avvisad' : '⏳ Väntar'}
          </span>
          {showActions && a.status === 'väntar' && (
            <div style={{ display: 'flex', gap: 5 }}>
              <button className="btn-success" style={{ padding: '4px 8px' }} onClick={() => approve(a.id)}>{Icon.ok} OK</button>
              <button className="btn-danger" style={{ padding: '4px 8px' }} onClick={() => reject(a.id)}>{Icon.x2}</button>
            </div>
          )}
          {(isAdmin || a.employee_id === sess.id) && a.status === 'väntar' && (
            <button className="btn-danger" style={{ padding: '3px 6px' }} onClick={() => deleteAttest(a.id)}>{Icon.del}</button>
          )}
        </div>
      </div>
      {a.attested_by && <div style={{ fontSize: 11, color: '#aaa', marginTop: 6 }}>Attesterad av {a.attested_by}</div>}
    </div>
  )

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700 }}>Attest</div>
          <div style={{ fontSize: 12, color: '#888', marginTop: 1 }}>
            {waiting.length > 0 && isAdmin ? `${waiting.length} väntar godkännande` : 'Tid, OB och utlägg'}
          </div>
        </div>
        {!showForm && <button style={{ background: '#1a1a1a', border: 'none', color: '#fff', borderRadius: 8, padding: '7px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }} onClick={() => setShowForm(true)}>+ Skicka in</button>}
      </div>

      {/* Form */}
      {showForm && (
        <div className="card" style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Skicka in för attest</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div className="field-group"><div className="field-label">Datum</div><input className="field" type="date" value={form.datum} onChange={e => setForm({ ...form, datum: e.target.value })} /></div>
            <div className="field-group"><div className="field-label">Projekt</div><input className="field" placeholder="Projektnamn" value={form.projekt} onChange={e => setForm({ ...form, projekt: e.target.value })} /></div>
          </div>
          <div style={{ background: '#F0EFE8', borderRadius: 8, padding: '10px 12px', marginBottom: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#888', marginBottom: 8 }}>TID</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div className="field-group" style={{ marginBottom: 0 }}><div className="field-label">Timmar</div><input className="field" type="number" min="0" step="0.5" placeholder="0" value={form.timmar} onChange={e => setForm({ ...form, timmar: e.target.value })} /></div>
              <div className="field-group" style={{ marginBottom: 0 }}><div className="field-label">OB-timmar</div><input className="field" type="number" min="0" step="0.5" placeholder="0" value={form.ob_timmar} onChange={e => setForm({ ...form, ob_timmar: e.target.value })} /></div>
            </div>
          </div>
          <div style={{ background: '#E8F0FE', borderRadius: 8, padding: '10px 12px', marginBottom: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#888', marginBottom: 8 }}>KÖRSTRÄCKA & UTLÄGG</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div className="field-group" style={{ marginBottom: 0 }}><div className="field-label">Km (milersättn.)</div><input className="field" type="number" min="0" placeholder="0" value={form.km} onChange={e => setForm({ ...form, km: e.target.value })} /></div>
              <div className="field-group" style={{ marginBottom: 0 }}><div className="field-label">Utlägg (kr)</div><input className="field" type="number" min="0" placeholder="0" value={form.utlagg} onChange={e => setForm({ ...form, utlagg: e.target.value })} /></div>
            </div>
            {form.utlagg && <div className="field-group" style={{ marginTop: 8, marginBottom: 0 }}><div className="field-label">Vad avser utlägget?</div><input className="field" placeholder="T.ex. Material, verktyg..." value={form.utlagg_beskr} onChange={e => setForm({ ...form, utlagg_beskr: e.target.value })} /></div>}
          </div>
          <div className="field-group"><div className="field-label">Notering</div><input className="field" placeholder="Valfri kommentar..." value={form.notering} onChange={e => setForm({ ...form, notering: e.target.value })} /></div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-primary" style={{ flex: 1, marginTop: 0, background: '#1a1a1a' }} onClick={submit}>Skicka för attest</button>
            <button className="btn-secondary" style={{ marginTop: 0 }} onClick={() => setShowForm(false)}>Avbryt</button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="sub-tabs" style={{ marginBottom: 12 }}>
        {isAdmin && <button className={`sub-tab${subTab === 'väntar' ? ' active' : ''}`} onClick={() => setSubTab('väntar')}>Väntar {waiting.length > 0 ? `(${waiting.length})` : ''}</button>}
        <button className={`sub-tab${subTab === 'mina' ? ' active' : ''}`} onClick={() => setSubTab('mina')}>Mina</button>
        {isAdmin && <button className={`sub-tab${subTab === 'godkända' ? ' active' : ''}`} onClick={() => setSubTab('godkända')}>Godkända</button>}
      </div>

      {subTab === 'väntar' && isAdmin && (
        <div>
          {waiting.length === 0 && <div className="empty">Inga attestärenden väntar! ✓</div>}
          {waiting.map(a => <AttestCard key={a.id} a={a} showActions={true} />)}
        </div>
      )}
      {subTab === 'mina' && (
        <div>
          {mine.length === 0 && <div className="empty">Du har inte skickat in något ännu.</div>}
          {mine.map(a => <AttestCard key={a.id} a={a} showActions={false} />)}
        </div>
      )}
      {subTab === 'godkända' && isAdmin && (
        <div>
          {approved.length === 0 && <div className="empty">Inga godkända poster.</div>}
          {approved.map(a => <AttestCard key={a.id} a={a} showActions={false} />)}
        </div>
      )}
    </div>
  )
}

function RapportTab({ co, projects, dagbok, tid, ata }) {
  const [sel, setSel] = useState('all')
  const fT = sel === 'all' ? tid : tid.filter(t => t.project_id === sel)
  const fD = sel === 'all' ? dagbok : dagbok.filter(d => d.project_id === sel)
  const fA = sel === 'all' ? ata : ata.filter(a => a.project_id === sel)
  const totalH = r1(fT.reduce((s, t) => s + (t.hours || 0), 0))
  const byE = {}; fT.forEach(t => { byE[t.employee] = r1((byE[t.employee] || 0) + t.hours) })
  const byP = {}; tid.forEach(t => { const p = projects.find(x => x.id === t.project_id); if (p) byP[p.name] = (byP[p.name] || 0) + t.hours })
  const pendA = ata.filter(a => a.status === 'pending').length
  return (
    <div>
      {pendA > 0 && <div style={{ background: '#FEF0E6', border: '0.5px solid #f5c4b3', borderRadius: 8, padding: '9px 11px', marginBottom: 12, fontSize: 13, color: '#B84B12' }}>⚠ {pendA} ÄTA-post{pendA > 1 ? 'er' : ''} väntar godkännande</div>}
      <div className="sec">Filtrera</div>
      <div className="chip-group" style={{ marginBottom: 12 }}>
        <div className={`chip${sel === 'all' ? ' selected' : ''}`} onClick={() => setSel('all')}>Alla</div>
        {projects.map(p => <div key={p.id} className={`chip${sel === p.id ? ' selected' : ''}`} onClick={() => setSel(p.id)}>{p.name}</div>)}
      </div>
      <div className="stat-grid">
        <div className="stat-card"><div className="stat-label">Tim totalt</div><div className="stat-val">{totalH}h</div></div>
        <div className="stat-card"><div className="stat-label">Dagboksposter</div><div className="stat-val">{fD.length}</div></div>
        <div className="stat-card"><div className="stat-label">ÄTA-poster</div><div className="stat-val">{fA.length}</div></div>
        <div className="stat-card"><div className="stat-label">Godkända ÄTA</div><div className="stat-val">{fA.filter(a => a.status === 'approved').length}</div></div>
      </div>
      {Object.keys(byE).length > 0 && <div><div className="sec">Timmar per person</div><div className="card" style={{ padding: '4px 12px' }}>{Object.entries(byE).map(([emp, hrs]) => <div key={emp} className="summary-row"><span>{emp}</span><span style={{ fontWeight: 700 }}>{hrs}h</span></div>)}</div></div>}
      {sel === 'all' && Object.keys(byP).length > 0 && <div><div className="sec">Per projekt</div><div className="card" style={{ padding: '4px 12px' }}>{Object.entries(byP).sort((a, b) => b[1] - a[1]).map(([n, hrs]) => <div key={n} className="summary-row"><span style={{ fontSize: 12 }}>{n}</span><span style={{ fontWeight: 700, color: co.color }}>{hrs}h</span></div>)}</div></div>}
    </div>
  )
}
