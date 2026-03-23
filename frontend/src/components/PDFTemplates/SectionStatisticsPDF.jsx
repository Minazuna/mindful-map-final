import jsPDF from 'jspdf';

const pieColors = [
  '#8FABD4',
  '#59AC77',
  '#FF714B',
  '#f7b40bff',
  '#F564A9',
  '#A9A9A9',
  '#092b9cff',
  '#4e4d4dff',
  '#cc062dff',
  '#fdf8fdff'
];

function beautifyName(name) {
  if (!name) return '';
  const str = String(name).replace(/[-_]/g, ' ');
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function normalizePeriodType(value = '') {
  const raw = String(value).toLowerCase().trim();
  const normalized = raw.replace(/[_-]/g, ' ').replace(/\s+/g, ' ').trim();
  const compact = normalized.replace(/\s+/g, '');

  if (
    compact === 'day' ||
    compact === 'daily' ||
    compact === 'dailyperiod' ||
    normalized.includes('day')
  ) {
    return 'daily';
  }

  if (
    compact === 'week' ||
    compact === 'weekly' ||
    compact === 'weeklyperiod' ||
    normalized.includes('week')
  ) {
    return 'weekly';
  }

  if (
    compact === 'month' ||
    compact === 'monthly' ||
    compact === 'monthlyperiod' ||
    normalized.includes('month')
  ) {
    return 'monthly';
  }

  return '';
}

function getPeriodDisplay(periodType, baseDate = new Date()) {
  const mode = normalizePeriodType(periodType);

  const formatMonthYear = (date) =>
    date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const formatLongDate = (date) =>
    date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const formatMonthDay = (date) =>
    date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

  if (mode === 'monthly') return formatMonthYear(baseDate); // March 2026
  if (mode === 'daily') return formatLongDate(baseDate); // March 23, 2026

  if (mode === 'weekly') {
    // Monday-Sunday
    const start = new Date(baseDate);
    const mondayOffset = (start.getDay() + 6) % 7;
    start.setDate(start.getDate() - mondayOffset);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    const sameYear = start.getFullYear() === end.getFullYear();
    const sameMonth = sameYear && start.getMonth() === end.getMonth();

    if (sameMonth) {
      const month = start.toLocaleDateString('en-US', { month: 'long' });
      return `${month} ${start.getDate()}-${month} ${end.getDate()}, ${start.getFullYear()}`;
    }

    if (sameYear) {
      return `${formatMonthDay(start)}-${formatMonthDay(end)}, ${start.getFullYear()}`;
    }

    return `${formatLongDate(start)}-${formatLongDate(end)}`;
  }

  return beautifyName(periodType || 'Period');
}

function getSummaryPhrase(title, data) {
  if (!data || data.length === 0) return `No data for this category in the section.`;
  const top = data[0];
  if (!top) return `No data for this category in the section.`;
  if (title === 'Sleep') {
    return `Most students logged "${beautifyName(top.activity)}" hours of sleep most often (${top.count} times, ${top.percent}%). Sleep is crucial for student well-being and mood.`;
  }
  if (top.percent >= 50) {
    return `The activity "${beautifyName(top.activity)}" made up more than half of the section's logs for this category (${top.count} times, ${top.percent}%).`;
  }
  if (top.percent >= 30) {
    return `"${beautifyName(top.activity)}" was the most common in this category (${top.count} times, ${top.percent}%).`;
  }
  return `"${beautifyName(top.activity)}" was the most frequent in this category (${top.count} times, ${top.percent}%).`;
}

function getOverallSummary(sectionsData) {
  const categoryCounts = sectionsData.map((section) => ({
    category: section.title,
    total: section.data.reduce((sum, item) => sum + item.count, 0)
  }));

  const maxCategory = categoryCounts.reduce(
    (max, curr) => (curr.total > max.total ? curr : max),
    categoryCounts[0]
  );

  if (!maxCategory || maxCategory.total === 0) {
    return 'No activities recorded in this section during this period.';
  }

  return `The "${maxCategory.category}" category had the most recorded activities in the section with ${maxCategory.total} total entries across this period.`;
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

function drawPieSlice(doc, centerX, centerY, radius, startAngle, endAngle, color) {
  doc.setFillColor(color);

  const steps = 50;
  const angleStep = (endAngle - startAngle) / steps;

  doc.setDrawColor(color);
  doc.setFillColor(color);

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

export async function generateSectionStatisticsPDF(section, emotion, moodType, moodPeriod, sectionsData) {
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
    doc.text(`Section Activities Report: ${beautifyName(emotion)}`, pageWidth / 2, yPos, { align: 'center' });

    yPos += 8;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);

    // FIX: show actual date text instead of "Monthly/Weekly/Daily Period"
    const periodDisplay = getPeriodDisplay(moodPeriod, now);
    const sectionInfo = `Section: ${section} · ${moodType === 'before' ? 'Before' : 'After'} Emotion · ${periodDisplay}`;
    doc.text(sectionInfo, pageWidth / 2, yPos, { align: 'center' });

    yPos += 12;
    doc.setFillColor(240, 248, 255);
    doc.roundedRect(15, yPos, pageWidth - 30, 20, 3, 3, 'F');

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(85, 173, 155);
    doc.text('Overall Summary', 20, yPos + 7);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(10);
    const overallSummary = getOverallSummary(sectionsData);
    const summaryLines = doc.splitTextToSize(overallSummary, pageWidth - 40);
    doc.text(summaryLines, 20, yPos + 15);

    yPos += 30;

    const categoryColors = {
      Activity: [14, 165, 233],
      Social: [249, 149, 43],
      Health: [34, 197, 94],
      Sleep: [99, 102, 241]
    };

    for (let i = 0; i < sectionsData.length; i += 2) {
      if (yPos > pageHeight - 95) {
        doc.addPage();
        yPos = 20;
      }

      const section1 = sectionsData[i];
      const section2 = i + 1 < sectionsData.length ? sectionsData[i + 1] : null;

      const leftMargin = 15;
      const rightMargin = 15;
      const columnGap = 10;
      const availableWidth = pageWidth - leftMargin - rightMargin;
      const colWidth = (availableWidth - columnGap) / 2;
      const col1X = leftMargin;
      const col2X = col1X + colWidth + columnGap;
      let maxYForRow = yPos;

      for (let col = 0; col < 2; col++) {
        const sectionData = col === 0 ? section1 : section2;
        if (!sectionData) continue;

        const colX = col === 0 ? col1X : col2X;
        let sectionY = yPos;

        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        const color = categoryColors[sectionData.title] || [85, 173, 155];
        doc.setTextColor(color[0], color[1], color[2]);
        doc.text(sectionData.title, colX, sectionY);

        sectionY += 8;

        if (sectionData.data.length === 0) {
          doc.setFontSize(9);
          doc.setFont('helvetica', 'italic');
          doc.setTextColor(150, 150, 150);
          doc.text('No data for this category.', colX + 5, sectionY);
          maxYForRow = Math.max(maxYForRow, sectionY + 15);
          continue;
        }

        doc.setFillColor(250, 250, 250);
        doc.roundedRect(colX, sectionY, colWidth, 15, 2, 2, 'F');

        doc.setFontSize(9);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(80, 80, 80);
        const summary = getSummaryPhrase(sectionData.title, sectionData.data);
        const summaryTextLines = doc.splitTextToSize(summary, colWidth - 8);
        doc.text(summaryTextLines, colX + 3, sectionY + 5);

        sectionY += 18;

        const chartCenterX = colX + 15;
        const chartCenterY = sectionY + 20;
        const chartRadius = 16;
        const total = sectionData.data.reduce((sum, item) => sum + item.count, 0);

        let currentAngle = -Math.PI / 2;
        const innerRadius = chartRadius * 0.68;

        sectionData.data.forEach((item, idx) => {
          const percent = item.count / total;
          const sliceAngle = percent * 2 * Math.PI;
          const endAngle = currentAngle + sliceAngle;

          const colorHex = pieColors[idx % pieColors.length];
          const r = parseInt(colorHex.slice(1, 3), 16);
          const g = parseInt(colorHex.slice(3, 5), 16);
          const b = parseInt(colorHex.slice(5, 7), 16);

          drawPieSlice(doc, chartCenterX, chartCenterY, chartRadius, currentAngle, endAngle, `rgb(${r},${g},${b})`);
          currentAngle = endAngle;
        });

        doc.setFillColor(255, 255, 255);
        doc.circle(chartCenterX, chartCenterY, innerRadius, 'F');

        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(85, 173, 155);
        doc.text(total.toString(), chartCenterX, chartCenterY - 2, { align: 'center' });
        doc.setFontSize(7);
        doc.setTextColor(100, 100, 100);
        doc.text('total', chartCenterX, chartCenterY + 3, { align: 'center' });

        currentAngle = -Math.PI / 2;
        sectionData.data.forEach((item) => {
          const percent = item.count / total;
          const sliceAngle = percent * 2 * Math.PI;
          const endAngle = currentAngle + sliceAngle;
          const midAngle = currentAngle + sliceAngle / 2;

          const labelRadius = (chartRadius + innerRadius) / 2;
          const labelX = chartCenterX + labelRadius * Math.cos(midAngle);
          const labelY = chartCenterY + labelRadius * Math.sin(midAngle);

          doc.setTextColor(255, 255, 255);
          doc.setFontSize(9);
          doc.setFont('helvetica', 'bold');
          doc.text(item.count.toString(), labelX, labelY, { align: 'center', baseline: 'middle' });

          currentAngle = endAngle;
        });

        const legendX = colX + 38;
        let legendY = sectionY + 3;

        doc.setFontSize(8);
        sectionData.data.forEach((item, idx) => {
          const colorHex = pieColors[idx % pieColors.length];
          const r = parseInt(colorHex.slice(1, 3), 16);
          const g = parseInt(colorHex.slice(3, 5), 16);
          const b = parseInt(colorHex.slice(5, 7), 16);

          doc.setFillColor(r, g, b);
          doc.roundedRect(legendX, legendY - 2.5, 3, 3, 0.3, 0.3, 'F');

          doc.setTextColor(85, 173, 155);
          doc.setFont('helvetica', 'bold');
          const activityName = sectionData.isSleepHours ? `${item.activity}h` : beautifyName(item.activity);
          const maxNameLength = 18;
          const truncatedName =
            activityName.length > maxNameLength ? `${activityName.substring(0, maxNameLength - 1)}.` : activityName;
          doc.text(truncatedName, legendX + 5, legendY);

          doc.setTextColor(60, 60, 60);
          doc.setFont('helvetica', 'normal');
          const percent = total ? Math.round((item.count / total) * 100) : 0;
          const countText = `${item.count}(${percent}%)`;
          doc.text(countText, colX + colWidth - 4, legendY, { align: 'right' });

          legendY += 6;
        });

        maxYForRow = Math.max(maxYForRow, Math.max(chartCenterY + chartRadius + 5, legendY));
      }

      yPos = maxYForRow + 10;

      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.2);
      doc.line(15, yPos, pageWidth - 15, yPos);
      yPos += 8;
    }

    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(150, 150, 150);
    doc.text('This report was automatically generated by Mindful Map system.', pageWidth / 2, pageHeight - 10, {
      align: 'center'
    });

    const sectionCamel = String(section).replace(/\s+/g, '');
    const emotionCamel = String(emotion).charAt(0).toUpperCase() + String(emotion).slice(1);
    const moodTypeCamel = String(moodType).charAt(0).toUpperCase() + String(moodType).slice(1);
    const periodCamel = String(moodPeriod).charAt(0).toUpperCase() + String(moodPeriod).slice(1);
    const filename = `SectionReport_${sectionCamel}_${emotionCamel}_${moodTypeCamel}_${periodCamel}.pdf`;
    doc.save(filename);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}