'use client';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
    <Tabs value={activeTab} onValueChange={onTabChange}>
      <TabsList>
        {tabs.map((tab) => (
          <TabsTrigger key={tab.id} value={tab.id}>
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
