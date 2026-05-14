import React, { useState, useEffect } from 'react';
import { useBills } from '../hooks/useBills';
import { useProducts } from '../hooks/useProducts';
import { useCustomers } from '../hooks/useCustomers';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { isToday, eachDayOfInterval, subDays } from 'date-fns';
import { formatCurrency } from '../utils/formatters';
import { TrendingUp, DollarSign, Users, Package, BarChart3 } from 'lucide-react';
import { CountUp } from '../components/ui/StatCard';

const Reports = () => {
  const [activeTab, setActiveTab] = useState('summary');
  const { bills } = useBills();
  const { products } = useProducts();
  const { customers } = useCustomers();
  
  const [monthlyData, setMonthlyData] = useState([]);
  const [topProductsData, setTopProductsData] = useState([]);
  const [top10ProductsData, setTop10ProductsData] = useState([]);
  const [topCustomersData, setTopCustomersData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isChanging, setIsChanging] = useState(false);

  useEffect(() => {
    const calculateReports = () => {
      setLoading(true);

      // Generate last 30 days data
      const last30Days = eachDayOfInterval({
        start: subDays(new Date(), 29),
        end: new Date()
      }).map(date => ({
        date: date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
        fullDate: date.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }),
        dateObj: date,
        revenue: 0 
      }));

      const productMap = {};
      const customerMap = {};
      const thirtyDaysAgo = subDays(new Date(), 30);
      thirtyDaysAgo.setHours(0,0,0,0);

      bills.forEach(b => {
        if (b.status !== 'active' || !b.createdAt) return;
        
        if (b.customerName) {
          if (!customerMap[b.customerName]) {
            customerMap[b.customerName] = { name: b.customerName, totalSpent: 0 };
          }
          customerMap[b.customerName].totalSpent += (b.grandTotal || 0);
        }

        const bDate = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
        
        if (bDate >= thirtyDaysAgo) {
          const dateStr = bDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
          const dayIndex = last30Days.findIndex(d => d.date === dateStr);
          if (dayIndex !== -1) {
            last30Days[dayIndex].revenue += (b.grandTotal || 0);
          }

          b.items.forEach(item => {
            if (!productMap[item.productName]) {
              productMap[item.productName] = { name: item.productName, qty: 0, revenue: 0 };
            }
            productMap[item.productName].qty += item.quantity;
            productMap[item.productName].revenue += item.itemTotal;
          });
        }
      });
      
      setMonthlyData(last30Days);
      const sortedProducts = Object.values(productMap).sort((a, b) => b.revenue - a.revenue);
      setTopProductsData(sortedProducts.slice(0, 5));
      setTop10ProductsData(sortedProducts.slice(0, 10));
      setTopCustomersData(Object.values(customerMap).sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 10));
      setLoading(false);
    };

    if (bills.length >= 0) calculateReports();
  }, [bills]);

  const handleTabChange = (tab) => {
    setIsChanging(true);
    setTimeout(() => {
      setActiveTab(tab);
      setIsChanging(false);
    }, 150);
  };

  const summaryStats = [
    { label: 'Cumulative Revenue', value: bills.reduce((acc, b) => acc + (b.status === 'active' ? b.grandTotal : 0), 0), isCurrency: true, icon: DollarSign, color: '#FF6A00' },
    { label: 'Daily Capture', value: bills.filter(b => isToday(b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt))).reduce((acc, b) => acc + b.grandTotal, 0), isCurrency: true, icon: TrendingUp, color: '#10B981' },
    { label: 'Outstanding Exposure', value: customers.reduce((acc, c) => acc + (c.balance || 0), 0), isCurrency: true, icon: Users, color: '#3b82f6' },
    { label: 'Asset Inventory', value: products.length, isCurrency: false, icon: Package, color: '#8b5cf6' },
  ];

  const totalMonthlySales = monthlyData.reduce((acc, d) => acc + d.revenue, 0);
  const salesStats = [
    { label: 'Total Sales (30 Days)', value: totalMonthlySales, isCurrency: true, icon: DollarSign, color: '#FF6A00' },
    { label: 'Average Daily Sales', value: monthlyData.length ? totalMonthlySales / monthlyData.length : 0, isCurrency: true, icon: TrendingUp, color: '#10B981' },
    { label: 'Highest Single Day', value: Math.max(0, ...monthlyData.map(d => d.revenue)), isCurrency: true, icon: BarChart3, color: '#3b82f6' },
  ];

  const productStats = [
    { label: 'Most Sold Asset', value: top10ProductsData[0]?.name || 'N/A', isCurrency: false, isText: true, icon: Package, color: '#FF6A00' },
    { label: 'Units Dispatched (30d)', value: top10ProductsData.reduce((acc, d) => acc + d.qty, 0), isCurrency: false, icon: TrendingUp, color: '#10B981' },
    { label: 'Total Inventory Value', value: products.reduce((acc, p) => acc + (p.currentQty * p.sellingPrice), 0), isCurrency: true, icon: DollarSign, color: '#3b82f6' },
  ];

  const customerStats = [
    { label: 'Top Patron', value: topCustomersData[0]?.name || 'N/A', isCurrency: false, isText: true, icon: Users, color: '#FF6A00' },
    { label: 'Active Networks', value: customers.length, isCurrency: false, icon: TrendingUp, color: '#10B981' },
    { label: 'Total Outstanding', value: customers.reduce((acc, c) => acc + (c.balance || 0), 0), isCurrency: true, icon: DollarSign, color: '#3b82f6' },
  ];

  if (loading) return <div className="p-8 text-white/50 font-black uppercase tracking-widest text-[0.7rem] animate-pulse">Processing Intelligence...</div>;

  return (
    <div className="space-y-10 pb-16">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 animate-page-entrance">
        <div>
          <h2 className="font-heading font-[800] text-[1.6rem] text-white uppercase">Financial Intelligence</h2>
          <p className="font-body italic font-[400] text-[0.75rem] text-white/40 mt-1 sentence-case first-letter:uppercase">Analytical performance and market metrics</p>
        </div>
      </div>

      <div className="flex gap-2 p-1.5 bg-[#0D1220] border border-white/[0.05] rounded-2xl w-fit animate-dropdown-entrance">
        {['summary', 'sales', 'products', 'customers'].map(tab => (
          <button
            key={tab}
            onClick={() => handleTabChange(tab)}
            className={`px-8 py-3 rounded-xl font-body font-[700] text-[0.75rem] uppercase tracking-[0.12em] transition-all duration-300 ${
              activeTab === tab ? 'bg-[#FF6A00] text-white shadow-lg shadow-[#FF6A0033]' : 'text-white/30 hover:text-white/60 hover:bg-white/5'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className={`transition-all duration-250 ${isChanging ? 'opacity-0 translate-y-2' : 'animate-tab-in opacity-100 translate-y-0'}`}>
        {activeTab === 'summary' && (
          <div className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {summaryStats.map((stat, i) => (
                <div key={i} className="p-8 rounded-[24px] bg-[#0D1220] border border-white/[0.05] flex items-center gap-6 animate-card-entrance" style={{ animationDelay: `${i * 0.08}s` }}>
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${stat.color}15`, color: stat.color }}>
                    <stat.icon size={28} />
                  </div>
                  <div>
                    <p className="font-body font-[600] text-[0.62rem] text-white/40 uppercase tracking-[0.16em]">{stat.label}</p>
                    <h4 className="font-heading font-[700] text-[1.5rem] text-white mt-1 leading-none">
                      <CountUp end={stat.value} prefix={stat.isCurrency ? '₹' : ''} />
                    </h4>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div className="p-10 rounded-[32px] bg-[#0D1220] border border-white/[0.05] animate-card-entrance" style={{ animationDelay: '0.4s' }}>
                <div className="flex items-center gap-3 mb-10">
                  <BarChart3 className="text-[#FF6A00]" size={20} />
                  <h3 className="text-[0.9rem] font-black text-white uppercase tracking-[0.15em]">Daily Revenue Protocol</h3>
                </div>
                <div className="h-[320px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData}>
                      <defs>
                        <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#FF6A00" stopOpacity={1} />
                          <stop offset="100%" stopColor="#FF6A00" stopOpacity={0.2} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontFamily: 'Inter', fontSize: '0.65rem', fontWeight: 400, fill: 'rgba(255, 255, 255, 0.35)'}} dy={6} minTickGap={20} />
                      <YAxis axisLine={false} tickLine={false} tick={{fontFamily: 'Inter', fontSize: '0.65rem', fontWeight: 400, fill: 'rgba(255, 255, 255, 0.35)'}} tickFormatter={(val) => `₹${val/1000}k`} />
                      <Tooltip 
                        cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }}
                        contentStyle={{ backgroundColor: '#0D1220', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '16px' }}
                        itemStyle={{ color: '#FF6A00', fontWeight: 900, fontSize: '14px', fontFamily: 'Barlow Condensed', textTransform: 'uppercase' }}
                        labelStyle={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontWeight: 800, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                        formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Revenue']}
                        labelFormatter={(label, payload) => payload && payload.length > 0 ? payload[0].payload.fullDate : label}
                      />
                      <Bar dataKey="revenue" fill="url(#revGradient)" activeBar={{ fill: '#FF8C38' }} radius={[6, 6, 0, 0]} barSize={12} isAnimationActive={true} className="animate-bar-grow" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="p-10 rounded-[32px] bg-[#0D1220] border border-white/[0.05] animate-card-entrance" style={{ animationDelay: '0.5s' }}>
                <div className="flex items-center gap-3 mb-10">
                  <Package className="text-[#FF6A00]" size={20} />
                  <h3 className="text-[0.9rem] font-black text-white uppercase tracking-[0.15em]">High Performance Assets</h3>
                </div>
                <div className="space-y-6">
                  {topProductsData.map((prod, i) => (
                    <div key={i} className="flex items-center justify-between p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all group">
                      <div className="flex items-center gap-5">
                        <span className="text-[1.2rem] font-heading font-black text-white/10 group-hover:text-[#FF6A00]/20 transition-colors">0{i+1}</span>
                        <div>
                          <p className="font-black text-white text-[0.85rem] uppercase group-hover:text-[#FF6A00] transition-colors">{prod.name}</p>
                          <p className="text-[0.65rem] font-black text-white/30 uppercase tracking-widest mt-0.5">{prod.qty} Units Dispatched</p>
                        </div>
                      </div>
                      <p className="font-black text-white text-[0.9rem]">₹{prod.revenue.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'sales' && (
          <div className="space-y-10">
            <div className="p-10 rounded-[32px] bg-[#0D1220] border border-white/[0.05] animate-card-entrance overflow-hidden">
              <div className="flex items-center gap-3 mb-10">
                <BarChart3 className="text-[#FF6A00]" size={20} />
                <h3 className="text-[0.9rem] font-black text-white uppercase tracking-[0.15em]">Daily Sales Revenue — Last 30 Days</h3>
              </div>
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <defs>
                      <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#FF6A00" stopOpacity={1} />
                        <stop offset="100%" stopColor="#FF6A00" stopOpacity={0.2} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontFamily: 'Inter', fontSize: '0.65rem', fontWeight: 400, fill: 'rgba(255, 255, 255, 0.35)'}} dy={6} minTickGap={20} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontFamily: 'Inter', fontSize: '0.65rem', fontWeight: 400, fill: 'rgba(255, 255, 255, 0.35)'}} tickFormatter={(val) => `₹${val/1000}k`} />
                    <Tooltip cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }} contentStyle={{ backgroundColor: '#0D1220', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '16px' }} itemStyle={{ color: '#FF6A00', fontWeight: 900, fontSize: '14px', fontFamily: 'Barlow Condensed', textTransform: 'uppercase' }} labelStyle={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontWeight: 800, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.1em' }} formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Revenue']} labelFormatter={(label, payload) => payload && payload.length > 0 ? payload[0].payload.fullDate : label} />
                    <Bar dataKey="revenue" fill="url(#salesGradient)" activeBar={{ fill: '#FF8C38' }} radius={[6, 6, 0, 0]} barSize={24} isAnimationActive={true} className="animate-bar-grow" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {salesStats.map((stat, i) => (
                <div key={i} className="p-8 rounded-[24px] bg-[#0D1220] border border-white/[0.05] flex items-center gap-6 animate-card-entrance" style={{ animationDelay: `${i * 0.08}s` }}>
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${stat.color}15`, color: stat.color }}><stat.icon size={28} /></div>
                  <div className="overflow-hidden">
                    <p className="font-body font-[600] text-[0.62rem] text-white/40 uppercase tracking-[0.16em]">{stat.label}</p>
                    <h4 className="font-heading font-[700] text-[1.5rem] text-white mt-1 leading-none truncate">
                      {stat.isText ? stat.value : <CountUp end={stat.value} prefix={stat.isCurrency ? '₹' : ''} />}
                    </h4>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'products' && (
          <div className="space-y-10">
            <div className="p-10 rounded-[32px] bg-[#0D1220] border border-white/[0.05] animate-card-entrance overflow-hidden">
              <div className="flex items-center gap-3 mb-10">
                <Package className="text-[#FF6A00]" size={20} />
                <h3 className="text-[0.9rem] font-black text-white uppercase tracking-[0.15em]">Top Products by Revenue</h3>
              </div>
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={top10ProductsData}>
                    <defs>
                      <linearGradient id="prodGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity={1} />
                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.2} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontFamily: 'Inter', fontSize: '0.65rem', fontWeight: 400, fill: 'rgba(255, 255, 255, 0.35)'}} dy={6} minTickGap={20} tickFormatter={(val) => val.length > 15 ? val.substring(0, 15) + '...' : val} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontFamily: 'Inter', fontSize: '0.65rem', fontWeight: 400, fill: 'rgba(255, 255, 255, 0.35)'}} tickFormatter={(val) => `₹${val/1000}k`} />
                    <Tooltip cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }} contentStyle={{ backgroundColor: '#0D1220', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '16px' }} itemStyle={{ color: '#8b5cf6', fontWeight: 900, fontSize: '14px', fontFamily: 'Barlow Condensed', textTransform: 'uppercase' }} labelStyle={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontWeight: 800, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.1em' }} formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Revenue']} />
                    <Bar dataKey="revenue" fill="url(#prodGradient)" activeBar={{ fill: '#a78bfa' }} radius={[6, 6, 0, 0]} barSize={32} isAnimationActive={true} className="animate-bar-grow" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {productStats.map((stat, i) => (
                <div key={i} className="p-8 rounded-[24px] bg-[#0D1220] border border-white/[0.05] flex items-center gap-6 animate-card-entrance" style={{ animationDelay: `${i * 0.08}s` }}>
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${stat.color}15`, color: stat.color }}><stat.icon size={28} /></div>
                  <div className="overflow-hidden">
                    <p className="font-body font-[600] text-[0.62rem] text-white/40 uppercase tracking-[0.16em]">{stat.label}</p>
                    <h4 className="font-heading font-[700] text-[1.5rem] text-white mt-1 leading-none truncate">
                      {stat.isText ? stat.value : <CountUp end={stat.value} prefix={stat.isCurrency ? '₹' : ''} />}
                    </h4>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'customers' && (
          <div className="space-y-10">
            <div className="p-10 rounded-[32px] bg-[#0D1220] border border-white/[0.05] animate-card-entrance overflow-hidden">
              <div className="flex items-center gap-3 mb-10">
                <Users className="text-[#3b82f6]" size={20} />
                <h3 className="text-[0.9rem] font-black text-white uppercase tracking-[0.15em]">Top Patrons by Revenue</h3>
              </div>
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topCustomersData}>
                    <defs>
                      <linearGradient id="custGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.2} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontFamily: 'Inter', fontSize: '0.65rem', fontWeight: 400, fill: 'rgba(255, 255, 255, 0.35)'}} dy={6} minTickGap={20} tickFormatter={(val) => val.length > 15 ? val.substring(0, 15) + '...' : val} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontFamily: 'Inter', fontSize: '0.65rem', fontWeight: 400, fill: 'rgba(255, 255, 255, 0.35)'}} tickFormatter={(val) => `₹${val/1000}k`} />
                    <Tooltip cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }} contentStyle={{ backgroundColor: '#0D1220', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '16px' }} itemStyle={{ color: '#3b82f6', fontWeight: 900, fontSize: '14px', fontFamily: 'Barlow Condensed', textTransform: 'uppercase' }} labelStyle={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontWeight: 800, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.1em' }} formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Revenue']} />
                    <Bar dataKey="totalSpent" fill="url(#custGradient)" activeBar={{ fill: '#60a5fa' }} radius={[6, 6, 0, 0]} barSize={32} isAnimationActive={true} className="animate-bar-grow" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {customerStats.map((stat, i) => (
                <div key={i} className="p-8 rounded-[24px] bg-[#0D1220] border border-white/[0.05] flex items-center gap-6 animate-card-entrance" style={{ animationDelay: `${i * 0.08}s` }}>
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${stat.color}15`, color: stat.color }}><stat.icon size={28} /></div>
                  <div className="overflow-hidden">
                    <p className="font-body font-[600] text-[0.62rem] text-white/40 uppercase tracking-[0.16em]">{stat.label}</p>
                    <h4 className="font-heading font-[700] text-[1.5rem] text-white mt-1 leading-none truncate">
                      {stat.isText ? stat.value : <CountUp end={stat.value} prefix={stat.isCurrency ? '₹' : ''} />}
                    </h4>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
