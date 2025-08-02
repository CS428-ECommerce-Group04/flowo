import { twMerge } from "tailwind-merge";
export default function Container({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={twMerge("mx-auto w-full max-w-5xl px-4", className)}>{children}</div>;
}
