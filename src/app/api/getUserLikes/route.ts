import { NextResponse } from "next/server";
import { register } from "@/instrumentation";
import { User, Like } from "../../../../db/schema";
import { verifyFirebaseToken } from "@/lib/verifyFirebaseToken";

export async function GET(req: Request) {
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

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  try {
    const rawUser = await User.findOne(
      { email },
      {
        profilePicture: 1,
        isVerified: 1,
        name: 1,
        username: 1,
        email: 1,
        likes: 1,
      }
    ).lean();

    if (!rawUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const user = (Array.isArray(rawUser) ? rawUser[0] : rawUser) as any;

    // Fetch from Like collection
    const userLikes = await Like.find({ user: user._id }).lean();
    const likePostIdsFromColl = userLikes.map((l: any) => l.post.toString());

    // Merge with legacy likes array if present
    const combinedLikes = Array.from(
      new Set([...(user.likes || []), ...likePostIdsFromColl])
    );

    return NextResponse.json({
      user: {
        ...user,
        likes: combinedLikes,
      },
    });
  } catch (error) {
    console.error("Error fetching user likes:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
