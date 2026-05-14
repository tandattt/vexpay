import { LoaderCircle } from "lucide-react";
import clsx from "../../lib/clsx";

interface SpinnerProps {
  className?: string;
}

export default function Spinner({ className }: SpinnerProps) {
  return <LoaderCircle className={clsx("h-4 w-4 animate-spin", className)} />;
}
