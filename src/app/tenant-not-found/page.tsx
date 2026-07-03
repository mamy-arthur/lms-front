/**
 * Page affichée quand le sous-domaine ne correspond à aucune organisation connue.
 * Accessible sans authentification et sans tenant chargé.
 */
export default function TenantNotFoundPage() {
  return (
    <main
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        gap: '12px',
        fontFamily: 'system-ui, sans-serif',
        textAlign: 'center',
        padding: '0 24px',
      }}
    >
      <h1 style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>Organisation introuvable</h1>
      <p style={{ color: '#64748b', maxWidth: '480px', margin: 0 }}>
        L&apos;adresse que vous avez saisie ne correspond à aucune organisation enregistrée sur
        cette plateforme.
      </p>
      <p style={{ color: '#94a3b8', fontSize: '0.875rem', margin: 0 }}>
        Vérifiez l&apos;URL ou contactez votre administrateur.
      </p>
    </main>
  );
}
