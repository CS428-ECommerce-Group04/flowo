import { twMerge } from "tailwind-merge";
export default function Container({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={twMerge("mx-auto w-full px-4 sm:px-6 lg:px-8", className)}>{children}</div>;
}
