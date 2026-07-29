import { NextRequest, NextResponse } from "next/server";
import { register } from "@/instrumentation";
import { User, Like, Bookmark } from "../../../../db/schema";
import redis from "@/lib/redis";
import { verifyFirebaseToken } from "@/lib/verifyFirebaseToken";

interface UserDocument {
  _id: any;
  likes?: string[];
  bookmarks?: string[];
}

function paginate(array: string[], page: number, limit: number) {
  const start = (page - 1) * limit;
  const end = start + limit;

  return {
    data: array.slice(start, end),
    total: array.length,
    hasMore: end < array.length,
  };
}

export async function GET(req: NextRequest) {
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
    const email = searchParams.get("email");
    const postIdsParam = searchParams.get("postIds");

    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    const postIds: string[] = postIdsParam ? JSON.parse(postIdsParam) : [];

    const cacheKey = `interactions:${email}:${page}:${limit}:${JSON.stringify(postIds)}`;

    const cached = await redis.get(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    const user = await User.findOne({ email }).lean();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const u = user as UserDocument;

    // Fetch from scalable collections
    const userLikesDocs = await Like.find({ user: u._id, post: { $in: postIds } }).lean();
    const userBookmarksDocs = await Bookmark.find({ user: u._id, post: { $in: postIds } }).lean();

    const likesFromColl = userLikesDocs.map((l) => l.post.toString());
    const bookmarksFromColl = userBookmarksDocs.map((b) => b.post.toString());

    // Merge with legacy user arrays for complete accuracy
    const likesAll = Array.from(new Set([...likesFromColl, ...(u.likes || []).filter((id) => postIds.includes(id))]));
    const bookmarksAll = Array.from(new Set([...bookmarksFromColl, ...(u.bookmarks || []).filter((id) => postIds.includes(id))]));

    const likes = paginate(likesAll, page, limit);
    const bookmarks = paginate(bookmarksAll, page, limit);

    const response = {
      likes: likes.data,
      bookmarks: bookmarks.data,
      totalLikes: likes.total,
      totalBookmarks: bookmarks.total,
      hasMoreLikes: likes.hasMore,
      hasMoreBookmarks: bookmarks.hasMore,
    };

    await redis.set(cacheKey, response, { ex: 300 });

    return NextResponse.json(response);
  } catch (err) {
    console.error("Error checking interactions:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

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

    const body = await req.json();
    const { email, postIds, page = 1, limit = 10 } = body;

    if (!email || !Array.isArray(postIds)) {
      return NextResponse.json(
        { error: "Email and postIds are required" },
        { status: 400 }
      );
    }

    const cacheKey = `interactions:${email}:${page}:${limit}:${JSON.stringify(postIds)}`;

    const cached = await redis.get(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    const user = await User.findOne({ email }).select("_id likes bookmarks").lean();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const u = user as UserDocument;

    // Fetch from scalable collections
    const userLikesDocs = await Like.find({ user: u._id, post: { $in: postIds } }).lean();
    const userBookmarksDocs = await Bookmark.find({ user: u._id, post: { $in: postIds } }).lean();

    const likesFromColl = userLikesDocs.map((l) => l.post.toString());
    const bookmarksFromColl = userBookmarksDocs.map((b) => b.post.toString());

    // Merge with legacy user arrays for complete accuracy
    const likesAll = Array.from(new Set([...likesFromColl, ...(u.likes || []).filter((id) => postIds.includes(id))]));
    const bookmarksAll = Array.from(new Set([...bookmarksFromColl, ...(u.bookmarks || []).filter((id) => postIds.includes(id))]));

    const likes = paginate(likesAll, page, limit);
    const bookmarks = paginate(bookmarksAll, page, limit);

    const response = {
      likes: likes.data,
      bookmarks: bookmarks.data,
      totalLikes: likes.total,
      totalBookmarks: bookmarks.total,
      hasMoreLikes: likes.hasMore,
      hasMoreBookmarks: bookmarks.hasMore,
    };

    await redis.set(cacheKey, response, { ex: 300 });

    return NextResponse.json(response);
  } catch (err) {
    console.error("Error checking interactions (POST):", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
