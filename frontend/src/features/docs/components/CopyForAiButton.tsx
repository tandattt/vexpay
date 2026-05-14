import { useState } from "react";
import { Check, Sparkles } from "lucide-react";
import { Button } from "../../../shared/components/ui";

interface Props {
  getMarkdown: () => string;
  className?: string;
}

export default function CopyForAiButton({ getMarkdown, className }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(getMarkdown());
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={className}
      leftIcon={
        copied ? (
          <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
        ) : (
          <Sparkles className="h-3.5 w-3.5" />
        )
      }
      onClick={() => void handleCopy()}
    >
      {copied ? "Đã copy" : "Sao chép cho AI"}
    </Button>
  );
}
