import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useEffect, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useAppContext } from '../context/AppContext';
import { useFindNearestTrains } from '../hooks/useFindNearestTrains';
import { Route, TrainData, NextStop } from '@what-train/shared';
import { ContentContainer } from '../components/ContentContainer';
import { API_CONFIG, formatRadius } from '../constants/api';

interface DirectionInfo {
  direction: number;
  label: string;
  headsigns: string[];
}

export default function TrainSearchScreen() {
  const params = useLocalSearchParams<{
    lineCode: string;
  }>();
  
  const { 
    location, 
    getRouteByLineCode 
  } = useAppContext();
  const { findNearestTrains, loading: searchingTrains, error: searchError, clearError, results } = useFindNearestTrains();
  const [route, setRoute] = useState<Route | null>(null);
  const [directionsInfo, setDirectionsInfo] = useState<DirectionInfo[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedDirection, setSelectedDirection] = useState<'uptown' | 'downtown' | null>(null);

  // Load route info and process headsigns
  useEffect(() => {
    if (params.lineCode) {
      const selectedRoute = getRouteByLineCode(params.lineCode);
      if (selectedRoute) {
        setRoute(selectedRoute);
        
        if (selectedRoute.headsigns) {
          // Process headsigns into direction info
          const directionMap = new Map<number, string[]>();
          
          Object.entries(selectedRoute.headsigns).forEach(([headsign, direction]) => {
            if (!directionMap.has(direction)) {
              directionMap.set(direction, []);
            }
            directionMap.get(direction)!.push(headsign);
          });

          const directionInfo: DirectionInfo[] = Array.from(directionMap.entries()).map(([dir, headsigns]) => ({
            direction: dir,
            label: dir === 0 ? 'Uptown & Bronx' : 'Downtown & Brooklyn',
            headsigns: headsigns.sort()
          }));

          setDirectionsInfo(directionInfo);
        }
      }
    }
  }, [params.lineCode, getRouteByLineCode]);

  // Auto-search trains when route and location are available
  useEffect(() => {
    const performSearch = async () => {
      if (route && location && !hasSearched && !searchingTrains) {
        setHasSearched(true);
        clearError();

        const requestParams = {
          latitude: location.latitude,
          longitude: location.longitude,
          lineCode: params.lineCode,
        };

        await findNearestTrains(requestParams);
      }
    };

    performSearch();
  }, [route, location, hasSearched, searchingTrains, params.lineCode, findNearestTrains, clearError]);

  const handleRefresh = async () => {
    if (route && location) {
      clearError();
      const requestParams = {
        latitude: location.latitude,
        longitude: location.longitude,
        lineCode: params.lineCode,
      };
      await findNearestTrains(requestParams);
    }
  };

  const handleDirectionFilter = (direction: 'uptown' | 'downtown' | null) => {
    if (selectedDirection === direction) {
      // If clicking the same direction, unselect it
      setSelectedDirection(null);
    } else {
      setSelectedDirection(direction);
    }
  };

  const filteredTrains = results?.trains?.filter((train: TrainData) => {
    if (!selectedDirection) return true;
    
    const isUptown = train.direction.toLowerCase().includes('uptown') || 
                    train.direction.toLowerCase().includes('bronx');
    const isDowntown = train.direction.toLowerCase().includes('downtown') || 
                      train.direction.toLowerCase().includes('brooklyn');
    
    if (selectedDirection === 'uptown') return isUptown;
    if (selectedDirection === 'downtown') return isDowntown;
    return true;
  }) || [];

  if (searchingTrains) {
    return (
      <View style={styles.container}>
        <StatusBar style="auto" />
        <ContentContainer>
          <View style={styles.loadingContainer}>
            <Text style={styles.message}>Searching for trains within {formatRadius(API_CONFIG.DEFAULT_SEARCH_RADIUS_METERS)}...</Text>
            <Text style={styles.subMessage}>This may take a few seconds</Text>
          </View>
        </ContentContainer>
      </View>
    );
  }

  if (!location) {
    return (
      <View style={styles.container}>
        <StatusBar style="auto" />
        <ContentContainer>
          <View style={styles.loadingContainer}>
            <Text style={styles.message}>Waiting for location...</Text>
            <Text style={styles.subMessage}>Location is required to find trains within {formatRadius(API_CONFIG.DEFAULT_SEARCH_RADIUS_METERS)}</Text>
          </View>
        </ContentContainer>
      </View>
    );
  }

  if (searchError) {
    return (
      <View style={styles.container}>
        <StatusBar style="auto" />
        <ContentContainer>
          <View style={styles.loadingContainer}>
            <Text style={styles.error}>Search Error</Text>
            <Text style={styles.errorMessage}>{searchError}</Text>
          </View>
        </ContentContainer>
      </View>
    );
  }

  // Show train results
  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      
      <ContentContainer>
        <ScrollView 
          style={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={searchingTrains}
              onRefresh={handleRefresh}
              title="Pull to refresh"
              tintColor="#007AFF"
            />
          }
        >

          {directionsInfo.length > 0 && (
            <View style={styles.filterSection}>
              <Text style={styles.filterTitle}>Choose direction:</Text>
              <View style={styles.directionCards}>
                {directionsInfo.map((directionInfo) => {
                  const isUptown = directionInfo.direction === 0;
                  const directionKey = isUptown ? 'uptown' : 'downtown';
                  const isSelected = selectedDirection === directionKey;
                  
                  return (
                    <TouchableOpacity
                      key={directionInfo.direction}
                      style={[
                        styles.directionCard,
                        isSelected && styles.directionCardActive
                      ]}
                      onPress={() => handleDirectionFilter(directionKey)}
                      testID={`direction-filter-${directionKey}`}
                    >
                      <Text style={[
                        styles.directionCardLabel,
                        isSelected && styles.directionCardLabelActive
                      ]}>
                        {directionInfo.label}
                      </Text>
                      
                      <View style={styles.directionCardContent}>
                        {directionInfo.headsigns.map((headsign) => (
                          <Text 
                            key={headsign} 
                            style={[
                              styles.destinationText,
                              isSelected && styles.destinationTextActive
                            ]}
                          >
                            • {headsign}
                          </Text>
                        ))}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}
        {filteredTrains.length > 0 ? (
          <View style={styles.resultsSection}>
            {filteredTrains.map((train: TrainData, index: number) => (
              <View key={`${train.trainId}-${index}`} style={styles.trainCard} testID="train-card">
                <View style={styles.trainHeader}>
                  <View style={[
                    styles.trainIndicator,
                    { backgroundColor: route?.color ? `#${route.color}` : '#666' }
                  ]}>
                    <Text style={[
                      styles.trainNumber,
                      { color: route?.textColor ? `#${route.textColor}` : 'white' }
                    ]}>
                      {route?.shortName || params.lineCode}
                    </Text>
                  </View>
                  <View style={styles.trainInfo}>
                    <Text style={styles.trainHeadsign}>{train.direction}</Text>
                    <Text style={styles.trainStatus}>
                      Current: {train.currentStation}
                    </Text>
                    <Text style={styles.trainDistance}>
                      {train.distanceMeters 
                        ? `${train.distanceMeters}m away` 
                        : 'Distance unknown'
                      }
                    </Text>
                  </View>
                </View>

                {train.nextStops && train.nextStops.length > 0 && (
                  <View style={styles.stopsSection}>
                    <Text style={styles.stopsTitle}>Next Stops:</Text>
                    {train.nextStops.slice(0, 3).map((stop: NextStop, stopIndex: number) => (
                      <View key={`${stop.stationId}-${stopIndex}`} style={styles.stopItem}>
                        <Text style={styles.stopName}>{stop.stationName}</Text>
                        <Text style={styles.stopTime}>
                          {stop.etaMinutes} min
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        ) : hasSearched && !searchingTrains ? (
          <View style={styles.noResultsSection}>
            <Text style={styles.noResultsTitle}>
              {results && results.trains && results.trains.length > 0 && selectedDirection
                ? `No ${selectedDirection} trains found`
                : 'No trains found'
              }
            </Text>
            <Text style={styles.noResultsText}>
              {results && results.trains && results.trains.length > 0 && selectedDirection
                ? `No ${route?.shortName || params.lineCode} trains going ${selectedDirection} are currently within ${formatRadius(API_CONFIG.DEFAULT_SEARCH_RADIUS_METERS)}. Try changing the filter or pull down to refresh.`
                : `No ${route?.shortName || params.lineCode} trains are currently within ${formatRadius(API_CONFIG.DEFAULT_SEARCH_RADIUS_METERS)}. Pull down to refresh or try again in a few minutes.`
              }
            </Text>
          </View>
        ) : null}
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
  content: {
    flex: 1,
  },
  filterSection: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 15,
    marginBottom: 20,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  directionCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  directionCard: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  directionCardActive: {
    backgroundColor: '#e3f2fd',
    borderColor: '#007AFF',
  },
  directionCardLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  directionCardLabelActive: {
    color: '#007AFF',
  },
  directionCardContent: {
    alignItems: 'center',
  },
  destinationText: {
    fontSize: 13,
    color: '#555',
    marginBottom: 2,
    textAlign: 'center',
  },
  destinationTextActive: {
    color: '#007AFF',
    fontWeight: '500',
  },
  searchingSection: {
    alignItems: 'center',
    marginVertical: 30,
    padding: 20,
    backgroundColor: '#e3f2fd',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#bbdefb',
  },
  searchingText: {
    fontSize: 16,
    color: '#1976d2',
    fontWeight: '600',
    textAlign: 'center',
  },
  resultsSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  trainCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  trainHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  trainIndicator: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  trainNumber: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  trainInfo: {
    flex: 1,
  },
  trainHeadsign: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  trainStatus: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    marginBottom: 2,
  },
  trainDistance: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
  },
  stopsSection: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 15,
  },
  stopsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  stopItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 8,
  },
  stopName: {
    fontSize: 15,
    color: '#333',
    flex: 1,
    fontWeight: '500',
  },
  stopTime: {
    fontSize: 15,
    color: '#007AFF',
    fontWeight: '600',
    marginLeft: 12,
  },
  noResultsSection: {
    alignItems: 'center',
    padding: 20,
  },
  noResultsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  noResultsText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  message: {
    fontSize: 18,
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  subMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  error: {
    fontSize: 18,
    color: '#d32f2f',
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  errorMessage: {
    fontSize: 14,
    color: '#d32f2f',
    textAlign: 'center',
    lineHeight: 20,
  },
});