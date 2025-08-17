import { Stack } from 'expo-router';
import { AppProvider } from '../context/AppContext';
import { LocationHeader } from '../components/LocationHeader';
import { TrainSearchHeader } from '../components/TrainSearchHeader';

// Import Leaflet CSS and compatibility plugin for web (2025 best practice)
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.webpack.css';
import 'leaflet-defaulticon-compatibility';

export default function RootLayout() {
  return (
    <AppProvider>
      <Stack>
        <Stack.Screen 
          name="index" 
          options={{ 
            header: () => <LocationHeader title="What Train Am I On?" />,
          }} 
        />
        <Stack.Screen 
          name="[lineCode]" 
          options={{ 
            header: () => <TrainSearchHeader />,
          }} 
        />
        <Stack.Screen 
          name="error" 
          options={{ 
            header: () => <LocationHeader title="Error" />,
          }} 
        />
      </Stack>
    </AppProvider>
  );
}