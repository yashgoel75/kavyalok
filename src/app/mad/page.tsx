"use client";

export default function MadPage() {
    return <div className="p-4 flex flex-col gap-4 items-start">
        <button className="p-2 rounded-md bg-blue-600 text-white" onClick={() => window.location.href = "https://drive.google.com/drive/folders/1-8jQG6Lz8kC7Qj9q-rQ-zQ-zQ-zQ-zQ?usp=sharing"}>Click me to download</button>
        <button className="p-2 rounded-md bg-indigo-600 text-white" onClick={() => window.open("/Yash-Heena.pdf", "_blank")}>View Yash-Heena</button>
        <button className="p-2 rounded-md bg-indigo-600 text-white" onClick={() => window.open("/Gaurav.pdf", "_blank")}>View Gaurav</button>
        <button className="p-2 rounded-md bg-indigo-600 text-white" onClick={() => window.open("/Riya.pdf", "_blank")}>View Riya</button>
        <button className="p-2 rounded-md bg-indigo-600 text-white" onClick={() => window.open("/Vaibhav.pdf", "_blank")}>View Vaibhav</button>
        <div>Mad Page</div>
    </div>;
}