import type { Metadata } from "next";
import Script from "next/script";
import { initPixelScript } from "@/lib/marketing/pixel";
import { Geist, Geist_Mono, Montserrat, DM_Serif_Display } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/components/CartContext";
import { ToastContainer } from "@/components/Toast";
import ShopShell from "@/components/ShopShell";
import { AuthProvider } from "@/lib/auth/auth-context";
import { createClient } from "@/lib/supabase-server";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const dmSerif = DM_Serif_Display({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-dm-serif',
});

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "EVC Mercato",
  description: "Toko Online EVC Mercato — Distributor Resmi KKI Group, Terpercaya Sejak 2003.",
  verification: {
    google: '-YVK8Cppb5yd2e9KGYSoAbsDtOE6jG7Qd4NIbSJWo_0',
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} ${montserrat.variable} ${dmSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider initialUser={user}>
          <CartProvider>
            <ShopShell />
            {children}
            <ToastContainer />
          </CartProvider>
        </AuthProvider>
      {process.env.NEXT_PUBLIC_META_PIXEL_ID && (
        <Script id="meta-pixel-global" strategy="afterInteractive">
          {initPixelScript(process.env.NEXT_PUBLIC_META_PIXEL_ID)}
        </Script>
      )}
      </body>
    </html>
  );
}
