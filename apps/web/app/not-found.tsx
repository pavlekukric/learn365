import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="shell" style={{ padding: '120px 0', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <p className="eyebrow">404</p>
      <h1 className="h1">Stranica nije pronađena</h1>
      <p className="body" style={{ maxWidth: 560 }}>
        Lekcija ili kurs ne postoji. Vrati se na početnu i pokušaj ponovo.
      </p>
      <Link href="/" className="small" style={{ color: 'var(--accent)', marginTop: 8 }}>
        ← Početna
      </Link>
    </div>
  );
}
