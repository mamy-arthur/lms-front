'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';

interface OtpInputProps {
  /** Nombre de cases, piloté par `code_length` renvoyé par l'API (6 à 10). */
  length: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  hasError?: boolean;
  autoFocus?: boolean;
  'aria-describedby'?: string;
}

const DIGITS_ONLY = /\D/g;

export function OtpInput({
  length,
  value,
  onChange,
  disabled = false,
  hasError = false,
  autoFocus = false,
  'aria-describedby': ariaDescribedBy,
}: OtpInputProps) {
  const inputsRef = React.useRef<Array<HTMLInputElement | null>>([]);

  const focusAt = (index: number) => {
    inputsRef.current[Math.max(0, Math.min(index, length - 1))]?.focus();
  };

  const commit = (next: string, focusIndex: number) => {
    onChange(next.slice(0, length));
    focusAt(focusIndex);
  };

  const handleChange = (index: number, raw: string) => {
    const digits = raw.replace(DIGITS_ONLY, '');

    if (digits === '') {
      commit(value.slice(0, index) + value.slice(index + 1), index);

      return;
    }

    const next = (value.slice(0, index) + digits + value.slice(index + digits.length)).slice(
      0,
      length,
    );

    commit(next, Math.min(index + digits.length, next.length));
  };

  const handleKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    // La frappe est traitée ici plutôt que via onChange : maxLength bloquerait
    // sinon la saisie sur une case déjà remplie.
    if (/^\d$/.test(event.key) && !event.metaKey && !event.ctrlKey) {
      event.preventDefault();

      // Code complet : la dernière case n'est pas écrasée par une frappe
      // surnuméraire, la correction passe par Retour arrière.
      if (value.length >= length && index === length - 1) return;

      handleChange(index, event.key);

      return;
    }

    if (event.key === 'Backspace') {
      event.preventDefault();

      if (value[index] !== undefined) {
        commit(value.slice(0, index) + value.slice(index + 1), index);

        return;
      }

      if (index > 0) {
        commit(value.slice(0, index - 1) + value.slice(index), index - 1);
      }

      return;
    }

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      focusAt(index - 1);

      return;
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      focusAt(index + 1);
    }
  };

  const handlePaste = (index: number, event: React.ClipboardEvent<HTMLInputElement>) => {
    const digits = event.clipboardData.getData('text').replace(DIGITS_ONLY, '');
    if (digits === '') return;

    event.preventDefault();
    handleChange(index, digits);
  };

  return (
    <div
      role="group"
      aria-label="Code de vérification"
      aria-describedby={ariaDescribedBy}
      // Les cases se partagent la largeur disponible : un code de 10 chiffres
      // deborderait la carte avec une largeur fixe.
      className={cn('flex w-full items-center', length > 8 ? 'gap-1.5' : 'gap-2')}
    >
      {Array.from({ length }, (_, index) => (
        <input
          key={index}
          ref={(node) => {
            inputsRef.current[index] = node;
          }}
          type="text"
          inputMode="numeric"
          pattern="\d*"
          // Permet l'autofill du code reçu par mail sur iOS et Android.
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          disabled={disabled}
          value={value[index] ?? ''}
          autoFocus={autoFocus && index === 0}
          aria-label={`Chiffre ${index + 1} sur ${length}`}
          aria-invalid={hasError || undefined}
          onChange={(event) => handleChange(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onPaste={(event) => handlePaste(index, event)}
          onFocus={(event) => event.target.select()}
          className={cn(
            'h-12 min-w-0 flex-1 rounded-md border border-input bg-input/20 p-0 text-center font-semibold transition-colors outline-none',
            length > 8 ? 'text-base' : 'text-lg',
            'focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30',
            'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
            'dark:bg-input/30',
            hasError && 'border-destructive ring-2 ring-destructive/20',
          )}
        />
      ))}
    </div>
  );
}
