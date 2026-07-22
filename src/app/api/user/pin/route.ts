import { NextRequest, NextResponse } from "next/server";
import { register } from "@/instrumentation";
import { User } from "../../../../../db/schema";
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

    const { email, postId } = await req.json();

    if (!email || !postId) {
      return NextResponse.json(
        { error: "Email and postId are required" },
        { status: 400 }
      );
    }

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const pinned: string[] = user.pinnedPosts || [];
    const isPinned = pinned.includes(postId);

    let updatedPinned: string[];
    if (isPinned) {
      updatedPinned = pinned.filter((id) => id !== postId);
    } else {
      if (pinned.length >= 3) {
        return NextResponse.json(
          { error: "You can pin a maximum of 3 posts" },
          { status: 400 }
        );
      }
      updatedPinned = [...pinned, postId];
    }

    user.pinnedPosts = updatedPinned;
    await user.save();

    return NextResponse.json({
      success: true,
      pinnedPosts: updatedPinned,
      isPinned: !isPinned,
    });
  } catch (error) {
    console.error("Pin post error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
