
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppKitProvider } from "../../context/appkit";
import { LocaleProvider } from "@/i18n/LocaleProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BaCi DApp",
  description: "BaCi DApp",
  icons: {
    icon: [{ url: "/BaCi_token_64x64.png", type: "image/png", sizes: "64x64" }],
    apple: [{ url: "/BaCi_token_64x64.png", type: "image/png", sizes: "64x64" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased`}
			>
				<LocaleProvider>
					<AppKitProvider>{children}</AppKitProvider>
				</LocaleProvider>
			</body>
    </html>
  );
}
