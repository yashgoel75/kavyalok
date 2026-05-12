"use client";

export default function AdlPage() {
    return (
        <div className="p-4 flex flex-col gap-4 items-start">
            <h1 className="text-2xl font-bold mb-4">ADL Experiments</h1>
            <button className="p-2 rounded-md bg-indigo-600 text-white" onClick={() => window.open("/ADL Aim and Theory.pdf", "_blank")}>View ADL Aim and Theory</button>
            <button className="p-2 rounded-md bg-blue-600 text-white mt-4" onClick={() => window.open("/ADL File.pdf", "_blank")}>View ADL File</button>
        </div>
    );
}
