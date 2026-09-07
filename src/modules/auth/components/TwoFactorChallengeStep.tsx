'use client';

import * as React from 'react';
import { ArrowLeft, Loader2, RefreshCw } from 'lucide-react';

import { OtpInput } from '@/components/ui/otp-input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { mapTwoFactorError, type TwoFactorError } from '@/modules/auth/lib/twoFactorErrors';
import type { TwoFactorChallenge } from '@/shared/api/auth.api';

interface TwoFactorChallengeStepProps {
  challenge: TwoFactorChallenge;
  /** Valide le code ; lève l'erreur du apiClient en cas d'échec. */
  onVerify: (payload: { code: string; trustDevice: boolean }) => Promise<void>;
  /** Réémet un code ; le challenge_token reste identique. */
  onResend: () => Promise<TwoFactorChallenge>;
  /** Abandon du challenge : retour à la saisie du mot de passe. */
  onAbandon: (reason?: string) => void;
}

export function TwoFactorChallengeStep({
  challenge,
  onVerify,
  onResend,
  onAbandon,
}: TwoFactorChallengeStepProps) {
  const [current, setCurrent] = React.useState(challenge);
  const [code, setCode] = React.useState('');
  const [trustDevice, setTrustDevice] = React.useState(false);
  const [error, setError] = React.useState<TwoFactorError | null>(null);
  const [isVerifying, setIsVerifying] = React.useState(false);
  const [isResending, setIsResending] = React.useState(false);
  const [expiresIn, setExpiresIn] = React.useState(challenge.expires_in);
  const [cooldown, setCooldown] = React.useState(0);

  useCountdown(expiresIn, setExpiresIn);
  useCountdown(cooldown, setCooldown);

  const isExpired = expiresIn <= 0;
  const isChallengeLocked = error?.kind === 'locked';
  const isAccountLocked = error?.kind === 'account_locked';
  const canSubmit = code.length === current.code_length && !isExpired && !isChallengeLocked;

  const handleVerify = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit || isVerifying) return;

    setError(null);
    setIsVerifying(true);

    try {
      await onVerify({ code, trustDevice });
    } catch (err) {
      const mapped = mapTwoFactorError(err);
      setError(mapped);
      setCode('');

      if (mapped.kind === 'invalid_challenge') {
        onAbandon(mapped.message);
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || isResending) return;

    setError(null);
    setIsResending(true);

    try {
      const next = await onResend();
      setCurrent(next);
      setExpiresIn(next.expires_in);
      setCode('');
    } catch (err) {
      const mapped = mapTwoFactorError(err);
      setError(mapped);
      setCooldown(mapped.retryAfterSeconds ?? 0);

      if (mapped.kind === 'invalid_challenge') {
        onAbandon(mapped.message);
      }
    } finally {
      setIsResending(false);
    }
  };

  if (isAccountLocked) {
    return (
      <div className="mt-8 space-y-4" role="alert">
        <h2 className="text-lg font-semibold">Compte bloqué</h2>
        <p className="text-sm text-muted-foreground">{error.message}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleVerify} className="mt-8 space-y-5">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">Vérification en deux étapes</h2>
        <p className="text-sm text-muted-foreground">
          Un code à {current.code_length} chiffres vient de vous être envoyé par e-mail.
        </p>
      </div>

      <div className="space-y-2">
        <OtpInput
          length={current.code_length}
          value={code}
          onChange={setCode}
          disabled={isVerifying || isExpired || isChallengeLocked}
          hasError={error !== null}
          autoFocus
          aria-describedby={error ? 'otp-error' : 'otp-countdown'}
        />

        <p id="otp-countdown" className="text-xs text-muted-foreground">
          {isExpired
            ? 'Ce code a expiré. Demandez-en un nouveau.'
            : `Le code expire dans ${formatCountdown(expiresIn)}.`}
        </p>

        {error && (
          <p id="otp-error" role="alert" className="text-sm text-red-500">
            {error.message}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Checkbox
          id="trust-device"
          checked={trustDevice}
          onCheckedChange={(checked) => setTrustDevice(checked === true)}
          disabled={isVerifying}
        />
        <Label htmlFor="trust-device" className="cursor-pointer font-normal">
          Ne plus demander de code sur cet appareil pendant 30 jours
        </Label>
      </div>

      <Button
        type="submit"
        disabled={!canSubmit || isVerifying}
        className="h-12 w-full bg-(--color-primary) hover:bg-(--color-primary)/80"
      >
        {isVerifying ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Vérification...
          </>
        ) : (
          'Vérifier'
        )}
      </Button>

      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          onClick={() => onAbandon()}
          disabled={isVerifying}
          className="px-0 text-xs"
        >
          <ArrowLeft className="mr-1 h-3 w-3" />
          Retour à la connexion
        </Button>

        <Button
          type="button"
          variant="ghost"
          onClick={handleResend}
          disabled={cooldown > 0 || isResending || isVerifying}
          className="px-0 text-xs"
        >
          <RefreshCw className="mr-1 h-3 w-3" />
          {cooldown > 0 ? `Renvoyer dans ${cooldown}s` : 'Renvoyer le code'}
        </Button>
      </div>
    </form>
  );
}

/** Décrémente une valeur en secondes jusqu'à zéro. */
function useCountdown(value: number, setValue: React.Dispatch<React.SetStateAction<number>>) {
  React.useEffect(() => {
    if (value <= 0) return;

    const timer = setInterval(() => {
      setValue((seconds) => (seconds <= 1 ? 0 : seconds - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [value, setValue]);
}

function formatCountdown(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;

  return `${minutes}:${String(rest).padStart(2, '0')}`;
}
