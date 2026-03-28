const PARTICLES = [
  { left: '5%', width: '60px', delay: '0s', duration: '25s', rounded: true },
  { left: '15%', width: '30px', delay: '4s', duration: '12s', rounded: false },
  { left: '25%', width: '80px', delay: '2s', duration: '18s', rounded: true },
  { left: '35%', width: '45px', delay: '8s', duration: '15s', rounded: false },
  { left: '45%', width: '90px', delay: '1s', duration: '22s', rounded: true },
  { left: '55%', width: '35px', delay: '6s', duration: '14s', rounded: false },
  { left: '65%', width: '110px', delay: '3s', duration: '28s', rounded: true },
  { left: '75%', width: '25px', delay: '5s', duration: '11s', rounded: true },
  { left: '85%', width: '70px', delay: '7s', duration: '19s', rounded: false },
  { left: '95%', width: '50px', delay: '9s', duration: '16s', rounded: true },
  { left: '10%', width: '40px', delay: '1.5s', duration: '20s', rounded: false },
  { left: '80%', width: '65px', delay: '4.5s', duration: '24s', rounded: true },
];

export const AnimatedBackground = () => {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none transition-colors duration-500 bg-background">
      <div className="absolute top-0 left-[-10%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] animate-blob mix-blend-screen dark:mix-blend-color-dodge transition-all duration-700" />
      <div className="absolute top-[20%] right-[-5%] w-[600px] h-[600px] bg-accent/20 rounded-full blur-[120px] animate-blob mix-blend-screen dark:mix-blend-color-dodge transition-all duration-700" style={{ animationDelay: '2s' }} />
      <div className="absolute -bottom-[20%] left-[20%] w-[700px] h-[700px] bg-indigo-500/20 rounded-full blur-[150px] animate-blob mix-blend-screen dark:mix-blend-color-dodge transition-all duration-700" style={{ animationDelay: '4s' }} />

      <div className="absolute inset-0">
        {PARTICLES.map((p, i) => (
          <div
            key={i}
            className={`absolute bottom-[-150px] bg-white/5 dark:bg-white/10 backdrop-blur-3xl border border-white/10 animate-float shadow-2xl ${p.rounded ? 'rounded-full' : 'rounded-3xl'}`}
            style={{
              left: p.left,
              width: p.width,
              height: p.width,
              animationDelay: p.delay,
              animationDuration: p.duration,
            }}
          />
        ))}
      </div>
    </div>
  );
};
