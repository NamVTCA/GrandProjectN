// apps/api/src/users/users.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { UserDocument } from '../auth/schemas/user.schema';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Route công khai để xem profile
  @Get(':username')
  findByUsername(@Param('username') username: string) {
    return this.usersService.findByUsername(username);
  }

  // Route được bảo vệ để user tự cập nhật profile
  @UseGuards(JwtAuthGuard)
  @Patch('me')
  updateProfile(
    @GetUser() user: UserDocument,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.updateProfile(user._id.toString(), updateUserDto);
  }

  // Route được bảo vệ để theo dõi user khác
  @UseGuards(JwtAuthGuard)
  @Post(':id/follow')
  followUser(
    @GetUser() currentUser: UserDocument,
    @Param('id') userIdToFollow: string,
  ) {
    return this.usersService.followUser(
      currentUser._id.toString(),
      userIdToFollow,
    );
  }

  // Route được bảo vệ để bỏ theo dõi
  @UseGuards(JwtAuthGuard)
  @Delete(':id/follow')
  unfollowUser(
    @GetUser() currentUser: UserDocument,
    @Param('id') userIdToUnfollow: string,
  ) {
    return this.usersService.unfollowUser(
      currentUser._id.toString(),
      userIdToUnfollow,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me/interests')
  updateInterests(
    @GetUser() user: UserDocument,
    @Body('interestIds') interestIds: string[],
  ) {
    return this.usersService.updateUserInterests(
      user._id.toString(),
      interestIds,
    );
  }
}
