import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppContext } from '../context/AppContext';
import { useFindNearestTrains } from '../hooks/useFindNearestTrains';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface LocationHeaderProps {
  title: string;
}

export function LocationHeader({ title }: LocationHeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    location,
    locationLoading,
    locationError,
    getCurrentLocation,
  } = useAppContext();
  
  const { findNearestTrains } = useFindNearestTrains();


  const handleLocationPress = async () => {
    // Always refresh location and fetch nearest trains
    await getCurrentLocation();
    
    // Call nearest trains endpoint if we have location
    if (location) {
      await findNearestTrains({
        latitude: location.latitude,
        longitude: location.longitude,
        radiusMeters: 500 // 500 meter radius
      });
    }
  };


  const getLocationButtonColor = () => {
    if (locationLoading) return '#007AFF';
    if (locationError) return '#FF3B30';
    if (location) return '#34C759';
    return '#8E8E93';
  };

  const handleHomePress = () => {
    router.push('/');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
      <Text style={styles.title}>{title}</Text>

      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={styles.homeButton}
          onPress={handleHomePress}
        >
          <Ionicons name="home" size={20} color="#007AFF" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.locationButton}
          onPress={handleLocationPress}
          disabled={locationLoading}
        >
          <Ionicons 
            name="refresh" 
            size={20} 
            color={getLocationButtonColor()} 
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  buttonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  homeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  locationButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});