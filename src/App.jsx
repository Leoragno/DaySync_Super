import { lazy, Suspense, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';

import { queryClient } from '@/lib/queryClient';
import { AuthProvider, useAuth } from '@/lib/auth/AuthContext';
import AuthGuard from '@/lib/auth/AuthGuard';
import AppLayout from '@/components/layout/AppLayout';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/hooks/use-toast';
import { checkTables } from '@/api/supabase';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ErrorBoundary from '@/components/common/ErrorBoundary';

// Lazy-loaded pages for code splitting
const Home = lazy(() => import('@/pages/Home'));
const Orario = lazy(() => import('@/pages/Orario'));
const Appunti = lazy(() => import('@/pages/Appunti'));
const Agenda = lazy(() => import('@/pages/Agenda'));
const Note = lazy(() => import('@/pages/Note'));
const Login = lazy(() => import('@/pages/Login'));


import { useAppListeners } from '@/hooks/useAppListeners';
import { useReminders } from '@/hooks/useReminders';
import { useBackgroundSync } from '@/hooks/useBackgroundSync';
import { notificationService } from '@/lib/notifications/NotificationService';
import { logger } from '@/lib/logger';

function PageSuspense({ children }) {
  return <Suspense fallback={<div className="flex items-center justify-center py-12"><div className="w-8 h-8 border-2 border-border border-t-primary rounded-full animate-spin" /></div>}>{children}</Suspense>;
}

function AppInitializer({ children }) {
  useAppListeners();
  useReminders();
  useBackgroundSync();
  const { toast } = useToast();
  const { user } = useAuth();
  const checked = useRef(false);
  const notificationInitialized = useRef(false);

  useEffect(() => {
    // Initialize notification service once
    if (!notificationInitialized.current) {
      notificationInitialized.current = true;
      notificationService.initialize().catch(err => {
        logger.error('Failed to initialize notification service:', err);
      });
    }
  }, []);

  useEffect(() => {
    if (user && !checked.current) {
      checked.current = true;
      checkTables().then(res => {
        if (!res.success) {
          toast({
            title: "Database non configurato",
            description: res.message,
            variant: "destructive",
            duration: 10000
          });
        }
      });
    }
  }, [user, toast]);

  return children;
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrowserRouter>
            <AppInitializer>
              <Routes>
                {/* Public */}
                <Route path="/login" element={<PageSuspense><Login /></PageSuspense>} />

                {/* Protected */}
                <Route element={<AuthGuard><AppLayout /></AuthGuard>}>
                  <Route index element={<PageSuspense><Home /></PageSuspense>} />
                  <Route path="Orario" element={<PageSuspense><Orario /></PageSuspense>} />
                  <Route path="Appunti" element={<PageSuspense><Appunti /></PageSuspense>} />
                  <Route path="Agenda" element={<PageSuspense><Agenda /></PageSuspense>} />
                  <Route path="Note" element={<PageSuspense><Note /></PageSuspense>} />

                </Route>

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </AppInitializer>
          </BrowserRouter>
          <Toaster />
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}