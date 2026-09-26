import * as mongoose from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../../.env') });

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/content_approval_system';

// Standalone MongoDB Schemas
const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['ADMIN', 'CREATOR', 'REVIEWER'], required: true },
  },
  { timestamps: true },
);

const ClientSchema = new mongoose.Schema(
  {
    brandName: { type: String, required: true, unique: true },
    reviewers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true },
);

const PostSchema = new mongoose.Schema(
  {
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    platform: { type: String, enum: ['INSTAGRAM', 'FACEBOOK', 'LINKEDIN', 'X'], required: true },
    caption: { type: String, required: true },
    scheduledAt: { type: Date, default: null },
    status: {
      type: String,
      enum: ['DRAFT', 'IN_REVIEW', 'APPROVED', 'CHANGES_REQUESTED', 'SCHEDULED', 'PUBLISHED'],
      required: true,
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    version: { type: Number, default: 1 },
  },
  { timestamps: true },
);

const CommentSchema = new mongoose.Schema(
  {
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

const AuditLogSchema = new mongoose.Schema(
  {
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
    actor: { type: String, required: true },
    fromStatus: { type: String, required: true },
    toStatus: { type: String, required: true },
    timestamp: { type: Date, default: () => new Date() },
  },
  { timestamps: false },
);

const UserModel = mongoose.model('User', UserSchema);
const ClientModel = mongoose.model('Client', ClientSchema);
const PostModel = mongoose.model('Post', PostSchema);
const CommentModel = mongoose.model('Comment', CommentSchema);
const AuditLogModel = mongoose.model('AuditLog', AuditLogSchema);

async function seed() {
  console.log('Connecting to MongoDB database at:', MONGODB_URI);
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB.');

  // Clean existing collections
  await Promise.all([
    UserModel.deleteMany({}),
    ClientModel.deleteMany({}),
    PostModel.deleteMany({}),
    CommentModel.deleteMany({}),
    AuditLogModel.deleteMany({}),
  ]);
  console.log('Cleared existing records.');

  // Hash password helper
  const hash = async (pwd: string) => bcrypt.hash(pwd, 10);

  // 1. Seed Users (1 Admin, 2 Creators, 2 Reviewers)
  const admin = await UserModel.create({
    name: 'Eleanor Vance (Admin)',
    email: 'admin@concepsmedia.com',
    password: await hash('Admin@123'),
    role: 'ADMIN',
  });

  const creator1 = await UserModel.create({
    name: 'Marcus Chen (Senior Creator)',
    email: 'creator1@concepsmedia.com',
    password: await hash('Creator@123'),
    role: 'CREATOR',
  });

  const creator2 = await UserModel.create({
    name: 'Sophia Patel (Creative Lead)',
    email: 'creator2@concepsmedia.com',
    password: await hash('Creator@123'),
    role: 'CREATOR',
  });

  const reviewer1 = await UserModel.create({
    name: 'Liam Gallagher (Senior Reviewer)',
    email: 'reviewer1@concepsmedia.com',
    password: await hash('Reviewer@123'),
    role: 'REVIEWER',
  });

  const reviewer2 = await UserModel.create({
    name: 'Amara Okafor (Brand Reviewer)',
    email: 'reviewer2@concepsmedia.com',
    password: await hash('Reviewer@123'),
    role: 'REVIEWER',
  });

  console.log('Seeded 5 users across ADMIN, CREATOR, and REVIEWER roles.');

  // 2. Seed Clients (3 Clients with assigned reviewers)
  const client1 = await ClientModel.create({
    brandName: 'Nexus Horizon',
    reviewers: [reviewer1._id, reviewer2._id],
  });

  const client2 = await ClientModel.create({
    brandName: 'Aura Dynamics',
    reviewers: [reviewer1._id],
  });

  const client3 = await ClientModel.create({
    brandName: 'Zenith Labs',
    reviewers: [reviewer2._id],
  });

  console.log('Seeded 3 client brands with assigned reviewers.');

  // 3. Seed Posts (16 posts spread across DRAFT, IN_REVIEW, APPROVED, CHANGES_REQUESTED, SCHEDULED, PUBLISHED)
  const now = Date.now();
  const scheduleTime1 = new Date(now + 24 * 3600 * 1000); // +24 hours
  const scheduleTime2 = new Date(now + 30 * 3600 * 1000); // +30 hours (6h apart, passes 2h conflict rule)
  const scheduleTime3 = new Date(now + 48 * 3600 * 1000); // +48 hours
  const publishedTime1 = new Date(now - 48 * 3600 * 1000);
  const publishedTime2 = new Date(now - 72 * 3600 * 1000);

  const postsSeedData = [
    // --- DRAFT Posts ---
    {
      client: client1._id,
      platform: 'INSTAGRAM',
      caption: 'Unveiling the next frontier in connected design. The new Nexus Alpha is coming soon. #NexusHorizon #DesignInnovation',
      status: 'DRAFT',
      createdBy: creator1._id,
      version: 1,
    },
    {
      client: client2._id,
      platform: 'LINKEDIN',
      caption: 'Proud to announce that Aura Dynamics has achieved net-zero emissions across all European facilities ahead of schedule.',
      status: 'DRAFT',
      createdBy: creator2._id,
      version: 1,
    },
    {
      client: client3._id,
      platform: 'X',
      caption: 'Breaking: Quantum computing simulations are live. Check our preprint paper on GitHub. #QuantumComputing #Zenith',
      status: 'DRAFT',
      createdBy: creator1._id,
      version: 1,
    },

    // --- IN_REVIEW Posts ---
    {
      client: client1._id,
      platform: 'LINKEDIN',
      caption: 'We are expanding our senior engineering division. Discover open leadership roles shaping autonomous systems.',
      status: 'IN_REVIEW',
      createdBy: creator1._id,
      version: 2,
    },
    {
      client: client2._id,
      platform: 'INSTAGRAM',
      caption: 'Behind the lens at Aura Studios. Every curve engineered with mathematical precision. ✨ #AuraDesign #Craftsmanship',
      status: 'IN_REVIEW',
      createdBy: creator2._id,
      version: 2,
    },
    {
      client: client3._id,
      platform: 'FACEBOOK',
      caption: 'Meet our lead research fellows who are transforming materials science into sustainable solutions for tomorrow.',
      status: 'IN_REVIEW',
      createdBy: creator1._id,
      version: 2,
    },

    // --- CHANGES_REQUESTED Posts ---
    {
      client: client1._id,
      platform: 'X',
      caption: 'Big drop tonight. You do not want to miss this one. #Hype',
      status: 'CHANGES_REQUESTED',
      createdBy: creator1._id,
      version: 2,
      reviewComment: 'The caption is too vague. Please include the official event time in IST and our product launch hashtag.',
      reviewer: reviewer1._id,
    },
    {
      client: client2._id,
      platform: 'FACEBOOK',
      caption: 'Save up to 40% on all enterprise subscriptions starting this week. Click link in bio to claim.',
      status: 'CHANGES_REQUESTED',
      createdBy: creator2._id,
      version: 2,
      reviewComment: 'Enterprise pricing requires corporate disclaimers and valid regional terms. Please update accordingly.',
      reviewer: reviewer1._id,
    },
    {
      client: client3._id,
      platform: 'LINKEDIN',
      caption: 'Our AI model outperformed legacy benchmarks by 10x in internal testing.',
      status: 'CHANGES_REQUESTED',
      createdBy: creator2._id,
      version: 2,
      reviewComment: 'Please cite the benchmark methodology and include a link to the whitepaper summary.',
      reviewer: reviewer2._id,
    },

    // --- APPROVED Posts ---
    {
      client: client1._id,
      platform: 'FACEBOOK',
      caption: 'Celebrating 10 years of human-centered engineering at Nexus Horizon. Explore our interactive milestone timeline.',
      status: 'APPROVED',
      createdBy: creator1._id,
      version: 2,
    },
    {
      client: client2._id,
      platform: 'X',
      caption: 'Join our technical live demo this Thursday at 4 PM IST. We will be walking through scalable microservices architectures. 🚀',
      status: 'APPROVED',
      createdBy: creator2._id,
      version: 2,
    },
    {
      client: client3._id,
      platform: 'INSTAGRAM',
      caption: 'Where curiosity meets laboratory rigour. Explore our weekly science journal digest in our bio link. 🔬 #ZenithLabs',
      status: 'APPROVED',
      createdBy: creator1._id,
      version: 2,
    },

    // --- SCHEDULED Posts ---
    {
      client: client1._id,
      platform: 'X',
      caption: 'Keynote livestream starting in 15 minutes! Tune in to watch the future of enterprise automation unfold live. 🎙️',
      scheduledAt: scheduleTime1,
      status: 'SCHEDULED',
      createdBy: creator1._id,
      version: 3,
    },
    {
      client: client2._id,
      platform: 'LINKEDIN',
      caption: 'Quarterly innovation update: How our cross-functional teams shipped 47 high-impact features in Q3.',
      scheduledAt: scheduleTime2,
      status: 'SCHEDULED',
      createdBy: creator2._id,
      version: 3,
    },
    {
      client: client3._id,
      platform: 'X',
      caption: 'Zenith Labs Open Source Toolkit v2.4 is officially published! Download from our developer hub.',
      scheduledAt: scheduleTime3,
      status: 'SCHEDULED',
      createdBy: creator1._id,
      version: 3,
    },

    // --- PUBLISHED Posts ---
    {
      client: client1._id,
      platform: 'INSTAGRAM',
      caption: 'Reflecting on an inspiring week at DesignCon Europe. Thank you to everyone who visited our interactive booth! 📸',
      scheduledAt: publishedTime1,
      status: 'PUBLISHED',
      createdBy: creator1._id,
      version: 4,
    },
    {
      client: client2._id,
      platform: 'FACEBOOK',
      caption: 'Our annual sustainability report is live. Learn how we reduced carbon footprints across all operations in 2025.',
      scheduledAt: publishedTime2,
      status: 'PUBLISHED',
      createdBy: creator2._id,
      version: 4,
    },
  ];

  for (const postItem of postsSeedData) {
    const { reviewComment, reviewer, ...postFields } = postItem as any;
    const post = await PostModel.create(postFields);

    // Initial draft audit log
    await AuditLogModel.create({
      post: post._id,
      actor: post.createdBy.toString(),
      fromStatus: 'NONE',
      toStatus: 'DRAFT',
      timestamp: new Date(now - 7 * 86400 * 1000),
    });

    if (post.status !== 'DRAFT') {
      await AuditLogModel.create({
        post: post._id,
        actor: post.createdBy.toString(),
        fromStatus: 'DRAFT',
        toStatus: 'IN_REVIEW',
        timestamp: new Date(now - 5 * 86400 * 1000),
      });
    }

    if (post.status === 'CHANGES_REQUESTED') {
      await AuditLogModel.create({
        post: post._id,
        actor: reviewer.toString(),
        fromStatus: 'IN_REVIEW',
        toStatus: 'CHANGES_REQUESTED',
        timestamp: new Date(now - 4 * 86400 * 1000),
      });

      if (reviewComment) {
        await CommentModel.create({
          post: post._id,
          author: reviewer,
          message: reviewComment,
        });
      }
    }

    if (['APPROVED', 'SCHEDULED', 'PUBLISHED'].includes(post.status)) {
      await AuditLogModel.create({
        post: post._id,
        actor: reviewer1._id.toString(),
        fromStatus: 'IN_REVIEW',
        toStatus: 'APPROVED',
        timestamp: new Date(now - 3 * 86400 * 1000),
      });
    }

    if (['SCHEDULED', 'PUBLISHED'].includes(post.status)) {
      await AuditLogModel.create({
        post: post._id,
        actor: admin._id.toString(),
        fromStatus: 'APPROVED',
        toStatus: 'SCHEDULED',
        timestamp: new Date(now - 2 * 86400 * 1000),
      });
    }

    if (post.status === 'PUBLISHED') {
      await AuditLogModel.create({
        post: post._id,
        actor: 'SYSTEM',
        fromStatus: 'SCHEDULED',
        toStatus: 'PUBLISHED',
        timestamp: post.scheduledAt || new Date(now - 1 * 86400 * 1000),
      });
    }
  }

  console.log(`Seeded ${postsSeedData.length} posts across all workflow statuses with audit trails.`);

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
