import { AdminForgotPasswordForm } from '@/modules/auth/components/AdminForgotPasswordForm';

export default function AdminForgotPasswordPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
      }}
    >
      <div style={{ padding: 4, width: '100%', maxWidth: 420 }}>
        <span style={{ fontWeight: 700, marginBottom: 1 }}>Mot de passe oublié</span>
        <span color="text.secondary" style={{ marginBottom: 3 }}>
          Saisissez votre email pour recevoir un lien de réinitialisation.
        </span>
        <AdminForgotPasswordForm />
      </div>
    </div>
  );
}
