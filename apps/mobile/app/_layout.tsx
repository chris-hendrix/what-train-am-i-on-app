import { Stack } from 'expo-router';
import { AppProvider } from '../context/AppContext';
import { LocationHeader } from '../components/LocationHeader';

export default function RootLayout() {
  return (
    <AppProvider>
      <Stack>
        <Stack.Screen 
          name="index" 
          options={{ 
            headerTitle: () => <LocationHeader title="What Train Am I On?" showHomeButton={false} />,
          }} 
        />
        <Stack.Screen 
          name="trains/index" 
          options={{ 
            headerTitle: () => <LocationHeader title="Select Train Line" />,
          }} 
        />
        <Stack.Screen 
          name="trains/[lineCode]" 
          options={{ 
            headerTitle: () => <LocationHeader title="Train Search" />,
          }} 
        />
        <Stack.Screen 
          name="error" 
          options={{ 
            headerTitle: () => <LocationHeader title="Error" />,
          }} 
        />
      </Stack>
    </AppProvider>
  );
}