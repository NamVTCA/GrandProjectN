// Định nghĩa cấu trúc dữ liệu cho một hồ sơ người dùng đầy đủ
export interface UserProfile {
  _id: string;
  username: string;
  name?: string;
  email: string; // Có thể cần cho các chức năng sau
  avatar?: string;
  coverImage?: string;
  bio?: string;
  followers: string[]; // Mảng các ID người dùng
  following: string[]; // Mảng các ID người dùng
  createdAt: string;
  xp:number;
  xpToNextLevel: number;
  // ✅ Thêm trường để lấy khung avatar từ backend
  equippedAvatarFrame?: {
    _id: string;
    name: string;
    assetUrl: string;
    type?: string;
  };
}
