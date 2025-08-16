import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useAppContext } from '../context/AppContext';
import { LocationHeader } from './LocationHeader';

export function TrainSearchHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const { getRouteByLineCode } = useAppContext();
  
  // Extract lineCode from pathname (e.g., "/1" -> "1", "/N" -> "N")
  const lineCode = pathname.startsWith('/') ? pathname.slice(1) : pathname;
  const route = lineCode ? getRouteByLineCode(lineCode) : null;

  const renderTrainIndicator = () => {
    if (!route) return null;

    return (
      <View style={[
        styles.trainIndicator,
        { backgroundColor: route.color ? `#${route.color}` : '#666' }
      ]}>
        <Text style={[
          styles.trainCode,
          { color: route.textColor ? `#${route.textColor}` : 'white' }
        ]}>
          {route.shortName}
        </Text>
      </View>
    );
  };

  return (
    <LocationHeader
      title={renderTrainIndicator()}
      showBackButton={true}
      backAction={() => router.push('/')}
    />
  );
}

const styles = StyleSheet.create({
  trainIndicator: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trainCode: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});