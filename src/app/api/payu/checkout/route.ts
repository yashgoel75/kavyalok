import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!process.env.PAYU_KEY || !process.env.PAYU_SALT) {
      throw new Error("Missing PayU Configuration");
    }

    const key = process.env.PAYU_KEY;
    const salt = process.env.PAYU_SALT;

    const { amount, firstname, email, phone, productinfo, responses } = body;

    if (!amount || !firstname || !email || !productinfo) {
      return new Response(
        JSON.stringify({ error: "Missing required payment fields" }),
        { status: 400 }
      );
    }

    const txnid = "TXN_" + Date.now();

    const normalizedProductinfo =
      typeof productinfo === "string"
        ? productinfo
        : JSON.stringify(productinfo);

    const responsesString = JSON.stringify(responses);

    const hashString = [
      key,
      txnid,
      parseFloat(amount).toFixed(2),
      normalizedProductinfo,
      firstname,
      email,
      responsesString, // udf1
      "", // udf2
      "", // udf3
      "", // udf4
      "", // udf5
      "", "", "", "", "", // extra required empty fields
      salt,
    ].join("|");

    const hash = crypto
      .createHash("sha512")
      .update(hashString)
      .digest("hex");

    console.log("HASH STRING:", hashString);
    console.log("GENERATED HASH:", hash);

    return new Response(
      JSON.stringify({
        url: process.env.PAYU_BASE_URL || "https://test.payu.in/_payment",
        fields: {
          key,
          txnid,
          amount: parseFloat(amount).toFixed(2),
          productinfo: normalizedProductinfo,
          firstname,
          email,
          phone: phone || "",
          udf1: responsesString,
          surl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/payu/success`,
          furl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/payu/failure`,
          hash,
        },
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Payment API Error:", err);
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        details: err instanceof Error ? err.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
