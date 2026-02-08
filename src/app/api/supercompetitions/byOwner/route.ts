import { NextRequest, NextResponse } from "next/server";
import { superCompetition } from "../../../../../db/schema";
import { register } from "@/instrumentation";

export async function GET(req: NextRequest) {
    try {
        await register();

        const { searchParams } = new URL(req.url);
        const owner = searchParams.get("owner");

        if (!owner) {
            return NextResponse.json(
                { success: false, message: "Owner is required" },
                { status: 400 }
            );
        }

        const res = await superCompetition.find({ owner }).select('_id coverPhoto name organization about dateStart dateEnd isSuperEvent').lean();

        return NextResponse.json(
            {
                success: true,
                data: res,
            },
            { status: 200 }
        );
    } catch (error) {
        return NextResponse.json(
            { success: false, error: String(error) },
            { status: 500 }
        );
    }
}
