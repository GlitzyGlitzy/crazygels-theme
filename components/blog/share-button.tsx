'use client';

import { Share2 } from 'lucide-react';

export function ShareButton({ title }: { title: string }) {
  const handleShare = () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({
        title: title,
        url: window.location.href,
      });
    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <button
      className="flex items-center gap-2 text-[#2C2C2C]/60 hover:text-[#D4AF37] transition-colors"
      onClick={handleShare}
    >
      <Share2 className="w-4 h-4" />
      Share
    </button>
  );
}
