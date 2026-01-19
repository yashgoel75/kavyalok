import { NextResponse } from "next/server";
import { Competition } from "../../../../../db/schema";
import { register } from "@/instrumentation";
import { CompetitionApplication } from "../../../../../db/schema";

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    await register();
    const comp = await Competition.findById(id).lean();

    if (!comp) {
      return NextResponse.json(
        { success: false, error: "Competition not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: comp,
    });
  } catch (error: any) {
    console.error("Error fetching single competition:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Server error" },
      { status: 500 }
    );
  }
}


export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    await register();
    const body = await req.json();

    const { participantId, responses } = body;

    if (!participantId) {
      return NextResponse.json(
        { success: false, error: "participantId is required" },
        { status: 400 }
      );
    }

    const competition = await Competition.findById(id);
    if (!competition) {
      return NextResponse.json(
        { success: false, error: "Competition not found" },
        { status: 404 }
      );
    }

    const alreadyApplied = await CompetitionApplication.findOne({
      competitionId: id,
      participantId,
    });

    if (alreadyApplied) {
      return NextResponse.json(
        { success: false, error: "Already applied to this competition" },
        { status: 409 }
      );
    }

    const application = await CompetitionApplication.create({
      competitionId: id,
      participantId,
      responses: responses || [],
    });

    if (!competition.participants.includes(participantId)) {
      competition.participants.push(participantId);
      await competition.save();
    }

    return NextResponse.json(
      {
        success: true,
        message: "Applied successfully",
        applicationId: application._id,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("Apply to competition error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Server error" },
      { status: 500 }
    );
  }
}



export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    await register();
    const deleted = await Competition.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Competition not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: "Deleted successfully" });
  } catch (err: any) {
    console.error("Delete competition error:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
