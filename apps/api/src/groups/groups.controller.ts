import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { UserDocument } from '../auth/schemas/user.schema';
import { CreateGroupDto } from './dto/create-group.dto';

@UseGuards(JwtAuthGuard)
@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post()
  create(@GetUser() user: UserDocument, @Body() createGroupDto: CreateGroupDto) {
    return this.groupsService.createGroup(user, createGroupDto);
  }

  @Post(':id/join')
  join(@GetUser() user: UserDocument, @Param('id') groupId: string) {
      return this.groupsService.joinGroup(user, groupId);
  }

  @Get('suggestions')
  getSuggestions(@GetUser() user: UserDocument) {
      return this.groupsService.suggestGroups(user);
  }
}
