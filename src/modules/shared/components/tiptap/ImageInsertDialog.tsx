"use client";

import { useEffect, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import { ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Align = "left" | "center" | "right";

interface ImageAttrs {
  src: string;
  alt: string;
  width: number | null;
  height: number | null;
  align: Align;
}

const DEFAULTS: ImageAttrs = {
  src: "",
  alt: "",
  width: null,
  height: null,
  align: "left",
};

interface ImageInsertDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (attrs: ImageAttrs) => void;
}

export function ImageInsertDialog({
  open,
  onClose,
  onConfirm,
}: ImageInsertDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attrs, setAttrs] = useState<ImageAttrs>(DEFAULTS);
  const [autoSize, setAutoSize] = useState(true);

  // Reset à chaque ouverture
  useEffect(() => {
    if (open) {
      setAttrs(DEFAULTS);
      setAutoSize(true);
    }
  }, [open]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setAttrs((prev) => ({
        ...prev,
        src: reader.result as string,
        alt: prev.alt || file.name,
      }));
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleConfirm = () => {
    if (!attrs.src) return;
    onConfirm({
      ...attrs,
      width: autoSize ? null : attrs.width,
      height: autoSize ? null : attrs.height,
    });
    onClose();
  };

  const set = <K extends keyof ImageAttrs>(key: K, value: ImageAttrs[K]) =>
    setAttrs((prev) => ({ ...prev, [key]: value }));

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Propriétés de l'image</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Source : URL ou fichier local */}
          <div className="space-y-1">
            <Label className="text-xs">Saisir l'URL</Label>
            <div className="flex gap-2">
              <Input
                className="text-xs"
                placeholder="https://…"
                value={attrs.src.startsWith("data:") ? "" : attrs.src}
                onChange={(e) => set("src", e.target.value)}
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="shrink-0 text-xs"
              >
                <ImagePlus className="mr-1 size-3.5" />
                Parcourir…
              </Button>
            </div>
          </div>

          {/* Alt */}
          <div className="space-y-1">
            <Label className="text-xs">
              Décrire l'image pour ceux qui ne peuvent pas la voir
            </Label>
            <textarea
              className="w-full resize-none rounded-md border bg-background px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              rows={2}
              maxLength={125}
              value={attrs.alt}
              onChange={(e) => set("alt", e.target.value)}
            />
            <p className="text-right text-[10px] text-muted-foreground">
              {attrs.alt.length}/125
            </p>
          </div>

          {/* Dimensions */}
          <div className="space-y-2">
            <Label className="text-xs">Taille</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                className="w-20 text-xs"
                placeholder="100"
                min={1}
                disabled={autoSize}
                value={attrs.width ?? ""}
                onChange={(e) =>
                  set("width", e.target.value ? Number(e.target.value) : null)
                }
              />
              <span className="text-xs text-muted-foreground">×</span>
              <Input
                type="number"
                className="w-20 text-xs"
                placeholder="100"
                min={1}
                disabled={autoSize}
                value={attrs.height ?? ""}
                onChange={(e) =>
                  set("height", e.target.value ? Number(e.target.value) : null)
                }
              />
              <div className="flex items-center gap-1.5">
                <Checkbox
                  id="auto-size"
                  checked={autoSize}
                  onCheckedChange={(v) => setAutoSize(Boolean(v))}
                />
                <Label htmlFor="auto-size" className="cursor-pointer text-xs">
                  Dimensionnement automatique
                </Label>
              </div>
            </div>
          </div>

          {/* Alignement */}
          <div className="flex items-center gap-3">
            <Label className="text-xs shrink-0">Alignement</Label>
            <Select
              value={attrs.align}
              onValueChange={(v) => set("align", v as Align)}
            >
              <SelectTrigger className="w-32 text-xs" size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="left" className="text-xs">
                  Gauche
                </SelectItem>
                <SelectItem value="center" className="text-xs">
                  Centre
                </SelectItem>
                <SelectItem value="right" className="text-xs">
                  Droite
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Preview */}
          {attrs.src && (
            <div className="flex justify-center rounded-md border bg-muted/30 p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={attrs.src}
                alt={attrs.alt || "Aperçu"}
                style={{
                  maxWidth: "100%",
                  maxHeight: "160px",
                  width: !autoSize && attrs.width ? attrs.width : undefined,
                  height: !autoSize && attrs.height ? attrs.height : undefined,
                }}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Annuler
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={!attrs.src}
            onClick={handleConfirm}
            className="bg-(--color-primary) hover:bg-primary/80 text-primary-foreground"
          >
            Enregistrer l'image
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
