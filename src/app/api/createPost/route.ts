import { NextRequest, NextResponse } from "next/server";
import { User, Post } from "../../../../db/schema";
import { register } from "@/instrumentation";
import { verifyFirebaseToken } from "@/lib/verifyFirebaseToken";

interface CreatePostRequest {
  title: string;
  content: string;
  picture?: string | null;
  email: string;
  tags: string[];
  color: string;
}

export async function POST(req: NextRequest) {
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

  try {
    const body: CreatePostRequest = await req.json();
    const { title, content, picture, email, tags, color } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content are required." },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json(
        { error: "Email is required to associate the post with a user." },
        { status: 400 }
      );
    }

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const post = await Post.create({
      title,
      content,
      picture: picture || null,
      author: user._id,
      likes: 0,
      comments: [],
      tags: tags,
      color: color,
      lastActivityAt: new Date(),
    });
    

    user.posts.push(post._id);
    await user.save();

    return NextResponse.json(
      { message: "Post created successfully", post },
      { status: 201 }
    );
  } catch (err) {
    console.error("Error creating post:", err);
    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 }
    );
  }
}
