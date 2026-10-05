import Link from 'next/link';
import { ClientLoginLayout } from '@/modules/auth/components/ClientLoginLayout';
import { ActivateAccountForm } from '@/modules/auth/components/ActivateAccountForm';
import styles from '@/modules/auth/components/client-login.module.css';
import { ROUTES } from '@/shared/constants/routes';
import { PASSWORD_POLICY_HINT } from '@/shared/schemas/auth.schema';

interface Props {
  searchParams: Promise<{ token?: string; email?: string }>;
}

export default async function ActivateAccountPage({ searchParams }: Props) {
  const { token, email } = await searchParams;

  return (
    <ClientLoginLayout>
      <section className={styles.form} aria-labelledby="activate-account-title">
        {!token || !email ? (
          <>
            <div>
              <h1 id="activate-account-title" className={styles.formTitle}>
                Lien d&apos;activation invalide
              </h1>
              <p className={styles.formSubtitle}>
                Ce lien d&apos;activation est invalide ou a expiré. Rapprochez-vous de votre
                administrateur pour recevoir un nouveau mail d&apos;activation.
              </p>
            </div>
            <p className={styles.accessRequest}>
              <Link href={ROUTES.auth.login} className={styles.textLink}>
                Retour à la connexion
              </Link>
            </p>
          </>
        ) : (
          <>
            <div>
              <h1 id="activate-account-title" className={styles.formTitle}>
                Activez votre compte
              </h1>
              <p className={styles.formSubtitle}>{PASSWORD_POLICY_HINT}</p>
            </div>
            <ActivateAccountForm email={email} token={token} />
          </>
        )}
      </section>
    </ClientLoginLayout>
  );
}
