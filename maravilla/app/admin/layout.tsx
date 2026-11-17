export const metadata = { title: "Gestione · Maravilla", robots: { index: false, follow: false } };

export default function AdminRoot({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto min-h-screen max-w-2xl px-5 py-6">{children}</div>;
}
