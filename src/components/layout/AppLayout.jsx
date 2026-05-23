import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';

export default function AppLayout() {
  return (
    <div className="h-full bg-premium text-foreground flex flex-col safe-top overflow-hidden">
      <main className="flex-1 pb-20 overflow-y-auto overscroll-contain">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}