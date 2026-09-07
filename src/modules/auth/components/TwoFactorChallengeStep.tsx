'use client';

import * as React from 'react';
import { ArrowLeft, Loader2, RefreshCw } from 'lucide-react';

import { OtpInput } from '@/components/ui/otp-input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
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
  // Le backend décompte le cooldown depuis le dernier envoi, envoi initial compris.
  const [cooldown, setCooldown] = React.useState(challenge.resend_cooldown_seconds);

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
      setCooldown(next.resend_cooldown_seconds);
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
    <form onSubmit={handleVerify} className="mt-8 space-y-6">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">Vérification en deux étapes</h2>
        <p className="text-sm text-muted-foreground">
          Saisissez le code à {current.code_length} chiffres reçu par e-mail.
        </p>
      </div>

      <div className="space-y-3">
        <OtpInput
          length={current.code_length}
          value={code}
          onChange={setCode}
          disabled={isVerifying || isExpired || isChallengeLocked}
          hasError={error !== null}
          autoFocus
          aria-describedby={error ? 'otp-error' : 'otp-countdown'}
        />

        <div className="flex items-center justify-between gap-3">
          <p
            id="otp-countdown"
            className={cn('text-xs', isExpired ? 'text-destructive' : 'text-muted-foreground')}
          >
            {isExpired ? 'Code expiré' : `Expire dans ${formatCountdown(expiresIn)}`}
          </p>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleResend}
            disabled={cooldown > 0 || isResending || isVerifying}
            className="h-auto px-0 text-xs"
          >
            <RefreshCw className={cn('mr-1 h-3 w-3', isResending && 'animate-spin')} />
            {cooldown > 0 ? `Renvoyer dans ${cooldown}s` : 'Renvoyer le code'}
          </Button>
        </div>

        {error && (
          <p id="otp-error" role="alert" className="text-sm text-destructive">
            {error.message}
          </p>
        )}
      </div>

      <div className="flex items-start gap-3">
        <Checkbox
          id="trust-device"
          checked={trustDevice}
          onCheckedChange={(checked) => setTrustDevice(checked === true)}
          disabled={isVerifying}
          className="mt-0.5"
        />
        <Label htmlFor="trust-device" className="cursor-pointer text-sm leading-snug font-normal">
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

      <div className="flex justify-center">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onAbandon()}
          disabled={isVerifying}
          className="h-auto text-xs text-muted-foreground"
        >
          <ArrowLeft className="mr-1 h-3 w-3" />
          Retour à la connexion
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
