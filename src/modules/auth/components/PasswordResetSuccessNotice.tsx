/** Affiché après une redirection `?reset=1` depuis un formulaire de réinitialisation. */
export function PasswordResetSuccessNotice() {
  return (
    <div
      role="status"
      className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-700"
    >
      Votre mot de passe a été réinitialisé. Connectez-vous avec le nouveau.
    </div>
  );
}
