// File: src/features/groups/types/Group.ts
// Description: Cập nhật cấu trúc dữ liệu cho tính năng Nhóm để khớp với schema của backend.

import type { UserProfile } from '../../profile/types/UserProfile'; // Import type UserProfile

// Cấu trúc cho một tag Sở thích
export interface Interest {
  _id: string;
  name: string;
}

// ✅ [ĐÃ SỬA] Cấu trúc cho một Thành viên trong nhóm.
// Backend trả về một object lồng nhau { user: {...}, role: '...' },
// nên chúng ta cần định nghĩa type cho đúng cấu trúc này.
export interface GroupMember {
  user: UserProfile; // Thông tin chi tiết của người dùng
  role: 'MEMBER' | 'MODERATOR' | 'OWNER';
  joinedAt: string;
}

// Cấu trúc cho một Nhóm (dạng xem tóm tắt, dùng cho danh sách)
export interface Group {
  _id: string;
  name: string;
  description: string;
  // ✅ [ĐÃ SỬA] Backend sẽ trả về một object User đã được populate, không chỉ là ID
  owner: UserProfile; 
  interests: Interest[];
  privacy: 'public' | 'private';
  avatar?: string;
  coverImage?: string;
  memberCount: number;
}


// Cấu trúc cho một Nhóm (dạng xem chi tiết)
export interface GroupDetail extends Group {
  // Trang chi tiết sẽ có thêm danh sách thành viên đầy đủ
  members: GroupMember[]; 
}

// Cấu trúc để tạo một nhóm mới
export interface CreateGroupDto {
  name: string;
  description: string;
  privacy: 'public' | 'private';
  interestIds?: string[];
}

// Cấu trúc cho một yêu cầu tham gia nhóm
export interface JoinRequest {
  _id: string;
  user: UserProfile;
  group: string; // Group ID
  status: 'PENDING';
  createdAt: string;
}