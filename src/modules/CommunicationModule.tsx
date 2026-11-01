import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { MessageSquare, Plus, Printer, Download, Send, Phone, Bell, Radio, CheckCircle2, Bookmark, Sparkles, Edit2, Trash2, Copy, Eye, Tag, Layers, ArrowRight, Info, CheckSquare, Square, X } from 'lucide-react';
import { erpStorage } from '../lib/storage';
import { type CommunicationMessage, type MessageTemplate } from '../types';
import { Modal } from '../components/common/Modal';
import { LetterheadPrint } from '../components/common/LetterheadPrint';
import { getMessageTemplates, saveMessageTemplate, deleteMessageTemplate, substitutePlaceholders, DYNAMIC_PLACEHOLDERS } from '../lib/messageTemplates';
import { logAuditEvent } from '../lib/auditLogger';
import { getCurrentUser } from '../components/auth/AuthSystem';

export const CommunicationModule: React.FC = () => {
  const state = erpStorage.getState();
  const currentUser = getCurrentUser();
  const isParent = currentUser?.role === 'parent';
  const isTeacher = currentUser?.role === 'teacher';
  const isStudent = currentUser?.role === 'student';

  
  
  
  

  
  
  
  
  
  const academyId = currentUser?.academyId || state.activeInstitutionId || 'inst-1';

  const [activeTab, setActiveTab] = useState<'outbox' | 'templates'>('outbox');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Modals & Print State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printData, setPrintData] = useState<CommunicationMessage[] | null>(null);
  const [sentNotice, setSentNotice] = useState<string | null>(null);
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);

  // Compose Broadcast form fields
  const [channel, setChannel] = useState<CommunicationMessage['channel']>('WhatsApp');
  const [audience, setAudience] = useState<CommunicationMessage['audience']>('All Students');
  const [targetBatch, setTargetBatch] = useState('Batch 2026-A (Morning)');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const messageInputRef = useRef<HTMLTextAreaElement>(null);

  // Template Manager state
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [tmplTitle, setTmplTitle] = useState('');
  const [tmplCategory, setTmplCategory] = useState<MessageTemplate['category']>('Fee Reminder');
  const [tmplChannel, setTmplChannel] = useState<MessageTemplate['channel']>('SMS');
  const [tmplMessage, setTmplMessage] = useState('');
  const [tmplError, setTmplError] = useState<string | null>(null);
  const templateInputRef = useRef<HTMLTextAreaElement>(null);

  const loadTemplates = () => setTemplates(getMessageTemplates(academyId));

  useEffect(() => {
    loadTemplates();
    const handleTemplateChange = () => loadTemplates();
    window.addEventListener('taleemos_templates_changed', handleTemplateChange);
    return () => window.removeEventListener('taleemos_templates_changed', handleTemplateChange);
  }, [academyId]);

  const filteredTemplates = templates.filter((t) => selectedCategory === 'All' || t.category === selectedCategory);

  // Selection Logic for Outbox
  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === state.communications.length && state.communications.length > 0) setSelectedIds([]);
    else setSelectedIds(state.communications.map(c => c.id));
  };

  const handleBulkDelete = () => {
    if (confirm(`Delete ${selectedIds.length} selected broadcast records?`)) {
      selectedIds.forEach(id => erpStorage.deleteItem('communications', id));
      setSelectedIds([]);
      setSentNotice('Selected broadcasts deleted.');
      setTimeout(() => setSentNotice(null), 3000);
    }
  };

  const handleDeleteMessage = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this broadcast record?')) {
      erpStorage.deleteItem('communications', id);
      setSelectedIds(prev => prev.filter(i => i !== id));
      setSentNotice('Broadcast record deleted.');
      setTimeout(() => setSentNotice(null), 3000);
    }
  };

  const handleOpenEditMessage = (msg: CommunicationMessage, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingMsgId(msg.id);
    setChannel(msg.channel);
    setAudience(msg.audience);
    setTargetBatch(msg.targetBatch || 'Batch 2026-A (Morning)');
    setTitle(msg.title);
    setMessage(msg.message);
    setIsAddModalOpen(true);
  };

  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    if (editingMsgId) {
      erpStorage.updateItem('communications', editingMsgId, { channel, audience, targetBatch: audience === 'Selected Batch' ? targetBatch : undefined, title, message });
      setSentNotice('Broadcast updated successfully!');
    } else {
      const newMsg: CommunicationMessage = {
        id: `COM-${Date.now().toString().slice(-4)}`, channel, audience, targetBatch: audience === 'Selected Batch' ? targetBatch : undefined,
        title, message, sentDate: new Date().toISOString().split('T')[0], sentBy: state.userName, deliveryStatus: 'Delivered',
      };
      erpStorage.addItem('communications', newMsg);
      if (channel === 'WhatsApp') {
        const resolved = substitutePlaceholders(message);
        window.open(`https://wa.me/?text=${encodeURIComponent(`*${title}*\n\n${resolved}\n\n- ${currentUser?.academyName || 'Taleem Academy'}`)}`, '_blank');
      }
      setSentNotice(`Successfully broadcasted message via ${channel}!`);
    }
    setIsAddModalOpen(false); setEditingMsgId(null); setTitle(''); setMessage('');
    setTimeout(() => setSentNotice(null), 4000);
  };

  const handleTriggerPrint = (recordsToPrint: CommunicationMessage[]) => {
    setPrintData(recordsToPrint);
    setIsPrintModalOpen(false);
    setTimeout(() => window.print(), 300);
  };

  // Template Logic
  const handleOpenAddTemplate = () => { setEditingTemplateId(null); setTmplTitle(''); setTmplCategory('Fee Reminder'); setTmplChannel('SMS'); setTmplMessage(''); setTmplError(null); setIsTemplateModalOpen(true); };
  const handleOpenEditTemplate = (tmpl: MessageTemplate) => { setEditingTemplateId(tmpl.id); setTmplTitle(tmpl.title); setTmplCategory(tmpl.category); setTmplChannel(tmpl.channel); setTmplMessage(tmpl.message); setTmplError(null); setIsTemplateModalOpen(true); };
  const handleSaveTemplate = (e: React.FormEvent) => { e.preventDefault(); if (!tmplTitle.trim() || !tmplMessage.trim()) { setTmplError('Please fill in both the title and the message body.'); return; } const res = saveMessageTemplate({ id: editingTemplateId || undefined, title: tmplTitle.trim(), category: tmplCategory, channel: tmplChannel, message: tmplMessage.trim() }, academyId); if (!res.success) { setTmplError(res.error || 'Failed to save template.'); return; } loadTemplates(); setIsTemplateModalOpen(false); setSentNotice(editingTemplateId ? 'Template updated!' : 'New template saved!'); setTimeout(() => setSentNotice(null), 3000); };
  const handleDeleteTemplate = (id: string, titleStr: string) => { if (confirm(`Delete message template "${titleStr}"?`)) { const res = deleteMessageTemplate(id, academyId); if (res.success) { loadTemplates(); setSentNotice(`Deleted template "${titleStr}".`); setTimeout(() => setSentNotice(null), 3000); } else { alert(res.error || 'Failed to delete template.'); } } };
  const handleUseTemplate = (tmpl: MessageTemplate) => { setEditingMsgId(null); setTitle(tmpl.title); setMessage(tmpl.message); setChannel(tmpl.channel as any); setIsAddModalOpen(true); };
  const insertPlaceholderIntoBroadcast = (tag: string) => { const textarea = messageInputRef.current; if (textarea) { const start = textarea.selectionStart; const end = textarea.selectionEnd; const before = message.substring(0, start); const after = message.substring(end); setMessage(before + tag + after); setTimeout(() => { textarea.focus(); textarea.setSelectionRange(start + tag.length, start + tag.length); }, 50); } else { setMessage((prev) => (prev ? `${prev} ${tag}` : tag)); } };
  const insertPlaceholderIntoTemplate = (tag: string) => { const textarea = templateInputRef.current; if (textarea) { const start = textarea.selectionStart; const end = textarea.selectionEnd; const before = tmplMessage.substring(0, start); const after = tmplMessage.substring(end); setTmplMessage(before + tag + after); setTimeout(() => { textarea.focus(); textarea.setSelectionRange(start + tag.length, start + tag.length); }, 50); } else { setTmplMessage((prev) => (prev ? `${prev} ${tag}` : tag)); } };

  const PrintTableContent = ({ data }: { data: CommunicationMessage[] }) => (
    <table className="w-full border-collapse border border-slate-300 text-left text-xs">
      <thead><tr className="bg-slate-100 text-slate-800 font-bold"><th className="border p-2">Date</th><th className="border p-2">Channel</th><th className="border p-2">Audience</th><th className="border p-2">Headline</th><th className="border p-2">Message Content</th><th className="border p-2">Dispatched By</th></tr></thead>
      <tbody>{data.map((c) => (<tr key={c.id}><td className="border p-2 font-mono text-[10px] whitespace-nowrap">{c.sentDate}</td><td className="border p-2 font-bold">{c.channel}</td><td className="border p-2">{c.audience} {c.targetBatch ? `(${c.targetBatch})` : ''}</td><td className="border p-2 font-bold">{c.title}</td><td className="border p-2 text-slate-700 max-w-[300px] truncate">{c.message}</td><td className="border p-2 font-medium">{c.sentBy}</td></tr>))}</tbody>
    </table>
  );
  return (
    <>
      <div className="space-y-6 animate-in fade-in duration-200 print:hidden">
        {sentNotice && <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /><span>{sentNotice}</span></div>}

        {/* Header */}
        <div className="rounded-[24px] bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-indigo-600 rounded-xl"><MessageSquare className="w-5 h-5 text-white" /></span>
              <h1 className="text-xl md:text-2xl font-black tracking-tight">Communication Hub</h1>
              <span className="px-2 py-0.5 bg-indigo-500 text-white font-black text-[10px] rounded uppercase">MULTI-CHANNEL</span>
            </div>
            <p className="text-xs text-indigo-200 mt-1">Bulk SMS gateways, official WhatsApp broadcasts, message template manager, and digital notice board.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => setIsPrintModalOpen(true)} className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/20 transition-all cursor-pointer"><Printer className="w-4 h-4" /> Print Log</button>
            <button type="button" onClick={handleOpenAddTemplate} className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-700 hover:bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"><Bookmark className="w-4 h-4" /> New Template</button>
            <button type="button" onClick={() => { setEditingMsgId(null); setTitle(''); setMessage(''); setIsAddModalOpen(true); }} className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl shadow-lg transition-all cursor-pointer"><Send className="w-4 h-4" /> Compose Broadcast</button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <button type="button" onClick={() => setActiveTab('outbox')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${activeTab === 'outbox' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}><Radio className="w-4 h-4" /><span>Broadcast Outbox ({state.communications.length})</span></button>
          <button type="button" onClick={() => setActiveTab('templates')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${activeTab === 'templates' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}><Bookmark className="w-4 h-4" /><span>Template Manager ({templates.length})</span></button>
        </div>

        {/* OUTBOX TAB */}
        {activeTab === 'outbox' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-white rounded-[22px] border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2">
                <button onClick={toggleSelectAll} className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition">
                  {selectedIds.length === state.communications.length && state.communications.length > 0 ? <CheckSquare className="w-4 h-4 text-indigo-600" /> : <Square className="w-4 h-4 text-slate-400" />} Select All
                </button>
                {selectedIds.length > 0 && (
                  <button onClick={handleBulkDelete} className="px-3 py-2 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1.5"><Trash2 className="w-4 h-4" /> Delete ({selectedIds.length})</button>
                )}
              </div>
              {selectedIds.length > 0 && (
                <button onClick={() => handleTriggerPrint(state.communications.filter(c => selectedIds.includes(c.id)))} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md"><Printer className="w-4 h-4" /> Print Selected</button>
              )}
            </div>

            <div className="space-y-3">
              {displayRecords.map((c) => {
                const isSelected = selectedIds.includes(c.id);
                return (
                  <div key={c.id} className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-start justify-between gap-3 ${isSelected ? 'bg-indigo-50/50 border-indigo-400 ring-1 ring-indigo-400/30' : 'bg-white border-slate-200 hover:shadow-sm'}`}>
                    <div className="flex items-start gap-3">
                      <label className="mt-1 p-1 bg-white border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 shadow-sm" onClick={e => e.stopPropagation()}>
                        <input type="checkbox" checked={isSelected} onChange={(e) => toggleSelect(c.id, e as any)} className="w-4 h-4 rounded text-indigo-600 cursor-pointer" />
                      </label>
                      <div className={`p-2.5 rounded-xl text-white font-black shrink-0 ${c.channel === 'WhatsApp' ? 'bg-emerald-600' : c.channel === 'SMS' ? 'bg-indigo-600' : 'bg-amber-600'}`}>
                        {c.channel === 'WhatsApp' ? <MessageSquare className="w-5 h-5" /> : c.channel === 'SMS' ? <Phone className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 text-sm">{c.title}</span>
                          <span className="px-2 py-0.5 bg-slate-200 text-slate-700 text-[10px] font-bold rounded">{c.audience} {c.targetBatch ? `(${c.targetBatch})` : ''}</span>
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">{c.deliveryStatus}</span>
                        </div>
                        <p className="mt-1.5 text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed font-medium">{c.message}</p>
                        <div className="mt-2 text-[10px] text-slate-400 font-mono">Channel: {c.channel} &bull; By {c.sentBy} on {c.sentDate}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 ml-auto md:ml-4">
                      {c.channel === 'WhatsApp' && (
                        <button type="button" onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`*${c.title}*\n\n${c.message}\n\n- ${currentUser?.academyName || 'Taleem Academy'}`)}`, '_blank')} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold hover:bg-emerald-100">Re-share</button>
                      )}
                      <button type="button" onClick={(e) => handleOpenEditMessage(c, e)} className="p-1.5 text-slate-400 hover:text-indigo-600 bg-slate-50 rounded-lg" title="Edit"><Edit2 className="w-4 h-4" /></button>
                      <button type="button" onClick={(e) => handleDeleteMessage(c.id, e)} className="p-1.5 text-slate-400 hover:text-rose-600 bg-slate-50 rounded-lg" title="Delete"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {/* TEMPLATES TAB */}
        {activeTab === 'templates' && (
          <div className="space-y-4">
            <div className="p-4 bg-white rounded-[22px] border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Category:</span>
                {['All', 'Fee Reminder', 'Attendance Alert', 'Exam Notice', 'General Announcement', 'Admission'].map((cat) => (
                  <button key={cat} type="button" onClick={() => setSelectedCategory(cat)} className={`px-3 py-1 rounded-full text-[11px] font-bold cursor-pointer transition-all ${selectedCategory === cat ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{cat}</button>
                ))}
              </div>
              <button type="button" onClick={handleOpenAddTemplate} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-sm"><Plus className="w-4 h-4" /><span>Create Template</span></button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTemplates.map((tmpl) => {
                const previewText = substitutePlaceholders(tmpl.message);
                return (
                  <div key={tmpl.id} className="p-5 bg-white rounded-[22px] border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${tmpl.category === 'Fee Reminder' ? 'bg-emerald-100 text-emerald-800' : tmpl.category === 'Attendance Alert' ? 'bg-rose-100 text-rose-800' : tmpl.category === 'Exam Notice' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'}`}>{tmpl.category}</span>
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-mono rounded font-bold">{tmpl.channel}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button type="button" onClick={() => handleOpenEditTemplate(tmpl)} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"><Edit2 className="w-3.5 h-3.5" /></button>
                          <button type="button" onClick={() => handleDeleteTemplate(tmpl.id, tmpl.title)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                      <h4 className="font-extrabold text-slate-900 text-sm mt-2">{tmpl.title}</h4>
                      <div className="mt-2 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs font-mono text-slate-700 leading-relaxed">{tmpl.message}</div>
                      <div className="mt-2.5 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 text-xs text-indigo-950">
                        <div className="flex items-center gap-1 font-bold text-[10px] text-indigo-600 uppercase mb-1"><Sparkles className="w-3 h-3" /><span>Live Preview</span></div>
                        <p className="leading-relaxed text-[11px] text-slate-700">{previewText}</p>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400">{tmpl.isSystem ? 'System Preset' : 'Custom Template'}</span>
                      <button type="button" onClick={() => handleUseTemplate(tmpl)} className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer active:scale-95"><span>Use in Broadcast</span><ArrowRight className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
      {/* COMPOSE BROADCAST MODAL */}
      <Modal isOpen={isAddModalOpen} onClose={() => { setIsAddModalOpen(false); setEditingMsgId(null); }} title={editingMsgId ? "Edit Broadcast Message" : "Compose Communication Broadcast"} subtitle="Dispatches notifications via SMS gateway or WhatsApp" badge={editingMsgId ? "EDIT" : "BROADCAST DISPATCH"} maxWidth="max-w-2xl">
        <form onSubmit={handleBroadcast} className="space-y-4">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5"><Bookmark className="w-4 h-4 text-indigo-600" /><span>Load Saved Template:</span></span>
            <select onChange={(e) => { const found = templates.find((t) => t.id === e.target.value); if (found) { setTitle(found.title); setMessage(found.message); setChannel(found.channel as any); } }} className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none cursor-pointer" defaultValue=""><option value="" disabled>-- Choose from {templates.length} templates --</option>{templates.map((t) => (<option key={t.id} value={t.id}>[{t.category}] {t.title}</option>))}</select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="block text-xs font-bold text-slate-700 uppercase mb-1">Channel *</label><select value={channel} onChange={(e) => setChannel(e.target.value as CommunicationMessage['channel'])} className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none bg-white font-medium"><option value="WhatsApp">WhatsApp Message</option><option value="SMS">SMS Gateway</option><option value="Notice Board">Digital Notice Board</option><option value="Push Notification">Push Notification</option></select></div>
            <div><label className="block text-xs font-bold text-slate-700 uppercase mb-1">Target Audience</label><select value={audience} onChange={(e) => setAudience(e.target.value as CommunicationMessage['audience'])} className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none bg-white font-medium"><option value="All Students">All Students</option><option value="Selected Batch">Selected Batch Only</option><option value="All Parents">All Parents</option><option value="Faculty">Faculty & Staff</option></select></div>
          </div>
          {audience === 'Selected Batch' && <div><label className="block text-xs font-bold text-slate-700 uppercase mb-1">Choose Batch</label><select value={targetBatch} onChange={(e) => setTargetBatch(e.target.value)} className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none bg-white">{state.batches.map((b) => (<option key={b.id} value={b.batchName}>{b.batchName}</option>))}</select></div>}
          <div><label className="block text-xs font-bold text-slate-700 uppercase mb-1">Notice Headline *</label><input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-600" /></div>
          <div>
            <div className="flex items-center justify-between mb-1"><label className="block text-xs font-bold text-slate-700 uppercase">Message Content *</label><span className="text-[10px] text-slate-400 font-mono">{message.length} chars</span></div>
            <div className="mb-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5"><span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Click placeholder to insert:</span><div className="flex flex-wrap items-center gap-1.5">{DYNAMIC_PLACEHOLDERS.map((p) => (<button key={p.tag} type="button" onClick={() => insertPlaceholderIntoBroadcast(p.tag)} className="px-2 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-[10px] font-mono font-bold transition">+ {p.tag}</button>))}</div></div>
            <textarea ref={messageInputRef} required rows={4} value={message} onChange={(e) => setMessage(e.target.value)} className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-600 font-mono" />
            {message.trim() && (<div className="mt-2 p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 text-xs text-indigo-950"><span className="text-[10px] font-bold text-indigo-600 uppercase flex items-center gap-1 mb-1"><Sparkles className="w-3 h-3" /> Preview:</span><p className="text-slate-800 text-xs leading-relaxed font-sans">{substitutePlaceholders(message)}</p></div>)}
          </div>
          <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
            <button type="button" onClick={() => { setIsAddModalOpen(false); setEditingMsgId(null); }} className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold rounded-xl">Cancel</button>
            <button type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-lg flex items-center gap-1.5"><Send className="w-4 h-4" /><span>{editingMsgId ? 'Update Broadcast' : 'Broadcast Now'}</span></button>
          </div>
        </form>
      </Modal>

      {/* CREATE / EDIT TEMPLATE MODAL */}
      {isTemplateModalOpen && (
        <Modal isOpen={isTemplateModalOpen} onClose={() => setIsTemplateModalOpen(false)} title={editingTemplateId ? 'Edit Message Template' : 'Create New Message Template'} subtitle="Save reusable templates with dynamic student placeholders" badge="TEMPLATE BUILDER" maxWidth="max-w-2xl">
          <form onSubmit={handleSaveTemplate} className="space-y-4">
            {tmplError && <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl">{tmplError}</div>}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><label className="block text-xs font-bold text-slate-700 uppercase mb-1">Template Title *</label><input type="text" required value={tmplTitle} onChange={(e) => setTmplTitle(e.target.value)} className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-600" /></div>
              <div><label className="block text-xs font-bold text-slate-700 uppercase mb-1">Category *</label><select value={tmplCategory} onChange={(e) => setTmplCategory(e.target.value as any)} className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none bg-white font-medium"><option value="Fee Reminder">Fee Reminder</option><option value="Attendance Alert">Attendance Alert</option><option value="Exam Notice">Exam Notice</option><option value="General Announcement">General Announcement</option><option value="Admission">Admission Confirmation</option></select></div>
            </div>
            <div><label className="block text-xs font-bold text-slate-700 uppercase mb-1">Preferred Channel</label><select value={tmplChannel} onChange={(e) => setTmplChannel(e.target.value as any)} className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none bg-white font-medium"><option value="SMS">SMS Gateway</option><option value="WhatsApp">WhatsApp Broadcast</option><option value="Push Notification">Push Notification</option></select></div>
            <div>
              <div className="flex items-center justify-between mb-1"><label className="block text-xs font-bold text-slate-700 uppercase">Template Message Body *</label><span className="text-[10px] text-slate-400 font-mono">{tmplMessage.length} chars</span></div>
              <div className="mb-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5"><span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Click to insert placeholder:</span><div className="flex flex-wrap items-center gap-1.5">{DYNAMIC_PLACEHOLDERS.map((p) => (<button key={p.tag} type="button" onClick={() => insertPlaceholderIntoTemplate(p.tag)} className="px-2 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-[10px] font-mono font-bold transition">+ {p.tag}</button>))}</div></div>
              <textarea ref={templateInputRef} required rows={4} value={tmplMessage} onChange={(e) => setTmplMessage(e.target.value)} className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-600 font-mono" />
            </div>
            <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
              <button type="button" onClick={() => setIsTemplateModalOpen(false)} className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold rounded-xl">Cancel</button>
              <button type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md">{editingTemplateId ? 'Save Changes' : 'Save Template'}</button>
            </div>
          </form>
        </Modal>
      )}

      {/* PRINT PREVIEW MODAL */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-2 sm:p-4 backdrop-blur-sm overflow-hidden">
          <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[95vh] flex flex-col shadow-2xl">
            <div className="sticky top-0 bg-white z-10 flex flex-col md:flex-row md:items-center justify-between p-4 border-b gap-3 rounded-t-2xl">
              <div><h3 className="font-bold text-base text-slate-900">Print Dispatch Log</h3><p className="text-[11px] text-slate-500">Export communication records to A4.</p></div>
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" onClick={() => handleTriggerPrint(state.communications)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md"><Printer className="w-4 h-4" /> Print All</button>
                <button type="button" onClick={() => setIsPrintModalOpen(false)} className="px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 rounded-lg text-xs font-black shadow-sm">Close</button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4 bg-slate-200">
              <div className="bg-white shadow-md mx-auto pointer-events-none">
                <div className="p-8">
                  <LetterheadPrint title="INSTITUTIONAL COMMUNICATION & BROADCAST LOG" documentNo="COM-LOG-2026" summaryStats={[{ label: 'Total Messages', value: state.communications.length }, { label: 'Templates Available', value: templates.length }]}>
                    <PrintTableContent data={state.communications} />
                  </LetterheadPrint>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SECRET PRINT PORTAL - ONLY RENDERED WHEN PRINTING */}
      {/* ======================================================== */}
      {printData && createPortal(
        <div id="print-mount" className="hidden print:block w-full bg-white text-slate-900">
          <div className="print-page">
            <LetterheadPrint title="INSTITUTIONAL COMMUNICATION & BROADCAST LOG" documentNo="COM-LOG-2026" summaryStats={[{ label: 'Total Records', value: printData.length }]}>
              <PrintTableContent data={printData} />
            </LetterheadPrint>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default CommunicationModule;
