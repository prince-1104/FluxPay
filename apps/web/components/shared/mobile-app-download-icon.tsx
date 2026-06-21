import { cn } from "@/lib/utils";

type MobileAppDownloadIconProps = {
  className?: string;
};

export function MobileAppDownloadIcon({ className }: MobileAppDownloadIconProps) {
  return (
    <span className={cn("dl-app-icon", className)} aria-hidden>
      <span className="dl-app-icon-glow" />
      <svg viewBox="0 0 32 32" fill="none" className="dl-app-icon-svg" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="dlPhoneShadow" x1="8" y1="6" x2="24" y2="28" gradientUnits="userSpaceOnUse">
            <stop stopColor="#4C1D95" />
            <stop offset="1" stopColor="#2E1065" />
          </linearGradient>
          <linearGradient id="dlPhoneBody" x1="10" y1="4" x2="22" y2="26" gradientUnits="userSpaceOnUse">
            <stop stopColor="#C4B5FD" />
            <stop offset="0.45" stopColor="#8B5CF6" />
            <stop offset="1" stopColor="#6D28D9" />
          </linearGradient>
          <linearGradient id="dlPhoneScreen" x1="12" y1="8" x2="20" y2="22" gradientUnits="userSpaceOnUse">
            <stop stopColor="#1E1B4B" />
            <stop offset="1" stopColor="#0F172A" />
          </linearGradient>
          <linearGradient id="dlBadge" x1="18" y1="18" x2="28" y2="28" gradientUnits="userSpaceOnUse">
            <stop stopColor="#6EE7B7" />
            <stop offset="1" stopColor="#059669" />
          </linearGradient>
        </defs>

        {/* 3D depth layer */}
        <rect x="9.5" y="5.5" width="14" height="22" rx="3.5" fill="url(#dlPhoneShadow)" className="dl-app-icon-depth" />

        {/* Phone body */}
        <rect x="8" y="4" width="14" height="22" rx="3.5" fill="url(#dlPhoneBody)" stroke="rgba(255,255,255,0.35)" strokeWidth="0.75" />

        {/* Screen */}
        <rect x="10" y="7" width="10" height="16" rx="1.5" fill="url(#dlPhoneScreen)" />
        <text x="15" y="16.5" textAnchor="middle" fill="#DDD6FE" fontSize="7" fontWeight="700" fontFamily="system-ui, sans-serif">
          S
        </text>

        {/* Speaker */}
        <rect x="13.5" y="5.5" width="3" height="0.75" rx="0.375" fill="rgba(0,0,0,0.35)" />

        {/* Download badge */}
        <g className="dl-app-icon-badge">
          <circle cx="23" cy="23" r="6.5" fill="url(#dlBadge)" stroke="rgba(255,255,255,0.5)" strokeWidth="0.75" />
          <path
            d="M23 19.5V24.5M23 24.5L20.5 22M23 24.5L25.5 22"
            stroke="white"
            strokeWidth="1.35"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      </svg>
    </span>
  );
}
