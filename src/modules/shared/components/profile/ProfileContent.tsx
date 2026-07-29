'use client';

import { useEffect, useRef, useState } from 'react';
import { Camera, Eye, EyeOff, Loader2, Pencil, Save, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuthStore } from '@/shared/stores/auth.store';
import { getInitials } from '@/shared/lib/string/getInitials';
import { apiGet, apiPatch } from '@/shared/lib/apiClient';
import { uploadUserProfilePhoto } from '@/modules/shared/lib/uploadUserProfilePhoto';
import { toast } from 'sonner';
import { COUNTRIES } from '@/shared/constants/countries';
import { TIMEZONES } from '@/shared/constants/timezones';
import { LANGUAGES } from '@/shared/constants/languages';
import { AddressAutocomplete } from '@modules/shared/components/users/address-autocomplete';

interface FullUser {
  first_name?: string;
  last_name?: string;
  address?: string | null;
  zip_code?: string | null;
  city?: string | null;
  country?: string | null;
  biography?: string | null;
  timezone?: string | null;
  preferred_language?: string | null;
}

interface ProfileContentProps {
  uploadPath?: string;
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
  const [activeTab, setActiveTab] = useState<'account' | 'security'>('account');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  // Profile fields
  const [address, setAddress] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [biography, setBiography] = useState('');
  const [timezone, setTimezone] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState('');

  // Biography inline edit (left card)
  const [editingBio, setEditingBio] = useState(false);
  const [bioTemp, setBioTemp] = useState('');
  const [bioSaving, setBioSaving] = useState(false);

  // Security
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdSuccess, setPwdSuccess] = useState(false);
  const [pwdError, setPwdError] = useState<string | null>(null);

  // Load full profile on mount
  useEffect(() => {
    if (!user?.id) return;
    apiGet<{ data: FullUser }>(`${patchPath}/${user.id}`)
      .then(({ data }) => {
        if (data.first_name !== undefined) setFirstName(data.first_name);
        if (data.last_name !== undefined) setLastName(data.last_name);
        setAddress(data.address ?? '');
        setZipCode(data.zip_code ?? '');
        setCity(data.city ?? '');
        setCountry(data.country ?? '');
        setBiography(data.biography ?? '');
        setTimezone(data.timezone ?? '');
        setPreferredLanguage(data.preferred_language ?? '');
      })
      .catch(() => {
        /* silently ignore */
      });
  }, [user?.id, patchPath]);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file == null || user == null) return;
    setUploadError(null);
    setUploading(true);
    try {
      const routePrefix = uploadPath as 'platform/users' | 'users';
      const media = await uploadUserProfilePhoto(user.id, file, routePrefix);
      setAuth({ ...user, avatar: media.url });
    } catch {
      setUploadError("Échec de l'upload.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      await apiPatch(`${patchPath}/${user.id}`, {
        first_name: firstName,
        last_name: lastName,
        address: address || null,
        zip_code: zipCode || null,
        city: city || null,
        country: country || null,
        biography: biography || null,
        timezone: timezone || null,
        preferred_language: preferredLanguage || null,
      });
      setAuth({ ...user, name: `${firstName} ${lastName}`.trim() });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      toast.success('Profil mis à jour');
    } catch {
      setSaveError('Échec de la mise à jour.');
      toast.error('Échec de la mise à jour du profil');
    } finally {
      setSaving(false);
    }
  };

  const saveBio = async () => {
    if (!user) return;
    setBioSaving(true);
    try {
      await apiPatch(`${patchPath}/${user.id}`, { biography: bioTemp || null });
      setBiography(bioTemp);
      setEditingBio(false);
      toast.success('Biographie mise à jour');
    } catch {
      toast.error('Échec de la mise à jour de la biographie');
      // keep editing open on error
    } finally {
      setBioSaving(false);
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
    setPwdSuccess(false);
    try {
      await apiPatch(`${patchPath}/${user.id}/password`, { password: newPassword });
      setNewPassword('');
      setConfirmPassword('');
      setPwdSuccess(true);
      setTimeout(() => setPwdSuccess(false), 3000);
      toast.success('Mot de passe modifié');
    } catch {
      setPwdError('Échec du changement de mot de passe.');
      toast.error('Échec du changement de mot de passe');
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

              {/* Biography */}
              <div className="w-full border-t pt-3 mt-1">
                {editingBio ? (
                  <div className="space-y-2">
                    <Textarea
                      value={bioTemp}
                      onChange={(e) => setBioTemp(e.target.value)}
                      className="text-xs resize-none w-full"
                      rows={4}
                      maxLength={2000}
                      placeholder="Quelques mots sur vous…"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={saveBio}
                        disabled={bioSaving}
                        className="h-7 text-xs bg-(--color-primary) text-primary-foreground flex-1"
                      >
                        {bioSaving && <Loader2 className="size-3 animate-spin mr-1" />}
                        Enregistrer
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingBio(false)}
                        className="h-7 w-7 p-0"
                        aria-label="Annuler"
                      >
                        <X className="size-3" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="group relative">
                    {biography ? (
                      <p className="text-xs text-muted-foreground text-center leading-relaxed pr-5">
                        {biography}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground/50 italic text-center pr-5">
                        Ajouter une biographie…
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setBioTemp(biography);
                        setEditingBio(true);
                      }}
                      className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                      aria-label="Modifier la biographie"
                    >
                      <Pencil className="size-3" />
                    </button>
                  </div>
                )}
              </div>
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
                {/* Identity */}
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

                <Separator />

                {/* Address section */}
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Adresse
                </p>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Pays</Label>
                  <Select
                    value={country || '__none__'}
                    onValueChange={(v) => {
                      setCountry(v === '__none__' ? '' : v);
                      setAddress('');
                      setZipCode('');
                      setCity('');
                    }}
                  >
                    <SelectTrigger className="text-xs w-full">
                      <SelectValue placeholder="Sélectionner un pays" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">— Non renseigné</SelectItem>
                      {COUNTRIES.map((c) => (
                        <SelectItem key={c.code} value={c.code}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">
                    Adresse
                    {!country && (
                      <span className="ml-1 text-muted-foreground font-normal">
                        (sélectionnez un pays d'abord)
                      </span>
                    )}
                  </Label>
                  <AddressAutocomplete
                    value={address}
                    onChange={setAddress}
                    disabled={!country}
                    country={country || null}
                    onSelectSuggestion={(details) => {
                      if (details.address) setAddress(details.address);
                      if (details.zip_code) setZipCode(details.zip_code);
                      if (details.city) setCity(details.city);
                      if (details.country) setCountry(details.country);
                    }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Code postal</Label>
                    <Input
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value)}
                      className="text-xs"
                      maxLength={20}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Ville</Label>
                    <Input
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="text-xs"
                      maxLength={100}
                    />
                  </div>
                </div>

                <Separator />

                {/* Timezone + Language */}
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Préférences
                </p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Fuseau horaire</Label>
                    <Select
                      value={timezone || '__none__'}
                      onValueChange={(v) => setTimezone(v === '__none__' ? '' : v)}
                    >
                      <SelectTrigger className="text-xs w-full">
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">— Non renseigné</SelectItem>
                        {TIMEZONES.map((tz) => (
                          <SelectItem key={tz.value} value={tz.value}>
                            {tz.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Langue préférée</Label>
                    <Select
                      value={preferredLanguage || '__none__'}
                      onValueChange={(v) => setPreferredLanguage(v === '__none__' ? '' : v)}
                    >
                      <SelectTrigger className="text-xs w-full">
                        <SelectValue placeholder="Langue" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">— Non renseigné</SelectItem>
                        {LANGUAGES.map((l) => (
                          <SelectItem key={l.code} value={l.code}>
                            {l.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <Button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-(--color-primary) text-primary-foreground"
                  >
                    {saving ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Save className="size-4" />
                    )}
                    {saving ? 'Enregistrement…' : 'Enregistrer'}
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

          {/* ── Security tab ── */}
          {activeTab === 'security' && (
            <Card className="rounded-tl-none border-t-0">
              <CardContent className="pt-6 space-y-5 max-w-md">
                <p className="text-sm font-medium">Changer le mot de passe</p>

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
                    disabled={pwdSaving || !newPassword || !confirmPassword}
                    className="bg-(--color-primary) text-primary-foreground"
                  >
                    {pwdSaving ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Save className="size-4" />
                    )}
                    {pwdSaving ? 'Enregistrement…' : 'Changer le mot de passe'}
                  </Button>
                  {pwdSuccess && (
                    <span className="text-xs text-emerald-600">Mot de passe mis à jour ✓</span>
                  )}
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
