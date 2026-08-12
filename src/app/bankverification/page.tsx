'use client';

import { useState } from "react";
import { Loader2, KeyRound, AlertCircle, Copy, Check } from "lucide-react";

export default function BankVerification() {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState<number | null>(null);

  const handleGetToken = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);
    setStatus(null);

    try {
      const res = await fetch("/api/bankverification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      setStatus(res.status);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || data.message || `Request failed with status ${res.status}`);
        setResponse(data);
      } else {
        setResponse(data);
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred while calling /api/bankverification");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (response) {
      navigator.clipboard.writeText(JSON.stringify(response, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-2xl bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center space-x-3 mb-6 border-b border-slate-800 pb-4">
          <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400 border border-amber-500/20">
            <KeyRound className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Bank Verification</h1>
            <p className="text-sm text-slate-400">Call PayU OAuth authentication endpoint via API route</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-800/40 p-4 rounded-xl border border-slate-800">
            <div className="text-sm text-slate-300">
              <span className="font-mono text-xs px-2 py-1 bg-slate-800 rounded border border-slate-700 text-amber-300 mr-2">POST</span>
              <span className="font-mono text-slate-400">/api/bankverification</span>
            </div>
            
            <button
              onClick={handleGetToken}
              disabled={loading}
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl font-medium text-sm text-slate-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-amber-500/10 hover:shadow-amber-500/20 active:scale-95 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Fetching Token...
                </>
              ) : (
                "Get Access Token"
              )}
            </button>
          </div>

          {error && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-sm flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400 mt-0.5" />
              <div>
                <p className="font-semibold">Request Error</p>
                <p className="text-rose-300/90 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {response && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-slate-300">Response Data</span>
                  {status && (
                    <span
                      className={`text-xs px-2 py-0.5 rounded-md font-mono ${
                        status >= 200 && status < 300
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                      }`}
                    >
                      Status: {status}
                    </span>
                  )}
                </div>
                <button
                  onClick={copyToClipboard}
                  className="inline-flex items-center text-xs text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 mr-1" />
                      Copy JSON
                    </>
                  )}
                </button>
              </div>

              <div className="relative">
                <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs font-mono text-slate-200 overflow-x-auto max-h-96 leading-relaxed">
                  {JSON.stringify(response, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}