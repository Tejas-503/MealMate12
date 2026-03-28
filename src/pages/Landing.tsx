import { Link, Navigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { GraduationCap, ShieldCheck, ArrowRight, Utensils, Sun, Moon } from 'lucide-react';
import { AnimatedBackground } from '../components/AnimatedBackground';

const Landing = () => {
  const { currentUser, theme, toggleTheme, isCanteenOpen } = useAppStore();

  if (currentUser) {
    return <Navigate to={currentUser.role === 'staff' ? '/staff' : '/student'} replace />;
  }

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center p-4 md:p-8 overflow-hidden">
      <AnimatedBackground />

      {/* Header matching screenshot style */}
      <div className="absolute top-0 w-full p-6 flex justify-between items-center z-20 max-w-7xl mx-auto">
        <div className="flex items-center gap-2 group">
          <div className="w-10 h-10 bg-linear-to-br from-primary to-accent rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg group-hover:scale-105 transition-transform">
            MM
          </div>
          <span className="font-bold text-2xl tracking-wide bg-linear-to-r from-white to-white/70 bg-clip-text text-transparent">MealMate</span>
        </div>
        <div className="flex gap-4 items-center">
          <button
            onClick={toggleTheme}
            className="p-2 text-textMuted hover:text-white rounded-lg transition-colors border border-white/5 bg-white/5 backdrop-blur-md"
            title="Toggle Theme"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium ${
            isCanteenOpen 
              ? 'border-green-500/20 bg-green-500/10 text-green-400' 
              : 'border-red-500/20 bg-red-500/10 text-red-500'
          }`}>
            <div className={`w-2 h-2 rounded-full ${isCanteenOpen ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            {isCanteenOpen ? 'Canteen Open' : 'Canteen Closed'}
          </div>
        </div>
      </div>

      <div className="relative z-10 w-full max-w-5xl mx-auto flex flex-col items-center mt-12 animate-slide-up">
        {/* Badge */}
        <div className="px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md mb-8 flex items-center gap-2 text-sm text-primary font-medium">
          <Utensils size={14} /> Smart Canteen Management System
        </div>

        {/* Hero Typography */}
        <h1 className="text-6xl md:text-8xl font-black mb-6 tracking-tight text-center">
          <span className="text-white">Meal</span><span className="text-primary">Mate</span>
        </h1>
        <p className="text-xl md:text-2xl text-white/90 font-medium mb-4 text-center max-w-3xl leading-relaxed">
          Book seats. Order food. Track everything — all in one place.
        </p>
        <p className="text-textMuted text-center max-w-2xl mb-16">
          Your college canteen, reimagined with real-time ordering, seat reservations, and instant tracking.
        </p>

        {/* Portals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
          {/* Student Portal Card */}
          <Link to="/login" className="glass-panel p-8 group hover:-translate-y-2 transition-all duration-300 hover:shadow-primary/20 flex flex-col h-full border-primary/20">
            <div className="w-12 h-12 rounded-xl bg-primary/20 text-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <GraduationCap size={24} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Student Portal</h2>
            <p className="text-textMuted mb-6 flex-1 text-sm leading-relaxed">
              Book seats, browse the menu, place orders, track your food, and manage bookings.
            </p>
            <div className="flex flex-wrap gap-2 mb-8">
              <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-white/5 border border-white/10 text-primary">Seat Booking</span>
              <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-white/5 border border-white/10 text-primary">Order Food</span>
              <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-white/5 border border-white/10 text-primary">Track Orders</span>
            </div>
            <div className="flex items-center gap-2 text-sm font-bold text-white group-hover:text-primary transition-colors mt-auto">
              Login / Register <ArrowRight size={16} />
            </div>
          </Link>

          {/* Staff Portal Card */}
          <Link to="/staff-login" className="glass-panel p-8 group hover:-translate-y-2 transition-all duration-300 hover:shadow-accent/20 flex flex-col h-full border-white/5">
            <div className="w-12 h-12 rounded-xl bg-white/5 text-white flex items-center justify-center mb-6 group-hover:scale-110 transition-transform border border-white/10">
              <ShieldCheck size={24} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Staff Portal</h2>
            <p className="text-textMuted mb-6 flex-1 text-sm leading-relaxed">
              Manage orders, update menus, handle seat bookings, and view analytics & revenue.
            </p>
            <div className="flex flex-wrap gap-2 mb-8">
              <span className="px-2.5 py-1 text-xs font-medium rounded-md bg-white/5 border border-white/10 text-textMuted group-hover:text-white transition-colors">Manage Menu</span>
              <span className="px-2.5 py-1 text-xs font-medium rounded-md bg-white/5 border border-white/10 text-textMuted group-hover:text-white transition-colors">Revenue</span>
              <span className="px-2.5 py-1 text-xs font-medium rounded-md bg-white/5 border border-white/10 text-textMuted group-hover:text-white transition-colors">Analytics</span>
            </div>
            <div className="flex items-center gap-2 text-sm font-bold text-textMuted group-hover:text-white transition-colors mt-auto">
              Staff Login <ArrowRight size={16} />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Landing;
