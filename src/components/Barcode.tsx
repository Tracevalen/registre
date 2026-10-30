import { barcode } from "../lib/barcode";

export function Barcode({ value, className = "" }: { value: number; className?: string }) {
  const { bars, width } = barcode(value);
  return (
    <svg
      className={`barcode ${className}`}
      viewBox={`0 0 ${width} 10`}
      preserveAspectRatio="none"
      aria-hidden
    >
      {bars.map((b) => (
        <rect key={b.x} x={b.x} y={0} width={b.w} height={10} />
      ))}
    </svg>
  );
}
