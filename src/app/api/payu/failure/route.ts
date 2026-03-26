import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const status = formData.get("status") as string;
        const productinfo = formData.get("productinfo") as string;
        const type = (formData.get("udf2") as string) || "regular";

        if (!status || !productinfo) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        return new NextResponse(
            `
    <html>

<head>
    <title>Failure</title>
    <script>
        let sec = 3;
        document.addEventListener("DOMContentLoaded", () => {
            document.getElementById("timer").innerText = sec;

            setInterval(() => {
                if (sec > 0)
                sec--;
                document.getElementById("timer").innerText = sec;
                if (sec === 1) {
                    window.location.href = "/competitions/${type}/${productinfo}?payment=failure";
                }
            }, 1000);
        });
    </script>
</head>

<body style="">
    <h1>Payment Failed</h1>
    <p>Any amount deducted will be refunded in the original payment method used within 3-5 business days.</p>
    <p>To participate, kindly try to register again</p>
    <p>Redirecting you to the competition page in <span id="timer"></span> seconds</p>
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
