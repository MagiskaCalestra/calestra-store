import "./globals.css";
import Header from "@/components/Header";

export const metadata = {
  title: "Calestra Store",
  description: "Upptäck Calestras magiska kollektioner.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="sv">
      <body className="min-h-screen bg-gray-50 text-gray-900 font-sans">
        <Header />
        <main className="p-4">{children}</main>
      </body>
    </html>
  );
}// Placeholder for layout.js
