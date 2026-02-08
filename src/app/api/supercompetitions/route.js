import { superCompetition } from "../../../../db/schema";
import { register } from "@/instrumentation";
import { NextResponse } from "next/server";

export const GET = async (req) => {
  try {
    await register();

    const superCompetitions = await superCompetition.find({}).lean();

    return new Response(
      JSON.stringify({ success: true, data: superCompetitions }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error fetching super competitions:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Server error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};

export const POST = async (req) => {
  try {
    await register();

    const body = await req.json();

    const supercompetition = await superCompetition.create({
      coverPhoto: body.coverPhoto || "",
      organization: body.organization,
      name: body.name,
      owner: body.owner,
      about: body.about,
      registrationDeadline: body.registrationDeadline,
      dateStart: body.dateStart,
      dateEnd: body.dateEnd,
      category: body.category,
      prizePool: body.prizePool || [],
      competitions: body.competitions,
      participants: body.participants,
      isSuperEvent: body.isSuperEvent,
    });

    return Response.json({ success: true, supercompetition }, { status: 201 });
  } catch (err) {
    console.error(err);
    return Response.json(
      { success: false, error: err.message },
      { status: 500 },
    );
  }
};

export async function PATCH(req) {
  try {
    const body = await req.json();
    const { email, superCompetitionId } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    if (!superCompetitionId) {
      return NextResponse.json(
        { error: "Super Competition ID is required" },
        { status: 400 },
      );
    }

    await register();

    const comp = await superCompetition.findByIdAndUpdate(
      superCompetitionId,
      { $addToSet: { participants: email } },
      { new: true },
    );

    if (!comp) {
      return NextResponse.json(
        { error: "Competition not found" },
        { status: 404 },
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
      { status: 500 },
    );
  }
}
