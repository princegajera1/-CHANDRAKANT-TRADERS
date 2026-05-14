import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBills } from '../hooks/useBills';
import { useProducts } from '../hooks/useProducts';
import { useCustomers } from '../hooks/useCustomers';
import { StatCard, Badge } from '../components/ui/StatCard';
import { AnimatedNumber } from '../components/ui/AnimatedNumber';
import { isToday } from '../utils/formatters';
import { TrendingUp, FileText, AlertTriangle, ArrowRight, Package, ShieldCheck, BarChart3, History, Shield, Eye, Users } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { db } from '../firebase/config';
import { collection, query, orderBy, limit, onSnapshot, where } from 'firebase/firestore';
import { format } from 'date-fns';

const Dashboard = () => {
  const navigate = useNavigate();
  const { bills } = useBills();
  const { products } = useProducts();
  const { customers } = useCustomers();

  const [stats, setStats] = useState({ todaySales: 0, todayBills: 0, lowStock: 0, pendingUdhaar: 0, visitorCount: 0 });
  const [chartData, setChartData] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);

  useEffect(() => {
    const q = query(collection(db, 'activityLogs'), orderBy('timestamp', 'desc'), limit(5));
    const unsubscribe = onSnapshot(q, (snap) => {
      setActivityLogs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    
    // Get total demo visitors
    const qVisitors = query(collection(db, 'activityLogs'), where('role', '==', 'demo'));
    const unsubVisitors = onSnapshot(qVisitors, (snap) => {
      setStats(prev => ({ ...prev, visitorCount: snap.size }));
    });

    return () => {
      unsubscribe();
      unsubVisitors();
    };
  }, []);

  useEffect(() => {
    const todayBills = bills.filter(b => {
      if (!b.createdAt) return false;
      const billDate = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
      return b.status === 'active' && isToday(billDate);
    });
    const todaySales = todayBills.reduce((acc, b) => acc + (b.grandTotal || 0), 0);
    const lowStock = products.filter(p => p.currentQty <= p.minQty).length;
    const pendingUdhaar = customers.reduce((acc, c) => acc + (c.balance || 0), 0);

    setStats(prev => ({ ...prev, todaySales, todayBills: todayBills.length, lowStock, pendingUdhaar }));

    const last30Days = [...Array(30)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      const fullDateStr = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
      const dayTotal = bills
        .filter(b => {
          const bDate = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
          return b.status === 'active' && bDate.toDateString() === d.toDateString();
        })
        .reduce((acc, b) => acc + (b.grandTotal || 0), 0);
      return { name: dateStr, fullDate: fullDateStr, revenue: dayTotal };
    }).reverse();

    setChartData(last30Days);
  }, [bills, products, customers]);

  return (
    <div className="space-y-[1.2rem] pb-12 animate-page-entrance">
      
      {/* SECTION 4 - EXECUTIVE FISCAL METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-[1.2rem]">
        <div style={{ animation: 'cardEntrance 0.5s ease-out 0.08s both' }}>
          <StatCard 
            title="CUMULATIVE REVENUE" 
            value={bills.reduce((acc, b) => acc + (b.grandTotal || 0), 0)} 
            isCurrency={true}
            icon={TrendingUp} 
            color="orange"
            subValue="Lifetime Fiscal Performance"
            onClick={() => navigate('/reports')}
          />
        </div>
        <div style={{ animation: 'cardEntrance 0.5s ease-out 0.16s both' }}>
          <StatCard 
            title="DAILY CAPTURE" 
            value={stats.todaySales} 
            isCurrency={true}
            icon={BarChart3} 
            color="green"
            subValue="Intraday Revenue Stream"
            onClick={() => navigate('/bills')}
          />
        </div>
        <div style={{ animation: 'cardEntrance 0.5s ease-out 0.24s both' }}>
          <StatCard 
            title="OUTSTANDING EXPOSURE" 
            value={stats.pendingUdhaar} 
            isCurrency={true}
            icon={Users} 
            color="blue"
            subValue="Active Credit Liabilities"
            onClick={() => navigate('/customers')}
          />
        </div>
        <div style={{ animation: 'cardEntrance 0.5s ease-out 0.32s both' }}>
          <StatCard 
            title="ASSET INVENTORY" 
            value={products.length} 
            icon={Package} 
            color="purple"
            subValue="Stock Unit Registry"
            onClick={() => navigate('/inventory')}
          />
        </div>
      </div>

      {/* Analytics Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-[1.2rem] pt-4" style={{ animation: 'cardEntrance 0.5s ease-out 0.4s both' }}>
        <div className="xl:col-span-3 p-[1.6rem] rounded-[16px] bg-[#0D1220] border border-white/[0.07] flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-[10px] bg-[#FF6A00]/10 text-[#FF6A00]"><BarChart3 size={20} /></div>
              <div>
                {/* SECTION 4 - REVENUE INTELLIGENCE heading */}
                <h3 className="font-heading font-[700] text-[0.95rem] uppercase text-white">REVENUE INTELLIGENCE</h3>
                <p className="font-body italic font-[400] text-[0.68rem] text-white/[0.36] mt-0.5">GROWTH TRAJECTORIES</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="relative flex w-1.5 h-1.5">
                <span className="animate-dot-ripple absolute inline-flex h-full w-full rounded-full bg-[#FF6A00] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#FF6A00] animate-dot-pulse"></span>
              </span>
              <span className="font-body font-[600] text-[0.65rem] uppercase tracking-[0.1em] text-[#FF6A00]">LIVE DATA SYNC</span>
            </div>
          </div>
          
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FF6A00" stopOpacity={1}/>
                    <stop offset="100%" stopColor="#CC5500" stopOpacity={0.8}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255, 255, 255, 0.08)" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontFamily: 'Inter', fontSize: '0.65rem', fontWeight: 400, fill: 'rgba(255, 255, 255, 0.35)' }} 
                  dy={6}
                  interval={1}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tickFormatter={(val) => `₹${val/1000}k`} 
                  tick={{ fontFamily: 'Inter', fontSize: '0.65rem', fontWeight: 400, fill: 'rgba(255, 255, 255, 0.35)' }} 
                  dx={-10} 
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }}
                  contentStyle={{ 
                    backgroundColor: '#080C14', 
                    borderRadius: '12px', 
                    border: '1px solid rgba(255,106,0,0.2)', 
                    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                    padding: '16px'
                  }}
                  itemStyle={{ fontSize: '14px', fontWeight: '800', fontFamily: 'Barlow Condensed', textTransform: 'uppercase', color: '#FF6A00' }}
                  labelStyle={{ fontSize: '10px', fontWeight: '700', color: '#FF6A00', marginBottom: '8px', letterSpacing: '0.1em', textTransform: 'uppercase' }}
                  formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Revenue']}
                  labelFormatter={(label, payload) => payload && payload.length > 0 ? payload[0].payload.fullDate : label}
                />
                <Bar dataKey="revenue" fill="url(#colorRevBar)" activeBar={{ fill: '#FF8C38' }} radius={[4, 4, 0, 0]} maxBarSize={48} isAnimationActive={true} className="animate-bar-grow" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-[1.2rem] pt-4">
        <div className="lg:col-span-2 space-y-6" style={{ animation: 'cardEntrance 0.5s ease-out 0.48s both' }}>
          <div className="flex items-center justify-between px-1">
            <h3 className="admin-heading">Recent Ledger Logs</h3>
            <button onClick={() => navigate('/bills')} className="text-[0.7rem] font-bold uppercase tracking-[0.14em] text-[#FF6A00] hover:text-[#FF8C38] transition-colors flex items-center gap-2 group">
              Terminal Archives <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
          
          <div className="rounded-[16px] bg-[#0D1220] border border-white/[0.07] overflow-hidden">
            <div className="w-full overflow-x-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/[0.03]">
                    <th className="font-body font-[600] text-[0.65rem] text-white/[0.36] uppercase tracking-[0.14em] p-[0.7rem_1rem] rounded-tl-[10px]">LOG ID</th>
                    <th className="font-body font-[600] text-[0.65rem] text-white/[0.36] uppercase tracking-[0.14em] p-[0.7rem_1rem]">ENTITY</th>
                    <th className="font-body font-[600] text-[0.65rem] text-white/[0.36] uppercase tracking-[0.14em] p-[0.7rem_1rem] text-right">VALUE</th>
                    <th className="font-body font-[600] text-[0.65rem] text-white/[0.36] uppercase tracking-[0.14em] p-[0.7rem_1rem] text-center rounded-tr-[10px]">PROTOCOL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {bills.slice(0, 5).map((bill, i) => (
                    <tr key={bill.id} className="hover:bg-white/[0.03] transition-colors duration-200" style={{ animation: `rowEntrance 0.3s ease-out ${0.5 + (i*0.04)}s both` }}>
                      <td className="p-[0.8rem_1rem] border-b border-white/[0.05]">
                        <span className="font-body font-[700] text-[0.875rem] text-white whitespace-nowrap">#{bill.billNo.toString().trim()}</span>
                      </td>
                      <td className="p-[0.8rem_1rem] border-b border-white/[0.05]">
                        <div className="font-body font-[600] text-[0.875rem] text-white uppercase truncate max-w-[120px]">{bill.customerName}</div>
                      </td>
                      <td className="p-[0.8rem_1rem] border-b border-white/[0.05] text-right">
                        <span className="font-heading font-[700] text-[0.95rem] text-[#FF6A00] whitespace-nowrap">
                          <AnimatedNumber value={bill.grandTotal} prefix="₹" />
                        </span>
                      </td>
                      <td className="p-[0.8rem_1rem] border-b border-white/[0.05] text-center">
                        <Badge variant={bill.status === 'active' ? 'green' : 'red'} className="font-body font-[700] text-[0.62rem] uppercase tracking-[0.08em]">{bill.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6" style={{ animation: 'cardEntrance 0.5s ease-out 0.56s both' }}>
          <div className="flex items-center justify-between px-1">
            <h3 className="admin-heading">Recent Access Sync</h3>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-[0.6rem] font-black text-white/20 uppercase tracking-widest">Live Audit</span>
            </div>
          </div>
          
          <div className="space-y-3">
            {activityLogs.map((log, i) => {
              const isAdmin = log.role === 'admin' || log.role === 'superadmin';
              return (
                <div 
                  key={log.id} 
                  className={`p-4 rounded-xl bg-[#0D1220] border ${log.action === 'LOGIN' ? 'border-green-500/10' : 'border-red-500/10'} hover:border-white/10 transition-all flex items-center justify-between group`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isAdmin ? 'bg-blue-400/10 text-blue-400' : 'bg-[#FF6A00]/10 text-[#FF6A00]'}`}>
                      {isAdmin ? <Shield size={16} /> : <Eye size={16} />}
                    </div>
                    <div>
                      <p className="text-[0.8rem] font-bold text-white uppercase leading-none mb-1">{log.userName}</p>
                      <p className="text-[0.65rem] text-white/20 uppercase tracking-widest font-black">{log.role} · {log.action}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[0.7rem] font-bold text-white/40">{log.timestamp ? format(log.timestamp.toDate(), 'hh:mm a') : 'Now'}</p>
                    <p className="text-[0.6rem] text-white/20 uppercase tracking-tighter">Authorized</p>
                  </div>
                </div>
              );
            })}
            <button 
              onClick={() => navigate('/settings')}
              className="w-full py-3 border border-dashed border-white/10 rounded-xl text-[0.65rem] font-bold uppercase tracking-widest text-white/20 hover:text-[#FF6A00] hover:border-[#FF6A00]/30 transition-all"
            >
              View All Logs
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
