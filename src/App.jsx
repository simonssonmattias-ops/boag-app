import { useState, useEffect, useRef } from 'react'
import { supabase } from './lib/supabase'
import boagLogo from './logo.png'

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
    const tabs = [{ k: 'projects', l: 'Projekt', i: Icon.proj }, { k: 'dagbok', l: 'Dagbok', i: Icon.dag }, { k: 'tid', l: 'Tid', i: Icon.tid }, ...(isAdmin ? [{ k: 'rapport', l: 'Rapport', i: Icon.rap }] : [])]
    return (
      <div className="app" style={{ '--accent': co.color }}>
        {lb && <div className="lightbox" onClick={() => setLb(null)}><button className="lightbox-close" onClick={() => setLb(null)}>×</button><img src={lb} alt="" /></div>}
        <div className="sub-topbar">
          <button className="back-btn" onClick={() => { setActiveCo(null); setMainTab('bolag') }}><svg viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="1.8" width="20" height="20"><polyline points="15 18 9 12 15 6"/></svg></button>
          <div style={{ width: 8, height: 8, borderRadius: 4, background: co.color, flexShrink: 0 }} />
          <div className="sub-topbar-name">{co.name}</div>
          <div style={{ marginLeft: 'auto' }}>
            <button className="user-chip" onClick={logout}><div className={isAdmin ? 'dot-admin' : 'dot-emp'} />{sess.name.split(' ')[0]}<span style={{ color: '#888', fontSize: 10 }}>× byt</span></button>
          </div>
        </div>
        <nav className="nav">{tabs.map(t => <button key={t.k} className={`nav-btn${coTab === t.k ? ' active' : ''}`} onClick={() => setCoTab(t.k)}>{t.i}{t.l}</button>)}</nav>
        <div className="content">
          {coTab === 'projects' && <ProjektTab co={co} projects={cProjects} allProjects={projects} employees={employees} sess={sess} isAdmin={isAdmin} dagbok={cDagbok} tid={cTid} ata={cAta} files={files} addProject={addProject} updateProject={updateProject} deleteProject={deleteProject} addAta={addAta} updateAta={updateAta} deleteAta={deleteAta} addFile={addFile} deleteFile={deleteFile} setLb={setLb} />}
          {coTab === 'dagbok' && <DagbokTab co={co} projects={cProjects} dagbok={cDagbok} addDagbok={addDagbok} deleteDagbok={deleteDagbok} sess={sess} setLb={setLb} />}
          {coTab === 'tid' && <TidTab co={co} projects={cProjects} tid={cTid} addTid={addTid} deleteTid={deleteTid} sess={sess} isAdmin={isAdmin} />}
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
      </nav>
      <div className="content">
        {mainTab === 'home' && <HomeTab ann={ann} addAnn={addAnn} deleteAnn={deleteAnn} sess={sess} isAdmin={isAdmin} />}
        {mainTab === 'bolag' && <BolagTab projects={projects} tid={tid} ata={ata} onSelect={(id) => { setActiveCo(id); setCoTab('projects') }} />}
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
          <div className={`avatar ${sel.role === 'admin' ? 'av-admin' : 'av-emp'}`} style={{ width: 52, height: 52, fontSize: 18, margin: '0 auto' }}>{ini(sel.name)}</div>
          <div className="pin-name">{sel.name}</div>
          <div className="pin-role">{sel.role === 'admin' ? 'Administratör' : 'Anställd'}</div>
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

  return (
    <div className="login-screen">
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <img src={boagLogo} className="login-logo" alt="BOAG" />
        <div className="login-divider" />
        <div className="login-label">KONCERNAPP</div>
      </div>
      <div className="login-sub">Vem är du?</div>
      {employees.map(emp => (
        <div key={emp.id} className="emp-card" onClick={() => setSel(emp)}>
          <div className={`avatar ${emp.role === 'admin' ? 'av-admin' : 'av-emp'}`}>{ini(emp.name)}</div>
          <div><div className="emp-name">{emp.name}</div><div className="emp-role-label">{emp.role === 'admin' ? 'Administratör' : 'Anställd'}</div></div>
          <span style={{ marginLeft: 'auto', fontSize: 20, color: 'rgba(255,255,255,.2)' }}>›</span>
        </div>
      ))}
    </div>
  )
}

// ─── Settings Sheet ───────────────────────────────────────────
function SettingsSheet({ employees, addEmployee, deleteEmployee, onClose }) {
  const [view, setView] = useState('list')
  const [form, setForm] = useState({ name: '', role: 'employee', pin: '' })
  const [pinErr, setPinErr] = useState('')

  const save = () => {
    if (!form.name.trim()) return
    if (!/^\d{4}$/.test(form.pin)) { setPinErr('PIN måste vara exakt 4 siffror'); return }
    addEmployee({ name: form.name.trim(), role: form.role, pin: form.pin })
    setForm({ name: '', role: 'employee', pin: '' }); setPinErr(''); setView('list')
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
                <div className={`avatar ${emp.role === 'admin' ? 'av-admin-light' : 'av-emp-light'}`} style={{ width: 36, height: 36, fontSize: 12 }}>{ini(emp.name)}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{emp.name}</div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 2, alignItems: 'center' }}>
                    <span className={emp.role === 'admin' ? 'role-badge-admin' : 'role-badge-emp'}>{emp.role === 'admin' ? 'Admin' : 'Anställd'}</span>
                    <span style={{ fontSize: 11, color: '#888' }}>{Icon.pin} PIN: {emp.pin}</span>
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
                <option value="employee">Anställd</option><option value="admin">Administratör</option>
              </select>
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
  const [form, setForm] = useState({ name: '', client: '', start_date: today(), status: 'active', description: '', assigned_to: [] })
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
    return (
      <div>
        <button className="btn-back" onClick={() => setView('detail')}>{Icon.back} Tillbaka</button>
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
      <button className="btn-primary" onClick={async () => { if (!form.name.trim()) return; await addProject({ ...form, company: co.id }); setForm({ name: '', client: '', start_date: today(), status: 'active', description: '', assigned_to: [] }); setView('list') }}>Skapa projekt</button>
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

// ─── Dagbok Tab ───────────────────────────────────────────────
function DagbokTab({ co, projects, dagbok, addDagbok, deleteDagbok, sess, setLb }) {
  const [view, setView] = useState('list')
  const [form, setForm] = useState({ project_id: '', date: today(), employee: sess.name, text: '', photos: [] })
  const fRef = useRef()

  const submit = async () => {
    if (!form.project_id || !form.text.trim()) return
    await addDagbok({ ...form, company: co.id })
    setForm({ project_id: '', date: today(), employee: sess.name, text: '', photos: [] }); setView('list')
  }
  const addPhoto = e => { const file = e.target.files[0]; if (!file) return; const r = new FileReader(); r.onload = ev => setForm(f => ({ ...f, photos: [...f.photos, ev.target.result] })); r.readAsDataURL(file); e.target.value = '' }

  if (view === 'add') {
    const ap = projects.filter(p => p.status !== 'done')
    return (
      <div>
        <button className="btn-back" onClick={() => setView('list')}>{Icon.back} Tillbaka</button>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>Ny dagbokspost</div>
        <div className="field-group"><div className="field-label">Projekt *</div>
          {ap.length === 0 ? <div style={{ fontSize: 13, color: '#888' }}>Inga projekt</div> :
            <div className="chip-group">{ap.map(p => <div key={p.id} className={`chip${form.project_id === p.id ? ' selected' : ''}`} onClick={() => setForm({ ...form, project_id: p.id })}>{p.name}</div>)}</div>}
        </div>
        <div className="field-group"><div className="field-label">Datum</div><input className="field" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></div>
        <div className="field-group"><div className="field-label">Utfört av</div><input className="field" value={form.employee} readOnly style={{ background: '#F0EFE8' }} /></div>
        <div className="field-group"><div className="field-label">Utfört arbete *</div><textarea className="field" placeholder="Beskriv dagens arbete..." value={form.text} onChange={e => setForm({ ...form, text: e.target.value })} /></div>
        <div className="field-group">
          <div className="field-label">Foton</div>
          <input type="file" ref={fRef} accept="image/*" capture="environment" style={{ display: 'none' }} onChange={addPhoto} />
          <div className="photo-grid">
            {form.photos.map((src, i) => <div key={i} className="photo-wrap"><img src={src} className="photo-thumb" alt="" /><button className="photo-del" onClick={() => setForm(f => ({ ...f, photos: f.photos.filter((_, j) => j !== i) }))}>×</button></div>)}
            <div className="photo-add-btn" onClick={() => fRef.current.click()}>{Icon.cam} Foto</div>
          </div>
        </div>
        <button className="btn-primary" onClick={submit}>Spara dagbokspost</button>
      </div>
    )
  }

  return (
    <div>
      {dagbok.length === 0 && <div className="empty">Inga dagboksposter ännu.</div>}
      {dagbok.map(entry => {
        const proj = projects.find(p => p.id === entry.project_id)
        const canDel = sess.role === 'admin' || entry.employee === sess.name
        return (
          <div key={entry.id} className="entry-card">
            <div className="card-row">
              <div><div style={{ fontSize: 12, color: '#888' }}>{fmt(entry.date)}</div>{proj && <div style={{ fontSize: 13, fontWeight: 700, color: co.color, marginTop: 2 }}>{proj.name}</div>}</div>
              {canDel && <button className="btn-danger" onClick={() => deleteDagbok(entry.id)}>{Icon.del}</button>}
            </div>
            <div className="tag" style={{ marginTop: 4 }}>👤 {entry.employee}</div>
            <div className="entry-text">{entry.text}</div>
            {entry.photos?.length > 0 && <div className="photo-grid" style={{ marginTop: 8 }}>{entry.photos.map((src, i) => <img key={i} src={src} className="photo-thumb" alt="" onClick={() => setLb(src)} />)}</div>}
          </div>
        )
      })}
      <button className="btn-primary" style={{ marginTop: 8 }} onClick={() => setView('add')}>+ Ny dagbokspost</button>
    </div>
  )
}

// ─── Tid Tab ──────────────────────────────────────────────────
function TidTab({ co, projects, tid, addTid, deleteTid, sess, isAdmin }) {
  const [view, setView] = useState('list')
  const [form, setForm] = useState({ project_id: '', date: today(), employee: sess.name, hours: '8', description: '' })

  const wk = () => { const n = new Date(), m = new Date(n); m.setDate(n.getDate() - n.getDay() + 1); return tid.filter(t => t.date >= m.toISOString().slice(0, 10)).reduce((a, t) => a + (t.hours || 0), 0) }

  if (view === 'add') {
    const ap = projects.filter(p => p.status !== 'done')
    return (
      <div>
        <button className="btn-back" onClick={() => setView('list')}>{Icon.back} Tillbaka</button>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>Rapportera tid</div>
        <div className="field-group"><div className="field-label">Projekt *</div>
          {ap.length === 0 ? <div style={{ fontSize: 13, color: '#888' }}>Inga projekt</div> :
            <div className="chip-group">{ap.map(p => <div key={p.id} className={`chip${form.project_id === p.id ? ' selected' : ''}`} onClick={() => setForm({ ...form, project_id: p.id })}>{p.name}</div>)}</div>}
        </div>
        <div className="field-group"><div className="field-label">Datum</div><input className="field" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></div>
        <div className="field-group"><div className="field-label">Utförd av</div><input className="field" value={form.employee} readOnly style={{ background: '#F0EFE8' }} /></div>
        <div className="field-group">
          <div className="field-label">Timmar</div>
          <div className="hours-row">
            <input className="hours-input" type="number" min="0" max="24" step="0.5" value={form.hours} onChange={e => setForm({ ...form, hours: e.target.value })} />
            <span style={{ fontSize: 13, color: '#888' }}>tim</span>
            {[4, 6, 8, 10].map(n => <button key={n} className="btn-secondary" style={{ padding: '5px 8px' }} onClick={() => setForm({ ...form, hours: String(n) })}>{n}h</button>)}
          </div>
        </div>
        <div className="field-group"><div className="field-label">Kommentar</div><input className="field" placeholder="Valfri beskrivning..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
        <button className="btn-primary" onClick={async () => { if (!form.project_id || !form.hours) return; await addTid({ ...form, hours: parseFloat(form.hours) || 0, company: co.id }); setForm({ project_id: '', date: today(), employee: sess.name, hours: '8', description: '' }); setView('list') }}>Spara</button>
      </div>
    )
  }

  return (
    <div>
      <div className="stat-grid">
        <div className="stat-card"><div className="stat-label">Denna vecka</div><div className="stat-val" style={{ color: co.color }}>{wk()}h</div></div>
        <div className="stat-card"><div className="stat-label">Totalt</div><div className="stat-val">{tid.reduce((s, t) => s + (t.hours || 0), 0)}h</div></div>
      </div>
      {tid.length === 0 && <div className="empty">Ingen tid rapporterad.</div>}
      {tid.slice(0, 30).map(entry => {
        const proj = projects.find(p => p.id === entry.project_id)
        const canDel = isAdmin || entry.employee === sess.name
        return (
          <div key={entry.id} className="card">
            <div className="card-row">
              <div><div style={{ fontSize: 12, color: '#888' }}>{fmt(entry.date)}</div>{proj && <div className="proj-name" style={{ fontSize: 14 }}>{proj.name}</div>}{entry.description && <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{entry.description}</div>}</div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5 }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: co.color }}>{entry.hours}h</div>
                {canDel && <button className="btn-danger" style={{ padding: '3px 6px' }} onClick={() => deleteTid(entry.id)}>{Icon.del}</button>}
              </div>
            </div>
            <div className="tag" style={{ marginTop: 6 }}>👤 {entry.employee}</div>
          </div>
        )
      })}
      <button className="btn-primary" style={{ marginTop: 8 }} onClick={() => setView('add')}>+ Rapportera tid</button>
    </div>
  )
}

// ─── Rapport Tab ──────────────────────────────────────────────
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
