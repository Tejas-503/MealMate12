import { useMemo, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { TrendingUp, Users, ShoppingBag, Calendar, DollarSign, CheckCircle2, BarChart3, Power } from 'lucide-react';

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
      
      {/* Chart Space Placeholder */}
      <div className="glass-panel p-8 min-h-[400px] flex items-center justify-center border-dashed border-2 border-white/5">
         <div className="text-center text-textMuted max-w-sm">
           <BarChart3 size={48} className="mx-auto mb-4 opacity-50" />
           <p>Detailed charting options would go here, displaying revenue trends over {dateFilter}.</p>
         </div>
      </div>
    </div>
  );
};
export default Dashboard;
