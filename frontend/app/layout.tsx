import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "ResolveGraph — Multi-Agent Workflow Settlement",
  description:
    "GenLayer-native dependency-aware adjudication, fault attribution and GEN settlement for multi-agent workflows.",
  icons: {
    icon: "/resolvegraph-icon.webp",
    shortcut: "/resolvegraph-icon.webp",
  },
};

const nav = [
  ["/", "Overview"],
  ["/workflows/new", "Build"],
  ["/recipes", "Recipes"],
  ["/operate", "Operate"],
  ["/explorer", "Explorer"],
  ["/reviewer", "Review"],
  ["/participants", "Participants"],
  ["/provenance", "Provenance"],
  ["/developers", "Developers"],
  ["/proof", "Proof"],
] as const;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const production = process.env.VERCEL_ENV === "production";

  return (
    <html lang="en">
      <body>
        <header className="topbar">
          <Link href="/" className="brand" aria-label="ResolveGraph home">
            <img
              src="/resolvegraph-logo.webp"
              alt="ResolveGraph"
              className="brandLogo"
            />
          </Link>
          <nav aria-label="Primary">
            {nav.map(([href, label]) => (
              <Link key={href} href={href}>{label}</Link>
            ))}
          </nav>
          <span className="networkPill">
            <span className="liveDot" aria-hidden="true" />
            {production ? "Production UI" : "Preview"} · Studionet
          </span>
        </header>
        <main>{children}</main>
        <footer>
          <img
            src="/resolvegraph-logo.webp"
            alt="ResolveGraph"
            className="footerLogo"
          />
          <span>Dependency-aware evidence · causal fault attribution · deterministic settlement</span>
        </footer>
      </body>
    </html>
  );
}
