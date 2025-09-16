import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Button, ActivityIndicator } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import api from '../services/api';
import { useAuth } from '../features/auth/AuthContext';

interface Interest {
  _id: string;
  name: string;
}

type RootStackParamList = {
  Home: undefined;
  SelectInterests: undefined;
};

type SelectInterestsScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const SelectInterestsPage: React.FC = () => {
  const [interests, setInterests] = useState<Interest[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const { fetchUser, user } = useAuth();
  const navigation = useNavigation<SelectInterestsScreenNavigationProp>();

  useEffect(() => {
    const fetchInterests = async () => {
      try {
        const res = await api.get('/interests');
        setInterests(res.data);
      } catch (error) {
        console.error('Lỗi khi lấy danh sách sở thích:', error);
        Alert.alert('Lỗi', 'Không thể tải danh sách sở thích');
      } finally {
        setLoading(false);
      }
    };

    fetchInterests();
  }, []);

  const handleToggleInterest = (id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleSubmit = async () => {
    if (selectedIds.size < 3) {
      Alert.alert('Thông báo', 'Vui lòng chọn ít nhất 3 sở thích.');
      return;
    }

    setSubmitting(true);
    try {
      await api.patch('/users/me/interests', { interestIds: Array.from(selectedIds) });
      await fetchUser(); // Cập nhật lại user context
      navigation.navigate('Home'); // Chuyển hướng về trang chủ
    } catch (error) {
      console.error('Lỗi khi lưu sở thích:', error);
      Alert.alert('Lỗi', 'Không thể lưu sở thích');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3a7ca5" />
        <Text style={styles.loadingText}>Đang tải sở thích...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Chào mừng bạn!</Text>
        <Text style={styles.subtitle}>
          Hãy cho chúng tôi biết bạn quan tâm đến điều gì để có những gợi ý tốt nhất.
        </Text>
        
        <View style={styles.interestsGrid}>
          {interests.map(interest => (
            <TouchableOpacity
              key={interest._id}
              style={[
                styles.interestTag,
                selectedIds.has(interest._id) && styles.selectedInterestTag
              ]}
              onPress={() => handleToggleInterest(interest._id)}
            >
              <Text style={[
                styles.interestText,
                selectedIds.has(interest._id) && styles.selectedInterestText
              ]}>
                {interest.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        <Button
          mode="contained"
          onPress={handleSubmit}
          disabled={selectedIds.size < 3 || submitting}
          loading={submitting}
          style={styles.submitButton}
        >
          Tiếp tục (Chọn ít nhất {selectedIds.size < 3 ? 3 - selectedIds.size : 0})
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  },
  content: {
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
    textAlign: 'center',
    lineHeight: 24,
  },
  interestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 40,
    width: '100%',
  },
  interestTag: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: 'white',
    borderRadius: 25,
  },
  selectedInterestTag: {
    backgroundColor: '#3a7ca5',
    borderColor: '#3a7ca5',
  },
  interestText: {
    color: '#666',
    fontSize: 15,
  },
  selectedInterestText: {
    color: 'white',
    fontWeight: '600',
  },
  submitButton: {
    paddingVertical: 8,
    minWidth: 200,
  },
});

export default SelectInterestsPage;