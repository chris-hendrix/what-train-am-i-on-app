import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useAppContext } from '../context/AppContext';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface LocationHeaderProps {
  title: string | React.ReactNode;
  showBackButton?: boolean;
  backAction?: () => void;
}

export function LocationHeader({ title, showBackButton = false, backAction }: LocationHeaderProps) {
  const insets = useSafeAreaInsets();
  const {
    location,
    locationError,
  } = useAppContext();
  


  const handleLocationDisplayPress = () => {
    console.log('TODO: Location display clicked');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
      <View style={styles.leftSection}>
        {showBackButton && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={backAction}
          >
            <Ionicons name="arrow-back" size={20} color="#007AFF" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.centerSection}>
        {typeof title === 'string' ? (
          <Text style={styles.title}>{title}</Text>
        ) : (
          <View style={styles.titleContainer}>
            {title}
          </View>
        )}
      </View>

      <View style={styles.buttonsContainer}>
        {location && (
          <TouchableOpacity
            style={[
              styles.locationDisplay,
              { backgroundColor: locationError ? '#FFD60A' : '#28A745' }
            ]}
            onPress={handleLocationDisplayPress}
          >
            <View style={styles.locationDisplayContent}>
              <Ionicons name="location" size={12} color="white" style={styles.locationIcon} />
              <View style={styles.locationCoordinates}>
                <Text style={styles.locationDisplayText}>{location.latitude.toFixed(4)}</Text>
                <Text style={styles.locationDisplayText}>{location.longitude.toFixed(4)}</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
        
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
    paddingVertical: 12,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    minHeight: 80,
  },
  leftSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  titleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonsContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
  },
  locationDisplay: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    maxWidth: 140,
  },
  locationDisplayContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationIcon: {
    marginRight: 4,
  },
  locationCoordinates: {
    flex: 1,
  },
  locationDisplayText: {
    fontSize: 9,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
    lineHeight: 12,
  },
});