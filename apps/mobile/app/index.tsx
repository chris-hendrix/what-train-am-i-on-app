import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useAppContext } from '../context/AppContext';
import { ContentContainer } from '../components/ContentContainer';
import { RouteCard } from '../components/RouteCard';
import { useResponsive } from '../hooks/useResponsive';

export default function TrainSelectionScreen() {
  const { filteredRoutes, routesLoading, routesError, refreshRoutes, searchQuery, setSearchQuery } = useAppContext();
  const { isMobile, isTablet } = useResponsive();

  // Calculate responsive grid columns and card width
  const getGridColumns = () => {
    if (isMobile) return 2;
    if (isTablet) return 3;
    return 4; // desktop
  };

  const columns = getGridColumns();
  // Calculate card width as percentage for space-between layout
  // Account for space between items
  const cardWidthPercent = columns === 2 ? 48.5 : columns === 3 ? 32 : 24;


  if (routesLoading) {
    return (
      <View style={styles.container}>
        <StatusBar style="auto" />
        <ContentContainer>
          <View style={styles.loadingContainer}>
            <Text style={styles.message}>Loading train lines...</Text>
          </View>
        </ContentContainer>
      </View>
    );
  }

  if (routesError) {
    return (
      <View style={styles.container}>
        <StatusBar style="auto" />
        <ContentContainer>
          <View style={styles.loadingContainer}>
            <Text style={styles.error}>{routesError}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={refreshRoutes}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        </ContentContainer>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />

      <ContentContainer>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.routesContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search train lines..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="characters"
              autoCorrect={false}
            />
          </View>

          {filteredRoutes.length === 0 ? (
            <View style={styles.noResultsContainer}>
              <Text style={styles.noResultsText}>
                {searchQuery ? 'No train lines found matching your search' : 'No train lines available'}
              </Text>
            </View>
          ) : (
            <View style={styles.routesGrid}>
              {filteredRoutes.map((route) => (
                <RouteCard
                  key={route.id}
                  route={route}
                  widthPercent={cardWidthPercent}
                />
              ))}
            </View>
          )}
        </ScrollView>
      </ContentContainer>
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
    paddingHorizontal: 20,
    paddingBottom: 10,
    backgroundColor: '#fff',
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  routesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
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