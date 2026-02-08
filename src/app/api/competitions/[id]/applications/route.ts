import { NextResponse } from "next/server";
import { CompetitionApplication } from "../../../../../../db/schema";
import { register } from "@/instrumentation";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    await register();
    
    const applications = await CompetitionApplication.find({
      competitionId: id,
    })
      .sort({ appliedAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: applications,
    });
  } catch (error: any) {
    console.error("Error fetching applications:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Server error" },
      { status: 500 }
    );
  }
}