import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ragora | AI Knowledge OS",
  description:
    "Ragora turns documents, websites, and workflows into trusted AI assistants with analytics, security, and embeddable customer experiences.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
