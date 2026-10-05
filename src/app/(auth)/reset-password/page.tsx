import Link from 'next/link';
import { ClientLoginLayout } from '@/modules/auth/components/ClientLoginLayout';
import { ResetPasswordForm } from '@/modules/auth/components/ResetPasswordForm';
import styles from '@/modules/auth/components/client-login.module.css';
import { ROUTES } from '@/shared/constants/routes';
import { PASSWORD_POLICY_HINT } from '@/shared/schemas/auth.schema';

interface Props {
  searchParams: Promise<{ token?: string; email?: string }>;
}

export default async function ResetPasswordPage({ searchParams }: Props) {
  const { token, email } = await searchParams;

  return (
    <ClientLoginLayout>
      <section className={styles.form} aria-labelledby="reset-password-title">
        {!token || !email ? (
          <>
            <div>
              <h1 id="reset-password-title" className={styles.formTitle}>
                Lien invalide
              </h1>
              <p className={styles.formSubtitle}>
                Ce lien de réinitialisation est invalide ou a expiré.
              </p>
            </div>
            <p className={styles.accessRequest}>
              <Link href={ROUTES.auth.forgotPassword} className={styles.textLink}>
                Faire une nouvelle demande
              </Link>
            </p>
          </>
        ) : (
          <>
            <div>
              <h1 id="reset-password-title" className={styles.formTitle}>
                Nouveau mot de passe
              </h1>
              <p className={styles.formSubtitle}>{PASSWORD_POLICY_HINT}</p>
            </div>
            <ResetPasswordForm email={email} token={token} />
          </>
        )}
      </section>
    </ClientLoginLayout>
  );
}
