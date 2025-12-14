import type { Metadata } from "next";
import "./globals.css";
import { UserProvider } from "@/lib/userContext";

export const metadata: Metadata = {
  title: "Banafarketmez - Online Oyunlar",
  description: "Taş Kağıt Makas, Tic Tac Toe ve daha fazlası",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body>
        <UserProvider>
          {children}
        </UserProvider>
      </body>
    </html>
  );
}

