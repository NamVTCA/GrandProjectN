import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../features/auth/AuthContext';
import { globalStyles, COLORS } from '../styles/theme';

const API_URL_INTERESTS = 'http://192.168.20.107:8888/api/interests';
const API_URL_UPDATE = 'http://192.168.20.107:8888/api/users/me/interests';

const SelectInterestsPage = ({ navigation }) => {
  const [interests, setInterests] = useState([]);
  const [selectedInterests, setSelectedInterests] = useState(new Set());
  const { token, user, logout } = useAuth();

  useEffect(() => {
    if (token) {
      fetchInterests();
    }
    if (user?.interests) {
      setSelectedInterests(new Set(user.interests));
    }
  }, [token, user]);

  const fetchInterests = async () => {
    try {
      const response = await axios.get(API_URL_INTERESTS, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setInterests(response.data);
    } catch (error) {
      if (error.response?.status === 401) {
        Alert.alert("Phiên làm việc đã hết hạn", "Vui lòng đăng nhập lại.");
        logout();
      } else {
        console.error('Lỗi lấy sở thích:', error);
        Alert.alert('Lỗi', 'Không thể lấy danh sách sở thích.');
      }
    }
  };

  const toggleInterest = (interestId) => {
    const newSelected = new Set(selectedInterests);
    if (newSelected.has(interestId)) {
      newSelected.delete(interestId);
    } else {
      newSelected.add(interestId);
    }
    setSelectedInterests(newSelected);
  };

  const handleSave = async () => {
    try {
      await axios.patch(
        API_URL_UPDATE,
        { interestIds: Array.from(selectedInterests) },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      Alert.alert('Thành công', 'Sở thích của bạn đã được cập nhật!');
      navigation.navigate('Home');
    } catch (error) {
      console.error('Lỗi cập nhật sở thích:', error.response?.data);
      Alert.alert('Lỗi', error.response?.data?.message || 'Không thể cập nhật sở thích');
    }
  };

  const renderInterestItem = ({ item }) => {
    const isSelected = selectedInterests.has(item._id);
    return (
      <TouchableOpacity
        style={[styles.interestItem, isSelected && styles.selectedInterest]}
        onPress={() => toggleInterest(item._id)}
      >
        <Text style={styles.interestText}>{item.name}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <LinearGradient
      colors={[COLORS.background, '#0e0b1d']}
      style={styles.gradientContainer}
    >
      <View style={globalStyles.container}>
        <Text style={globalStyles.title}>Chọn sở thích của bạn</Text>
        <View style={styles.interestListContainer}>
          <FlatList
            data={interests}
            renderItem={renderInterestItem}
            keyExtractor={(item) => item._id}
            numColumns={2}
          />
        </View>
        <TouchableOpacity style={globalStyles.button} onPress={handleSave}>
          <Text style={globalStyles.buttonText}>Lưu</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  interestListContainer: {
    flex: 1,
    width: '100%',
    marginVertical: 20,
  },
  interestItem: {
    flex: 1,
    margin: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: COLORS.card,
  },
  selectedInterest: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  interestText: {
    color: COLORS.text,
  },
});

export default SelectInterestsPage;