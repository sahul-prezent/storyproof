import type { Metadata } from "next";
import { DM_Sans, Nunito_Sans, Geist_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

// Headings — matches Luxoragrotesk (Prezent's heading font)
const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

// Body/paragraphs — matches Helixa (Prezent's body font)
const nunitoSans = Nunito_Sans({
  variable: "--font-nunito-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "StoryProof — Presentation Storytelling Scorer",
  description:
    "Upload your BioPharma presentation and get a scored diagnostic report in 60 seconds. 36 signals, 7 categories, specific evidence-based feedback.",
  openGraph: {
    title: "StoryProof — Presentation Storytelling Scorer",
    description:
      "Get a scored diagnostic report for your presentation in 60 seconds.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${nunitoSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground font-body">
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
