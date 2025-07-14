// Define the structure for an Interest tag
interface Interest {
  _id: string;
  name: string;
}

// Define the structure for a user object within a group
interface GroupMember {
    _id: string;
    username: string;
    avatar?: string;
    role: 'MEMBER' | 'MODERATOR' | 'OWNER'; // Thêm vai trò thành viên
}

// Define the structure for a Group, matching the final Backend schema
export interface Group {
  _id: string;
  name: string;
  description: string;
  owner: string; // ID of the user who owns the group
  interests: Interest[];
}


// Define the structure for a detailed Group view
export interface GroupDetail extends Group {
    members: GroupMember[];
}

// --- BỔ SUNG ---
// Define the structure for a join request
export interface JoinRequest {
    _id: string;
    user: {
        _id: string;
        username: string;
        avatar?: string;
    };
    group: string; // Group ID
    status: 'PENDING';
    createdAt: string;
}
