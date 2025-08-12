import { Controller, Get, Post, Delete, Body, Param, UseGuards, Patch,  UseInterceptors, UploadedFile, } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { UserDocument } from '../auth/schemas/user.schema';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto'; // <-- THÊM DTO MỚI
import { GroupOwnerGuard } from './guards/group-owner.guard';
import { GroupMemberGuard } from './guards/group-member.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@UseGuards(JwtAuthGuard)
@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post()
  create(
    @GetUser() user: UserDocument,
    @Body() createGroupDto: CreateGroupDto,
  ) {
    return this.groupsService.createGroup(user, createGroupDto);
  }

  @Get('me')
  findMyGroups(@GetUser() user: UserDocument) {
    return this.groupsService.findGroupsForUser(user);
  }

  @Get('suggestions')
  getSuggestions(@GetUser() user: UserDocument) {
    return this.groupsService.suggestGroups(user);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.groupsService.findOneById(id);
  }
  
  // ✅ [BỔ SUNG] ENDPOINT CẬP NHẬT NHÓM
  @Patch(':id')
  @UseGuards(GroupOwnerGuard) // Chỉ chủ nhóm mới có quyền sửa
  updateGroup(
      @Param('id') groupId: string,
      @Body() updateGroupDto: UpdateGroupDto
  ) {
      return this.groupsService.updateGroup(groupId, updateGroupDto);
  }


  @Delete(':id')
  @UseGuards(GroupOwnerGuard) // Mở rộng: Admin cũng có thể xóa
  deleteGroup(@Param('id') groupId: string, @GetUser() user: UserDocument) {
    return this.groupsService.deleteGroup(groupId, user);
  }

    // ✅ BỔ SUNG PHƯƠNG THỨC MỚI ĐỂ XỬ LÝ LỖI 404
  @Get(':id/posts')
  @UseGuards(GroupMemberGuard) // Đảm bảo chỉ thành viên mới xem được bài đăng
  getPosts(@Param('id') id: string) {
    return this.groupsService.getPosts(id);
  }

  @Get(':id/join-status')
  getJoinStatus(@GetUser() user: UserDocument, @Param('id') groupId: string) {
    return this.groupsService.getJoinStatus(user, groupId);
  }
  
  @Post(':id/join')
  join(@GetUser() user: UserDocument, @Param('id') groupId: string) {
    return this.groupsService.joinGroup(user, groupId);
  }

  @Post(':id/leave')
  leaveGroup(@GetUser() user: UserDocument, @Param('id') groupId: string) {
    return this.groupsService.leaveGroup(user, groupId);
  }

  // --- API QUẢN LÝ NHÓM ---

  @Get(':id/requests')
  @UseGuards(GroupOwnerGuard)
  getJoinRequests(@Param('id') groupId: string) {
    return this.groupsService.getJoinRequests(groupId);
  }

  @Post(':id/requests/:requestId/approve')
  @UseGuards(GroupOwnerGuard)
  approveRequest(
    @GetUser() owner: UserDocument,
    @Param('requestId') requestId: string
  ) {
    return this.groupsService.approveRequest(requestId, owner);
  }

  @Post(':id/requests/:requestId/reject')
  @UseGuards(GroupOwnerGuard)
  rejectRequest(
    @GetUser() owner: UserDocument,
    @Param('requestId') requestId: string
  ) {
    return this.groupsService.rejectRequest(requestId, owner);
  }

  @Get(':id/members')
  @UseGuards(GroupMemberGuard) // Sửa: Cho phép thành viên xem danh sách
  getGroupMembers(@Param('id') groupId: string) {
    return this.groupsService.getGroupMembers(groupId);
  }

  @Delete(':groupId/members/:memberUserId')
  @UseGuards(GroupOwnerGuard)
  kickMember(
    @Param('groupId') groupId: string,
    @Param('memberUserId') memberUserId: string,
  ) {
    return this.groupsService.kickMember(groupId, memberUserId);
  }

  @Post(':id/invite')
  @UseGuards(GroupMemberGuard)
  createInvite(
    @Param('id') groupId: string,
    @GetUser() inviter: UserDocument,
    @Body('inviteeId') inviteeId: string,
  ) {
    return this.groupsService.createInvite(groupId, inviter, inviteeId);
  }

    // ✅ BỔ SUNG: API UPLOAD AVATAR
  @Patch(':id/avatar')
  @UseGuards(GroupOwnerGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/groups/avatars',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  uploadAvatar(@Param('id') groupId: string, @UploadedFile() file: Express.Multer.File) {
    return this.groupsService.updateGroupImage(groupId, file.path, 'avatar');
  }

  // ✅ BỔ SUNG: API UPLOAD ẢNH BÌA
  @Patch(':id/cover')
  @UseGuards(GroupOwnerGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/groups/covers',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  uploadCover(@Param('id') groupId: string, @UploadedFile() file: Express.Multer.File) {
    return this.groupsService.updateGroupImage(groupId, file.path, 'cover');
  }
}
