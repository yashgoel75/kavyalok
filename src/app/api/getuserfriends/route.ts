import { NextRequest, NextResponse } from "next/server";
import { register } from "@/instrumentation";
import { User, Follow } from "../../../../db/schema";

export async function GET(req: NextRequest) {
  try {
    await register();
    const { searchParams } = new URL(req.url);

    const email = searchParams.get("email");
    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const rawUser = await User.findOne(
      { email },
      {
        name: 1,
        username: 1,
        email: 1,
        profilePicture: 1,
        isVerified: 1,
        followers: 1,
        following: 1,
      }
    ).lean();

    if (!rawUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const user = (Array.isArray(rawUser) ? rawUser[0] : rawUser) as any;

    // Fetch from Follow collection
    const followsTargetAsFollowing = await Follow.find({ follower: user._id }).populate("following", "email").lean();
    const followsTargetAsFollower = await Follow.find({ following: user._id }).populate("follower", "email").lean();

    const followingEmailsFromColl = followsTargetAsFollowing
      .map((f: any) => f.following?.email)
      .filter(Boolean);
    const followerEmailsFromColl = followsTargetAsFollower
      .map((f: any) => f.follower?.email)
      .filter(Boolean);

    const mergedFollowing = Array.from(new Set([...(user.following || []), ...followingEmailsFromColl]));
    const mergedFollowers = Array.from(new Set([...(user.followers || []), ...followerEmailsFromColl]));

    return NextResponse.json({
      user: {
        ...user,
        followers: mergedFollowers,
        following: mergedFollowing,
      },
    }, { status: 200 });

  } catch (error) {
    console.error("Error fetching user basic info:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
