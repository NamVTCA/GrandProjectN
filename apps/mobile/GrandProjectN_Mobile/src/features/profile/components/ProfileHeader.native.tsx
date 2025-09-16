import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { UserProfile } from "../types/UserProfile";
import { useAuth } from "../../auth/AuthContext";
import { publicUrl } from "../../../untils/publicUrl";
import api from "../../../services/api";
import AvatarWithFrame from "../../../components/common/AvatarWithFrame";
import { RootStackParamList } from "../../../navigation/AppNavigator";

// type cho navigation
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const ReportModal: React.FC<{
  onClose: () => void;
  onSubmit: (reason: string) => void;
  userId: string;
  username: string;
}> = ({ onClose, onSubmit, userId, username }) => {
  const [reason, setReason] = useState("");

  return (
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>🚩 Gửi báo cáo</Text>

        <Text style={styles.reportLink}>
          Xem hồ sơ người dùng được báo cáo: {username}
        </Text>

        <TextInput
          style={styles.textArea}
          placeholder="Nhập lý do bạn muốn báo cáo..."
          placeholderTextColor="#999"
          value={reason}
          onChangeText={setReason}
          multiline
          numberOfLines={4}
        />

        <View style={styles.modalActions}>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.buttonText}>Hủy</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.submitButton}
            onPress={() => {
              if (!reason.trim()) {
                alert("Vui lòng nhập lý do báo cáo.");
                return;
              }
              onSubmit(reason);
            }}
          >
            <Text style={styles.buttonText}>Gửi</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

interface ProfileHeaderProps {
  userProfile: UserProfile;
  isFollowing: boolean;
  onFollowToggle: () => void;
}

type UserLevelInfo = {
  level: string;
  description: string;
  color: string;
  icon?: string;
  xpToNextLevel: number | string;
};

const getUserLevelInfo = (xp: number, isAdmin: boolean): UserLevelInfo => {
  if (isAdmin) {
    return {
      level: "Chúa trời",
      description: "Quản trị viên tối cao",
      color: "#ff0000",
      icon: "👑",
      xpToNextLevel: "∞",
    };
  }

  if (xp >= 20000)
    return {
      level: "Bậc thầy mạng xã hội",
      description: "Biểu tượng trong cộng đồng",
      color: "#6f42c1",
      icon: "🪐",
      xpToNextLevel: 30000,
    };
  if (xp >= 10000)
    return {
      level: "Người nổi tiếng",
      description: "Có tiếng nói trong cộng đồng",
      color: "#d63384",
      icon: "🌟",
      xpToNextLevel: 20000,
    };
  if (xp >= 5000)
    return {
      level: "Lão làng",
      description: "Được cộng đồng quan tâm",
      color: "#20c997",
      xpToNextLevel: 10000,
    };
  if (xp >= 2000)
    return {
      level: "Cựu thành viên",
      description: "Tạo ảnh hưởng nhỏ",
      color: "#17a2b8",
      xpToNextLevel: 5000,
    };
  if (xp >= 500)
    return {
      level: "GenZ",
      description: "Có tương tác thường xuyên",
      color: "#fd7e14",
      xpToNextLevel: 2000,
    };
  return {
    level: "Mới dùng mạng xã hội",
    description: "Vừa tham gia",
    color: "#6c757d",
    xpToNextLevel: 500,
  };
};

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  userProfile,
  isFollowing,
  onFollowToggle,
}) => {
  const { user } = useAuth();
  const navigation = useNavigation<NavigationProp>(); // 👈 ép kiểu cho navigation
  const isMyProfile = user?._id === userProfile._id;
  const isAdmin = userProfile.globalRole === "ADMIN";
  const levelInfo = getUserLevelInfo(userProfile.xp, isAdmin);

  const [isReportModalOpen, setReportModalOpen] = useState(false);

  const handleEditProfile = () => {
    navigation.navigate("EditProfile", { username: userProfile.username });
  };

  const handleGoToAdminDashboard = () => {
    navigation.navigate("AdminDashboard");
  };

  const isAccountSuspendedOrBanned =
    userProfile.accountStatus === "SUSPENDED" ||
    userProfile.accountStatus === "BANNED";

  if (isAccountSuspendedOrBanned && !isMyProfile) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.coverContainer}>
        <Image
          source={{
            uri: userProfile.coverImage
              ? publicUrl(userProfile.coverImage)
              : "https://images.pexels.com/photos/1631677/pexels-photo-1631677.jpeg",
          }}
          style={styles.coverImage}
        />
      </View>

      <View style={styles.profileInfo}>
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            <AvatarWithFrame
              avatarUrl={
                userProfile.avatar
                  ? publicUrl(userProfile.avatar)
                  : "https://via.placeholder.com/150"
              }
              frameAssetUrl={userProfile.equippedAvatarFrame?.assetUrl}
              size={96}
            />
          </View>

          <View style={styles.nameSection}>
            <Text style={styles.name}>
              {userProfile.name || userProfile.username}
            </Text>
            <Text style={styles.username}>@{userProfile.username}</Text>
          </View>

          <View style={[styles.userLevel, { borderLeftColor: levelInfo.color }]}>
            <Text style={[styles.levelText, { color: levelInfo.color }]}>
              {levelInfo.icon} {levelInfo.level}
            </Text>
            <Text style={styles.xpText}>
              {isAdmin ? "∞" : userProfile.xp} / {levelInfo.xpToNextLevel} XP
            </Text>
            <Text style={styles.descText}>{levelInfo.description}</Text>
          </View>
        </View>

        <View style={styles.statsSection}>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>
              {userProfile.following.length}
            </Text>
            <Text style={styles.statLabel}>Đang theo dõi</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>
              {userProfile.followers.length}
            </Text>
            <Text style={styles.statLabel}>Người theo dõi</Text>
          </View>
        </View>

        <View style={styles.actionSection}>
          {isMyProfile ? (
            <View style={styles.profileActions}>
              <TouchableOpacity
                style={styles.editButton}
                onPress={handleEditProfile}
              >
                <Text style={styles.buttonText}>Chỉnh sửa hồ sơ</Text>
              </TouchableOpacity>
              {isAdmin && (
                <TouchableOpacity
                  style={styles.adminButton}
                  onPress={handleGoToAdminDashboard}
                >
                  <Text style={styles.buttonText}>Trang quản trị</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <>
              <TouchableOpacity
                style={
                  isFollowing ? styles.followingButton : styles.followButton
                }
                onPress={onFollowToggle}
              >
                <Text style={styles.buttonText}>
                  {isFollowing ? "Đang theo dõi" : "Theo dõi"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.reportButton}
                onPress={() => setReportModalOpen(true)}
              >
                <Text style={styles.reportText}>🚩 Báo cáo</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {userProfile.bio && <Text style={styles.bio}>{userProfile.bio}</Text>}

      {isReportModalOpen && (
        <ReportModal
          onClose={() => setReportModalOpen(false)}
          onSubmit={async (reason) => {
            try {
              await api.post("/reports", {
                type: "USER",
                targetId: userProfile._id,
                reason,
              });
              alert("✅ Cảm ơn bạn đã báo cáo người dùng này.");
              setReportModalOpen(false);
            } catch (error) {
              console.error("Error submitting report:", error);
              alert("❌ Có lỗi xảy ra khi gửi báo cáo. Vui lòng thử lại.");
            }
          }}
          userId={userProfile._id}
          username={userProfile.username}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  // giữ nguyên style như bạn gửi
  container: {
    backgroundColor: "#2A2A2A",
    borderRadius: 12,
    marginBottom: 20,
    overflow: "hidden",
  },
  coverContainer: { height: 150, backgroundColor: "#333" },
  coverImage: { width: "100%", height: "100%" },
  profileInfo: { padding: 16, marginTop: -40 },
  avatarSection: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 15,
    marginBottom: 16,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: "#2A2A2A",
    overflow: "hidden",
  },
  nameSection: { flex: 1 },
  name: { fontSize: 22, fontWeight: "700", color: "white" },
  username: { color: "#999", fontSize: 14 },
  userLevel: { borderLeftWidth: 3, paddingLeft: 8 },
  levelText: { fontSize: 14, fontWeight: "600" },
  xpText: { color: "#999", fontSize: 12 },
  descText: { color: "#999", fontSize: 12 },
  statsSection: {
    flexDirection: "row",
    gap: 20,
    marginBottom: 16,
    justifyContent: "center",
  },
  stat: { alignItems: "center" },
  statNumber: { fontSize: 16, fontWeight: "600", color: "white" },
  statLabel: { fontSize: 13, color: "#999" },
  actionSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  profileActions: { flexDirection: "row", gap: 8 },
  editButton: { backgroundColor: "#555", padding: 8, borderRadius: 6 },
  adminButton: { backgroundColor: "#007AFF", padding: 8, borderRadius: 6 },
  followButton: { backgroundColor: "#007AFF", padding: 8, borderRadius: 6 },
  followingButton: { backgroundColor: "#555", padding: 8, borderRadius: 6 },
  reportButton: { backgroundColor: "#e0245e", padding: 8, borderRadius: 6 },
  buttonText: { color: "white", fontSize: 13 },
  reportText: { color: "white", fontSize: 13 },
  bio: { padding: 16, paddingTop: 0, color: "#999", lineHeight: 20 },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: "#2A2A2A",
    padding: 20,
    borderRadius: 12,
    width: "80%",
  },
  modalTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  reportLink: { color: "#007AFF", marginBottom: 16 },
  textArea: {
    backgroundColor: "#333",
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
    color: "white",
    minHeight: 80,
    textAlignVertical: "top",
  },
  modalActions: { flexDirection: "row", justifyContent: "flex-end", gap: 10 },
  cancelButton: { backgroundColor: "#555", padding: 8, borderRadius: 6 },
  submitButton: { backgroundColor: "#e0245e", padding: 8, borderRadius: 6 },
});

export default ProfileHeader;
