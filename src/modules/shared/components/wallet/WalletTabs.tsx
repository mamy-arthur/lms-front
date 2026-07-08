'use client';

import { cn } from '@/lib/utils';

export interface WalletTab {
  id: string;
  label: string;
}

interface WalletTabsProps {
  tabs: WalletTab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export function WalletTabs({ tabs, activeTab, onTabChange }: WalletTabsProps) {
  return (
    <nav aria-label="Navigation portefeuille" role="tablist" className="flex items-center gap-1 ">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={activeTab === tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            'border-b-2 border-transparent px-3 py-2.5 text-sm font-medium transition-colors',
            activeTab === tab.id
              ? 'border-(--color-primary) text-(--color-primary)'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
