import { ClientLoginLayout } from '@/modules/auth/components/ClientLoginLayout';
import { ForgotPasswordForm } from '@/modules/auth/components/ForgotPasswordForm';
import styles from '@/modules/auth/components/client-login.module.css';

export default function ForgotPasswordPage() {
  return (
    <ClientLoginLayout>
      <section className={styles.form} aria-labelledby="forgot-password-title">
        <div>
          <h1 id="forgot-password-title" className={styles.formTitle}>
            Mot de passe oublié
          </h1>
          <p className={styles.formSubtitle}>
            Entrez votre email pour recevoir un lien de réinitialisation.
          </p>
        </div>
        <ForgotPasswordForm />
      </section>
    </ClientLoginLayout>
  );
}
