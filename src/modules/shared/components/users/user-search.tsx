"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export interface UserSearchProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
}

export function UserSearch({ value, onChange, onSearch }: UserSearchProps) {
  return (
    <div className="relative w-full sm:max-w-sm">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder="Rechercher par nom ou email…"
        aria-label="Rechercher"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") onSearch(); }}
        className="pl-9"
      />
    </div>
  );
}
