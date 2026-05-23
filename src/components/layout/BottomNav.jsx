import { NavLink } from 'react-router-dom';
import { Home, CalendarDays, BookOpen, Calendar, StickyNote, Settings } from 'lucide-react';

const NAV_ITEMS = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/Orario', icon: CalendarDays, label: 'Orario' },
  { to: '/Appunti', icon: BookOpen, label: 'Appunti' },
  { to: '/Agenda', icon: Calendar, label: 'Agenda' },
  { to: '/Note', icon: StickyNote, label: 'Note' },

];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 glass border-t border-white/5 safe-bottom rounded-t-3xl shadow-2xl">
      <div className="flex items-center justify-around max-w-md mx-auto h-16">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} end={to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors active-scale ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`
            }>
            <Icon size={20} strokeWidth={2} />
            <span className="text-[10px] font-medium">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}