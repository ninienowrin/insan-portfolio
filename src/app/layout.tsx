import type { Metadata } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["400", "500", "600"],
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
  weight: ["500", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "Insan Arafat Jahan | Radar Perception & Sensor Fusion Researcher",
  description:
    "PhD researcher at the University of Central Florida specializing in radar perception, sensor fusion, and deep learning for intelligent transportation systems.",
  keywords: [
    "Insan Arafat Jahan",
    "radar perception",
    "sensor fusion",
    "deep learning",
    "intelligent transportation systems",
    "UCF",
    "computer vision",
    "autonomous vehicles",
    "smart cities",
  ],
  authors: [{ name: "Insan Arafat Jahan" }],
  openGraph: {
    title: "Insan Arafat Jahan | Radar Perception & Sensor Fusion Researcher",
    description:
      "PhD researcher at UCF advancing radar perception and sensor fusion for safer, smarter transportation.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Insan Arafat Jahan | Radar Perception & Sensor Fusion Researcher",
    description:
      "PhD researcher at UCF advancing radar perception and sensor fusion for safer, smarter transportation.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Insan Arafat Jahan",
  jobTitle: "PhD Researcher",
  affiliation: {
    "@type": "Organization",
    name: "University of Central Florida",
  },
  description:
    "PhD researcher specializing in radar perception, sensor fusion, and deep learning for intelligent transportation systems.",
  email: "insanarafat.jahan@ucf.edu",
  url: "https://insanarafatjahan.com",
  sameAs: ["https://linkedin.com/in/insanarafat"],
  knowsAbout: [
    "Radar Perception",
    "Sensor Fusion",
    "Deep Learning",
    "Intelligent Transportation Systems",
    "Computer Vision",
    "Autonomous Vehicles",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="font-body antialiased">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <a href="#about" className="skip-to-content">
            Skip to content
          </a>
          <Navbar />
          <main>{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
