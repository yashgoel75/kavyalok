import { NextResponse } from "next/server";
import { Post } from "../../../../db/schema";
import { register } from "@/instrumentation";

export async function POST(req: Request) {
  await register();

  try {
    const { ids } = await req.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "Post IDs must be provided as an array" },
        { status: 400 }
      );
    }

    const posts = await Post.find({ _id: { $in: ids } })
      .populate({
        path: "author",
        select: "name username profilePicture isVerified email",
      })
      .populate({
        path: "repostedBy",
        select: "name username profilePicture isVerified",
      })
      .select({
        title: 1,
        content: 1,
        picture: 1,
        author: 1,
        likes: 1,
        repostCount: 1,
        repostedBy: 1,
        comments: 1,
        color: 1,
        createdAt: 1,
        _id: 1,
      })
      .lean();

    return NextResponse.json({ posts });
  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
