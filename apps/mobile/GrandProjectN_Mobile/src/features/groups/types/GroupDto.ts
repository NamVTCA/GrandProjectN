export interface CreateGroupDto {
  name: string;
  description?: string;
  interestIds?: string[];
  privacy?: 'public' | 'private';
}

export type UpdateGroupDto = Partial<CreateGroupDto>;