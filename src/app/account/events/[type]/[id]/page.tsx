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
import Link from "next/link";
import { Activity, DollarSign, Building, Users } from "lucide-react";

interface Competition {
  _id: string;
  coverPhoto: string;
  owner: string;
  name: string;
  organization: string;
  about: string;
  participantLimit?: number;
  mode?: string;
  venue?: string;
  dateStart: string;
  dateEnd: string;
  timeStart?: string;
  timeEnd?: string;
  registrationDeadline?: Date;
  category: string;
  fee?: number;
  judgingCriteria?: string[];
  prizePool: string[];
  customQuestions?: Array<{
    _id: string;
    editorId?: string;
    question: string;
    type: string;
    options: string[];
    required: boolean;
  }>;
  participants: string[];
  competitions?: string[];
  isSuperEvent?: boolean;
  bankDetails?: {
    accountNumber: string;
    ifsc: string;
    holderName: string;
  };
  bankVerificationStatus?: string;
}

interface Application {
  _id: string;
  competitionId: string;
  participantId: string;
  responses: Array<{
    questionId: string;
    answer: string | number | boolean | string[] | Record<string, unknown> | null;
  }>;
  appliedAt: Date;
}

export default function EventDetailsPage() {
  const QuillEditor = dynamic(() => import("@/components/TestEditor"), {
    ssr: false,
  });
  const router = useRouter();
  const params = useParams();
  const type = params.type as string;
  const id = params.id as string;
  const isSuperEvent = type === 'super';
  
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [subEvents, setSubEvents] = useState<Competition[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [formData, setFormData] = useState<Competition | null>(null);
  const [showApplications, setShowApplications] = useState<boolean>(false);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loadingApplications, setLoadingApplications] = useState<boolean>(false);
  const [selectedSubEventId, setSelectedSubEventId] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'details' | 'applications' | 'analytics' | 'payments' | 'bank'>('details');
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);

  async function fetchAnalytics() {
    try {
      const token = await getFirebaseToken();
      const res = await axios.get(`/api/competitions/${id}/analytics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setAnalyticsData(res.data.data);
        setPayments(res.data.data.payments || []);
      }
    } catch (error) {
      console.error(error);
    }
  }

  async function handleRefund(txnid: string, amount: number, paymentId: string, payuId: string) {
    if (!confirm(`Are you sure you want to refund ₹${amount}?`)) return;
    try {
       const res = await axios.post('/api/payu/refund', { txnid, amount, paymentId, payuId });
       if (res.data.success) {
           alert("Refund successful");
           fetchAnalytics(); 
       } else {
           alert("Refund failed: " + res.data.error);
       }
    } catch (e: any) {
       console.error(e);
       alert("Refund failed");
    }
  }

  async function verifyBank(e: React.FormEvent) {
    e.preventDefault();
    if (!formData?.bankDetails?.accountNumber || !formData?.bankDetails?.ifsc) {
        alert("Enter required details");
        return;
    }
    try {
       const res = await axios.post('/api/payu/verify-bank', {
           competitionId: id,
           ...formData.bankDetails
       });
       if (res.data.success) {
           alert("Bank Verified!");
           fetchCompetition(); 
       }
    } catch (e) {
        alert("Bank Verification Failed.");
    }
  }

  function createEditorId() {
    return `question-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }

  function normalizeCompetitionData(data: Competition): Competition {
    return {
      ...data,
      customQuestions: data.customQuestions?.map((question) => ({
        ...question,
        editorId: question.editorId || question._id || createEditorId(),
      })),
    };
  }

  function formatDateTimeLocal(value?: Date | string) {
    if (!value) return "";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  function formatResponseAnswer(
    answer: Application["responses"][number]["answer"],
  ) {
    if (answer === null) return "No response";
    if (typeof answer === "object") return JSON.stringify(answer);
    return String(answer);
  }

  useEffect(() => {
    let redirectTimer: ReturnType<typeof setTimeout> | undefined;

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user?.email) {
        fetchCompetition();
        return;
      } else {
        redirectTimer = setTimeout(() => {
          router.replace("/auth/login");
        }, 1500);
      }
    });
    return () => {
      unsubscribe();
      if (redirectTimer) {
        clearTimeout(redirectTimer);
      }
    };
  }, [id, type, router]);

  async function fetchCompetition() {
    try {
      const token = await getFirebaseToken();
      
      if (isSuperEvent) {
        const res = await axios.get(`/api/supercompetitions/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.data.success) {
          const normalizedData = normalizeCompetitionData(res.data.data);
          setCompetition(normalizedData);
          setFormData(normalizedData);
          
          if (normalizedData.competitions && normalizedData.competitions.length > 0) {
            const subEventsPromises = normalizedData.competitions.map((compId: string) =>
              axios.get(`/api/competitions/${compId}`, {
                headers: { Authorization: `Bearer ${token}` },
              })
            );
            const subEventsResults = await Promise.all(subEventsPromises);
            setSubEvents(subEventsResults.map(r => r.data.data));
          }
        }
      } else {
        const res = await axios.get(`/api/competitions/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.data.success) {
          const normalizedData = normalizeCompetitionData(res.data.data);
          setCompetition(normalizedData);
          setFormData(normalizedData);
        }
      }
    } catch (error) {
      console.error("Failed to fetch competition:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchApplications(competitionId?: string) {
    setLoadingApplications(true);
    try {
      const token = await getFirebaseToken();
      const targetId = competitionId || id;
      const res = await axios.get(`/api/competitions/${targetId}/applications`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.data.success) {
        setApplications(res.data.data);
        setShowApplications(true);
        setActiveTab('applications');
        setSelectedSubEventId(competitionId || null);
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
      const sanitizedFormData = formData
        ? {
            ...formData,
            customQuestions: formData.customQuestions?.map((question) => ({
              _id: question._id,
              question: question.question,
              type: question.type,
              options: question.options,
              required: question.required,
            })),
          }
        : formData;
      
      if (isSuperEvent) {
        const res = await axios.put(
          `/api/supercompetitions/${id}`,
          {
            isAdmin: true,
            updates: sanitizedFormData,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
        if (res.data.success) {
          setCompetition(normalizeCompetitionData(res.data.data));
          setIsEditing(false);
          alert("Super Competition updated successfully!");
        }
      } else {
        const res = await axios.put(
          `/api/competitions/${id}`,
          {
            isAdmin: true,
            updates: sanitizedFormData,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
        if (res.data.success) {
          setCompetition(normalizeCompetitionData(res.data.data));
          setIsEditing(false);
          alert("Competition updated successfully!");
        }
      }
    } catch (error) {
      console.error("Failed to update competition:", error);
      alert("Failed to update competition");
    }
  }

  function handleInputChange(
    field: string,
    value: string | number | boolean,
  ) {
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
    value: string | boolean | string[],
  ) {
    if (formData && formData.customQuestions) {
      const questions = [...formData.customQuestions];
      questions[index] = { ...questions[index], [field]: value };
      setFormData({ ...formData, customQuestions: questions });
    }
  }

  function addCustomQuestion() {
    if (formData) {
      const questions = [...(formData.customQuestions || [])];
      questions.push({
        _id: "",
        editorId: createEditorId(),
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
  if (!competition) return <p className="text-center mt-12">Event not found.</p>;

  const getSelectedEventForApplications = () => {
    if (!selectedSubEventId) return competition;
    return subEvents.find(e => e._id === selectedSubEventId) || competition;
  };

  return (
    <>
      <Header />

      <main className="max-w-6xl mx-auto px-4 py-12 min-h-[85vh]">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-semibold">Event Details</h1>
            {isSuperEvent && (
              <span className="inline-block px-3 py-1 text-xs font-semibold text-blue-700 bg-blue-100 rounded-full mt-2">
                Super Competition
              </span>
            )}
          </div>
          <div className="space-x-2">
            {!isEditing && (
              <>
                <button
                  onClick={() => { setActiveTab('details'); setShowApplications(false); }}
                  className={`px-4 py-2 ${activeTab === 'details' ? 'bg-gray-800 text-white' : 'bg-gray-200'} rounded-md text-sm font-medium`}
                >
                  Details
                </button>
                {!isSuperEvent && (
                  <button
                    onClick={() => fetchApplications()}
                    disabled={loadingApplications}
                    className={`px-4 py-2 ${activeTab === 'applications' ? 'bg-blue-600 text-white' : 'bg-gray-200'} rounded-md text-sm font-medium`}
                  >
                    Applications
                  </button>
                )}
                {!isSuperEvent && (
                  <button
                    onClick={() => { setActiveTab('analytics'); fetchAnalytics(); }}
                    className={`px-4 py-2 ${activeTab === 'analytics' ? 'bg-purple-600 text-white' : 'bg-gray-200'} rounded-md text-sm font-medium`}
                  >
                    Analytics
                  </button>
                )}
                {!isSuperEvent && (
                  <button
                    onClick={() => { setActiveTab('payments'); fetchAnalytics(); }}
                    className={`px-4 py-2 ${activeTab === 'payments' ? 'bg-green-600 text-white' : 'bg-gray-200'} rounded-md text-sm font-medium`}
                  >
                    Payments Collected
                  </button>
                )}
                <button
                    onClick={() => setActiveTab('bank')}
                    className={`px-4 py-2 ${activeTab === 'bank' ? 'bg-indigo-600 text-white' : 'bg-gray-200'} rounded-md text-sm font-medium`}
                >
                    Bank & Payouts
                </button>
                
                {activeTab === 'details' && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:shadow-md text-sm font-medium ml-4"
                    >
                      Edit Event
                    </button>
                )}
              </>
            )}
            {isEditing && (
              <>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:shadow-md text-sm font-medium"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setFormData(competition);
                  }}
                  className="px-4 py-2 bg-gray-500 text-white rounded-md hover:shadow-md text-sm font-medium"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>

        {showApplications ? (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold">
              Applications for {getSelectedEventForApplications()?.name} ({applications.length})
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
                      {getSelectedEventForApplications()?.customQuestions?.map((question, idx) => (
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
                        {getSelectedEventForApplications()?.customQuestions?.map((question, qIdx) => {
                          const response = app.responses?.find(
                            (r) => r.questionId === question._id,
                          );
                          return (
                            <td
                              key={qIdx}
                              className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate"
                              title={
                                response
                                  ? formatResponseAnswer(response.answer)
                                  : "No response"
                              }
                            >
                              {response ? (
                                formatResponseAnswer(response.answer)
                              ) : (
                                <span className="text-gray-400 italic">No response</span>
                              )}
                            </td>
                          );
                        })}
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => {
                              const responseText = app.responses
                                ?.map((r) => {
                                  const q = getSelectedEventForApplications()?.customQuestions?.find(
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
        ) : activeTab === 'analytics' ? (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold">Analytics</h2>
            {!analyticsData ? (
                <p>Loading analytics...</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition flex items-center gap-4">
                        <div className="p-4 bg-purple-100 rounded-full text-purple-600">
                            <Activity size={32} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Total Applications</p>
                            <p className="text-3xl font-bold">{analyticsData.totalApplications}</p>
                        </div>
                    </div>
                    <div className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition flex items-center gap-4">
                        <div className="p-4 bg-green-100 rounded-full text-green-600">
                            <DollarSign size={32} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Total Revenue Collected</p>
                            <p className="text-3xl font-bold">₹{analyticsData.totalCollected}</p>
                        </div>
                    </div>
                </div>
            )}
          </div>
        ) : activeTab === 'payments' ? (
           <div className="space-y-6">
             <h2 className="text-2xl font-semibold">Payments Collected ({payments.length})</h2>
             {payments.length === 0 ? (
                 <p className="text-gray-600">No payments collected yet.</p>
             ) : (
                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Participant</th>
                                <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Txn ID</th>
                                <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                           {payments.map((p) => (
                               <tr key={p._id}>
                                   <td className="px-6 py-4">{new Date(p.appliedAt).toLocaleDateString()}</td>
                                   <td className="px-6 py-4">{p.participantId}</td>
                                   <td className="px-6 py-4">{p.txnid}</td>
                                   <td className="px-6 py-4 font-semibold text-green-600">₹{p.amount}</td>
                                   <td className="px-6 py-4">
                                        <span className={`px-2 py-1 text-xs rounded-full ${p.status === 'success' ? 'bg-green-100 text-green-800' : p.status === 'refunded' ? 'bg-orange-100 text-orange-800' : 'bg-red-100 text-red-800'}`}>
                                            {p.status}
                                        </span>
                                   </td>
                                   <td className="px-6 py-4">
                                        {p.status === 'success' && (
                                            <button 
                                                onClick={() => handleRefund(p.txnid, p.amount, p._id, p.payuId)}
                                                className="text-red-600 hover:text-red-800 underline"
                                            >
                                                Issue Refund
                                            </button>
                                        )}
                                   </td>
                               </tr>
                           ))}
                        </tbody>
                    </table>
                </div>
             )}
           </div>
        ) : activeTab === 'bank' ? (
           <div className="space-y-6 max-w-2xl">
             <h2 className="text-2xl font-semibold">Bank Verification & Payouts</h2>
             <div className="p-6 border border-gray-200 rounded-lg bg-gray-50 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium flex items-center gap-2"><Building size={20} className="text-gray-600"/> Payout Settings</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${competition.bankVerificationStatus === 'verified' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {competition.bankVerificationStatus?.toUpperCase() || 'PENDING'}
                    </span>
                </div>
                <p className="text-sm text-gray-600 mb-6">Enter your bank details to allow Kavyalok to dispatch collected payments to your account securely via PayU.</p>
                
                <form onSubmit={verifyBank} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Account Holder Name</label>
                        <input 
                            type="text" 
                            required
                            disabled={competition.bankVerificationStatus === 'verified'}
                            value={formData?.bankDetails?.holderName || ''}
                            onChange={(e) => setFormData(prev => prev ? ({ ...prev, bankDetails: { ...(prev.bankDetails as any), holderName: e.target.value }}) : prev)}
                            className="w-full border border-gray-300 rounded px-3 py-2 disabled:bg-gray-100"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Bank Account Number</label>
                        <input 
                            type="password" 
                            required
                            disabled={competition.bankVerificationStatus === 'verified'}
                            placeholder="********"
                            value={formData?.bankDetails?.accountNumber || ''}
                            onChange={(e) => setFormData(prev => prev ? ({ ...prev, bankDetails: { ...(prev.bankDetails as any), accountNumber: e.target.value }}) : prev)}
                            className="w-full border border-gray-300 rounded px-3 py-2 disabled:bg-gray-100"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">IFSC Code</label>
                        <input 
                            type="text" 
                            required
                            disabled={competition.bankVerificationStatus === 'verified'}
                            value={formData?.bankDetails?.ifsc || ''}
                            onChange={(e) => setFormData(prev => prev ? ({ ...prev, bankDetails: { ...(prev.bankDetails as any), ifsc: e.target.value }}) : prev)}
                            className="w-full border border-gray-300 rounded px-3 py-2 disabled:bg-gray-100"
                        />
                    </div>
                    
                    {competition.bankVerificationStatus !== 'verified' && (
                        <button type="submit" className="w-full py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition">
                            Verify Bank Details securely with PayU
                        </button>
                    )}
                </form>
             </div>
           </div>
        ) : (
          <div className="space-y-6">
            {isEditing && formData ? (
              <div className="space-y-6 border border-gray-200 rounded-md p-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Cover Photo URL</label>
                  <input
                    type="text"
                    value={formData.coverPhoto || ""}
                    onChange={(e) => handleInputChange("coverPhoto", e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Event Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Organization</label>
                  <input
                    type="text"
                    value={formData.organization || ""}
                    onChange={(e) => handleInputChange("organization", e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">About</label>
                  <QuillEditor
                    value={formData.about}
                    onChange={(html) => handleInputChange("about", html)}
                  />
                </div>

                {!isSuperEvent && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Participant Limit</label>
                        <input
                          type="number"
                          value={formData.participantLimit || ""}
                          onChange={(e) =>
                            handleInputChange("participantLimit", parseInt(e.target.value))
                          }
                          className="w-full border border-gray-300 rounded-md px-3 py-2"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Mode</label>
                        <input
                          type="text"
                          value={formData.mode || ""}
                          onChange={(e) => handleInputChange("mode", e.target.value)}
                          className="w-full border border-gray-300 rounded-md px-3 py-2"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Venue</label>
                      <input
                        type="text"
                        value={formData.venue || ""}
                        onChange={(e) => handleInputChange("venue", e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                  </>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Start Date</label>
                    <input
                      type="date"
                      value={formData.dateStart || ""}
                      onChange={(e) => handleInputChange("dateStart", e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">End Date</label>
                    <input
                      type="date"
                      value={formData.dateEnd || ""}
                      onChange={(e) => handleInputChange("dateEnd", e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                </div>

                {!isSuperEvent && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Start Time</label>
                      <input
                        type="time"
                        value={formData.timeStart || ""}
                        onChange={(e) => handleInputChange("timeStart", e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">End Time</label>
                      <input
                        type="time"
                        value={formData.timeEnd || ""}
                        onChange={(e) => handleInputChange("timeEnd", e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-2">Registration Deadline</label>
                  <input
                    type="datetime-local"
                    value={
                      formData.registrationDeadline
                        ? formatDateTimeLocal(formData.registrationDeadline)
                        : ""
                    }
                    onChange={(e) => handleInputChange("registrationDeadline", e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Category</label>
                    <input
                      type="text"
                      value={formData.category || ""}
                      onChange={(e) => handleInputChange("category", e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>

                  {!isSuperEvent && (
                    <div>
                      <label className="block text-sm font-medium mb-2">Fee</label>
                      <input
                        type="number"
                        value={formData.fee || ""}
                        onChange={(e) => handleInputChange("fee", parseInt(e.target.value))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                  )}
                </div>

                {!isSuperEvent && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Judging Criteria</label>
                    {formData.judgingCriteria?.map((criteria, index) => (
                      <div key={index} className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={criteria}
                          onChange={(e) =>
                            handleArrayChange("judgingCriteria", index, e.target.value)
                          }
                          className="flex-1 border border-gray-300 rounded-md px-3 py-2"
                        />
                        <button
                          onClick={() => removeArrayItem("judgingCriteria", index)}
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
                )}

                <div>
                  <label className="block text-sm font-medium mb-2">Prize Pool</label>
                  {formData.prizePool?.map((prize, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={prize}
                        onChange={(e) => handleArrayChange("prizePool", index, e.target.value)}
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

                {!isSuperEvent && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Custom Questions</label>
                    {formData.customQuestions?.map((question, index) => (
                      <div
                        key={question.editorId || question._id || index}
                        className="border border-gray-300 rounded-md p-4 mb-4"
                      >
                        <div className="space-y-3">
                          <input
                            type="text"
                            placeholder="Question"
                            value={question.question}
                            onChange={(e) =>
                              handleCustomQuestionChange(index, "question", e.target.value)
                            }
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                          />
                          <select
                            value={question.type}
                            onChange={(e) =>
                              handleCustomQuestionChange(index, "type", e.target.value)
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
                                    e.target.value.split(",").map((s) => s.trim()),
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
                                handleCustomQuestionChange(index, "required", e.target.checked)
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
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="border border-gray-200 rounded-md p-6">
                  {competition.coverPhoto && (
                    <img
                      src={competition.coverPhoto}
                      alt={competition.name}
                      className="rounded-md shadow-md w-full mb-6"
                    />
                  )}

                  <div>
                    <h2 className="text-2xl font-semibold mb-2">{competition.name}</h2>
                    {competition.organization && (
                      <p className="text-gray-600">
                        <strong>Organization:</strong> {competition.organization}
                      </p>
                    )}
                  </div>

                  <div className="mt-6">
                    <h3 className="font-semibold mb-2">About</h3>
                    <p
                      className="text-gray-600 leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: competition.about }}
                    ></p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mt-6">
                    {!isSuperEvent && (
                      <>
                        <div>
                          <strong>Participant Limit:</strong> {competition.participantLimit}
                        </div>
                        <div>
                          <strong>Mode:</strong> {competition.mode}
                        </div>
                        {competition.venue && (
                          <div>
                            <strong>Venue:</strong> {competition.venue}
                          </div>
                        )}
                      </>
                    )}
                    <div>
                      <strong>Date:</strong>{" "}
                      {new Date(competition.dateStart).toLocaleDateString()} –{" "}
                      {new Date(competition.dateEnd).toLocaleDateString()}
                    </div>
                    {!isSuperEvent && (
                      <>
                        <div>
                          <strong>Time:</strong> {competition.timeStart} – {competition.timeEnd}
                        </div>
                        <div>
                          <strong>Fee:</strong> {competition.fee ? `₹${competition.fee}` : "Free"}
                        </div>
                      </>
                    )}
                    {competition.registrationDeadline && (
                      <div>
                        <strong>Registration Deadline:</strong>{" "}
                        {new Date(competition.registrationDeadline).toLocaleString()}
                      </div>
                    )}
                    <div>
                      <strong>Category:</strong> {competition.category}
                    </div>
                    <div>
                      <strong>Participants:</strong> {competition.participants?.length || 0}
                    </div>
                    {isSuperEvent && (
                      <div>
                        <strong>Sub-Events:</strong> {subEvents.length}
                      </div>
                    )}
                  </div>

                  {!isSuperEvent && competition.judgingCriteria && competition.judgingCriteria.length > 0 && (
                    <div className="mt-6">
                      <h3 className="font-semibold mb-2">Judging Criteria</h3>
                      <ul className="list-disc list-inside text-gray-600">
                        {competition.judgingCriteria.map((criteria, index) => (
                          <li key={index}>{criteria}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {competition.prizePool && competition.prizePool.length > 0 && (
                    <div className="mt-6">
                      <h3 className="font-semibold mb-2">Prize Pool</h3>
                      <ul className="list-disc list-inside text-gray-600">
                        {competition.prizePool.map((prize, index) => (
                          <li key={index}>{prize}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {!isSuperEvent && competition.customQuestions && competition.customQuestions.length > 0 && (
                    <div className="mt-6">
                      <h3 className="font-semibold mb-2">Custom Questions</h3>
                      <div className="space-y-3">
                        {competition.customQuestions.map((question, index) => (
                          <div key={index} className="border border-gray-200 rounded-md p-3">
                            <p className="font-medium">
                              {index + 1}. {question.question}{" "}
                              {question.required && <span className="text-red-500">*</span>}
                            </p>
                            <p className="text-sm text-gray-500">Type: {question.type}</p>
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

                {isSuperEvent && subEvents.length > 0 && (
                  <div className="mt-8">
                    <h2 className="text-2xl font-semibold mb-4">Sub-Events ({subEvents.length})</h2>
                    <div className="space-y-4">
                      {subEvents.map((subEvent, index) => (
                        <div key={subEvent._id} className="border border-gray-200 rounded-md p-4 hover:shadow-md transition">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <span className="inline-block px-2 py-1 text-xs font-semibold text-gray-700 bg-gray-100 rounded">
                                  Sub-Event {index + 1}
                                </span>
                                <h3 className="text-xl font-semibold">{subEvent.name}</h3>
                              </div>

                              {subEvent.coverPhoto && (
                                <img
                                  src={subEvent.coverPhoto}
                                  alt={subEvent.name}
                                  className="rounded-md shadow-sm w-full h-48 object-cover mb-3"
                                />
                              )}

                              <p
                                className="text-gray-600 leading-relaxed mb-3"
                                dangerouslySetInnerHTML={{
                                  __html:
                                    subEvent.about?.slice(0, 150) +
                                    (subEvent.about?.length > 150 ? "..." : ""),
                                }}
                              ></p>

                              <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
                                {subEvent.mode && (
                                  <div>
                                    <strong>Mode:</strong> {subEvent.mode}
                                  </div>
                                )}
                                {subEvent.venue && (
                                  <div>
                                    <strong>Venue:</strong> {subEvent.venue}
                                  </div>
                                )}
                                <div>
                                  <strong>Date:</strong>{" "}
                                  {new Date(subEvent.dateStart).toLocaleDateString()}
                                </div>
                                {subEvent.timeStart && (
                                  <div>
                                    <strong>Time:</strong> {subEvent.timeStart}
                                  </div>
                                )}
                                {subEvent.fee !== undefined && (
                                  <div>
                                    <strong>Fee:</strong> {subEvent.fee ? `₹${subEvent.fee}` : "Free"}
                                  </div>
                                )}
                                <div>
                                  <strong>Participants:</strong> {subEvent.participants?.length || 0}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 flex gap-2">
                            <button
                              onClick={() => fetchApplications(subEvent._id)}
                              disabled={loadingApplications}
                              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:shadow-md disabled:opacity-50 text-sm"
                            >
                              View Applications
                            </button>
                            <Link
                              href={`/account/events/regular/${subEvent._id}`}
                              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:shadow-md text-sm inline-block"
                            >
                              View Full Details
                            </Link>
                          </div>
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
