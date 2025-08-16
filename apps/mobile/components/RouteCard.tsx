import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Route } from '@what-train/shared';

interface RouteCardProps {
  route: Route;
  widthPercent: number;
}

export function RouteCard({ route, widthPercent }: RouteCardProps) {
  const router = useRouter();
  
  const handlePress = () => {
    // Navigate to train search using the route's shortName (lineCode)
    router.push(`/trains/${route.shortName}`);
  };
  return (
    <TouchableOpacity
      style={[styles.card, { width: `${widthPercent}%` }]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={[
        styles.indicator,
        { backgroundColor: route.color ? `#${route.color}` : '#666' }
      ]}>
        <Text style={[
          styles.code,
          { color: route.textColor ? `#${route.textColor}` : 'white' }
        ]}>
          {route.shortName}
        </Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>
          {route.longName}
        </Text>
        <Text style={styles.type}>SUBWAY</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 120,
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 15,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  indicator: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  code: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  info: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
    lineHeight: 18,
  },
  type: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
  },
});