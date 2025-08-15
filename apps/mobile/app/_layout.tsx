import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'What Train Am I On?' }} />
      <Stack.Screen name="train-results" options={{ title: 'Train Results' }} />
      <Stack.Screen name="error" options={{ title: 'Error' }} />
    </Stack>
  );
}