import { NextRequest, NextResponse } from "next/server";
import { register } from "@/instrumentation";
import { User, Follow } from "../../../../../db/schema";

export async function GET(req: NextRequest) {
  try {
    await register();
    const { searchParams } = new URL(req.url);

    const email = searchParams.get("email");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "9", 10);

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const userDoc = await User.findOne({ email }, { _id: 1, following: 1 }).lean();
    if (!userDoc) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = Array.isArray(userDoc) ? userDoc[0] : userDoc;

    // 1. Follow collection following
    const followDocs = await Follow.find({ follower: user._id })
      .populate("following", "name username email profilePicture isVerified")
      .lean();

    const followingUsersFromColl = followDocs
      .map((f: any) => f.following)
      .filter(Boolean);

    // 2. Legacy following array from user schema
    const legacyEmails: string[] = (user.following || []).filter(Boolean);
    const existingEmailsInColl = new Set(followingUsersFromColl.map((u: any) => u.email));
    const missingLegacyEmails = legacyEmails.filter((e) => !existingEmailsInColl.has(e));

    let legacyUsers: any[] = [];
    if (missingLegacyEmails.length > 0) {
      legacyUsers = await User.find(
        { email: { $in: missingLegacyEmails } },
        { name: 1, username: 1, email: 1, profilePicture: 1, isVerified: 1 }
      ).lean();
    }

    const allFollowing = [...followingUsersFromColl, ...legacyUsers];
    const total = allFollowing.length;

    const startIndex = (page - 1) * limit;
    const paginatedUsers = allFollowing.slice(startIndex, startIndex + limit);
    const hasMore = startIndex + limit < total;

    return NextResponse.json(
      {
        users: paginatedUsers,
        total,
        page,
        limit,
        hasMore,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching following:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
