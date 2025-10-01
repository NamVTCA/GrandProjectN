// apps/api/src/users/users.service.ts
import { Injectable, NotFoundException, Logger, Optional } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { faker as fakerVI } from '@faker-js/faker/locale/vi';

import { User, UserDocument } from '../auth/schemas/user.schema';
import { UpdateUserDto } from './dto/update-user.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/schemas/notification.schema';

import {
  Post as PostEntity,
  PostDocument,
  ModerationStatus,
  PostVisibility,
  ReactionType,
} from '../posts/schemas/post.schema';

import * as fs from 'fs';
import * as path from 'path';

/* =========================================================
   Helpers chung
========================================================= */
const MIN_U = 6;
const MAX_U = 12;

const toAscii = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd').toLowerCase();

const makeBaseUsername = (fullName: string): string => {
  let base = toAscii(fullName).replace(/[^a-z0-9]+/g, '');
  if (!base) base = 'user';
  if (base.length < MIN_U) base += fakerVI.string.alphanumeric(MIN_U - base.length).toLowerCase();
  else if (base.length > MAX_U) base = base.slice(0, MAX_U);
  return base;
};

const makeUniqueUsername = (base: string, used: Set<string>): string => {
  if (!used.has(base)) { used.add(base); return base; }
  for (let i = 0; i < 50; i++) {
    const room = Math.max(0, MAX_U - base.length);
    const suffixLen = room > 0 ? Math.min(room, 4) : 2;
    const prefixLen = MAX_U - suffixLen;
    const cand1 = (base + fakerVI.string.numeric(suffixLen)).slice(0, MAX_U);
    if (!used.has(cand1)) { used.add(cand1); return cand1; }
    const cand2 = base.slice(0, prefixLen) + fakerVI.string.numeric(suffixLen);
    if (!used.has(cand2)) { used.add(cand2); return cand2; }
  }
  const fallback = fakerVI.string.alphanumeric(MAX_U).toLowerCase();
  used.add(fallback);
  return fallback;
};

type UserSeed = {
  username: string;
  email?: string;
  password?: string;
  bio?: string;
  avatar?: string;
  coverImage?: string;
  birthday?: Date;
  purchasedItems?: string[];
  activeItem?: string | null;
  equippedAvatarFrame?: Types.ObjectId | null | undefined;
  friends?: Types.ObjectId[];
};

const VI_LOCATIONS = [
  'Hà Nội','Đà Nẵng','TP.HCM','Hải Phòng','Cần Thơ','Nha Trang','Huế','Vũng Tàu',
  'Buôn Ma Thuột','Đà Lạt','Quy Nhơn','Phan Thiết','Hạ Long','Nam Định','Thái Nguyên',
  'Biên Hòa','Thủ Đức','Tân Uyên','Thành phố Vinh',
];
const VI_DISHES = [
  'bún bò Huế','phở bò','mì cay','bánh cuốn','bánh mì trứng','cơm tấm sườn bì chả',
  'hủ tiếu nam vang','bánh canh cua','bún chả','bánh xèo','mì Quảng',
];
const VI_COFFEE = [
  'cà phê sữa đá','bạc xỉu','cold brew cam sả','espresso','latte','capuchino','trà đào cam sả',
];
const TECH_STACK = ['NestJS','MongoDB','React','TypeScript','Next.js','Docker','Redis','RabbitMQ','Prisma'];
const MUSIC_GENRES = ['lofi','indie Việt','pop ballad','V-Pop','US-UK 2000s','EDM'];
const MOVIE_GENRES = ['phim trinh thám','phim hoạt hình','phim khoa học viễn tưởng','phim tâm lý','phim hành động'];
const GENERAL_HASHTAGS = ['#daily','#cuocsong','#chill','#coding','#music','#movie','#travel','#amthuc','#coffee'];
const EMOJI_HAPPY = ['😄','✨','🔥','❤️','🎵','📷','☕','🥳','🍜','💻','🎬','🌿','🌅','👍'];

const VIBES = ['trời đẹp','không khí dễ chịu','ánh sáng ưng','view xịn sò','rất chill','đông vui','yên tĩnh','màu sắc đã mắt','đầy năng lượng','dễ thương'];
const ACTION_IMG = ['lưu lại','bắt trọn','chụp vội','check-in','bấm máy','ngắm nghía','dạo một vòng','bắt nét','ghi lại','gom vài khoảnh khắc'];
const ACTION_VID = ['mini vlog','đoạn clip nhỏ','timelapse nhanh','hậu trường nhẹ','city walk','chuyển cảnh cho vui','một ngày của mình','đi dạo một chút'];
const TAGS_IMAGE = ['#photo','#daily','#city','#travel','#street','#snapshot','#mood'];
const TAGS_VIDEO = ['#clip','#vlog','#citylife','#daily','#travel','#shotonphone'];

const LAST_IMG_CAP = { val: '' };
const LAST_VID_CAP = { val: '' };
const nonRepeat = (gen: () => string, lastRef: { val: string }) => {
  for (let i = 0; i < 8; i++) { const s = gen().trim(); if (s && s !== lastRef.val) { lastRef.val = s; return s; } }
  const s = gen().trim(); lastRef.val = s; return s;
};

const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
const pickN = <T,>(arr: T[], n: number) => {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a.slice(0, Math.max(0, Math.min(n, a.length)));
};
const cap = (s: string) => s.charAt(0) + s.slice(1);
const sentence = (parts: string[]) => cap(parts.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim()) + '.';

type GenPostResult = { content: string; mediaUrls: string[] };

const SEED_DIR = path.join(process.cwd(), 'uploads', 'seed');
type SeedTopic = 'food' | 'coffee' | 'city' | 'architecture' | 'video';
const ensureDir = (p: string) => { if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true }); };
(['food', 'coffee', 'city', 'architecture', 'video'] as SeedTopic[]).forEach((t) => ensureDir(path.join(SEED_DIR, t)));

const getLocalFile = (topic: SeedTopic, exts: RegExp): string | null => {
  const dir = path.join(SEED_DIR, topic);
  if (!fs.existsSync(dir)) return null;
  const files = fs.readdirSync(dir).filter((f) => exts.test(f));
  if (!files.length) return null;
  const f = files[Math.floor(Math.random() * files.length)];
  return `/uploads/seed/${topic}/${f}`;
};
const getLocalImage = (topic: Exclude<SeedTopic,'video'>) => getLocalFile(topic, /\.(jpe?g|png|webp|gif)$/i);
const getLocalVideo = () => getLocalFile('video', /\.(mp4|webm|ogg)$/i);
const picsum = (w = 1200, h = 800) => `https://picsum.photos/seed/${fakerVI.string.alphanumeric(8)}/${w}/${h}`;
const topicImages = (topic: Exclude<SeedTopic,'video'>, count = 1): string[] => {
  const out: string[] = []; for (let i = 0; i < count; i++) out.push(getLocalImage(topic) ?? picsum(1200, 800)); return out;
};
const topicVideo = () => getLocalVideo() ?? 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

const genFoodPost = (): GenPostResult => {
  const dish = pick(VI_DISHES); const city = pick(VI_LOCATIONS);
  const feel = pick(['khá ngon','ổn áp','đậm vị','giá ok','đáng thử','hơi mặn nhưng ổn']);
  const text = sentence([`Hôm nay ăn ${dish} ở ${city}, ${feel}`, pick(EMOJI_HAPPY)]);
  return { content: `${text} #amthuc #daily`, mediaUrls: topicImages('food', 1) };
};
const genCoffeePost = (): GenPostResult => {
  const drink = pick(VI_COFFEE); const city = pick(VI_LOCATIONS);
  const text = sentence([`Ngồi quán nhỏ ở ${city}, gọi ${drink}, nghe nhạc nhẹ`, pick(EMOJI_HAPPY)]);
  return { content: `${text} #coffee #chill`, mediaUrls: topicImages('coffee', 1) };
};
const genCodingPost = (): GenPostResult => {
  const tech = pick(TECH_STACK); const feel = pick(['cuối cùng cũng xong','học được khối điều hay ho','đang vướng chỗ tối ưu query','merge PR thành công']);
  const text = sentence([`Vừa nghịch ${tech}, ${feel}`, pick(EMOJI_HAPPY)]);
  return { content: `${text} #coding #tech`, mediaUrls: [] };
};
const genTravelPost = (): GenPostResult => {
  const city = pick(VI_LOCATIONS);
  const text = sentence([`Dạo một vòng ${city}, thời tiết dễ chịu`, pick(EMOJI_HAPPY)]);
  return { content: `${text} #travel #daily`, mediaUrls: topicImages('city', rand(1, 3)) };
};
const genMusicPost = (): GenPostResult => {
  const g = pick(MUSIC_GENRES);
  const text = sentence([`Đang nghe playlist ${g}, thư giãn hẳn`, pick(EMOJI_HAPPY)]);
  return { content: `${text} #music #chill`, mediaUrls: [] };
};
const genMoviePost = (): GenPostResult => {
  const g = pick(MOVIE_GENRES);
  const text = sentence([`Vừa xem ${g}, nội dung ổn, hình ảnh đẹp`, pick(EMOJI_HAPPY)]);
  return { content: `${text} #movie`, mediaUrls: [] };
};
const genPhotoPost = (): GenPostResult => {
  const city = pick(VI_LOCATIONS);
  const text = sentence([`Chụp nhanh một góc ở ${city}`, pick(EMOJI_HAPPY)]);
  return { content: `${text} #daily #photo`, mediaUrls: topicImages('architecture', rand(1, 2)) };
};
const genLifePost = (): GenPostResult => {
  const text = sentence([pick(['Hôm nay xử lý xong mớ việc tồn','Cuối ngày ngồi tổng kết một chút','Đầu tuần nhẹ nhàng','Cuối tuần nghỉ ngơi tái tạo năng lượng']), pick(EMOJI_HAPPY)]);
  const tags = pickN(GENERAL_HASHTAGS, rand(0, 2)).join(' ');
  return { content: `${text}${tags ? ' ' + tags : ''}`, mediaUrls: [] };
};

const genImagePostByRule = (withText: boolean): GenPostResult => {
  const count = withText ? rand(1, 3) : rand(3, 5);
  const topic = pick(['city','architecture','food','coffee'] as const);
  const mediaUrls = topicImages(topic, count);
  if (!withText) return { content: '', mediaUrls };
  const city = pick(VI_LOCATIONS);
  const caption = nonRepeat(() => {
    const variant = pick([
      () => sentence([`${pick(ACTION_IMG)} vài khoảnh khắc ở ${city}, ${pick(VIBES)}`, pick(EMOJI_HAPPY)]),
      () => sentence([`Một góc ${city} ${pick(['buổi sáng','buổi chiều','ban đêm'])}, ${pick(VIBES)}`, pick(EMOJI_HAPPY)]),
      () => sentence([`Đi ngang qua ${city}, thấy cảnh đẹp thì chụp liền`, pick(EMOJI_HAPPY)]),
      () => sentence([`Album mini tại ${city}`, pick(EMOJI_HAPPY)]),
      () => sentence([`Lưu nhanh chút kỷ niệm ở ${city}`, pick(EMOJI_HAPPY)]),
    ]);
    const tags = pickN(TAGS_IMAGE, rand(0, 2)).join(' ');
    return `${variant()}${tags ? ' ' + tags : ''}`;
  }, LAST_IMG_CAP);
  return { content: caption, mediaUrls };
};
const genVideoPostByRule = (withText: boolean): GenPostResult => {
  const url = topicVideo();
  if (!withText) return { content: '', mediaUrls: [url] };
  const caption = nonRepeat(() => {
    const city = pick(VI_LOCATIONS);
    const variant = pick([
      () => sentence([`Một chút nhịp sống ${city}`, pick(EMOJI_HAPPY)]),
      () => sentence([`${pick(ACTION_VID)} ${pick(['trong ngày','cuối tuần','buổi tối'])}`, pick(EMOJI_HAPPY)]),
      () => sentence([`Đoạn clip ngắn ở ${city}, ${pick(VIBES)}`, pick(EMOJI_HAPPY)]),
      () => sentence([`Đổi gió một tí, xem thử`, pick(EMOJI_HAPPY)]),
      () => sentence([`Vài cảnh chuyển ${pick(['sáng','chiều','tối'])}`, pick(EMOJI_HAPPY)]),
      () => sentence([`Thử quay ${pick(['timelapse','slow motion','handheld'])}`, pick(EMOJI_HAPPY)]),
    ]);
    const tags = pickN(TAGS_VIDEO, rand(0, 2)).join(' ');
    return `${variant()}${tags ? ' ' + tags : ''}`;
  }, LAST_VID_CAP);
  return { content: caption, mediaUrls: [url] };
};

const TOPIC_POOL = [genFoodPost, genCoffeePost, genCodingPost, genTravelPost, genPhotoPost, genMusicPost, genMoviePost, genLifePost];

const randomDateWithin = (days: number) => { const now = Date.now(); const past = now - days * 86400000; return new Date(rand(past, now)); };
const randomDateAfter = (start: Date) => new Date(rand(start.getTime(), Date.now()));

const weightedPickReaction = (): ReactionType => {
  const bag: ReactionType[] = [
    ReactionType.LIKE,ReactionType.LIKE,ReactionType.LIKE,ReactionType.LIKE,ReactionType.LIKE,
    ReactionType.LOVE,ReactionType.LOVE,ReactionType.LOVE,
    ReactionType.HAHA,ReactionType.WOW,
    ReactionType.SAD,ReactionType.ANGRY,
  ];
  return pick(bag);
};

const sampleUnique = <T,>(arr: T[], k: number) => {
  const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a.slice(0, Math.max(0, Math.min(k, a.length)));
};
const chance = (p: number) => Math.random() < p;

type PostLite = { _id: Types.ObjectId | string; author: Types.ObjectId | string; content?: string; mediaUrls?: string[]; createdAt?: Date; };
type CommentTopic = 'video'|'photo'|'food'|'coffee'|'travel'|'coding'|'music'|'movie'|'general';
const VIDEO_EXT = /\.(mp4|webm|ogg)$/i;
const COMMENT_BANK: Record<CommentTopic, string[]> = {
  photo: ['Ảnh đẹp ghê!','Màu lên thích quá','Góc chụp ổn áp đó','View này chill thật','Nhìn muốn đi ngay luôn','Tone này nhìn đã mắt','Ảnh có vibe quá nè'],
  video: ['Đoạn này xem chill ghê!','Chuyển cảnh mượt á','Nhịp quay dễ chịu phết','Clip xem thư giãn quá','Góc quay hay ho nè','Xem cuốn thật'],
  food: ['Nhìn hấp dẫn quá!','Trông đậm vị ghê','Muốn thử liền luôn','Điểm mười cho món này','Nhìn mà đói bụng quá','Có vẻ hợp khẩu vị lắm'],
  coffee: ['Ly này đúng gu nè','Nhìn là thấy tỉnh liền','Quán có vibe ghê','Bạc xỉu là chân ái','Nhấp ngụm là phê ngay','Muốn đi làm ly quá'],
  travel: ['Muốn xách balo đi ngay!','Địa điểm này đẹp quá','Vibe du lịch quá đã','Nhìn thôi là thấy chill','Thêm vào list phải đi','Cảnh xịn sò luôn'],
  coding: ['Cố lên dev ơi!','Bug rồi fix là win','Merge PR là thấy phê','Học được nhiều ghê','Tech này gần đây hot đó','Code xíu đi cà phê!'],
  music: ['Playlist này nghe hay á','Bài này đúng gu mình','Nghe xong thấy relax','Cho xin tên bài luôn','Nhạc vào là có mood liền','Quẩy nhẹ cái nhỉ'],
  movie: ['Phim này nghe review tốt nè','Hình ảnh đẹp thiệt','Cốt truyện ổn áp','Cho xin tên phim với','Thêm vào watchlist liền','Diễn xuất ổn ghê'],
  general: ['Hay quá nè!','Nhìn thích ghê','Có vibe dễ chịu','Xịn sò luôn á','Tâm trạng lên liền','Tuyệt vời đó'],
};
const REPLY_BANK = ['Chuẩn luôn nè!','Đồng ý ghê','Haha đúng á','Thêm 1 vote','Chuẩn bài!','Công nhận!','Hehe thế là hiểu','Hay đó nha','Được đó','Chuẩn không cần chỉnh'];
const EMOJI_LIGHT = ['😄','✨','🔥','❤️','👍','👌','🙌','😌','👏'];

const containsAny = (raw: string, list: string[]) => {
  const s = (raw || '').toLowerCase(); return list.some((w) => s.includes(w.toLowerCase()));
};
const getTimestampFromId = (id: Types.ObjectId | string): Date => {
  try { const hex = typeof id === 'string' ? id : id.toString(); return new Types.ObjectId(hex).getTimestamp(); }
  catch { return new Date(); }
};
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

const detectTopic = (p: PostLite): CommentTopic => {
  const content = (p.content || '').toLowerCase(); const urls = p.mediaUrls || [];
  if (urls.some((u) => VIDEO_EXT.test(u))) return 'video';
  if (containsAny(content, ['#amthuc','ăn ','món ','quán'])) return 'food';
  if (containsAny(content, ['#coffee','cà phê','cafe','bạc xỉu','espresso'])) return 'coffee';
  if (containsAny(content, ['#travel','đi chơi','đi dạo','dạo một vòng','check-in','view'])) return 'travel';
  if (containsAny(content, ['#coding','code','bug','merge pr', ...TECH_STACK.map(s=>s.toLowerCase())])) return 'coding';
  if (containsAny(content, ['#music','playlist','bài này','nhạc'])) return 'music';
  if (containsAny(content, ['#movie','phim','xem phim'])) return 'movie';
  if (urls.length) return 'photo';
  return 'general';
};

const genGenericComment = (topic: CommentTopic): string => {
  const base = pick(COMMENT_BANK[topic]); const tail = chance(0.35) ? ' ' + pick(EMOJI_LIGHT) : ''; return base + tail;
};

/* =========================================================
   SERVICE
========================================================= */
@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(PostEntity.name) private postModel: Model<PostDocument>,
    @InjectModel('Comment') private commentModel: Model<any>,
    @InjectModel('Group') private groupModel: Model<any>,

    // bắt buộc để trước optional để tránh TS1016
    private notificationsService: NotificationsService,

    // optional đặt cuối
    @Optional() @InjectModel('GroupPost') private groupPostModel?: Model<any>,
    @Optional() @InjectModel('Interest') private interestModel?: Model<any>,
  ) {}

  /* ===== PUBLIC USERS ===== */
  async findPublicById(id: string | Types.ObjectId): Promise<UserDocument> {
    const idStr = String(id);
    if (!Types.ObjectId.isValid(idStr)) throw new NotFoundException(`Không tìm thấy người dùng với id=${idStr}`);
    const user = await this.userModel
      .findById(idStr)
      .select('-password -email')
      .populate({ path: 'equippedAvatarFrame', select: 'assetUrl type' })
      .exec();
    if (!user) throw new NotFoundException(`Không tìm thấy người dùng với id=${idStr}`);
    return user;
  }

  async findByUsernameOrId(param: string): Promise<UserDocument> {
    const isId = Types.ObjectId.isValid(param);
    const query = isId ? this.userModel.findById(param) : this.userModel.findOne({ username: param });
    const user = await query.select('-password -email').populate({ path: 'equippedAvatarFrame', select: 'assetUrl type' }).exec();
    if (!user) throw new NotFoundException(isId ? `Không tìm thấy người dùng với id=${param}` : `Không tìm thấy người dùng ${param}`);
    return user;
  }

  /* ===== SEED USERS / POSTS / REACTIONS / COMMENTS ===== */
  async generateFakeUsers(num: number) {
    const used = new Set<string>();
    const exists = await this.userModel.find().select('username').lean();
    for (const e of exists) if (e?.username) used.add(e.username);

    const docs: UserSeed[] = Array.from({ length: num }).map(() => {
      const fullName = fakerVI.person.fullName();
      const base = makeBaseUsername(fullName);
      const username = makeUniqueUsername(base, used);
      const email = `${username}@example.com`;
      const password = 'Seed@12345';
      return {
        username, email, password,
        bio: fakerVI.helpers.arrayElement([
          'Xin chào mọi người!','Chia sẻ điều thú vị mỗi ngày.','Yêu lập trình và bóng đá.','Đang học NestJS + MongoDB.',
        ]),
        avatar: fakerVI.image.avatar(),
        coverImage: '',
        birthday: fakerVI.date.birthdate({ min: 18, max: 45, mode: 'age' }),
        purchasedItems: [],
        activeItem: null,
        equippedAvatarFrame: null,
        friends: [],
      };
    });

    try {
      const created = await this.userModel.insertMany(docs as any, { ordered: false });
      return { inserted: created.length, tried: docs.length };
    } catch (err: any) {
      const inserted = Array.isArray(err?.insertedDocs) ? err.insertedDocs.length : 0;
      const duplicates =
        Array.isArray(err?.writeErrors) ? err.writeErrors.length :
        Array.isArray(err?.result?.result?.writeErrors) ? err.result.result.writeErrors.length : undefined;
      this.logger.warn(`Seed users partial: inserted=${inserted}/${docs.length}`);
      return { inserted, tried: docs.length, duplicates };
    }
  }

  async seedPostsForAllUsers(min = 15, max = 20, withinDays = 120) {
    const users = await this.userModel.find().select('_id username').lean();
    const bulkDocs: (Partial<PostEntity> & { createdAt?: Date; updatedAt?: Date })[] = [];

    for (const u of users) {
      const existing = await this.postModel.countDocuments({ author: u._id });
      const target = rand(min, max);
      const need = Math.max(0, target - existing);
      if (need === 0) continue;

      for (let i = 0; i < need; i++) {
        const createdAt = randomDateWithin(withinDays);
        let content = '';
        let mediaUrls: string[] = [];
        const r = Math.random();
        if (r < 0.35) ({ content, mediaUrls } = genVideoPostByRule(Math.random() < 0.5));
        else if (r < 0.85) ({ content, mediaUrls } = genImagePostByRule(Math.random() < 0.5));
        else {
          const p = pick(TOPIC_POOL)();
          const hasText = !!p.content?.trim();
          const needImgs = hasText ? rand(1, 3) : rand(3, 5);
          mediaUrls = p.mediaUrls?.length ? p.mediaUrls.slice(0, needImgs) : [];
          while (mediaUrls.length < needImgs) {
            mediaUrls = mediaUrls.concat(
              topicImages(pick(['city','architecture','food','coffee'] as const), needImgs - mediaUrls.length),
            );
          }
          content = p.content;
        }

        bulkDocs.push({
          moderationStatus: ModerationStatus.APPROVED,
          author: u._id as any,
          content,
          mediaUrls,
          reactions: [],
          commentCount: 0,
          repostCount: rand(0, 3),
          visibility: PostVisibility.PUBLIC,
          createdAt,
          updatedAt: createdAt,
        });
      }
    }

    if (bulkDocs.length === 0) {
      return { inserted: 0, triedUsers: users.length, docsTried: 0, note: 'Đã đủ bài hoặc chưa có user.' };
    }

    const res = await this.postModel.insertMany(bulkDocs as any[], { ordered: false });
    return { inserted: res.length, triedUsers: users.length, docsTried: bulkDocs.length };
  }

  async seedReactionsForAllPosts(min = 10, max = 40) {
    const users = await this.userModel.find().select('_id').lean();
    const allUserIds = users.map(u => String(u._id));

    const posts = (await this.postModel
      .find()
      .select('_id author reactions createdAt')
      .lean()
      .exec()) as unknown as {
        _id: Types.ObjectId;
        author: Types.ObjectId;
        createdAt?: Date;
        reactions?: { user?: Types.ObjectId; type?: ReactionType; createdAt?: Date }[];
      }[];

    let totalAdded = 0;

    for (const p of posts) {
      const already = new Set<string>(
        (p.reactions ?? [])
          .map(r => r?.user && String(r.user))
          .filter(Boolean) as string[],
      );

      const candidates = allUserIds.filter(
        uid => uid !== String(p.author) && !already.has(uid),
      );
      if (candidates.length === 0) continue;

      const want = rand(min, max);
      const take = Math.min(want, candidates.length);
      const pickedUsers = sampleUnique(candidates, take);

      const baseCreated = p.createdAt ?? getTimestampFromId(p._id);

      const newReacts = pickedUsers.map(uid => ({
        user: new Types.ObjectId(uid),
        type: weightedPickReaction(),
        createdAt: randomDateAfter(new Date(baseCreated)),
      }));

      await this.postModel.updateOne(
        { _id: p._id },
        { $push: { reactions: { $each: newReacts } } },
      );

      totalAdded += newReacts.length;
    }

    return { posts: posts.length, addedReactions: totalAdded };
  }

  async seedCommentsForAllPosts(minTopLevel = 6, maxTopLevel = 18, replyChance = 0.35) {
    const users = await this.userModel.find().select('_id').lean();
    const allUserIds = users.map(u => String(u._id));
    if (allUserIds.length === 0) {
      return { posts: 0, comments: 0, replies: 0, note: 'Chưa có user.' };
    }

    const posts = (await this.postModel
      .find()
      .select('_id author content mediaUrls createdAt commentCount')
      .lean()
      .exec()) as unknown as PostLite[];

    let totalComments = 0;
    let totalReplies = 0;

    for (const p of posts) {
      const authorId = String(p.author);
      const candidates = allUserIds.filter((id) => id !== authorId);
      if (candidates.length === 0) continue;

      const topic = detectTopic(p);
      const want = rand(minTopLevel, maxTopLevel);
      const take = Math.min(want, candidates.length);
      const commenters = sampleUnique(candidates, take);

      const baseCreated = p.createdAt ?? getTimestampFromId(p._id);

      // 1) Bình luận gốc
      const parentDocs = commenters.map((uid) => {
        const createdAt = randomDateAfter(new Date(baseCreated));
        const likesCount = rand(0, Math.min(12, Math.floor(allUserIds.length * 0.1)));
        const likerPool = allUserIds.filter((x) => x !== uid && x !== authorId);
        const likerIds = sampleUnique(likerPool, likesCount).map((x) => new Types.ObjectId(x));
        return {
          author: new Types.ObjectId(uid),
          post: new Types.ObjectId(String(p._id)),
          content: genGenericComment(topic),
          likes: likerIds,
          replyCount: 0,
          createdAt,
          updatedAt: createdAt,
        };
      });

      const insertedParents = await this.commentModel.insertMany(parentDocs as any[], { ordered: false });
      totalComments += insertedParents.length;

      // 2) Reply ngẫu nhiên
      const parentsForReply = insertedParents.filter(() => chance(replyChance));
      const replyDocs: any[] = [];

      for (const parent of parentsForReply) {
        const possibleRepliers = allUserIds.filter(
          (x) => x !== authorId && x !== String((parent as any).author),
        );
        const numReplies = rand(1, Math.min(3, Math.floor(possibleRepliers.length * 0.05) + 1));
        const repliers = sampleUnique(possibleRepliers, numReplies);

        for (const rid of repliers) {
          const parentCreated =
            (parent as any).createdAt
              ? new Date((parent as any).createdAt)
              : getTimestampFromId((parent as any)._id);
          const createdAt = randomDateAfter(parentCreated);

          const likesCount = rand(0, Math.min(8, Math.floor(allUserIds.length * 0.06)));
          const likerPool = allUserIds.filter((x) => x !== rid && x !== authorId);
          const likerIds = sampleUnique(likerPool, likesCount).map((x) => new Types.ObjectId(x));

          replyDocs.push({
            author: new Types.ObjectId(rid),
            post: new Types.ObjectId(String(p._id)),
            content: pick(REPLY_BANK),
            likes: likerIds,
            parentComment: (parent as any)._id,
            replyCount: 0,
            createdAt,
            updatedAt: createdAt,
          });
        }
      }

      if (replyDocs.length) {
        const insertedReplies = await this.commentModel.insertMany(replyDocs as any[], { ordered: false });
        totalReplies += insertedReplies.length;

        // cập nhật replyCount
        const countByParent = new Map<string, number>();
        for (const r of insertedReplies) {
          const k = String((r as any).parentComment);
          countByParent.set(k, (countByParent.get(k) ?? 0) + 1);
        }
        const bulkUpdateParents = Array.from(countByParent.entries()).map(([pid, inc]) => ({
          updateOne: {
            filter: { _id: new Types.ObjectId(pid) },
            update: { $inc: { replyCount: inc } },
          },
        }));
        if (bulkUpdateParents.length) {
          await this.commentModel.bulkWrite(bulkUpdateParents);
        }
      }

      // 3) Cập nhật post.commentCount
      const incTotal = insertedParents.length + (replyDocs.length || 0);
      if (incTotal > 0) {
        await this.postModel.updateOne(
          { _id: p._id as any },
          { $inc: { commentCount: incTotal } },
        );
      }
    }

    return { posts: posts.length, comments: totalComments, replies: totalReplies };
  }

  /* =========================================================
     THEME nhóm & ảnh theo Interest (hoặc fallback)
  ========================================================= */
  private normalize(s: string) {
    return toAscii(s || '').replace(/[^a-z0-9]+/g, ' ').trim();
  }

  private TOPIC_KEYWORDS: Record<string, string> = {
    // sports
    'bong da': 'football', 'football': 'football', 'soccer': 'football', 'world cup': 'football',
    'bong ro': 'basketball', 'basketball': 'basketball', 'nba': 'basketball',
    // hobbies
    'nhiep anh': 'photography', 'photography': 'photography', 'photo': 'photography',
    'du lich': 'travel', 'travel': 'travel', 'phuot': 'travel',
    'am thuc': 'food', 'mon an': 'food', 'food': 'food', 'an uong': 'food',
    'ca phe': 'coffee', 'coffee': 'coffee',
    'thu cung': 'pets', 'dog': 'pets', 'cat': 'pets', 'pet': 'pets',
    'gym': 'fitness', 'fitness': 'fitness', 'the hinh': 'fitness',
    'cong nghe': 'tech', 'tech': 'tech', 'gadget': 'tech',
    'phim': 'movies', 'movie': 'movies', 'cinema': 'movies',
    'nhac': 'music', 'music': 'music',
    'anime': 'anime', 'manga': 'anime',
    'coding': 'coding', 'lap trinh': 'coding', 'developer': 'coding',
  };

  private TOPIC_DISPLAY: Record<string, { vi: string; hashtags: string[]; keywords: string[] }> = {
    football: { vi: 'Bóng đá', hashtags: ['#bongda','#football'], keywords: ['football','soccer','premier league'] },
    basketball: { vi: 'Bóng rổ', hashtags: ['#bongro','#nba'], keywords: ['basketball','nba'] },
    photography: { vi: 'Nhiếp ảnh', hashtags: ['#photo','#photography'], keywords: ['photography','camera','street'] },
    travel: { vi: 'Du lịch', hashtags: ['#travel','#citywalk'], keywords: ['travel','city','mountain','beach'] },
    food: { vi: 'Ẩm thực', hashtags: ['#food','#amthuc'], keywords: ['food','cuisine','vietnamese food'] },
    coffee: { vi: 'Cà phê', hashtags: ['#coffee','#caphesang'], keywords: ['coffee','latte','espresso'] },
    pets: { vi: 'Thú cưng', hashtags: ['#pets','#dog','#cat'], keywords: ['dog','cat','puppy','kitten'] },
    fitness: { vi: 'Gym / Fitness', hashtags: ['#gym','#fitness'], keywords: ['gym','fitness','workout'] },
    tech: { vi: 'Công nghệ', hashtags: ['#tech','#gadget'], keywords: ['tech','gadget','pc setup'] },
    movies: { vi: 'Phim ảnh', hashtags: ['#movie','#cinema'], keywords: ['movie','cinema','film'] },
    music: { vi: 'Âm nhạc', hashtags: ['#music','#playlist'], keywords: ['music','concert','vinyl'] },
    anime: { vi: 'Anime / Manga', hashtags: ['#anime','#manga'], keywords: ['anime','manga'] },
    coding: { vi: 'Coding', hashtags: ['#coding','#devlife'], keywords: ['code','programming','developer'] },
  };

  private pickTopicByInterestName(name: string): string {
    const n = this.normalize(name);
    for (const key in this.TOPIC_KEYWORDS) {
      if (n.includes(key)) return this.TOPIC_KEYWORDS[key];
    }
    return pick(Object.keys(this.TOPIC_DISPLAY));
  }

  private themedImage(keyword: string): string {
    // Ưu tiên ảnh local: /uploads/seed/interests/<keyword>/*
    const localDir = path.join(SEED_DIR, 'interests', keyword);
    if (fs.existsSync(localDir)) {
      const imgs = fs.readdirSync(localDir).filter(f => /\.(jpe?g|png|webp|gif)$/i.test(f));
      if (imgs.length) return `/uploads/seed/interests/${keyword}/${pick(imgs)}`;
    }
    // Fallback ảnh theo chủ đề
    const seed = fakerVI.string.alphanumeric(8);
    return `https://loremflickr.com/1200/800/${encodeURIComponent(keyword)}?lock=${seed}`;
  }

  private buildGroupNameDisplay(topicSlug: string): string {
    const disp = this.TOPIC_DISPLAY[topicSlug];
    const city = pick(VI_LOCATIONS);
    return pick([
      `Cộng đồng ${disp.vi} Việt Nam`,
      `Hội ${disp.vi} & Bạn Bè`,
      `${disp.vi} ${city}`,
      `Vui cùng ${disp.vi}`,
      `${disp.vi} 24/7`,
    ]);
  }

  private buildGroupDescription(topicSlug: string): string {
    const disp = this.TOPIC_DISPLAY[topicSlug];
    return pick([
      `Nơi chia sẻ đam mê ${disp.vi}, cập nhật mỗi ngày.`,
      `Cùng nhau bàn luận và khoe ảnh ${disp.vi}!`,
      `Góc ${disp.vi} thân thiện – tôn trọng và tích cực.`,
      `Chia sẻ kinh nghiệm, mẹo hay về ${disp.vi}.`,
      `Tham gia để lan toả tình yêu ${disp.vi}!`,
    ]);
  }

  private buildGroupPost(topicSlug: string): { content: string; mediaUrls: string[] } {
    const disp = this.TOPIC_DISPLAY[topicSlug];
    const kw = pick(disp.keywords);
    const mediaUrls = [this.themedImage(kw)];
    const capLine = pick([
      `Một chút ${disp.vi.toLowerCase()} cho ngày mới`,
      `Chia sẻ nhanh về ${disp.vi.toLowerCase()}`,
      `Góc ${disp.vi.toLowerCase()} hôm nay`,
      `${disp.vi} làm mình thấy vui`,
      `Khoảnh khắc ${disp.vi.toLowerCase()}`,
    ]);
    const tags = disp.hashtags.join(' ');
    return { content: `${capLine} ${tags}`, mediaUrls };
  }

  /* =========================================================
     SEED NHÓM THEO CHỦ ĐỀ + ĐĂNG BÀI TRONG NHÓM
  ========================================================= */
  async seedGroupsThemed(groupsCount = 15, membersPerGroup = 20, postsPerMember = 2, withinDays = 180) {
    const users = await this.userModel.find().select('_id username').lean();
    const allUserIds = users.map(u => String(u._id));
    if (allUserIds.length === 0) return { created: 0, reason: 'Chưa có user để tạo nhóm.' };

    // Lấy interests (nếu có)
    const interests = this.interestModel
      ? await this.interestModel.find().select('_id name').lean()
      : [];

    const usedNames = new Set<string>();
    const groupsToInsert: any[] = [];

    for (let i = 0; i < groupsCount; i++) {
      const interest = interests.length ? pick(interests) : null;
      const topicSlug = interest ? this.pickTopicByInterestName((interest as any).name || '') : pick(Object.keys(this.TOPIC_DISPLAY));

      let name = this.buildGroupNameDisplay(topicSlug);
      // tránh trùng tên
      for (let k = 0; k < 20 && usedNames.has(name); k++) {
        name = `${this.buildGroupNameDisplay(topicSlug)} ${fakerVI.string.alphanumeric(3)}`;
      }
      usedNames.add(name);

      const description = this.buildGroupDescription(topicSlug);
      const createdAt = randomDateWithin(withinDays);

      const need = clamp(membersPerGroup, 1, allUserIds.length);
      const memberIds = sampleUnique(allUserIds, need);
      const ownerId = memberIds[Math.floor(Math.random() * memberIds.length)];
      const canModerators = memberIds.filter(id => id !== ownerId);
      const modCount = Math.min(2, Math.max(0, Math.floor(Math.random() * 3)));
      const moderators = sampleUnique(canModerators, Math.min(modCount, canModerators.length));

      const members = memberIds.map(uid => ({
        user: new Types.ObjectId(uid),
        role: uid === ownerId ? 'OWNER' : (moderators.includes(uid) ? 'MODERATOR' : 'MEMBER'),
        joinedAt: randomDateAfter(new Date(createdAt)),
      }));

      groupsToInsert.push({
        name,
        description,
        owner: new Types.ObjectId(ownerId),
        interests: interest ? [new Types.ObjectId(String((interest as any)._id))] : [],
        privacy: 'public',
        avatar: '',
        coverImage: '',
        members,
        createdAt,
        updatedAt: createdAt,
        __topicSlug: topicSlug, // giữ tạm để tạo post
      });
    }

    // insert groups
    const insertedGroups = await this.groupModel.insertMany(
      groupsToInsert.map(g => { const { __topicSlug, ...doc } = g; return doc; }),
      { ordered: false }
    );

    // map _id & topic cho bước tạo bài
    const createdGroups = insertedGroups.map((g, idx) => ({
      _id: g._id,
      topic: (groupsToInsert[idx] as any).__topicSlug,
      createdAt: (g as any).createdAt,
      members: (groupsToInsert[idx] as any).members,
    }));

    // tạo bài trong nhóm
    const postDocs: any[] = [];
    for (const g of createdGroups) {
      const topicSlug = g.topic as string;
      const baseCreated: Date = g.createdAt || new Date();
      const memberIds = (g.members as any[]).map(m => String(m.user));
      for (const uid of memberIds) {
        for (let k = 0; k < postsPerMember; k++) {
          const p = this.buildGroupPost(topicSlug);
          const createdAt = randomDateAfter(new Date(baseCreated));
          // build cho cả 2 trường hợp: GroupPost riêng hoặc Post có field group
          postDocs.push({
            group: new Types.ObjectId(String(g._id)),
            author: new Types.ObjectId(uid),
            content: p.content,
            mediaUrls: p.mediaUrls,
            createdAt,
            updatedAt: createdAt,
          });
        }
      }
    }

    // Ưu tiên dùng GroupPost nếu có, không thì thử PostModel (nếu Post có field `group`)
    let postsCreated = 0;
    if (this.groupPostModel) {
      const res = await this.groupPostModel.insertMany(postDocs, { ordered: false });
      postsCreated = res.length;
    } else {
      const hasGroupPath = (this.postModel as any)?.schema?.paths?.group;
      if (hasGroupPath) {
        const docs = postDocs.map(d => ({
          ...d,
          moderationStatus: ModerationStatus.APPROVED,
          reactions: [],
          commentCount: 0,
          repostCount: rand(0, 2),
          visibility: PostVisibility.PUBLIC,
        }));
        const res = await this.postModel.insertMany(docs as any[], { ordered: false });
        postsCreated = res.length;
      }
    }

    return {
      groupsCreated: insertedGroups.length,
      postsCreated,
      membersPerGroup,
      postsPerMember,
    };
  }

  /* ========= PUBLIC GROUP QUERIES ========= */

  async listPublicGroups(page = 1, limit = 20, q?: string, interestId?: string) {
  const filter: any = { privacy: 'public' };
  if (q) filter.name = { $regex: q, $options: 'i' };
  if (interestId && Types.ObjectId.isValid(interestId)) filter.interests = new Types.ObjectId(interestId);

  const [raw, total] = await Promise.all([
    this.groupModel
      .find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate({ path: 'owner', select: 'username avatar' })
      .populate({ path: 'interests', select: 'name' })
      .lean(),
    this.groupModel.countDocuments(filter),
  ]);

  const items = this.attachMemberCount<any>(raw as any[]);
  return { items, page, limit, total };
}

async getGroupPublic(id: string) {
  if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Nhóm không hợp lệ');
  const g = await this.groupModel
    .findById(id)
    .populate({ path: 'owner', select: 'username avatar' })
    .populate({ path: 'members.user', select: 'username avatar' })
    .populate({ path: 'interests', select: 'name' })
    .lean();
  if (!g) throw new NotFoundException('Không tìm thấy nhóm');

  const [item] = this.attachMemberCount<any>([g as any]);
  return item;
}


  async getGroupPostsPublic(groupId: string, page = 1, limit = 20) {
    if (!Types.ObjectId.isValid(groupId)) {
      throw new NotFoundException('Nhóm không hợp lệ');
    }
    const gid = new Types.ObjectId(groupId);

    // Nếu có GroupPost model → dùng; nếu không, fallback qua PostModel (nếu Post có field "group")
    if (this.groupPostModel) {
      const [items, total] = await Promise.all([
        this.groupPostModel
          .find({ group: gid })
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .populate({ path: 'author', select: 'username avatar' })
          .lean(),
        this.groupPostModel.countDocuments({ group: gid }),
      ]);
      return { items, page, limit, total };
    } else {
      const hasGroupPath = (this.postModel as any)?.schema?.paths?.group;
      if (!hasGroupPath) {
        return { items: [], page, limit, total: 0, note: 'Không có model GroupPost và Post không hỗ trợ group' };
      }
      const [items, total] = await Promise.all([
        this.postModel
          .find({ group: gid })
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .populate({ path: 'author', select: 'username avatar' })
          .lean(),
        this.postModel.countDocuments({ group: gid }),
      ]);
      return { items, page, limit, total };
    }
  }

  private inferTopicFromGroupNameDesc(name?: string, desc?: string) {
  const text = this.normalize(`${name || ''} ${desc || ''}`);
  for (const key in this.TOPIC_KEYWORDS) {
    if (text.includes(key)) return this.TOPIC_KEYWORDS[key];
  }
  return 'travel';
}

// ✅ Backfill MEMBERS cho nhóm trống (đảm bảo có owner + đủ N thành viên)
async fixGroupMembersForAll(membersPerGroup = 20) {
  const users = await this.userModel.find().select('_id').lean();
  const all = users.map(u => String(u._id));
  if (!all.length) return { updated: 0, note: 'Chưa có user.' };

  const empties = await this.groupModel
    .find({ $or: [{ members: { $exists: false } }, { members: { $size: 0 } }] })
    .select('_id owner createdAt')
    .lean();

  let updated = 0;
  for (const g of empties) {
    const owner = String((g as any).owner);
    const need = clamp(membersPerGroup, 1, all.length);
    let picked = sampleUnique(all, need);
    // đảm bảo owner nằm trong danh sách
    if (!picked.includes(owner)) {
      picked[0] = owner; // overwrite 1 slot
    }

    const base = (g as any).createdAt ? new Date((g as any).createdAt) : new Date();
    const members = picked.map(uid => ({
      user: new Types.ObjectId(uid),
      role: uid === owner ? 'OWNER' : 'MEMBER',
      joinedAt: randomDateAfter(base),
    }));

    await this.groupModel.updateOne({ _id: g._id }, { $set: { members, privacy: 'public' } });
    updated++;
  }
  return { updated };
}

// Cho user hiện tại join ngẫu nhiên X nhóm public
async joinRandomPublicGroupsForUser(userId: string | Types.ObjectId, take = 10) {
  const uid = new Types.ObjectId(String(userId));

  const candidates = await this.groupModel
    .find({ privacy: 'public', 'members.user': { $ne: uid } })
    .select('_id name')
    .limit(200)
    .lean();

  if (!candidates.length) return { joined: 0, tried: 0 };

  const picked = candidates.sort(() => Math.random() - 0.5).slice(0, Math.max(1, take));
  const ops = picked.map((g: any) => ({
    updateOne: {
      filter: { _id: g._id, 'members.user': { $ne: uid } },
      update: { $push: { members: { user: uid, role: 'MEMBER', joinedAt: new Date() } } },
    },
  }));
  await this.groupModel.bulkWrite(ops);
  return { joined: ops.length, tried: picked.length };
}

// Gán 1 interest ngẫu nhiên cho nhóm nào chưa có (nếu có bảng interests)
async fixGroupInterestsIfEmpty() {
  if (!this.interestModel) return { updated: 0, note: 'Không có model Interest.' };

  const interests = await this.interestModel.find().select('_id name').lean();
  if (!interests.length) return { updated: 0, note: 'Chưa có interest nào trong DB.' };

  const emptyGroups = await this.groupModel
    .find({ $or: [{ interests: { $exists: false } }, { interests: { $size: 0 } }] })
    .select('_id')
    .lean();

  if (!emptyGroups.length) return { updated: 0 };

  const ops = emptyGroups.map((g: any) => ({
    updateOne: {
      filter: { _id: g._id },
      update: { $set: { interests: [interests[Math.floor(Math.random() * interests.length)]._id] } },
    },
  }));
  await this.groupModel.bulkWrite(ops);
  return { updated: ops.length };
}

// Ép 1 nhóm có đủ N thành viên (giữ owner & thành viên sẵn có)
async forceFillGroupMembers(groupId: string, targetMembers = 20) {
  if (!Types.ObjectId.isValid(groupId)) {
    throw new NotFoundException('Nhóm không hợp lệ');
  }

  // Lấy nhóm dạng lean, rồi ép về any để TS không phàn nàn
  const gRaw = await this.groupModel
    .findById(groupId)
    .select('_id owner members createdAt')
    .lean();

  if (!gRaw) throw new NotFoundException('Không tìm thấy nhóm');

  const g: any = gRaw; // <-- ép kiểu

  const users = await this.userModel.find().select('_id').lean();
  const all = users.map((u) => String(u._id));

  const currentMembers = Array.isArray(g.members) ? g.members : [];
  if (!all.length) {
    return { added: 0, total: currentMembers.length, note: 'Chưa có user.' };
  }

  const existing = new Set<string>(currentMembers.map((m: any) => String(m.user)));
  const ownerId = String(g.owner);
  existing.add(ownerId);

  const target = Math.max(1, Math.min(targetMembers, all.length));
  const need = Math.max(0, target - existing.size);
  if (need === 0) {
    return { added: 0, total: existing.size };
  }

  const pool = all.filter((u) => !existing.has(u));
  const toAdd = sampleUnique(pool, need);
  const base = g.createdAt ? new Date(g.createdAt) : new Date();

  const newMembers = toAdd.map((uid) => ({
    user: new Types.ObjectId(uid),
    role: 'MEMBER',
    joinedAt: randomDateAfter(base),
  }));

  await this.groupModel.updateOne(
    { _id: new Types.ObjectId(String(g._id)) },
    { $push: { members: { $each: newMembers } }, $set: { privacy: 'public' } },
  );

  return { added: newMembers.length, total: existing.size + newMembers.length };
}


// ✅ Sửa avatar/cover thiếu dựa trên chủ đề đoán từ tên/mô tả
async fixGroupVisualsForAll() {
  const groups = await this.groupModel
    .find()
    .select('_id name description avatar coverImage')
    .lean();

  let updated = 0;
  for (const g of groups) {
    const needAv = !g.avatar || !g.avatar.trim();
    const needCv = !g.coverImage || !g.coverImage.trim();
    if (!needAv && !needCv) continue;

    const topic = this.inferTopicFromGroupNameDesc(g.name, g.description);
    const kw = pick(this.TOPIC_DISPLAY[topic].keywords);
    const avatar = needAv ? this.themedImage(kw) : g.avatar;
    const cover = needCv ? this.themedImage(kw) : g.coverImage;

    await this.groupModel.updateOne({ _id: g._id }, { $set: { avatar, coverImage: cover } });
    updated++;
  }
  return { updated };
}

// ✅ (phòng hờ) Khi trả về list/chi tiết nhóm mà vẫn .lean(), tự nhét memberCount
private attachMemberCount<T extends { members?: any[] }>(items: T[]): T[] {
  return items.map(i => ({ ...i, memberCount: i.members?.length || 0 })) as T[];
}

  /* ===== MUTATIONS & OTHERS ===== */
  async updateProfile(userId: string | Types.ObjectId, updateUserDto: UpdateUserDto): Promise<UserDocument> {
    const updated = await this.userModel.findByIdAndUpdate(userId, updateUserDto, { new: true }).select('-password').exec();
    if (!updated) throw new NotFoundException('Không tìm thấy người dùng'); return updated;
  }

  async updateAvatar(userId: string | Types.ObjectId, avatarPath: string): Promise<UserDocument> {
    const updated = await this.userModel.findByIdAndUpdate(userId, { avatar: avatarPath }, { new: true }).select('-password').exec();
    if (!updated) throw new NotFoundException('Không tìm thấy người dùng khi cập nhật avatar'); return updated;
  }

  async updateCover(userId: string | Types.ObjectId, coverPath: string): Promise<UserDocument> {
    const updated = await this.userModel.findByIdAndUpdate(userId, { coverImage: coverPath }, { new: true }).select('-password').exec();
    if (!updated) throw new NotFoundException('Không tìm thấy người dùng khi cập nhật cover'); return updated;
  }

  async followUser(currentUserId: string | Types.ObjectId, userIdToFollow: string) {
    if (currentUserId.toString() === userIdToFollow) throw new Error('Bạn không thể tự theo dõi chính mình.');
    await this.userModel.findByIdAndUpdate(currentUserId, { $addToSet: { following: userIdToFollow } });
    await this.userModel.findByIdAndUpdate(userIdToFollow, { $addToSet: { followers: currentUserId } });
    const userToFollowDoc = await this.userModel.findById(userIdToFollow);
    const currentUserDoc = await this.userModel.findById(currentUserId);
    if (!userToFollowDoc || !currentUserDoc) throw new NotFoundException('Không tìm thấy người dùng để tạo thông báo.');
    await this.receiveXP(2, 'follow', currentUserId.toString(), userIdToFollow.toString());
    await this.notificationsService.createNotification(userToFollowDoc, currentUserDoc, NotificationType.NEW_FOLLOWER, `/profile/${currentUserDoc.username}`);
    return { message: 'Theo dõi thành công.' };
  }

  async unfollowUser(currentUserId: string | Types.ObjectId, userIdToUnfollow: string) {
    await this.userModel.findByIdAndUpdate(currentUserId, { $pull: { following: userIdToUnfollow } });
    await this.userModel.findByIdAndUpdate(userIdToUnfollow, { $pull: { followers: currentUserId } });
    return { message: 'Bỏ theo dõi thành công.' };
  }

  async updateUserInterests(userId: string, interestIds: string[]): Promise<UserDocument> {
    const updated = await this.userModel.findByIdAndUpdate(userId, { $set: { interests: interestIds, hasSelectedInterests: true } }, { new: true }).populate('interests').exec();
    if (!updated) throw new NotFoundException('Không tìm thấy người dùng'); return updated;
  }

  async receiveXP(xp: number, kind: string, userId: string, _follow?: string): Promise<void> {
    const user = await this.userModel.findById(userId);
    if (!user) { this.logger.warn(`User with ID ${userId} not found.`); return; }
    if (kind === 'follow') await this.handleUserFollowed(userId);
    if ((user as any).xp_per_day >= 250) {
      await this.notificationsService.createNotification(user, user, NotificationType.NEW_NOTIFICATION, null);
      this.logger.log(`User ${user.username} reached daily XP limit.`); return;
    }
    const allowedXP = Math.max(0, 250 - ((user as any).xp_per_day ?? 0));
    const add = Math.min(xp, allowedXP);
    (user as any).xp_per_day = ((user as any).xp_per_day ?? 0) + add;
    (user as any).xp = ((user as any).xp ?? 0) + add;
    await (user as any).save();
  }

  async handleUserFollowed(followedUserId: string): Promise<void> {
    const user: any = await this.userModel.findById(followedUserId);
    if (!user) { this.logger.warn(`User with ID ${followedUserId} not found.`); return; }
    const baseXP = 20;
    const canAddBase = Math.max(0, 250 - (user.xp_per_day ?? 0));
    const baseAdded = Math.min(baseXP, canAddBase);
    user.xp_per_day = (user.xp_per_day ?? 0) + baseAdded; user.xp = (user.xp ?? 0) + baseAdded;
    const currentFollowers = user.followers?.length || 0;
    const milestones = [{ count: 10, bonusXP: 100 },{ count: 50, bonusXP: 300 },{ count: 100, bonusXP: 800 },{ count: 500, bonusXP: 3000 },{ count: 1000, bonusXP: 7000 }];
    user.milestonesReached ??= [];
    for (const m of milestones) {
      if (currentFollowers >= m.count && !user.milestonesReached.includes(m.count)) {
        const canAddBonus = Math.max(0, 250 - (user.xp_per_day ?? 0));
        const bonusAdded = Math.min(canAddBonus, m.bonusXP);
        user.xp_per_day += bonusAdded; user.xp += bonusAdded; user.milestonesReached.push(m.count);
        this.logger.log(`User ${user.username} đạt mốc ${m.count}. Bonus ${bonusAdded} XP.`);
      }
    }
    await user.save();
  }

  async GetUserDental(id: string) { return this.userModel.findById(id).exec(); }

  async getAllFriend(id: string) {
    const user = await this.userModel.findById(id).populate('friends').exec();
    if (!user) throw new NotFoundException('Người dùng không tồn tại');
    return (user as any).friends;
  }

  async getWarnings(userId: string) {
    const user = await this.userModel.findById(userId).select('warnings').populate([
      { path: 'warnings.by', select: 'username avatar' },
      { path: 'warnings.reason', select: 'reasonText' },
    ]);
    if (!user) throw new NotFoundException('Người dùng không tồn tại.');
    return (user as any).warnings;
  }

  async deleteWarning(userId: string, warningId: string) {
    const user: any = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('Người dùng không tồn tại.');
    if (!Array.isArray(user.warnings)) user.warnings = [];
    const warningIndex = user.warnings.findIndex((w: any) => w._id?.toString() === warningId);
    if (warningIndex < 0) throw new NotFoundException('Cảnh cáo không tồn tại.');
    user.warnings.splice(warningIndex, 1);
    await user.save();
    return { message: 'Xoá cảnh cáo thành công.' };
  }

  async getMe(userId: string | Types.ObjectId) {
    const me = await this.userModel.findById(userId)
      .select('username email avatar coins hasSelectedInterests globalRole friends currentGame coverImage equippedAvatarFrame')
      .populate({ path: 'equippedAvatarFrame', select: 'assetUrl type' })
      .lean().exec();
    if (!me) throw new NotFoundException('Không tìm thấy người dùng');
    return me;
  }
}
