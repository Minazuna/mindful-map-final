import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';

const emotionColors = {
  'calm': '#8FABD4',
  'relaxed': '#59AC77',
  'pleased': '#FF714B',
  'happy': '#f7b40bff',
  'excited': '#F564A9',
  'bored': '#A9A9A9',
  'sad': '#092b9cff',
  'disappointed': '#4e4d4dff',
  'angry': '#cc062dff',
  'tense': '#a854a8ff'
};

const capitalizeText = (text) => {
  return text.replace(/[-_]/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
};

function getSummary(moodCounts, moodType, sortedMoods) {
  if (!sortedMoods || sortedMoods.length === 0) {
    return 'No mood data available for this period.';
  }

  const total = Object.values(moodCounts).reduce((a, b) => a + b, 0);
  const topMood = sortedMoods[0];
  const topCount = moodCounts[topMood];
  const topPercent = Math.round((topCount / total) * 100);

  if (topPercent >= 50) {
    return `${capitalizeText(topMood)} was the dominant emotion, appearing in ${topPercent}% of all ${moodType === 'before' ? 'before' : 'after'} activity mood entries (${topCount} out of ${total} total entries).`;
  }
  if (topPercent >= 30) {
    return `Students were most frequently ${capitalizeText(topMood)} ${moodType === 'before' ? 'before' : 'after'} activities (${topCount} entries, ${topPercent}%). This mood shows moderate prevalence across the section(s).`;
  }
  return `${capitalizeText(topMood)} was the most common emotion (${topCount} entries, ${topPercent}%), with emotions relatively distributed across the section(s).`;
}

function getMoodDistributionSummary(moodDistribution, valence) {
  if (!moodDistribution || moodDistribution.length === 0) {
    return 'No mood data available.';
  }

  const total = moodDistribution.reduce((acc, curr) => acc + curr.count, 0);
  const topMood = moodDistribution[0]._id;
  const topCount = moodDistribution[0].count;
  const topPercent = Math.round((topCount / total) * 100);
  
  let valenceText = '';
  if (valence === 'Both') {
    // Count positive and negative moods
    const positiveEmotions = ['happy', 'pleased', 'relaxed', 'calm', 'excited'];
    let positiveCount = 0;
    let negativeCount = 0;
    
    moodDistribution.forEach(mood => {
      if (positiveEmotions.includes(mood._id.toLowerCase())) {
        positiveCount += mood.count;
      } else {
        negativeCount += mood.count;
      }
    });
    
    const positivePercent = Math.round((positiveCount / total) * 100);
    const negativePercent = Math.round((negativeCount / total) * 100);
    valenceText = ` with ${positivePercent}% positive moods (${positiveCount} logs) and ${negativePercent}% negative moods (${negativeCount} logs)`;
  } else {
    valenceText = ` (${valence} moods only)`;
  }

  if (topPercent >= 50) {
    return `${capitalizeText(topMood)} was the most prominent mood among students${valenceText}, representing ${topPercent}% of all logs (${topCount} out of ${total} total entries).`;
  }
  return `The most common mood observed was ${capitalizeText(topMood)}${valenceText}, appearing in ${topPercent}% of student logs (${topCount} entries). Statistics show ${moodDistribution.length} different emotions recorded during this period.`;
}

async function loadImageAsDataURL(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
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

function drawPieSlice(doc, centerX, centerY, radius, startAngle, endAngle, colorHex) {
  const r = parseInt(colorHex.slice(1, 3), 16);
  const g = parseInt(colorHex.slice(3, 5), 16);
  const b = parseInt(colorHex.slice(5, 7), 16);
  
  const steps = 50;
  const angleStep = (endAngle - startAngle) / steps;
  
  doc.setFillColor(r, g, b);
  
  for (let i = 0; i < steps; i++) {
    const a1 = startAngle + i * angleStep;
    const a2 = startAngle + (i + 1) * angleStep;
    
    const x1 = centerX + radius * Math.cos(a1);
    const y1 = centerY + radius * Math.sin(a1);
    const x2 = centerX + radius * Math.cos(a2);
    const y2 = centerY + radius * Math.sin(a2);
    
    doc.triangle(centerX, centerY, x1, y1, x2, y2, 'F');
  }
}

export async function generateMoodAnalysisPDF(selectedSection, moodType, moodPeriod, moodCounts, sortedMoods) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  try {
    // Load logos
    const tupLogo = await loadImageAsDataURL('/images/tup.png');
    const mindfulLogo = await loadImageAsDataURL('/images/logo.png');
    
    // Header Section
    const logoSize = 20;
    const headerY = 15;
    
    // TUP Logo (left)
    doc.addImage(tupLogo, 'PNG', 10, headerY, logoSize, logoSize);
    
    // Mindful Map Logo (right)
    doc.addImage(mindfulLogo, 'PNG', pageWidth - 15 - logoSize, headerY, logoSize, logoSize);
    
    // Title (center)
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(85, 173, 155);
    const title = 'Mindful Map: Mood and Habits Analyzer';
    const titleWidth = doc.getTextWidth(title);
    doc.text(title, (pageWidth - titleWidth) / 2, headerY + 8);
    
    doc.setFontSize(14);
    const subtitle = 'for Emotional Regulation';
    const subtitleWidth = doc.getTextWidth(subtitle);
    doc.text(subtitle, (pageWidth - subtitleWidth) / 2, headerY + 14);
    
    // Timestamp
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    const now = new Date();
    const timestamp = now.toLocaleString('en-US', { 
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    const timestampWidth = doc.getTextWidth(`Generated: ${timestamp}`);
    doc.text(`Generated: ${timestamp}`, (pageWidth - timestampWidth) / 2, headerY + 20);
    
    // Horizontal line
    doc.setDrawColor(85, 173, 155);
    doc.setLineWidth(0.5);
    doc.line(15, headerY + 27, pageWidth - 15, headerY + 27);
    
    // Report Details
    let yPos = headerY + 37;
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Mood Analysis Report', pageWidth / 2, yPos, { align: 'center' });
    
    yPos += 8;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    const displaySection = selectedSection === 'All' ? 'All Sections' : selectedSection;
    const periodText = `${displaySection} · ${moodType === 'before' ? 'Before' : 'After'} Activity · ${capitalizeText(moodPeriod)} Period`;
    doc.text(periodText, pageWidth / 2, yPos, { align: 'center' });
    
    // Summary Box
    yPos += 12;
    doc.setFillColor(240, 248, 255);
    doc.roundedRect(15, yPos, pageWidth - 30, 25, 3, 3, 'F');
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(85, 173, 155);
    doc.text('Summary', 20, yPos + 7);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(10);
    const summary = getSummary(moodCounts, moodType, sortedMoods);
    const summaryLines = doc.splitTextToSize(summary, pageWidth - 40);
    doc.text(summaryLines, 20, yPos + 15, { maxWidth: pageWidth - 40, align: 'justify' });
    
    yPos += 35;
    
    if (Object.keys(moodCounts).length === 0) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(150, 150, 150);
      doc.text('No mood data available for this section and period.', pageWidth / 2, yPos + 20, { align: 'center' });
    } else {
      // Chart area
      const chartCenterX = pageWidth / 2;
      const chartCenterY = yPos + 35;
      const chartRadius = 30;
      const innerRadius = chartRadius * 0.68;
      
      const total = Object.values(moodCounts).reduce((a, b) => a + b, 0);
      
      // Draw donut chart slices
      let currentAngle = -Math.PI / 2;
      sortedMoods.forEach((emotion) => {
        const count = moodCounts[emotion];
        const percent = count / total;
        const sliceAngle = percent * 2 * Math.PI;
        const endAngle = currentAngle + sliceAngle;
        
        const colorHex = emotionColors[emotion.toLowerCase()] || '#95A5A6';
        drawPieSlice(doc, chartCenterX, chartCenterY, chartRadius, currentAngle, endAngle, colorHex);
        currentAngle = endAngle;
      });
      
      // Inner white circle
      doc.setFillColor(255, 255, 255);
      doc.circle(chartCenterX, chartCenterY, innerRadius, 'F');
      
      // Total in center
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(85, 173, 155);
      doc.text(total.toString(), chartCenterX, chartCenterY - 2, { align: 'center' });
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text('entries', chartCenterX, chartCenterY + 4, { align: 'center' });
      
      // Draw labels on slices
      currentAngle = -Math.PI / 2;
      sortedMoods.forEach((emotion) => {
        const count = moodCounts[emotion];
        const percent = count / total;
        const sliceAngle = percent * 2 * Math.PI;
        const endAngle = currentAngle + sliceAngle;
        const midAngle = currentAngle + sliceAngle / 2;
        
        const labelRadius = (chartRadius + innerRadius) / 2;
        const labelX = chartCenterX + labelRadius * Math.cos(midAngle);
        const labelY = chartCenterY + labelRadius * Math.sin(midAngle);
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(count.toString(), labelX, labelY, { align: 'center', baseline: 'middle' });
        
        currentAngle = endAngle;
      });
      
      // Legend below chart
      let legendY = chartCenterY + chartRadius + 15;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(85, 173, 155);
      doc.text('Emotion Breakdown', 20, legendY);
      
      legendY += 8;
      
      // Create two columns for legend
      const col1X = 20;
      const col2X = pageWidth / 2 + 10;
      let col1Y = legendY;
      let col2Y = legendY;
      const maxLegendPerCol = Math.ceil(sortedMoods.length / 2);
      
      sortedMoods.forEach((emotion, idx) => {
        const count = moodCounts[emotion];
        const percent = Math.round((count / total) * 100);
        const colorHex = emotionColors[emotion.toLowerCase()] || '#95A5A6';
        const r = parseInt(colorHex.slice(1, 3), 16);
        const g = parseInt(colorHex.slice(3, 5), 16);
        const b = parseInt(colorHex.slice(5, 7), 16);
        
        const colX = idx < maxLegendPerCol ? col1X : col2X;
        const currentY = idx < maxLegendPerCol ? col1Y : col2Y;
        
        // Color box
        doc.setFillColor(r, g, b);
        doc.roundedRect(colX, currentY - 2.5, 3.5, 3.5, 0.3, 0.3, 'F');
        
        // Emotion name
        doc.setTextColor(85, 173, 155);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text(capitalizeText(emotion), colX + 6, currentY);
        
        // Count and percentage
        doc.setTextColor(60, 60, 60);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        const countText = `${count} (${percent}%)`;
        doc.text(countText, colX + 60, currentY, { align: 'left' });
        
        if (idx < maxLegendPerCol) {
          col1Y += 7;
        } else {
          col2Y += 7;
        }
      });
      
      yPos = Math.max(col1Y, col2Y) + 10;
    }
    
    // Footer
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(150, 150, 150);
    doc.text(
      'This report was automatically generated by Mindful Map system.',
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
    
    // Save PDF
    const sectionClean = selectedSection.replace(/\s+/g, '');
    const moodTypeCamel = moodType.charAt(0).toUpperCase() + moodType.slice(1);
    const periodCamel = moodPeriod.charAt(0).toUpperCase() + moodPeriod.slice(1);
    const filename = `MoodAnalysis_${sectionClean}_${moodTypeCamel}_${periodCamel}.pdf`;
    doc.save(filename);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}
function getCategoricalSummary(logsData, dateRange, viewType) {
  if (!logsData) {
    return 'No data available for this period.';
  }

  const activityTotal = logsData.activity.reduce((sum, count) => sum + count, 0);
  const socialTotal = logsData.social.reduce((sum, count) => sum + count, 0);
  const healthTotal = logsData.health.reduce((sum, count) => sum + count, 0);
  const sleepTotal = logsData.sleep.reduce((sum, count) => sum + count, 0);
  const grandTotal = activityTotal + socialTotal + healthTotal + sleepTotal;

  if (grandTotal === 0) {
    return `No logs recorded during the period of ${dateRange}.`;
  }

  const activityPercent = ((activityTotal / grandTotal) * 100).toFixed(1);
  const socialPercent = ((socialTotal / grandTotal) * 100).toFixed(1);
  const healthPercent = ((healthTotal / grandTotal) * 100).toFixed(1);
  const sleepPercent = ((sleepTotal / grandTotal) * 100).toFixed(1);

  const periodText = viewType === 'weekly' ? `For the past 8 weeks (${dateRange})` : 
                    viewType === 'daily' ? `For the past 30 days (${dateRange})` : 
                    `For the past 12 months (${dateRange})`;

  return `${periodText}, students recorded a total of ${grandTotal} logs across all categories. Activity logs account for ${activityPercent}% (${activityTotal} logs), Social logs for ${socialPercent}% (${socialTotal} logs), Health logs for ${healthPercent}% (${healthTotal} logs), and Sleep logs for ${sleepPercent}% (${sleepTotal} logs). This breakdown helps identify which wellness categories students are focusing on most throughout the period.`;
}

export const generateCategoricalLogsPDF = async (selectedSection, logsData, dateRange, viewType) => {
  try {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    let imgData;
    
    // Capture chart image
    const chartElement = document.querySelector('#categorical-logs-chart');
    if (!chartElement) {
      throw new Error('Chart element not found');
    }
    
    const canvas = chartElement.querySelector('canvas');
    if (canvas) {
      const tempCanvas = await html2canvas(canvas);
      imgData = tempCanvas.toDataURL('image/png');
    } else {
      const tempCanvas = await html2canvas(chartElement);
      imgData = tempCanvas.toDataURL('image/png');
    }
    
    const tupLogo = await loadImageAsDataURL('/images/tup.png');
    const mindfulLogo = await loadImageAsDataURL('/images/logo.png');
    
    const logoSize = 20;
    const headerY = 15;
    
    doc.addImage(tupLogo, 'PNG', 10, headerY, logoSize, logoSize);
    doc.addImage(mindfulLogo, 'PNG', pageWidth - 15 - logoSize, headerY, logoSize, logoSize);
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(85, 173, 155);
    const title = 'Mindful Map: Mood and Habits Analyzer';
    const titleWidth = doc.getTextWidth(title);
    doc.text(title, (pageWidth - titleWidth) / 2, headerY + 8);
    
    doc.setFontSize(14);
    const subtitle = 'for Emotional Regulation';
    const subtitleWidth = doc.getTextWidth(subtitle);
    doc.text(subtitle, (pageWidth - subtitleWidth) / 2, headerY + 14);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    const now = new Date();
    const timestamp = now.toLocaleString('en-US', { 
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    const timestampWidth = doc.getTextWidth(`Generated: ${timestamp}`);
    doc.text(`Generated: ${timestamp}`, (pageWidth - timestampWidth) / 2, headerY + 20);
    
    doc.setDrawColor(85, 173, 155);
    doc.setLineWidth(0.5);
    doc.line(15, headerY + 27, pageWidth - 15, headerY + 27);
    
    let yPos = headerY + 37;
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Categorical Logs Report', pageWidth / 2, yPos, { align: 'center' });
    
    yPos += 8;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(85, 173, 155);
    const displayCatSection = selectedSection === 'All' ? 'All Sections' : selectedSection;
    doc.text(displayCatSection, pageWidth / 2, yPos, { align: 'center' });
    
    yPos += 6;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    const viewLabel = viewType.charAt(0).toUpperCase() + viewType.slice(1);
    doc.text(`${viewLabel} | ${dateRange}`, pageWidth / 2, yPos, { align: 'center' });
    
    yPos += 8;
    
    // Summary Box
    const summary = getCategoricalSummary(logsData, dateRange, viewType);
    const summaryLines = doc.splitTextToSize(summary, pageWidth - 40);
    const summaryHeight = (summaryLines.length * 5) + 18;
    
    doc.setFillColor(240, 248, 255);
    doc.roundedRect(15, yPos, pageWidth - 30, summaryHeight, 3, 3, 'F');
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(85, 173, 155);
    doc.text('Summary Overview', 20, yPos + 7);
    
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(summaryLines, 20, yPos + 15, { maxWidth: pageWidth - 40, align: 'justify' });
    
    yPos += summaryHeight + 10;

    // Chart image
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(85, 173, 155);
    doc.setLineWidth(0.5);
    doc.roundedRect(25, yPos, 160, 90, 3, 3, 'FD');
    doc.addImage(imgData, 'PNG', 35, yPos + 5, 140, 80);
    
    yPos += 100;

    // Data Table
    doc.addPage();
    yPos = 20;
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(85, 173, 155);
    doc.text('Detailed Log Data', 15, yPos);
    
    yPos += 10;

    const tableData = [];
    const labels = logsData.labels;
    
    labels.forEach((label, index) => {
      const act = logsData.activity[index] || 0;
      const soc = logsData.social[index] || 0;
      const hlt = logsData.health[index] || 0;
      const slp = logsData.sleep[index] || 0;
      const total = act + soc + hlt + slp;
      
      tableData.push([label, act, soc, hlt, slp, total]);
    });

    autoTable(doc, {
      startY: yPos,
      head: [['Period', 'Activity', 'Social', 'Health', 'Sleep', 'Total']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [85, 173, 155], textColor: 255 },
      alternateRowStyles: { fillColor: [240, 248, 255] },
      margin: { left: 15, right: 15 },
      styles: { fontSize: 9, cellPadding: 3 }
    });
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(150, 150, 150);
    doc.text(
      'This report was automatically generated by Mindful Map system.',
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
    
    const sectionClean = selectedSection.replace(/\s+/g, '');
    const filename = `CategoricalLogs_${viewType}_${sectionClean}.pdf`;
    doc.save(filename);
  } catch (error) {
    console.error('Error generating categorical logs PDF:', error);
    throw error;
  }
}
export async function generateMoodDistributionPDF(selectedSection, valence, moodDistribution) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  try {
    const tupLogo = await loadImageAsDataURL('/images/tup.png');
    const mindfulLogo = await loadImageAsDataURL('/images/logo.png');
    
    const logoSize = 20;
    const headerY = 15;
    
    doc.addImage(tupLogo, 'PNG', 10, headerY, logoSize, logoSize);
    doc.addImage(mindfulLogo, 'PNG', pageWidth - 15 - logoSize, headerY, logoSize, logoSize);
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(85, 173, 155);
    const title = 'Mindful Map: Mood and Habits Analyzer';
    const titleWidth = doc.getTextWidth(title);
    doc.text(title, (pageWidth - titleWidth) / 2, headerY + 8);
    
    doc.setFontSize(14);
    const subtitle = 'for Emotional Regulation';
    const subtitleWidth = doc.getTextWidth(subtitle);
    doc.text(subtitle, (pageWidth - subtitleWidth) / 2, headerY + 14);
    
    const now = new Date();
    const timestamp = now.toLocaleString('en-US', { 
      month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true 
    });
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    const timestampWidth = doc.getTextWidth(`Generated: ${timestamp}`);
    doc.text(`Generated: ${timestamp}`, (pageWidth - timestampWidth) / 2, headerY + 20);
    
    doc.setDrawColor(85, 173, 155);
    doc.setLineWidth(0.5);
    doc.line(15, headerY + 27, pageWidth - 15, headerY + 27);
    
    let yPos = headerY + 37;
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Mood Distribution Report', pageWidth / 2, yPos, { align: 'center' });
    
    yPos += 8;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    const displaySection = selectedSection === 'All' ? 'All Sections' : selectedSection;
    doc.text(`${displaySection} · ${valence}`, pageWidth / 2, yPos, { align: 'center' });
    
    yPos += 12;
    doc.setFillColor(240, 248, 255);
    doc.roundedRect(15, yPos, pageWidth - 30, 30, 3, 3, 'F');
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(85, 173, 155);
    doc.text('Summary', 20, yPos + 7);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(10);
    const summary = getMoodDistributionSummary(moodDistribution, valence);
    const summaryLines = doc.splitTextToSize(summary, pageWidth - 40);
    doc.text(summaryLines, 20, yPos + 15, { maxWidth: pageWidth - 40, align: 'justify' });
    
    yPos += 40;
    
    if (!moodDistribution || moodDistribution.length === 0) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(150, 150, 150);
      doc.text('No mood data available for this section and valence.', pageWidth / 2, yPos + 20, { align: 'center' });
    } else {
      const total = moodDistribution.reduce((acc, curr) => acc + curr.count, 0);
      const tableData = moodDistribution.map(item => [
        capitalizeText(item._id),
        item.count,
        `${Math.round((item.count / total) * 100)}%`
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [['Mood', 'Count', 'Percentage']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [85, 173, 155], textColor: 255 },
        alternateRowStyles: { fillColor: [240, 248, 255] },
        margin: { left: 40, right: 40 },
        styles: { fontSize: 10, cellPadding: 5 }
      });
    }
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(150, 150, 150);
    doc.text('This report was automatically generated by Mindful Map system.', pageWidth / 2, pageHeight - 10, { align: 'center' });
    
    doc.save(`MoodDistribution_${selectedSection}_${valence}.pdf`);
  } catch (error) {
    console.error('PDF Generation Error:', error);
    throw error;
  }
}