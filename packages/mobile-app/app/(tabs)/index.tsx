import { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

export default function HomeScreen() {
  const [complaints, setComplaints] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    const fetchComplaints = async () => {
      if (user) {
        try {
          const config = {
            headers: {
              Authorization: `Bearer ${user.token}`,
            },
          };
          const { data } = await axios.get('http://10.0.2.2:5001/api/complaints', config);
          setComplaints(data);
        } catch (error) {
          console.error('Failed to fetch complaints', error);
        }
      }
    };

    fetchComplaints();
  }, [user]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Complaints</Text>
      <FlatList
        data={complaints}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={styles.itemContainer}>
            <Text style={styles.itemCategory}>{item.category}</Text>
            <Text>{item.description}</Text>
            <Text style={styles.itemStatus}>{item.status}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    paddingTop: 40,
  },
  itemContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  itemCategory: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  itemStatus: {
    marginTop: 8,
    fontStyle: 'italic',
    color: '#666',
  },
});
