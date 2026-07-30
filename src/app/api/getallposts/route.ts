import { NextRequest, NextResponse } from "next/server";
import { User, Post } from "../../../../db/schema";
import { register } from "@/instrumentation";

export async function GET(req: Request) {
  try {
    await register();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "9", 10);
    const excludeEmail = searchParams.get("excludeEmail");

    const skip = (page - 1) * limit;

    const baseQuery: any = { isRepost: { $ne: true } };
    if (excludeEmail) {
      baseQuery["author.email"] = { $ne: excludeEmail };
    }

    const [posts, total] = await Promise.all([
      Post.find(baseQuery)
        .sort({ updatedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
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
          updatedAt: 1,
          _id: 1,
        })
        .lean(),
      Post.countDocuments(baseQuery),
    ]);

    const response = {
      posts,
      total,
      hasMore: skip + limit < total,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Error fetching posts:", error);
    return NextResponse.json({ error: "Failed to fetch posts", posts: [], total: 0, hasMore: false }, { status: 500 });
  }
}
