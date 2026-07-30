'use client';

import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Camera, Eye, EyeOff, Loader2, Save } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldRoot,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/shared/stores/auth.store';
import { getInitials } from '@/shared/lib/string/getInitials';
import { apiGet, apiPatch } from '@/shared/lib/apiClient';
import { uploadUserProfilePhoto } from '@/modules/shared/lib/uploadUserProfilePhoto';
import { toast } from 'sonner';
import { UserProfileFields } from '@modules/shared/components/users/user-profile-fields';

const profileSchema = z.object({
  first_name: z.string().min(1, 'Prénom requis').max(120),
  last_name: z.string().min(1, 'Nom requis').max(120),
  address: z.string().max(255).nullable().optional(),
  zip_code: z.string().max(20).nullable().optional(),
  city: z.string().max(100).nullable().optional(),
  country: z.string().length(2).nullable().optional(),
  timezone: z.string().nullable().optional(),
  preferred_language: z.string().nullable().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface ProfileContentProps {
  uploadPath?: 'platform/users' | 'users';
  patchPath?: string;
}

export default function ProfileContent({
  uploadPath = 'platform/users',
  patchPath = 'platform/users',
}: ProfileContentProps) {
  const { user, setAuth } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingPhotoRef = useRef<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'account' | 'security'>('account');

  // Security
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdError, setPwdError] = useState<string | null>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      address: null,
      zip_code: null,
      city: null,
      country: null,
      timezone: null,
      preferred_language: null,
    },
  });

  const {
    reset,
    formState: { isSubmitting },
  } = form;

  useEffect(() => {
    if (!user?.id) return;
    setLoadError(null);
    apiGet<{ data: ProfileFormValues }>(`${patchPath}/${user.id}`)
      .then(({ data }) => {
        reset({
          first_name: data.first_name ?? '',
          last_name: data.last_name ?? '',
          address: data.address ?? null,
          zip_code: data.zip_code ?? null,
          city: data.city ?? null,
          country: data.country ?? null,
          timezone: data.timezone ?? null,
          preferred_language: data.preferred_language ?? null,
        });
      })
      .catch(() => {
        setLoadError('Impossible de charger le profil. Veuillez réessayer.');
        toast.error('Impossible de charger le profil');
      });
  }, [user?.id, patchPath, reset]);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    pendingPhotoRef.current = file;
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSave = async (values: ProfileFormValues) => {
    if (!user) return;
    setUploadError(null);

    let updatedUser = user;

    if (pendingPhotoRef.current) {
      try {
        const media = await uploadUserProfilePhoto(user.id, pendingPhotoRef.current, uploadPath);
        updatedUser = { ...user, avatar: media.url };
        setAuth(updatedUser);
        pendingPhotoRef.current = null;
        setPhotoPreview(null);
      } catch {
        setUploadError("Échec de l'upload de la photo.");
        toast.error("Échec de l'upload de la photo");
        return;
      }
    }

    try {
      await apiPatch(`${patchPath}/${user.id}`, {
        first_name: values.first_name,
        last_name: values.last_name,
        address: values.address || null,
        zip_code: values.zip_code || null,
        city: values.city || null,
        country: values.country || null,
        timezone: values.timezone || null,
        preferred_language: values.preferred_language || null,
      });
      setAuth({ ...updatedUser, name: `${values.first_name} ${values.last_name}`.trim() });
      toast.success('Profil mis à jour');
    } catch {
      toast.error('Échec de la mise à jour du profil');
    }
  };

  const handleChangePassword = async () => {
    if (!user) return;
    if (newPassword.length < 8) {
      setPwdError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdError('Les mots de passe ne correspondent pas.');
      return;
    }
    setPwdSaving(true);
    setPwdError(null);
    try {
      await apiPatch(`${patchPath}/${user.id}/password`, {
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: confirmPassword,
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Mot de passe modifié');
    } catch (err: unknown) {
      const json =
        err != null && typeof err === 'object' && 'json' in err
          ? (err as { json?: { errors?: { current_password?: string[] }; message?: string } }).json
          : undefined;
      const fieldError = json?.errors?.current_password?.[0];
      const msg = fieldError ?? json?.message ?? 'Échec du changement de mot de passe.';
      setPwdError(msg);
      toast.error(msg);
    } finally {
      setPwdSaving(false);
    }
  };

  if (user == null) return null;

  const tabs = [
    { key: 'account' as const, label: 'Paramètres du compte' },
    { key: 'security' as const, label: 'Sécurité' },
  ];

  return (
    <div className="bg-background">
      <header className="mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Profil</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gérez vos informations personnelles, votre adresse et vos préférences.
          </p>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left card */}
        <div className="w-full lg:w-64 shrink-0">
          <Card>
            <CardContent className="pt-6 pb-6 flex flex-col items-center gap-3">
              <div className="relative group">
                <Avatar className="h-28 w-28 rounded-full border-4 border-background shadow">
                  <AvatarImage src={photoPreview ?? user.avatar ?? undefined} alt={user.name} />
                  <AvatarFallback className="bg-(--color-primary) text-white text-xl">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  aria-label="Changer la photo"
                >
                  <Camera className="h-5 w-5 text-white" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handlePhotoSelect}
                />
              </div>
              <div className="text-center">
                <p className="font-semibold text-sm">{user.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{user.role}</p>
              </div>
              {photoPreview != null && (
                <p className="text-xs text-amber-600 text-center">
                  Photo sélectionnée — sera envoyée à la sauvegarde
                </p>
              )}
              {uploadError != null && (
                <p className="text-xs text-destructive text-center">{uploadError}</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right tabs */}
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

          {/* ── Account tab ── */}
          {activeTab === 'account' && (
            <Card className="rounded-tl-none border-t-0">
              <CardContent className="pt-6 space-y-5">
                {loadError != null && (
                  <div
                    role="alert"
                    className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
                  >
                    {loadError}
                  </div>
                )}

                <Field {...form}>
                  <form onSubmit={form.handleSubmit(handleSave)} className="space-y-5" noValidate>
                    {/* Identity */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <FieldRoot
                        control={form.control}
                        name="first_name"
                        render={({ field }) => (
                          <FieldGroup>
                            <FieldLabel className="text-xs">Prénom</FieldLabel>
                            <FieldContent>
                              <Input className="text-sm" {...field} />
                            </FieldContent>
                            <FieldError />
                          </FieldGroup>
                        )}
                      />
                      <FieldRoot
                        control={form.control}
                        name="last_name"
                        render={({ field }) => (
                          <FieldGroup>
                            <FieldLabel className="text-xs">Nom</FieldLabel>
                            <FieldContent>
                              <Input className="text-sm" {...field} />
                            </FieldContent>
                            <FieldError />
                          </FieldGroup>
                        )}
                      />
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

                    <UserProfileFields form={form} />

                    <div className="flex items-center gap-3 pt-1">
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-(--color-primary) hover:bg-(--color-primary)/80 text-primary-foreground"
                      >
                        {isSubmitting ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Save className="size-4" />
                        )}
                        {isSubmitting ? 'Enregistrement…' : 'Enregistrer'}
                      </Button>
                    </div>
                  </form>
                </Field>
              </CardContent>
            </Card>
          )}

          {/* ── Security tab ── */}
          {activeTab === 'security' && (
            <Card className="rounded-tl-none border-t-0">
              <CardContent className="pt-6 space-y-5 max-w-md">
                <p className="text-sm font-medium">Changer le mot de passe</p>

                <div className="space-y-1.5">
                  <Label htmlFor="current_password" className="text-xs font-medium">
                    Mot de passe actuel
                  </Label>
                  <div className="relative">
                    <Input
                      id="current_password"
                      type={showCurrentPwd ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="text-sm pr-9"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPwd((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                      aria-label={showCurrentPwd ? 'Masquer' : 'Afficher'}
                    >
                      {showCurrentPwd ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="new_password" className="text-xs font-medium">
                    Nouveau mot de passe
                  </Label>
                  <div className="relative">
                    <Input
                      id="new_password"
                      type={showNewPwd ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="text-sm pr-9"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPwd((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                      aria-label={showNewPwd ? 'Masquer' : 'Afficher'}
                    >
                      {showNewPwd ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Minimum 8 caractères, une majuscule, une minuscule et un chiffre.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirm_password" className="text-xs font-medium">
                    Confirmer le mot de passe
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirm_password"
                      type={showConfirmPwd ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="text-sm pr-9"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPwd((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                      aria-label={showConfirmPwd ? 'Masquer' : 'Afficher'}
                    >
                      {showConfirmPwd ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <Button
                    type="button"
                    onClick={handleChangePassword}
                    disabled={pwdSaving || !currentPassword || !newPassword || !confirmPassword}
                    className="bg-(--color-primary) hover:bg-(--color-primary)/80 text-primary-foreground"
                  >
                    {pwdSaving ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Save className="size-4" />
                    )}
                    {pwdSaving ? 'Enregistrement…' : 'Changer le mot de passe'}
                  </Button>
                  {pwdError != null && <span className="text-xs text-destructive">{pwdError}</span>}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
