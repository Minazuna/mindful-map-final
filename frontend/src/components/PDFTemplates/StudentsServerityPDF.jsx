import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

// Helper to load logo images as data URLs
async function loadImageAsDataURL(url) {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = reject;
    img.src = url;
  });
}

// Helper to format week range as "Jan. 05 - Jan. 11, 2026"
function formatWeekRange(start, end) {
  const months = ["Jan.", "Feb.", "Mar.", "Apr.", "May.", "Jun.", "Jul.", "Aug.", "Sep.", "Oct.", "Nov.", "Dec."];
  const startDate = new Date(start);
  const endDate = new Date(end);
  const year = endDate.getFullYear();
  return `${months[startDate.getMonth()]} ${String(startDate.getDate()).padStart(2, '0')} - ${months[endDate.getMonth()]} ${String(endDate.getDate()).padStart(2, '0')}, ${year}`;
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

// Color coding for risk levels
const severityColors = {
  high: [239, 68, 68],
  moderate: [251, 191, 36],
  low: [52, 211, 153],
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

/**
 * Generates a PDF report for a student's severity data.
 * @param {Object} student - The student severity data object (from MonitorStudentsDetails).
 * @param {Object} options - { section, weekStart, weekEnd, statusHistory }
 * @returns {Promise<void>}
 */
export async function generateStudentsSeverityPDF(student, { section, weekStart, weekEnd, statusHistory }) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();

  // Load logos
  const tupLogo = await loadImageAsDataURL('/images/tup.png');
  const mindfulLogo = await loadImageAsDataURL('/images/logo.png');

  // Header
  const logoSize = 20;
  const headerY = 15;
  doc.addImage(tupLogo, 'PNG', 10, headerY, logoSize, logoSize);
  doc.addImage(mindfulLogo, 'PNG', pageWidth - 15 - logoSize, headerY, logoSize, logoSize);

  // Title
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(85, 173, 155);
  const title = 'Mindful Map: Student Severity Monitoring Report';
  const titleWidth = doc.getTextWidth(title);
  doc.text(title, (pageWidth - titleWidth) / 2, headerY + 8);

  // Subtitle
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  const subtitle = 'for Emotional Regulation';
  const subtitleWidth = doc.getTextWidth(subtitle);
  doc.text(subtitle, (pageWidth - subtitleWidth) / 2, headerY + 14);

  // Timestamp
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  const now = new Date();
  const timestamp = now.toLocaleString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true
  });
  const timestampWidth = doc.getTextWidth(`Generated: ${timestamp}`);
  doc.text(`Generated: ${timestamp}`, (pageWidth - timestampWidth) / 2, headerY + 20);

  // Horizontal line
  doc.setDrawColor(85, 173, 155);
  doc.setLineWidth(0.5);
  doc.line(15, headerY + 27, pageWidth - 15, headerY + 27);

  // Student Info (original design, not table)
  let yPos = headerY + 37;
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Student Severity Summary', pageWidth / 2, yPos, { align: 'center' });

  yPos += 7;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(85, 173, 155);
  doc.text('STUDENT NAME', 25, yPos + 7);
  doc.text('EMAIL', 80, yPos + 7);
  doc.text('SECTION', 135, yPos + 7);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  doc.text(`${student.studentId.firstName} ${student.studentId.lastName}`, 25, yPos + 14);
  doc.text(student.studentId.email, 80, yPos + 14);
  doc.text(section ? decodeURIComponent(section) : 'N/A', 135, yPos + 14);

  yPos += 28;

  // Week & Severity Table
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Severity Monitoring (Week)', 15, yPos);

  yPos += 2;
  doc.autoTable({
    startY: yPos + 2,
    head: [['Week', 'Risk Level', 'Risk Score', 'Negative Logs', 'Mood Score Drop', 'Outlier']],
    body: [[
      weekStart && weekEnd ? formatWeekRange(weekStart, weekEnd) : 'All Time',
      severityLabels[student.severityLevel] || 'N/A',
      student.riskScore ?? 'N/A',
      student.negativeMoodCount ?? 'N/A',
      student.moodScoreDrop ? student.moodScoreDrop.toFixed(2) : '0',
      student.isOutlier ? 'Yes' : 'No'
    ]],
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [85, 173, 155], textColor: 255, fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 38 },
      1: { cellWidth: 32 },
      2: { cellWidth: 22 },
      3: { cellWidth: 28 },
      4: { cellWidth: 32 },
      5: { cellWidth: 18 }
    }
  });

  // Concerning Keywords Table
  yPos = doc.lastAutoTable.finalY + 6;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Concerning Keywords', 15, yPos);

  yPos += 2;
  const groupedReasons = student.concerningKeywords ? groupReasons(student.concerningKeywords) : [];
  doc.autoTable({
    startY: yPos + 2,
    head: [['Keyword', 'Count']],
    body: groupedReasons.length > 0
      ? groupedReasons.map(({ reason, count }) => [
          reason.length > 60 ? reason.slice(0, 60) + '...' : reason,
          count
        ])
      : [['None', '0']],
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [239, 68, 68], textColor: 255, fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 120 },
      1: { cellWidth: 20 }
    }
  });

  // Recent Mood Logs Table
  yPos = doc.lastAutoTable.finalY + 6;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Recent Mood Logs', 15, yPos);

  yPos += 2;
  doc.autoTable({
    startY: yPos + 2,
    head: [['Mood Score', 'Concerning Keyword', 'Date']],
    body: (student.recentMoodLogs && student.recentMoodLogs.length > 0)
      ? student.recentMoodLogs.map(log => [
          log.moodScore,
          log.reason?.length > 50 ? log.reason.slice(0, 50) + '...' : log.reason || 'No reason provided',
          new Date(log.date).toLocaleDateString()
        ])
      : [['-', '-', '-']],
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [85, 173, 155], textColor: 255, fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 28 },
      1: { cellWidth: 90 },
      2: { cellWidth: 32 }
    }
  });

  // Status/Observation History Table
  yPos = doc.lastAutoTable.finalY + 6;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Status & Observation History', 15, yPos);

  yPos += 2;
  if (Array.isArray(statusHistory) && statusHistory.length > 0) {
    const tableBody = statusHistory.slice().reverse().map(h => [
      monitoringStatusLabels[h.status] || h.status,
      h.updatedAt ? new Date(h.updatedAt).toLocaleString() : '',
      h.updatedBy ? `${h.updatedBy.firstName} ${h.updatedBy.lastName}` : '',
      h.observation || 'No observation for this status.'
    ]);
    doc.autoTable({
      head: [['Status', 'Date', 'By', 'Observation']],
      body: tableBody,
      startY: yPos + 2,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [85, 173, 155], textColor: 255, fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 32 },
        1: { cellWidth: 38 },
        2: { cellWidth: 38 },
        3: { cellWidth: 70 }
      }
    });
  } else {
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text('No previous status or observation history.', 25, yPos + 8);
  }

  // Save the PDF
  const fileName = `${student.studentId.firstName}_${student.studentId.lastName}_Severity_Report.pdf`;
  doc.save(fileName);
}