'use client';

import { useState } from 'react';
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
import { UserProfileFields } from '@modules/shared/components/users/user-profile-fields';
import { useProfileForm } from './useProfileForm';
import { usePasswordChange } from './usePasswordChange';

interface ProfileContentProps {
  uploadPath?: 'platform/users' | 'users';
  patchPath?: string;
}

export default function ProfileContent({
  uploadPath = 'platform/users',
  patchPath = 'platform/users',
}: ProfileContentProps) {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'account' | 'security'>('account');

  const {
    form,
    isLoading,
    fileInputRef,
    photoPreview,
    uploadError,
    loadError,
    handlePhotoSelect,
    handleSave,
  } = useProfileForm({ uploadPath, patchPath });

  const {
    form: pwdForm,
    showCurrentPwd,
    setShowCurrentPwd,
    showNewPwd,
    setShowNewPwd,
    showConfirmPwd,
    setShowConfirmPwd,
    handleChangePassword,
  } = usePasswordChange({ patchPath });

  if (user == null) return null;

  const {
    formState: { isSubmitting },
  } = form;

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
                    {isLoading && (
                      <p className="text-xs text-muted-foreground animate-pulse">
                        Chargement du profil…
                      </p>
                    )}
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
              <CardContent className="pt-6 max-w-md">
                <Field {...pwdForm}>
                  <form onSubmit={handleChangePassword} className="space-y-5" noValidate>
                    <p className="text-sm font-medium">Changer le mot de passe</p>

                    <FieldRoot
                      control={pwdForm.control}
                      name="current_password"
                      render={({ field }) => (
                        <FieldGroup>
                          <FieldLabel className="text-xs">Mot de passe actuel</FieldLabel>
                          <FieldContent>
                            <div className="relative">
                              <Input
                                type={showCurrentPwd ? 'text' : 'password'}
                                className="text-sm pr-9"
                                autoComplete="current-password"
                                {...field}
                              />
                              <button
                                type="button"
                                onClick={() => setShowCurrentPwd((v) => !v)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                tabIndex={-1}
                                aria-label={showCurrentPwd ? 'Masquer' : 'Afficher'}
                              >
                                {showCurrentPwd ? (
                                  <EyeOff className="size-4" />
                                ) : (
                                  <Eye className="size-4" />
                                )}
                              </button>
                            </div>
                          </FieldContent>
                          <FieldError />
                        </FieldGroup>
                      )}
                    />

                    <FieldRoot
                      control={pwdForm.control}
                      name="password"
                      render={({ field }) => (
                        <FieldGroup>
                          <FieldLabel className="text-xs">Nouveau mot de passe</FieldLabel>
                          <FieldContent>
                            <div className="relative">
                              <Input
                                type={showNewPwd ? 'text' : 'password'}
                                className="text-sm pr-9"
                                autoComplete="new-password"
                                {...field}
                              />
                              <button
                                type="button"
                                onClick={() => setShowNewPwd((v) => !v)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                tabIndex={-1}
                                aria-label={showNewPwd ? 'Masquer' : 'Afficher'}
                              >
                                {showNewPwd ? (
                                  <EyeOff className="size-4" />
                                ) : (
                                  <Eye className="size-4" />
                                )}
                              </button>
                            </div>
                          </FieldContent>
                          <FieldError />
                        </FieldGroup>
                      )}
                    />

                    <FieldRoot
                      control={pwdForm.control}
                      name="password_confirmation"
                      render={({ field }) => (
                        <FieldGroup>
                          <FieldLabel className="text-xs">Confirmer le mot de passe</FieldLabel>
                          <FieldContent>
                            <div className="relative">
                              <Input
                                type={showConfirmPwd ? 'text' : 'password'}
                                className="text-sm pr-9"
                                autoComplete="new-password"
                                {...field}
                              />
                              <button
                                type="button"
                                onClick={() => setShowConfirmPwd((v) => !v)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                tabIndex={-1}
                                aria-label={showConfirmPwd ? 'Masquer' : 'Afficher'}
                              >
                                {showConfirmPwd ? (
                                  <EyeOff className="size-4" />
                                ) : (
                                  <Eye className="size-4" />
                                )}
                              </button>
                            </div>
                          </FieldContent>
                          <FieldError />
                        </FieldGroup>
                      )}
                    />

                    {pwdForm.formState.errors.root && (
                      <p className="text-xs text-destructive" role="alert">
                        {pwdForm.formState.errors.root.message}
                      </p>
                    )}

                    <div className="flex items-center gap-3 pt-1">
                      <Button
                        type="submit"
                        disabled={pwdForm.formState.isSubmitting}
                        className="bg-(--color-primary) hover:bg-(--color-primary)/80 text-primary-foreground"
                      >
                        {pwdForm.formState.isSubmitting ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Save className="size-4" />
                        )}
                        {pwdForm.formState.isSubmitting
                          ? 'Enregistrement…'
                          : 'Changer le mot de passe'}
                      </Button>
                    </div>
                  </form>
                </Field>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
