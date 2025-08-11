// Giả định bạn có các type này ở các file tương ứng
import type { UserProfile } from '../../profile/types/UserProfile';

// Cấu trúc cho một tag Sở thích
export interface Interest {
  _id: string;
  name: string;
}

// Cấu trúc cho một Thành viên trong nhóm
export interface GroupMember {
  _id: string; // ID của bản ghi groupMember
  user: UserProfile;
  role: 'MEMBER' | 'ADMIN' | 'OWNER';
  joinedAt: string;
  xp: number;
  level: number;
}

// Cấu trúc cho một Yêu cầu tham gia
export interface JoinRequest {
  _id: string;
  user: UserProfile;
  group: string; // Chỉ là ID
  status: 'PENDING';
  createdAt: string;
}

// Cấu trúc cho một Nhóm (dạng xem tóm tắt)
export interface Group {
  _id: string;
  name: string;
  description: string;
  owner: UserProfile;
  interests: Interest[];
  privacy: 'public' | 'private';
  avatar?: string;
  coverImage?: string;
  memberCount: number;
}

// Cấu trúc cho một Nhóm (dạng xem chi tiết)
export interface GroupDetail extends Group {
  members: GroupMember[]; // Dạng xem chi tiết có thêm danh sách thành viên
}
