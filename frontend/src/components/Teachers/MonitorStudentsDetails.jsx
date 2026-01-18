import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Avatar, Chip, Tooltip, IconButton, CircularProgress, Button, Box, Typography, TextField, MenuItem, Modal, Fade, Backdrop, Link, Badge, Collapse
} from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import InfoIcon from '@mui/icons-material/Info';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import HistoryIcon from '@mui/icons-material/History';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import Sidebar from './Sidebar';
import { useLocation, useNavigate } from 'react-router-dom';

// Helper to parse query params
function useQuery() {
  return new URLSearchParams(useLocation().search);
}

// Helper to format week range as "January 12, 2025 - January 19, 2025"
function formatWeekRange(start, end) {
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const startDate = new Date(start);
  const endDate = new Date(end);
  const startStr = `${months[startDate.getMonth()]} ${String(startDate.getDate()).padStart(2, '0')}, ${startDate.getFullYear()}`;
  const endStr = `${months[endDate.getMonth()]} ${String(endDate.getDate()).padStart(2, '0')}, ${endDate.getFullYear()}`;
  return `${startStr} - ${endStr}`;
}

// Color coding for risk levels
const severityColors = {
  high: { bg: 'linear-gradient(90deg,#ef4444,#f87171)', color: '#fff', chip: '#ef4444' },
  moderate: { bg: 'linear-gradient(90deg,#fde68a,#fbbf24)', color: '#7c4700', chip: '#fbbf24' },
  low: { bg: 'linear-gradient(90deg,#bbf7d0,#34d399)', color: '#065f46', chip: '#34d399' },
};

// Color coding for monitoring statuses
const monitoringStatusChipColors = {
  pending_review: { background: '#b0bde9', color: '#3730a3' },
  monitoring: { background: '#f0daab', color: '#b26a00' },
  reviewed: { background: '#90d7ca', color: '#047857' },
  resolved: { background: '#b3ddb3', color: '#166534' },
};

const severityIcons = {
  high: <HelpOutlineIcon sx={{ color: '#fff', fontSize: 24, background: '#ef4444', borderRadius: '50%', p: 0.5 }} />,
  moderate: <HelpOutlineIcon sx={{ color: '#f59e42', fontSize: 24, background: '#fde68a', borderRadius: '50%', p: 0.5 }} />,
  low: <HelpOutlineIcon sx={{ color: '#34d399', fontSize: 24, background: '#87daa4', borderRadius: '50%', p: 0.5 }} />,
};

const severityLabels = {
  high: 'High Risk',
  moderate: 'Moderate Risk',
  low: 'Low Risk',
};

const monitoringStatusLabels = {
  pending_review: 'Pending Review',
  monitoring: 'Monitoring',
  reviewed: 'Reviewed',
  resolved: 'Resolved',
};

const monitoringStatusOptions = [
  { value: 'pending_review', label: 'Pending Review' },
  { value: 'monitoring', label: 'Monitoring' },
  { value: 'reviewed', label: 'Reviewed' },
  { value: 'resolved', label: 'Resolved' },
];

// Modal for status history
function StatusHistoryModal({ open, onClose, studentId, sectionId }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(
          `${import.meta.env.VITE_NODE_API}/api/teacher/severity-status-history?studentId=${studentId}&sectionId=${encodeURIComponent(sectionId)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setHistory(res.data.data || []);
      } catch {
        setHistory([]);
      }
      setLoading(false);
    };
    fetchHistory();
  }, [studentId, sectionId, open]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      closeAfterTransition
      slots={{ backdrop: Backdrop }}
      slotProps={{ backdrop: { timeout: 300 } }}
    >
      <Fade in={open}>
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 420,
          bgcolor: 'background.paper',
          borderRadius: 3,
          boxShadow: 24,
          p: 4,
          outline: 'none',
        }}>
          <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <HistoryIcon sx={{ color: '#55AD9B', fontSize: 28 }} />
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1F8E8E' }}>
              Status & Observation History
            </Typography>
            <IconButton size="small" onClick={onClose} sx={{ ml: 'auto' }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <CircularProgress size={24} color="success" />
            </Box>
          ) : history.length === 0 ? (
            <Typography sx={{ color: '#888', textAlign: 'center', py: 2 }}>
              No previous status or observation history.
            </Typography>
          ) : (
            <Box>
              {history.slice().reverse().map((h, i) => (
                <Box key={i} sx={{
                  mb: 2,
                  p: 2,
                  background: '#f3f4f6',
                  borderRadius: 2,
                  border: '1px solid #E0E0E0',
                  boxShadow: 1,
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip
                      label={monitoringStatusLabels[h.status] || h.status}
                      size="small"
                      sx={{
                        background: monitoringStatusChipColors[h.status]?.background || '#e0e7ff',
                        color: monitoringStatusChipColors[h.status]?.color || '#3730a3',
                        fontWeight: 700,
                        mr: 1,
                      }}
                    />
                    <span style={{ fontSize: 13, color: '#555' }}>
                      {h.updatedAt ? new Date(h.updatedAt).toLocaleString() : ''}
                      {h.updatedBy && (
                        <>
                          {' '}by <b>{h.updatedBy.firstName} {h.updatedBy.lastName}</b>
                        </>
                      )}
                    </span>
                  </Box>
                  <Box sx={{ mt: 1, fontSize: 14, color: '#444' }}>
                    {h.observation
                      ? <span><strong>Note:</strong> {h.observation}</span>
                      : <span style={{ color: '#aaa' }}>No observation for this status.</span>
                    }
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </Fade>
    </Modal>
  );
}

// --- Computation Explanation Modal ---
function ComputationInfoModal({ open, onClose }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      closeAfterTransition
      slots={{ backdrop: Backdrop }}
      slotProps={{ backdrop: { timeout: 300 } }}
    >
      <Fade in={open}>
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 650,
          bgcolor: 'background.paper',
          borderRadius: 3,
          boxShadow: 24,
          p: 0,
          outline: 'none',
        }}>
          <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', p: 4, gap: 3 }}>
            {/* Icon and Title */}
            <Box sx={{ flex: '0 0 60px', display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 1 }}>
              <HelpOutlineIcon sx={{ color: '#1F8E8E', fontSize: 38, mb: 1 }} />
            </Box>
            {/* Content */}
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 700,
                    color: '#1F8E8E',
                    fontSize: 24,
                    lineHeight: 1.2,
                    mb: 0,
                  }}
                >
                  How does the computation for the<br />severity monitoring work?
                </Typography>
                <IconButton size="small" onClick={onClose} sx={{ ml: 'auto', mt: '-8px' }}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>
              <Box sx={{ color: '#444', fontSize: 15, lineHeight: 1.7, mt: 2 }}>
                <b>Severity monitoring</b> is computed based on several factors from student mood logs:
                <ul style={{ margin: '12px 0 0 18px', padding: 0 }}>
                  <li>
                    <b>Risk Score:</b> Calculated from the frequency and intensity of negative mood logs, mood score drops, and presence of concerning keywords.
                  </li>
                  <li>
                    <b>Negative Logs:</b> The number of mood logs marked as negative within the selected week.
                  </li>
                  <li>
                    <b>Mood Score Drop:</b> The difference between the student's average mood score this week and their previous baseline.
                  </li>
                  <li>
                    <b>Concerning Keywords:</b> If a log contains flagged words (e.g., "hopeless", "anxious"), it increases risk.
                  </li>
                  <li>
                    <b>Outlier Detection:</b> If a student's mood score is a statistical outlier compared to their usual pattern, risk is increased.
                  </li>
                </ul>
                <Box sx={{ mt: 2 }}>
                  <b>Risk Levels:</b>
                  <ul style={{ margin: '8px 0 0 18px', padding: 0 }}>
                    <li>
                      <span style={{ color: '#ef4444', fontWeight: 600 }}>High Risk</span>: Very low mood scores, many negative logs, or multiple concerning keywords/outlier detected.
                    </li>
                    <li>
                      <span style={{ color: '#fbbf24', fontWeight: 600 }}>Moderate Risk</span>: Some negative logs or moderate mood drop.
                    </li>
                    <li>
                      <span style={{ color: '#34d399', fontWeight: 600 }}>Low Risk</span>: Mostly positive/neutral logs, no significant drop.
                    </li>
                  </ul>
                </Box>
                <Box sx={{ mt: 2 }}>
                  <b>Note:</b> The system uses thresholds and patterns based on your school's configuration and may be updated over time.
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      </Fade>
    </Modal>
  );
}

// Helper to group concerning reasons and count occurrences
function groupReasons(reasons) {
  const map = {};
  reasons.forEach(reason => {
    const key = reason.trim();
    if (key in map) {
      map[key]++;
    } else {
      map[key] = 1;
    }
  });
  return Object.entries(map).map(([reason, count]) => ({ reason, count }));
}

const MonitorStudentsDetails = () => {
  const query = useQuery();
  const studentId = query.get('studentId');
  const sectionId = query.get('sectionId');
  const navigate = useNavigate();

  const [severities, setSeverities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [status, setStatus] = useState('');
  const [observation, setObservation] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [expandedIdx, setExpandedIdx] = useState(0); // Show most recent by default
  const [showComputationInfo, setShowComputationInfo] = useState(false);

  useEffect(() => {
    const fetchSeverities = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        // Fetch all severity records for this student in this section
        const res = await axios.get(
          `${import.meta.env.VITE_NODE_API}/api/teacher/student-severity-all?studentId=${studentId}&sectionId=${encodeURIComponent(sectionId)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        // Sort by weekStart descending (most recent first)
        const sorted = (res.data.data || []).sort((a, b) => {
          // Prefer weekStart, fallback to lastEvaluated
          const aDate = a.weekStart ? new Date(a.weekStart) : new Date(a.lastEvaluated);
          const bDate = b.weekStart ? new Date(b.weekStart) : new Date(b.lastEvaluated);
          return bDate - aDate;
        });
        setSeverities(sorted);
        if (sorted.length) {
          setStatus(sorted[0].monitoringStatus || 'pending_review');
          setObservation(sorted[0].teacherObservation || '');
        }
      } catch {
        setSeverities([]);
      }
      setLoading(false);
    };
    if (studentId && sectionId) {
      fetchSeverities();
    }
  }, [studentId, sectionId, saving]);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${import.meta.env.VITE_NODE_API}/api/teacher/update-severity-status`,
        {
          studentId,
          sectionId,
          monitoringStatus: status,
          teacherObservation: observation
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEditMode(false);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to update status');
    }
    setSaving(false);
  };

  // Group concerning reasons for badge display
  const groupedReasons = severities[expandedIdx]?.concerningKeywords ? groupReasons(severities[expandedIdx].concerningKeywords) : [];

  return (
    <div className="w-screen min-h-screen bg-[#F7F7F7]">
      <div className="flex min-h-screen">
        <Sidebar active="monitor" />
        <div className="flex-1 ml-72 p-6">
          <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
              <IconButton
                onClick={() => navigate(-1)}
                sx={{
                  background: '#fff',
                  borderRadius: '12px',
                  boxShadow: 1,
                  mr: 2,
                  width: 40,
                  height: 40,
                  border: '1px solid #E5E7EB',
                  '&:hover': { background: '#f3f4f6' }
                }}
              >
                <ArrowBackIosNewIcon sx={{ fontSize: 22, color: '#222' }} />
              </IconButton>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  color: '#222',
                  fontSize: 32,
                  letterSpacing: '-1px'
                }}
              >
                Student Mood Logs
              </Typography>
            </div>
            {/* Computation Info Link */}
            <Box sx={{ mb: 2 }}>
              <Button
                variant="text"
                startIcon={<HelpOutlineIcon />}
                sx={{
                  color: '#1F8E8E',
                  fontWeight: 600,
                  fontSize: 16,
                  textTransform: 'none',
                  pl: 0,
                  '&:hover': { background: 'transparent', textDecoration: 'underline' }
                }}
                onClick={() => setShowComputationInfo(true)}
              >
                How does the computation for the severity monitoring work?
              </Button>
              <ComputationInfoModal open={showComputationInfo} onClose={() => setShowComputationInfo(false)} />
            </Box>
            {/* Table */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">
                        {/* Expand Button */}
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider" style={{ minWidth: 260 }}>
                        Week Duration
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">
                        Risk Level
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600 uppercase tracking-wider" style={{ minWidth: 140 }}>
                        Risk Score
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600 uppercase tracking-wider" style={{ minWidth: 140 }}>
                        Negative Logs
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600 uppercase tracking-wider" style={{ minWidth: 240 }}>
                        Mood Score Drop
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600 uppercase tracking-wider">
                        Outlier
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">
                        Monitoring Status / Notes
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {loading ? (
                      <tr>
                        <td colSpan={10}>
                          <div className="flex justify-center items-center py-32">
                            <CircularProgress color="success" />
                          </div>
                        </td>
                      </tr>
                    ) : severities.length === 0 ? (
                      <tr>
                        <td colSpan={10}>
                          <div className="flex flex-col items-center justify-center py-32">
                            <InfoIcon sx={{ fontSize: 40, color: '#55AD9B' }} />
                            <p className="text-gray-600 mt-2">No severity data found for this student.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      severities.map((student, idx) => (
                        <React.Fragment key={student._id || idx}>
                          <tr className="hover:bg-gray-50 border-b border-gray-200">
                            {/* Expand Button */}
                            <td className="px-2 py-3 text-center">
                              <IconButton onClick={() => setExpandedIdx(idx === expandedIdx ? -1 : idx)}>
                                {expandedIdx === idx ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                              </IconButton>
                            </td>
                            {/* Week Duration */}
                            <td className="px-4 py-3 whitespace-nowrap font-semibold text-[#1F8E8E]">
                              {student.weekStart && student.weekEnd
                                ? formatWeekRange(student.weekStart, student.weekEnd)
                                : (student.lastEvaluated ? new Date(student.lastEvaluated).toLocaleDateString() : 'All Time')}
                            </td>
                            {/* Student Info */}
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10">
                                  {student.studentId.avatar ? (
                                    <Avatar src={student.studentId.avatar} alt={student.studentId.firstName} sx={{ width: 40, height: 40, bgcolor: '#55AD9B', fontWeight: 700, fontSize: 20 }} />
                                  ) : (
                                    <div className="h-10 w-10 rounded-full flex items-center justify-center bg-[#6d8fd7]">
                                      <span className="text-lg font-bold text-white">
                                        {student.studentId.firstName ? student.studentId.firstName.charAt(0).toUpperCase() : '?'}
                                      </span>
                                    </div>
                                  )}
                                </div>
                                <div className="ml-3">
                                  <div className="text-base font-semibold text-gray-900">
                                    {student.studentId.firstName} {student.studentId.lastName}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {student.studentId.email}
                                  </div>
                                </div>
                              </div>
                            </td>
                            {/* Risk Level */}
                            <td className="px-4 py-3 whitespace-nowrap">
                              <Chip
                                icon={severityIcons[student.severityLevel]}
                                label={severityLabels[student.severityLevel]}
                                sx={{
                                  background: severityColors[student.severityLevel]?.bg,
                                  color: severityColors[student.severityLevel]?.color,
                                  fontWeight: 'bold',
                                  fontSize: 15,
                                  px: 2,
                                  boxShadow: 1,
                                  minWidth: 120
                                }}
                              />
                            </td>
                            {/* Risk Score */}
                            <td className="px-4 py-3 whitespace-nowrap text-center font-semibold"
                              style={{
                                color: severityColors[student.severityLevel]?.chip,
                                minWidth: 140,
                                fontSize: 18
                              }}>
                              {student.riskScore}
                            </td>
                            {/* Negative Logs */}
                            <td className="px-4 py-3 whitespace-nowrap text-center font-semibold"
                              style={{
                                color: '#ef4444',
                                minWidth: 140,
                                fontSize: 18
                              }}>
                              {student.negativeMoodCount}
                            </td>
                            {/* Mood Score Drop */}
                            <td className="px-4 py-3 whitespace-nowrap text-center font-semibold text-[#1F8E8E]" style={{ minWidth: 240 }}>
                              {student.moodScoreDrop ? student.moodScoreDrop.toFixed(2) : '0'}
                            </td>
                            {/* Outlier */}
                            <td className="px-4 py-3 whitespace-nowrap text-center">
                              {student.isOutlier && (
                                <Tooltip title="Mood Score Outlier">
                                  <HelpOutlineIcon sx={{ color: '#55AD9B', fontSize: 20 }} />
                                </Tooltip>
                              )}
                            </td>
                            {/* Monitoring Status / Notes */}
                            <td className="px-4 py-3 whitespace-nowrap" style={{ minWidth: 210 }}>
                              {editMode && expandedIdx === idx ? (
                                <Box display="flex" flexDirection="column" gap={1}>
                                  <TextField
                                    select
                                    label="Status"
                                    value={status}
                                    onChange={e => setStatus(e.target.value)}
                                    size="small"
                                    sx={{ minWidth: 140 }}
                                    disabled={saving}
                                  >
                                    {monitoringStatusOptions.map(opt => (
                                      <MenuItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                      </MenuItem>
                                    ))}
                                  </TextField>
                                  <TextField
                                    label="Observation/Notes"
                                    value={observation}
                                    onChange={e => setObservation(e.target.value)}
                                    size="small"
                                    multiline
                                    minRows={2}
                                    disabled={saving}
                                  />
                                  <Box display="flex" gap={1}>
                                    <Button
                                      variant="contained"
                                      color="success"
                                      size="small"
                                      startIcon={<SaveIcon />}
                                      onClick={handleSave}
                                      disabled={saving}
                                    >
                                      Save
                                    </Button>
                                    <Button
                                      variant="outlined"
                                      color="inherit"
                                      size="small"
                                      startIcon={<CancelIcon />}
                                      onClick={() => {
                                        setEditMode(false);
                                        setStatus(student.monitoringStatus || 'pending_review');
                                        setObservation(student.teacherObservation || '');
                                        setError('');
                                      }}
                                      disabled={saving}
                                    >
                                      Cancel
                                    </Button>
                                  </Box>
                                  {error && <span style={{ color: 'red', fontSize: 13 }}>{error}</span>}
                                </Box>
                              ) : (
                                <Box>
                                  <Chip
                                    label={monitoringStatusLabels[student.monitoringStatus] || 'Pending Review'}
                                    size="small"
                                    sx={{
                                      background: monitoringStatusChipColors[student.monitoringStatus]?.background || '#e0e7ff',
                                      color: monitoringStatusChipColors[student.monitoringStatus]?.color || '#3730a3',
                                      fontWeight: 700,
                                      mr: 1,
                                      px: 2,
                                      fontSize: 15,
                                      boxShadow: 1,
                                    }}
                                  />
                                  <IconButton size="small" onClick={() => {
                                    setEditMode(true);
                                    setExpandedIdx(idx);
                                    setStatus(student.monitoringStatus || 'pending_review');
                                    setObservation(student.teacherObservation || '');
                                  }}>
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                  <Box sx={{ mt: 1, fontSize: 13, color: '#444' }}>
                                    {student.teacherObservation
                                      ? <span><strong>Note:</strong> {student.teacherObservation}</span>
                                      : <span style={{ color: '#aaa' }}>No observation yet.</span>
                                    }
                                  </Box>
                                  <Box sx={{ mt: 1 }}>
                                    <Link
                                      component="button"
                                      variant="body2"
                                      underline="hover"
                                      sx={{ color: '#1F8E8E', fontWeight: 500, fontSize: 13 }}
                                      onClick={() => setShowHistory(true)}
                                    >
                                      <HistoryIcon sx={{ fontSize: 16, mr: 0.5, mb: '-2px' }} />
                                      View History
                                    </Link>
                                    <StatusHistoryModal
                                      open={showHistory}
                                      onClose={() => setShowHistory(false)}
                                      studentId={student.studentId._id}
                                      sectionId={student.sectionId}
                                    />
                                  </Box>
                                </Box>
                              )}
                            </td>
                          </tr>
                          {/* Expanded Row */}
                          <tr>
                            <td colSpan={10} style={{ padding: 0, background: '#f9fafb' }}>
                              <Collapse in={expandedIdx === idx} timeout="auto" unmountOnExit>
                                <Box sx={{ display: 'flex', gap: 6, px: 6, py: 3, flexWrap: 'wrap' }}>
                                  {/* Concerning Reasons */}
                                  <Box sx={{ minWidth: 260, flex: 1 }}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                                      Concerning Reasons
                                    </Typography>
                                    {groupedReasons.length > 0 ? (
                                      <Box display="flex" flexDirection="column" gap={1}>
                                        {groupedReasons.map(({ reason, count }, i) => (
                                          <Badge
                                            key={i}
                                            badgeContent={count}
                                            color="error"
                                            sx={{ width: 'fit-content', mb: 1 }}
                                          >
                                            <Chip
                                              label={reason.length > 40 ? reason.slice(0, 40) + '...' : reason}
                                              color="error"
                                              variant="outlined"
                                              sx={{
                                                background: '#edeaea',
                                                color: '#262826',
                                                borderRadius: '8px',
                                                fontWeight: 500,
                                                fontSize: 14,
                                                border: 'none',
                                                minHeight: '32px',
                                                maxWidth: 320
                                              }}
                                            />
                                          </Badge>
                                        ))}
                                      </Box>
                                    ) : (
                                      <span className="text-gray-400">None</span>
                                    )}
                                  </Box>
                                  {/* Recent Mood Logs */}
                                  <Box sx={{ minWidth: 320, flex: 2 }}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                                      Recent Mood Logs
                                    </Typography>
                                    {student.recentMoodLogs && student.recentMoodLogs.length > 0 ? (
                                      <Box display="flex" flexDirection="column" gap={1}>
                                        {student.recentMoodLogs.map((log, i) => (
                                          <Tooltip
                                            key={log.moodLogId || i}
                                            title={
                                              `Mood score: ${log.moodScore} | ${log.reason || 'No reason provided'} (${new Date(log.date).toLocaleDateString()})`
                                            }
                                          >
                                            <span className="text-gray-700 font-medium">
                                              Mood score: <strong>{log.moodScore}</strong> | {log.reason?.length > 30
                                                ? log.reason.slice(0, 30) + '...'
                                                : log.reason || 'No reason provided'} ({new Date(log.date).toLocaleDateString()})
                                            </span>
                                          </Tooltip>
                                        ))}
                                      </Box>
                                    ) : <span className="text-gray-400">None</span>}
                                  </Box>
                                </Box>
                              </Collapse>
                            </td>
                          </tr>
                        </React.Fragment>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonitorStudentsDetails;