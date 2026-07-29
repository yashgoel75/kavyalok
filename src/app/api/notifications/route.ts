import { NextRequest, NextResponse } from "next/server";
import { register } from "@/instrumentation";
import { User, Notification as NotificationModel } from "../../../../db/schema";
import { verifyFirebaseToken } from "@/lib/verifyFirebaseToken";

interface LegacyNotification {
  type: string;
  fromEmail: string;
  postId?: string;
  read: boolean;
  createdAt: Date;
}

interface UserType {
  _id: any;
  name: string;
  username: string;
  email: string;
  profilePicture?: string;
  notifications?: LegacyNotification[];
  followers: string[];
  following: string[];
}

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");

  if (!email)
    return NextResponse.json({ error: "Email required" }, { status: 400 });

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

    const user = (await User.findOne({ email }).lean()) as UserType | null;

    if (!user)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Fetch from standalone Notification collection
    const standaloneNotifications = await NotificationModel.find({
      recipient: user._id,
      read: false,
    })
      .sort({ createdAt: -1 })
      .lean();

    // Embedded fallback notifications
    const embeddedNotifications = (user.notifications || []).filter((n) => !n.read);

    // Merge both for complete compatibility
    const notifications = [
      ...standaloneNotifications.map((n) => ({
        type: n.type,
        fromEmail: n.fromEmail,
        postId: n.postId ? n.postId.toString() : n.post ? n.post.toString() : undefined,
        read: n.read,
        createdAt: n.createdAt,
      })),
      ...embeddedNotifications,
    ];

    return NextResponse.json({ notifications });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
