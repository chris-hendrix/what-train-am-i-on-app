import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useAppContext } from '../context/AppContext';

export function LocationButton() {
  const {
    location,
    locationLoading,
    locationError,
    getCurrentLocation,
  } = useAppContext();

  const handleLocationPress = async () => {
    await getCurrentLocation();
  };

  const showLocationInfo = () => {
    if (!location) return;
    
    Alert.alert(
      'Current Location',
      `Latitude: ${location.latitude.toFixed(6)}\nLongitude: ${location.longitude.toFixed(6)}\nAccuracy: ${location.accuracy ? Math.round(location.accuracy) + 'm' : 'Unknown'}`,
      [{ text: 'OK' }]
    );
  };

  const getButtonText = () => {
    if (locationLoading) return 'Getting Location...';
    if (location) return 'Update Location';
    return 'Get Location';
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, locationLoading && styles.buttonDisabled]}
        onPress={handleLocationPress}
        disabled={locationLoading}
      >
        <Text style={styles.buttonText}>{getButtonText()}</Text>
      </TouchableOpacity>

      {location && (
        <TouchableOpacity style={styles.infoButton} onPress={showLocationInfo}>
          <Text style={styles.infoText}>
            📍 {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
          </Text>
          <Text style={styles.accuracyText}>
            Accuracy: {location.accuracy ? Math.round(location.accuracy) + 'm' : 'Unknown'}
          </Text>
        </TouchableOpacity>
      )}

      {locationError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{locationError}</Text>
          <TouchableOpacity 
            style={styles.clearErrorButton} 
            onPress={() => {
              // Clear error by requesting location again
              getCurrentLocation();
            }}
          >
            <Text style={styles.clearErrorText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 150,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#A0A0A0',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  infoButton: {
    marginTop: 15,
    padding: 12,
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    alignItems: 'center',
  },
  infoText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  accuracyText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  errorContainer: {
    marginTop: 15,
    padding: 12,
    backgroundColor: '#FFE6E6',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF9999',
    alignItems: 'center',
  },
  errorText: {
    color: '#CC0000',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
  },
  clearErrorButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#CC0000',
    borderRadius: 4,
  },
  clearErrorText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
});