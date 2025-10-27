'use client';

import RiskTriggersPanel from '../components/RiskTriggersPanel';
import { useUser } from '@clerk/nextjs';

export default function RiskTriggersPage() {
  const { user } = useUser();

  if (!user) return null;

  return <RiskTriggersPanel adminId={user.id} />;
}
