import { NextRequest, NextResponse } from "next/server";
import { User, Post } from "../../../../../db/schema";
import { verifyFirebaseToken } from "@/lib/verifyFirebaseToken";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing token" }, { status: 401 });
    }
    const token = authHeader.split(" ")[1];
    const decodedToken = await verifyFirebaseToken(token);
    if (!decodedToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const email = url.searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { error: "Email query parameter is required" },
        { status: 400 }
      );
    }

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const posts = await Post.find({ _id: { $in: user.posts } })
      .populate("author", "name username profilePicture isVerified email")
      .populate("repostedBy", "name username profilePicture isVerified")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ user: { ...user.toObject(), posts } }, { status: 200 });
  } catch (err) {
    console.error("Error fetching user posts:", err);
    return NextResponse.json(
      { error: "Failed to fetch user posts" },
      { status: 500 }
    );
  }
}


interface Post {
  _id: string;
  title: string;
  content: string;
  picture?: string;
  likes: number;
  color: string;
}

interface User {
  email: string;
  posts: Post[];
}

export async function DELETE(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing token" }, { status: 401 });
    }
    const token = authHeader.split(" ")[1];
    const decodedToken = await verifyFirebaseToken(token);
    if (!decodedToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { email, postId } = body as { email?: string; postId?: string };

    if (!email || !postId) {
      return NextResponse.json(
        { error: "Missing email or postId" },
        { status: 400 }
      );
    }

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const deleted = await Post.findByIdAndDelete(postId);
    if (!deleted) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    user.posts = user.posts.filter((id: { toString: () => string; }) => id.toString() !== postId);
    await user.save();

    return NextResponse.json({
      message: "Post deleted successfully",
      posts: user.posts,
    });
  } catch (err) {
    console.error("Failed to delete post:", err);
    return NextResponse.json(
      { error: "Failed to delete post" },
      { status: 500 }
    );
  }
}
