import type { Metadata } from "next";
import { Providers } from "@/shared/lib/Providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Learneo",
  description: "Plateforme e-learning",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
