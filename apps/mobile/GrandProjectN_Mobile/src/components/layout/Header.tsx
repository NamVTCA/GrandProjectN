import React, { useState, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Feather, Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { useAuth } from '../../features/auth/AuthContext';
import UserAvatar from '../common/UserAvatar';

type BaseHit = { _id: string; name: string; type: 'user' | 'post' | 'group'; avatar?: string; username?: string };
type SearchHit = BaseHit;

const Header: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchHit[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const { user } = useAuth();
  const navigation = useNavigation();

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    setIsSearching(true);
    const t = setTimeout(() => {
      api.get<SearchHit[]>(`/search?q=${encodeURIComponent(query)}`)
        .then(res => setResults(res.data || []))
        .catch(err => console.error('Lỗi tìm kiếm:', err))
        .finally(() => setIsSearching(false));
    }, 500);
    return () => clearTimeout(t);
  }, [query]);

  const getLinkForResult = (item: SearchHit) => {
    if (item.type === 'user' && item.username) return `Profile/${item.username}`;
    if (item.type === 'group') return `Group/${item._id}`;
    if (item.type === 'post') return `Post/${item._id}`;
    return 'Home';
  };

  const handleResultPress = (item: SearchHit) => {
    setShowResults(false);
    navigation.navigate(getLinkForResult(item) as never);
  };

  const renderResultItem = ({ item }: { item: SearchHit }) => (
    <TouchableOpacity
      style={styles.resultItem}
      onPress={() => handleResultPress(item)}
    >
      <Text style={styles.resultText}>{item.name}</Text>
      <Text style={styles.resultType}>{item.type}</Text>
    </TouchableOpacity>
  );

  const styles = StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#0e4420',
      padding: 12,
      borderBottomWidth: 5,
      borderBottomColor: '#083b38',
    },
    searchContainer: {
      flex: 1,
      marginRight: 15,
      position: 'relative',
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#083b38',
      borderRadius: 8,
      padding: 8,
    },
    searchInput: {
      flex: 1,
      color: '#d5e4c3',
      marginLeft: 8,
    },
    resultsContainer: {
      position: 'absolute',
      top: '100%',
      left: 0,
      right: 0,
      backgroundColor: '#0e4420',
      borderWidth: 1,
      borderColor: '#083b38',
      borderRadius: 8,
      marginTop: 4,
      maxHeight: 300,
      zIndex: 20,
    },
    resultItem: {
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#083b38',
    },
    resultText: {
      color: '#d5e4c3',
      fontSize: 14,
    },
    resultType: {
      color: '#9db38c',
      fontSize: 12,
      marginTop: 4,
    },
    userActions: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    actionButton: {
      marginLeft: 15,
    },
  });

  return (
    <View style={styles.header}>
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Feather name="search" size={20} color="#c1cd78" />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm bạn bè, bài viết, nhóm..."
            placeholderTextColor="#9db38c"
            value={query}
            onChangeText={setQuery}
            onFocus={() => setShowResults(true)}
            onBlur={() => setTimeout(() => setShowResults(false), 200)}
          />
        </View>

        {showResults && query.length > 1 && (
          <View style={styles.resultsContainer}>
            {isSearching ? (
              <View style={styles.resultItem}>
                <Text style={[styles.resultText, { fontStyle: 'italic' }]}>Đang tìm...</Text>
              </View>
            ) : results.length > 0 ? (
              <FlatList
                data={results}
                renderItem={renderResultItem}
                keyExtractor={(item) => `${item.type}-${item._id}`}
              />
            ) : (
              <View style={styles.resultItem}>
                <Text style={[styles.resultText, { fontStyle: 'italic' }]}>Không tìm thấy kết quả.</Text>
              </View>
            )}
          </View>
        )}
      </View>

      <View style={styles.userActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('UserReports' as never)}
        >
          <Ionicons name="warning" size={24} color="#dc3545" />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Notifications' as never)}
        >
          <Feather name="bell" size={24} color="#c1cd78" />
        </TouchableOpacity>
        
        {user && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate(
              user.username ? `Profile/${user.username}` as never : 'Profile' as never
            )}
          >
            <UserAvatar
              size={32}
              src={(user as any)?.avatarUrl || (user as any)?.avatar || (user as any)?.avatar_url}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default Header;