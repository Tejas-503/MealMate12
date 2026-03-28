import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { supabase } from '../lib/supabase';
import { LogOut, Home, Calendar, Coffee, ClipboardList, BarChart3, Menu, X, Sun, Moon } from 'lucide-react';
import clsx from 'clsx';

const Navigation = () => {
  const { currentUser, setCurrentUser, theme, toggleTheme, isCanteenOpen } = useAppStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = React.useState(false);

  if (!currentUser) return null;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    navigate('/');
  };

  const studentLinks = [
    { name: 'Dashboard', path: '/student', icon: Home },
    { name: 'Seat Booking', path: '/student/booking', icon: Calendar },
    { name: 'Menu & Order', path: '/student/menu', icon: Coffee },
    { name: 'My Orders', path: '/student/orders', icon: ClipboardList },
  ];

  const staffLinks = [
    { name: 'Dashboard & Analytics', path: '/staff', icon: BarChart3 },
    { name: 'Menu Manager', path: '/staff/menu', icon: Coffee },
    { name: 'Order Status', path: '/staff/orders', icon: ClipboardList },
    { name: 'Seat Oversight', path: '/staff/bookings', icon: Calendar },
  ];

  const links = currentUser.role === 'student' ? studentLinks : staffLinks;

  return (
    <nav className="glass-panel sticky top-0 z-50 rounded-none border-x-0 border-t-0 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to={currentUser.role === 'staff' ? '/staff' : '/student'} className="flex items-center gap-2 group">
          <div className="w-10 h-10 bg-linear-to-br from-primary to-accent rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary/30 group-hover:scale-105 transition-transform">
            MM
          </div>
          <span className="font-bold text-xl tracking-wide bg-linear-to-r from-white to-white/70 bg-clip-text text-transparent">MealMate</span>
        </Link>
        
        {/* Desktop Links */}
        <div className="hidden md:flex items-center space-x-1">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={clsx(
                  "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200",
                  isActive ? "bg-white/10 text-primary" : "text-textMuted hover:text-white hover:bg-white/5"
                )}
              >
                <Icon size={18} />
                <span>{link.name}</span>
              </Link>
            );
          })}
          
          <div className="w-px h-6 bg-white/10 mx-2" />
          
          <div className="flex items-center gap-3 px-3">
            <div className={`hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-md border text-xs font-bold ${
              isCanteenOpen 
                ? 'border-green-500/20 bg-green-500/10 text-green-500' 
                : 'border-red-500/20 bg-red-500/10 text-red-500'
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full ${isCanteenOpen ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
              {isCanteenOpen ? 'OPEN' : 'CLOSED'}
            </div>
            
            <button
              onClick={toggleTheme}
              className="p-2 text-textMuted hover:text-white rounded-lg transition-colors"
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <span className="text-sm text-textMuted">Hi, {currentUser.fullName}</span>
            <button
              onClick={handleLogout}
              className="p-2 text-textMuted hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>

        {/* Mobile Toggle */}
        <button 
          className="md:hidden p-2 text-white/70 hover:text-white"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden pt-4 pb-2 border-t border-white/10 mt-3 space-y-2 animate-fade-in">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className={clsx(
                  "flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200",
                  isActive ? "bg-white/10 text-primary" : "text-textMuted"
                )}
              >
                <Icon size={20} />
                <span>{link.name}</span>
              </Link>
            );
          })}
          <div className="pt-2 border-t border-white/10 flex items-center justify-between px-4">
             <span className="text-sm text-textMuted">Logged in as {currentUser.fullName}</span>
             <div className="flex items-center gap-2">
                 <button
                   onClick={toggleTheme}
                   className="p-2 text-textMuted hover:text-white rounded-lg transition-colors"
                 >
                   {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                 </button>
                 <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-red-500 hover:bg-red-500/10 px-3 py-2 rounded-lg transition-colors"
                >
                  <LogOut size={18} /> Logout
                </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;
