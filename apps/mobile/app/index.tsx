import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { useEffect, useState } from 'react';
import {
  Route,
  SuccessResponse,
  ErrorResponse
} from '@what-train/shared';
import { LocationButton } from '../components/LocationButton';

export default function HomeScreen() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        const response = await fetch('http://localhost:3000/routes');
        const data: SuccessResponse<{ routes: Route[] }> | ErrorResponse = await response.json();

        if (data.success && 'data' in data) {
          setRoutes(data.data.routes);
        } else {
          setError(data.error || 'Failed to load route data');
        }
      } catch {
        setError('Failed to connect to API');
      } finally {
        setLoading(false);
      }
    };

    fetchRoutes();
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Loading...</Text>
        <StatusBar style="auto" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>{error}</Text>
        <StatusBar style="auto" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.container}>
      <Text style={styles.title}>What Train Am I On?</Text>
      
      <LocationButton />
      
      <Text style={styles.sectionTitle}>NYC Subway Routes</Text>
      {routes.map((route) => (
        <View key={route.id} style={styles.routeContainer}>
          <View style={[styles.routeIndicator, { backgroundColor: route.color ? `#${route.color}` : '#666' }]}>
            <Text style={[styles.routeCode, { color: route.textColor ? `#${route.textColor}` : 'white' }]}>
              {route.shortName}
            </Text>
          </View>
          <View style={styles.routeInfo}>
            <Text style={styles.routeName}>{route.longName}</Text>
            <Text style={styles.routeType}>SUBWAY</Text>
          </View>
        </View>
      ))}
      <StatusBar style="auto" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    minHeight: '100%',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#333',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 30,
    marginBottom: 20,
    color: '#333',
  },
  message: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  error: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
  },
  routeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    marginBottom: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    width: '100%',
    maxWidth: 300,
  },
  routeIndicator: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  routeCode: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  routeInfo: {
    flex: 1,
  },
  routeName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  routeType: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
});