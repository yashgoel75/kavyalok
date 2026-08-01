import { NextResponse } from "next/server";
import { User, Bookmark } from "../../../../../db/schema";
import { register } from "@/instrumentation";
import { verifyFirebaseToken } from "@/lib/verifyFirebaseToken";

export async function POST(req: Request) {
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
    return NextResponse.json({ error: "Email and postId required" }, { status: 400 });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    await Bookmark.deleteOne({ user: user._id, post: postId });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing bookmark:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
