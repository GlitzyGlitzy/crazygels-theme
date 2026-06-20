'use client';

import { Droplets } from 'lucide-react';
import { ConsultWithAvatar } from '@/components/consult/ConsultWithAvatar';

export default function SkinConsultPage() {
  return (
    <ConsultWithAvatar
      consultType="skin"
      accent="#B76E79"
      Icon={Droplets}
      title="Skin Analysis"
      placeholder="Tell me about your skin concerns"
      suggestions={['Acne & breakouts', 'Aging concerns', 'Dry skin', 'Oily skin', 'Sensitive skin', 'Dark spots']}
    />
  );
}
