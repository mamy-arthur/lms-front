'use client';

import { useRef, useState } from 'react';
import { Camera, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

export interface UserPhotoFieldProps {
  /** URL de la photo actuelle (depuis le backend) */
  currentPhotoUrl?: string | null;
  /** Nom complet pour les initiales en fallback */
  fullName?: string;
  /** Appelé quand un nouveau fichier est sélectionné (preview local) */
  onFileSelected: (file: File | null) => void;
}

export function UserPhotoField({
  currentPhotoUrl,
  fullName = '',
  onFileSelected,
}: UserPhotoFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;
    onFileSelected(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const clearPending = () => {
    setPreview(null);
    onFileSelected(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const displayUrl = preview ?? currentPhotoUrl;

  return (
    <div className="flex items-center gap-4">
      <div className="relative group">
        <Avatar className="h-16 w-16 rounded-full">
          <AvatarImage src={displayUrl ?? undefined} alt={fullName} />
          <AvatarFallback className="bg-gray-50 text-white text-base">
            <Camera className="h-5 w-5 text-black" />
          </AvatarFallback>
        </Avatar>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          aria-label="Changer la photo de profil"
        >
          <Camera className="h-5 w-5 text-white" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleChange}
        />
      </div>
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">JPEG, PNG ou WebP</p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="text-xs"
          >
            {preview ? 'Changer' : 'Ajouter une photo'}
          </Button>
          {preview && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearPending}
              className="text-xs text-destructive"
            >
              <X className="size-3" />
            </Button>
          )}
        </div>
        {preview && (
          <p className="text-xs text-emerald-600">
            Photo sélectionnée — sera enregistrée à la sauvegarde
          </p>
        )}
      </div>
    </div>
  );
}
