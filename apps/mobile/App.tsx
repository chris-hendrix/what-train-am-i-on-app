import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { useEffect, useState } from 'react';
import { ApiResponse, Line } from '@what-train/shared';

export default function App() {
  const [line, setLine] = useState<Line | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('http://localhost:3000/hello')
      .then(response => response.json())
      .then((data: ApiResponse<Line>) => {
        if (data.success && data.data) {
          setLine(data.data);
        } else {
          setError(data.error || 'Failed to load line data');
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to connect to API');
        setLoading(false);
      });
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
    <View style={styles.container}>
      <View style={styles.lineContainer}>
        <Text style={styles.lineTitle}>MTA Train Line</Text>
        <View style={[styles.lineIndicator, { backgroundColor: line?.color }]}>
          <Text style={styles.lineCode}>{line?.code}</Text>
        </View>
        <Text style={styles.lineName}>{line?.name}</Text>
      </View>
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
  error: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
  },
  lineContainer: {
    alignItems: 'center',
    padding: 20,
  },
  lineTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  lineIndicator: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  lineCode: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  lineName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#555',
    textAlign: 'center',
  },
});
