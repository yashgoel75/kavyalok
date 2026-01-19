"use client";

import { useState, useEffect } from "react";
import { getFirebaseToken } from "@/utils";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function NewCompetitionPage() {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [formData, setFormData] = useState({
    coverPhoto: "",
    name: "",
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
  });
  const [isUploadingImage, setIsUploadingImage] = useState(false);

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
        { method: "POST", body: form }
      );
      const cloudData = await cloudRes.json();
      if (!cloudData.secure_url) throw new Error("Cloudinary upload failed");
      setFormData((prev) => ({ ...prev, coverPhoto: cloudData.secure_url }));
    } catch (err) {
      console.error(err);
      alert("Cloudinary upload failed");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      participantLimit: Number(formData.participantLimit || 0),
      fee: Number(formData.fee || 0),
      judgingCriteria: JSON.parse(formData.judgingCriteria || "[]"),
      prizePool: JSON.parse(formData.prizePool || "[]"),
    };
    const res = await fetch("/api/competitions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    alert(data.success ? "Competition Created!" : data.error);
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Create Competition</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label className="font-medium">Cover Photo</label>
          <input type="file" accept="image/*" onChange={handleCoverPhotoChange} />
          {isUploadingImage && <p>Uploading...</p>}
          {formData.coverPhoto && (
            <img src={formData.coverPhoto} className="w-full h-48 object-cover rounded border" alt="cover" />
          )}
        </div>
        <div className="flex flex-col gap-1">
          <label className="font-medium">Organization/Society Name</label>
          <input className="border p-2 rounded" value={formData.organization} onChange={(e) => setFormData({ ...formData, organization: e.target.value })} required />
        </div>
        <div className="flex flex-col gap-1">
          <label className="font-medium">Name</label>
          <input className="border p-2 rounded" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
        </div>
        <div className="flex flex-col gap-1">
          <label className="font-medium">About</label>
          <textarea className="border p-2 rounded" value={formData.about} onChange={(e) => setFormData({ ...formData, about: e.target.value })} required />
        </div>
        <div className="flex flex-col gap-1">
          <label className="font-medium">Participant Limit</label>
          <input type="number" className="border p-2 rounded" value={formData.participantLimit} onChange={(e) => setFormData({ ...formData, participantLimit: e.target.value })} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="font-medium">Mode</label>
          <input className="border p-2 rounded" value={formData.mode} onChange={(e) => setFormData({ ...formData, mode: e.target.value })} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="font-medium">Venue</label>
          <input className="border p-2 rounded" value={formData.venue} onChange={(e) => setFormData({ ...formData, venue: e.target.value })} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="font-medium">Start Date</label>
          <input type="date" className="border p-2 rounded" value={formData.dateStart} onChange={(e) => setFormData({ ...formData, dateStart: e.target.value })} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="font-medium">End Date</label>
          <input type="date" className="border p-2 rounded" value={formData.dateEnd} onChange={(e) => setFormData({ ...formData, dateEnd: e.target.value })} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="font-medium">Start Time</label>
          <input type="time" className="border p-2 rounded" value={formData.timeStart} onChange={(e) => setFormData({ ...formData, timeStart: e.target.value })} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="font-medium">End Time</label>
          <input type="time" className="border p-2 rounded" value={formData.timeEnd} onChange={(e) => setFormData({ ...formData, timeEnd: e.target.value })} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="font-medium">Category</label>
          <input className="border p-2 rounded" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="font-medium">Fee</label>
          <input type="number" className="border p-2 rounded" value={formData.fee} onChange={(e) => setFormData({ ...formData, fee: e.target.value })} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="font-medium">Judging Criteria (JSON array)</label>
          <textarea className="border p-2 rounded" value={formData.judgingCriteria} onChange={(e) => setFormData({ ...formData, judgingCriteria: e.target.value })} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="font-medium">Prize Pool (JSON array)</label>
          <textarea className="border p-2 rounded" value={formData.prizePool} onChange={(e) => setFormData({ ...formData, prizePool: e.target.value })} />
        </div>
        <button type="submit" className="bg-black text-white p-2 rounded mt-2">Submit</button>
      </form>
    </div>
  );
}
