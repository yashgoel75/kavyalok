"use client";

import { useState, useEffect } from "react";
import { getFirebaseToken } from "@/utils";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";


const QuillEditor = dynamic(() => import("@/components/TestEditor"), {
  ssr: false,
});

export default function NewCompetitionPage() {
  const router = useRouter();
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const [formData, setFormData] = useState({
    coverPhoto: "",
    name: "",
    owner: "",
    organization: "",
    about: "",
    participantLimit: "",
    mode: "",
    venue: "",
    dateStart: "",
    dateEnd: "",
    timeStart: "",
    timeEnd: "",
    category: "",
    fee: "",
    judgingCriteria: "[]",
    prizePool: "[]",

    customQuestions: [],
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
    });
    return () => unsubscribe();
  }, []);


  const handleCoverPhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !firebaseUser) return;

    setIsUploadingImage(true);
    try {
      const token = await getFirebaseToken();
      const sigRes = await fetch("/api/signCompetitionCovers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ folder: "competitionCovers" }),
      });

      const sigData = await sigRes.json();
      const { timestamp, signature, apiKey, folder } = sigData;

      const form = new FormData();
      form.append("file", file);
      form.append("api_key", apiKey);
      form.append("timestamp", timestamp);
      form.append("signature", signature);
      form.append("folder", folder);

      const cloudRes = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: "POST", body: form },
      );

      const cloudData = await cloudRes.json();
      if (!cloudData.secure_url) throw new Error("Upload failed");

      setFormData((prev) => ({
        ...prev,
        coverPhoto: cloudData.secure_url,
      }));
    } catch (err) {
      console.error(err);
      alert("Cloudinary upload failed");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const addQuestion = () => {
    setFormData((prev) => ({
      ...prev,
      customQuestions: [
        ...prev.customQuestions,
        {
          question: "",
          type: "text",
          options: "",
          required: false,
        },
      ],
    }));
  };

  const updateQuestion = (index, field, value) => {
    const updated = [...formData.customQuestions];
    updated[index] = { ...updated[index], [field]: value };
    setFormData((prev) => ({ ...prev, customQuestions: updated }));
  };

  const removeQuestion = (index) => {
    const updated = [...formData.customQuestions];
    updated.splice(index, 1);
    setFormData((prev) => ({ ...prev, customQuestions: updated }));
  };


  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      ...formData,
      owner: firebaseUser.email,
      participantLimit: Number(formData.participantLimit || 0),
      fee: Number(formData.fee || 0),
      judgingCriteria: JSON.parse(formData.judgingCriteria || "[]"),
      prizePool: JSON.parse(formData.prizePool || "[]"),

      customQuestions: formData.customQuestions.map((q) => ({
        question: q.question,
        type: q.type,
        required: q.required,
        options:
          q.type === "mcq" ? q.options.split(",").map((o) => o.trim()) : [],
      })),
    };

    const res = await fetch("/api/competitions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    alert(data.success ? "Competition Created!" : data.error);
    data.success ? router.push("/competitions") : "";
  };


  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Create Competition</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="font-medium">Cover Photo</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleCoverPhotoChange}
          />
          {isUploadingImage && <p>Uploading...</p>}
          {formData.coverPhoto && (
            <img
              src={formData.coverPhoto}
              className="w-full h-48 object-cover rounded border mt-2"
              alt="cover"
            />
          )}
        </div>

        {[
          ["Organization/Society", "organization"],
          ["Event Name", "name"],
          ["Mode", "mode"],
          ["Venue", "venue"],
          ["Category", "category"],
        ].map(([label, key]) => (
          <div key={key}>
            <label className="font-medium">{label}</label>
            <input
              className="border p-2 rounded w-full"
              value={formData[key]}
              onChange={(e) =>
                setFormData({ ...formData, [key]: e.target.value })
              }
              required={key === "name" || key === "organization"}
            />
          </div>
        ))}
        <label className="font-medium">About</label>
        <QuillEditor
          value={formData.about}
          onChange={(html) =>
            setFormData((prev) => ({
              ...prev,
              about: html,
            }))
          }
        />

        <input
          type="number"
          placeholder="Participant Limit"
          className="border p-2 rounded"
          value={formData.participantLimit}
          onChange={(e) =>
            setFormData({ ...formData, participantLimit: e.target.value })
          }
        />

        <input
          type="date"
          className="border p-2 rounded"
          value={formData.dateStart}
          onChange={(e) =>
            setFormData({ ...formData, dateStart: e.target.value })
          }
        />

        <input
          type="date"
          className="border p-2 rounded"
          value={formData.dateEnd}
          onChange={(e) =>
            setFormData({ ...formData, dateEnd: e.target.value })
          }
        />

        <input
          type="time"
          className="border p-2 rounded"
          value={formData.timeStart}
          onChange={(e) =>
            setFormData({ ...formData, timeStart: e.target.value })
          }
        />

        <input
          type="time"
          className="border p-2 rounded"
          value={formData.timeEnd}
          onChange={(e) =>
            setFormData({ ...formData, timeEnd: e.target.value })
          }
        />

        <input
          type="number"
          placeholder="Fee"
          className="border p-2 rounded"
          value={formData.fee}
          onChange={(e) => setFormData({ ...formData, fee: e.target.value })}
        />

        <div className="border rounded p-4 space-y-4">
          <h2 className="font-semibold">Custom Application Questions</h2>

          {formData.customQuestions.map((q, i) => (
            <div key={i} className="border rounded p-3 space-y-2">
              <input
                className="border p-2 rounded w-full"
                placeholder="Question"
                value={q.question}
                onChange={(e) => updateQuestion(i, "question", e.target.value)}
              />

              <select
                className="border p-2 rounded w-full"
                value={q.type}
                onChange={(e) => updateQuestion(i, "type", e.target.value)}
              >
                <option value="text">Text</option>
                <option value="number">Number</option>
                <option value="mcq">MCQ</option>
              </select>

              {q.type === "mcq" && (
                <input
                  className="border p-2 rounded w-full"
                  placeholder="Options (comma separated)"
                  value={q.options}
                  onChange={(e) => updateQuestion(i, "options", e.target.value)}
                />
              )}

              <label className="flex gap-2 items-center">
                <input
                  type="checkbox"
                  checked={q.required}
                  onChange={(e) =>
                    updateQuestion(i, "required", e.target.checked)
                  }
                />
                Required
              </label>

              <button
                type="button"
                className="text-red-600 text-sm"
                onClick={() => removeQuestion(i)}
              >
                Remove
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={addQuestion}
            className="bg-gray-200 px-3 py-1 rounded"
          >
            + Add Question
          </button>
        </div>

        <button type="submit" className="bg-black text-white p-2 rounded">
          Submit
        </button>
      </form>
    </div>
  );
}
