import { NextRequest, NextResponse } from "next/server";
import { register } from "@/instrumentation";
import { User, Bookmark, Interaction } from "../../../../../db/schema";
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

    const existingBookmark = await Bookmark.findOne({ user: user._id, post: postId });
    const hasBookmarked = !!existingBookmark || user.bookmarks?.includes(postId);

    if (hasBookmarked) {
      await Bookmark.deleteOne({ user: user._id, post: postId });
      await User.updateOne({ email }, { $pull: { bookmarks: postId } });
    } else {
      await Bookmark.updateOne(
        { user: user._id, post: postId },
        { $setOnInsert: { user: user._id, post: postId } },
        { upsert: true }
      );
      await User.updateOne({ email }, { $addToSet: { bookmarks: postId } });

      await Interaction.create({
        user: user._id,
        post: postId,
        action: "bookmark",
      });
    }

    return NextResponse.json(
      { message: hasBookmarked ? "Bookmark removed" : "Post bookmarked" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error toggling bookmark:", error);
    return NextResponse.json(
      { error: "Failed to toggle bookmark" },
      { status: 500 }
    );
  }
}