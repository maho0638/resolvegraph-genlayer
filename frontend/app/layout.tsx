import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "ResolveGraph — Multi-Agent Workflow Settlement",
  description:
    "GenLayer-native fault attribution, evidence adjudication and GEN settlement for multi-agent workflows.",
};

const nav = [
  ["/", "Overview"],
  ["/workflows/new", "Build workflow"],
  ["/operate", "Operate"],
  ["/explorer", "Explorer"],
  ["/participants", "Participants"],
  ["/developers", "Developers"],
  ["/proof", "Proof"],
] as const;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="topbar">
          <Link href="/" className="brand">
            <span className="brandMark">RG</span>
            <span>ResolveGraph</span>
          </Link>
          <nav>
            {nav.map(([href, label]) => (
              <Link key={href} href={href}>{label}</Link>
            ))}
          </nav>
          <span className="networkPill">GenLayer · pre-production</span>
        </header>
        <main>{children}</main>
        <footer>
          <strong>ResolveGraph</strong>
          <span>Multi-agent commitments · evidence · fault attribution · settlement</span>
        </footer>
      </body>
    </html>
  );
}
