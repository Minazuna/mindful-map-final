import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Helper to capitalize emotion names
const capitalizeText = (text) => {
  return text.replace(/[-_]/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
};

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

/**
 * Generates a PDF summary for Mood Analysis.
 * @param {Object} params - { moodType, moodPeriod, moodCounts }
 */
export async function generateMoodAnalysisPDF({ moodType, moodPeriod, moodCounts }) {
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
  const title = 'Mindful Map: Mood Analysis Summary';
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
  doc.text('Mood Analysis Summary', pageWidth / 2, yPos, { align: 'center' });

  yPos += 7;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(85, 173, 155);
  doc.text('PERIOD', 25, yPos + 7);
  doc.text('TYPE', 80, yPos + 7);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  doc.text(capitalizeText(moodPeriod), 25, yPos + 14);
  doc.text(moodType === 'before' ? 'Before Activity' : 'After Activity', 80, yPos + 14);

  yPos += 28;

  // Table: Emotions and Counts
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Emotions Summary Table', pageWidth / 2, yPos, { align: 'center' });

  yPos += 2;

  // Prepare table data
  const sortedEmotions = Object.keys(moodCounts).sort((a, b) => moodCounts[b] - moodCounts[a]);
  const tableHead = ['Emotion', 'Count'];
  const tableBody = sortedEmotions.map(emotion => [
    capitalizeText(emotion),
    moodCounts[emotion]
  ]);

  // Center the table
  const tableWidth = 90; // 60 + 30 (from columnStyles)
  const tableLeft = (pageWidth - tableWidth) / 2;

  autoTable(doc, {
    startY: yPos + 4,
    head: [tableHead],
    body: tableBody,
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [85, 173, 155], textColor: 255, fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: 30 }
    },
    margin: { left: tableLeft, right: tableLeft },
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

  // Summary bullets
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(85, 173, 155);
  doc.text('Summary:', 15, summaryY);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);

  const total = Object.values(moodCounts).reduce((a, b) => a + b, 0);
  const mostCommon = sortedEmotions[0];
  const mostCount = moodCounts[mostCommon] || 0;
  const mostPercent = total ? Math.round((mostCount / total) * 100) : 0;
  const uniqueEmotions = sortedEmotions.length;

  let summaryBullets = [];
  if (sortedEmotions.length === 0) {
    summaryBullets.push('No mood data available for this period.');
  } else {
    summaryBullets.push(`• Total entries: ${total}`);
    summaryBullets.push(`• Number of different emotions: ${uniqueEmotions}`);
    if (mostPercent >= 50) {
      summaryBullets.push(`• ${capitalizeText(mostCommon)} was the dominant emotion, appearing in ${mostPercent}% of all entries (${mostCount} out of ${total}).`);
    } else if (mostPercent >= 30) {
      summaryBullets.push(`• Most frequent emotion: ${capitalizeText(mostCommon)} (${mostCount} entries, ${mostPercent}%).`);
    } else {
      summaryBullets.push(`• Emotions were relatively distributed. Most common: ${capitalizeText(mostCommon)} (${mostCount} entries, ${mostPercent}%).`);
    }
  }

  let lineY = summaryY + 7;
  summaryBullets.forEach(line => {
    doc.text(line, 18, lineY);
    lineY += 6;
  });

  // Save the PDF
  const fileName = `MoodAnalysis_${capitalizeText(moodPeriod)}_${moodType}.pdf`;
  doc.save(fileName);
}