import { useState, useEffect, useMemo } from 'react';
import { User, logout } from '../components/auth/AuthSystem';
import { db } from '../lib/firebase';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { Search, ArrowLeft, TrendingUp, TrendingDown, Users, GraduationCap, DollarSign, Wallet, AlertTriangle, Calendar, Clock, FileText, ArrowUpRight, Activity, BarChart3, PieChart, Bell, CheckCircle2, XCircle, Building2, BookOpen, CreditCard } from 'lucide-react';
import TeachersModule from './TeachersModule';
import FeesModule from './FeesModule';
import TimetableModule from './TimetableModule';
import SettingsModule from './SettingsModule';
import ReportCardsModule from './ReportCardsModule';
import InventoryModule from './InventoryModule';
import LeavesModule from './LeavesModule';
import StudentsModule from './StudentsModule';
import PromoteModule from './PromoteModule';
import LibraryModule from './LibraryModule';
import PayrollModule from './PayrollModule';
import BatchesModule from './BatchesModule';
import ExamsModule from './ExamsModule';
import CoursesModule from './CoursesModule';
import IdCardsModule from './IdCardsModule';
import EnquiriesModule from './EnquiriesModule';
import AdmissionsModule from './AdmissionsModule';
import AttendanceModule from './AttendanceModule';
import CertificatesModule from './CertificatesModule';
import TransfersModule from './TransfersModule';
import AccountsModule from './AccountsModule';
import AssetsModule from './AssetsModule';
import ExpensesModule from './ExpensesModule';
import DefaultersModule from './DefaultersModule';
import AlertsModule from './AlertsModule';
import CommunicationModule from './CommunicationModule';
import CampusModule from './CampusModule';
import AcademicCalendarModule from './AcademicCalendarModule';

export default function DashboardModule({ user }: { user: User }) {
  const [drawer, setDrawer] = useState(false);
  const [active, setActive] = useState('dashboard');
  const [requests, setRequests] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [moduleSearch, setModuleSearch] = useState('');
  useEffect(()=>{ (async()=>{ if(!db) return; try{ const r=await getDocs(collection(db,"approval_requests")); const u=await getDocs(collection(db,"users")); setRequests(r.docs.map(d=>({ ...d.data(), _docId:d.id }))); setUsers(u.docs.map(d=>({ ...d.data(), _docId:d.id }))); }catch(e){} })(); }, []);
  const pendingCount = requests.filter((r:any)=>r.status==='pending').length;

  const groups = [
    { title:'MAIN', items:[ { id:'dashboard', name:'Dashboard', icon:'📊' }, { id:'approvals', name:'Approvals', icon:'✅', badge:`${pendingCount}` }, { id:'users', name:'Users', icon:'👥', badge:`${users.length}` }, { id:'settings', name:'Settings', icon:'⚙️' }, ]},
    { title:'STUDENTS & ADMISSIONS', items:[ { id:'students', name:'Students Directory', icon:'👨‍🎓' }, { id:'admissions', name:'Admissions', icon:'📝' }, { id:'promote', name:'Promote Workflow', icon:'📈' }, { id:'reportcards', name:'Report Cards', icon:'📄' }, { id:'batches', name:'Batches', icon:'🎓' }, { id:'courses', name:'Courses', icon:'📖' }, { id:'transfers', name:'Transfers', icon:'🔄' }, { id:'certificates', name:'Certificates', icon:'🏅' }, ]},
    { title:'ACADEMICS & CAMPUS', items:[ { id:'calendar', name:'Academic Calendar', icon:'📅' }, { id:'teachers', name:'Teacher Zone', icon:'👨‍🏫' }, { id:'timetable', name:'Timetable', icon:'🕒' }, { id:'attendance', name:'Attendance', icon:'📅' }, { id:'library', name:'Library ERP', icon:'📚' }, { id:'exams', name:'Exams', icon:'📝' }, { id:'idcards', name:'ID Cards', icon:'🪪' }, { id:'campus', name:'Campus', icon:'🏛️' }, ]},
    { title:'FINANCE & HR', items:[ { id:'fees', name:'Fees Finance', icon:'💰' }, { id:'payroll', name:'Payroll', icon:'💵' }, { id:'leaves', name:'Leaves', icon:'🌴' }, { id:'accounts', name:'Accounts', icon:'📊' }, { id:'enquiries', name:'Enquiries', icon:'📩' }, { id:'expenses', name:'Expenses', icon:'🧾' }, { id:'defaulters', name:'Defaulters', icon:'⚠️' }, ]},
    { title:'OPERATIONS', items:[ { id:'inventory', name:'Inventory', icon:'📦' }, { id:'assets', name:'Assets', icon:'🏫' }, { id:'alerts', name:'Alerts', icon:'🔔' }, { id:'communication', name:'Communication', icon:'📢' }, ]},
  ];

  const allItems = groups.flatMap(g=>g.items);
  const filteredModules = useMemo(()=> { if(!moduleSearch) return allItems.filter(i=>i.id!=='dashboard'); return allItems.filter(i=>i.id!=='dashboard' && i.name.toLowerCase().includes(moduleSearch.toLowerCase())); }, [moduleSearch, pendingCount, users.length]);

  const Wrap = ({title,children}:any)=><div className="space-y-3"><div className="bg-white rounded-[16px] border p-4 flex items-center justify-between shadow-sm"><h2 className="font-black text-[15px]">{title}</h2></div>{children}</div>;

  const renderSmartDashboard = () => {
    const kpis = [
      { label:'Total Students', value:'1,248', change:'+12%', up:true, icon:Users, color:'bg-indigo-50 text-indigo-600', spark:[40,60,45,80,70,90] },
      { label:'Total Revenue MTD', value:'PKR 720k', change:'+8.2%', up:true, icon:DollarSign, color:'bg-emerald-50 text-emerald-600', spark:[30,50,60,55,75,85] },
      { label:'Pending Fees', value:'PKR 186k', change:'-4.1%', up:false, icon:AlertTriangle, color:'bg-amber-50 text-amber-600', spark:[80,60,70,50,40,30] },
      { label:'Attendance Today', value:'94.2%', change:'+2.3%', up:true, icon:CheckCircle2, color:'bg-teal-50 text-teal-600', spark:[85,88,90,92,94,94] },
    ];

    const revenueChart = [
      { m:'Jan', r:62, e:40 }, { m:'Feb', r:72, e:45 }, { m:'Mar', r:84, e:55 }, { m:'Apr', r:80, e:60 }, { m:'May', r:100, e:58 }, { m:'Jun', r:95, e:65 },
    ];

    const smartInsights = [
      { type:'alert', icon:AlertTriangle, color:'text-amber-600 bg-amber-50', title:'12 students fee overdue >30 days', desc:'Class 9-A has highest defaulters', action:'View Defaulters', link:'defaulters' },
      { type:'trend', icon:TrendingDown, color:'text-rose-600 bg-rose-50', title:'Attendance drop in Class 9', desc:'Down 6% vs last week (88% → 82%)', action:'Check Attendance', link:'attendance' },
      { type:'success', icon:TrendingUp, color:'text-emerald-600 bg-emerald-50', title:'Admissions up 18% MTD', desc:'23 new admissions in May', action:'View Admissions', link:'admissions' },
      { type:'info', icon:Calendar, color:'text-indigo-600 bg-indigo-50', title:'5 exams scheduled this week', desc:'Next: Class 10 Science - Tomorrow 9AM', action:'View Exams', link:'exams' },
    ];

    const recentTx = [
      { id:'TX-3055', type:'Salary', amount:300, status:'Due', email:'kazifahim93@gmail.com', date:'20/06/2017', color:'rose' },
      { id:'TX-3056', type:'Exam Fee', amount:500, status:'Paid', email:'ahmed.ali@school.com', date:'19/06/2017', color:'emerald' },
      { id:'TX-3057', type:'Library Fee', amount:900, status:'Paid', email:'fatima.noor@school.com', date:'18/06/2017', color:'emerald' },
      { id:'TX-3058', type:'Tuition Fee', amount:7200, status:'Paid', email:'ali.raza@school.com', date:'18/06/2017', color:'emerald' },
      { id:'TX-3059', type:'Transport', amount:1200, status:'Due', email:'bilal@school.com', date:'17/06/2017', color:'rose' },
    ];

    return (
      <div className="space-y-4 bg-[#f8fafc] p-0 -m-3 md:-m-5 md:p-4">
        {/* TOP ERP BAR */}
        <div className="bg-white border rounded-[16px] p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center font-black text-[12px]">TA</div>
            <div><h1 className="font-black text-[16px] leading-none">Taleem Academy ERP</h1><p className="text-[11px] text-slate-500 mt-1 flex items-center gap-2"><span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"/>Live • {new Date().toLocaleDateString()} • Kandhkot Campus • 28 Modules Operational</p></div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={()=>setActive('admissions')} className="px-3 py-2 bg-slate-900 text-white rounded-full text-[11px] font-bold hover:bg-black">+ New Admission</button>
            <button onClick={()=>setActive('fees')} className="px-3 py-2 bg-white border rounded-full text-[11px] font-bold hover:border-black">Collect Fee</button>
            <button onClick={()=>setActive('attendance')} className="px-3 py-2 bg-white border rounded-full text-[11px] font-bold">Mark Attendance</button>
          </div>
        </div>

        {/* SMART KPI */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {kpis.map((k,i)=>(
            <div key={i} className="bg-white rounded-[18px] border p-4 shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between"><div className={`w-9 h-9 rounded-xl flex items-center justify-center ${k.color}`}><k.icon className="w-4 h-4"/></div><span className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${k.up?'bg-emerald-50 text-emerald-700':'bg-rose-50 text-rose-700'}`}>{k.up?<TrendingUp className="w-3 h-3"/>:<TrendingDown className="w-3 h-3"/>}{k.change}</span></div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-3">{k.label}</p>
              <p className="text-[22px] font-black mt-1">{k.value}</p>
              <div className="flex items-end gap-0.5 mt-3 h-6">{k.spark.map((v,j)=><div key={j} className="flex-1 bg-slate-900 rounded-sm" style={{ height:`${v}%`, opacity:0.2+j*0.15 }}/>)}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-12 gap-4">
          {/* Revenue Chart */}
          <div className="col-span-12 lg:col-span-8 bg-white rounded-[18px] border p-5 shadow-sm">
            <div className="flex items-center justify-between mb-6"><div className="flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center"><BarChart3 className="w-4 h-4 text-indigo-600"/></div><div><h3 className="font-bold text-[14px]">Revenue vs Expenses</h3><p className="text-[11px] text-slate-500">Jan - Jun 2026 • PKR 720k MTD</p></div></div><div className="flex items-center gap-3 text-[11px]"><span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-black rounded-full"/>Revenue</span><span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-slate-200 rounded-full"/>Expense</span></div></div>
            <div className="space-y-3">{revenueChart.map((d,i)=><div key={i} className="flex items-center gap-3"><span className="text-[11px] font-bold w-7">{d.m}</span><div className="flex-1 flex gap-1"><div className="h-2.5 bg-black rounded-full" style={{ width:`${d.r}%` }}/><div className="h-2.5 bg-slate-200 rounded-full" style={{ width:`${d.e}%` }}/></div><span className="text-[11px] font-mono font-bold min-w-[60px] text-right">PKR {(d.r*7.2).toFixed(0)}k</span></div>)}</div>
            <div className="mt-6 grid grid-cols-3 gap-3 text-center border-t pt-4">
              <div><p className="text-[10px] text-slate-400 uppercase font-bold">Collection Efficiency</p><p className="text-[16px] font-black text-emerald-600 mt-1">94.2%</p></div>
              <div><p className="text-[10px] text-slate-400 uppercase font-bold">Avg Daily Collection</p><p className="text-[16px] font-black mt-1">PKR 24k</p></div>
              <div><p className="text-[10px] text-slate-400 uppercase font-bold">Outstanding</p><p className="text-[16px] font-black text-amber-600 mt-1">PKR 186k</p></div>
            </div>
          </div>

          {/* Collection Donut + Quick Stats */}
          <div className="col-span-12 lg:col-span-4 space-y-4">
            <div className="bg-white rounded-[18px] border p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4"><PieChart className="w-4 h-4"/><h3 className="font-bold text-[13px]">Income Breakdown</h3></div>
              <div className="flex justify-center mb-4"><div className="relative w-32 h-32"><div className="absolute inset-0 rounded-full" style={{ background:`conic-gradient(#111 0% 65%, #10b981 65% 80%, #f59e0b 80% 90%, #6366f1 90% 100%)` }}/><div className="absolute inset-4 bg-white rounded-full flex flex-col items-center justify-center shadow-sm border"><span className="font-black text-[18px]">100%</span><span className="text-[10px] text-slate-500">PKR 720k</span></div></div></div>
              <div className="space-y-2 text-[11px]">{[{n:'Tuition Fees', v:65, c:'#111'}, {n:'Admissions', v:15, c:'#10b981'}, {n:'Library & Other', v:10, c:'#f59e0b'}, {n:'Transport', v:10, c:'#6366f1'}].map(x=><div key={x.n} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg"><span className="w-2.5 h-2.5 rounded-full" style={{ background:x.c }}/><span className="flex-1 font-semibold">{x.n}</span><span className="font-bold">{x.v}%</span></div>)}</div>
            </div>
            <div className="bg-[#0f172a] rounded-[18px] p-4 text-white">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Campus Capacity</p><p className="text-[20px] font-black mt-1">395 / 500 Students</p><div className="mt-3 h-2 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-white rounded-full" style={{ width:'79%' }}/></div><p className="text-[11px] text-slate-400 mt-2">6 Venues • 79% Occupied • 2 Labs • 1 Library</p>
            </div>
          </div>
        </div>

        {/* SMART INSIGHTS - ERP PROFESSIONAL */}
        <div className="bg-white rounded-[18px] border p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4"><Activity className="w-4 h-4 text-indigo-600"/><h3 className="font-bold text-[14px]">Smart Insights • AI Powered</h3><span className="ml-2 px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded-full">4 Active</span></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {smartInsights.map((s,i)=><div key={i} className="border rounded-[14px] p-3 hover:shadow-md transition"><div className="flex items-start gap-3"><div className={`w-8 h-8 rounded-lg flex items-center justify-center ${s.color}`}><s.icon className="w-4 h-4"/></div><div className="flex-1 min-w-0"><p className="font-bold text-[12px] leading-tight">{s.title}</p><p className="text-[11px] text-slate-500 mt-1">{s.desc}</p><button onClick={()=>setActive(s.link)} className="mt-2 text-[11px] font-bold text-black hover:underline flex items-center gap-1">{s.action} <ArrowUpRight className="w-3 h-3"/></button></div></div></div>)}
          </div>
        </div>

        <div className="grid grid-cols-12 gap-4">
          {/* Recent Transactions */}
          <div className="col-span-12 lg:col-span-7 bg-white rounded-[18px] border shadow-sm overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between"><h3 className="font-bold text-[13px] flex items-center gap-2"><CreditCard className="w-4 h-4"/>Recent Transactions</h3><button onClick={()=>setActive('accounts')} className="text-[11px] font-bold text-indigo-600 hover:underline">View Ledger →</button></div>
            <div className="divide-y">
              {recentTx.map(t=><div key={t.id} className="p-3 flex items-center justify-between hover:bg-slate-50"><div className="flex items-center gap-3"><div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold ${t.color==='emerald'?'bg-emerald-50 text-emerald-700':'bg-rose-50 text-rose-700'}`}>{t.type[0]}</div><div><p className="font-bold text-[12px]">{t.id} • {t.type} • PKR {t.amount}</p><p className="text-[11px] text-slate-500">{t.email} • {t.date}</p></div></div><span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${t.status==='Paid'?'bg-emerald-100 text-emerald-700':'bg-rose-100 text-rose-700'}`}>{t.status}</span></div>)}
            </div>
          </div>
          {/* Pending + Quick Modules */}
          <div className="col-span-12 lg:col-span-5 space-y-4">
            <div className="bg-white rounded-[18px] border p-4 shadow-sm">
              <h3 className="font-bold text-[13px] mb-3 flex items-center gap-2"><Clock className="w-4 h-4"/>Pending Actions</h3>
              <div className="space-y-2">
                <button onClick={()=>setActive('approvals')} className="w-full p-3 border rounded-xl flex items-center justify-between hover:border-black text-left"><div className="flex items-center gap-2"><div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">✅</div><div><p className="font-bold text-[12px]">Approvals • {pendingCount} pending</p><p className="text-[11px] text-slate-500">New teacher requests</p></div></div><ArrowUpRight className="w-4 h-4 text-slate-400"/></button>
                <button onClick={()=>setActive('defaulters')} className="w-full p-3 border rounded-xl flex items-center justify-between hover:border-black text-left"><div className="flex items-center gap-2"><div className="w-8 h-8 bg-rose-100 rounded-lg flex items-center justify-center">⚠️</div><div><p className="font-bold text-[12px]">Fee Defaulters • 12 students</p><p className="text-[11px] text-slate-500">Overdue {'>'}30 days</p></div></div><ArrowUpRight className="w-4 h-4"/></button>
                <button onClick={()=>setActive('exams')} className="w-full p-3 border rounded-xl flex items-center justify-between hover:border-black text-left"><div className="flex items-center gap-2"><div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">📝</div><div><p className="font-bold text-[12px]">Exams • 5 this week</p><p className="text-[11px] text-slate-500">Class 10 Science tomorrow</p></div></div><ArrowUpRight className="w-4 h-4"/></button>
              </div>
            </div>
            <div className="bg-white rounded-[18px] border p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3"><h3 className="font-bold text-[12px] uppercase tracking-widest text-slate-500">All Modules • 28</h3><div className="relative"><Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"/><input value={moduleSearch} onChange={e=>setModuleSearch(e.target.value)} placeholder="Search..." className="pl-7 pr-2 py-1.5 border rounded-full text-[11px] outline-none focus:border-black w-32"/></div></div>
              <div className="grid grid-cols-2 gap-2 max-h-[280px] overflow-y-auto">{filteredModules.map(m=><button key={m.id} onClick={()=>{setActive(m.id); window.scrollTo({top:0, behavior:'smooth'});}} className="border rounded-xl p-2.5 flex items-center gap-2 text-left hover:border-black hover:bg-slate-50 text-[12px]"><span className="w-7 h-7 bg-slate-50 rounded-lg flex items-center justify-center text-[12px]">{m.icon}</span><span className="font-bold truncate">{m.name}</span></button>)}</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderContent = ()=>{
    if(active==='dashboard') return renderSmartDashboard();
    if(active==='calendar') return <Wrap title="Academic Calendar"><AcademicCalendarModule /></Wrap>;
    if(active==='campus') return <Wrap title="Campus Infrastructure"><CampusModule /></Wrap>;
    if(active==='communication') return <Wrap title="Communication Broadcast"><CommunicationModule /></Wrap>;
    if(active==='alerts') return <Wrap title="Alerts"><AlertsModule /></Wrap>;
    if(active==='expenses') return <Wrap title="Expenses ERP"><ExpensesModule /></Wrap>;
    if(active==='defaulters') return <Wrap title="Fee Defaulters"><DefaultersModule /></Wrap>;
    if(active==='exams') return <Wrap title="Exams & Date Sheet"><ExamsModule /></Wrap>;
    if(active==='courses') return <Wrap title="Courses PRO"><CoursesModule /></Wrap>;
    if(active==='idcards') return <Wrap title="ID Cards"><IdCardsModule /></Wrap>;
    if(active==='enquiries') return <Wrap title="Enquiries"><EnquiriesModule /></Wrap>;
    if(active==='payroll') return <Wrap title="Payroll"><PayrollModule /></Wrap>;
    if(active==='batches') return <Wrap title="Batches"><BatchesModule /></Wrap>;
    if(active==='students') return <Wrap title="Students Directory"><StudentsModule /></Wrap>;
    if(active==='promote') return <Wrap title="Promote Workflow"><PromoteModule /></Wrap>;
    if(active==='library') return <Wrap title="Library ERP"><LibraryModule /></Wrap>;
    if(active==='teachers') return <Wrap title="Teacher Zone"><TeachersModule /></Wrap>;
    if(active==='fees') return <Wrap title="Fees Finance"><FeesModule /></Wrap>;
    if(active==='timetable') return <Wrap title="Timetable"><TimetableModule /></Wrap>;
    if(active==='settings') return <Wrap title="Settings"><SettingsModule /></Wrap>;
    if(active==='reportcards') return <Wrap title="Report Cards"><ReportCardsModule /></Wrap>;
    if(active==='inventory') return <Wrap title="Inventory"><InventoryModule /></Wrap>;
    if(active==='leaves') return <Wrap title="Leaves"><LeavesModule /></Wrap>;
    if(active==='admissions') return <Wrap title="Admissions"><AdmissionsModule /></Wrap>;
    if(active==='attendance') return <Wrap title="Attendance"><AttendanceModule /></Wrap>;
    if(active==='certificates') return <Wrap title="Certificates"><CertificatesModule /></Wrap>;
    if(active==='transfers') return <Wrap title="Transfers"><TransfersModule /></Wrap>;
    if(active==='accounts') return <Wrap title="Accounts"><AccountsModule /></Wrap>;
    if(active==='assets') return <Wrap title="Assets"><AssetsModule /></Wrap>;
    if(active==='approvals'){ return <Wrap title="Approvals"><div className="grid gap-2">{requests.map((r:any)=><div key={r._docId} className="bg-white border rounded-xl p-4"><p className="font-bold text-sm">{r.name} - {r.email}</p><button onClick={async()=>{ await setDoc(doc(db!,"users", r._docId), { ...r, status:'approved' }); await deleteDoc(doc(db!,"approval_requests", r._docId)); setRequests(requests.filter(x=>x._docId!==r._docId)); }} className="mt-2 w-full bg-black text-white py-2.5 rounded-xl text-xs font-bold">Approve</button></div>)}{requests.length===0 && <p className="text-xs text-zinc-500 p-6 bg-white rounded-xl border text-center">No pending approvals</p>}</div></Wrap>; }
    if(active==='users'){ return <Wrap title="Users"><div className="bg-white rounded-xl border divide-y">{users.map((u:any)=><div key={u._docId} className="p-3 flex justify-between"><span className="font-bold text-xs">{u.name}</span><span className="text-[11px] text-zinc-500">{u.email}</span></div>)}</div></Wrap>; }
    return <Wrap title={active.toUpperCase()}><div className="bg-white rounded-xl border p-8 text-center"><p className="font-black">{active} Module</p></div></Wrap>;
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex">
      {drawer && <div onClick={()=>setDrawer(false)} className="fixed inset-0 bg-black/50 z-40 lg:hidden"/>}
      <aside className={`fixed lg:sticky top-0 h-[100dvh] w-[300px] bg-white z-50 border-r flex flex-col ${drawer?'translate-x-0':'-translate-x-full lg:translate-x-0'} transition-transform`}>
        <div className="bg-black text-white p-4 flex items-center gap-2"><div className="w-7 h-7 bg-white text-black rounded-lg flex items-center justify-center font-black text-[12px]">TA</div><h2 className="font-bold text-[14px]">TaleemOS ERP</h2><span className="ml-auto text-[10px] bg-white/10 px-2 py-0.5 rounded-full">PRO</span></div>
        <div className="flex-1 overflow-y-auto p-3 space-y-5">{groups.map(g=><div key={g.title}><p className="text-[10px] font-black text-zinc-400 px-2 mb-2 tracking-widest">{g.title}</p><div className="space-y-1">{g.items.map((it:any)=><button key={it.id} onClick={()=>{setActive(it.id); setDrawer(false); window.scrollTo({top:0, behavior:'smooth'});}} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[12.5px] border text-left ${active===it.id?'bg-black text-white font-bold shadow':'bg-white border-zinc-100 hover:border-zinc-300'}`}><span className="w-8 h-8 rounded-lg flex items-center justify-center bg-zinc-50 text-[14px]">{it.icon}</span><span className="flex-1 truncate">{it.name}</span>{(it as any).badge && (it as any).badge!=='' && (it as any).badge!=='0' && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500 text-white font-bold">{(it as any).badge}</span>}</button>)}</div></div>)}</div>
        <div className="p-3 border-t"><button onClick={logout} className="w-full py-2.5 rounded-xl bg-black text-white text-xs font-bold">Logout</button></div>
      </aside>
      <div className="flex-1 min-w-0">
        <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b">
          <div className="flex items-center gap-2 px-3 py-2.5">
            <button onClick={()=>setDrawer(true)} className="lg:hidden w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center">☰</button>
            {active!=='dashboard' && <button onClick={()=>{setActive('dashboard'); window.scrollTo({top:0, behavior:'smooth'});}} className="w-10 h-10 bg-white border hover:bg-black hover:text-white hover:border-black rounded-xl flex items-center justify-center transition-all shadow-sm"><ArrowLeft className="w-4 h-4"/></button>}
            <div className="flex-1 ml-1"><h1 className="font-bold text-[13px]">TaleemOS ERP</h1><p className="text-[10px] text-zinc-500">{active==='dashboard' ? 'Smart Dashboard • ERP Professional • 28 Modules' : `${active.toUpperCase()} • Press ← beside ☰ to go back`}</p></div>
            <button onClick={()=>{setActive('dashboard'); window.scrollTo({top:0, behavior:'smooth'});}} className={`px-3.5 py-2 rounded-xl text-xs font-bold ${active==='dashboard'?'bg-slate-100 text-slate-400':'bg-black text-white'}`}>Dashboard</button>
          </div>
        </div>
        <div className="p-3 md:p-4 space-y-4 pb-24">{renderContent()}</div>
      </div>
    </div>
  );
}
