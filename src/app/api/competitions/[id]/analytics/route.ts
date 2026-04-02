import { NextResponse } from "next/server";
import { Payment, CompetitionApplication } from "../../../../../../db/schema";
import { register } from "@/instrumentation";

export const dynamic = 'force-dynamic';

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    await register();
    const payments = await Payment.find({ competitionId: id, status: 'success' }).sort({ appliedAt: -1 }).lean();
    const applications = await CompetitionApplication.find({ competitionId: id }).lean();
    
    const totalCollected = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalApplications = applications.length;

    return NextResponse.json({
        success: true,
        data: {
            totalCollected,
            totalApplications,
            payments
        }
    });
  } catch (error: any) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Server error" },
      { status: 500 }
    );
  }
}
