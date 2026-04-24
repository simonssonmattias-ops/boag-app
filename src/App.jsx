import { useState, useEffect, useRef } from 'react'
import { supabase } from './lib/supabase'
import boagLogo from ./logo.png'

async function loadJsPDF() {
  const { jsPDF } = await import('https://cdn.jsdelivr.net/npm/jspdf@2.5.1/+esm')
  return jsPDF
}

// ─── Constants ───────────────────────────────────────────────
const COMPANIES = [
  { id: 'mark',      name: 'BOAG Mark AB',       color: '#E05D1A', bg: 'linear-gradient(135deg,#E05D1A,#c44d12)' },
  { id: 'bygg',      name: 'BOAG Bygg AB',        color: '#1a6ab5', bg: 'linear-gradient(135deg,#1a6ab5,#144f8a)' },
  { id: 'transport', name: 'BOAG Transport AB',   color: '#2d8f4e', bg: 'linear-gradient(135deg,#2d8f4e,#1f6636)' },
  { id: 'mbmark',    name: 'MB Mark & Hyr AB',    color: '#7c3aed', bg: 'linear-gradient(135deg,#7c3aed,#5b21b6)' },
]

// ─── Helpers ─────────────────────────────────────────────────
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2) }
function today() { return new Date().toISOString().slice(0, 10) }
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
      { data: tids }, { data: atas }, { data: anns }, { data: fls }
    ] = await Promise.all([
      supabase.from('employees').select('*').order('name'),
      supabase.from('projects').select('*').order('created_at', { ascending: false }),
      supabase.from('dagbok').select('*').order('date', { ascending: false }),
      supabase.from('tid').select('*').order('date', { ascending: false }),
      supabase.from('ata').select('*').order('created_at', { ascending: false }),
      supabase.from('announcements').select('*').order('created_at', { ascending: false }),
      supabase.from('project_files').select('*'),
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
    setLoaded(true)
  }

  const login = (emp) => { setSess(emp); localStorage.setItem('boag_session', JSON.stringify(emp)) }
  const logout = () => { setSess(null); localStorage.removeItem('boag_session') }

  // ── Employee CRUD ──
  const addEmployee = async (data) => {
    const row = { id: uid(), ...data }
    await supabase.from('employees').insert(row)
    setEmployees(e => [...e, row].sort((a, b) => a.name.localeCompare(b.name)))
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
  }
  const updateProject = async (id, data) => {
    await supabase.from('projects').update(data).eq('id', id)
    setProjects(p => p.map(x => x.id === id ? { ...x, ...data } : x))
  }
  const deleteProject = async (id) => {
    await supabase.from('projects').delete().eq('id', id)
    setProjects(p => p.filter(x => x.id !== id))
  }

  // ── Dagbok CRUD ──
  const addDagbok = async (data) => {
    const row = { id: uid(), ...data }
    await supabase.from('dagbok').insert(row)
    setDagbok(d => [row, ...d])
  }
  const deleteDagbok = async (id) => {
    await supabase.from('dagbok').delete().eq('id', id)
    setDagbok(d => d.filter(x => x.id !== id))
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

  // ── ÄTA CRUD ──
  const addAta = async (data) => {
    const row = { id: uid(), ...data, status: 'pending', created_at: today() }
    await supabase.from('ata').insert(row)
    setAta(a => [row, ...a])
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
    const tabs = [{ k: 'projects', l: 'Projekt', i: Icon.proj }, { k: 'arbetsdag', l: 'Arbetsdag', i: Icon.dag }, ...(isAdmin ? [{ k: 'rapport', l: 'Rapport', i: Icon.rap }] : [])]
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
          {coTab === 'projects' && <ProjektTab co={co} projects={cProjects} allProjects={projects} employees={employees} sess={sess} isAdmin={isAdmin} dagbok={cDagbok} tid={cTid} ata={cAta} files={files} addProject={addProject} updateProject={updateProject} deleteProject={deleteProject} addAta={addAta} updateAta={updateAta} deleteAta={deleteAta} addFile={addFile} deleteFile={deleteFile} setLb={setLb} />}
          {coTab === 'arbetsdag' && <ArbetsdagTab co={co} projects={cProjects} dagbok={cDagbok} tid={cTid} employees={employees} addDagbok={addDagbok} deleteDagbok={deleteDagbok} addTid={addTid} deleteTid={deleteTid} sess={sess} isAdmin={isAdmin} setLb={setLb} />}
          {coTab === 'rapport' && isAdmin && <RapportTab co={co} projects={cProjects} dagbok={cDagbok} tid={cTid} ata={cAta} />}
        </div>
      </div>
    )
  }

  // ── Main koncern level ──
  return (
    <div className="app" style={{ '--accent': '#1a1a1a' }}>
      {lb && <div className="lightbox" onClick={() => setLb(null)}><button className="lightbox-close">×</button><img src={lb} alt="" /></div>}
      {showSettings && <SettingsSheet employees={employees} addEmployee={addEmployee} deleteEmployee={deleteEmployee} onClose={() => setShowSettings(false)} />}
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
        <button className={`nav-btn${mainTab === 'kom' ? ' active' : ''}`} onClick={() => setMainTab('kom')}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>Forum</button>
        {isAdmin && <button className={`nav-btn${mainTab === 'sms' ? ' active' : ''}`} onClick={() => setMainTab('sms')}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13 19.79 19.79 0 0 1 1.58 4.4 2 2 0 0 1 3.55 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.1 6.1l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>SMS</button>}
      </nav>
      <div className="content">
        {mainTab === 'home' && <HomeTab ann={ann} addAnn={addAnn} deleteAnn={deleteAnn} sess={sess} isAdmin={isAdmin} />}
        {mainTab === 'bolag' && <BolagTab projects={projects} tid={tid} ata={ata} onSelect={(id) => { setActiveCo(id); setCoTab('projects') }} />}
        {mainTab === 'kom' && <KommunikationTab sess={sess} />}
        {mainTab === 'sms' && isAdmin && <SmsTab employees={employees} />}
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
function SettingsSheet({ employees, addEmployee, deleteEmployee, onClose }) {
  const [view, setView] = useState('list')
  const [form, setForm] = useState({ name: '', role: 'employee', pin: '', phone: '' })
  const [pinErr, setPinErr] = useState('')

  const save = () => {
    if (!form.name.trim()) return
    if (!/^\d{4}$/.test(form.pin)) { setPinErr('PIN måste vara exakt 4 siffror'); return }
    addEmployee({ name: form.name.trim(), role: form.role, pin: form.pin, phone: form.phone.trim() })
    setForm({ name: '', role: 'employee', pin: '', phone: '' }); setPinErr(''); setView('list')
  }

  const del = (id) => {
    if (employees.find(e => e.id === id)?.role === 'admin' && employees.filter(e => e.role === 'admin').length <= 1) { alert('Måste finnas minst en admin.'); return }
    deleteEmployee(id)
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet" onClick={e => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 700 }}>{view === 'add' ? 'Lägg till anställd' : 'Personal'}</div>
          {view === 'list' && <button className="btn-add" onClick={() => setView('add')}>{Icon.plus} Lägg till</button>}
        </div>
        {view === 'list' && (
          <div>
            <div className="info-box"><strong>Hur anställda loggar in:</strong> Dela URL:en via SMS. De öppnar den i mobilen, väljer sitt namn och anger PIN-koden. Ingen app-installation krävs.</div>
            {employees.map(emp => (
              <div key={emp.id} className="emp-row">
                <div className={`avatar ${emp.role === 'admin' ? 'av-admin-light' : emp.role === 'ue' ? 'av-ue-light' : 'av-emp-light'}`} style={{ width: 36, height: 36, fontSize: 12 }}>{ini(emp.name)}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{emp.name}</div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 2, alignItems: 'center' }}>
                    <span className={emp.role === 'admin' ? 'role-badge-admin' : emp.role === 'ue' ? 'role-badge-ue' : 'role-badge-emp'}>{emp.role === 'admin' ? 'Admin' : emp.role === 'ue' ? 'UE' : 'Anställd'}</span>
                    <span style={{ fontSize: 11, color: '#888' }}>{Icon.pin} PIN: {emp.pin}</span>
                    {emp.phone && <span style={{ fontSize: 11, color: '#888' }}>📞 {emp.phone}</span>}
                  </div>
                </div>
                {emp.role !== 'admin' && <button className="btn-danger" style={{ padding: '4px 8px' }} onClick={() => del(emp.id)}>{Icon.del}</button>}
              </div>
            ))}
          </div>
        )}
        {view === 'add' && (
          <div>
            <div className="field-group"><div className="field-label">Namn *</div><input className="field" placeholder="T.ex. Erik Johansson" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} autoFocus /></div>
            <div className="field-group"><div className="field-label">Roll</div>
              <select className="field" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                <option value="employee">Anställd</option><option value="ue">Underentreprenör (UE)</option><option value="admin">Administratör</option>
              </select>
            </div>
            <div className="field-group">
              <div className="field-label">Telefonnummer</div>
              <input className="field" type="tel" placeholder="T.ex. 0701234567" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
              <div style={{ fontSize: 11, color: '#888', marginTop: 3 }}>Används för att skicka SMS-notiser</div>
            </div>
            <div className="field-group">
              <div className="field-label">PIN-kod (4 siffror) *</div>
              <input className="field" type="tel" inputMode="numeric" pattern="[0-9]*" maxLength={4} placeholder="T.ex. 1234" value={form.pin} onChange={e => { setForm({ ...form, pin: e.target.value.replace(/\D/g, '').slice(0, 4) }); setPinErr('') }} />
              {pinErr && <div style={{ fontSize: 12, color: '#e24b4a', marginTop: 4 }}>{pinErr}</div>}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-primary" style={{ flex: 1, marginTop: 0 }} onClick={save}>Spara</button>
              <button style={{ marginTop: 0, padding: '10px 16px', background: 'transparent', border: '0.5px solid rgba(0,0,0,.2)', borderRadius: 8, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }} onClick={() => { setView('list'); setForm({ name: '', role: 'employee', pin: '' }); setPinErr('') }}>Avbryt</button>
            </div>
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
        const wkH = tid.filter(t => t.company === co.id && t.date >= m.toISOString().slice(0, 10)).reduce((a, t) => a + (t.hours || 0), 0)
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
function ProjektTab({ co, projects, allProjects, employees, sess, isAdmin, dagbok, tid, ata, files, addProject, updateProject, deleteProject, addAta, updateAta, deleteAta, addFile, deleteFile, setLb }) {
  const [view, setView] = useState('list')
  const [selId, setSelId] = useState(null)
  const [ptab, setPtab] = useState('info')
  const [form, setForm] = useState({ name: '', client: '', contact_name: '', contact_email: '', contact_phone: '', start_date: today(), status: 'active', description: '', assigned_to: [] })
  const fRef = useRef()

  const proj = selId ? allProjects.find(p => p.id === selId) : null

  const togAssign = (pId, eId) => {
    const p = allProjects.find(x => x.id === pId)
    const cur = p.assigned_to || []
    updateProject(pId, { assigned_to: cur.includes(eId) ? cur.filter(x => x !== eId) : [...cur, eId] })
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
    const th = pT.reduce((s, t) => s + (t.hours || 0), 0)
    const byE = {}; pT.forEach(t => { byE[t.employee] = (byE[t.employee] || 0) + t.hours })

    const [pdfLoading, setPdfLoading] = useState(false)

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
          pD.forEach(d => {
            checkPage(14)
            doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(60, 60, 60)
            doc.text(`${fmt(d.date)} · ${d.employee}`, margin, y); y += 5
            doc.setFont('helvetica', 'normal'); doc.setTextColor(0, 0, 0)
            const lines = doc.splitTextToSize(d.text || '', cw)
            lines.forEach(line => { checkPage(5); doc.text(line, margin, y); y += 4.5 })
            y += 3
          })
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
          <div className="card-row"><div className="proj-name">{proj.name}</div><span className={`badge badge-${proj.status === 'active' ? 'active' : proj.status === 'plan' ? 'plan' : 'done'}`}>{proj.status === 'active' ? 'Pågående' : proj.status === 'plan' ? 'Planerad' : 'Avslutat'}</span></div>
          {proj.client && <div className="proj-sub">{proj.client}</div>}
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
            <div><div className="field-label">Tim / poster</div><span style={{ color: co.color, fontWeight: 700 }}>{pTid.reduce((s, t) => s + (t.hours || 0), 0)}h · {pDag.length} poster</span></div>
          </div>
          {aEmps.length > 0 && <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 8 }}>{aEmps.map(e => <div key={e.id} className="tag">{ini(e.name)} {e.name.split(' ')[0]}</div>)}</div>}
          {isAdmin && <div style={{ marginTop: 10 }}><button className="btn-secondary" style={{ fontSize: 12, padding: '5px 10px' }} onClick={() => setView('summary')}>{Icon.prt} Sammanställning</button></div>}
        </div>
        <div className="sub-tabs">
          {[{ k: 'info', l: 'Info' }, { k: 'filer', l: `Filer${pFiles.length > 0 ? ` (${pFiles.length})` : ''}` }, { k: 'ata', l: `ÄTA${pendA > 0 ? ' ●' : ''}` }].map(t => <button key={t.k} className={`sub-tab${ptab === t.k ? ' active' : ''}`} onClick={() => setPtab(t.k)}>{t.l}</button>)}
        </div>
        {ptab === 'info' && isAdmin && (
          <div>
            <div className="sec">Tilldelade anställda</div>
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
      </div>
    )
  }

  if (view === 'add') return (
    <div>
      <button className="btn-back" onClick={() => setView('list')}>{Icon.back} Tillbaka</button>
      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>Nytt projekt — {co.name}</div>
      {['name', 'client'].map(k => <div key={k} className="field-group"><div className="field-label">{k === 'name' ? 'Projektnamn *' : 'Beställare'}</div><input className="field" placeholder={k === 'name' ? 'T.ex. VA Mölndals väg' : 'Kund / beställare'} value={form[k]} onChange={e => setForm({ ...form, [k]: e.target.value })} /></div>)}
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
      <button className="btn-primary" onClick={async () => { if (!form.name.trim()) return; await addProject({ ...form, company: co.id }); setForm({ name: '', client: '', contact_name: '', contact_email: '', contact_phone: '', start_date: today(), status: 'active', description: '', assigned_to: [] }); setView('list') }}>Skapa projekt</button>
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
                <div key={p.id} className="card" style={{ cursor: 'pointer' }} onClick={() => { setSelId(p.id); setPtab('info'); setView('detail') }}>
                  <div className="card-row">
                    <div style={{ flex: 1 }}>
                      <div className="proj-name">{p.name}</div>
                      <div className="proj-sub">{p.client || '—'}</div>
                      {ae.length > 0 && <div style={{ display: 'flex', gap: 4, marginTop: 5 }}>{ae.map(e => <span key={e.id} className="tag" style={{ fontSize: 11 }}>{ini(e.name)}</span>)}</div>}
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
function ArbetsdagTab({ co, projects, dagbok, tid, employees, addDagbok, deleteDagbok, addTid, deleteTid, sess, isAdmin, setLb }) {
  const [subTab, setSubTab] = useState('list')
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

  const submit = async () => {
    if (!form.project_id) return
    if (form.text.trim()) {
      await addDagbok({ project_id: form.project_id, company: co.id, date: form.date, employee: form.employee, text: form.text, photos: form.photos })
    }
    if (form.hours) {
      await addTid({ project_id: form.project_id, company: co.id, date: form.date, employee: form.employee, hours: parseFloat(form.hours) || 0, description: form.description })
    }
    for (const ep of form.extraPersons) {
      if (ep.name && ep.hours) {
        await addTid({ project_id: form.project_id, company: co.id, date: form.date, employee: ep.name, hours: parseFloat(ep.hours) || 0, description: form.description })
      }
    }
    setForm({ project_id: '', date: today(), employee: sess.name, text: '', photos: [], hours: '8', description: '', extraPersons: [] })
    setSubTab('list')
  }

  // Combine and sort dagbok+tid by date
  const combined = [
    ...dagbok.map(d => ({ ...d, _type: 'dag' })),
  ].sort((a, b) => b.date?.localeCompare(a.date))

  const wk = () => { const n = new Date(), m = new Date(n); m.setDate(n.getDate() - n.getDay() + 1); return tid.filter(t => t.date >= m.toISOString().slice(0, 10)).reduce((a, t) => a + (t.hours || 0), 0) }
  const totalH = tid.reduce((s, t) => s + (t.hours || 0), 0)

  if (subTab === 'add') return (
    <div>
      <button className="btn-back" onClick={() => setSubTab('list')}>{Icon.back} Tillbaka</button>
      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>Ny arbetsdag</div>

      <div className="field-group"><div className="field-label">Projekt *</div>
        {ap.length === 0 ? <div style={{ fontSize: 13, color: '#888' }}>Inga aktiva projekt</div> :
          <div className="chip-group">{ap.map(p => <div key={p.id} className={`chip${form.project_id === p.id ? ' selected' : ''}`} onClick={() => setForm({ ...form, project_id: p.id })}>{p.name}</div>)}</div>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div className="field-group"><div className="field-label">Datum</div><input className="field" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></div>
        <div className="field-group"><div className="field-label">Utförd av</div><input className="field" value={form.employee} readOnly style={{ background: '#F0EFE8' }} /></div>
      </div>

      {/* Timmar */}
      <div style={{ background: '#F0EFE8', borderRadius: 10, padding: '10px 12px', marginBottom: 10 }}>
        <div style={{ fontSize: 12, color: '#888', fontWeight: 600, marginBottom: 8 }}>TIMMAR</div>
        <div className="hours-row">
          <input className="hours-input" type="number" min="0" max="24" step="0.5" value={form.hours} onChange={e => setForm({ ...form, hours: e.target.value })} />
          <span style={{ fontSize: 13, color: '#888' }}>tim</span>
          {[4, 6, 7.5, 8, 10].map(n => <button key={n} className="btn-secondary" style={{ padding: '4px 7px', fontSize: 12 }} onClick={() => setForm({ ...form, hours: String(n) })}>{n}h</button>)}
        </div>

        {/* Extra kollegor */}
        {form.extraPersons.map((ep, i) => (
          <div key={i} style={{ display: 'flex', gap: 6, marginTop: 8, alignItems: 'center' }}>
            <select className="field" style={{ flex: 2 }} value={ep.name} onChange={e => updateExtra(i, 'name', e.target.value)}>
              <option value="">Välj kollega...</option>
              {employees.filter(e => e.id !== sess.id && e.role !== 'admin').map(e => <option key={e.id} value={e.name}>{e.name}</option>)}
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

      <button className="btn-primary" onClick={submit} disabled={!form.project_id}>Spara arbetsdag</button>
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
        const dayTid = tid.filter(t => t.date === entry.date && t.project_id === entry.project_id && t.employee === entry.employee)
        const canDel = isAdmin || entry.employee === sess.name
        return (
          <div key={entry.id} className="entry-card">
            <div className="card-row">
              <div>
                <div style={{ fontSize: 12, color: '#888' }}>{fmt(entry.date)}</div>
                {proj && <div style={{ fontSize: 13, fontWeight: 700, color: co.color, marginTop: 2 }}>{proj.name}</div>}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                {dayTid.length > 0 && <span style={{ fontSize: 16, fontWeight: 700, color: co.color }}>{dayTid.reduce((s,t)=>s+t.hours,0)}h</span>}
                {canDel && <button className="btn-danger" style={{ padding: '3px 6px' }} onClick={() => deleteDagbok(entry.id)}>{Icon.del}</button>}
              </div>
            </div>
            <div className="tag" style={{ marginTop: 4 }}>👤 {entry.employee}</div>
            {entry.text && <div className="entry-text" style={{ marginTop: 6 }}>{entry.text}</div>}
            {entry.photos?.length > 0 && <div className="photo-grid" style={{ marginTop: 8 }}>{entry.photos.map((src, i) => <img key={i} src={src} className="photo-thumb" alt="" onClick={() => setLb(src)} />)}</div>}
          </div>
        )
      })}
      <button className="btn-primary" style={{ marginTop: 8 }} onClick={() => setSubTab('add')}>+ Ny arbetsdag</button>
    </div>
  )
}

// ─── Kommunikation Tab ────────────────────────────────────────
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

  const withPhone = employees.filter(e => e.phone && e.role !== 'admin')
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
function RapportTab({ co, projects, dagbok, tid, ata }) {
  const [sel, setSel] = useState('all')
  const fT = sel === 'all' ? tid : tid.filter(t => t.project_id === sel)
  const fD = sel === 'all' ? dagbok : dagbok.filter(d => d.project_id === sel)
  const fA = sel === 'all' ? ata : ata.filter(a => a.project_id === sel)
  const totalH = fT.reduce((s, t) => s + (t.hours || 0), 0)
  const byE = {}; fT.forEach(t => { byE[t.employee] = (byE[t.employee] || 0) + t.hours })
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
