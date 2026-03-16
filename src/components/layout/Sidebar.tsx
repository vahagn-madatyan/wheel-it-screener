import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  children: ReactNode;
  className?: string;
}

export function Sidebar({ children, className }: SidebarProps) {
  return (
    <aside
      className={cn(
        'flex w-80 shrink-0 flex-col overflow-y-auto overscroll-contain',
        'border-r border-sidebar-border bg-sidebar text-sidebar-foreground',
        className,
      )}
    >
      <div className="flex h-14 shrink-0 items-center border-b border-sidebar-border px-4">
        <span className="text-sm font-semibold uppercase tracking-widest text-sidebar-primary">
          Filters
        </span>
      </div>

      <nav className="flex-1 space-y-1 py-2">{children}</nav>
    </aside>
  );
}
