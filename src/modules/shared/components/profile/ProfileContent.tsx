'use client';

import { useRef, useState } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/shared/stores/auth.store';
import { getInitials } from '@/shared/lib/string/getInitials';
import { apiUpload, apiPatch } from '@/shared/lib/apiClient';

interface MediaResponse {
  data: { id: string; url: string; mime_type: string };
}

interface ProfileContentProps {
  /** Préfixe API pour l'upload photo ex: "platform/users" ou "users" */
  uploadPath?: string;
  /** Préfixe API pour la mise à jour ex: "platform/users" ou "users" */
  patchPath?: string;
}

export default function ProfileContent({
  uploadPath = 'platform/users',
  patchPath = 'platform/users',
}: ProfileContentProps) {
  const { user, setAuth } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'account' | 'security' | 'notifications'>('account');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const parts = user?.name.split(' ') ?? [];
  const [firstName, setFirstName] = useState(parts[0] ?? '');
  const [lastName, setLastName] = useState(parts.slice(1).join(' '));

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file == null || user == null) return;
    setUploadError(null);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await apiUpload<MediaResponse>(
        `${uploadPath}/${user.id}/profile-photo`,
        formData,
      );
      setAuth({ ...user, avatar: res.data.url });
    } catch {
      setUploadError("Échec de l'upload.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (user == null) return null;

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      await apiPatch(`${patchPath}/${user.id}`, {
        first_name: firstName,
        last_name: lastName,
      });
      setAuth({ ...user, name: `${firstName} ${lastName}`.trim() });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      setSaveError('Échec de la mise à jour.');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { key: 'account' as const, label: 'Paramètres du compte' },
    { key: 'security' as const, label: 'Sécurité' },
    { key: 'notifications' as const, label: 'Notifications' },
  ];

  return (
    <div className="w-full py-8 px-6">
      <h1 className="text-2xl font-bold mb-6">Profil</h1>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Bloc gauche : carte identité */}
        <div className="w-full lg:w-64 shrink-0">
          <Card>
            <CardContent className="pt-6 pb-6 flex flex-col items-center gap-3">
              <div className="relative group">
                <Avatar className="h-28 w-28 rounded-full border-4 border-background shadow">
                  <AvatarImage src={user.avatar ?? undefined} alt={user.name} />
                  <AvatarFallback className="bg-(--color-primary) text-white text-xl">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer disabled:cursor-not-allowed"
                  aria-label="Changer la photo"
                >
                  <Camera className="h-5 w-5 text-white" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
              </div>
              <div className="text-center">
                <p className="font-semibold text-sm">{user.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{user.role}</p>
              </div>
              {uploadError != null && (
                <p className="text-xs text-destructive text-center">{uploadError}</p>
              )}
              {uploading && <p className="text-xs text-muted-foreground">Upload en cours…</p>}
            </CardContent>
          </Card>
        </div>

        {/* Bloc droit : onglets */}
        <div className="flex-1 min-w-0">
          <div className="flex gap-0 border-b">
            {tabs.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
                className={[
                  'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap',
                  activeTab === key
                    ? 'border-(--color-primary) text-(--color-primary)'
                    : 'border-transparent text-muted-foreground hover:text-foreground',
                ].join(' ')}
              >
                {label}
              </button>
            ))}
          </div>

          {activeTab === 'account' && (
            <Card className="rounded-tl-none border-t-0">
              <CardContent className="pt-6 space-y-5">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="first_name" className="text-xs font-medium">
                      Prénom
                    </Label>
                    <Input
                      id="first_name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="last_name" className="text-xs font-medium">
                      Nom
                    </Label>
                    <Input
                      id="last_name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="text-sm"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-medium">
                    Adresse email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    defaultValue={user.email}
                    readOnly
                    className="bg-muted/40 text-sm cursor-not-allowed"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="role" className="text-xs font-medium">
                    Rôle
                  </Label>
                  <Input
                    id="role"
                    defaultValue={user.role}
                    readOnly
                    className="bg-muted/40 text-sm cursor-not-allowed"
                  />
                </div>
                <div className="flex items-center justify-start gap-3 pt-1">
                  <Button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-(--color-primary) text-primary-foreground"
                  >
                    {saving && <Loader2 className="size-4 animate-spin mr-1" />}
                    {saving ? 'Enregistrement…' : 'Mettre à jour'}
                  </Button>
                  {saveSuccess && (
                    <span className="text-xs text-emerald-600">Profil mis à jour ✓</span>
                  )}
                  {saveError != null && (
                    <span className="text-xs text-destructive">{saveError}</span>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'security' && (
            <Card className="rounded-tl-none border-t-0">
              <CardContent className="py-16 flex items-center justify-center text-sm text-muted-foreground">
                Cette section sera disponible prochainement.
              </CardContent>
            </Card>
          )}

          {activeTab === 'notifications' && (
            <Card className="rounded-tl-none border-t-0">
              <CardContent className="py-16 flex items-center justify-center text-sm text-muted-foreground">
                Cette section sera disponible prochainement.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
