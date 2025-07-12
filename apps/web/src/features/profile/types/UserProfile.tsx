export interface UserProfile {
  _id: string;
  username: string;
  name?: string;
  avatar?: string;
  coverImage?: string;
  bio?: string;
  followers?: string[];
  following?: string[];
}
