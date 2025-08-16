import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppContext } from '../context/AppContext';
import { ContentContainer } from '../components/ContentContainer';

export default function HomeScreen() {
  const router = useRouter();
  
  // Get routes from global context
  const { routesLoading, routesFromCache, location, locationError } = useAppContext();

  const handleStartSearch = () => {
    router.push('/trains');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      
      <ContentContainer>
        <View style={styles.header}>
        <Text style={styles.title}>What Train Am I On?</Text>
        <Text style={styles.subtitle}>
          Find your exact train and see upcoming stops in real-time
        </Text>
      </View>
      
      <View style={styles.content}>
        {location && (
          <View style={styles.locationStatus}>
            <Text style={styles.locationText}>
              📍 Location: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
            </Text>
            {location.accuracy && (
              <Text style={styles.accuracyText}>
                Accuracy: {Math.round(location.accuracy)}m
              </Text>
            )}
          </View>
        )}
        
        {locationError && (
          <View style={styles.locationError}>
            <Text style={styles.locationErrorText}>
              Location: {locationError}
            </Text>
          </View>
        )}
        
        <View style={styles.actionSection}>
          <Text style={styles.actionTitle}>Ready to find your train?</Text>
          <TouchableOpacity
            style={[styles.startButton, routesLoading && styles.startButtonLoading]}
            onPress={handleStartSearch}
            disabled={routesLoading}
          >
            <Text style={styles.startButtonText}>
              {routesLoading ? 'Loading Routes...' : 'Select Train Line'}
            </Text>
          </TouchableOpacity>
          {routesFromCache && !routesLoading && (
            <Text style={styles.cacheStatus}>Routes loaded from cache</Text>
          )}
        </View>
        
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>How it works:</Text>
          <View style={styles.stepContainer}>
            <Text style={styles.stepNumber}>1</Text>
            <Text style={styles.stepText}>Select your train line</Text>
          </View>
          <View style={styles.stepContainer}>
            <Text style={styles.stepNumber}>2</Text>
            <Text style={styles.stepText}>Choose direction (optional)</Text>
          </View>
          <View style={styles.stepContainer}>
            <Text style={styles.stepNumber}>3</Text>
            <Text style={styles.stepText}>Get real-time train information</Text>
          </View>
        </View>
        </View>
      </ContentContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 30,
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 20,
  },
  actionSection: {
    alignItems: 'center',
    marginVertical: 30,
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  startButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  startButtonLoading: {
    backgroundColor: '#A0A0A0',
    shadowOpacity: 0.1,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  cacheStatus: {
    fontSize: 12,
    color: '#28a745',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  infoSection: {
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepNumber: {
    width: 28,
    height: 28,
    backgroundColor: '#007AFF',
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 28,
    borderRadius: 14,
    marginRight: 12,
  },
  stepText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  locationStatus: {
    backgroundColor: '#e8f5e8',
    borderRadius: 12,
    padding: 15,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#c3e6c3',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2d5a2d',
    textAlign: 'center',
  },
  accuracyText: {
    fontSize: 12,
    color: '#5a7a5a',
    marginTop: 4,
  },
  locationError: {
    backgroundColor: '#fdeaea',
    borderRadius: 12,
    padding: 15,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#f5c6c6',
    alignItems: 'center',
  },
  locationErrorText: {
    fontSize: 14,
    color: '#d63384',
    textAlign: 'center',
  },
});