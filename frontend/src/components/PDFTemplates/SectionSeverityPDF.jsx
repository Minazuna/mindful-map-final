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
 * Generates a PDF report for a section's severity data (all students).
 * @param {Array} students - Array of student severity data objects.
 * @param {Object} options - { section, weekStart, weekEnd }
 * @returns {Promise<void>}
 */
export async function generateSectionSeverityPDF(students, { section, weekStart, weekEnd }) {
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
  const title = 'Mindful Map: Section Severity Monitoring Report';
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

  // Section Info
  let yPos = headerY + 37;
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Section Severity Summary', pageWidth / 2, yPos, { align: 'center' });

  yPos += 7;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(85, 173, 155);
  doc.text('SECTION', 25, yPos + 7);
  doc.text('WEEK', 80, yPos + 7);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  doc.text(section ? decodeURIComponent(section) : 'N/A', 25, yPos + 14);
  doc.text(weekStart && weekEnd ? formatWeekRange(weekStart, weekEnd) : 'All Time', 80, yPos + 14);

  yPos += 28;

  // Table: Students Severity Overview (no email)
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Students Severity Overview', 15, yPos);

  yPos += 2;
  doc.autoTable({
    startY: yPos + 2,
    head: [['#', 'Student Name', 'Risk Level', 'Risk Score', 'Negative Logs', 'Mood Score Drop', 'Outlier', 'Status']],
    body: students.map((student, idx) => [
      idx + 1,
      `${student.studentId.firstName} ${student.studentId.lastName}`,
      severityLabels[student.severityLevel] || 'N/A',
      student.riskScore ?? 'N/A',
      student.negativeMoodCount ?? 'N/A',
      student.moodScoreDrop ? student.moodScoreDrop.toFixed(2) : '0',
      student.isOutlier ? 'Yes' : 'No',
      monitoringStatusLabels[student.monitoringStatus] || 'Pending Review'
    ]),
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [85, 173, 155], textColor: 255, fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 8 },
      1: { cellWidth: 48 },
      2: { cellWidth: 22 },
      3: { cellWidth: 16 },
      4: { cellWidth: 18 },
      5: { cellWidth: 22 },
      6: { cellWidth: 12 },
      7: { cellWidth: 22 }
    },
    didDrawPage: (data) => {
      // Add page number at the bottom
      const pageCount = doc.internal.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Page ${doc.internal.getCurrentPageInfo().pageNumber} of ${pageCount}`, pageWidth - 30, 290);
    }
  });

  // Summary at the bottom
  let summaryY = doc.lastAutoTable.finalY + 10;
  if (summaryY > 250) {
    doc.addPage();
    summaryY = 30;
  }

  // Count students per severity
  const total = students.length;
  const high = students.filter(s => s.severityLevel === 'high').length;
  const moderate = students.filter(s => s.severityLevel === 'moderate').length;
  const low = students.filter(s => s.severityLevel === 'low').length;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(85, 173, 155);
  doc.text('Summary for the Current Week:', 15, summaryY);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);

  const summaryLines = [
    `• Total students in this section: ${total}`,
    `• High Risk: ${high} student${high === 1 ? '' : 's'}`,
    `• Moderate Risk: ${moderate} student${moderate === 1 ? '' : 's'}`,
    `• Low Risk: ${low} student${low === 1 ? '' : 's'}`,
    '',
    'This summary reflects the risk levels for the current week only.'
  ];

  let lineY = summaryY + 7;
  summaryLines.forEach(line => {
    doc.text(line, 18, lineY);
    lineY += 6;
  });

  // Save the PDF
  const fileName = `Section_${section ? decodeURIComponent(section) : 'N_A'}_Severity_Report.pdf`;
  doc.save(fileName);
}