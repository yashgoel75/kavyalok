import { NextResponse } from "next/server";
import { register } from "@/instrumentation";
import { User, Bookmark } from "../../../../db/schema";
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
                bookmarks: 1,
            }
        ).lean();

        if (!rawUser) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        const user = (Array.isArray(rawUser) ? rawUser[0] : rawUser) as any;

        // Fetch from Bookmark collection to ensure complete coverage
        const userBookmarks = await Bookmark.find({ user: user._id }).lean();
        const bookmarkPostIdsFromColl = userBookmarks.map((b: any) => b.post.toString());
        
        // Merge with legacy bookmarks array for zero downtime
        const combinedBookmarks = Array.from(
            new Set([...(user.bookmarks || []), ...bookmarkPostIdsFromColl])
        );

        return NextResponse.json({
            user: {
                ...user,
                bookmarks: combinedBookmarks,
            },
        });
    } catch (error) {
        console.error("Error fetching user:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
