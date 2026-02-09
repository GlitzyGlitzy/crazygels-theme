/**
 * Crazy Gels brand logo - geometric egg/nail shape in rose gold.
 * Inline SVG so it works without external image files and renders crisp at any size.
 */
export function CrazyGelsIcon({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="cg-grad" x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="#C4868F" />
          <stop offset="100%" stopColor="#A15D67" />
        </linearGradient>
      </defs>
      {/* Outer egg/oval */}
      <ellipse cx="256" cy="276" rx="155" ry="185" fill="none" stroke="url(#cg-grad)" strokeWidth="16" />
      {/* Inner egg */}
      <ellipse cx="256" cy="244" rx="110" ry="145" fill="none" stroke="url(#cg-grad)" strokeWidth="14" />
      {/* Top petal */}
      <path
        d="M256 92 C208 170, 210 210, 256 244 C302 210, 304 170, 256 92Z"
        fill="none"
        stroke="url(#cg-grad)"
        strokeWidth="14"
        strokeLinejoin="round"
      />
      {/* Inner circle */}
      <circle cx="256" cy="330" r="72" fill="none" stroke="url(#cg-grad)" strokeWidth="14" />
      {/* Center vertical */}
      <line x1="256" y1="244" x2="256" y2="402" stroke="url(#cg-grad)" strokeWidth="12" />
      {/* Horizontal divider */}
      <line x1="184" y1="330" x2="328" y2="330" stroke="url(#cg-grad)" strokeWidth="12" />
    </svg>
  )
}

export function CrazyGelsLogo({ className = "" }: { className?: string }) {
  return (
    <span className={`flex items-center gap-2 md:gap-3 ${className}`}>
      <CrazyGelsIcon className="w-8 h-8 md:w-10 md:h-10" />
      <span className="text-xl md:text-2xl font-light tracking-[0.2em] text-[#2C2C2C]">
        CRAZY <span className="font-medium text-[#B76E79]">GELS</span>
      </span>
    </span>
  )
}
