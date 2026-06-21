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
      className={cn("inline-block", fullWidth ? "block w-full" : "w-full sm:w-auto", className)}
    >
      <Button
        type="button"
        size={size}
        variant="outline"
        className={cn(
          "group gap-2.5 rounded-full border border-emerald-400/30 bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-emerald-600/15 font-medium text-emerald-50 shadow-lg shadow-emerald-500/10 backdrop-blur-md transition-all duration-200 hover:scale-[1.02] hover:border-emerald-300/40 hover:from-emerald-500/25 hover:to-teal-500/20 hover:text-white hover:shadow-emerald-500/20",
          fullWidth && "w-full",
          !fullWidth && "w-full sm:w-auto",
          size === "lg" && "h-12 px-10 text-base",
          size === "default" && "h-11 px-8",
        )}
      >
        <span
          aria-hidden
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-sm transition-transform duration-200 group-hover:scale-110"
        >
          📱
        </span>
        Get Android app
      </Button>
    </a>
  );
}
