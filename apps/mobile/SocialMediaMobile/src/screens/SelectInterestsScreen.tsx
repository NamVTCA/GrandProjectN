import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Button, Alert } from "react-native";
import { getInterests, updateUserInterests } from "../services/interestService";

import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';

type RootStackParamList = {
  SelectInterests: { token: string; userId: string };
  Home: { token: string };
};

type SelectInterestsScreenRouteProp = RouteProp<RootStackParamList, 'SelectInterests'>;
type SelectInterestsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'SelectInterests'>;

interface Props {
  route: SelectInterestsScreenRouteProp;
  navigation: SelectInterestsScreenNavigationProp;
}

export default function SelectInterestsScreen({ route, navigation }: Props) {
  const { token, userId } = route.params;
  const [interests, setInterests] = useState<any[]>([]);
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getInterests(token);
        setInterests(data);
      } catch (err) {
        console.log("Load interests failed:", err);
      }
    };
    fetchData();
  }, []);

  const toggleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    try {
      await updateUserInterests(userId, selected, token);
      Alert.alert("Thành công", "Đã lưu sở thích!");
      navigation.replace("Home", { token });
    } catch (err) {
      Alert.alert("Lỗi", "Không thể lưu sở thích");
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    const isSelected = selected.includes(item._id);
    return (
      <TouchableOpacity
        style={[styles.item, isSelected && styles.itemSelected]}
        onPress={() => toggleSelect(item._id)}
      >
        <Text style={styles.itemText}>{item.name}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Chọn sở thích của bạn</Text>
      <FlatList
        data={interests}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        numColumns={2}
        columnWrapperStyle={styles.row}
      />
      <Button title="Xác nhận" onPress={handleSave} disabled={selected.length === 0} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 20, textAlign: "center" },
  row: { justifyContent: "space-between" },
  item: {
    flex: 1,
    padding: 15,
    margin: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    alignItems: "center",
  },
  itemSelected: {
    backgroundColor: "#4a90e2",
    borderColor: "#357ABD",
  },
  itemText: { color: "#333" },
});
