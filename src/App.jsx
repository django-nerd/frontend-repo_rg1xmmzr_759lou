import { useEffect, useState } from 'react'

const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

function Login({ onAuth }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState('employee')
  const [mode, setMode] = useState('login')
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      if (mode === 'register') {
        const res = await fetch(`${API_BASE}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password, role })
        })
        if (!res.ok) throw new Error((await res.json()).detail || 'Failed')
        // After first user register, switch to login
        setMode('login')
      }
      if (mode === 'login') {
        const res = await fetch(`${API_BASE}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        })
        if (!res.ok) throw new Error((await res.json()).detail || 'Failed')
        const data = await res.json()
        onAuth(data)
      }
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="max-w-md w-full mx-auto bg-white/10 backdrop-blur border border-white/10 p-6 rounded-2xl text-white">
      <h2 className="text-2xl font-bold mb-4">{mode === 'login' ? 'Sign in' : 'Create account'}</h2>
      {mode === 'register' && (
        <div className="text-sm text-blue-200 mb-3">First user can be core; afterwards only core can add users.</div>
      )}
      {error && <div className="bg-red-500/20 border border-red-400/40 text-red-200 p-2 rounded mb-3">{error}</div>}
      <form onSubmit={submit} className="space-y-3">
        {mode === 'register' && (
          <input className="w-full p-2 rounded bg-white/10 border border-white/20" placeholder="Full name" value={name} onChange={e=>setName(e.target.value)} required />
        )}
        <input className="w-full p-2 rounded bg-white/10 border border-white/20" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} required />
        <input className="w-full p-2 rounded bg-white/10 border border-white/20" placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
        {mode === 'register' && (
          <select className="w-full p-2 rounded bg-white/10 border border-white/20" value={role} onChange={e=>setRole(e.target.value)}>
            <option value="employee">Employee</option>
            <option value="core">Core</option>
          </select>
        )}
        <button className="w-full bg-blue-600 hover:bg-blue-500 transition text-white font-semibold py-2 rounded">{mode === 'login' ? 'Login' : 'Register'}</button>
      </form>
      <div className="text-sm mt-3">
        {mode === 'login' ? (
          <button className="underline" onClick={()=>setMode('register')}>Create an account</button>
        ) : (
          <button className="underline" onClick={()=>setMode('login')}>Have an account? Sign in</button>
        )}
      </div>
    </div>
  )
}

function TaskList({ token, user }) {
  const [tasks, setTasks] = useState([])
  const [filter, setFilter] = useState('')
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ title:'', description:'', assignee_email:'' })

  const load = async () => {
    const url = new URL(`${API_BASE}/tasks`)
    if (user.role === 'core' && filter) url.searchParams.set('assignee', filter)
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    const data = await res.json()
    setTasks(data)
  }
  useEffect(()=>{ load() },[])

  const create = async (e) => {
    e.preventDefault()
    const res = await fetch(`${API_BASE}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(form)
    })
    if (res.ok) { setCreating(false); setForm({ title:'', description:'', assignee_email:'' }); load() }
  }

  const setStatus = async (id, status) => {
    await fetch(`${API_BASE}/tasks/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ status }) })
    load()
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-semibold">Tasks</h3>
        {user.role==='core' && <button onClick={()=>setCreating(v=>!v)} className="text-sm bg-blue-600 px-3 py-1 rounded">New</button>}
      </div>
      {user.role==='core' && (
        <input className="w-full mb-3 p-2 rounded bg-white/10 border border-white/20" placeholder="Filter by assignee email" value={filter} onChange={e=>setFilter(e.target.value)} onBlur={load} />
      )}
      {creating && user.role==='core' && (
        <form onSubmit={create} className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
          <input className="p-2 rounded bg-white/10 border border-white/20" placeholder="Title" value={form.title} onChange={e=>setForm({...form, title:e.target.value})} required />
          <input className="p-2 rounded bg-white/10 border border-white/20" placeholder="Description" value={form.description} onChange={e=>setForm({...form, description:e.target.value})} />
          <input className="p-2 rounded bg-white/10 border border-white/20" placeholder="Assignee Email" value={form.assignee_email} onChange={e=>setForm({...form, assignee_email:e.target.value})} required />
          <button className="md:col-span-3 bg-green-600 hover:bg-green-500 py-2 rounded">Create Task</button>
        </form>
      )}
      <div className="space-y-2">
        {tasks.map(t => (
          <div key={t._id} className="p-3 rounded bg-white/10 border border-white/10 flex items-center justify-between">
            <div>
              <div className="text-white font-medium">{t.title} <span className="text-xs text-blue-200">({t.status})</span></div>
              <div className="text-blue-200 text-sm">{t.description}</div>
              {user.role==='core' && <div className="text-xs text-blue-300">Assignee: {t.assignee_email}</div>}
            </div>
            <div className="flex gap-2">
              {['pending','in_progress','done'].map(s => (
                <button key={s} onClick={()=>setStatus(t._id, s)} className={`text-xs px-2 py-1 rounded border ${t.status===s? 'bg-blue-600 text-white' : 'bg-transparent text-white/80 border-white/20'}`}>{s}</button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Reports({ token, user }) {
  const [reports, setReports] = useState([])
  const [form, setForm] = useState({ date:'', summary:'', hours_worked:8 })

  const load = async () => {
    const res = await fetch(`${API_BASE}/reports`, { headers: { Authorization: `Bearer ${token}` } })
    setReports(await res.json())
  }
  useEffect(()=>{ load() },[])

  const submit = async (e) => {
    e.preventDefault()
    const res = await fetch(`${API_BASE}/reports`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(form) })
    if (res.ok) { setForm({ date:'', summary:'', hours_worked:8 }); load() }
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-semibold">Daily Reports</h3>
      </div>
      {user.role==='employee' && (
        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
          <input className="p-2 rounded bg-white/10 border border-white/20" type="date" value={form.date} onChange={e=>setForm({...form, date:e.target.value})} required />
          <input className="p-2 rounded bg-white/10 border border-white/20" placeholder="Summary" value={form.summary} onChange={e=>setForm({...form, summary:e.target.value})} required />
          <input className="p-2 rounded bg-white/10 border border-white/20" type="number" min="0" max="24" step="0.5" value={form.hours_worked} onChange={e=>setForm({...form, hours_worked:parseFloat(e.target.value)})} required />
          <button className="md:col-span-3 bg-green-600 hover:bg-green-500 py-2 rounded">Submit Report</button>
        </form>
      )}
      <div className="space-y-2">
        {reports.map(r => (
          <div key={r._id} className="p-3 rounded bg-white/10 border border-white/10">
            <div className="text-white font-medium">{r.report_date || r.date} - {r.hours_worked}h</div>
            <div className="text-blue-200 text-sm">{r.summary}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function BarChart({ labels, series, colors }) {
  // series: { name: string, data: number[] }[]
  const max = Math.max(1, ...series.flatMap(s => s.data))
  const barWidth = Math.max(12, Math.floor(480 / Math.max(1, labels.length)))
  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[600px]">
        <div className="flex items-end gap-2 h-48 border-b border-white/10 pb-2">
          {labels.map((lbl, i) => (
            <div key={lbl} className="flex-1 flex flex-col items-center gap-1" style={{minWidth: barWidth}}>
              <div className="w-full flex items-end gap-1">
                {series.map((s, si) => {
                  const val = s.data[i] || 0
                  const h = (val / max) * 160
                  return (
                    <div key={s.name+si} title={`${s.name}: ${val}`} className="flex-1 rounded-t" style={{height: h, backgroundColor: colors[si] || '#60a5fa'}} />
                  )
                })}
              </div>
              <div className="text-xs text-white/70 rotate-0">{lbl}</div>
            </div>
          ))}
        </div>
        <div className="flex justify-center gap-4 text-xs text-white/80 mt-2">
          {series.map((s, si) => (
            <div key={s.name} className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded" style={{backgroundColor: colors[si]}} />
              <span>{s.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function Finance({ token, user }) {
  const [items, setItems] = useState([])
  const [form, setForm] = useState({ kind:'revenue', amount:0, category:'', description:'', reference:'' })
  const [analytics, setAnalytics] = useState(null)

  const load = async () => {
    const res = await fetch(`${API_BASE}/finance`, { headers: { Authorization: `Bearer ${token}` } })
    setItems(await res.json())
  }
  const loadAnalytics = async () => {
    const res = await fetch(`${API_BASE}/analytics/summary?months=6`, { headers: { Authorization: `Bearer ${token}` } })
    if (res.ok) setAnalytics(await res.json())
  }
  useEffect(()=>{ if(user.role==='core'){ load(); loadAnalytics(); } },[])

  const create = async (e) => {
    e.preventDefault()
    const res = await fetch(`${API_BASE}/finance`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(form) })
    if (res.ok) { setForm({ kind:'revenue', amount:0, category:'', description:'', reference:'' }); load(); loadAnalytics() }
  }

  if (user.role !== 'core') return null

  const revenue = analytics?.finance?.revenue || []
  const expense = analytics?.finance?.expense || []
  const net = analytics?.finance?.net || []
  const sal = analytics?.salary?.total || []
  const months = analytics?.months || []
  const totalRevenue = revenue.reduce((a,b)=>a+b,0)
  const totalExpense = expense.reduce((a,b)=>a+b,0)
  const totalSalary = sal.reduce((a,b)=>a+b,0)
  const totalNet = net.reduce((a,b)=>a+b,0)

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-semibold">Finance (Core only)</h3>
      </div>

      {/* Analytics Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="bg-white/10 border border-white/10 rounded-lg p-3">
          <div className="text-xs text-blue-200">Revenue (6 mo)</div>
          <div className="text-white text-xl font-semibold">${totalRevenue.toFixed(2)}</div>
        </div>
        <div className="bg-white/10 border border-white/10 rounded-lg p-3">
          <div className="text-xs text-blue-200">Expenses (6 mo)</div>
          <div className="text-white text-xl font-semibold">${totalExpense.toFixed(2)}</div>
        </div>
        <div className="bg-white/10 border border-white/10 rounded-lg p-3">
          <div className="text-xs text-blue-200">Salary (6 mo)</div>
          <div className="text-white text-xl font-semibold">${totalSalary.toFixed(2)}</div>
        </div>
        <div className="bg-white/10 border border-white/10 rounded-lg p-3">
          <div className="text-xs text-blue-200">Net (6 mo)</div>
          <div className="text-white text-xl font-semibold">${totalNet.toFixed(2)}</div>
        </div>
      </div>

      {/* Charts */}
      {analytics && (
        <div className="space-y-6 mb-6">
          <div>
            <div className="text-white/90 font-medium mb-2">Revenue vs Expenses</div>
            <BarChart labels={months} series={[{name:'Revenue', data: revenue},{name:'Expense', data: expense},{name:'Net', data: net}]} colors={["#22c55e", "#ef4444", "#60a5fa"]} />
          </div>
          <div>
            <div className="text-white/90 font-medium mb-2">Salary</div>
            <BarChart labels={months} series={[{name:'Salary', data: sal}]} colors={["#a78bfa"]} />
          </div>
        </div>
      )}

      <form onSubmit={create} className="grid grid-cols-1 md:grid-cols-6 gap-2 mb-3">
        <select className="p-2 rounded bg-white/10 border border-white/20" value={form.kind} onChange={e=>setForm({...form, kind:e.target.value})}>
          <option value="revenue">Revenue</option>
          <option value="expense">Expense</option>
        </select>
        <input className="p-2 rounded bg-white/10 border border-white/20" placeholder="Amount" type="number" value={form.amount} onChange={e=>setForm({...form, amount:parseFloat(e.target.value)})} required />
        <input className="p-2 rounded bg-white/10 border border-white/20" placeholder="Category" value={form.category} onChange={e=>setForm({...form, category:e.target.value})} required />
        <input className="p-2 rounded bg-white/10 border border-white/20" placeholder="Description" value={form.description} onChange={e=>setForm({...form, description:e.target.value})} />
        <input className="p-2 rounded bg-white/10 border border-white/20" placeholder="Reference" value={form.reference} onChange={e=>setForm({...form, reference:e.target.value})} />
        <button className="bg-green-600 hover:bg-green-500 py-2 rounded">Add</button>
      </form>
      <div className="space-y-2">
        {items.map(it => (
          <div key={it._id} className="p-3 rounded bg-white/10 border border-white/10">
            <div className="text-white font-medium">{it.kind.toUpperCase()} - ${it.amount} • {it.category}</div>
            <div className="text-blue-200 text-sm">{it.description} {it.reference? '• '+it.reference:''}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Salary({ token, user }) {
  const [items, setItems] = useState([])
  const [form, setForm] = useState({ employee_email:'', amount:0, month:'', notes:'', status:'paid' })

  const load = async () => {
    const url = new URL(`${API_BASE}/salary`)
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    setItems(await res.json())
  }
  useEffect(()=>{ load() },[])

  const create = async (e) => {
    e.preventDefault()
    const res = await fetch(`${API_BASE}/salary`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(form) })
    if (res.ok) { setForm({ employee_email:'', amount:0, month:'', notes:'', status:'paid' }); load() }
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-semibold">Salary</h3>
      </div>
      {user.role==='core' && (
        <form onSubmit={create} className="grid grid-cols-1 md:grid-cols-5 gap-2 mb-3">
          <input className="p-2 rounded bg-white/10 border border-white/20" placeholder="Employee Email" value={form.employee_email} onChange={e=>setForm({...form, employee_email:e.target.value})} required />
          <input className="p-2 rounded bg-white/10 border border-white/20" placeholder="Amount" type="number" value={form.amount} onChange={e=>setForm({...form, amount:parseFloat(e.target.value)})} required />
          <input className="p-2 rounded bg-white/10 border border-white/20" placeholder="Month (e.g., 2025-01)" value={form.month} onChange={e=>setForm({...form, month:e.target.value})} required />
          <input className="p-2 rounded bg-white/10 border border-white/20" placeholder="Notes" value={form.notes} onChange={e=>setForm({...form, notes:e.target.value})} />
          <select className="p-2 rounded bg-white/10 border border-white/20" value={form.status} onChange={e=>setForm({...form, status:e.target.value})}>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
          </select>
          <button className="md:col-span-5 bg-green-600 hover:bg-green-500 py-2 rounded">Add Payment</button>
        </form>
      )}
      <div className="space-y-2">
        {items.map(it => (
          <div key={it._id} className="p-3 rounded bg-white/10 border border-white/10">
            <div className="text-white font-medium">{it.employee_email} - ${it.amount} ({it.month})</div>
            <div className="text-blue-200 text-sm">{it.status} {it.notes? '• '+it.notes:''}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Dashboard({ auth }) {
  const { token, user } = auth
  const [activeTab, setActiveTab] = useState('tasks')

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="text-white">
            <div className="text-2xl font-bold">Company Ops</div>
            <div className="text-blue-200 text-sm">Signed in as {user.name || user.email} • {user.role}</div>
          </div>
          <a href="/" className="text-blue-200 underline">Sign out</a>
        </div>

        <div className="flex gap-3 mb-6">
          <button onClick={()=>setActiveTab('tasks')} className={`px-4 py-2 rounded ${activeTab==='tasks'?'bg-blue-600 text-white':'bg-white/10 text-white/80'}`}>Tasks</button>
          <button onClick={()=>setActiveTab('reports')} className={`px-4 py-2 rounded ${activeTab==='reports'?'bg-blue-600 text-white':'bg-white/10 text-white/80'}`}>Daily Reports</button>
          <button onClick={()=>setActiveTab('salary')} className={`px-4 py-2 rounded ${activeTab==='salary'?'bg-blue-600 text-white':'bg-white/10 text-white/80'}`}>Salary</button>
          {user.role==='core' && (
            <button onClick={()=>setActiveTab('finance')} className={`px-4 py-2 rounded ${activeTab==='finance'?'bg-blue-600 text-white':'bg-white/10 text-white/80'}`}>Finance</button>
          )}
        </div>

        <div className="grid gap-6">
          {activeTab==='tasks' && <TaskList token={token} user={user} />}
          {activeTab==='reports' && <Reports token={token} user={user} />}
          {activeTab==='salary' && <Salary token={token} user={user} />}
          {activeTab==='finance' && <Finance token={token} user={user} />}
        </div>
      </div>
    </div>
  )
}

function App() {
  const [auth, setAuth] = useState(null)

  if (!auth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
        <Login onAuth={(data)=>setAuth({ token: data.token, user: data.user })} />
      </div>
    )
  }

  return <Dashboard auth={auth} />
}

export default App
