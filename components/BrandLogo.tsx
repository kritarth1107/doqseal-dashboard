"use client";

type BrandLogoProps = {
  className?: string;
  alt?: string;
};

/**
 * Shows the color logo in light mode and the white logo in dark mode.
 * Uses CSS `dark:` so it stays in sync with next-themes without hydration flicker.
 */
export function BrandLogo({
  className = "h-8 w-auto",
  alt = "DoqSeal",
}: BrandLogoProps) {
  return (
    <span className="inline-flex items-center shrink-0">
      <img
        src="/doqseal_logo.svg"
        alt={alt}
        className={`${className} dark:hidden`}
      />
      <img
        src="/doqseal_logo_white.svg"
        alt={alt}
        className={`${className} hidden dark:block`}
      />
    </span>
  );
}
