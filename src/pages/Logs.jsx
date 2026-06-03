import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import { History, Shield, User, Globe, Monitor, Search, Clock } from 'lucide-react';
import { format } from 'date-fns';

const Logs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterInterval, setFilterInterval] = useState('all');

  useEffect(() => {
    const q = query(
      collection(db, 'activityLogs'),
      orderBy('timestamp', 'desc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setLogs(logsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredLogs = logs.filter(log => {
    // 1. Search filter
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      log.userEmail?.toLowerCase().includes(searchLower) ||
      log.action?.toLowerCase().includes(searchLower) ||
      log.userName?.toLowerCase().includes(searchLower) ||
      log.os?.toLowerCase().includes(searchLower) ||
      log.browser?.toLowerCase().includes(searchLower);

    if (!matchesSearch) return false;

    // 2. Interval filter
    if (filterInterval === 'all') return true;
    if (!log.timestamp) return true; // Keep live records

    const logDate = log.timestamp.toDate ? log.timestamp.toDate() : new Date(log.timestamp);
    const now = new Date();

    if (filterInterval === 'today') {
      return logDate.toDateString() === now.toDateString();
    }
    if (filterInterval === 'week') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(now.getDate() - 7);
      return logDate >= oneWeekAgo;
    }
    if (filterInterval === 'month') {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(now.getMonth() - 1);
      return logDate >= oneMonthAgo;
    }
    if (filterInterval === 'year') {
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(now.getFullYear() - 1);
      return logDate >= oneYearAgo;
    }

    return true;
  });

  return (
    <div className="space-y-8 animate-page-entrance">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-[2.2rem] font-heading font-black text-white uppercase tracking-tight leading-none">Activity Logs</h1>
          <p className="text-[0.9rem] text-[#A0A0B0] font-body mt-2">Real-time audit trail of all administrative actions</p>
        </div>
        
        <div className="relative group max-w-md w-full">
          <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-white/20 group-focus-within:text-[#FF6A00] transition-colors">
            <Search size={18} />
          </div>
          <input 
            type="text"
            placeholder="FILTER BY USER OR ACTION..."
            className="w-full h-[56px] pl-12 pr-6 bg-[#0D121F] border border-white/10 rounded-2xl text-white outline-none focus:border-[#FF6A00] transition-all font-bold placeholder:text-white/10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* FILTER INTERVAL BAR */}
      <div className="flex flex-wrap gap-2.5 items-center bg-[#0D121F] border border-white/10 p-3 rounded-2xl">
        <span className="text-[0.65rem] font-black uppercase tracking-widest text-white/30 px-3">Interval:</span>
        {['all', 'today', 'week', 'month', 'year'].map((interval) => (
          <button
            key={interval}
            onClick={() => setFilterInterval(interval)}
            className={`px-4 py-2 rounded-xl text-[0.65rem] font-black uppercase tracking-[0.15em] transition-all cursor-pointer ${
              filterInterval === interval 
                ? 'bg-[#FF6A00] text-white shadow-lg shadow-[#FF6A00]/25' 
                : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
            }`}
          >
            {interval}
          </button>
        ))}
      </div>

      {/* LOGS TABLE */}
      <div className="bg-[#0D121F] border border-white/10 rounded-[32px] overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-8 py-6 text-[0.65rem] font-black text-white/30 uppercase tracking-widest">Event Time</th>
                <th className="px-8 py-6 text-[0.65rem] font-black text-white/30 uppercase tracking-widest">User Identity</th>
                <th className="px-8 py-6 text-[0.65rem] font-black text-white/30 uppercase tracking-widest">System Event</th>
                <th className="px-8 py-6 text-[0.65rem] font-black text-white/30 uppercase tracking-widest">Device / System</th>
                <th className="px-8 py-6 text-[0.65rem] font-black text-white/30 uppercase tracking-widest text-right">Audit Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-8 py-20 text-center">
                    <div className="inline-block w-8 h-8 border-4 border-[#FF6A00]/20 border-t-[#FF6A00] rounded-full animate-spin"></div>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-8 py-20 text-center text-white/20 font-bold uppercase tracking-widest">No activity records found</td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <History size={16} className="text-[#FF6A00]" />
                        <span className="text-white font-bold text-[0.8rem]">
                          {log.timestamp?.toDate ? format(log.timestamp.toDate(), 'HH:mm:ss') : 'LIVE'}
                        </span>
                        <span className="text-white/30 text-[0.7rem] uppercase tracking-tighter ml-1">
                          {log.timestamp?.toDate ? format(log.timestamp.toDate(), 'dd MMM yyyy') : ''}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-white/60 border border-white/5 group-hover:border-[#FF6A00]/30 transition-colors">
                          <User size={16} />
                        </div>
                        <div>
                          <div className="text-white font-black text-[0.85rem] leading-none mb-1 uppercase tracking-tight">{log.userName || 'Unknown'}</div>
                          <div className="text-white/20 text-[0.7rem] font-medium">{log.userEmail}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className={`inline-flex items-center px-3 py-1.5 rounded-lg border text-[0.65rem] font-black uppercase tracking-widest ${
                        log.action === 'LOGIN' 
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' 
                          : 'bg-[#FF6A00]/10 border-[#FF6A00]/20 text-[#FF6A00]'
                      }`}>
                        {log.action}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4 text-white/40 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <Monitor size={14} />
                          <span className="text-[0.7rem] font-bold">{log.browser || 'Browser'}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Globe size={14} />
                          <span className="text-[0.7rem] font-bold">{log.os || 'OS'}</span>
                        </div>
                        {log.sessionDuration && (
                          <div className="flex items-center gap-1.5 text-[#FF6A00] font-bold">
                            <Clock size={12} />
                            <span>{log.sessionDuration}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2 text-emerald-500 font-black text-[0.65rem] uppercase tracking-widest">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]"></div>
                        VERIFIED
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Logs;
