import { NextRequest, NextResponse } from "next/server";
import { register } from "@/instrumentation";
import { Post, Like, Repost, Comment, User } from "../../../../../db/schema";

export async function GET(req: NextRequest) {
  try {
    await register();

    const { searchParams } = new URL(req.url);
    const postId = searchParams.get("postId");

    if (!postId) {
      return NextResponse.json({ error: "postId is required" }, { status: 400 });
    }

    const targetPost: any = await Post.findById(postId).select("originalPost isRepost repostedBy likes").lean();
    if (!targetPost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const canonicalPostId = targetPost.isRepost && targetPost.originalPost ? targetPost.originalPost : targetPost._id;

    // Fetch Likes
    const likesDocs = await Like.find({ post: canonicalPostId })
      .sort({ createdAt: -1 })
      .populate({
        path: "user",
        select: "name username profilePicture isVerified bio",
      })
      .lean();

    // Fetch Reposts
    const repostsDocs = await Repost.find({ post: canonicalPostId })
      .sort({ createdAt: -1 })
      .populate({
        path: "user",
        select: "name username profilePicture isVerified bio",
      })
      .lean();

    // Fetch Comments
    const commentsDocs = await Comment.find({ post: canonicalPostId })
      .sort({ createdAt: -1 })
      .populate({
        path: "author",
        select: "name username profilePicture isVerified bio",
      })
      .lean();

    const likedUsers = likesDocs.map((doc: any) => doc.user).filter(Boolean);
    const repostedUsers = repostsDocs.map((doc: any) => doc.user).filter(Boolean);
    const commentsList = commentsDocs.map((doc: any) => ({
      _id: doc._id,
      content: doc.content,
      createdAt: doc.createdAt,
      author: doc.author,
    })).filter((c: any) => c.author);

    return NextResponse.json(
      {
        likes: likedUsers,
        reposts: repostedUsers,
        comments: commentsList,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error fetching post interactions list:", error);
    return NextResponse.json({ error: "Failed to fetch interactions" }, { status: 500 });
  }
}
