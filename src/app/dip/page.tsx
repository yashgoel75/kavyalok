"use client";

export default function DipPage() {
    return (
        <div className="p-4 flex flex-col gap-4 items-start">
            <h1 className="text-2xl font-bold mb-4">DIP Experiments</h1>
            <button className="p-2 rounded-md bg-indigo-600 text-white" onClick={() => window.open("/DIP Aim, Code and Theory-2.pdf", "_blank")}>View DIP Aim, Code and Theory</button>
            <button className="p-2 rounded-md bg-blue-600 text-white mt-4" onClick={() => window.open("/DIP File.pdf", "_blank")}>View DIP File</button>
        </div>
    );
}
