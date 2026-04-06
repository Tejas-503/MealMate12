import { useMemo, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { TrendingUp, Users, ShoppingBag, Calendar, DollarSign, CheckCircle2, BarChart3, Power } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  const { orders, bookings, isCanteenOpen, toggleCanteenStatus } = useAppStore();
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month'>('today');

  const now = new Date();
  
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const orderDate = new Date(o.createdAt);
      if (dateFilter === 'today') return orderDate.toDateString() === now.toDateString();
      if (dateFilter === 'week') return (now.getTime() - orderDate.getTime()) <= 7 * 24 * 60 * 60 * 1000;
      if (dateFilter === 'month') return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
      return true;
    });
  }, [orders, dateFilter, now]);

  const filteredBookings = useMemo(() => {
    return bookings.filter(b => b.status === 'active');
  }, [bookings]);

  const chartData = useMemo(() => {
    if (filteredOrders.length === 0) return [];
    
    // Sort orders chronologically to ensure the chart timeline goes from oldest to newest if they are on same day.
    const sortedOrders = [...filteredOrders].sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    
    const aggregated: Record<string, {name: string, revenue: number, orders: number}> = {};
    
    sortedOrders.forEach(o => {
      if (o.status === 'cancelled') return;
      const date = new Date(o.createdAt);
      let key = '';
      
      if (dateFilter === 'today') {
        key = `${date.getHours().toString().padStart(2, '0')}:00`;
      } else if (dateFilter === 'week') {
        key = date.toLocaleDateString('en-US', { weekday: 'short' });
      } else {
        key = `${date.getDate()} ${date.toLocaleDateString('en-US', { month: 'short' })}`;
      }
      
      if (!aggregated[key]) {
        aggregated[key] = { name: key, revenue: 0, orders: 0 };
      }
      aggregated[key].revenue += o.totalAmount;
      aggregated[key].orders += 1;
    });
    
    return Object.values(aggregated);
  }, [filteredOrders, dateFilter]);

  const totalRevenue = filteredOrders.reduce((acc, o) => acc + (o.status !== 'cancelled' ? o.totalAmount : 0), 0);
  const totalOrdersCount = filteredOrders.length;
  const completedOrders = filteredOrders.filter(o => o.status === 'completed').length;
  const activeBookingsCount = filteredBookings.length;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Staff Overview</h1>
          <p className="text-textMuted">Analytics and operational metrics.</p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <button 
             onClick={toggleCanteenStatus}
             className={`flex items-center gap-2 px-4 py-2 border rounded-xl font-bold transition-all shadow-lg ${
               isCanteenOpen 
                 ? 'bg-green-500/20 text-green-500 border-green-500/30 hover:bg-red-500/20 hover:text-red-600 hover:border-red-500/30' 
                 : 'bg-red-500/20 text-red-500 border-red-500/30 hover:bg-green-500/20 hover:text-green-500 hover:border-green-500/30'
             }`}
          >
             <Power size={18} />
             {isCanteenOpen ? 'Close Canteen' : 'Open Canteen'}
          </button>
          
          <div className="bg-surface border border-white/10 rounded-xl p-1 flex">
            <button 
              onClick={() => setDateFilter('today')} 
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${dateFilter === 'today' ? 'bg-primary text-white' : 'text-textMuted hover:text-white'}`}
            >
              Today
            </button>
            <button 
              onClick={() => setDateFilter('week')} 
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${dateFilter === 'week' ? 'bg-primary text-white' : 'text-textMuted hover:text-white'}`}
            >
              This Week
            </button>
            <button 
              onClick={() => setDateFilter('month')} 
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${dateFilter === 'month' ? 'bg-primary text-white' : 'text-textMuted hover:text-white'}`}
            >
              This Month
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
         <div className="glass-panel p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform"><DollarSign size={80} /></div>
            <div className="flex items-center gap-3 mb-4">
               <div className="w-10 h-10 rounded-xl bg-green-500/20 text-green-400 flex items-center justify-center"><TrendingUp size={20} /></div>
               <h3 className="text-textMuted font-medium">Total Revenue</h3>
            </div>
            <p className="text-3xl font-bold">₹{totalRevenue.toLocaleString()}</p>
         </div>

         <div className="glass-panel p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform"><ShoppingBag size={80} /></div>
            <div className="flex items-center gap-3 mb-4">
               <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center"><ShoppingBag size={20} /></div>
               <h3 className="text-textMuted font-medium">Total Orders</h3>
            </div>
            <p className="text-3xl font-bold">{totalOrdersCount}</p>
         </div>

         <div className="glass-panel p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform"><Users size={80} /></div>
            <div className="flex items-center gap-3 mb-4">
               <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center"><CheckCircle2 size={20} /></div>
               <h3 className="text-textMuted font-medium">Completed</h3>
            </div>
            <p className="text-3xl font-bold">{completedOrders}</p>
         </div>

         <div className="glass-panel p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform"><Calendar size={80} /></div>
            <div className="flex items-center gap-3 mb-4">
               <div className="w-10 h-10 rounded-xl bg-accent/20 text-accent flex items-center justify-center"><Calendar size={20} /></div>
               <h3 className="text-textMuted font-medium">Active Bookings</h3>
            </div>
            <p className="text-3xl font-bold">{activeBookingsCount}</p>
         </div>
      </div>
      
      {/* Chart */}
      <div className="glass-panel p-6 h-[400px] flex flex-col">
        <h2 className="text-xl font-bold mb-6">Revenue Overview</h2>
        {chartData.length > 0 ? (
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-textMuted border-dashed border-2 border-white/5 rounded-xl">
             <BarChart3 size={48} className="mb-4 opacity-50" />
             <p>No data available for {dateFilter}.</p>
          </div>
        )}
      </div>
    </div>
  );
};
export default Dashboard;
