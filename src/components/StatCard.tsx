import { useEffect, useRef, useState } from 'react';

interface Props {
  value: number;
  label: string;
  icon?: React.ReactNode;
  accent?: string;
}

export default function StatCard({ value, label, icon, accent = 'from-brand-500 to-brand-700' }: Props) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const animated = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !animated.current) {
          animated.current = true;
          const duration = 1400;
          const start = performance.now();
          const from = 0;
          const to = value;
          function tick(now: number) {
            const t = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - t, 3);
            setDisplay(Math.floor(from + (to - from) * eased));
            if (t < 1) requestAnimationFrame(tick);
            else setDisplay(to);
          }
          requestAnimationFrame(tick);
        }
      });
    }, { threshold: 0.3 });

    observer.observe(el);
    return () => observer.disconnect();
  }, [value]);

  return (
    <div ref={ref} className="card p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-11 h-11 rounded-lg bg-gradient-to-br ${accent} flex items-center justify-center text-white`}>
          {icon}
        </div>
      </div>
      <p className="text-3xl font-bold text-slate-900 tabular-nums">
        {display.toLocaleString()}
      </p>
      <p className="text-sm font-medium text-slate-500 mt-1">{label}</p>
    </div>
  );
}
