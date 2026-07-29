import mongoose from "mongoose";

const { Schema } = mongoose;

const superCompetitionSchema = new Schema({
    coverPhoto: { type: String },
    owner: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    name: { type: String, required: true },
    organization: { type: String, required: false },
    about: { type: String, required: true },
    dateStart: { type: Date },
    dateEnd: { type: Date },
    registrationDeadline: { type: Date },
    category: { type: String },
    prizePool: [String],
    competitions: [{ type: Schema.Types.ObjectId, ref: 'Competition' }],
    participants: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    isSuperEvent: { type: Boolean, default: true },
}, { timestamps: true });

const CompetitionSchema = new Schema({
    coverPhoto: { type: String },
    owner: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    name: { type: String, required: true },
    organization: { type: String, required: false },
    about: { type: String, required: true },
    participantLimit: { type: Number },
    mode: { type: String },
    venue: { type: String },
    dateStart: { type: Date },
    dateEnd: { type: Date },
    timeStart: { type: String },
    timeEnd: { type: String },
    registrationDeadline: { type: Date },
    category: { type: String },
    fee: { type: Number },
    judgingCriteria: [String],
    prizePool: [String],
    customQuestions: [
        {
            question: { type: String, required: true },
            type: {
                type: String,
                enum: ['text', 'number', 'mcq'],
                default: 'text'
            },
            options: [String],
            required: { type: Boolean, default: false }
        }
    ],
    participants: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    parentSuperEvent: { type: Schema.Types.ObjectId, ref: 'superCompetition', default: null, index: true },
    isSuperEvent: { type: Boolean, default: false },
    bankDetails: {
        accountNumber: { type: String },
        ifsc: { type: String },
        holderName: { type: String }
    },
    bankVerificationStatus: { type: String, enum: ['pending', 'verified', 'failed'], default: 'pending' },
    payuBeneficiaryId: { type: String },
}, { timestamps: true });

const CompetitionApplicationSchema = new Schema({
    competitionId: {
        type: Schema.Types.ObjectId,
        ref: 'Competition',
        required: true,
        index: true
    },
    participantId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    responses: [
        {
            questionId: {
                type: Schema.Types.ObjectId,
                required: true
            },
            answer: {
                type: Schema.Types.Mixed
            }
        }
    ],
    appliedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

CompetitionApplicationSchema.index({ competitionId: 1, participantId: 1 }, { unique: true });


const CommentSchema = new Schema({
    author: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    post: { type: Schema.Types.ObjectId, ref: "Post", required: true, index: true },
    content: { type: String, required: true },
    likes: { type: Number, default: 0 },
    parentComment: { type: Schema.Types.ObjectId, ref: "Comment", default: null, index: true },
}, { timestamps: true });

// Primary compound index for paginating post comments ordered by date
CommentSchema.index({ post: 1, createdAt: -1 });


const PostSchema = new Schema({
    title: { type: String, required: true, index: true },
    content: { type: String, required: true },
    picture: String,
    author: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    tags: [{ type: String, index: true }],
    likes: { type: Number, default: 0 },
    repostCount: { type: Number, default: 0 },
    repostedBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
    originalPost: { type: Schema.Types.ObjectId, ref: "Post", default: null, index: true },
    repostedByAuthor: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
    isRepost: { type: Boolean, default: false, index: true },
    /** 
     * @deprecated Unbounded array. Use Comment.post reference for querying comments. 
     * Retained for backward compatibility during phased migration.
     */
    comments: [{ type: Schema.Types.ObjectId, ref: "Comment" }],
    color: { type: String, required: false },
}, { timestamps: true });

PostSchema.index({ title: "text", content: "text", tags: "text" });
PostSchema.index({ createdAt: -1 });
PostSchema.index({ author: 1, createdAt: -1 });


const NotificationSchema = new Schema({
    recipient: { type: Schema.Types.ObjectId, ref: "User", index: true },
    sender: { type: Schema.Types.ObjectId, ref: "User", index: true },
    post: { type: Schema.Types.ObjectId, ref: "Post", index: true },
    type: { type: String, required: true, index: true },
    read: { type: Boolean, default: false, index: true },
    
    // Backward compatibility fields
    fromEmail: { type: String },
    postId: { type: Schema.Types.ObjectId, ref: "Post", index: true },
}, { timestamps: true });

NotificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });


const UserSchema = new Schema({
    name: { type: String, required: true },
    username: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true, index: true },
    
    /** @deprecated Unbounded array. Query Post model by author instead. */
    posts: [String],
    pinnedPosts: [String],
    /** @deprecated Unbounded array. Use Repost model instead. */
    reposts: [String],
    
    bio: String,
    penName: String,
    favoriteGenre: String,
    literaryQuote: String,
    location: String,
    profilePicture: String,
    
    /** @deprecated Unbounded array. Use Bookmark model instead. */
    bookmarks: [String],
    
    instagram: String,
    snapchat: String,
    twitter: String,
    youtube: String,
    linkedin: String,
    website: String,
    
    /** @deprecated Unbounded array. Use Follow model instead. */
    followers: [String],
    /** @deprecated Unbounded array. Use Follow model instead. */
    following: [String],
    
    isVerified: Boolean,
    
    /** @deprecated Unbounded array. Use Like model instead. */
    likes: [String],
    
    defaultPostColor: String,
    privacySettings: {
        isPrivate: { type: Boolean, default: false },
        showEmail: { type: Boolean, default: false },
        allowMessages: { type: Boolean, default: true },
        showActivity: { type: Boolean, default: true }
    },
    
    /** @deprecated Embedded notifications array. Use standalone Notification collection. */
    notifications: [NotificationSchema],
}, { timestamps: true });

UserSchema.index({ username: 1, email: 1 });


// 1. Follow Collection
const FollowSchema = new Schema({
    follower: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    following: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
}, { timestamps: true });

FollowSchema.index({ follower: 1, following: 1 }, { unique: true });
FollowSchema.index({ follower: 1 });
FollowSchema.index({ following: 1 });

// 2. Like Collection
const LikeSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    post: { type: Schema.Types.ObjectId, ref: 'Post', required: true, index: true },
}, { timestamps: true });

LikeSchema.index({ user: 1, post: 1 }, { unique: true });
LikeSchema.index({ post: 1, createdAt: -1 });

// 3. Bookmark Collection
const BookmarkSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    post: { type: Schema.Types.ObjectId, ref: 'Post', required: true, index: true },
}, { timestamps: true });

BookmarkSchema.index({ user: 1, post: 1 }, { unique: true });
BookmarkSchema.index({ user: 1, createdAt: -1 });

// 4. Repost Collection
const RepostSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    post: { type: Schema.Types.ObjectId, ref: 'Post', required: true, index: true },
}, { timestamps: true });

RepostSchema.index({ user: 1, post: 1 }, { unique: true });
RepostSchema.index({ post: 1, createdAt: -1 });
RepostSchema.index({ user: 1, createdAt: -1 });


const InteractionSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    post: { type: Schema.Types.ObjectId, ref: 'Post', index: true },
    action: {
        type: String,
        enum: ['view', 'click', 'like', 'comment', 'bookmark', 'share', 'repost', 'profile_visit', 'follow'],
        required: true,
        index: true
    },
    durationViewed: { type: Number },
}, { timestamps: true });

// Recommendation & Analytics Compound Indexes
InteractionSchema.index({ user: 1, createdAt: -1 });
InteractionSchema.index({ post: 1, createdAt: -1 });
InteractionSchema.index({ action: 1 });
InteractionSchema.index({ user: 1, action: 1, createdAt: -1 });
InteractionSchema.index({ post: 1, action: 1, createdAt: -1 });
InteractionSchema.index({ user: 1, post: 1, action: 1 });


const PaymentSchema = new Schema({
    competitionId: { type: Schema.Types.ObjectId, ref: 'Competition', required: true, index: true },
    participantId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    txnid: { type: String, required: true, unique: true },
    payuId: { type: String },
    amount: { type: Number, required: true },
    status: { type: String, required: true },
    appliedAt: { type: Date, default: Date.now },
}, { timestamps: true });

const RefundSchema = new Schema({
    paymentId: { type: Schema.Types.ObjectId, ref: 'Payment', required: true, index: true },
    txnid: { type: String, required: true },
    refundId: { type: String },
    amount: { type: Number, required: true },
    status: { type: String, default: 'pending' },
    createdAt: { type: Date, default: Date.now },
}, { timestamps: true });


export type IUser = mongoose.InferSchemaType<typeof UserSchema>;
export type IPost = mongoose.InferSchemaType<typeof PostSchema>;
export type IComment = mongoose.InferSchemaType<typeof CommentSchema>;
export type INotification = mongoose.InferSchemaType<typeof NotificationSchema>;
export type IFollow = mongoose.InferSchemaType<typeof FollowSchema>;
export type ILike = mongoose.InferSchemaType<typeof LikeSchema>;
export type IBookmark = mongoose.InferSchemaType<typeof BookmarkSchema>;
export type IRepost = mongoose.InferSchemaType<typeof RepostSchema>;
export type IInteraction = mongoose.InferSchemaType<typeof InteractionSchema>;

export const superCompetition = mongoose.models.superCompetition || mongoose.model("superCompetition", superCompetitionSchema);
export const Competition = mongoose.models.Competition || mongoose.model("Competition", CompetitionSchema);
export const CompetitionApplication = mongoose.models.CompetitionApplication || mongoose.model("CompetitionApplication", CompetitionApplicationSchema);
export const User = mongoose.models.User || mongoose.model("User", UserSchema);
export const Post = mongoose.models.Post || mongoose.model("Post", PostSchema);
export const Comment = mongoose.models.Comment || mongoose.model("Comment", CommentSchema);
export const Notification = mongoose.models.Notification || mongoose.model("Notification", NotificationSchema);
export const Follow = mongoose.models.Follow || mongoose.model("Follow", FollowSchema);
export const Like = mongoose.models.Like || mongoose.model("Like", LikeSchema);
export const Bookmark = mongoose.models.Bookmark || mongoose.model("Bookmark", BookmarkSchema);
export const Repost = mongoose.models.Repost || mongoose.model("Repost", RepostSchema);
export const Interaction = mongoose.models.Interaction || mongoose.model("Interaction", InteractionSchema);
export const Payment = mongoose.models.Payment || mongoose.model("Payment", PaymentSchema);
export const Refund = mongoose.models.Refund || mongoose.model("Refund", RefundSchema);
