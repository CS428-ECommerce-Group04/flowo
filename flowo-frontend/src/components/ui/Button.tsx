import { Link } from "react-router-dom";
import { twMerge } from "tailwind-merge";

type Props = {
  children: React.ReactNode;
  to?: string;
  onClick?: () => void;
  variant?: "primary" | "outline";
  className?: string;
  type?: "button" | "submit";
};

export default function Button({ children, to, onClick, variant = "primary", className = "", type = "button" }: Props) {
  const base = "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-semibold transition";
  const style = variant === "primary" ? "bg-green-700 text-white hover:bg-green-800" : "border border-slate-300 text-slate-700 hover:bg-slate-50";
  const cls = twMerge(base, style, className);
  return to ? <Link to={to} className={cls}>{children}</Link> : <button type={type} onClick={onClick} className={cls}>{children}</button>;
}
