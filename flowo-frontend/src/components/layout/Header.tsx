import { Link } from "react-router-dom";

export default function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link to="/" className="font-extrabold text-green-700">Flowo</Link>
        <div className="space-x-4 text-slate-600">
          <Link to="/cart">🛒</Link>
          <button>☰</button>
        </div>
      </div>
    </header>
  );
}
