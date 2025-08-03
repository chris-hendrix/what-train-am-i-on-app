import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { useEffect, useState } from 'react';
import { 
  Line, 
  SuccessResponse,
  ErrorResponse 
} from '@what-train/shared';

export default function App() {
  const [lines, setLines] = useState<Line[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('http://localhost:3000/lines')
      .then(response => response.json())
      .then((data: SuccessResponse<{ lines: Line[] }> | ErrorResponse) => {
        if (data.success && 'data' in data) {
          setLines(data.data.lines);
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
      <Text style={styles.title}>MTA Train Lines</Text>
      {lines.map((line) => (
        <View key={line.id} style={styles.lineContainer}>
          <View style={[styles.lineIndicator, { backgroundColor: line.color }]}>
            <Text style={styles.lineCode}>{line.code}</Text>
          </View>
          <View style={styles.lineInfo}>
            <Text style={styles.lineName}>{line.name}</Text>
            <Text style={styles.lineType}>{line.type.toUpperCase()}</Text>
          </View>
        </View>
      ))}
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
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#333',
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
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    marginBottom: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    width: '100%',
    maxWidth: 300,
  },
  lineIndicator: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  lineCode: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  lineInfo: {
    flex: 1,
  },
  lineName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  lineType: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
});
