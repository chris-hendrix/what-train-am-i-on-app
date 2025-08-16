import React from 'react';
import { useRouter } from 'expo-router';
import { LocationHeader } from './LocationHeader';

export function TrainSearchHeader() {
  const router = useRouter();

  return (
    <LocationHeader 
      title="Train Search" 
      showBackButton={true}
      backAction={() => router.push('/trains')}
    />
  );
}