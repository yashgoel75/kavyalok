import { NextRequest, NextResponse } from "next/server";
import { register } from "@/instrumentation";
import { Interaction, User, Post } from "../../../../../db/schema";
import mongoose from "mongoose";

export async function POST(req: NextRequest) {
  try {
    await register();
    const body = await req.json();
    const { postId, action = "view", durationViewed, email } = body;

    if (!postId || !mongoose.Types.ObjectId.isValid(postId)) {
      return NextResponse.json({ error: "Invalid post ID" }, { status: 400 });
    }

    let userId = null;
    if (email) {
      const user: any = await User.findOne({ email }).select("_id").lean();
      if (user) {
        userId = user._id;
      }
    }

    // Save interaction
    // If no userId, create with a dummy/anonymous reference or omit if optional
    const interactionData: Record<string, any> = {
      post: postId,
      action,
      durationViewed: durationViewed ? Number(durationViewed) : 0,
    };

    if (userId) {
      interactionData.user = userId;
    } else {
      // Find or assign to system/guest
      // Notice InteractionSchema: user: { type: Schema.Types.ObjectId, ref: 'User', required: true }
      // If user is required in schema, find the author of post or first user, or create guest interaction
      const post: any = await Post.findById(postId).select("author").lean();
      if (post && post.author) {
        interactionData.user = post.author; // Fallback to post author for anonymous view aggregates
      }
    }

    if (interactionData.user) {
      await Interaction.create(interactionData);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    // Non-blocking for analytics
    console.error("Error recording interaction track:", err?.message || err);
    return NextResponse.json({ success: false, error: err?.message || "Internal error" }, { status: 500 });
  }
}
