import type { Metadata } from "next";
import { Lexend } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/lib/theme";
import { Layout } from "@/components/layout/Layout";
import Head from "next/head";
import { url } from "inspector";

const lexend = Lexend({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Exira DeFi Protocol",
  description:
    "Bringing global real-estate investment on-chain. Borrow, invest, earn and trade REITs with Exira Protocol",

  // ✅ Open Graph (For Social Media Sharing)
  openGraph: {
    title: "Exira DeFi Protocol",
    description:
      "Bringing global real-estate investment on-chain. Borrow, invest, earn and trade REITs with Exira Protocol",
    url: "https://app.exira.io",
    siteName: "Exira DeFi Protocol",
    images: [
      {
        url: "/banner.png", // Make sure this image exists in public/
        width: 1200,
        height: 630,
        alt: "Exira DeFi Protocol Banner",
      },
    ],
    type: "website",
  },

  // ✅ Twitter Card (For Twitter Previews)
  twitter: {
    card: "summary_large_image",
    site: "@exira",
    creator: "@exira",
    title: "Exira DeFi Protocol",
    description:
      "Bringing global real-estate investment on-chain. Borrow, invest, earn and trade REITs with Exira Protocol",
    images: ["/favicon.png"], // Ensure this image exists
  },

  // ✅ Canonical URL (For SEO)
  alternates: {
    canonical: "https://app.exira.io",
  },

  // ✅ Icons (Favicon, Apple Touch Icon, etc.)
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
    shortcut: "/favicon.png",
  },

  // ✅ Robots.txt (For SEO & Indexing)
  robots: {
    index: true, // Allow search engines to index the page
    follow: true, // Allow following links
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
    },
  },

  // ✅ Theme Color (For Mobile Browser UI)
  themeColor: "#000000",

  // ✅ Keywords (For SEO - Optional)
  keywords: ["Real Estate", "Blockchain", "DeFi", "Investment", "Exira"],

  // ✅ Viewport Meta Tag (For Responsive Design)
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",

  // ✅ Apple Meta Tags (For PWA/Standalone Apps)
  appleWebApp: {
    capable: true,
    title: "Exira DeFi",
    statusBarStyle: "black-translucent",
  },

  // ✅ Manifest (For PWA support)
  manifest: "/site.webmanifest",
};

// redefine console.log to an empty function
if (process.env.NEXT_PUBLIC_APP_ENV !== "devnet") {
  console.log("Production Environment");
  console.log = () => {};
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${lexend.className} bg-gray-100 dark:bg-gray-900`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <Layout>{children}</Layout>
        </ThemeProvider>
      </body>
    </html>
  );
}
