import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AssignmentIcon from "@mui/icons-material/Assignment";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

export default function ViewJournal() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [entry, setEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchEntry = async () => {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("token");
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_NODE_API}/api/entry/${id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setEntry(res.data.entry);
      } catch (err) {
        setError("Failed to fetch journal entry.");
      }
      setLoading(false);
    };
    fetchEntry();
  }, [id]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F1F8E8] via-[#95D2B3] to-[#EAF7F3]">
      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Back Button */}
        <div className="mb-6">
          <button
            onClick={() => navigate("/journal-logs")}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-[#55AD9B] to-[#3e8e7e] text-white font-semibold shadow hover:from-[#3e8e7e] hover:to-[#55AD9B] transition"
          >
            <ArrowBackIcon fontSize="small" />
            Back to Journal Logs
          </button>
        </div>

        <h2 className="text-2xl font-bold mb-8 text-[#1b5f52] text-center">
          My Latest Journal Entry
        </h2>

        {loading && (
          <div className="bg-white rounded-2xl p-8 border-2 border-[#E6F4EA] shadow-md text-center text-gray-500">
            Loading...
          </div>
        )}
        {error && (
          <div className="bg-white rounded-2xl p-8 border-2 border-[#FFD6E0] shadow-md text-center text-red-500">
            {error}
          </div>
        )}
        {!loading && entry && (
          <div className="bg-white rounded-2xl p-8 border-2 border-[#D8EFD3] shadow-md space-y-6">
            {/* Success Banner */}
            <div className="bg-gradient-to-r from-[#55AD9B] to-[#3e8e7e] rounded-2xl p-6 shadow text-white flex items-center gap-4 mb-4">
              <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
                <CheckCircleIcon style={{ fontSize: 28 }} />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-1">Entry Saved Successfully!</h3>
                <p className="text-white/90 text-base">
                  Your journal entry has been recorded.
                </p>
              </div>
            </div>

            {/* Entry Card */}
            <div className="flex items-start gap-4 mb-4">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#55AD9B]/10 to-[#95D2B3]/10 flex items-center justify-center border-2 border-[#55AD9B]/30">
                <AssignmentIcon style={{ color: "#55AD9B", fontSize: 26 }} />
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap gap-2 mb-2">
                  {entry.challenges.map((challenge) => (
                    <span
                      key={challenge}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#55AD9B]/10 text-[#1b5f52] border border-[#55AD9B]/30 text-sm font-semibold"
                    >
                      {challenge}
                    </span>
                  ))}
                </div>
                <div className="text-[#272829] text-lg leading-relaxed whitespace-pre-line mb-2">
                  {entry.content}
                </div>
                <div className="text-xs text-gray-400 text-right">
                  {new Date(entry.date).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Note */}
        <div className="mt-8 text-center">
          <p className="text-[#6b7280] text-md leading-relaxed">
            Journaling regularly helps you reflect, grow, and build a mindful habit.
          </p>
        </div>
      </div>
    </div>
  );
}