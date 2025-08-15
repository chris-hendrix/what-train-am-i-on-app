import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppContext } from '../context/AppContext';

interface LocationHeaderProps {
  title: string;
  showHomeButton?: boolean;
}

export function LocationHeader({ title, showHomeButton = true }: LocationHeaderProps) {
  const router = useRouter();
  const {
    location,
    locationLoading,
    locationError,
    getCurrentLocation,
  } = useAppContext();

  const showLocationInfo = () => {
    if (!location) {
      Alert.alert('Location', 'No location available');
      return;
    }
    
    Alert.alert(
      'Current Location',
      `Latitude: ${location.latitude.toFixed(6)}\nLongitude: ${location.longitude.toFixed(6)}\nAccuracy: ${location.accuracy ? Math.round(location.accuracy) + 'm' : 'Unknown'}`,
      [{ text: 'OK' }]
    );
  };

  const handleLocationPress = async () => {
    if (location && !locationLoading) {
      // If we have location, show info
      showLocationInfo();
    } else {
      // If no location or loading, request location
      await getCurrentLocation();
    }
  };

  const getLocationButtonText = () => {
    if (locationLoading) return '⟳';
    if (locationError) return '📍!';
    if (location) return '📍';
    return '📍?';
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
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      
      <View style={styles.buttonsContainer}>
        {showHomeButton && (
          <TouchableOpacity
            style={styles.homeButton}
            onPress={handleHomePress}
          >
            <Text style={styles.homeButtonText}>🏠</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={[styles.locationButton, { borderColor: getLocationButtonColor() }]}
          onPress={handleLocationPress}
          disabled={locationLoading}
        >
          <Text style={[styles.locationText, { color: getLocationButtonColor() }]}>
            {getLocationButtonText()}
          </Text>
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
    backgroundColor: '#fff',
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
  homeButtonText: {
    fontSize: 18,
  },
  locationButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationText: {
    fontSize: 16,
    fontWeight: '600',
  },
});