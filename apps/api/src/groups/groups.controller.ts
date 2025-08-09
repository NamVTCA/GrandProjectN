import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { UserDocument } from '../auth/schemas/user.schema';
import { CreateGroupDto } from './dto/create-group.dto';
import { GroupOwnerGuard } from './guards/group-owner.guard';
import { GroupMemberGuard } from './guards/group-member.guard';

@UseGuards(JwtAuthGuard)
@Controller('groups')
export class GroupsController {
    constructor(private readonly groupsService: GroupsService) {}

    // --- CÁC ROUTE CỤ THỂ (KHÔNG CÓ THAM SỐ) ĐƯỢC ĐẶT LÊN ĐẦU ---

    @Post()
    create(@GetUser() user: UserDocument, @Body() createGroupDto: CreateGroupDto) {
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

  @Post(':id/requests/:requestId/approve')
  @UseGuards(JwtAuthGuard, GroupOwnerGuard)
  approveRequest(
    @GetUser() owner: UserDocument, // Lấy thông tin chủ nhóm
    @Param('requestId') requestId: string
  ) {
    // Truyền owner xuống service
    return this.groupsService.approveRequest(requestId, owner);
  }
  
  @Post(':id/requests/:requestId/reject')
  @UseGuards(JwtAuthGuard, GroupOwnerGuard)
  rejectRequest(
    @GetUser() owner: UserDocument, // Lấy thông tin chủ nhóm
    @Param('requestId') requestId: string
  ) {
    // Truyền owner xuống service
    return this.groupsService.rejectRequest(requestId, owner);
  }

    // ✅ BỔ SUNG ROUTE RỜI NHÓM
  @Post(':id/leave')
  @UseGuards(JwtAuthGuard)
  leaveGroup(@GetUser() user: UserDocument, @Param('id') groupId: string) {
    return this.groupsService.leaveGroup(user, groupId);
  }

  // ✅ BỔ SUNG ROUTE LẤY THÀNH VIÊN (CHO TRANG QUẢN LÝ)
  @Get(':id/members')
  @UseGuards(JwtAuthGuard, GroupOwnerGuard) // Chỉ chủ nhóm mới được xem
  getGroupMembers(@Param('id') groupId: string) {
    return this.groupsService.getGroupMembers(groupId);
  }


  // ✅ BỔ SUNG ROUTE XÓA THÀNH VIÊN
  @Delete(':groupId/members/:memberUserId')
  @UseGuards(JwtAuthGuard, GroupOwnerGuard) // Chỉ chủ nhóm mới có quyền
  kickMember(
    @Param('groupId') groupId: string,
    @Param('memberUserId') memberUserId: string,
  ) {
    return this.groupsService.kickMember(groupId, memberUserId);
  }

    // ✅ BỔ SUNG API MỜI VÀO NHÓM
  @Post(':id/invite')
  @UseGuards(JwtAuthGuard, GroupMemberGuard) // Chỉ thành viên mới được mời
  createInvite(
    @Param('id') groupId: string,
    @GetUser() inviter: UserDocument,
    @Body('inviteeId') inviteeId: string,
  ) {
    return this.groupsService.createInvite(groupId, inviter, inviteeId);
  }
}