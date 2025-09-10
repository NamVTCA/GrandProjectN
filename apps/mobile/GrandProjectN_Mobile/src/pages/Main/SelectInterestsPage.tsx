import React, { useState, useEffect, useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { AuthContext } from '../../features/auth/AuthContext';
import { colors, spacing, typography } from '../../styles/theme';
import apiClient from '../../api/apiClient';

interface Interest {
  _id: string;
  name: string;
}

const SelectInterestsPage = () => {
  const [allInterests, setAllInterests] = useState<Interest[]>([]);
  const [selectedInterestIds, setSelectedInterestIds] = useState<string[]>([]); // Sửa: Lưu ID thay vì name
  const [isFetching, setIsFetching] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { setUser } = useContext(AuthContext);

  useEffect(() => {
    const fetchInterests = async () => {
      try {
        const response = await apiClient.get('/interests');
        setAllInterests(response.data);
      } catch (error) {
        Alert.alert('Lỗi', 'Không thể tải danh sách sở thích.');
      } finally {
        setIsFetching(false);
      }
    };
    fetchInterests();
  }, []);

  const toggleInterest = (interestId: string) => { // Sửa: Thao tác với ID
    setSelectedInterestIds(prev =>
      prev.includes(interestId)
        ? prev.filter(item => item !== interestId)
        : [...prev, interestId]
    );
  };

  const handleContinue = async () => {
    if (selectedInterestIds.length < 3) {
      Alert.alert('Thông báo', 'Vui lòng chọn ít nhất 3 sở thích.');
      return;
    }
    setIsSubmitting(true);
    try {
      // Sửa: Gửi mảng ID của sở thích lên server
      const response = await apiClient.patch('/users/me', {
        interests: selectedInterestIds,
      });

      // Cập nhật context với dữ liệu user mới nhất từ server trả về
      setUser(response.data);

    } catch (error) {
      console.error('Update interests failed:', error);
      Alert.alert('Lỗi', 'Đã có lỗi xảy ra, vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isFetching) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Chọn sở thích của bạn</Text>
      <Text style={styles.subtitle}>Điều này sẽ giúp chúng tôi gợi ý nội dung phù hợp hơn với bạn.</Text>
      <View style={styles.interestsContainer}>
        {allInterests.map(interest => {
          const isSelected = selectedInterestIds.includes(interest._id); // Sửa: Kiểm tra bằng ID
          return (
            <TouchableOpacity
              key={interest._id}
              style={[styles.interestChip, isSelected && styles.interestChipSelected]}
              onPress={() => toggleInterest(interest._id)} // Sửa: Gửi ID vào hàm toggle
            >
              <Text style={[styles.interestText, isSelected && styles.interestTextSelected]}>
                {interest.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <TouchableOpacity style={styles.button} onPress={handleContinue} disabled={isSubmitting}>
        {isSubmitting ? <ActivityIndicator color={colors.text} /> : <Text style={styles.buttonText}>Tiếp tục</Text>}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', padding: spacing.large },
  title: { ...typography.h1, color: colors.primary, textAlign: 'center', marginBottom: spacing.small },
  subtitle: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.large },
  interestsContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginBottom: spacing.large },
  interestChip: {
    backgroundColor: colors.card,
    paddingVertical: spacing.small,
    paddingHorizontal: spacing.medium,
    borderRadius: 20,
    margin: spacing.small / 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  interestChipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  interestText: { color: colors.textSecondary },
  interestTextSelected: { color: colors.text, fontWeight: 'bold' },
  button: { backgroundColor: colors.primary, padding: spacing.medium, borderRadius: spacing.small, alignItems: 'center' },
  buttonText: { ...typography.body, fontWeight: 'bold' },
});

export default SelectInterestsPage;