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

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ===== ME / PROFILE =====
  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@GetUser() user: UserDocument) {
    return this.usersService.getMe(user._id.toString());
  }

  @Get('by-id/:id')
  findPublicById(@Param('id') id: string) {
    return this.usersService.findPublicById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('get/friends')
  getAllFriend(@GetUser() user: UserDocument) {
    return this.usersService.getAllFriend(user._id.toString());
  }

  @Get('get/dental/:id')
  getDental(@Param('id') id: string) {
    return this.usersService.GetUserDental(id);
  }

  // ===== WARNINGS =====
  @UseGuards(JwtAuthGuard)
  @Get('warnings/get')
  async getWarnings(@GetUser() user: UserDocument) {
    return this.usersService.getWarnings(user._id.toString());
  }

  @UseGuards(JwtAuthGuard)
  @Delete('warnings/clear')
  async clearWarnings(@GetUser() user: UserDocument): Promise<any> {
    return this.usersService.clearWarnings(user._id.toString());
  }

  @UseGuards(JwtAuthGuard)
  @Delete('warnings/:id')
  async deleteWarning(
    @GetUser() user: UserDocument,
    @Param('id') warningId: string,
  ) {
    return this.usersService.deleteWarning(user._id.toString(), warningId);
  }

  // alias khớp FE cũ
  @UseGuards(JwtAuthGuard)
  @Delete('warnings/delete/:id')
  async deleteWarningLegacy(
    @GetUser() user: UserDocument,
    @Param('id') warningId: string,
  ) {
    return this.usersService.deleteWarning(user._id.toString(), warningId);
  }

  // ===== UPDATE PROFILE =====
  @UseGuards(JwtAuthGuard)
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

  @UseGuards(JwtAuthGuard)
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

  @UseGuards(JwtAuthGuard)
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

  // ===== INTERESTS =====
  @UseGuards(JwtAuthGuard)
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

  /* ======= SEED / UTIL (browser quick) =======
     ⚠️ Consider protecting these in production (admin-only). */

  // GET /api/users/generate-fake?count=70
  @Get('generate-fake')
  async generateFakeUsersGet(@Query('count') count?: string) {
    const n = Math.min(Math.max(Number(count) || 50, 1), 500);
    return this.usersService.generateFakeUsers(n);
  }

  // POST /api/users/generate-fake { count: 50 }
  @Post('generate-fake')
  async generateFakeUsers(@Body() body: { count?: number }) {
    const n = Math.min(Math.max(Number(body?.count ?? 50) || 50, 1), 500);
    return this.usersService.generateFakeUsers(n);
  }

  // GET /api/users/seed-posts?min=15&max=20&days=120
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

  // GET /api/users/seed-reactions?min=10&max=40
  @Get('seed-reactions')
  async seedReactions(@Query('min') min?: string, @Query('max') max?: string) {
    const mi = Math.max(0, Number(min) || 10);
    const ma = Math.max(mi, Number(max) || 40);
    return this.usersService.seedReactionsForAllPosts(mi, ma);
  }

  // ===== PUBLIC GROUP APIs =====

  // GET /api/users/groups/public?page=1&limit=20&q=&interestId=
  @Get('groups/public')
  async listPublicGroups(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('q') q?: string,
    @Query('interestId') interestId?: string,
  ) {
    const p = Math.max(1, Number(page) || 1);
    const l = Math.min(100, Math.max(1, Number(limit) || 20));
    return this.usersService.listPublicGroups(p, l, q, interestId);
  }

  // GET /api/users/groups/fix-members?members=20
  @Get('groups/fix-members')
  async fixGroupMembers(@Query('members') members?: string) {
    const m = Math.max(1, Number(members) || 20);
    return this.usersService.fixGroupMembersForAll(m);
  }

  // GET /api/users/groups/fix-visuals
  @Get('groups/fix-visuals')
  async fixGroupVisuals() {
    return this.usersService.fixGroupVisualsForAll();
  }

  // GET /api/users/groups/fix-interests
  @Get('groups/fix-interests')
  async fixGroupInterests() {
    return this.usersService.fixGroupInterestsIfEmpty();
  }

  // GET /api/users/groups/join-random?take=10
  @UseGuards(JwtAuthGuard)
  @Get('groups/join-random')
  async joinRandomPublicGroups(
    @GetUser() user: UserDocument,
    @Query('take') take?: string,
  ) {
    const t = Math.max(1, Number(take) || 10);
    return this.usersService.joinRandomPublicGroupsForUser(
      user._id.toString(),
      t,
    );
  }

  // GET /api/users/groups/:id/fill-members?members=20
  @Get('groups/:id/fill-members')
  async fillMembersForGroupGet(
    @Param('id') id: string,
    @Query('members') members?: string,
  ) {
    const m = Math.max(1, Number(members) || 20);
    return this.usersService.forceFillGroupMembers(id, m);
  }

  // PATCH /api/users/groups/:id/fill-members?members=20
  @Patch('groups/:id/fill-members')
  async fillMembersForGroup(
    @Param('id') id: string,
    @Query('members') members?: string,
  ) {
    const m = Math.max(1, Number(members) || 20);
    return this.usersService.forceFillGroupMembers(id, m);
  }

  // GET /api/users/groups/:id/posts?page=1&limit=20
  @Get('groups/:id/posts')
  async getGroupPostsPublic(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const p = Math.max(1, Number(page) || 1);
    const l = Math.min(100, Math.max(1, Number(limit) || 20));
    return this.usersService.getGroupPostsPublic(id, p, l);
  }

  // ⚠️ Place after more specific group routes to avoid swallowing them
  @Get('groups/:id')
  async getGroupPublic(@Param('id') id: string) {
    return this.usersService.getGroupPublic(id);
  }

  // ===== PUBLIC / DYNAMIC — KEEP LAST =====
  @Get(':param')
  findByUsernameOrId(@Param('param') param: string) {
    return this.usersService.findByUsernameOrId(param);
  }
}
