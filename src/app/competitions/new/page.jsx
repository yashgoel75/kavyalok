"use client";

import { useState, useEffect, useCallback } from "react";
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
  const [isSuperEvent, setIsSuperEvent] = useState(false);
  const [numberOfSubEvents, setNumberOfSubEvents] = useState(2);
  const [activeSubEventIndex, setActiveSubEventIndex] = useState(0);

  // Super event form data
  const [superEventData, setSuperEventData] = useState({
    coverPhoto: "",
    name: "",
    organization: "",
    about: "",
    dateStart: "",
    dateEnd: "",
    registrationDeadline: "",
    category: "",
    prizePool: "[]",
  });

  // Sub-events array for super competition
  const [subEvents, setSubEvents] = useState([]);

  // Regular competition form data
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

  // Initialize sub-events when switching to super event mode
  useEffect(() => {
    if (isSuperEvent && subEvents.length === 0) {
      initializeSubEvents(numberOfSubEvents);
    }
  }, [isSuperEvent]);

  const initializeSubEvents = (count) => {
    const events = Array.from({ length: count }, (_, i) => ({
      coverPhoto: "",
      name: "",
      organization: superEventData.organization || "",
      about: "",
      participantLimit: "",
      mode: "",
      venue: "",
      dateStart: "",
      dateEnd: "",
      timeStart: "",
      timeEnd: "",
      category: superEventData.category || "",
      fee: "",
      judgingCriteria: "[]",
      prizePool: "[]",
      customQuestions: [],
    }));
    setSubEvents(events);
  };

  const handleSubEventCountChange = (count) => {
    const newCount = Math.max(2, Math.min(10, count)); // Min 2, max 10 sub-events
    setNumberOfSubEvents(newCount);
    
    if (subEvents.length < newCount) {
      // Add new sub-events
      const newEvents = Array.from({ length: newCount - subEvents.length }, () => ({
        coverPhoto: "",
        name: "",
        organization: superEventData.organization || "",
        about: "",
        participantLimit: "",
        mode: "",
        venue: "",
        dateStart: "",
        dateEnd: "",
        timeStart: "",
        timeEnd: "",
        category: superEventData.category || "",
        fee: "",
        judgingCriteria: "[]",
        prizePool: "[]",
        customQuestions: [],
      }));
      setSubEvents([...subEvents, ...newEvents]);
    } else if (subEvents.length > newCount) {
      // Remove excess sub-events
      setSubEvents(subEvents.slice(0, newCount));
      if (activeSubEventIndex >= newCount) {
        setActiveSubEventIndex(newCount - 1);
      }
    }
  };

  const updateSubEvent = useCallback((index, field, value) => {
    setSubEvents(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }, []);

  const handleCoverPhotoChange = async (e, isSuper = false, subEventIndex = null) => {
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

      if (isSuperEvent && isSuper) {
        setSuperEventData((prev) => ({
          ...prev,
          coverPhoto: cloudData.secure_url,
        }));
      } else if (isSuperEvent && subEventIndex !== null) {
        updateSubEvent(subEventIndex, "coverPhoto", cloudData.secure_url);
      } else {
        setFormData((prev) => ({
          ...prev,
          coverPhoto: cloudData.secure_url,
        }));
      }
    } catch (err) {
      console.error(err);
      alert("Cloudinary upload failed");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const addQuestion = useCallback((subEventIndex = null) => {
    const newQuestion = {
      question: "",
      type: "text",
      options: "",
      required: false,
    };

    if (subEventIndex !== null) {
      setSubEvents(prev => {
        const updated = [...prev];
        updated[subEventIndex] = {
          ...updated[subEventIndex],
          customQuestions: [...updated[subEventIndex].customQuestions, newQuestion]
        };
        return updated;
      });
    } else {
      setFormData((prev) => ({
        ...prev,
        customQuestions: [...prev.customQuestions, newQuestion],
      }));
    }
  }, []);

  const updateQuestion = useCallback((index, field, value, subEventIndex = null) => {
    if (subEventIndex !== null) {
      setSubEvents(prev => {
        const updated = [...prev];
        const questions = [...updated[subEventIndex].customQuestions];
        questions[index] = { ...questions[index], [field]: value };
        updated[subEventIndex] = {
          ...updated[subEventIndex],
          customQuestions: questions
        };
        return updated;
      });
    } else {
      setFormData((prev) => {
        const updated = [...prev.customQuestions];
        updated[index] = { ...updated[index], [field]: value };
        return { ...prev, customQuestions: updated };
      });
    }
  }, []);

  const removeQuestion = useCallback((index, subEventIndex = null) => {
    if (subEventIndex !== null) {
      setSubEvents(prev => {
        const updated = [...prev];
        const questions = [...updated[subEventIndex].customQuestions];
        questions.splice(index, 1);
        updated[subEventIndex] = {
          ...updated[subEventIndex],
          customQuestions: questions
        };
        return updated;
      });
    } else {
      setFormData((prev) => {
        const updated = [...prev.customQuestions];
        updated.splice(index, 1);
        return { ...prev, customQuestions: updated };
      });
    }
  }, []);

  // Memoized handlers for QuillEditor
  const handleFormDataAboutChange = useCallback((html) => {
    setFormData((prev) => ({
      ...prev,
      about: html,
    }));
  }, []);

  const handleSuperEventAboutChange = useCallback((html) => {
    setSuperEventData((prev) => ({
      ...prev,
      about: html,
    }));
  }, []);

  const handleSubEventAboutChange = useCallback((html, subEventIndex) => {
    setSubEvents(prev => {
      const updated = [...prev];
      updated[subEventIndex] = { ...updated[subEventIndex], about: html };
      return updated;
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSuperEvent) {
      // Create super competition with sub-events
      try {
        // First, create all sub-events
        const createdCompetitionIds = [];
        
        for (const subEvent of subEvents) {
          const subEventPayload = {
            ...subEvent,
            owner: firebaseUser.email,
            participantLimit: Number(subEvent.participantLimit || 0),
            fee: Number(subEvent.fee || 0),
            judgingCriteria: JSON.parse(subEvent.judgingCriteria || "[]"),
            prizePool: JSON.parse(subEvent.prizePool || "[]"),
            customQuestions: subEvent.customQuestions.map((q) => ({
              question: q.question,
              type: q.type,
              required: q.required,
              options: q.type === "mcq" ? q.options.split(",").map((o) => o.trim()) : [],
            })),
            isSuperEvent: false,
          };

          const subEventRes = await fetch("/api/competitions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(subEventPayload),
          });

          const subEventData = await subEventRes.json();
          if (subEventData.success && subEventData.competition?._id) {
            createdCompetitionIds.push(subEventData.competition._id);
          } else {
            throw new Error(`Failed to create sub-event: ${subEvent.name}`);
          }
        }

        // Then create the super competition
        const superCompetitionPayload = {
          ...superEventData,
          owner: firebaseUser.email,
          prizePool: JSON.parse(superEventData.prizePool || "[]"),
          competitions: createdCompetitionIds,
          isSuperEvent: true,
        };

        const superRes = await fetch("/api/supercompetitions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(superCompetitionPayload),
        });

        const superData = await superRes.json();
        alert(superData.success ? "Super Competition Created!" : superData.error);
        if (superData.success) {
          router.push("/competitions");
        }
      } catch (error) {
        console.error(error);
        alert("Failed to create super competition: " + error.message);
      }
    } else {
      // Create regular competition
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
          options: q.type === "mcq" ? q.options.split(",").map((o) => o.trim()) : [],
        })),
        isSuperEvent: false,
      };

      const res = await fetch("/api/competitions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      alert(data.success ? "Competition Created!" : data.error);
      if (data.success) {
        router.push("/competitions");
      }
    }
  };

  const renderSubEventForm = (subEventIndex) => {
    const subEvent = subEvents[subEventIndex];
    if (!subEvent) return null;

    return (
      <div className="space-y-4">
        <div>
          <label className="font-medium">Sub-Event Cover Photo</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleCoverPhotoChange(e, false, subEventIndex)}
          />
          {isUploadingImage && <p>Uploading...</p>}
          {subEvent.coverPhoto && (
            <img
              src={subEvent.coverPhoto}
              className="w-full h-48 object-cover rounded border mt-2"
              alt="sub-event cover"
            />
          )}
        </div>

        {[
          ["Event Name", "name"],
          ["Mode", "mode"],
          ["Venue", "venue"],
        ].map(([label, key]) => (
          <div key={key}>
            <label className="font-medium">{label}</label>
            <input
              className="border p-2 rounded w-full"
              value={subEvent[key]}
              onChange={(e) => updateSubEvent(subEventIndex, key, e.target.value)}
              required={key === "name"}
            />
          </div>
        ))}

        <div>
          <label className="font-medium">About</label>
          <QuillEditor
            key={`subevent-${subEventIndex}`}
            value={subEvent.about}
            onChange={(html) => handleSubEventAboutChange(html, subEventIndex)}
          />
        </div>

        <input
          type="number"
          placeholder="Participant Limit"
          className="border p-2 rounded w-full"
          value={subEvent.participantLimit}
          onChange={(e) => updateSubEvent(subEventIndex, "participantLimit", e.target.value)}
        />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="font-medium">Start Date</label>
            <input
              type="date"
              className="border p-2 rounded w-full"
              value={subEvent.dateStart}
              onChange={(e) => updateSubEvent(subEventIndex, "dateStart", e.target.value)}
            />
          </div>
          <div>
            <label className="font-medium">End Date</label>
            <input
              type="date"
              className="border p-2 rounded w-full"
              value={subEvent.dateEnd}
              onChange={(e) => updateSubEvent(subEventIndex, "dateEnd", e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="font-medium">Start Time</label>
            <input
              type="time"
              className="border p-2 rounded w-full"
              value={subEvent.timeStart}
              onChange={(e) => updateSubEvent(subEventIndex, "timeStart", e.target.value)}
            />
          </div>
          <div>
            <label className="font-medium">End Time</label>
            <input
              type="time"
              className="border p-2 rounded w-full"
              value={subEvent.timeEnd}
              onChange={(e) => updateSubEvent(subEventIndex, "timeEnd", e.target.value)}
            />
          </div>
        </div>

        <input
          type="number"
          placeholder="Fee"
          className="border p-2 rounded w-full"
          value={subEvent.fee}
          onChange={(e) => updateSubEvent(subEventIndex, "fee", e.target.value)}
        />

        <div className="border rounded p-4 space-y-4">
          <h3 className="font-semibold">Custom Application Questions</h3>

          {subEvent.customQuestions.map((q, i) => (
            <div key={i} className="border rounded p-3 space-y-2">
              <input
                className="border p-2 rounded w-full"
                placeholder="Question"
                value={q.question}
                onChange={(e) => updateQuestion(i, "question", e.target.value, subEventIndex)}
              />

              <select
                className="border p-2 rounded w-full"
                value={q.type}
                onChange={(e) => updateQuestion(i, "type", e.target.value, subEventIndex)}
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
                  onChange={(e) => updateQuestion(i, "options", e.target.value, subEventIndex)}
                />
              )}

              <label className="flex gap-2 items-center">
                <input
                  type="checkbox"
                  checked={q.required}
                  onChange={(e) => updateQuestion(i, "required", e.target.checked, subEventIndex)}
                />
                Required
              </label>

              <button
                type="button"
                className="text-red-600 text-sm"
                onClick={() => removeQuestion(i, subEventIndex)}
              >
                Remove
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={() => addQuestion(subEventIndex)}
            className="bg-gray-200 px-3 py-1 rounded"
          >
            + Add Question
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">
          Create {isSuperEvent ? "Super Competition" : "Competition"}
        </h1>
        
        <label className="flex items-center gap-3 cursor-pointer">
          <span className="font-medium">Super Competition</span>
          <div className="relative">
            <input
              type="checkbox"
              className="sr-only"
              checked={isSuperEvent}
              onChange={(e) => {
                setIsSuperEvent(e.target.checked);
                if (e.target.checked) {
                  initializeSubEvents(numberOfSubEvents);
                }
              }}
            />
            <div className={`block w-14 h-8 rounded-full ${isSuperEvent ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
            <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition ${isSuperEvent ? 'transform translate-x-6' : ''}`}></div>
          </div>
        </label>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {isSuperEvent ? (
          <>
            {/* Super Event Details */}
            <div className="border rounded-lg p-6 bg-blue-50">
              <h2 className="text-xl font-semibold mb-4">Super Competition Details</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="font-medium">Cover Photo</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleCoverPhotoChange(e, true)}
                  />
                  {isUploadingImage && <p>Uploading...</p>}
                  {superEventData.coverPhoto && (
                    <img
                      src={superEventData.coverPhoto}
                      className="w-full h-48 object-cover rounded border mt-2"
                      alt="super event cover"
                    />
                  )}
                </div>

                {[
                  ["Organization/Society", "organization"],
                  ["Super Competition Name", "name"],
                  ["Category", "category"],
                ].map(([label, key]) => (
                  <div key={key}>
                    <label className="font-medium">{label}</label>
                    <input
                      className="border p-2 rounded w-full"
                      value={superEventData[key]}
                      onChange={(e) =>
                        setSuperEventData({ ...superEventData, [key]: e.target.value })
                      }
                      required
                    />
                  </div>
                ))}

                <div>
                  <label className="font-medium">About</label>
                  <QuillEditor
                    key="super-event-about"
                    value={superEventData.about}
                    onChange={handleSuperEventAboutChange}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="font-medium">Start Date</label>
                    <input
                      type="date"
                      className="border p-2 rounded w-full"
                      value={superEventData.dateStart}
                      onChange={(e) =>
                        setSuperEventData({ ...superEventData, dateStart: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="font-medium">End Date</label>
                    <input
                      type="date"
                      className="border p-2 rounded w-full"
                      value={superEventData.dateEnd}
                      onChange={(e) =>
                        setSuperEventData({ ...superEventData, dateEnd: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div>
                  <label className="font-medium">Registration Deadline</label>
                  <input
                    type="date"
                    className="border p-2 rounded w-full"
                    value={superEventData.registrationDeadline}
                    onChange={(e) =>
                      setSuperEventData({ ...superEventData, registrationDeadline: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Number of Sub-Events */}
            <div className="border rounded-lg p-6">
              <label className="font-medium">Number of Sub-Events</label>
              <input
                type="number"
                min="2"
                max="10"
                className="border p-2 rounded w-full mt-2"
                value={numberOfSubEvents}
                onChange={(e) => handleSubEventCountChange(parseInt(e.target.value))}
              />
              <p className="text-sm text-gray-600 mt-1">Minimum 2, Maximum 10 sub-events</p>
            </div>

            {/* Sub-Events Navigation */}
            <div className="border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Sub-Events Configuration</h2>
              
              <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                {subEvents.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setActiveSubEventIndex(index)}
                    className={`px-4 py-2 rounded whitespace-nowrap ${
                      activeSubEventIndex === index
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 hover:bg-gray-300"
                    }`}
                  >
                    Sub-Event {index + 1}
                    {subEvents[index]?.name && `: ${subEvents[index].name}`}
                  </button>
                ))}
              </div>

              {renderSubEventForm(activeSubEventIndex)}
            </div>
          </>
        ) : (
          <>
            {/* Regular Competition Form */}
            <div>
              <label className="font-medium">Cover Photo</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleCoverPhotoChange(e)}
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

            <div>
              <label className="font-medium">About</label>
              <QuillEditor
                key="regular-event-about"
                value={formData.about}
                onChange={handleFormDataAboutChange}
              />
            </div>

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
                onClick={() => addQuestion()}
                className="bg-gray-200 px-3 py-1 rounded"
              >
                + Add Question
              </button>
            </div>
          </>
        )}

        <button type="submit" className="bg-black text-white p-3 rounded font-medium">
          Create {isSuperEvent ? "Super Competition" : "Competition"}
        </button>
      </form>
    </div>
  );
}