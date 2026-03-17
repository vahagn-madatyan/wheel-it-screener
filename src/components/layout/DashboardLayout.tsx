import {
  type ReactNode,
  useState,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import { Header } from './Header';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  sidebar: ReactNode;
  children: ReactNode;
}

export function DashboardLayout({ sidebar, children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Track closing transition so the overlay stays mounted during slide-out
  const [isClosing, setIsClosing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const closeSidebar = useCallback(() => {
    setIsClosing(true);
    setSidebarOpen(false);
  }, []);

  const toggleSidebar = useCallback(
    () =>
      setSidebarOpen((prev) => {
        if (prev) setIsClosing(true);
        return !prev;
      }),
    [],
  );

  // Clear isClosing after transition ends
  function handleTransitionEnd() {
    if (!sidebarOpen) setIsClosing(false);
  }

  // Close sidebar on Escape key
  useEffect(() => {
    if (!sidebarOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        closeSidebar();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [sidebarOpen, closeSidebar]);

  // Close sidebar when resizing past the lg breakpoint (1024px)
  useEffect(() => {
    if (!sidebarOpen) return;

    const mql = window.matchMedia('(min-width: 1024px)');
    function handleChange(e: MediaQueryListEvent) {
      if (e.matches) setSidebarOpen(false);
    }

    mql.addEventListener('change', handleChange);
    return () => mql.removeEventListener('change', handleChange);
  }, [sidebarOpen]);

  const showOverlay = sidebarOpen || isClosing;

  return (
    <div className="relative grid h-dvh overflow-hidden grid-cols-1 grid-rows-[auto_1fr] lg:grid-cols-[320px_1fr]">
      {/* Noise texture overlay — subtle grain aesthetic */}
      <div
        className="pointer-events-none fixed inset-0 z-[1] opacity-[0.04]"
        aria-hidden="true"
      >
        <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
          <filter id="noise">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.65"
              numOctaves="3"
              stitchTiles="stitch"
            />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter="url(#noise)" />
        </svg>
      </div>
      {/* Desktop sidebar — always visible at lg+ */}
      <div className="row-span-2 hidden overflow-hidden lg:flex">{sidebar}</div>

      {/* Mobile sidebar overlay — only mounted when open or closing */}
      {showOverlay && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          aria-hidden={!sidebarOpen}
        >
          {/* Backdrop */}
          <div
            className={cn(
              'absolute inset-0 bg-black/50 transition-opacity duration-200',
              sidebarOpen ? 'opacity-100' : 'opacity-0',
            )}
            onClick={closeSidebar}
            data-testid="sidebar-backdrop"
          />

          {/* Sliding sidebar panel */}
          <div
            ref={panelRef}
            className={cn(
              'absolute inset-y-0 left-0 w-80 transition-transform duration-200 ease-out',
              sidebarOpen ? 'translate-x-0' : '-translate-x-full',
            )}
            onTransitionEnd={handleTransitionEnd}
          >
            {sidebar}
          </div>
        </div>
      )}

      {/* Main area */}
      <main className="col-start-1 row-start-1 row-span-2 flex flex-col lg:col-start-2">
        <Header onMenuClick={toggleSidebar} />
        {children}
      </main>
    </div>
  );
}
