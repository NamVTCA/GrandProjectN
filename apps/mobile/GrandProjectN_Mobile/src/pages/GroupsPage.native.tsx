import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as groupApi from '../services/group.api';
import { useAuth } from '../features/auth/AuthContext';
import GroupCard from '../features/groups/components/GroupCard';
import Button from '../components/common/Button';
import Icon from 'react-native-vector-icons/FontAwesome';
import type { Group } from '../features/groups/types/Group'; // ✅ import đúng type Group

const GroupsPage: React.FC = () => {
  const { user } = useAuth();
  const navigation = useNavigation();
  const queryClient = useQueryClient();

  const { data: myGroups = [], isLoading: isLoadingMyGroups } = useQuery<Group[]>({
    queryKey: ['groups', 'me'],
    queryFn: async () => await groupApi.getMyGroups(), // ✅ đúng type signature
  });

  const { data: suggestedGroups = [], isLoading: isLoadingSuggested } = useQuery<Group[]>({
    queryKey: ['groups', 'suggestions'],
    queryFn: async () => await groupApi.getSuggestedGroups(),
  });

  const handleGroupUpdate = () => {
    queryClient.invalidateQueries({ queryKey: ['groups', 'me'] });
    queryClient.invalidateQueries({ queryKey: ['groups', 'suggestions'] });
  };

  const isLoading = isLoadingMyGroups || isLoadingSuggested;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#c1cd78" />
          <Text style={styles.loadingText}>Đang tải các nhóm...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Khám phá Nhóm</Text>
          <Button onPress={() => navigation.navigate('CreateGroup' as never)}>
            <Icon name="plus" size={16} color="#fff" />
            <Text style={styles.buttonText}> Tạo nhóm mới</Text>
          </Button>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nhóm của bạn ({myGroups.length})</Text>
          {myGroups.length > 0 ? (
            <FlatList
              data={myGroups}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <GroupCard
                  group={item}
                  isMember={true}
                  isOwner={user?._id === item.owner._id}
                  onGroupUpdate={handleGroupUpdate}
                />
              )}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.groupList}
            />
          ) : (
            <Text style={styles.emptyText}>Bạn chưa tham gia nhóm nào.</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Gợi ý cho bạn</Text>
          <FlatList
            data={suggestedGroups}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <GroupCard
                group={item}
                isMember={false}
                isOwner={false}
                onGroupUpdate={handleGroupUpdate}
              />
            )}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.groupList}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0e4420',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#c1cd78',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#c1cd78',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#c1cd78',
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#083b38',
  },
  groupList: {
    gap: 16,
    paddingVertical: 8,
  },
  emptyText: {
    color: '#d5e4c3',
    textAlign: 'center',
    padding: 20,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#d5e4c3',
    marginTop: 16,
    fontSize: 16,
  },
});

export default GroupsPage;
