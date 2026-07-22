import { NextRequest, NextResponse } from "next/server";
import { User, Post } from "../../../../db/schema";
import { register } from "@/instrumentation";
import redis from "@/lib/redis";

export async function GET(req: Request) {
  await register();

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "9", 10);
  const excludeEmail = searchParams.get("excludeEmail");

  const skip = (page - 1) * limit;
  const cacheKey = `posts:page:${page}:limit:${limit}:${excludeEmail || ""}`;

  // Check cache
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }
  } catch (err) {
    console.error("Redis get error:", err);
  }

  const query = excludeEmail ? { "author.email": { $ne: excludeEmail } } : {};

  const [posts, total] = await Promise.all([
    Post.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({
        path: "author",
        select: "name username profilePicture isVerified email",
      })
      .select({
        title: 1,
        content: 1,
        picture: 1,
        author: 1,
        likes: 1,
        comments: 1,
        color: 1,
        createdAt: 1,
        _id: 1,
      })
      .lean(),
    Post.estimatedDocumentCount(),
  ]);

  const response = {
    posts,
    total,
    hasMore: skip + limit < total,
  };

  // Cache result (2 min)
  try {
    await redis.set(cacheKey, response, { ex: 120 });
  } catch (err) {
    console.error("Redis set error:", err);
  }

  return NextResponse.json(response);
}

