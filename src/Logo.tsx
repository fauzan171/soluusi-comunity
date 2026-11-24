/**
 * Logo resmi Soluusi (asset dari soluusi.com/assets/media/brand/soluusi.svg)
 * `variant="white"` untuk background gelap/hijau.
 */
export default function Logo({ variant = "brand", className = "h-8" }: { variant?: "brand" | "white"; className?: string }) {
  return (
    <img
      src={variant === "white" ? "/brand/soluusi_white.svg" : "/brand/soluusi.svg"}
      alt="Soluusi"
      className={className}
    />
  );
}
