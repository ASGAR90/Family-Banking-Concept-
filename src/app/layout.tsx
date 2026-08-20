import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "@fontsource-variable/fraunces/opsz.css";
import "@fontsource-variable/fraunces/opsz-italic.css";
import "@fontsource-variable/space-grotesk/wght.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sprout — Family money, together",
  description:
    "A mobile family bank: kids earn through chores, lessons and goals while parents watch it all. Friends split the bill — on a ledger that never touches the kids.",
  appleWebApp: {
    capable: true,
    title: "Sprout",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#07090c",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
