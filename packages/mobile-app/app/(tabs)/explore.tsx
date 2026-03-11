import { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

export default function ExploreScreen() {
  const [news, setNews] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    const fetchNews = async () => {
      if (user) {
        try {
          const config = {
            headers: {
              Authorization: `Bearer ${user.token}`,
            },
          };
          const { data } = await axios.get('http://10.0.2.2:5001/api/news', config);
          setNews(data);
        } catch (error) {
          console.error('Failed to fetch news', error);
        }
      }
    };

    fetchNews();
  }, [user]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>News & Camps</Text>
      <FlatList
        data={news}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={styles.itemContainer}>
            <Text style={styles.itemTitle}>{item.title}</Text>
            <Text>{item.content}</Text>
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
  itemTitle: {
    fontWeight: 'bold',
    fontSize: 16,
  },
});
