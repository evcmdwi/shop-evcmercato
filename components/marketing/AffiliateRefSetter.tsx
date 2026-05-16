'use client';
import { useEffect } from 'react';
import { setRefCookie } from '@/lib/marketing/ref';

export default function AffiliateRefSetter({ refCode }: { refCode: string | null }) {
  useEffect(() => {
    if (refCode) {
      setRefCookie(refCode);
    }
  }, [refCode]);
  return null;
}
