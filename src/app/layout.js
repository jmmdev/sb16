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
        url: '/icons/favicon.ico',
        href: 'icons/favicon.ico'
      },
      {
        media: '(prefers-color-scheme: dark)',
        url: '/icons/favicon.ico',
        href: 'icons/favicon.ico'
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
