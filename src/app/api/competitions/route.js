import { Competition } from "../../../../db/schema";
import { register } from "@/instrumentation";
import { NextResponse } from "next/server";

export const GET = async (req) => {
  try {
    await register();

    const competitions = await Competition.find({}).lean();

    return new Response(JSON.stringify({ success: true, data: competitions }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching competitions:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Server error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

export const POST = async (req) => {
  try {
    await register();

    const body = await req.json();

    const competition = await Competition.create({
      coverPhoto: body.coverPhoto || "",
      organization: body.organization,
      name: body.name,
      about: body.about,
      participantLimit: body.participantLimit,
      mode: body.mode,
      venue: body.venue,
      dateStart: body.dateStart,
      dateEnd: body.dateEnd,
      timeStart: body.timeStart,
      timeEnd: body.timeEnd,
      category: body.category,
      fee: body.fee,
      judgingCriteria: body.judgingCriteria || [],
      prizePool: body.prizePool || [],

      customQuestions: body.customQuestions?.map(q => ({
        question: q.question,
        type: q.type || "text",
        options: q.options || [],
        required: q.required || false
      })) || [],
    });

    return Response.json(
      { success: true, competition },
      { status: 201 }
    );
  } catch (err) {
    console.error(err);
    return Response.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
};


export async function PATCH(req) {
  try {
    const body = await req.json();
    const { email, competitionId } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    if (!competitionId) {
      return NextResponse.json(
        { error: "Competition ID is required" },
        { status: 400 }
      );
    }

    await register();

    const comp = await Competition.findByIdAndUpdate(
      competitionId,
      { $addToSet: { participants: email } },
      { new: true }
    );

    if (!comp) {
      return NextResponse.json(
        { error: "Competition not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      participants: comp.participants,
    });
  } catch (err) {
    console.error("Patch Competition Error:", err);
    return NextResponse.json(
      { error: "Server error", details: err.message || "Unknown" },
      { status: 500 }
    );
  }
}
