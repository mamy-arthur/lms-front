"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Settings } from "lucide-react";

type Props = {
  children: React.ReactNode;
};

export function AdvancedSettingsDialog({ children }: Props) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" className="gap-2">
          <Settings className="size-4" />
          Paramètres avancés
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>Paramètres avancés</DialogTitle>
        </DialogHeader>

        <ScrollArea className="pb-6">
          <div className="space-y-6">{children}</div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}