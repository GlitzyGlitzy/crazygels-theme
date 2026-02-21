'use client';

import dynamic from 'next/dynamic';

const ImportReviewsContent = dynamic(() => import('./import-reviews-content'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
      <div className="text-[#8A7B6F] text-sm">Loading importer...</div>
    </div>
  ),
});

export default function ImportReviewsPage() {
  return <ImportReviewsContent />;
}
