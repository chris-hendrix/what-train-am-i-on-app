import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { Route } from '@what-train/shared';
import { useAppContext } from '../../context/AppContext';

export default function TrainSelectionScreen() {
  const router = useRouter();
  const { routes, routesLoading, routesError, refreshRoutes } = useAppContext();
  const [filteredRoutes, setFilteredRoutes] = useState<Route[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredRoutes(routes);
    } else {
      const filtered = routes.filter(route =>
        route.shortName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        route.longName.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredRoutes(filtered);
    }
  }, [searchQuery, routes]);

  const handleRouteSelect = (route: Route) => {
    // Navigate to direction selection using the new route structure
    router.push(`/trains/${route.shortName}`);
  };

  if (routesLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.message}>Loading train lines...</Text>
        <StatusBar style="auto" />
      </View>
    );
  }

  if (routesError) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.error}>{routesError}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={refreshRoutes}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
        <StatusBar style="auto" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      
      <View style={styles.header}>
        <Text style={styles.title}>Select Your Train Line</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search train lines..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="characters"
          autoCorrect={false}
        />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.routesContainer}
        showsVerticalScrollIndicator={false}
      >
        {filteredRoutes.length === 0 ? (
          <View style={styles.noResultsContainer}>
            <Text style={styles.noResultsText}>
              {searchQuery ? 'No train lines found matching your search' : 'No train lines available'}
            </Text>
          </View>
        ) : (
          <View style={styles.routesGrid}>
            {filteredRoutes.map((route) => (
              <TouchableOpacity
                key={route.id}
                style={styles.routeCard}
                onPress={() => handleRouteSelect(route)}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.routeIndicator,
                  { backgroundColor: route.color ? `#${route.color}` : '#666' }
                ]}>
                  <Text style={[
                    styles.routeCode,
                    { color: route.textColor ? `#${route.textColor}` : 'white' }
                  ]}>
                    {route.shortName}
                  </Text>
                </View>
                <View style={styles.routeInfo}>
                  <Text style={styles.routeName} numberOfLines={2}>
                    {route.longName}
                  </Text>
                  <Text style={styles.routeType}>SUBWAY</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 15,
  },
  searchInput: {
    height: 45,
    borderWidth: 1,
    borderColor: '#d0d0d0',
    borderRadius: 12,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  routesContainer: {
    padding: 20,
    paddingTop: 10,
  },
  routesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  routeCard: {
    width: '48%',
    aspectRatio: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 15,
    marginBottom: 15,
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
  routeIndicator: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  routeCode: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  routeInfo: {
    alignItems: 'center',
    flex: 1,
  },
  routeName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
    lineHeight: 18,
  },
  routeType: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
  },
  message: {
    fontSize: 18,
    color: '#333',
    textAlign: 'center',
  },
  error: {
    fontSize: 16,
    color: '#d32f2f',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  noResultsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  noResultsText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});