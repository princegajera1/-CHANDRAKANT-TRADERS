import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBills } from '../hooks/useBills';
import { useProducts } from '../hooks/useProducts';
import { useCustomers } from '../hooks/useCustomers';
import { StatCard, Badge } from '../components/ui/StatCard';
import { AnimatedNumber } from '../components/ui/AnimatedNumber';
import { isToday } from '../utils/formatters';
import { TrendingUp, FileText, AlertTriangle, ArrowRight, Package, ShieldCheck, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  const navigate = useNavigate();
  const { bills } = useBills();
  const { products } = useProducts();
  const { customers } = useCustomers();

  const [stats, setStats] = useState({ todaySales: 0, todayBills: 0, lowStock: 0, pendingUdhaar: 0 });
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    const todayBills = bills.filter(b => {
      if (!b.createdAt) return false;
      const billDate = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
      return b.status === 'active' && isToday(billDate);
    });
    const todaySales = todayBills.reduce((acc, b) => acc + (b.grandTotal || 0), 0);
    const lowStock = products.filter(p => p.currentQty <= p.minQty).length;
    const pendingUdhaar = customers.reduce((acc, c) => acc + (c.balance || 0), 0);

    setStats({ todaySales, todayBills: todayBills.length, lowStock, pendingUdhaar });

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
      
      {/* SECTION 4 - DASHBOARD STAT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-[1.2rem]">
        <div style={{ animation: 'cardEntrance 0.5s ease-out 0.08s both' }}>
          <StatCard 
            title="DAILY REVENUE HUB" 
            value={stats.todaySales} 
            isCurrency={true}
            icon={TrendingUp} 
            color="green"
            subValue="Real-time revenue capture"
            onClick={() => navigate('/reports')}
          />
        </div>
        <div style={{ animation: 'cardEntrance 0.5s ease-out 0.16s both' }}>
          <StatCard 
            title="TERMINAL INVOICES" 
            value={stats.todayBills} 
            icon={FileText} 
            color="blue"
            subValue="Active transactions today"
            onClick={() => navigate('/bills')}
          />
        </div>
        <div style={{ animation: 'cardEntrance 0.5s ease-out 0.24s both' }}>
          <StatCard 
            title="RESTOCK REGISTRY" 
            value={stats.lowStock} 
            icon={AlertTriangle} 
            color={stats.lowStock > 0 ? 'red' : 'green'}
            subValue={stats.lowStock > 0 ? 'Urgent supply replenishment' : 'Supply lines optimized'}
            onClick={() => navigate('/inventory?filter=low-stock')}
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
            <div className="w-full overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-white/[0.03]">
                    <th className="font-body font-[600] text-[0.65rem] text-white/[0.36] uppercase tracking-[0.14em] p-[0.8rem_1.2rem] rounded-tl-[10px]">LOG ID</th>
                    <th className="font-body font-[600] text-[0.65rem] text-white/[0.36] uppercase tracking-[0.14em] p-[0.8rem_1.2rem]">ENTITY</th>
                    <th className="font-body font-[600] text-[0.65rem] text-white/[0.36] uppercase tracking-[0.14em] p-[0.8rem_1.2rem] text-right">VALUE</th>
                    <th className="font-body font-[600] text-[0.65rem] text-white/[0.36] uppercase tracking-[0.14em] p-[0.8rem_1.2rem] text-center rounded-tr-[10px]">PROTOCOL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {bills.slice(0, 5).map((bill, i) => (
                    <tr key={bill.id} className="hover:bg-white/[0.03] transition-colors duration-200" style={{ animation: `rowEntrance 0.3s ease-out ${0.5 + (i*0.04)}s both` }}>
                      <td className="p-[1rem_1.2rem] border-b border-white/[0.05]">
                        <span className="font-body font-[700] text-[0.875rem] text-white">#{bill.billNo}</span>
                      </td>
                      <td className="p-[1rem_1.2rem] border-b border-white/[0.05]">
                        <div className="font-body font-[600] text-[0.875rem] text-white uppercase">{bill.customerName}</div>
                        <div className="font-body italic font-[400] text-[0.75rem] text-white/[0.42] lowercase first-letter:uppercase mt-0.5">Terminal dispatch</div>
                      </td>
                      <td className="p-[1rem_1.2rem] border-b border-white/[0.05] text-right">
                        <span className="font-heading font-[700] text-[0.95rem] text-[#FF6A00]">
                          <AnimatedNumber value={bill.grandTotal} prefix="₹" />
                        </span>
                      </td>
                      <td className="p-[1rem_1.2rem] border-b border-white/[0.05] text-center">
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
          <h3 className="admin-heading px-1">Critical Alerts</h3>
          <div className="space-y-3">
            {products.filter(p => p.currentQty <= p.minQty).slice(0, 4).map((product, i) => (
              <div 
                key={product.id} 
                className="p-[1.4rem] rounded-[14px] bg-[#0D1220] border border-white/[0.07] hover:border-red-500/30 admin-card-hover cursor-pointer flex items-center justify-between group relative overflow-hidden" 
                onClick={() => navigate(`/inventory?edit=${product.id}`)}
                style={{ animation: `cardEntrance 0.3s ease-out ${0.6 + (i*0.08)}s both` }}
              >
                <div className="space-y-1 relative z-10">
                  <p className="text-[0.85rem] font-bold text-white uppercase tracking-wide">{product.name}</p>
                  <p className="text-[0.65rem] font-bold text-red-500 uppercase tracking-[0.15em]">Depleted: {product.currentQty} Units</p>
                </div>
                <div className="w-[36px] h-[36px] rounded-[10px] bg-red-500/10 text-red-500 flex items-center justify-center relative z-10 transition-transform group-hover:scale-110">
                  <AlertTriangle size={18} strokeWidth={2.5} />
                </div>
                <div className="absolute -right-4 -bottom-4 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity"><Package size={80} /></div>
              </div>
            ))}
            {stats.lowStock === 0 && (
              <div className="p-12 rounded-[16px] border border-dashed border-white/10 text-center space-y-3">
                <ShieldCheck size={40} strokeWidth={1} className="mx-auto text-white/20" />
                <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-white/30">Supply Lines Intact</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
