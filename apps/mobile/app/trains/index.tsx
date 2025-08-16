import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useAppContext } from '../../context/AppContext';
import { ContentContainer } from '../../components/ContentContainer';
import { RouteCard } from '../../components/RouteCard';
import { useResponsive } from '../../hooks/useResponsive';

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
  // Calculate card width as percentage (ensuring we never go below 2 columns)
  // Use slightly smaller percentages to ensure proper wrapping
  const cardWidthPercent = columns === 2 ? 47 : columns === 3 ? 31 : 23;


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
    gap: 12, // Modern gap property for consistent spacing
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