import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const status = formData.get("status") as string;
    const productinfo = formData.get("productinfo") as string;
    const email = formData.get("email") as string;
    const responsesRaw = formData.get("udf1") as string;

    if (!status || !productinfo) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const responses = JSON.parse(responsesRaw);

    console.log(status);
    console.log(email);
    console.log(productinfo);
    try {
      await fetch(`${new URL(req.url).origin}/api/competitions/${productinfo}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantId: email,
          responses,
        }),
      });
    } catch (patchErr) {
      console.error("Failed to update participant:", patchErr);
    }

    return new NextResponse(
      `
    <html>

<head>
    <title>Success</title>
    <script>
        let sec = 3;
        document.addEventListener("DOMContentLoaded", () => {
            document.getElementById("timer").innerText = sec;

            setInterval(() => {
            if (sec > 0)
                sec--;
                document.getElementById("timer").innerText = sec;
                if (sec === 1) {
                    window.location.href = "/competitions/${productinfo}";
                }
            }, 1000);
        });
    </script>

</head>

<body style="">
    <h1>Payment Successful</h1>
    <p>You are now registered for the competition.</p>
    <p>Redirecting you to the competition page in <span id="timer"></span> seconds</p>
    </p>
</body>

</html>
  `,
      {
        headers: { "Content-Type": "text/html" },
      }
    );


  } catch (err: unknown) {
    console.error("PayU Success Error:", err);
    return NextResponse.json(
      "Error"
    );
  }
}
