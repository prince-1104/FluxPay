import { Button } from "@/components/ui/button";
import { MOBILE_APK_FILENAME, MOBILE_APK_URL } from "@/lib/mobile-app";
import { cn } from "@/lib/utils";

type MobileAppDownloadButtonProps = {
  className?: string;
  size?: "default" | "sm" | "lg";
  fullWidth?: boolean;
};

export function MobileAppDownloadButton({
  className,
  size = "default",
  fullWidth = false,
}: MobileAppDownloadButtonProps) {
  return (
    <a
      href={MOBILE_APK_URL}
      download={MOBILE_APK_FILENAME}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(fullWidth && "block w-full", className)}
    >
      <Button
        type="button"
        size={size}
        variant="outline"
        className={cn(
          "gap-2 border-emerald-500/30 bg-emerald-500/10 text-emerald-100 hover:bg-emerald-500/20 hover:text-white",
          fullWidth && "w-full",
          size === "lg" && "px-8 text-base",
        )}
      >
        <span aria-hidden className="text-lg leading-none">
          📱
        </span>
        Get Android app
      </Button>
    </a>
  );
}
