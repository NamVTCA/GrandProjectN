import {
  Controller, Get, Post, Delete, Body, Param, UseGuards,
  UploadedFile, UseInterceptors, BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { GroupsService } from './groups.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { UserDocument } from '../auth/schemas/user.schema';
import { CreateGroupDto } from './dto/create-group.dto';
import { GroupOwnerGuard } from './guards/group-owner.guard';
import { GroupMemberGuard } from './guards/group-member.guard';
import { imageMulterOptions } from '../common/upload/image-upload.config';

@UseGuards(JwtAuthGuard)
@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  // --- ROUTE KHÔNG THAM SỐ ---

  @Post()
  create(
    @GetUser() user: UserDocument,
    @Body() createGroupDto: CreateGroupDto,
  ) {
    return this.groupsService.createGroup(user, createGroupDto);
  }

  @Get('me') // Lấy nhóm của user hiện tại
  findMyGroups(@GetUser() user: UserDocument) {
    return this.groupsService.findGroupsForUser(user);
  }

  @Get('suggestions') // Gợi ý nhóm
  getSuggestions(@GetUser() user: UserDocument) {
    return this.groupsService.suggestGroups(user);
  }

  // --- UPLOAD ẢNH (đặt trước :id) ---

  // POST /groups/:id/cover-image  (field: file)
  @Post(':id/cover-image')
  @UseGuards(GroupOwnerGuard) // chỉ chủ nhóm được đổi ảnh bìa
  @UseInterceptors(FileInterceptor('file', imageMulterOptions('groups/covers')))
  async uploadCover(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Không có file');
    const rel = file.path.replace(process.cwd(), '').replace(/\\/g, '/');
    const coverImage = rel.startsWith('/uploads') ? rel : `/uploads${rel}`;
    await this.groupsService.updateById(id, { coverImage });
    return { coverImage };
  }

  // POST /groups/:id/avatar  (field: file)
  @Post(':id/avatar')
  @UseGuards(GroupOwnerGuard) // chỉ chủ nhóm được đổi avatar
  @UseInterceptors(FileInterceptor('file', imageMulterOptions('groups/avatars')))
  async uploadAvatar(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Không có file');
    const rel = file.path.replace(process.cwd(), '').replace(/\\/g, '/');
    const avatar = rel.startsWith('/uploads') ? rel : `/uploads${rel}`;
    await this.groupsService.updateById(id, { avatar });
    return { avatar };
  }

  // --- ROUTE CÓ THAM SỐ ---

  @Get(':id') // Lấy chi tiết nhóm
  findOne(@Param('id') id: string) {
    return this.groupsService.findOneById(id);
  }

  @Post(':id/join') // Gửi yêu cầu/Tham gia nhóm
  join(@GetUser() user: UserDocument, @Param('id') groupId: string) {
    return this.groupsService.joinGroup(user, groupId);
  }

  @Delete(':id') // Xóa nhóm (tuỳ quyền xử lý trong service)
  deleteGroup(@Param('id') groupId: string, @GetUser() user: UserDocument) {
    return this.groupsService.deleteGroup(groupId, user);
  }

  // --- API QUẢN LÝ NHÓM ---

  @Get(':id/requests') // Lấy danh sách yêu cầu tham gia
  @UseGuards(GroupOwnerGuard)
  getJoinRequests(@Param('id') groupId: string) {
    return this.groupsService.getJoinRequests(groupId);
  }

  @Post(':id/requests/:requestId/approve') // Chấp thuận yêu cầu
  @UseGuards(GroupOwnerGuard)
  approveRequest(
    @GetUser() owner: UserDocument,
    @Param('requestId') requestId: string,
  ) {
    return this.groupsService.approveRequest(requestId, owner);
  }

  @Post(':id/requests/:requestId/reject') // Từ chối yêu cầu
  @UseGuards(GroupOwnerGuard)
  rejectRequest(
    @GetUser() owner: UserDocument,
    @Param('requestId') requestId: string,
  ) {
    return this.groupsService.rejectRequest(requestId, owner);
  }

  // Rời nhóm
  @Post(':id/leave')
  leaveGroup(@GetUser() user: UserDocument, @Param('id') groupId: string) {
    return this.groupsService.leaveGroup(user, groupId);
  }

  // Lấy danh sách thành viên (trang quản lý)
  @Get(':id/members')
  @UseGuards(GroupOwnerGuard) // Chỉ chủ nhóm
  getGroupMembers(@Param('id') groupId: string) {
    return this.groupsService.getGroupMembers(groupId);
  }

  // Kick thành viên
  @Delete(':groupId/members/:memberUserId')
  @UseGuards(GroupOwnerGuard)
  kickMember(
    @Param('groupId') groupId: string,
    @Param('memberUserId') memberUserId: string,
  ) {
    return this.groupsService.kickMember(groupId, memberUserId);
  }

  // Mời vào nhóm
  @Post(':id/invite')
  @UseGuards(GroupMemberGuard) // Chỉ thành viên mới được mời
  createInvite(
    @Param('id') groupId: string,
    @GetUser() inviter: UserDocument,
    @Body('inviteeId') inviteeId: string,
  ) {
    return this.groupsService.createInvite(groupId, inviter, inviteeId);
  }

  @Get(':id/join-status') // Trạng thái tham gia của user đối với nhóm
  getJoinStatus(@GetUser() user: UserDocument, @Param('id') groupId: string) {
    return this.groupsService.getJoinStatus(user, groupId);
  }
}
