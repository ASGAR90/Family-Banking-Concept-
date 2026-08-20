import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@fontsource-variable/fraunces/opsz.css";
import "@fontsource-variable/fraunces/opsz-italic.css";
import "@fontsource-variable/space-grotesk/wght.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sprout — Family money, together",
  description:
    "One widget for the whole circle: kids earn through chores, lessons and goals while parents watch it all — and friends split life's little bills.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
