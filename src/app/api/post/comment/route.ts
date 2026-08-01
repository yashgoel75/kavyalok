import { NextRequest, NextResponse } from "next/server";
import { register } from "@/instrumentation";
import { Post, Comment, User, Interaction } from "../../../../../db/schema";
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

    const { postId, email, content, parentComment } = await req.json();

    if (!postId || !email || !content) {
      return NextResponse.json(
        { error: "Post ID, email, and content are required" },
        { status: 400 }
      );
    }

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const newComment = new Comment({
      author: user._id,
      post: postId,
      content: content.trim(),
      parentComment: parentComment || null,
    });

    await newComment.save();

    // Track Interaction for Recommendations
    await Interaction.create({
      user: user._id,
      post: postId,
      action: "comment",
    });

    return NextResponse.json(
      { message: "Comment posted successfully", comment: newComment },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error posting comment:", error);
    return NextResponse.json(
      { error: "Failed to post comment" },
      { status: 500 }
    );
  }
}
