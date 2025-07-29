// File: apps/web/src/features/groups/types/Group.ts
// Description: Updated data structures for the Groups feature to match the backend schema.

// Define the structure for an Interest tag
export interface Interest {
  _id: string;
  name: string;
}

// Define the structure for a user object within a group
export interface GroupMember {
    _id: string;
    username: string;
    avatar?: string;
    role: 'MEMBER' | 'MODERATOR' | 'OWNER'; // Role of the member
}

// Define the structure for a Group, matching the final Backend schema
export interface Group {
  _id: string;
  name: string;
  description: string;
  owner: string; // ID of the user who owns the group
  interests: Interest[];
  privacy: 'public' | 'private'; // Added from previous versions for consistency
  avatar?: string;
  coverImage?: string;
  memberCount: number;
}


// Define the structure for a detailed Group view
export interface GroupDetail extends Group {
    members: GroupMember[];
}

// Define the structure for creating a group
export interface CreateGroupDto {
    name: string;
    description: string;
    privacy: 'public' | 'private';
    interestIds?: string[]; // Optional: for adding interests on creation
}

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