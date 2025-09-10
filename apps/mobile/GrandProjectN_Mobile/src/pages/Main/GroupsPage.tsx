import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography } from '../../styles/theme';

const GroupsPage = () => (
  <View style={styles.container}>
    <Text style={typography.h1}>Trang Nhóm</Text>
  </View>
);
const styles = StyleSheet.create({ container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }});
export default GroupsPage;