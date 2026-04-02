import { NextResponse } from "next/server";
import { Competition } from "../../../../../db/schema";
import { register } from "@/instrumentation";

export async function POST(req: Request) {
    try {
        await register();
        const body = await req.json();
        const { competitionId, accountNumber, ifsc, holderName } = body;

        if (!competitionId || !accountNumber || !ifsc) {
            return NextResponse.json({ success: false, error: "Missing bank details" }, { status: 400 });
        }

        // Simulate bank verification / Penny Drop
        // Real logic would request to PayU checking the IFSC and Account validity
        
        await Competition.findByIdAndUpdate(competitionId, {
            bankDetails: { accountNumber, ifsc, holderName },
            bankVerificationStatus: "verified"
        });

        return NextResponse.json({ success: true, message: "Bank Account Verified successfully." });
    } catch (err: any) {
        console.error("Bank Verification Error:", err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
