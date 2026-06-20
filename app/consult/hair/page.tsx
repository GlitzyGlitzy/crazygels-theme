'use client';

import { Wind } from 'lucide-react';
import { ConsultWithAvatar } from '@/components/consult/ConsultWithAvatar';

export default function HairConsultPage() {
  return (
    <ConsultWithAvatar
      consultType="hair"
      accent="#6B5B4F"
      Icon={Wind}
      title="Hair Analysis"
      placeholder="Tell me about your hair concerns"
      suggestions={['Dry & damaged', 'Frizzy hair', 'Thinning hair', 'Color-treated', 'Scalp issues', 'Curly care']}
    />
  );
}
