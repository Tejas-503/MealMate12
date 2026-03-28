import { Outlet } from 'react-router-dom';
import Navigation from './Navigation';
import { AnimatedBackground } from './AnimatedBackground';

export const MainLayout = () => {
  return (
    <div className="min-h-screen text-textMain flex flex-col relative overflow-hidden transition-colors duration-500">
      <AnimatedBackground />
      
      <div className="relative z-10 flex flex-col flex-1">
        <Navigation />
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 animate-fade-in relative z-10">
        <Outlet />
      </main>
      </div>
    </div>
  );
};
