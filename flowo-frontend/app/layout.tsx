import "./styles.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head><script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script></head>
      <body>{children}</body>
    </html>
  );
}
