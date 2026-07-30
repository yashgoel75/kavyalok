import { NextRequest, NextResponse } from "next/server";
import { register } from "@/instrumentation";
import { Post, Comment } from "../../../../db/schema";

export async function GET(req: NextRequest) {
  try {
    await register();

    const { searchParams } = new URL(req.url);
    const postId = searchParams.get("postId");

    if (!postId) {
      return NextResponse.json({ error: "Post ID is required" }, { status: 400 });
    }

    const post = await Post.findById(postId)
      .select("title color content picture tags likes repostCount repostedBy lastRepostedAt createdAt author")
      .populate("author", "name username profilePicture isVerified")
      .populate("repostedBy", "name username profilePicture isVerified")
      .lean();

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const comments = await Comment.find({ post: postId })
      .select("content likes createdAt parentComment")
      .populate("author", "name username profilePicture isVerified")
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    return NextResponse.json(
      {
        post,
        comments,
        commentCount: await Comment.countDocuments({ post: postId })
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("Error fetching post:", error);
    return NextResponse.json(
      { error: "Failed to fetch post" },
      { status: 500 }
    );
  }
}
