import type { Metadata } from "next";
import { Poppins, Roboto } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "700"], // escolha os pesos que você precisa
});

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "OnLoveYou",
  description: "Crie um site eterno para o seu amor",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${poppins.className} ${roboto.className}`}>
        <link rel="shortcut icon" href="assets/heart-arrow.png" type="image/x-icon" />
        {children}
      </body>
    </html>
  );
}