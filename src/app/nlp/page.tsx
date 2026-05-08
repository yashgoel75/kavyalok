"use client";

export default function NlpPage() {
    return (
        <div className="p-4 flex flex-col gap-4 items-start">
            <h1 className="text-2xl font-bold mb-4">NLP Experiments</h1>
            <button className="p-2 rounded-md bg-indigo-600 text-white" onClick={() => window.open("/NLP Experiment 1.pdf", "_blank")}>View NLP Experiment 1</button>
            <button className="p-2 rounded-md bg-indigo-600 text-white" onClick={() => window.open("/NLP - Experiment 2.docx.pdf", "_blank")}>View NLP Experiment 2</button>
            <button className="p-2 rounded-md bg-indigo-600 text-white" onClick={() => window.open("/NLP3-2.pdf", "_blank")}>View NLP Experiment 3</button>
            <button className="p-2 rounded-md bg-indigo-600 text-white" onClick={() => window.open("/NLP4-2.pdf", "_blank")}>View NLP Experiment 4</button>
            <button className="p-2 rounded-md bg-indigo-600 text-white" onClick={() => window.open("/NLP5-2.pdf", "_blank")}>View NLP Experiment 5</button>
            <button className="p-2 rounded-md bg-indigo-600 text-white" onClick={() => window.open("/NLP6-2.pdf", "_blank")}>View NLP Experiment 6</button>
            <button className="p-2 rounded-md bg-indigo-600 text-white" onClick={() => window.open("/NLP7-2.pdf", "_blank")}>View NLP Experiment 7</button>
            <button className="p-2 rounded-md bg-indigo-600 text-white" onClick={() => window.open("/NLP8-2.pdf", "_blank")}>View NLP Experiment 8</button>
            <button className="p-2 rounded-md bg-indigo-600 text-white" onClick={() => window.open("/NLP9-2.pdf", "_blank")}>View NLP Experiment 9</button>
            <button className="p-2 rounded-md bg-indigo-600 text-white" onClick={() => window.open("/NLP10-2.pdf", "_blank")}>View NLP Experiment 10</button>
            <button className="p-2 rounded-md bg-blue-600 text-white mt-4" onClick={() => window.open("/NLP Theory Experiment-Wise.pdf", "_blank")}>View NLP Theory Experiment-Wise</button>
        </div>
    );
}
