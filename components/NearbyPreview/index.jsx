'use client';

import React from 'react';
import { fxConfig } from '@/lib/fxConfig';
import NearbyCards from '@/components/NearbyCards';
import NearbyAttractions from '@/components/NearbyAttractions';

export default function NearbyPreview({ items = [] }) {
  // Feature flag check (TASK 10 Section 6)
  if (fxConfig.nearbyCards) {
    return <NearbyCards items={items} />;
  }
  return <NearbyAttractions items={items} showEmptyState={false} />;
}
