/** Affiché après une redirection `?activated=1` depuis le formulaire d'activation. */
export function AccountActivatedNotice() {
  return (
    <div
      role="status"
      className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-700"
    >
      Votre compte est activé. Connectez-vous avec le mot de passe que vous venez de définir.
    </div>
  );
}
