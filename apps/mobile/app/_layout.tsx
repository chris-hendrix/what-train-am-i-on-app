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
            header: () => <LocationHeader title="What Train Am I On?" />,
          }} 
        />
        <Stack.Screen 
          name="trains/index" 
          options={{ 
            header: () => <LocationHeader title="Select Train Line" />,
          }} 
        />
        <Stack.Screen 
          name="trains/[lineCode]" 
          options={{ 
            header: () => <LocationHeader title="Train Search" />,
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