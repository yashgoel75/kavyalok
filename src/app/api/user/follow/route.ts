import { NextRequest, NextResponse } from "next/server";
import { register } from "@/instrumentation";
import { User, Follow, Notification, Interaction } from "../../../../../db/schema";
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

        const { currentUserEmail, targetEmail, action } = await req.json();

        if (!currentUserEmail || !targetEmail || !action) {
            return NextResponse.json(
                { error: "Current user email, target email, and action are required" },
                { status: 400 }
            );
        }

        if (currentUserEmail === targetEmail) {
            return NextResponse.json(
                { error: "You cannot follow yourself" },
                { status: 400 }
            );
        }

        const currentUser = await User.findOne({ email: currentUserEmail });
        const targetUser = await User.findOne({ email: targetEmail });

        if (!currentUser || !targetUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        if (action === "follow") {
            // New Scalable Follow Collection
            await Follow.updateOne(
                { follower: currentUser._id, following: targetUser._id },
                { $setOnInsert: { follower: currentUser._id, following: targetUser._id } },
                { upsert: true }
            );

            // Backward Compatibility Dual Write
            await User.updateOne(
                { email: currentUserEmail },
                { $addToSet: { following: targetEmail } }
            );

            await User.updateOne(
                { email: targetEmail },
                { $addToSet: { followers: currentUserEmail } }
            );

            // Standalone Notification Collection
            await Notification.create({
                recipient: targetUser._id,
                sender: currentUser._id,
                type: "new_follower",
                fromEmail: currentUserEmail,
                read: false,
            });

            // Dual Write Embedded Notification
            const notification = {
                type: "new_follower",
                fromEmail: currentUserEmail,
                read: false,
                createdAt: new Date(),
            };

            await User.updateOne(
                { email: targetEmail },
                { $push: { notifications: notification } }
            );

            // Track Interaction for Recommendations
            await Interaction.create({
                user: currentUser._id,
                action: "follow",
            });

            return NextResponse.json(
                { message: "User followed successfully" },
                { status: 200 }
            );
        } else if (action === "unfollow") {
            // Remove from Follow collection
            await Follow.deleteOne({
                follower: currentUser._id,
                following: targetUser._id,
            });

            // Backward Compatibility Dual Pull
            await User.updateOne(
                { email: currentUserEmail },
                { $pull: { following: targetEmail } }
            );

            await User.updateOne(
                { email: targetEmail },
                { $pull: { followers: currentUserEmail } }
            );

            return NextResponse.json(
                { message: "User unfollowed successfully" },
                { status: 200 }
            );
        } else {
            return NextResponse.json({ error: "Invalid action" }, { status: 400 });
        }
    } catch (error) {
        console.error("Error following/unfollowing user:", error);
        return NextResponse.json(
            { error: "Failed to update follow status" },
            { status: 500 }
        );
    }
}
