import { Outfit } from "next/font/google";
import "./globals.css";

const myFont = Outfit({
  variable: "--my-font",
  subsets: ["latin"],
});

export const metadata = {
  title: "SB16",
  description: "Top 8 & 16 creator for SSBU",
  icons: {
    icon: [
      {
        media: '(prefers-color-scheme: light)',
        url: '/assets/icons/favicon-light.png',
        href: '/assets/icons/favicon-light.png'
      },
      {
        media: '(prefers-color-scheme: dark)',
        url: '/assets/icons/favicon-dark.png',
        href: '/assets/icons/favicon-dark.png'
      }
    ]
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${myFont.variable} overflow-hidden bg-zinc-950 font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
