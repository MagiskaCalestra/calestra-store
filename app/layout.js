export const metadata = {
  title: 'Calestra Store',
  description: 'Välkommen till Calestras officiella butik!',
};

export default function RootLayout({ children }) {
  return (
    <html lang="sv">
      <body style={{ fontFamily: 'sans-serif', margin: 0, padding: 20 }}>
        {children}
      </body>
    </html>
  );
}
