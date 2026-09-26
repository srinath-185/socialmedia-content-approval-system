import * as mongoose from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import { resolve } from 'path';
import { Types } from 'mongoose';

import { Role, Platform, PostStatus } from '../common/enums';
import { CAPTION_LIMITS } from '../common/constants/platform-limits';
import { UserSchema, User } from '../users/schemas/user.schema';
import { ClientSchema, Client } from '../clients/schemas/client.schema';
import { PostSchema, Post } from '../posts/schemas/post.schema';
import { CommentSchema, Comment } from '../comments/schemas/comment.schema';
import { AuditLogSchema, AuditLog } from '../audit-logs/schemas/audit-log.schema';

dotenv.config({ path: resolve(__dirname, '../../.env') });

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/content_approval_system';

const UserModel = mongoose.model<User>(User.name, UserSchema);
const ClientModel = mongoose.model<Client>(Client.name, ClientSchema);
const PostModel = mongoose.model<Post>(Post.name, PostSchema);
const CommentModel = mongoose.model<Comment>(Comment.name, CommentSchema);
const AuditLogModel = mongoose.model<AuditLog>(AuditLog.name, AuditLogSchema);

const HOUR = 3600 * 1000;
const now = Date.now();
const hoursAgo = (h: number) => new Date(now - h * HOUR);
const hoursAhead = (h: number) => new Date(now + h * HOUR);

/** Plausible Chennai/Coimbatore client-side IPs and browser strings for audit realism. */
const CHENNAI_IPS = ['49.207.184.36', '106.75.11.92', '157.46.84.201', '49.36.179.58'];
const CHROME_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36';

type UserKey = 'admin' | 'creator1' | 'creator2' | 'reviewer1' | 'reviewer2';
type ClientKey = 'kaveri' | 'pampaana' | 'illam' | 'sandpiper';

interface ReviewComment {
  author: UserKey;
  hoursAfterSubmit: number;
  message: string;
}

interface PostSeed {
  client: ClientKey;
  platform: Platform;
  caption: string;
  status: PostStatus;
  createdBy: UserKey;
  /** Hours ago the creator submitted the post for review. Undefined => still a draft. */
  submittedHoursAgo?: number;
  /** Reviewer decision that moved the post out of IN_REVIEW. */
  review?: {
    decision: 'APPROVED' | 'CHANGES_REQUESTED';
    reviewer: UserKey;
    hoursAfterSubmit: number;
    comment?: string;
  };
  /** Hours ago a CHANGES_REQUESTED post was resubmitted. */
  resubmittedHoursAgo?: number;
  /** Additional thread replies, oldest first. */
  thread?: ReviewComment[];
  scheduledAt?: Date;
  version: number;
}

async function seed() {
  console.log('Connecting to MongoDB database at:', MONGODB_URI);
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB.');

  // Clear existing collections
  await Promise.all([
    UserModel.deleteMany({}),
    ClientModel.deleteMany({}),
    PostModel.deleteMany({}),
    CommentModel.deleteMany({}),
    AuditLogModel.deleteMany({}),
  ]);
  console.log('Cleared existing records.');

  // Build the real indexes (unique email/brandName, post workflow, scheduling conflict index)
  await Promise.all([
    UserModel.syncIndexes(),
    ClientModel.syncIndexes(),
    PostModel.syncIndexes(),
    CommentModel.syncIndexes(),
    AuditLogModel.syncIndexes(),
  ]);

  const hash = (pwd: string) => bcrypt.hash(pwd, 10);

  // ---------------------------------------------------------------- 1. Users
  const users = await UserModel.create([
    {
      name: 'Karthik Subramaniam',
      email: 'admin@concepsmedia.com',
      password: await hash('Admin@123'),
      role: Role.ADMIN,
    },
    {
      name: 'Divya Natarajan',
      email: 'creator1@concepsmedia.com',
      password: await hash('Creator@123'),
      role: Role.CREATOR,
    },
    {
      name: 'Arun Prabhakaran',
      email: 'creator2@concepsmedia.com',
      password: await hash('Creator@123'),
      role: Role.CREATOR,
    },
    {
      name: 'Meenakshi Raghunathan',
      email: 'reviewer1@concepsmedia.com',
      password: await hash('Reviewer@123'),
      role: Role.REVIEWER,
    },
    {
      name: 'Sridhar Balasubramanian',
      email: 'reviewer2@concepsmedia.com',
      password: await hash('Reviewer@123'),
      role: Role.REVIEWER,
    },
  ]);

  const u: Record<UserKey, User & { _id: Types.ObjectId }> = {
    admin: users[0],
    creator1: users[1],
    creator2: users[2],
    reviewer1: users[3],
    reviewer2: users[4],
  };

  console.log('Seeded 5 users across ADMIN, CREATOR, and REVIEWER roles.');

  // -------------------------------------------------------------- 2. Clients
  const clients = await ClientModel.create([
    {
      brandName: 'Kaveri Precision Engineering Pvt Ltd',
      reviewers: [u.reviewer1._id, u.reviewer2._id],
    },
    {
      brandName: 'Pampaana Aqua Systems Pvt Ltd',
      reviewers: [u.reviewer1._id],
    },
    {
      brandName: 'Illam Digital Solutions Pvt Ltd',
      reviewers: [u.reviewer2._id],
    },
    {
      brandName: 'Sandpiper Coastal Hospitality Pvt Ltd',
      reviewers: [u.reviewer1._id, u.reviewer2._id],
    },
  ]);

  const c: Record<ClientKey, Client & { _id: Types.ObjectId; reviewers: Types.ObjectId[] }> = {
    kaveri: clients[0],
    pampaana: clients[1],
    illam: clients[2],
    sandpiper: clients[3],
  };

  console.log('Seeded 4 client brands with assigned reviewers.');

  // ---------------------------------------------------------------- 3. Posts
  const postsSeedData: PostSeed[] = [
    // ------------------------------------------------------------- DRAFT
    {
      client: 'kaveri',
      platform: Platform.X,
      caption:
        'Tooling trial starts next week. If Chennai builds a Motor Sports City, we want the jigs already proven. More soon.',
      status: PostStatus.DRAFT,
      createdBy: 'creator1',
      version: 1,
    },
    {
      client: 'pampaana',
      platform: Platform.INSTAGRAM,
      caption:
        '1,671 km of drain lines. One map, updated live. We spent the monsoon walking every ward so your alerts arrive before the water does. Reel drops Sunday.',
      status: PostStatus.DRAFT,
      createdBy: 'creator2',
      version: 1,
    },
    {
      client: 'illam',
      platform: Platform.LINKEDIN,
      caption:
        'Every major platform now ships AI-content labelling. Here is what that changes for brand teams running Reels at volume, and the three-line disclosure we think is enough.',
      status: PostStatus.DRAFT,
      createdBy: 'creator1',
      version: 1,
    },
    {
      client: 'sandpiper',
      platform: Platform.INSTAGRAM,
      caption:
        'Monsoon does not have to mean a cancelled trip. Our Mahabalipuram kitchen is doing eight hours of rain, one very good filter coffee and absolutely no itinerary.',
      status: PostStatus.DRAFT,
      createdBy: 'creator2',
      version: 1,
    },

    // --------------------------------------------------------- IN_REVIEW
    {
      client: 'kaveri',
      platform: Platform.LINKEDIN,
      caption:
        'Chennai just welcomed its first large global capability centre, and Coimbatore already has three more. We are hiring 26 engineers across EV powertrain, thermal management and quality. Full descriptions in the comments.',
      status: PostStatus.IN_REVIEW,
      createdBy: 'creator1',
      submittedHoursAgo: 6,
      thread: [
        {
          author: 'creator2',
          hoursAfterSubmit: 2,
          message:
            'Headcount confirmed with HR as 26. I have the JD links ready if you want them pinned to the first comment.',
        },
      ],
      version: 2,
    },
    {
      client: 'pampaana',
      platform: Platform.FACEBOOK,
      caption:
        'Weak monsoon, 40-degree afternoons, and a dry month in the interior districts. We spent the last fortnight walking canal systems in north Tamil Nadu. Here is what is actually flowing and what is not.',
      status: PostStatus.IN_REVIEW,
      createdBy: 'creator2',
      submittedHoursAgo: 11,
      version: 2,
    },
    {
      client: 'illam',
      platform: Platform.X,
      caption:
        'Chennai has quietly become one of Asia\'s serious investment destinations. Global capability centres, a defence corridor, and an Olympic City in the same decade. The talent argument is already over.',
      status: PostStatus.IN_REVIEW,
      createdBy: 'creator1',
      submittedHoursAgo: 4,
      version: 2,
    },
    {
      client: 'sandpiper',
      platform: Platform.X,
      caption:
        'National Coffee Day is 29 September. Our Mahabalipuram filter coffee is single-origin, and on that day it comes with the view. No discount code needed.',
      status: PostStatus.IN_REVIEW,
      createdBy: 'creator2',
      submittedHoursAgo: 2,
      version: 2,
    },

    // --------------------------------------------------- CHANGES_REQUESTED
    {
      client: 'kaveri',
      platform: Platform.INSTAGRAM,
      caption:
        'We got the first quarter wrong. The line balancing on Line 4 cost us eleven days and nobody caught it. Here is the whole ugly version, no before-and-after, no stock footage.',
      status: PostStatus.CHANGES_REQUESTED,
      createdBy: 'creator1',
      submittedHoursAgo: 30,
      review: {
        decision: 'CHANGES_REQUESTED',
        reviewer: 'reviewer1',
        hoursAfterSubmit: 5,
        comment:
          'Honest post, keep the tone. But two issues: the customer name on Line 4 is identifiable from the photo, and we cannot use the phrase "nobody caught it" without HR sign-off. Blur the nameplate and rephrase the accountability line.',
      },
      resubmittedHoursAgo: 7,
      thread: [
        {
          author: 'creator1',
          hoursAfterSubmit: 22,
          message:
            'Plate is blurred in v2 and the line now reads "we caught it late". Uploading the revised card now, can you take another look?',
        },
      ],
      version: 3,
    },
    {
      client: 'pampaana',
      platform: Platform.LINKEDIN,
      caption:
        'Nungambakkam hit 38.1C this month. That is the second highest September reading in a decade, and it is not an urban heat island problem, it is a weak-monsoon problem. What that means for irrigation scheduling.',
      status: PostStatus.CHANGES_REQUESTED,
      createdBy: 'creator2',
      submittedHoursAgo: 26,
      review: {
        decision: 'CHANGES_REQUESTED',
        reviewer: 'reviewer1',
        hoursAfterSubmit: 4,
        comment:
          'The temperature figures need a source line and the historical comparison needs the all-time record cited, otherwise it reads as a claim. Also add a note that irrigation advice is advisory and district officers hold the final call.',
      },
      version: 2,
    },
    {
      client: 'illam',
      platform: Platform.FACEBOOK,
      caption:
        'One of our retail clients cut approval turnaround from nine days to four. Same team, same volume. The only structural change was moving review out of email and into a single queue with named owners.',
      status: PostStatus.CHANGES_REQUESTED,
      createdBy: 'creator1',
      submittedHoursAgo: 52,
      review: {
        decision: 'CHANGES_REQUESTED',
        reviewer: 'reviewer2',
        hoursAfterSubmit: 7,
        comment:
          'We need written consent from the client before naming the outcome, and the "nine days to four" number has to be verifiable. Please confirm both, or we reframe it as an anonymised composite.',
      },
      version: 2,
    },
    {
      client: 'sandpiper',
      platform: Platform.X,
      caption:
        'It cannot always be Mumbai or Goa. Mahabalipuram holds it down. Stone, surf and a temple older than most of the hotels we fly people to.',
      status: PostStatus.CHANGES_REQUESTED,
      createdBy: 'creator2',
      submittedHoursAgo: 18,
      review: {
        decision: 'CHANGES_REQUESTED',
        reviewer: 'reviewer2',
        hoursAfterSubmit: 3,
        comment:
          'The format works. Two fixes: we are not verified on X yet so drop the handle from the caption, and please add a location tag and a photo. I also want us to avoid implying any city is lesser.',
      },
      version: 2,
    },

    // ------------------------------------------------------------ APPROVED
    {
      client: 'kaveri',
      platform: Platform.FACEBOOK,
      caption:
        'Three global capability centres landed in Tamil Nadu in the same month. For a component maker that means one thing: the engineering talent pool just got a lot deeper. We are hiring across precision manufacturing and supply chain.',
      status: PostStatus.APPROVED,
      createdBy: 'creator1',
      submittedHoursAgo: 60,
      review: {
        decision: 'APPROVED',
        reviewer: 'reviewer1',
        hoursAfterSubmit: 9,
      },
      version: 2,
    },
    {
      client: 'pampaana',
      platform: Platform.INSTAGRAM,
      caption:
        'Sixty of our field engineers are on stormwater duty this week. No campaign, no hashtag, just drains. Swipe for the ward-by-ward progress, updated every evening.',
      status: PostStatus.APPROVED,
      createdBy: 'creator2',
      submittedHoursAgo: 40,
      review: {
        decision: 'APPROVED',
        reviewer: 'reviewer1',
        hoursAfterSubmit: 5,
      },
      version: 2,
    },
    {
      client: 'illam',
      platform: Platform.INSTAGRAM,
      caption:
        'No studio, no teleprompter, one take, phone audio. Our account manager walking a client through a rollback in real time. This is the format that is quietly beating our polished Reels.',
      status: PostStatus.APPROVED,
      createdBy: 'creator1',
      submittedHoursAgo: 22,
      review: {
        decision: 'APPROVED',
        reviewer: 'reviewer2',
        hoursAfterSubmit: 4,
      },
      version: 2,
    },

    // ----------------------------------------------------------- SCHEDULED
    {
      client: 'kaveri',
      platform: Platform.X,
      scheduledAt: hoursAhead(26),
      caption:
        'Motor Sports City gets its formal announcement. If you machine jigs, fixtures or gear components, the tool room matters more than the podium. We will be watching.',
      status: PostStatus.SCHEDULED,
      createdBy: 'creator1',
      submittedHoursAgo: 70,
      review: {
        decision: 'APPROVED',
        reviewer: 'reviewer1',
        hoursAfterSubmit: 6,
      },
      version: 3,
    },
    {
      client: 'pampaana',
      platform: Platform.LINKEDIN,
      scheduledAt: hoursAhead(44),
      caption:
        'Our quarterly water-impact report is out: diversion recovered, treated volume returned to the system, and what the monsoon did to our assumptions. Full methodology in the post.',
      status: PostStatus.SCHEDULED,
      createdBy: 'creator2',
      submittedHoursAgo: 66,
      review: {
        decision: 'APPROVED',
        reviewer: 'reviewer1',
        hoursAfterSubmit: 8,
      },
      version: 3,
    },
    {
      client: 'sandpiper',
      platform: Platform.INSTAGRAM,
      scheduledAt: hoursAhead(68),
      caption:
        'The festive season table is set. Nine nights of Navaratri dinners, then the long weekend. Our Mahabalipuram kitchen opens for the full stretch, and the courtyard seats forty.',
      status: PostStatus.SCHEDULED,
      createdBy: 'creator2',
      submittedHoursAgo: 80,
      review: {
        decision: 'APPROVED',
        reviewer: 'reviewer1',
        hoursAfterSubmit: 11,
      },
      version: 3,
    },

    // ----------------------------------------------------------- PUBLISHED
    {
      client: 'pampaana',
      platform: Platform.FACEBOOK,
      scheduledAt: hoursAgo(50),
      caption:
        'Before the first heavy spell: the twelve things every ward should clear this week, and the three numbers to watch if the drains start backing up. Written for residents, not engineers.',
      status: PostStatus.PUBLISHED,
      createdBy: 'creator2',
      submittedHoursAgo: 96,
      review: {
        decision: 'APPROVED',
        reviewer: 'reviewer1',
        hoursAfterSubmit: 10,
      },
      version: 4,
    },
    {
      client: 'illam',
      platform: Platform.LINKEDIN,
      scheduledAt: hoursAgo(31),
      caption:
        'We are opening a 40-seat engineering floor in Chennai. Payment infrastructure, mostly. Hiring is open now and we are more interested in people who have taken a system down than people who have never had to.',
      status: PostStatus.PUBLISHED,
      createdBy: 'creator1',
      submittedHoursAgo: 110,
      review: {
        decision: 'APPROVED',
        reviewer: 'reviewer2',
        hoursAfterSubmit: 14,
      },
      version: 4,
    },
  ];

  // ------------------------------------------------ Seed integrity self-checks
  const problems: string[] = [];

  for (const [i, p] of postsSeedData.entries()) {
    const label = `${p.platform} #${i + 1} (${p.status})`;
    const limit = CAPTION_LIMITS[p.platform];
    if (p.caption.length > limit) {
      problems.push(`${label}: caption is ${p.caption.length} chars, limit for ${p.platform} is ${limit}`);
    }
    if (/[A-Za-z]/.test(p.caption) && /[\u0B80-\u0BFF]/.test(p.caption)) {
      problems.push(`${label}: caption mixes Latin and Tamil script`);
    }
    if (p.review && !c[p.client].reviewers.some((r) => r.equals(u[p.review!.reviewer]._id))) {
      problems.push(
        `${label}: ${p.review.reviewer} is not assigned to review "${c[p.client].brandName}"`,
      );
    }
    if (p.resubmittedHoursAgo && p.status !== PostStatus.CHANGES_REQUESTED) {
      problems.push(`${label}: resubmittedHoursAgo only applies to CHANGES_REQUESTED posts`);
    }
    if (p.status !== PostStatus.DRAFT && p.submittedHoursAgo === undefined) {
      problems.push(`${label}: non-draft post is missing submittedHoursAgo`);
    }
    if (
      [PostStatus.SCHEDULED, PostStatus.PUBLISHED].includes(p.status) &&
      !p.scheduledAt
    ) {
      problems.push(`${label}: ${p.status} post is missing scheduledAt`);
    }
  }

  if (problems.length) {
    throw new Error(`Seed data failed self-validation:\n  - ${problems.join('\n  - ')}`);
  }

  // ---------------------------------------------- Posts, comments, audit logs
  let commentCount = 0;
  let auditCount = 0;

  for (const p of postsSeedData) {
    const { review, thread, submittedHoursAgo, resubmittedHoursAgo, ...postFields } = p;

    const post = await PostModel.create({
      ...postFields,
      client: c[p.client]._id,
      createdBy: u[p.createdBy]._id,
    });
    const actor = (key: UserKey) => u[key]._id.toString();

    const submittedAt = submittedHoursAgo ? hoursAgo(submittedHoursAgo) : undefined;

    const log = (
      actorKey: string,
      fromStatus: string,
      toStatus: string,
      timestamp: Date,
      metadata: Record<string, any> = {},
    ) =>
      AuditLogModel.create({
        post: post._id,
        actor: actorKey,
        fromStatus,
        toStatus,
        timestamp,
        ipAddress: CHENNAI_IPS[auditCount % CHENNAI_IPS.length],
        userAgent: CHROME_UA,
        metadata: { source: 'web', ...metadata },
      }).then(() => {
        auditCount += 1;
      });

    // Draft creation
    await log(actor(p.createdBy), 'NONE', PostStatus.DRAFT, hoursAgo((submittedHoursAgo ?? 24) + 30), {
      captionLength: p.caption.length,
      platform: p.platform,
    });

    if (submittedAt) {
      await log(actor(p.createdBy), PostStatus.DRAFT, PostStatus.IN_REVIEW, submittedAt);

      if (review) {
        const reviewAt = new Date(submittedAt.getTime() + review.hoursAfterSubmit * HOUR);

        if (review.decision === 'CHANGES_REQUESTED') {
          await log(
            actor(review.reviewer),
            PostStatus.IN_REVIEW,
            PostStatus.CHANGES_REQUESTED,
            reviewAt,
            { comment: review.comment ?? null },
          );

          if (review.comment) {
            await CommentModel.create({
              post: post._id,
              author: u[review.reviewer]._id,
              message: review.comment,
              createdAt: reviewAt,
            });
            commentCount += 1;
          }

          if (resubmittedHoursAgo) {
            await log(
              actor(p.createdBy),
              PostStatus.CHANGES_REQUESTED,
              PostStatus.IN_REVIEW,
              hoursAgo(resubmittedHoursAgo),
            );
          }
        } else {
          await log(actor(review.reviewer), PostStatus.IN_REVIEW, PostStatus.APPROVED, reviewAt);
        }
      }
    }

    if ([PostStatus.SCHEDULED, PostStatus.PUBLISHED].includes(p.status) && p.scheduledAt) {
      const scheduledAt = p.scheduledAt;
      const isPast = scheduledAt.getTime() < now;

      await log(
        actor('admin'),
        PostStatus.APPROVED,
        PostStatus.SCHEDULED,
        new Date(scheduledAt.getTime() - (isPast ? 26 : 6) * HOUR),
        { scheduledFor: scheduledAt.toISOString() },
      );

      if (p.status === PostStatus.PUBLISHED) {
        await log('SYSTEM', PostStatus.SCHEDULED, PostStatus.PUBLISHED, scheduledAt);
      }
    }
  }

  console.log(
    `Seeded ${postsSeedData.length} posts, ${commentCount} comments and ${auditCount} audit logs.`,
  );
  const spread = Object.values(PostStatus).map(
    (status) => `${status}=${postsSeedData.filter((p) => p.status === status).length}`,
  );
  console.log('Status spread: ' + spread.join(', '));

  console.log('\n======================================================');
  console.log('         CONCEPS MEDIA SEED CREDENTIALS');
  console.log('======================================================');
  console.log('ADMIN:      admin@concepsmedia.com      | Password: Admin@123');
  console.log('CREATOR 1:  creator1@concepsmedia.com   | Password: Creator@123');
  console.log('CREATOR 2:  creator2@concepsmedia.com   | Password: Creator@123');
  console.log('REVIEWER 1: reviewer1@concepsmedia.com  | Password: Reviewer@123');
  console.log('REVIEWER 2: reviewer2@concepsmedia.com  | Password: Reviewer@123');
  console.log('======================================================\n');

  await mongoose.disconnect();
  console.log('Disconnected from MongoDB. Seed script completed successfully.');
}

seed().catch((error) => {
  console.error('Seed execution failed:', error);
  process.exit(1);
});
