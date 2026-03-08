import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from "../../lib/supabaseClient";
import useToastStore from "../../store/toastStore";
import {
    Bug,
    Search,
    Filter,
    Clock,
    User,
    ChevronRight,
    ExternalLink,
    AlertCircle,
    CheckCircle2,
    Loader2,
    Eye,
    X,
    Camera,
    BrainCircuit,
    ShieldAlert,
    Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AdminBugReports = () => {
    const { addToast } = useToastStore();
    const [bugs, setBugs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedBug, setSelectedBug] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [severityFilter, setSeverityFilter] = useState('All');

    const fetchBugs = async () => {
        setLoading(true);
        try {
            const { data, error: sbError } = await supabase
                .from('bug_reports')
                .select('*')
                .order('created_at', { ascending: false });

            if (sbError) throw sbError;
            setBugs(data || []);
        } catch (err) {
            console.error("Fetch bugs error:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBugs();

        // Real-time subscription
        const channel = supabase
            .channel('bug_reports_realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'bug_reports' }, (payload) => {
                if (payload.eventType === 'INSERT') {
                    setBugs(prev => [payload.new, ...prev]);
                    addToast("New Bug Reported!", "success");
                } else if (payload.eventType === 'UPDATE') {
                    setBugs(prev => prev.map(b => b.id === payload.new.id ? payload.new : b));
                } else if (payload.eventType === 'DELETE') {
                    setBugs(prev => prev.filter(b => b.id === payload.old.id));
                }
            })
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, []);

    const updateBugStatus = async (id, newStatus) => {
        try {
            const { error: upError } = await supabase
                .from('bug_reports')
                .update({ status: newStatus })
                .eq('id', id);

            if (upError) throw upError;
            addToast(`Bug status updated to ${newStatus}`, "success");
        } catch (err) {
            addToast("Update failed: " + err.message, "error");
        }
    };

    const deleteBug = async (id) => {
        if (!window.confirm("Are you sure you want to delete this bug report?")) return;
        try {
            const { error: delError } = await supabase
                .from('bug_reports')
                .delete()
                .eq('id', id);

            if (delError) throw delError;
            addToast("Bug report deleted", "success");
            if (selectedBug?.id === id) setSelectedBug(null);
        } catch (err) {
            addToast("Delete failed: " + err.message, "error");
        }
    };

    const filteredBugs = useMemo(() => {
        return bugs.filter(bug => {
            const matchesSearch = bug.bug_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                bug.description.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = statusFilter === 'All' || bug.status === statusFilter.toLowerCase();
            const matchesSeverity = severityFilter === 'All' || bug.severity === severityFilter;
            return matchesSearch && matchesStatus && matchesSeverity;
        });
    }, [bugs, searchQuery, statusFilter, severityFilter]);

    const getSeverityStyle = (s) => {
        switch (s) {
            case 'Critical': return 'bg-red-500/10 text-red-500 border-red-500/20';
            case 'High': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
            case 'Medium': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
            default: return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
        }
    };

    const getStatusStyle = (s) => {
        switch (s?.toLowerCase()) {
            case 'resolved': return 'bg-emerald-500 text-white';
            case 'investigating': return 'bg-amber-500 text-white';
            case 'fixed': return 'bg-indigo-500 text-white';
            default: return 'bg-slate-200 text-slate-700';
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight italic uppercase flex items-center gap-3">
                        <Bug className="text-[#13ec80] w-8 h-8" />
                        Bug Radar
                    </h1>
                    <p className="text-sm font-bold text-slate-400 mt-1">
                        Tracking {filteredBugs.length} active bug reports across the system.
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/50 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#13ec80] transition-colors w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search bugs..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-3 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-[#13ec80]/5 focus:border-[#13ec80] focus:bg-white transition-all text-slate-700"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-600 focus:outline-none focus:border-[#13ec80] cursor-pointer"
                >
                    <option value="All">All Statuses</option>
                    <option value="Open">Open</option>
                    <option value="Investigating">Investigating</option>
                    <option value="Fixed">Fixed</option>
                    <option value="Resolved">Resolved</option>
                </select>
                <select
                    value={severityFilter}
                    onChange={(e) => setSeverityFilter(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-600 focus:outline-none focus:border-[#13ec80] cursor-pointer"
                >
                    <option value="All">All Severities</option>
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                </select>
            </div>

            {/* Table */}
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-2xl overflow-hidden min-h-[400px]">
                {loading ? (
                    <div className="flex items-center justify-center h-[400px]">
                        <Loader2 className="w-10 h-10 text-[#13ec80] animate-spin" />
                    </div>
                ) : filteredBugs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[400px] text-slate-400">
                        <Bug size={48} className="mb-4 opacity-20" />
                        <p className="font-bold uppercase tracking-widest text-xs">No bugs detected</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-slate-50/80 border-b border-slate-100">
                                    <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Severity</th>
                                    <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Title</th>
                                    <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</th>
                                    <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                    <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Reported</th>
                                    <th className="px-6 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredBugs.map((bug) => (
                                    <tr key={bug.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase border ${getSeverityStyle(bug.severity)}`}>
                                                {bug.severity}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-slate-800">{bug.bug_title}</span>
                                                <span className="text-[10px] text-slate-400 truncate max-w-[200px] font-medium">{bug.description}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-tight">{bug.category}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <select
                                                value={bug.status || 'open'}
                                                onChange={(e) => updateBugStatus(bug.id, e.target.value)}
                                                className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-full border-none outline-none cursor-pointer ${getStatusStyle(bug.status)}`}
                                            >
                                                <option value="open">Open</option>
                                                <option value="investigating">Investigating</option>
                                                <option value="fixed">Fixed</option>
                                                <option value="resolved">Resolved</option>
                                            </select>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-[10px] font-bold text-slate-400">
                                                {new Date(bug.created_at).toLocaleDateString()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => setSelectedBug(bug)}
                                                    className="p-2 bg-slate-900 text-white rounded-xl hover:bg-[#13ec80] hover:text-[#111814] transition-all shadow-lg"
                                                >
                                                    <Eye size={14} />
                                                </button>
                                                <button
                                                    onClick={() => deleteBug(bug.id)}
                                                    className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Details Modal */}
            <AnimatePresence>
                {selectedBug && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedBug(null)}
                            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl relative z-[101] my-auto border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden"
                        >
                            {/* Modal Header */}
                            <div className="p-8 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-[#13ec80]/10 rounded-2xl">
                                        <Bug className="w-8 h-8 text-[#13ec80]" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${getSeverityStyle(selectedBug.severity)}`}>
                                                {selectedBug.severity}
                                            </span>
                                            <span className="text-[10px] font-black text-[#13ec80] uppercase tracking-[0.2em]">#{selectedBug.id.slice(0, 8)}</span>
                                        </div>
                                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">{selectedBug.bug_title}</h2>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedBug(null)} className="p-3 hover:bg-white hover:shadow-md rounded-2xl transition-all">
                                    <X className="w-6 h-6 text-slate-400" />
                                </button>
                            </div>

                            {/* Modal Content */}
                            <div className="p-8 overflow-y-auto customize-scrollbar space-y-8 bg-white">
                                {/* Details Grid */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    <div className="space-y-6">
                                        <section>
                                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                <Eye className="w-4 h-4 text-emerald-500" />
                                                Detailed Analysis
                                            </h3>
                                            <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 space-y-4">
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">What happened?</p>
                                                    <p className="text-sm text-slate-700 leading-relaxed font-medium">{selectedBug.description}</p>
                                                </div>
                                                {selectedBug.steps_to_reproduce && (
                                                    <div>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Steps to Reproduce</p>
                                                        <p className="text-sm text-slate-700 whitespace-pre-line font-medium">{selectedBug.steps_to_reproduce}</p>
                                                    </div>
                                                )}
                                                <div className="grid grid-cols-2 gap-4 pt-2">
                                                    <div>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Expected</p>
                                                        <p className="text-[11px] text-slate-600 font-bold italic">{selectedBug.expected_result || 'N/A'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Actual</p>
                                                        <p className="text-[11px] text-red-500 font-bold italic">{selectedBug.actual_result || 'N/A'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </section>

                                        {/* AI Diagnostics */}
                                        <section className="bg-indigo-900 rounded-3xl p-6 text-white shadow-xl shadow-indigo-500/20">
                                            <h3 className="text-xs font-black uppercase tracking-widest mb-4 flex items-center gap-2 text-indigo-300">
                                                <BrainCircuit className="w-5 h-5" />
                                                AI Diagnostic Engine
                                            </h3>
                                            <div className="space-y-4">
                                                <div className="bg-white/10 p-4 rounded-2xl border border-white/10">
                                                    <p className="text-[10px] font-black text-indigo-200 uppercase mb-1">Probable Cause (AI Analysis)</p>
                                                    <p className="text-sm font-bold text-indigo-50 leading-relaxed">
                                                        {selectedBug.diagnostic_data?.ai_probable_cause || 'AI Engine analyzing core telemetry...'}
                                                    </p>
                                                </div>
                                                <div className="grid grid-cols-2 gap-3 text-[10px] font-bold">
                                                    <div className="flex items-center gap-2 text-indigo-200">
                                                        <ShieldAlert size={14} /> {selectedBug.diagnostic_data?.console_errors?.length || 0} Console Errors
                                                    </div>
                                                    <div className="flex items-center gap-2 text-indigo-200">
                                                        <ExternalLink size={14} /> Path: {selectedBug.diagnostic_data?.url?.split(window.location.host)[1] || "/"}
                                                    </div>
                                                </div>
                                            </div>
                                        </section>
                                    </div>

                                    {/* Attachments Section */}
                                    <div className="space-y-6">
                                        <section>
                                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                <Camera className="w-4 h-4 text-[#13ec80]" />
                                                Visual Evidence
                                            </h3>
                                            {selectedBug.diagnostic_data?.screenshot_base64 ? (
                                                <div className="relative group rounded-3xl overflow-hidden border-4 border-slate-50 shadow-lg cursor-zoom-in bg-slate-100 min-h-[200px] flex items-center justify-center">
                                                    <img
                                                        src={selectedBug.diagnostic_data.screenshot_base64}
                                                        alt="Bug Screenshot"
                                                        className="w-full h-auto max-h-[400px] object-contain"
                                                    />
                                                    <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                                                        <button
                                                            onClick={() => window.open(selectedBug.diagnostic_data.screenshot_base64, '_blank')}
                                                            className="px-6 py-2 bg-white rounded-full text-slate-900 text-xs font-black uppercase tracking-widest shadow-xl"
                                                        >
                                                            Open Full Size
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 aspect-video flex flex-col items-center justify-center text-slate-400">
                                                    <Camera size={40} className="mb-2 opacity-20" />
                                                    <p className="text-[10px] font-black uppercase tracking-widest">No Screenshot Provided</p>
                                                </div>
                                            )}
                                        </section>

                                        {/* Environment Telemetry */}
                                        <section>
                                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                <Clock className="w-4 h-4 text-blue-500" />
                                                System Telemetry
                                            </h3>
                                            <div className="bg-white border border-slate-100 rounded-3xl p-5 font-mono text-[10px] space-y-2 text-slate-500">
                                                <p><span className="text-slate-400 font-black">BROWSER:</span> {selectedBug.diagnostic_data?.browser}</p>
                                                <p><span className="text-slate-400 font-black">SCREEN:</span> {selectedBug.diagnostic_data?.screen}</p>
                                                <p><span className="text-slate-400 font-black">REPORTED:</span> {new Date(selectedBug.created_at).toLocaleString()}</p>
                                                {selectedBug.contact_permission && (
                                                    <p className="text-emerald-600 font-black bg-emerald-50 px-2 py-1 rounded inline-block mt-2">✓ USER PERMITTED FOLLOW-UP CONTACT</p>
                                                )}
                                            </div>
                                        </section>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style dangerouslySetInnerHTML={{
                __html: `
                .customize-scrollbar::-webkit-scrollbar { width: 6px; }
                .customize-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .customize-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 4px; }
            `}} />
        </div>
    );
};

export default AdminBugReports;
