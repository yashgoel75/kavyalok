import { NextRequest, NextResponse } from "next/server";
import { register } from "@/instrumentation";
import { Post, Comment, User, Like, Bookmark, Repost } from "../../../../db/schema";
import { verifyFirebaseToken } from "@/lib/verifyFirebaseToken";

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

export async function DELETE(req: NextRequest) {
  try {
    await register();

    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing token" }, { status: 401 });
    }
    const token = authHeader.split(" ")[1];
    const decodedToken = await verifyFirebaseToken(token);
    if (!decodedToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    let id = searchParams.get("id") || searchParams.get("postId");
    let email = searchParams.get("email");

    if (!id || !email) {
      try {
        const body = await req.json();
        id = id || body.id || body.postId;
        email = email || body.email;
      } catch (e) {
        // Body reading failed or empty, fallback to query params check
      }
    }

    if (!id || !email) {
      return NextResponse.json(
        { error: "Post ID and email are required" },
        { status: 400 }
      );
    }

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const post = await Post.findById(id);
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Verify ownership
    if (post.author.toString() !== user._id.toString()) {
      return NextResponse.json({ error: "Forbidden: You are not the author of this post" }, { status: 403 });
    }

    // Delete post and cascade delete associated interactions
    await Post.findByIdAndDelete(id);
    await Promise.all([
      Comment.deleteMany({ post: id }),
      Like.deleteMany({ post: id }),
      Bookmark.deleteMany({ post: id }),
      Repost.deleteMany({ post: id }),
      User.updateOne({ _id: user._id }, { $pull: { posts: id, pinnedPosts: id } })
    ]);

    return NextResponse.json({ message: "Post deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting post:", error);
    return NextResponse.json({ error: "Failed to delete post" }, { status: 500 });
  }
}
