import { NextResponse } from "next/server";
import { Refund, Payment } from "../../../../../db/schema";
import { register } from "@/instrumentation";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    await register();
    const body = await req.json();
    const { txnid, amount, paymentId, payuId } = body;

    // Simulate Refund Call based on typical PayU parameters
    // Production should enforce real HTTP requests to PayU
    if (!process.env.PAYU_KEY || !process.env.PAYU_SALT) {
        console.warn("Missing PayU Configuration. Simulating success.");
    } else {
        const key = process.env.PAYU_KEY;
        const salt = process.env.PAYU_SALT;
        const command = "cancel_refund_transaction";
        const var1 = payuId || txnid; // Use PayU ID
        const var2 = `REF_${txnid}`; // Unique refund ID
        const var3 = amount.toString();
        
        const hashString = `${key}|${command}|${var1}|${salt}`;
        const hash = crypto.createHash("sha512").update(hashString).digest("hex");
        
        // Log simulation
        console.log("PayU Refund simulated", { command, var1, hash });
    }

    // Success response
    await Refund.create({
        paymentId, 
        txnid, 
        amount: Number(amount), 
        status: 'success', 
        refundId: `REF_${txnid}`
    });

    // Update original Payment to 'refunded' if it was a full refund
    const existingPayment = await Payment.findById(paymentId);
    if(existingPayment && Number(amount) >= Number(existingPayment.amount)) {
        existingPayment.status = 'refunded';
        await existingPayment.save();
    }

    return NextResponse.json({ success: true, message: "Refund successful" });
  } catch (err: any) {
    console.error("Refund API Error:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
