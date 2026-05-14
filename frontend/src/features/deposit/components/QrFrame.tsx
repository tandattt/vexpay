import clsx from "../../../shared/lib/clsx";

interface Props {
  src: string;
  alt: string;
  size?: "sm" | "md";
}

export default function QrFrame({ src, alt, size = "md" }: Props) {
  return (
    <div className={clsx("qr-scan-frame", size === "md" ? "h-64 w-64" : "h-48 w-48")}>
      <span className="qr-scan-corner tl" />
      <span className="qr-scan-corner tr" />
      <span className="qr-scan-corner bl" />
      <span className="qr-scan-corner br" />
      <img src={src} alt={alt} className="qr-checkout-img h-full w-full rounded-xl p-2" />
    </div>
  );
}
