import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { useEffect, useState } from 'react';

export default function App() {
  const [message, setMessage] = useState('Loading...');

  useEffect(() => {
    fetch('http://localhost:3000/hello')
      .then(response => response.json())
      .then(data => setMessage(data.message))
      .catch(error => {
        console.error('API Error:', error);
        setMessage('Failed to load message');
      });
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.message}>{message}</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});
