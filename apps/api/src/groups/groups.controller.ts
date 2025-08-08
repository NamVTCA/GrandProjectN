import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { UserDocument } from '../auth/schemas/user.schema';
import { CreateGroupDto } from './dto/create-group.dto';
import { GroupOwnerGuard } from './guards/group-owner.guard';

@UseGuards(JwtAuthGuard)
@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  // --- CÁC ROUTE CỤ THỂ (KHÔNG CÓ THAM SỐ) ĐƯỢC ĐẶT LÊN ĐẦU ---

  @Post()
  create(
    @GetUser() user: UserDocument,
    @Body() createGroupDto: CreateGroupDto,
  ) {
    return this.groupsService.createGroup(user, createGroupDto);
  }

  @Get('me') // Route này sẽ được kiểm tra trước
  findMyGroups(@GetUser() user: UserDocument) {
    return this.groupsService.findGroupsForUser(user);
  }

  @Get('suggestions') // Route này cũng được ưu tiên
  getSuggestions(@GetUser() user: UserDocument) {
    return this.groupsService.suggestGroups(user);
  }

  // --- CÁC ROUTE CHUNG CHUNG (CÓ THAM SỐ) ĐƯỢC ĐẶT XUỐNG DƯỚI ---

  @Get(':id') // Route này sẽ chỉ được dùng khi route ở trên không khớp
  findOne(@Param('id') id: string) {
    return this.groupsService.findOneById(id);
  }

  @Post(':id/join')
  join(@GetUser() user: UserDocument, @Param('id') groupId: string) {
    return this.groupsService.joinGroup(user, groupId);
  }

  @Delete(':id')
  deleteGroup(@Param('id') groupId: string, @GetUser() user: UserDocument) {
    return this.groupsService.deleteGroup(groupId, user);
  }

  // --- API QUẢN LÝ NHÓM ---

  @Get(':id/requests') // Lấy danh sách yêu cầu tham gia
  @UseGuards(JwtAuthGuard, GroupOwnerGuard) // Bảo vệ route
  getJoinRequests(@Param('id') groupId: string) {
    return this.groupsService.getJoinRequests(groupId);
  }

  @Post(':id/requests/:requestId/approve') // Chấp thuận yêu cầu
  @UseGuards(JwtAuthGuard, GroupOwnerGuard)
  approveRequest(@Param('requestId') requestId: string) {
    return this.groupsService.approveRequest(requestId);
  }

  @Post(':id/requests/:requestId/reject') // Từ chối yêu cầu
  @UseGuards(JwtAuthGuard, GroupOwnerGuard)
  rejectRequest(@Param('requestId') requestId: string) {
    return this.groupsService.rejectRequest(requestId);
  }
  @Get(':id/join-status')
  getJoinStatus(@GetUser() user: UserDocument, @Param('id') groupId: string) {
    return this.groupsService.getJoinStatus(user, groupId);
  }
}