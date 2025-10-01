import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { UserDocument } from '../auth/schemas/user.schema';

export class UpdateInterestsDto {
  interestIds: string[];
}

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ===== PROFILE =====
  @Get('me')
  getMe(@GetUser() user: UserDocument) {
    return this.usersService.getMe(user._id.toString());
  }

  @Get('by-id/:id')
  findPublicById(@Param('id') id: string) {
    return this.usersService.findPublicById(id);
  }

  @Get('get/friends')
  getAllFriend(@GetUser() user: UserDocument) {
    return this.usersService.getAllFriend(user._id.toString());
  }

  @Get('get/dental/:id')
  getDental(@Param('id') id: string) {
    return this.usersService.GetUserDental(id);
  }

  // ===== WARNINGS =====
  @Get('warnings/get')
  async getWarnings(@GetUser() user: UserDocument) {
    return this.usersService.getWarnings(user._id.toString());
  }

  @Delete('warnings/clear')
  async clearWarnings(@GetUser() user: UserDocument): Promise<any> {
    return this.usersService.clearWarnings(user._id.toString());
  }

  @Delete('warnings/:id')
  async deleteWarning(
    @GetUser() user: UserDocument,
    @Param('id') warningId: string,
  ) {
    return this.usersService.deleteWarning(user._id.toString(), warningId);
  }

  // alias khớp FE cũ
  @Delete('warnings/delete/:id')
  async deleteWarningLegacy(
    @GetUser() user: UserDocument,
    @Param('id') warningId: string,
  ) {
    return this.usersService.deleteWarning(user._id.toString(), warningId);
  }

  // ===== UPDATE PROFILE =====
  @Patch('me')
  updateMyProfile(
    @GetUser() user: UserDocument,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    if (updateUserDto.interests && Array.isArray(updateUserDto.interests)) {
      return this.usersService.updateUserInterests(
        user._id.toString(),
        updateUserDto.interests,
      );
    }
    return this.usersService.updateProfile(user._id.toString(), updateUserDto);
  }

  @Patch('me/avatar')
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: diskStorage({
        destination: './uploads/avatars',
        filename: (_req, file, cb) => {
          const uniqueSuffix = Date.now() + extname(file.originalname);
          cb(null, `avatar-${uniqueSuffix}`);
        },
      }),
    }),
  )
  uploadAvatar(
    @GetUser() user: UserDocument,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const avatarPath = `/uploads/avatars/${file.filename}`;
    return this.usersService.updateAvatar(user._id.toString(), avatarPath);
  }

  @Patch('me/cover')
  @UseInterceptors(
    FileInterceptor('cover', {
      storage: diskStorage({
        destination: './uploads/covers',
        filename: (_req, file, cb) => {
          const uniqueSuffix = Date.now() + extname(file.originalname);
          cb(null, `cover-${uniqueSuffix}`);
        },
      }),
    }),
  )
  uploadCover(
    @GetUser() user: UserDocument,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const coverPath = `/uploads/covers/${file.filename}`;
    return this.usersService.updateCover(user._id.toString(), coverPath);
  }

  // ===== FOLLOW =====
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

  // ===== INTERESTS =====
  @Patch('me/interests')
  updateInterests(
    @GetUser() user: UserDocument,
    @Body() dto: UpdateInterestsDto,
  ) {
    return this.usersService.updateUserInterests(
      user._id.toString(),
      dto.interestIds,
    );
  }

  // ====== SEED DATA ======
  @Get('generate-fake')
  async generateFakeUsersGet(@Query('count') count?: string) {
    const n = Math.min(Math.max(Number(count) || 50, 1), 500);
    return this.usersService.generateFakeUsers(n);
  }

  @Post('generate-fake')
  async generateFakeUsers(@Body() body: { count?: number }) {
    const n = Number(body?.count ?? 50);
    return this.usersService.generateFakeUsers(n);
  }

  @Get('seed-posts')
  async seedPosts(
    @Query('min') min?: string,
    @Query('max') max?: string,
    @Query('days') days?: string,
  ) {
    const mi = Math.max(1, Number(min) || 15);
    const ma = Math.max(mi, Number(max) || 20);
    const d = Math.max(1, Number(days) || 120);
    return this.usersService.seedPostsForAllUsers(mi, ma, d);
  }

  @Get('seed-reactions')
  async seedReactions(
    @Query('min') min?: string,
    @Query('max') max?: string,
  ) {
    const mi = Math.max(0, Number(min) || 10);
    const ma = Math.max(mi, Number(max) || 40);
    return this.usersService.seedReactionsForAllPosts(mi, ma);
  }

  // ===== PUBLIC / DYNAMIC =====
  @Get(':param')
  findByUsernameOrId(@Param('param') param: string) {
    return this.usersService.findByUsernameOrId(param);
  }
}
