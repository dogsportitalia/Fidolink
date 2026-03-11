import logoImage from "@assets/fidolink_logo_orange.png";

export function Logo({ className = "w-11 h-11" }: { className?: string }) {
  return (
    <img
      src={logoImage}
      alt="FidoLink"
      className={className}
    />
  );
}
