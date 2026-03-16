import type { ReactNode } from 'react';
import { Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from './ThemeToggle';

interface HeaderProps {
  /** Callback to toggle mobile sidebar — when provided, renders hamburger (hidden on desktop) */
  onMenuClick?: () => void;
  /** Slot for theme toggle or other trailing actions */
  actions?: ReactNode;
}

export function Header({ onMenuClick, actions }: HeaderProps) {
  return (
    <header className="flex h-14 shrink-0 items-center border-b border-border bg-background px-4">
      {onMenuClick && (
        <button
          type="button"
          onClick={onMenuClick}
          className={cn(
            'mr-3 inline-flex size-9 items-center justify-center rounded-md lg:hidden',
            'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
            'transition-colors',
          )}
          aria-label="Open menu"
        >
          <Menu className="size-5" />
        </button>
      )}

      <h1 className="font-display text-lg font-semibold tracking-tight text-primary">
        WheelScan
      </h1>

      <div className="ml-auto flex items-center gap-2">
        {actions}
        <ThemeToggle />
      </div>
    </header>
  );
}
