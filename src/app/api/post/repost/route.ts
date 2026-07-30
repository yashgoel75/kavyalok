import { NextRequest, NextResponse } from "next/server";
import { User, Post, Repost, Interaction } from "../../../../../db/schema";
import { register } from "@/instrumentation";
import { verifyFirebaseToken } from "@/lib/verifyFirebaseToken";

export async function POST(req: NextRequest) {
  await register();

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing token" }, { status: 401 });
    }
    const token = authHeader.split(" ")[1];
    const decodedToken = await verifyFirebaseToken(token);

    if (!decodedToken?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { postId, email } = await req.json();

    if (!postId || !email || decodedToken.email !== email) {
      return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const targetPost = await Post.findById(postId);
    if (!targetPost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Resolve original post ID if target happens to be an old repost doc
    const originalPostId = targetPost.isRepost && targetPost.originalPost ? targetPost.originalPost : targetPost._id;
    const originalPost = await Post.findById(originalPostId);

    if (!originalPost) {
      return NextResponse.json({ error: "Original post not found" }, { status: 404 });
    }

    const existingRepost = await Repost.findOne({ user: user._id, post: originalPost._id });
    const hasReposted = !!existingRepost || (user.reposts || []).includes(originalPost._id.toString());

    if (hasReposted) {
      // Unrepost: remove user repost record
      await Repost.deleteOne({ user: user._id, post: originalPost._id });

      await User.updateOne(
        { email },
        { $pull: { reposts: originalPost._id.toString() } }
      );

      // Find the most recent remaining repost for this post, or fallback to original createdAt
      const latestRemainingRepost = await Repost.findOne({ post: originalPost._id }).sort({ createdAt: -1 });
      const fallbackSortTime = latestRemainingRepost ? latestRemainingRepost.createdAt : originalPost.createdAt;
      const now = new Date();

      await Post.updateOne(
        { _id: originalPost._id },
        {
          $pull: { repostedBy: user._id },
          $inc: { repostCount: -1 },
          $set: {
            sortByTime: fallbackSortTime,
            lastModifiedTime: now,
          },
        }
      );

      // Clean up legacy auto-created repost docs if any exist
      await Post.deleteMany({
        originalPost: originalPost._id,
        isRepost: true,
      });

      const updatedOriginal = await Post.findById(originalPost._id);
      return NextResponse.json({
        success: true,
        isReposted: false,
        repostCount: Math.max(0, updatedOriginal?.repostCount || 0),
        sortByTime: updatedOriginal?.sortByTime,
      });
    } else {
      // Repost: update sortByTime and lastModifiedTime so post comes to top of feed
      const now = new Date();

      await Repost.updateOne(
        { user: user._id, post: originalPost._id },
        { $setOnInsert: { user: user._id, post: originalPost._id, createdAt: now } },
        { upsert: true }
      );

      await User.updateOne(
        { email },
        { $addToSet: { reposts: originalPost._id.toString() } }
      );

      await Post.updateOne(
        { _id: originalPost._id },
        {
          $addToSet: { repostedBy: user._id },
          $inc: { repostCount: 1 },
          $set: {
            sortByTime: now,
            lastModifiedTime: now,
            lastRepostedAt: now,
            lastActivityAt: now,
          },
        }
      );

      // Clean up legacy auto-created repost docs if any exist
      await Post.deleteMany({
        originalPost: originalPost._id,
        isRepost: true,
      });

      // Track Interaction for Recommendations
      await Interaction.create({
        user: user._id,
        post: originalPost._id,
        action: "repost",
      });

      const updatedOriginal = await Post.findById(originalPost._id);
      return NextResponse.json({
        success: true,
        isReposted: true,
        repostCount: updatedOriginal?.repostCount || 1,
        sortByTime: updatedOriginal?.sortByTime,
      });
    }
  } catch (err: any) {
    console.error("Repost API error:", err);
    return NextResponse.json({ error: err.message || "Failed to process repost" }, { status: 500 });
  }
}
