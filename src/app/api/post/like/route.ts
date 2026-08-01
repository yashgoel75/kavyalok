import { NextRequest, NextResponse } from "next/server";
import { register } from "@/instrumentation";
import { Post, User, Like, Notification, Interaction } from "../../../../../db/schema";
import { verifyFirebaseToken } from "@/lib/verifyFirebaseToken";

export async function POST(req: NextRequest) {
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

    const { postId, email } = await req.json();

    if (!postId || !email) {
      return NextResponse.json(
        { error: "Post ID and email are required" },
        { status: 400 }
      );
    }

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const post = await Post.findById(postId).populate("author");
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Check existing like strictly via canonical Like collection
    const existingLike = await Like.findOne({ user: user._id, post: post._id });
    const hasLiked = !!existingLike;

    if (hasLiked) {
      // Delete from Like collection
      await Like.deleteOne({ user: user._id, post: post._id });

      // Clean up legacy array entry if present
      await User.updateOne({ _id: user._id }, { $pull: { likes: postId } });

      // Atomic decrement post.likes (prevent negative values)
      await Post.updateOne(
        { _id: post._id, likes: { $gt: 0 } },
        { $inc: { likes: -1 } }
      );
    } else {
      // Insert into Like collection
      await Like.updateOne(
        { user: user._id, post: post._id },
        { $setOnInsert: { user: user._id, post: post._id } },
        { upsert: true }
      );

      // Atomic increment post.likes
      await Post.updateOne(
        { _id: post._id },
        { $inc: { likes: 1 } }
      );

      const authorEmail = typeof post.author === "object" ? post.author.email : null;
      const authorId = typeof post.author === "object" ? post.author._id : post.author;

      if (authorEmail && authorEmail !== email) {
        // Standalone Notification Collection
        await Notification.create({
          recipient: authorId,
          sender: user._id,
          post: post._id,
          postId: post._id,
          type: "post_like",
          fromEmail: email,
          read: false,
        });
      }

      // Track Interaction for Recommendations
      await Interaction.create({
        user: user._id,
        post: post._id,
        action: "like",
      });
    }

    const updatedPost = await Post.findById(post._id).select("likes").lean<{ likes?: number }>();
    const finalLikes = updatedPost?.likes ?? 0;

    return NextResponse.json(
      { message: hasLiked ? "Post unliked" : "Post liked", likes: finalLikes },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error toggling like:", error);
    return NextResponse.json(
      { error: "Failed to toggle like" },
      { status: 500 }
    );
  }
}
