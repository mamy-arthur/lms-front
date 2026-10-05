'use client';

import { BookOpen, GraduationCap, Layers3, ShieldCheck } from 'lucide-react';
import Image from 'next/image';
import { useId, useState, type ReactNode } from 'react';
import { useTenant } from '@/shared/hooks/useTenant';
import styles from './client-login.module.css';

/** Original, decorative artwork: no external image or tenant data required. */
function LearningArtwork() {
  const id = useId();

  return (
    <div className={styles.artwork} aria-hidden="true">
      <svg viewBox="0 0 640 580" fill="none" focusable="false">
        <defs>
          <linearGradient
            id={`${id}-ribbon`}
            x1="75"
            y1="380"
            x2="555"
            y2="135"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="color-mix(in srgb, var(--color-primary) 20%, #000)" />
            <stop offset=".32" stopColor="var(--color-primary)" />
            <stop offset=".64" stopColor="color-mix(in srgb, var(--color-primary) 30%, #fff)" />
            <stop offset=".82" stopColor="var(--color-primary)" />
            <stop offset="1" stopColor="color-mix(in srgb, var(--color-primary) 35%, #000)" />
          </linearGradient>
          <linearGradient
            id={`${id}-edge`}
            x1="110"
            y1="440"
            x2="530"
            y2="160"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="var(--color-primary)" stopOpacity="0" />
            <stop offset=".52" stopColor="color-mix(in srgb, var(--color-primary) 12%, #fff)" />
            <stop offset="1" stopColor="var(--color-primary)" stopOpacity=".15" />
          </linearGradient>
        </defs>
        <g transform="rotate(-24 320 290)">
          <ellipse cx="320" cy="280" rx="282" ry="160" stroke="white" strokeOpacity=".06" />
          <ellipse cx="320" cy="280" rx="246" ry="130" stroke="white" strokeOpacity=".09" />
          <path
            d="M 25 300 C 25 76 615 76 615 300 L 615 338 C 615 114 25 114 25 338 Z"
            fill={`url(#${id}-ribbon)`}
          />
          <path d="M 25 300 C 25 76 615 76 615 300" stroke={`url(#${id}-edge)`} strokeWidth="1.5" />
          <path
            d="M 55 330 C 55 138 585 138 585 330 L 585 364 C 585 172 55 172 55 364 Z"
            fill={`url(#${id}-ribbon)`}
          />
          <path
            d="M 55 330 C 55 138 585 138 585 330"
            stroke={`url(#${id}-edge)`}
            strokeWidth="1.5"
          />
          <path
            d="M 90 355 C 90 204 550 204 550 355 L 550 388 C 550 237 90 237 90 388 Z"
            fill={`url(#${id}-ribbon)`}
          />
          <path
            d="M 90 355 C 90 204 550 204 550 355"
            stroke={`url(#${id}-edge)`}
            strokeWidth="1.5"
          />
          <path
            d="M 125 380 C 125 266 515 266 515 380 L 515 411 C 515 297 125 297 125 411 Z"
            fill={`url(#${id}-ribbon)`}
          />
          <path
            d="M 125 380 C 125 266 515 266 515 380"
            stroke={`url(#${id}-edge)`}
            strokeWidth="1.5"
          />
        </g>
      </svg>
      <div className={styles.learningTile}>
        <GraduationCap size={34} strokeWidth={1.25} />
      </div>
      <div className={styles.smallTile}>
        <BookOpen size={21} strokeWidth={1.4} />
      </div>
      <span className={styles.sparkle}>✦</span>
    </div>
  );
}

export function ClientLoginLayout({ children }: { children: ReactNode }) {
  const { tenantName, branding } = useTenant();
  const logoUrl = branding?.logo_url?.trim();
  const [failedLogo, setFailedLogo] = useState<string>();
  const showLogo = Boolean(logoUrl && failedLogo !== logoUrl);

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <aside className={styles.visual} aria-labelledby="login-inspiration">
          <div className={styles.visualHeader}></div>

          <LearningArtwork />

          <div className={styles.visualCopy}>
            <span className={styles.visualKicker}>Votre prochain chapitre commence ici</span>
            <h2 id="login-inspiration" className={styles.visualTitle}>
              Chaque jour,
              <br />
              un peu plus <em>loin.</em>
            </h2>
            <p className={styles.visualDescription}>
              Des connaissances qui inspirent.
              <br />
              Des compétences qui font la différence.
            </p>
            <div className={styles.visualFooter}>
              <span>Apprendre. Pratiquer. Évoluer.</span>
              <span className={styles.footerMark} aria-hidden="true">
                <Layers3 size={18} strokeWidth={1.5} />
              </span>
            </div>
          </div>
        </aside>

        <div className={styles.formPanel}>
          <header className={styles.brandHeader}>
            <div className={styles.brand}>
              {showLogo && logoUrl ? (
                <Image
                  src={logoUrl}
                  alt={tenantName}
                  width={144}
                  height={48}
                  unoptimized
                  className={styles.brandLogo}
                  onError={() => setFailedLogo(logoUrl)}
                />
              ) : (
                <span className={styles.brandIcon} aria-hidden="true">
                  <Layers3 size={24} strokeWidth={1.6} />
                </span>
              )}
              <div className={styles.brandCopy}>
                <p className={styles.brandName}>{tenantName}</p>
                <p className={styles.brandCaption}>Espace formation</p>
              </div>
            </div>
          </header>

          <div className={styles.formContent}>{children}</div>

          <footer className={styles.pageFooter}>
            <span>
              Propulsé par <strong>Learneo</strong>
            </span>
            <span className={styles.securityNote}>
              <ShieldCheck size={14} aria-hidden="true" />
              Connexion sécurisée
            </span>
          </footer>
        </div>
      </div>
    </main>
  );
}
