import { Loader2, X } from "lucide-react";

interface Props {
  loading: boolean;
  onClick: () => void;
}

export default function CheckoutCancelButton({ loading, onClick }: Props) {
  return (
    <button
      type="button"
      disabled={loading}
      onClick={onClick}
      className="checkout-cancel mx-auto mt-8 flex items-center gap-2 text-sm font-medium"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
      Hủy giao dịch
    </button>
  );
}
