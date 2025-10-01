export type StackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  Home: { token: string };
  Feed: { token: string };
  SelectInterests: { token: string; userId: string };
  CreatePost: { token: string ; groupId?: string  };
  Comments: { postId: string; token: string }; // ✅ thêm param cho Comments
  EditPost: { post: any; token: string };
  Profile: { token: string };
  EditProfile: { token: string }; // ✅ thêm dòng này

  GroupList: { token: string };
  CreateGroup: { token: string; groupId?: string };
  GroupDetail: { groupId: string; token: string };
  GroupFeed: { groupId: string; token: string };
  GroupMembers: { groupId: string; token: string; isAdmin: boolean };
  GroupRequests: { groupId: string; token: string };
  InviteMembers: { groupId: string; token: string };
  MyInvites: { token: string };
  GroupInvites: { token: string };
};
