import { NextResponse } from "next/server";

export async function makeRequest() {
    const url = "https://uat-accounts.payu.in/oauth/token";
    
    const headers = {
        "accept": "application/json",
        "content-type": "application/x-www-form-urlencoded"
    };

    const formData = new URLSearchParams({
        "grant_type": "client_credentials",
        "scope": "verify_bank_account",
        "client_id": "dd9dae6e070c2d0f9b2dbbf4213f6b2d55d9bdea9f66283cbd068ce415e57e12",
        "client_secret": "c04e03cf7861ff70a448c6880d4527b2c811ae4d61a73140096feb4a87670962",
    });

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: headers,
            body: formData
        });
        
        const contentType = response.headers.get("content-type");
        let data;
        if (contentType && contentType.includes("application/json")) {
            data = await response.json();
        } else {
            const text = await response.text();
            try {
                data = JSON.parse(text);
            } catch {
                data = { rawResponse: text };
            }
        }

        console.log(`Status Code: ${response.status}`);
        console.log(`Response:`, data);

        return { status: response.status, data };
    } catch (error) {
        console.error(`Error: ${error.message}`);
        throw error;
    }
}

export async function POST() {
    try {
        const { status, data } = await makeRequest();
        return NextResponse.json(data, { status });
    } catch (error) {
        return NextResponse.json(
            { error: error.message || "Failed to execute bank verification request" },
            { status: 500 }
        );
    }
}

export async function GET() {
    try {
        const { status, data } = await makeRequest();
        return NextResponse.json(data, { status });
    } catch (error) {
        return NextResponse.json(
            { error: error.message || "Failed to execute bank verification request" },
            { status: 500 }
        );
    }
}