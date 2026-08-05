import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Activity,
  ArrowLeft,
  BadgeCheck,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  FileText,
  Folder,
  Home,
  Info,
  LogOut,
  Mail,
  Menu,
  Moon,
  Phone,
  ScanLine,
  Search,
  Send,
  Settings,
  Shield,
  Stethoscope,
  Upload,
  User,
  UserPlus,
  X
} from 'lucide-react';
import './styles.css';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000/api';

const sampleCases = [
  ['43', 'Tyso', 'In-review', 34, 'Male', '99%', 'Found', '22.8 mm', '5 stones'],
  ['44', 'John Doe', 'In-review', 45, 'Male', '85%', 'Found', '15.2 mm', '2 stones'],
  ['45', 'Sarah Smith', 'In-review', 29, 'Female', '92%', 'Found', '18.5 mm', '3 stones'],
  ['26', 'Michael Brown', 'Completed', 52, 'Male', '95%', 'Found', '20.1 mm', '1 stone'],
  ['27', 'Emily Davis', 'Completed', 38, 'Female', '88%', 'Found', '12.4 mm', '2 stones'],
  ['28', 'James Wilson', 'Completed', 61, 'Male', '76%', 'Not Found', '0 mm', '0 stones'],
  ['31', 'Jennifer Garcia', 'Completed', 31, 'Female', '94%', 'Found', '25.2 mm', '1 stone']
].map(([id, name, status, age, gender, aiScore, stoneFound, size, stoneCount], index) => ({
  id,
  name,
  status,
  age,
  gender,
  aiScore,
  stoneFound,
  size,
  stoneCount,
  sizesList: stoneFound === 'Found' ? ['14.1 mm', size, '12.1 mm'].slice(0, Number.parseInt(stoneCount) || 1) : ['-'],
  locations: stoneFound === 'Found' ? [index % 2 ? 'Left Kidney' : 'Right Kidney'] : ['None']
}));

async function api(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: options.body instanceof FormData ? undefined : { 'Content-Type': 'application/json' },
    ...options
  });
  const json = await response.json();
  if (!response.ok) throw new Error(json.message || json.error || 'Request failed');
  return json;
}

function App() {
  const [screen, setScreen] = useState('portal');
  const [role, setRole] = useState(null);
  const [user, setUser] = useState(null);
  const [dark, setDark] = useState(false);

  const loginSuccess = (nextRole, nextUser) => {
    setRole(nextRole);
    setUser(nextUser);
    setScreen(nextRole === 'doctor' ? 'doctor' : 'patient');
  };

  return (
    <main className={dark ? 'app dark' : 'app'}>
      {screen === 'portal' && <Portal onSelect={setScreen} />}
      {screen === 'doctor-login' && <Login role="doctor" onBack={() => setScreen('portal')} onSuccess={loginSuccess} onRegister={() => setScreen('doctor-register')} />}
      {screen === 'patient-login' && <Login role="patient" onBack={() => setScreen('portal')} onSuccess={loginSuccess} onRegister={() => setScreen('patient-register')} />}
      {screen === 'patient-register' && <PatientRegister onBack={() => setScreen('patient-login')} />}
      {screen === 'doctor-register' && <StaticRegister onBack={() => setScreen('doctor-login')} />}
      {screen === 'doctor' && <DoctorDashboard user={user} dark={dark} setDark={setDark} onLogout={() => setScreen('portal')} />}
      {screen === 'patient' && <PatientDashboard user={user} onLogout={() => setScreen('portal')} />}
      {role && ['about', 'resources', 'privacy', 'terms'].includes(screen) && <InfoPage type={screen} onBack={() => setScreen(role)} />}
    </main>
  );
}

function Portal({ onSelect }) {
  return (
    <section className="portal">
      <div className="logo-mark"><Stethoscope size={48} /></div>
      <h1>SIMATS RENAL CALCULI</h1>
      <p>AI Review System</p>
      <button className="portal-card" onClick={() => onSelect('doctor-login')}>
        <Stethoscope /><span><b>Doctor Portal</b><small>Review and diagnose cases</small></span>
      </button>
      <button className="portal-card ghost" onClick={() => onSelect('patient-login')}>
        <User /><span><b>Patient Portal</b><small>Upload scans and view history</small></span>
      </button>
      <small className="footer-note">Academic research project. Not for clinical diagnosis.</small>
    </section>
  );
}

function Login({ role, onBack, onSuccess, onRegister }) {
  const [form, setForm] = useState({ email: '', phone: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const result = await api(role === 'doctor' ? '/doctor/login' : '/patient/login', {
        method: 'POST',
        body: JSON.stringify(form)
      });
      if (!result.ok) throw new Error(result.message);
      onSuccess(role, { ...result.user, email: form.email, phone: form.phone });
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title={`${role === 'doctor' ? 'Doctor' : 'Patient'} Login`} icon={role === 'doctor' ? Stethoscope : User} onBack={onBack}>
      <form className="form" onSubmit={submit}>
        <Field icon={Mail} placeholder="Email" value={form.email} onChange={(email) => setForm({ ...form, email })} />
        {role === 'patient' && <Field icon={Phone} placeholder="Phone" value={form.phone} onChange={(phone) => setForm({ ...form, phone })} />}
        <Field icon={Shield} placeholder="Password" type="password" value={form.password} onChange={(password) => setForm({ ...form, password })} />
        {message && <p className="error">{message}</p>}
        <button className="primary" disabled={loading}>{loading ? 'Checking...' : 'Login'}</button>
        <button className="link-button" type="button" onClick={onRegister}><UserPlus size={16} /> Create account</button>
      </form>
    </AuthShell>
  );
}

function PatientRegister({ onBack }) {
  const [form, setForm] = useState({ name: '', age: '', gender: '', phone: '', email: '', address: '', work: '', password: '' });
  const [message, setMessage] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    setMessage('Submitting...');
    try {
      const result = await api('/patient/signup', { method: 'POST', body: JSON.stringify(form) });
      setMessage(result.message || 'Registration complete');
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <AuthShell title="Patient Registration" icon={UserPlus} onBack={onBack}>
      <form className="form grid-form" onSubmit={submit}>
        {['name', 'age', 'gender', 'phone', 'email', 'address', 'work', 'password'].map((key) => (
          <input key={key} type={key === 'password' ? 'password' : 'text'} placeholder={key.replace(/^\w/, (c) => c.toUpperCase())} value={form[key]} onChange={(event) => setForm({ ...form, [key]: event.target.value })} />
        ))}
        {message && <p className="notice">{message}</p>}
        <button className="primary">Register Patient</button>
      </form>
    </AuthShell>
  );
}

function StaticRegister({ onBack }) {
  return (
    <AuthShell title="Doctor Registration" icon={Stethoscope} onBack={onBack}>
      <div className="empty-state">
        <BadgeCheck size={42} />
        <h2>Professional account request</h2>
        <p>Doctor registration was a local Android screen. Connect your backend endpoint here when available.</p>
      </div>
    </AuthShell>
  );
}

function AuthShell({ title, icon: Icon, onBack, children }) {
  return (
    <section className="auth">
      <button className="icon-button" onClick={onBack} aria-label="Back"><ArrowLeft /></button>
      <div className="auth-card">
        <div className="auth-icon"><Icon /></div>
        <h1>{title}</h1>
        {children}
        <p className="disclaimer">Academic student research project only. Always consult qualified healthcare professionals for medical decisions.</p>
      </div>
    </section>
  );
}

function Field({ icon: Icon, value, onChange, ...props }) {
  return (
    <label className="field">
      <Icon size={18} />
      <input value={value} onChange={(event) => onChange(event.target.value)} {...props} />
    </label>
  );
}

function DoctorDashboard({ user, dark, setDark, onLogout }) {
  const [filter, setFilter] = useState('All');
  const [selectedCase, setSelectedCase] = useState(null);
  const cases = useMemo(() => filter === 'All' ? sampleCases : sampleCases.filter((item) => item.status === filter), [filter]);

  if (selectedCase) return <CaseDetail item={selectedCase} onBack={() => setSelectedCase(null)} />;

  return (
    <Shell title="Doctor Dashboard" user={user} onLogout={onLogout} actions={<button className="icon-button" onClick={() => setDark(!dark)} aria-label="Theme"><Moon /></button>}>
      <div className="stats">
        <Stat icon={Folder} label="All Cases" value={sampleCases.length} onClick={() => setFilter('All')} active={filter === 'All'} />
        <Stat icon={Activity} label="In-review" value={sampleCases.filter((x) => x.status === 'In-review').length} onClick={() => setFilter('In-review')} active={filter === 'In-review'} />
        <Stat icon={CheckCircle2} label="Completed" value={sampleCases.filter((x) => x.status === 'Completed').length} onClick={() => setFilter('Completed')} active={filter === 'Completed'} />
      </div>
      <div className="section-title"><FileText /> <h2>{filter} Cases</h2></div>
      <div className="case-list">
        {cases.map((item) => <CaseCard key={item.id} item={item} onClick={() => setSelectedCase(item)} />)}
      </div>
    </Shell>
  );
}

function CaseCard({ item, onClick }) {
  return (
    <button className="case-card" onClick={onClick}>
      <div className="case-head">
        <span className="avatar"><User /></span>
        <span><b>{item.name}</b><small>ID: {item.id}</small></span>
        <em className={item.status === 'Completed' ? 'done' : 'pending'}>{item.status}</em>
      </div>
      <div className="case-grid">
        <span><small>Age</small><b>{item.age}</b></span>
        <span><small>Gender</small><b>{item.gender}</b></span>
        <span><small>AI Score</small><b>{item.aiScore}</b></span>
        <span><small>Stone</small><b>{item.stoneFound}</b></span>
        <span><small>Size</small><b>{item.size}</b></span>
        <span><small>Count</small><b>{item.stoneCount}</b></span>
      </div>
    </button>
  );
}

function CaseDetail({ item, onBack }) {
  const [notes, setNotes] = useState('');
  const [saved, setSaved] = useState(false);

  const submit = async () => {
    await api('/doctor/review', { method: 'POST', body: JSON.stringify({ caseId: item.id, notes, confirmed: true }) });
    setSaved(true);
  };

  if (saved) {
    return (
      <section className="success">
        <BadgeCheck size={88} />
        <h1>Review Submitted Successfully</h1>
        <p>Your review has been saved to the patient record.</p>
        <button className="primary" onClick={onBack}>Back to Dashboard</button>
      </section>
    );
  }

  return (
    <Shell title={item.name} onBack={onBack}>
      <div className="scan-panel"><ScanLine size={72} /><span>Annotated analysis preview</span></div>
      <div className="detail-grid">
        <Stat icon={User} label="Name" value={item.name} />
        <Stat icon={CalendarDays} label="Age" value={item.age} />
        <Stat icon={Activity} label="Confidence" value={item.aiScore} />
      </div>
      <div className="report-card">
        <h2>AI Suggested Results</h2>
        <p><b>Detection:</b> {item.stoneFound}</p>
        <p><b>Count:</b> {item.stoneCount}</p>
        <p><b>Largest:</b> {item.size}</p>
        <p><b>Locations:</b> {item.locations.join(', ')}</p>
      </div>
      <div className="report-card">
        <h2>Doctor Confirmation</h2>
        <textarea placeholder="Review notes" value={notes} onChange={(event) => setNotes(event.target.value)} />
        <button className="primary" onClick={submit} disabled={!notes.trim()}><Send size={16} /> Submit Review</button>
      </div>
    </Shell>
  );
}

function PatientDashboard({ user, onLogout }) {
  const [tab, setTab] = useState('Home');
  const [analysis, setAnalysis] = useState(null);
  const [reports, setReports] = useState([]);

  const loadReports = async () => {
    const result = await api('/reports', { method: 'POST', body: JSON.stringify({ pid: user?.id || 'PID009' }) });
    setReports(result.history || []);
  };

  return (
    <Shell title={`Welcome, ${user?.name || 'Patient'}`} user={user} onLogout={onLogout}>
      <nav className="tabs">
        {['Home', 'Reports', 'Profile', 'Settings'].map((item) => <button className={tab === item ? 'active' : ''} onClick={() => setTab(item)} key={item}>{item}</button>)}
      </nav>
      {tab === 'Home' && <PatientHome user={user} analysis={analysis} setAnalysis={setAnalysis} />}
      {tab === 'Reports' && <PatientReports reports={reports} analysis={analysis} onLoad={loadReports} />}
      {tab === 'Profile' && <Profile user={user} />}
      {tab === 'Settings' && <SettingsPanel user={user} onLogout={onLogout} />}
    </Shell>
  );
}

function PatientHome({ user, analysis, setAnalysis }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const analyze = async () => {
    if (!file) return;
    setLoading(true);
    const form = new FormData();
    form.append('scan', file);
    form.append('pid', user?.id || 'PID009');
    form.append('email', user?.email || '');
    try {
      setAnalysis(await api('/analyze', { method: 'POST', body: form }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="patient-home">
      <label className="upload-zone">
        <Upload size={42} />
        <b>{file ? file.name : 'Upload CT Scan'}</b>
        <small>PNG, JPG, DICOM export, or report image</small>
        <input type="file" accept="image/*,.dcm,.dicom,.pdf" onChange={(event) => setFile(event.target.files?.[0] || null)} />
      </label>
      <button className="primary" disabled={!file || loading} onClick={analyze}>{loading ? 'Analyzing...' : 'Analyze Scan'}</button>
      {analysis && <AnalysisResult analysis={analysis} />}
    </div>
  );
}

function AnalysisResult({ analysis }) {
  return (
    <div className="report-card">
      <h2>Analysis Result</h2>
      <p><b>Status:</b> {analysis.status}</p>
      <p><b>Confidence:</b> {analysis.confidence}</p>
      <p><b>Total Count:</b> {analysis.stone_count} stones</p>
      <p><b>Sizes:</b> {(analysis.stone_sizes || []).join(', ')}</p>
      <p><b>Locations:</b> {(analysis.stone_locations || []).join(', ')}</p>
      {analysis.annotated_image && (
        <div style={{ marginTop: '14px', textAlign: 'center' }}>
          <img 
            src={analysis.annotated_image} 
            alt="AI Bounding Box Annotation" 
            style={{ maxWidth: '100%', maxHeight: '420px', borderRadius: '8px', border: '1px solid #d9e5ec' }} 
          />
        </div>
      )}
      {analysis.message && <small style={{ display: 'block', marginTop: '8px' }}>{analysis.message}</small>}
    </div>
  );
}

function PatientReports({ reports, analysis, onLoad }) {
  return (
    <div>
      <button className="secondary" onClick={onLoad}><Search size={16} /> Fetch backend reports</button>
      {analysis && <AnalysisResult analysis={analysis} />}
      {reports.length === 0 && !analysis && <Empty title="No Analysis History" />}
      {reports.map((record) => (
        <div className="report-card" key={record.id}>
          <h2>Report on {(record.created_at || '').slice(0, 10)}</h2>
          <p><b>Status:</b> {record.status}</p>
          <p><b>Total Count:</b> {record.stone_count} stones</p>
          <p><b>Doctor Notes:</b> {record.diagnosis_notes || 'Pending review'}</p>
        </div>
      ))}
    </div>
  );
}

function Profile({ user }) {
  return (
    <div className="profile-card">
      <span className="big-avatar"><User /></span>
      <h2>{user?.name || 'Patient'}</h2>
      <p>{user?.email || 'No email available'}</p>
      <div className="case-grid">
        <span><small>ID</small><b>{user?.id || 'PID009'}</b></span>
        <span><small>Phone</small><b>{user?.phone || '-'}</b></span>
      </div>
    </div>
  );
}

function SettingsPanel({ user, onLogout }) {
  return (
    <div className="settings-panel">
      <Profile user={user} />
      <button className="danger" onClick={onLogout}><LogOut size={16} /> Logout</button>
    </div>
  );
}

function Shell({ title, user, onLogout, onBack, actions, children }) {
  return (
    <section className="shell">
      <header className="topbar">
        {onBack ? <button className="icon-button" onClick={onBack}><ArrowLeft /></button> : <Menu />}
        <div><h1>{title}</h1>{user && <small>{user.email}</small>}</div>
        <div className="top-actions">{actions}{onLogout && <button className="icon-button" onClick={onLogout}><LogOut /></button>}</div>
      </header>
      {children}
    </section>
  );
}

function Stat({ icon: Icon, label, value, onClick, active }) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag className={active ? 'stat active' : 'stat'} onClick={onClick}>
      <Icon />
      <small>{label}</small>
      <b>{value}</b>
    </Tag>
  );
}

function Empty({ title }) {
  return <div className="empty-state"><ClipboardList size={48} /><h2>{title}</h2></div>;
}

function InfoPage({ type, onBack }) {
  const copy = {
    about: ['About Renal Calculi', 'AI-powered academic research application for studying renal calculi prediction algorithms.'],
    resources: ['Academic Resources', 'Research support content for renal calculi imaging, review workflow, and responsible AI use.'],
    privacy: ['Privacy Policy', 'User-provided scans and notes should be handled only for educational research support and app functionality.'],
    terms: ['Terms and Conditions', 'This application is not a medical device and does not provide medical diagnosis, treatment, or clinical advice.']
  }[type];

  return (
    <Shell title={copy[0]} onBack={onBack}>
      <div className="report-card info-copy">
        <BookOpen />
        <p>{copy[1]}</p>
      </div>
    </Shell>
  );
}

createRoot(document.getElementById('root')).render(<App />);
