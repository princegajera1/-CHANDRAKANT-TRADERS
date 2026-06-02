import React, { useState, useEffect, useRef } from 'react';
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
import gsap from 'gsap';

const Dashboard = () => {
  const navigate = useNavigate();
  const { bills } = useBills();
  const { products } = useProducts();
  const { customers } = useCustomers();

  const [stats, setStats] = useState({ todaySales: 0, todayBills: 0, lowStock: 0, pendingUdhaar: 0, visitorCount: 0 });
  const [chartData, setChartData] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  
  const pageRef = useRef(null);

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
    
    const now = new Date();
    const currentMonthBills = bills.filter(b => {
      if (!b.createdAt) return false;
      const billDate = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
      return b.status === 'active' && billDate.getMonth() === now.getMonth() && billDate.getFullYear() === now.getFullYear();
    });
    const thisMonthSales = currentMonthBills.reduce((acc, b) => acc + (b.grandTotal || 0), 0);

    const lowStock = products.filter(p => p.currentQty <= (p.minQty || 5)).length;
    const pendingUdhaar = customers.reduce((acc, c) => acc + (c.balance || 0), 0);

    setStats(prev => ({ 
      ...prev, 
      todaySales, 
      todayBills: todayBills.length, 
      thisMonthSales,
      thisMonthBills: currentMonthBills.length,
      lowStock, 
      pendingUdhaar 
    }));

    // Generate last 6 months comparative sales
    const last6Months = [...Array(6)].map((_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthStr = d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
      const fullMonthStr = d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
      const monthTotal = bills
         .filter(b => {
           if (!b.createdAt) return false;
           const bDate = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
           return b.status === 'active' && bDate.getMonth() === d.getMonth() && bDate.getFullYear() === d.getFullYear();
         })
         .reduce((acc, b) => acc + (b.grandTotal || 0), 0);
      return { name: monthStr, fullDate: fullMonthStr, revenue: monthTotal };
    }).reverse();

    setChartData(last6Months);
  }, [bills, products, customers]);

  // GSAP Entrance Timeline Stagger
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      // Stagger stats cards
      tl.fromTo('.stat-card-item', 
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, stagger: 0.08, duration: 0.7 }
      );

      // Slide up chart
      tl.fromTo('.analytics-block',
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.6 },
        '-=0.4'
      );

      // Stagger tables and sync lists
      tl.fromTo('.grid-item-block',
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, stagger: 0.1, duration: 0.6 },
        '-=0.3'
      );

      // Stagger table row rows
      tl.fromTo('.row-item-stagger',
        { opacity: 0, x: -10 },
        { opacity: 1, x: 0, stagger: 0.05, duration: 0.5 },
        '-=0.2'
      );
    }, pageRef);

    return () => ctx.revert();
  }, [bills, products, customers]);

  return (
    <div ref={pageRef} className="space-y-[1.5rem] pb-12 opacity-1">
      
      {/* SECTION 4 - EXECUTIVE FISCAL METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-[1.2rem]">
        <div className="stat-card-item opacity-0">
          <StatCard 
            title="TODAY'S CAPTURE" 
            value={stats.todaySales} 
            isCurrency={true}
            icon={TrendingUp} 
            color="cyan"
            subValue={`${stats.todayBills || 0} Invoice Logs Today`}
            onClick={() => navigate('/bills')}
          />
        </div>
        <div className="stat-card-item opacity-0">
          <StatCard 
            title="MONTHLY SECURED" 
            value={stats.thisMonthSales || 0} 
            isCurrency={true}
            icon={BarChart3} 
            color="green"
            subValue={`${stats.thisMonthBills || 0} Invoice Logs This Month`}
            onClick={() => navigate('/reports')}
          />
        </div>
        <div className="stat-card-item opacity-0">
          <StatCard 
            title="OUTSTANDING EXPOSURE" 
            value={stats.pendingUdhaar} 
            isCurrency={true}
            icon={Users} 
            color="gold"
            subValue="Active Credit Liabilities"
            onClick={() => navigate('/customers')}
          />
        </div>
        <div className="stat-card-item opacity-0">
          <StatCard 
            title="ASSET INVENTORY" 
            value={products.length} 
            icon={Package} 
            color="cyan"
            subValue={`${stats.lowStock || 0} Low Stock Alert Items`}
            onClick={() => navigate('/inventory')}
          />
        </div>
      </div>

      {/* Analytics Section */}
      <div className="analytics-block opacity-0 grid grid-cols-1 xl:grid-cols-3 gap-[1.2rem] pt-2">
        <div className="xl:col-span-3 p-[1.6rem] rounded-[16px] bg-[#0D1B2A]/90 border border-[#1E2D3D] flex flex-col gap-6 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-[10px] bg-[#00D4FF]/10 text-[#00D4FF]"><BarChart3 size={20} /></div>
              <div>
                <h3 className="font-heading font-[700] text-[0.95rem] uppercase text-white tracking-wider">REVENUE INTELLIGENCE</h3>
                <p className="font-body italic font-[400] text-[0.68rem] text-[#8899A6] mt-0.5">GROWTH TRAJECTORIES</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="relative flex w-1.5 h-1.5">
                <span className="animate-dot-ripple absolute inline-flex h-full w-full rounded-full bg-[#00D4FF] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#00D4FF] animate-dot-pulse"></span>
              </span>
              <span className="font-body font-[600] text-[0.65rem] uppercase tracking-[0.1em] text-[#00D4FF]">LIVE DATA SYNC</span>
            </div>
          </div>
          
          <div className="h-[320px] w-full font-mono text-[0.65rem]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00D4FF" stopOpacity={0.8}/>
                    <stop offset="100%" stopColor="#00D4FF" stopOpacity={0.15}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255, 255, 255, 0.05)" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontFamily: 'DM Sans', fontSize: '0.65rem', fontWeight: 500, fill: '#8899A6' }} 
                  dy={6}
                  interval={1}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tickFormatter={(val) => `₹${val/1000}k`} 
                  tick={{ fontFamily: 'DM Sans', fontSize: '0.65rem', fontWeight: 500, fill: '#8899A6' }} 
                  dx={-10} 
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(255, 255, 255, 0.02)' }}
                  contentStyle={{ 
                    backgroundColor: '#0D1B2A', 
                    borderRadius: '12px', 
                    border: '1px solid #1E2D3D', 
                    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                    padding: '16px'
                  }}
                  itemStyle={{ fontSize: '12px', fontWeight: '700', fontFamily: 'Space Grotesk', textTransform: 'uppercase', color: '#00D4FF' }}
                  labelStyle={{ fontSize: '10px', fontWeight: '700', color: '#8899A6', marginBottom: '8px', letterSpacing: '0.1em', textTransform: 'uppercase' }}
                  formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Revenue']}
                  labelFormatter={(label, payload) => payload && payload.length > 0 ? payload[0].payload.fullDate : label}
                />
                <Bar dataKey="revenue" fill="url(#colorRevBar)" activeBar={{ fill: '#00E676' }} radius={[4, 4, 0, 0]} maxBarSize={40} isAnimationActive={true} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-[1.2rem] pt-2">
        <div className="grid-item-block opacity-0 lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-1">
            <h3 className="admin-heading text-white">Recent Ledger Logs</h3>
            <button onClick={() => navigate('/bills')} className="text-[0.7rem] font-bold uppercase tracking-[0.14em] text-[#00D4FF] hover:text-white transition-colors flex items-center gap-2 group">
              Terminal Archives <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
          
          <div className="rounded-[16px] bg-[#0D1B2A]/90 border border-[#1E2D3D] overflow-hidden backdrop-blur-md">
            <div className="w-full overflow-x-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/[0.02]">
                    <th className="font-body font-[600] text-[0.65rem] text-[#8899A6] uppercase tracking-[0.14em] p-[0.7rem_1rem] rounded-tl-[10px]">BILL NO</th>
                    <th className="font-body font-[600] text-[0.65rem] text-[#8899A6] uppercase tracking-[0.14em] p-[0.7rem_1rem]">CUSTOMER</th>
                    <th className="font-body font-[600] text-[0.65rem] text-[#8899A6] uppercase tracking-[0.14em] p-[0.7rem_1rem] text-center">DATE</th>
                    <th className="font-body font-[600] text-[0.65rem] text-[#8899A6] uppercase tracking-[0.14em] p-[0.7rem_1rem] text-right">AMOUNT</th>
                    <th className="font-body font-[600] text-[0.65rem] text-[#8899A6] uppercase tracking-[0.14em] p-[0.7rem_1rem] text-center rounded-tr-[10px]">MODE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03]">
                  {bills.slice(0, 5).map((bill, i) => {
                    const billDate = bill.createdAt?.toDate ? bill.createdAt.toDate() : new Date(bill.createdAt);
                    const formattedDate = isNaN(billDate.getTime()) ? '-' : billDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
                    return (
                      <tr key={bill.id} className="row-item-stagger opacity-0 hover:bg-white/[0.02] transition-colors duration-200">
                        <td className="p-[0.8rem_1rem] border-b border-[#1E2D3D]">
                          <span className="font-mono font-[700] text-[0.875rem] text-white whitespace-nowrap">#{bill.billNo}</span>
                        </td>
                        <td className="p-[0.8rem_1rem] border-b border-[#1E2D3D]">
                          <div className="font-body font-[600] text-[0.875rem] text-white uppercase truncate max-w-[150px]">{bill.customerName}</div>
                        </td>
                        <td className="p-[0.8rem_1rem] border-b border-[#1E2D3D] text-center">
                          <span className="font-mono font-[400] text-[0.8rem] text-white/60">{formattedDate}</span>
                        </td>
                        <td className="p-[0.8rem_1rem] border-b border-[#1E2D3D] text-right">
                          <span className="font-mono font-[700] text-[0.95rem] text-[#00D4FF] whitespace-nowrap">
                            ₹{bill.grandTotal.toLocaleString()}
                          </span>
                        </td>
                        <td className="p-[0.8rem_1rem] border-b border-[#1E2D3D] text-center">
                          <span className={`px-2.5 py-1 rounded text-[0.6rem] font-bold uppercase tracking-wider ${bill.paymentMode === 'Credit' ? 'bg-orange-500/10 text-orange-400' : 'bg-green-500/10 text-green-400'}`}>
                            {bill.paymentMode}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="grid-item-block opacity-0 space-y-6">
          <div className="flex items-center justify-between px-1">
            <h3 className="admin-heading text-white">Recent Access Sync</h3>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00E676] animate-pulse"></span>
              <span className="text-[0.6rem] font-black text-white/20 uppercase tracking-widest">Live Audit</span>
            </div>
          </div>
          
          <div className="space-y-3">
            {activityLogs.map((log, i) => {
              const isAdmin = log.role === 'admin' || log.role === 'superadmin';
              return (
                <div 
                  key={log.id} 
                  className={`row-item-stagger opacity-0 p-4 rounded-xl bg-[#0D1B2A]/90 border ${log.action === 'LOGIN' ? 'border-[#00E676]/10' : 'border-[#FF3D57]/10'} hover:border-[#00D4FF]/30 transition-all flex items-center justify-between group backdrop-blur-md`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isAdmin ? 'bg-blue-400/10 text-blue-400' : 'bg-[#00D4FF]/10 text-[#00D4FF]'}`}>
                      {isAdmin ? <Shield size={16} /> : <Eye size={16} />}
                    </div>
                    <div>
                      <p className="text-[0.8rem] font-bold text-white uppercase leading-none mb-1">{log.userName}</p>
                      <p className="text-[0.65rem] text-[#8899A6] uppercase tracking-widest font-black">{log.role} · {log.action}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[0.7rem] font-bold text-[#8899A6]">{log.timestamp ? format(log.timestamp.toDate(), 'hh:mm a') : 'Now'}</p>
                    <p className="text-[0.6rem] text-white/20 uppercase tracking-tighter">Authorized</p>
                  </div>
                </div>
              );
            })}
            <button 
              onClick={() => navigate('/settings')}
              className="row-item-stagger opacity-0 w-full py-3 border border-dashed border-[#1E2D3D] rounded-xl text-[0.65rem] font-bold uppercase tracking-widest text-[#8899A6]/40 hover:text-[#00D4FF] hover:border-[#00D4FF]/30 transition-all"
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
