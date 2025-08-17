import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Platform } from 'react-native';
import { MapContainer, TileLayer, Marker, Circle, useMapEvents } from 'react-leaflet';
import { useAppContext } from '../context/AppContext';

// NYC default location (Times Square)
const NYC_CENTER: [number, number] = [40.7580, -73.9855];
const NYC_BOUNDS: [[number, number], [number, number]] = [
  [40.4774, -74.2591], // Southwest corner
  [40.9176, -73.7004], // Northeast corner
];

interface LocationPickerModalProps {
  visible: boolean;
  onClose: () => void;
}

// Component to handle map click events
function MapClickHandler({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      onLocationSelect(lat, lng);
    },
  });
  return null;
}

export function LocationPickerModal({ visible, onClose }: LocationPickerModalProps) {
  const { location, getCurrentLocation, setManualLocation } = useAppContext();
  const [selectedLocation, setSelectedLocation] = useState<[number, number] | null>(null);
  const [isUsingCurrentLocation, setIsUsingCurrentLocation] = useState(false);

  // Initialize selected location based on current location or NYC default
  useEffect(() => {
    if (visible) {
      if (location) {
        setSelectedLocation([location.latitude, location.longitude]);
        setIsUsingCurrentLocation(true);
      } else {
        setSelectedLocation(NYC_CENTER);
        setIsUsingCurrentLocation(false);
      }
    }
  }, [visible, location]);

  const handleLocationSelect = useCallback((lat: number, lng: number) => {
    setSelectedLocation([lat, lng]);
    setIsUsingCurrentLocation(false);
  }, []);

  const handleUseCurrentLocation = useCallback(async () => {
    await getCurrentLocation();
    if (location) {
      setSelectedLocation([location.latitude, location.longitude]);
      setIsUsingCurrentLocation(true);
    }
  }, [getCurrentLocation, location]);

  const handleConfirmLocation = useCallback(() => {
    if (selectedLocation) {
      // Update the app context with the manually selected location
      setManualLocation(selectedLocation[0], selectedLocation[1]);
      onClose();
    }
  }, [selectedLocation, setManualLocation, onClose]);

  // Only render on web platform for now
  if (Platform.OS !== 'web') {
    return (
      <Modal visible={visible} transparent animationType="slide">
        <View style={styles.webOnlyContainer}>
          <Text style={styles.webOnlyText}>Map picker is currently web-only</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Select Location</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.mapContainer}>
            {selectedLocation && (
              <MapContainer
                center={selectedLocation}
                zoom={15}
                style={{ height: '100%', width: '100%' }}
                maxBounds={NYC_BOUNDS}
                maxBoundsViscosity={1.0}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapClickHandler onLocationSelect={handleLocationSelect} />
                <Marker
                  position={selectedLocation}
                  draggable={true}
                  eventHandlers={{
                    dragend: (e) => {
                      const marker = e.target;
                      const position = marker.getLatLng();
                      handleLocationSelect(position.lat, position.lng);
                    },
                  }}
                />
                {/* Show accuracy circle for GPS location */}
                {isUsingCurrentLocation && location?.accuracy && (
                  <Circle
                    center={selectedLocation}
                    radius={location.accuracy}
                    pathOptions={{
                      color: '#007AFF',
                      fillColor: '#007AFF',
                      fillOpacity: 0.1,
                      weight: 2,
                    }}
                  />
                )}
              </MapContainer>
            )}
          </View>

          <View style={styles.controls}>
            <View style={styles.locationInfo}>
              {selectedLocation && (
                <>
                  <Text style={styles.coordinatesText}>
                    📍 {selectedLocation[0].toFixed(6)}, {selectedLocation[1].toFixed(6)}
                  </Text>
                  {isUsingCurrentLocation ? (
                    <View style={styles.statusContainer}>
                      <Text style={styles.statusText}>Using current GPS location</Text>
                      {location?.accuracy && (
                        <Text style={styles.accuracyText}>
                          Accuracy: ±{Math.round(location.accuracy)}m
                        </Text>
                      )}
                    </View>
                  ) : (
                    <Text style={styles.statusText}>Manually selected location</Text>
                  )}
                </>
              )}
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.currentLocationButton}
                onPress={handleUseCurrentLocation}
              >
                <Text style={styles.currentLocationButtonText}>Use Current Location</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.confirmButton, !selectedLocation && styles.confirmButtonDisabled]}
                onPress={handleConfirmLocation}
                disabled={!selectedLocation}
              >
                <Text style={styles.confirmButtonText}>Confirm Location</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    height: '80%',
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  mapContainer: {
    flex: 1,
  },
  controls: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  locationInfo: {
    marginBottom: 16,
    alignItems: 'center',
  },
  coordinatesText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  statusContainer: {
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    color: '#007AFF',
    fontStyle: 'italic',
  },
  accuracyText: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  currentLocationButton: {
    flex: 1,
    backgroundColor: '#F0F0F0',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  currentLocationButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: '#A0A0A0',
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  webOnlyContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  webOnlyText: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
});