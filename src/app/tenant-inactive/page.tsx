/**
 * Page affichée quand l'organisation existe mais est temporairement désactivée.
 * Accessible sans authentification et sans tenant chargé.
 */
export default function TenantInactivePage() {
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
      <h1 style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>Organisation désactivée</h1>
      <p style={{ color: '#64748b', maxWidth: '480px', margin: 0 }}>
        Votre organisation est temporairement inactive. L&apos;accès à la plateforme a été suspendu.
      </p>
      <p style={{ color: '#94a3b8', fontSize: '0.875rem', margin: 0 }}>
        Contactez votre administrateur ou le support Learneo pour plus d&apos;informations.
      </p>
    </main>
  );
}
