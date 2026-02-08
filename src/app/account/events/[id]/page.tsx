"use client";

import Header from "@/components/header/page";
import Navigation from "@/components/navigation/page";
import Footer from "@/components/footer/page";
import { useState, useEffect } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter, useParams } from "next/navigation";
import axios from "axios";
import { getFirebaseToken } from "@/utils";
import dynamic from "next/dynamic";

interface Competition {
  _id: string;
  coverPhoto: string;
  owner: string;
  name: string;
  organization: string;
  about: string;
  participantLimit: number;
  mode: string;
  venue: string;
  dateStart: string;
  dateEnd: string;
  timeStart: string;
  timeEnd: string;
  registrationDeadline: Date;
  category: string;
  fee: number;
  judgingCriteria: string[];
  prizePool: string[];
  customQuestions: Array<{
    _id: string;
    question: string;
    type: string;
    options: string[];
    required: boolean;
  }>;
  participants: string[];
}

interface Application {
  _id: string;
  competitionId: string;
  participantId: string;
  responses: Array<{
    questionId: string;
    answer: any;
  }>;
  appliedAt: Date;
}

export default function EventDetailsPage() {
  const QuillEditor = dynamic(() => import("@/components/TestEditor"), {
    ssr: false,
  });
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [user, setUser] = useState<User | null>(null);
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [formData, setFormData] = useState<Competition | null>(null);
  const [showApplications, setShowApplications] = useState<boolean>(false);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loadingApplications, setLoadingApplications] =
    useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user?.email) {
        fetchCompetition();
        return;
      } else {
        const timer = setTimeout(() => {
          router.replace("/auth/login");
        }, 1500);
      }
    });
    return () => unsubscribe();
  }, [id]);

  async function fetchCompetition() {
    try {
      const token = await getFirebaseToken();
      const res = await axios.get(`/api/competitions/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.data.success) {
        setCompetition(res.data.data);
        setFormData(res.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch competition:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchApplications() {
    setLoadingApplications(true);
    try {
      const token = await getFirebaseToken();
      const res = await axios.get(`/api/competitions/${id}/applications`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.data.success) {
        setApplications(res.data.data);
        setShowApplications(true);
      }
    } catch (error) {
      console.error("Failed to fetch applications:", error);
      alert("Failed to fetch applications");
    } finally {
      setLoadingApplications(false);
    }
  }

  async function handleSave() {
    try {
      const token = await getFirebaseToken();
      const res = await axios.put(
        `/api/competitions/${id}`,
        {
          isAdmin: true,
          updates: formData,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (res.data.success) {
        setCompetition(res.data.data);
        setIsEditing(false);
        alert("Competition updated successfully!");
      }
    } catch (error) {
      console.error("Failed to update competition:", error);
      alert("Failed to update competition");
    }
  }

  function handleInputChange(field: string, value: any) {
    if (formData) {
      setFormData({ ...formData, [field]: value });
    }
  }

  function handleArrayChange(field: string, index: number, value: string) {
    if (formData) {
      const array = [...(formData[field as keyof Competition] as string[])];
      array[index] = value;
      setFormData({ ...formData, [field]: array });
    }
  }

  function addArrayItem(field: string) {
    if (formData) {
      const array = [...(formData[field as keyof Competition] as string[])];
      array.push("");
      setFormData({ ...formData, [field]: array });
    }
  }

  function removeArrayItem(field: string, index: number) {
    if (formData) {
      const array = [...(formData[field as keyof Competition] as string[])];
      array.splice(index, 1);
      setFormData({ ...formData, [field]: array });
    }
  }

  function handleCustomQuestionChange(
    index: number,
    field: string,
    value: any,
  ) {
    if (formData && formData.customQuestions) {
      const questions = [...formData.customQuestions];
      questions[index] = { ...questions[index], [field]: value };
      setFormData({ ...formData, customQuestions: questions });
    }
  }

  function addCustomQuestion() {
    if (formData) {
      const questions = formData.customQuestions || [];
      questions.push({
        _id: "",
        question: "",
        type: "text",
        options: [],
        required: false,
      });
      setFormData({ ...formData, customQuestions: questions });
    }
  }

  function removeCustomQuestion(index: number) {
    if (formData && formData.customQuestions) {
      const questions = [...formData.customQuestions];
      questions.splice(index, 1);
      setFormData({ ...formData, customQuestions: questions });
    }
  }

  if (loading) return <p className="text-center mt-12">Loading event...</p>;
  if (!competition)
    return <p className="text-center mt-12">Event not found.</p>;

  return (
    <>
      <Header />

      <main className="max-w-6xl mx-auto px-4 py-12 min-h-[85vh]">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-3xl font-semibold">Event Details</h1>
          <div className="space-x-2">
            {!isEditing && !showApplications && (
              <>
                <button
                  onClick={fetchApplications}
                  disabled={loadingApplications}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:shadow-md disabled:opacity-50"
                >
                  {loadingApplications ? "Loading..." : "View Applications"}
                </button>
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:shadow-md"
                >
                  Edit Event
                </button>
              </>
            )}
            {isEditing && (
              <>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:shadow-md"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setFormData(competition);
                  }}
                  className="px-4 py-2 bg-gray-500 text-white rounded-md hover:shadow-md"
                >
                  Cancel
                </button>
              </>
            )}
            {showApplications && (
              <button
                onClick={() => setShowApplications(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:shadow-md"
              >
                Back to Details
              </button>
            )}
          </div>
        </div>

        {showApplications ? (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold">
              Applications ({applications.length})
            </h2>
            {applications.length === 0 ? (
              <p className="text-gray-600">No applications yet.</p>
            ) : (
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        #
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Participant ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Applied Date
                      </th>
                      {competition.customQuestions?.map((question, idx) => (
                        <th
                          key={idx}
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          {question.question}
                        </th>
                      ))}
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {[...applications].reverse().map((app, index) => (
                      <tr key={app._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {app.participantId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {new Date(app.appliedAt).toLocaleDateString()}
                          <br />
                          <span className="text-xs text-gray-400">
                            {new Date(app.appliedAt).toLocaleTimeString()}
                          </span>
                        </td>
                        {competition.customQuestions?.map((question, qIdx) => {
                          const response = app.responses?.find(
                            (r) => r.questionId === question._id,
                          );
                          return (
                            <td
                              key={qIdx}
                              className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate"
                              title={
                                response
                                  ? typeof response.answer === "object"
                                    ? JSON.stringify(response.answer)
                                    : response.answer
                                  : "No response"
                              }
                            >
                              {response ? (
                                typeof response.answer === "object" ? (
                                  JSON.stringify(response.answer)
                                ) : (
                                  response.answer
                                )
                              ) : (
                                <span className="text-gray-400 italic">
                                  No response
                                </span>
                              )}
                            </td>
                          );
                        })}
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => {
                              const responseText = app.responses
                                ?.map((r) => {
                                  const q = competition.customQuestions?.find(
                                    (question) => question._id === r.questionId,
                                  );
                                  return `${q?.question || "Question"}: ${
                                    typeof r.answer === "object"
                                      ? JSON.stringify(r.answer)
                                      : r.answer
                                  }`;
                                })
                                .join("\n\n");
                              alert(
                                `Application Details\n\nParticipant: ${app.participantId}\nApplied: ${new Date(app.appliedAt).toLocaleString()}\n\n${responseText}`,
                              );
                            }}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            View Full
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {isEditing && formData ? (
              <div className="space-y-6 border border-gray-200 rounded-md p-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Cover Photo URL
                  </label>
                  <input
                    type="text"
                    value={formData.coverPhoto || ""}
                    onChange={(e) =>
                      handleInputChange("coverPhoto", e.target.value)
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Event Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Organization
                  </label>
                  <input
                    type="text"
                    value={formData.organization || ""}
                    onChange={(e) =>
                      handleInputChange("organization", e.target.value)
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    About
                  </label>

                  <QuillEditor
                    value={formData.about}
                    onChange={(html) => handleInputChange("about", html)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Participant Limit
                    </label>
                    <input
                      type="number"
                      value={formData.participantLimit || ""}
                      onChange={(e) =>
                        handleInputChange(
                          "participantLimit",
                          parseInt(e.target.value),
                        )
                      }
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Mode
                    </label>
                    <input
                      type="text"
                      value={formData.mode || ""}
                      onChange={(e) =>
                        handleInputChange("mode", e.target.value)
                      }
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Venue
                  </label>
                  <input
                    type="text"
                    value={formData.venue || ""}
                    onChange={(e) => handleInputChange("venue", e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={formData.dateStart || ""}
                      onChange={(e) =>
                        handleInputChange("dateStart", e.target.value)
                      }
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={formData.dateEnd || ""}
                      onChange={(e) =>
                        handleInputChange("dateEnd", e.target.value)
                      }
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={formData.timeStart || ""}
                      onChange={(e) =>
                        handleInputChange("timeStart", e.target.value)
                      }
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={formData.timeEnd || ""}
                      onChange={(e) =>
                        handleInputChange("timeEnd", e.target.value)
                      }
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Registration Deadline
                  </label>
                  <input
                    type="datetime-local"
                    value={
                      formData.registrationDeadline
                        ? new Date(formData.registrationDeadline)
                            .toISOString()
                            .slice(0, 16)
                        : ""
                    }
                    onChange={(e) =>
                      handleInputChange("registrationDeadline", e.target.value)
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Category
                    </label>
                    <input
                      type="text"
                      value={formData.category || ""}
                      onChange={(e) =>
                        handleInputChange("category", e.target.value)
                      }
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Fee
                    </label>
                    <input
                      type="number"
                      value={formData.fee || ""}
                      onChange={(e) =>
                        handleInputChange("fee", parseInt(e.target.value))
                      }
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Judging Criteria
                  </label>
                  {formData.judgingCriteria?.map((criteria, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={criteria}
                        onChange={(e) =>
                          handleArrayChange(
                            "judgingCriteria",
                            index,
                            e.target.value,
                          )
                        }
                        className="flex-1 border border-gray-300 rounded-md px-3 py-2"
                      />
                      <button
                        onClick={() =>
                          removeArrayItem("judgingCriteria", index)
                        }
                        className="px-3 py-2 bg-red-500 text-white rounded-md"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => addArrayItem("judgingCriteria")}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md mt-2"
                  >
                    Add Criteria
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Prize Pool
                  </label>
                  {formData.prizePool?.map((prize, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={prize}
                        onChange={(e) =>
                          handleArrayChange("prizePool", index, e.target.value)
                        }
                        className="flex-1 border border-gray-300 rounded-md px-3 py-2"
                      />
                      <button
                        onClick={() => removeArrayItem("prizePool", index)}
                        className="px-3 py-2 bg-red-500 text-white rounded-md"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => addArrayItem("prizePool")}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md mt-2"
                  >
                    Add Prize
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Custom Questions
                  </label>
                  {formData.customQuestions?.map((question, index) => (
                    <div
                      key={index}
                      className="border border-gray-300 rounded-md p-4 mb-4"
                    >
                      <div className="space-y-3">
                        <input
                          type="text"
                          placeholder="Question"
                          value={question.question}
                          onChange={(e) =>
                            handleCustomQuestionChange(
                              index,
                              "question",
                              e.target.value,
                            )
                          }
                          className="w-full border border-gray-300 rounded-md px-3 py-2"
                        />
                        <select
                          value={question.type}
                          onChange={(e) =>
                            handleCustomQuestionChange(
                              index,
                              "type",
                              e.target.value,
                            )
                          }
                          className="w-full border border-gray-300 rounded-md px-3 py-2"
                        >
                          <option value="text">Text</option>
                          <option value="number">Number</option>
                          <option value="mcq">MCQ</option>
                        </select>
                        {question.type === "mcq" && (
                          <div>
                            <label className="block text-xs font-medium mb-1">
                              Options (comma separated)
                            </label>
                            <input
                              type="text"
                              value={question.options?.join(", ") || ""}
                              onChange={(e) =>
                                handleCustomQuestionChange(
                                  index,
                                  "options",
                                  e.target.value
                                    .split(",")
                                    .map((s) => s.trim()),
                                )
                              }
                              className="w-full border border-gray-300 rounded-md px-3 py-2"
                            />
                          </div>
                        )}
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={question.required}
                            onChange={(e) =>
                              handleCustomQuestionChange(
                                index,
                                "required",
                                e.target.checked,
                              )
                            }
                          />
                          <span className="text-sm">Required</span>
                        </label>
                        <button
                          onClick={() => removeCustomQuestion(index)}
                          className="px-3 py-1 bg-red-500 text-white rounded-md text-sm"
                        >
                          Remove Question
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={addCustomQuestion}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md mt-2"
                  >
                    Add Question
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6 border border-gray-200 rounded-md p-6">
                {competition.coverPhoto && (
                  <img
                    src={competition.coverPhoto}
                    alt={competition.name}
                    className="rounded-md shadow-md w-full"
                  />
                )}

                <div>
                  <h2 className="text-2xl font-semibold mb-2">
                    {competition.name}
                  </h2>
                  {competition.organization && (
                    <p className="text-gray-600">
                      <strong>Organization:</strong> {competition.organization}
                    </p>
                  )}
                </div>

                <div>
                  <h3 className="font-semibold mb-2">About</h3>
                  <p
                    className="text-gray-600 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: competition.about }}
                  ></p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Participant Limit:</strong>{" "}
                    {competition.participantLimit}
                  </div>
                  <div>
                    <strong>Mode:</strong> {competition.mode}
                  </div>
                  {competition.venue && (
                    <div>
                      <strong>Venue:</strong> {competition.venue}
                    </div>
                  )}
                  <div>
                    <strong>Date:</strong>{" "}
                    {new Date(competition.dateStart).toLocaleDateString()} –{" "}
                    {new Date(competition.dateEnd).toLocaleDateString()}
                  </div>
                  <div>
                    <strong>Time:</strong> {competition.timeStart} –{" "}
                    {competition.timeEnd}
                  </div>
                  <div>
                    <strong>Registration Deadline:</strong>{" "}
                    {new Date(
                      competition.registrationDeadline,
                    ).toLocaleString()}
                  </div>
                  <div>
                    <strong>Category:</strong> {competition.category}
                  </div>
                  <div>
                    <strong>Fee:</strong>{" "}
                    {competition.fee ? `₹${competition.fee}` : "Free"}
                  </div>
                  <div>
                    <strong>Participants:</strong>{" "}
                    {competition.participants?.length || 0}
                  </div>
                </div>

                {competition.judgingCriteria &&
                  competition.judgingCriteria.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">Judging Criteria</h3>
                      <ul className="list-disc list-inside text-gray-600">
                        {competition.judgingCriteria.map((criteria, index) => (
                          <li key={index}>{criteria}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                {competition.prizePool && competition.prizePool.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Prize Pool</h3>
                    <ul className="list-disc list-inside text-gray-600">
                      {competition.prizePool.map((prize, index) => (
                        <li key={index}>{prize}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {competition.customQuestions &&
                  competition.customQuestions.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">Custom Questions</h3>
                      <div className="space-y-3">
                        {competition.customQuestions.map((question, index) => (
                          <div
                            key={index}
                            className="border border-gray-200 rounded-md p-3"
                          >
                            <p className="font-medium">
                              {index + 1}. {question.question}{" "}
                              {question.required && (
                                <span className="text-red-500">*</span>
                              )}
                            </p>
                            <p className="text-sm text-gray-500">
                              Type: {question.type}
                            </p>
                            {question.type === "mcq" && question.options && (
                              <ul className="text-sm text-gray-600 list-disc list-inside ml-4">
                                {question.options.map((option, idx) => (
                                  <li key={idx}>{option}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            )}
          </div>
        )}
      </main>

      <Navigation />
      <Footer />
    </>
  );
}
