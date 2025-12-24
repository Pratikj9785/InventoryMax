import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata = {
  title: "InventoryMax",
  description: "Inventory Management System",
};

import Script from 'next/script';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 flex">
        <Script src="https://js.puter.com/v2/" strategy="beforeInteractive" />
        <Navbar />
        <main className="flex-1 ml-64 min-h-screen p-8">
          {children}
        </main>
      </body>
    </html>
  );
}
