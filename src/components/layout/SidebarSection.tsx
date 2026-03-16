import type { ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

interface SidebarSectionProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}

export function SidebarSection({
  title,
  children,
  defaultOpen = true,
}: SidebarSectionProps) {
  return (
    <Collapsible defaultOpen={defaultOpen} className="group/section">
      <CollapsibleTrigger
        className={cn(
          'flex w-full items-center justify-between px-4 py-2',
          'text-xs font-semibold uppercase tracking-wider',
          'text-sidebar-foreground/60 hover:text-sidebar-foreground',
          'transition-colors',
        )}
      >
        {title}
        <ChevronDown
          className={cn(
            'size-4 shrink-0 transition-transform duration-200',
            'group-data-[state=open]/section:rotate-0',
            'group-data-[state=closed]/section:-rotate-90',
          )}
        />
      </CollapsibleTrigger>

      <CollapsibleContent
        className={cn(
          'overflow-hidden',
          'data-[state=open]:animate-collapsible-down',
          'data-[state=closed]:animate-collapsible-up',
        )}
      >
        <div className="px-4 pb-3">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
}
