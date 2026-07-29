import { NextRequest, NextResponse } from "next/server";
import { User, Post } from "../../../../../db/schema";
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

    // Resolve original post if target is already a repost
    const originalPostId = targetPost.isRepost && targetPost.originalPost ? targetPost.originalPost : targetPost._id;
    const originalPost = await Post.findById(originalPostId);

    if (!originalPost) {
      return NextResponse.json({ error: "Original post not found" }, { status: 404 });
    }

    const hasReposted = (user.reposts || []).includes(originalPost._id.toString());

    if (hasReposted) {
      // Unrepost
      await User.updateOne(
        { email },
        { $pull: { reposts: originalPost._id.toString() } }
      );

      await Post.updateOne(
        { _id: originalPost._id },
        {
          $pull: { repostedBy: email },
          $inc: { repostCount: -1 },
        }
      );

      await Post.deleteOne({
        originalPost: originalPost._id,
        repostedByAuthor: user._id,
      });

      const updatedOriginal = await Post.findById(originalPost._id);
      return NextResponse.json({
        success: true,
        isReposted: false,
        repostCount: Math.max(0, updatedOriginal?.repostCount || 0),
      });
    } else {
      // Repost
      await User.updateOne(
        { email },
        { $addToSet: { reposts: originalPost._id.toString() } }
      );

      await Post.updateOne(
        { _id: originalPost._id },
        {
          $addToSet: { repostedBy: email },
          $inc: { repostCount: 1 },
        }
      );

      await Post.create({
        title: originalPost.title,
        content: originalPost.content,
        picture: originalPost.picture,
        color: originalPost.color,
        tags: originalPost.tags,
        author: originalPost.author,
        isRepost: true,
        originalPost: originalPost._id,
        repostedByAuthor: user._id,
        repostedBy: [email],
      });

      const updatedOriginal = await Post.findById(originalPost._id);
      return NextResponse.json({
        success: true,
        isReposted: true,
        repostCount: updatedOriginal?.repostCount || 1,
      });
    }
  } catch (err: any) {
    console.error("Repost API error:", err);
    return NextResponse.json({ error: err.message || "Failed to process repost" }, { status: 500 });
  }
}
