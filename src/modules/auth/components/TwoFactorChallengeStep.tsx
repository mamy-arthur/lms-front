'use client';

import { ArrowLeft, Loader2, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { OtpInput } from '@/components/ui/otp-input';
import { cn } from '@/lib/utils';
import { mapTwoFactorError, type TwoFactorError } from '@/modules/auth/lib/twoFactorErrors';
import type { TwoFactorChallenge } from '@/shared/api/auth.api';
import { ROUTES } from '@/shared/constants/routes';

interface TwoFactorChallengeStepProps {
  challenge: TwoFactorChallenge;
  /** Valide le code ; lève l'erreur du apiClient en cas d'échec. */
  onVerify: (payload: { code: string; trustDevice: boolean }) => Promise<void>;
  /** Réémet un code ; le challenge_token reste identique. */
  onResend: () => Promise<TwoFactorChallenge>;
  /** Abandon du challenge : retour à la saisie du mot de passe. */
  onAbandon: (reason?: string) => void;
  /** Page de réinitialisation adaptée au contexte (tenant ou plateforme). */
  forgotPasswordHref?: string;
}

export function TwoFactorChallengeStep({
  challenge,
  onVerify,
  onResend,
  onAbandon,
  forgotPasswordHref = ROUTES.auth.forgotPassword,
}: TwoFactorChallengeStepProps) {
  const [current, setCurrent] = React.useState(challenge);
  const [code, setCode] = React.useState('');
  const [trustDevice, setTrustDevice] = React.useState(false);
  const [error, setError] = React.useState<TwoFactorError | null>(null);
  const [isVerifying, setIsVerifying] = React.useState(false);
  const [isResending, setIsResending] = React.useState(false);
  const [expiresAt, setExpiresAt] = React.useState(() => deadlineFromNow(challenge.expires_in));
  // Le backend décompte le cooldown depuis le dernier envoi, envoi initial compris.
  const [resendableAt, setResendableAt] = React.useState(() =>
    deadlineFromNow(challenge.resend_cooldown_seconds),
  );

  const expiresIn = useCountdown(expiresAt);
  const cooldown = useCountdown(resendableAt);

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
      setExpiresAt(deadlineFromNow(next.expires_in));
      setResendableAt(deadlineFromNow(next.resend_cooldown_seconds));
      setCode('');
    } catch (err) {
      const mapped = mapTwoFactorError(err);
      setError(mapped);

      // Une erreur sans Retry-After (réseau, 5xx) ne doit pas rouvrir l'envoi :
      // le cooldown en cours reste la seule borne connue.
      if (mapped.retryAfterSeconds !== undefined) {
        setResendableAt(deadlineFromNow(mapped.retryAfterSeconds));
      }

      if (mapped.kind === 'invalid_challenge') {
        onAbandon(mapped.message);
      }
    } finally {
      setIsResending(false);
    }
  };

  if (isAccountLocked) {
    return (
      <div className="mt-8 space-y-4">
        <div className="space-y-1" role="alert">
          <h2 className="text-lg font-semibold">Compte bloqué</h2>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </div>

        <div className="flex flex-col items-start gap-2">
          <Link
            href={forgotPasswordHref}
            className="text-sm text-primary underline-offset-4 hover:underline"
          >
            Réinitialiser mon mot de passe
          </Link>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onAbandon()}
            className="h-auto px-0 text-xs text-muted-foreground"
          >
            <ArrowLeft className="mr-1 h-3 w-3" />
            Retour à la connexion
          </Button>
        </div>
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
          {current.trusted_device_days === undefined
            ? 'Ne plus demander de code sur cet appareil'
            : `Ne plus demander de code sur cet appareil pendant ${current.trusted_device_days} jour${
                current.trusted_device_days > 1 ? 's' : ''
              }`}
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

/**
 * Décompte jusqu'à une échéance absolue.
 *
 * Le restant est recalculé depuis l'échéance à chaque tick : le bridage des
 * timers en onglet masqué ne peut donc plus désynchroniser l'affichage de
 * l'expiration réelle du code côté serveur.
 */
function useCountdown(deadline: number): number {
  const [remaining, setRemaining] = React.useState(() => remainingSeconds(deadline));

  React.useEffect(() => {
    const sync = () => setRemaining(remainingSeconds(deadline));

    sync();

    const timer = setInterval(sync, 1000);
    document.addEventListener('visibilitychange', sync);

    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', sync);
    };
  }, [deadline]);

  return remaining;
}

function deadlineFromNow(seconds: number): number {
  return Date.now() + seconds * 1000;
}

function remainingSeconds(deadline: number): number {
  return Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
}

function formatCountdown(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;

  return `${minutes}:${String(rest).padStart(2, '0')}`;
}
