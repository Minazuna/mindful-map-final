import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Avatar, Chip, Tooltip, IconButton, Collapse, Box, MenuItem, Select, FormControl, InputLabel, CircularProgress
} from '@mui/material';
import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import InfoIcon from '@mui/icons-material/Info';
import Sidebar from './Sidebar';

const severityIcons = {
  high: <WarningAmberIcon sx={{ color: '#fff', fontSize: 24, background: '#ef4444', borderRadius: '50%', p: 0.5 }} />,
  moderate: <ReportProblemIcon sx={{ color: '#f59e42', fontSize: 24, background: '#fde68a', borderRadius: '50%', p: 0.5 }} />,
  low: <CheckCircleIcon sx={{ color: '#34d399', fontSize: 24, background: '#bbf7d0', borderRadius: '50%', p: 0.5 }} />,
};

const severityLabels = {
  high: 'High Risk',
  moderate: 'Moderate Risk',
  low: 'Low Risk',
};

const severityOptions = [
  { value: '', label: 'All' },
  { value: 'high', label: 'High Risk' },
  { value: 'moderate', label: 'Moderate Risk' },
  { value: 'low', label: 'Low Risk' },
];

const allSections = [
  'St. John Paul II (STEM 1)',
  'St. Paul VI (STEM 2)',
  'St. John XXIII (STEM 3)',
  'St. Pius X (HUMSS)',
  'St. Tarcisius (ABM)',
  'St. Jose Sanchez Del Rio (ICT)'
];

function Row({ student, idx }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <TableRow hover>
        <TableCell>
          <Avatar src={student.studentId.avatar} alt={student.studentId.firstName} sx={{ width: 48, height: 48, border: '2px solid #55AD9B' }} />
        </TableCell>
        <TableCell>
          <strong>{student.studentId.firstName} {student.studentId.lastName}</strong>
        </TableCell>
        <TableCell>
          <Chip
            icon={severityIcons[student.severityLevel]}
            label={severityLabels[student.severityLevel]}
            sx={{
              background: student.severityLevel === 'high'
                ? 'linear-gradient(90deg,#ef4444,#f87171)'
                : student.severityLevel === 'moderate'
                  ? 'linear-gradient(90deg,#fde68a,#fbbf24)'
                  : 'linear-gradient(90deg,#bbf7d0,#34d399)',
              color: student.severityLevel === 'high' ? '#fff' : '#1F8E8E',
              fontWeight: 'bold',
            }}
          />
        </TableCell>
        <TableCell align="center">{student.riskScore}</TableCell>
        <TableCell align="center">{student.negativeMoodCount}</TableCell>
        <TableCell>
          {student.concerningKeywords && student.concerningKeywords.length > 0 ? (
            <>
              <Tooltip title={student.concerningKeywords[0]}>
                <Chip label={student.concerningKeywords[0].length > 20 ? student.concerningKeywords[0].slice(0, 20) + '...' : student.concerningKeywords[0]} color="error" size="small" />
              </Tooltip>
              {student.concerningKeywords.length > 1 && (
                <IconButton size="small" onClick={() => setOpen(open => !open)}>
                  {open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                </IconButton>
              )}
            </>
          ) : <span className="text-gray-400">None</span>}
        </TableCell>
        <TableCell align="center">{student.moodScoreDrop ? student.moodScoreDrop.toFixed(2) : '0'}</TableCell>
        <TableCell>
          {student.recentMoodLogs && student.recentMoodLogs.length > 0 ? (
            <>
              <Tooltip title={student.recentMoodLogs[0].reason || 'No reason provided'}>
                <span>
                  <strong>{student.recentMoodLogs[0].moodScore}</strong> ({new Date(student.recentMoodLogs[0].date).toLocaleDateString()})
                </span>
              </Tooltip>
              {student.recentMoodLogs.length > 1 && (
                <IconButton size="small" onClick={() => setOpen(open => !open)}>
                  {open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                </IconButton>
              )}
            </>
          ) : <span className="text-gray-400">None</span>}
        </TableCell>
        <TableCell align="center">
          {student.isOutlier && (
            <Tooltip title="Mood Score Outlier">
              <WarningAmberIcon sx={{ color: '#55AD9B', fontSize: 20 }} />
            </Tooltip>
          )}
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={10}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box margin={1}>
              {student.concerningKeywords && student.concerningKeywords.length > 1 && (
                <div className="mb-2">
                  <strong>All Concerning Reasons:</strong>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {student.concerningKeywords.slice(1).map((reason, i) => (
                      <Tooltip key={i} title={reason}>
                        <Chip label={reason.length > 20 ? reason.slice(0, 20) + '...' : reason} color="error" size="small" />
                      </Tooltip>
                    ))}
                  </div>
                </div>
              )}
              {student.recentMoodLogs && student.recentMoodLogs.length > 1 && (
                <div>
                  <strong>All Recent Mood Logs:</strong>
                  <div className="flex flex-col gap-1 mt-1">
                    {student.recentMoodLogs.slice(1).map((log, i) => (
                      <Tooltip key={log.moodLogId} title={log.reason || 'No reason provided'}>
                        <div className="flex items-center gap-2 text-sm bg-[#F6FBF7] rounded px-2 py-1">
                          <span className="font-bold text-[#1F8E8E]">{log.moodScore}</span>
                          <span className="text-[#55AD9B]">{new Date(log.date).toLocaleDateString()}</span>
                          <span className="italic text-gray-700">{log.reason?.length > 30 ? log.reason.slice(0, 30) + '...' : log.reason}</span>
                        </div>
                      </Tooltip>
                    ))}
                  </div>
                </div>
              )}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

const MonitorStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSection, setSelectedSection] = useState('');
  const [sections, setSections] = useState([]);
  const [severityFilter, setSeverityFilter] = useState('');

  // Fetch teacher profile to get assigned sections
  useEffect(() => {
    const fetchTeacherProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(
          `${import.meta.env.VITE_NODE_API}/api/teacher/profile`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.data.success) {
          const secs = res.data.data.assignedSections || [];
          setSections(secs);
          if (secs.length) setSelectedSection(secs[0]);
        }
      } catch {
        setSections([]);
      }
    };
    fetchTeacherProfile();
  }, []);

  useEffect(() => {
    const fetchSeverity = async () => {
      if (!selectedSection) return;
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(
          `${import.meta.env.VITE_NODE_API}/api/teacher/section-severity/${encodeURIComponent(selectedSection)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setStudents(res.data.data || []);
      } catch (err) {
        setStudents([]);
      }
      setLoading(false);
    };
    fetchSeverity();
  }, [selectedSection]);

  // Filter students by severity
  const filteredStudents = severityFilter
    ? students.filter(s => s.severityLevel === severityFilter)
    : students;

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar active="monitor" />
      <div className="flex-1 ml-72">
        {/* Header */}
        <div className="bg-[#F6FBF7] border-b-2 border-[#D8EFD3] sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-12 py-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-extrabold text-[#1F8E8E]">Monitor Students</h1>
                <p className="text-lg text-[#55AD9B] mt-2 font-medium">
                  Track students' emotional risk levels based on their recent mood logs. Select a section and filter by risk level.
                </p>
              </div>
            </div>
          </div>
        </div>
        {/* Filters */}
        <div className="max-w-7xl mx-auto px-12 py-6 flex flex-wrap gap-6 items-center">
          <FormControl sx={{ minWidth: 220 }}>
            <InputLabel id="section-label">Section</InputLabel>
            <Select
              labelId="section-label"
              value={selectedSection}
              label="Section"
              onChange={e => setSelectedSection(e.target.value)}
            >
              {sections.length > 0
                ? sections.map(sec => (
                    <MenuItem key={sec} value={sec}>{sec}</MenuItem>
                  ))
                : allSections.map(sec => (
                    <MenuItem key={sec} value={sec}>{sec}</MenuItem>
                  ))}
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 180 }}>
            <InputLabel id="severity-label">Risk Severity</InputLabel>
            <Select
              labelId="severity-label"
              value={severityFilter}
              label="Risk Severity"
              onChange={e => setSeverityFilter(e.target.value)}
            >
              {severityOptions.map(opt => (
                <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>
        {/* Table */}
        <div className="max-w-7xl mx-auto px-12 pb-12">
          {loading ? (
            <div className="flex justify-center items-center py-32">
              <CircularProgress color="success" />
            </div>
          ) : !selectedSection ? (
            <div className="flex flex-col items-center justify-center py-32">
              <InfoIcon sx={{ fontSize: 40, color: '#55AD9B' }} />
              <p className="text-gray-600 mt-2">Please select a section to view students.</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32">
              <InfoIcon sx={{ fontSize: 40, color: '#55AD9B' }} />
              <p className="text-gray-600 mt-2">No severity data available for this section and filter.</p>
            </div>
          ) : (
            <TableContainer component={Paper} sx={{ borderRadius: 4, boxShadow: 3 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Avatar</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Risk Level</TableCell>
                    <TableCell align="center">Risk Score</TableCell>
                    <TableCell align="center">Negative Logs</TableCell>
                    <TableCell>Concerning Reasons</TableCell>
                    <TableCell align="center">Mood Score Drop</TableCell>
                    <TableCell>Recent Mood Logs</TableCell>
                    <TableCell align="center">Outlier</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredStudents.map((student, idx) => (
                    <Row student={student} key={student.studentId._id} idx={idx} />
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </div>
      </div>
    </div>
  );
};

export default MonitorStudents;