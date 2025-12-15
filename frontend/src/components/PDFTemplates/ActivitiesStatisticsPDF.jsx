import jsPDF from 'jspdf';

const pieColors = [
  '#8FABD4', '#59AC77', '#FF714B', '#f7b40bff', '#F564A9',
  '#A9A9A9', '#092b9cff', '#4e4d4dff', '#cc062dff', '#fdf8fdff'
];

function beautifyName(name) {
  if (!name) return '';
  let str = name.replace(/-/g, ' ');
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function getSummaryPhrase(title, data) {
  if (!data || data.length === 0) return `No data for this category.`;
  const top = data[0];
  if (!top) return `No data for this category.`;
  if (title === 'Sleep') {
    return `Most students logged "${beautifyName(top.activity)}" hours of sleep most often (${top.count} times, ${top.percent}%). Getting enough sleep is important for your mood and focus!`;
  }
  if (top.percent >= 50) {
    return `The activity "${beautifyName(top.activity)}" made up more than half of your logs for this category (${top.count} times, ${top.percent}%).`;
  }
  if (top.percent >= 30) {
    return `"${beautifyName(top.activity)}" was the most common in this category (${top.count} times, ${top.percent}%).`;
  }
  return `You did "${beautifyName(top.activity)}" most often in this category (${top.count} times, ${top.percent}%).`;
}

function getOverallSummary(sectionsData) {
  const categoryCounts = sectionsData.map(section => ({
    category: section.title,
    total: section.data.reduce((sum, item) => sum + item.count, 0)
  }));
  
  const maxCategory = categoryCounts.reduce((max, curr) => 
    curr.total > max.total ? curr : max, 
    categoryCounts[0]
  );
  
  if (!maxCategory || maxCategory.total === 0) {
    return 'No activities recorded during this period.';
  }
  
  return `The "${maxCategory.category}" category had the most recorded activities with ${maxCategory.total} total entries across this period.`;
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

function drawDonutChart(doc, centerX, centerY, radius, data, colors) {
  const total = data.reduce((sum, item) => sum + item.count, 0);
  if (total === 0) return;

  let currentAngle = -Math.PI / 2;
  const innerRadius = radius * 0.68;

  data.forEach((item, idx) => {
    const percent = item.count / total;
    const sliceAngle = percent * 2 * Math.PI;
    const endAngle = currentAngle + sliceAngle;
    const midAngle = currentAngle + sliceAngle / 2;

    // Draw outer arc
    doc.setFillColor(colors[idx % colors.length]);
    doc.circle(centerX, centerY, radius, 'F');

    // Draw slice
    const startX = centerX + radius * Math.cos(currentAngle);
    const startY = centerY + radius * Math.sin(currentAngle);
    const endX = centerX + radius * Math.cos(endAngle);
    const endY = centerY + radius * Math.sin(endAngle);

    doc.setFillColor(colors[idx % colors.length]);
    
    // Create path for the slice
    doc.lines(
      [
        [radius * Math.cos(currentAngle), radius * Math.sin(currentAngle)],
        [radius * Math.cos(endAngle), radius * Math.sin(endAngle)],
        [0, 0]
      ],
      centerX,
      centerY,
      [1, 1],
      'F'
    );

    // Draw label with count
    const labelX = centerX + (radius * 0.7) * Math.cos(midAngle);
    const labelY = centerY + (radius * 0.7) * Math.sin(midAngle);
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(item.count.toString(), labelX, labelY, { align: 'center' });

    currentAngle = endAngle;
  });

  // Draw inner circle (white) to create donut effect
  doc.setFillColor(255, 255, 255);
  doc.circle(centerX, centerY, innerRadius, 'F');
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

export async function generateActivitiesStatisticsPDF(emotion, moodType, moodPeriod, sectionsData) {
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
    doc.text(`Activities Report: ${beautifyName(emotion)}`, pageWidth / 2, yPos, { align: 'center' });
    
    yPos += 8;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    const periodText = `${moodType === 'before' ? 'Before' : 'After'} Emotion · ${moodPeriod.charAt(0).toUpperCase() + moodPeriod.slice(1)} Period`;
    doc.text(periodText, pageWidth / 2, yPos, { align: 'center' });
    
    // Overall Summary
    yPos += 12;
    doc.setFillColor(240, 248, 255);
    doc.roundedRect(15, yPos, pageWidth - 30, 20, 3, 3, 'F');
    
    doc.setFontSize(12); 
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(85, 173, 155);
    doc.text('Overall Summary', 20, yPos + 7);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(10); // Increased font size for overall summary phrases
    const overallSummary = getOverallSummary(sectionsData);
    const summaryLines = doc.splitTextToSize(overallSummary, pageWidth - 40);
    doc.text(summaryLines, 20, yPos + 15);
    
    yPos += 30;
    
    // Draw each category chart in 2-column layout
    const categoryColors = {
      'Activity': [14, 165, 233],
      'Social': [249, 149, 43],
      'Health': [34, 197, 94],
      'Sleep': [99, 102, 241]
    };
    
    for (let i = 0; i < sectionsData.length; i += 2) {
      // Check if we need a new page
      if (yPos > pageHeight - 95) {
        doc.addPage();
        yPos = 20;
      }
      
      const section1 = sectionsData[i];
      const section2 = i + 1 < sectionsData.length ? sectionsData[i + 1] : null;
      
      // Render two columns (aligned with overall summary box margins)
      const leftMargin = 15; // match summary box margins
      const rightMargin = 15;
      const columnGap = 10; // gap between columns
      const availableWidth = pageWidth - leftMargin - rightMargin;
      const colWidth = (availableWidth - columnGap) / 2;
      const col1X = leftMargin;
      const col2X = col1X + colWidth + columnGap;
      let maxYForRow = yPos;
      
      for (let col = 0; col < 2; col++) {
        const section = col === 0 ? section1 : section2;
        if (!section) continue;
        
        const colX = col === 0 ? col1X : col2X;
        let sectionY = yPos;
        
        // Category title
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        const color = categoryColors[section.title] || [85, 173, 155];
        doc.setTextColor(color[0], color[1], color[2]);
        doc.text(section.title, colX, sectionY);
        
        sectionY += 8;
        
        if (section.data.length === 0) {
          doc.setFontSize(9);
          doc.setFont('helvetica', 'italic');
          doc.setTextColor(150, 150, 150);
          doc.text('No data for this category.', colX + 5, sectionY);
          maxYForRow = Math.max(maxYForRow, sectionY + 15);
          continue;
        }
        
        // Summary box
        doc.setFillColor(250, 250, 250);
        doc.roundedRect(colX, sectionY, colWidth, 15, 2, 2, 'F');
        
        doc.setFontSize(9); 
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(80, 80, 80);
        const summary = getSummaryPhrase(section.title, section.data);
        const summaryTextLines = doc.splitTextToSize(summary, colWidth - 8);
        doc.text(summaryTextLines, colX + 3, sectionY + 5);
        
        sectionY += 18;
        
        // Donut chart
        const chartCenterX = colX + 15;
        const chartCenterY = sectionY + 20;
        const chartRadius = 16;
        
        const total = section.data.reduce((sum, item) => sum + item.count, 0);
        
        // Draw donut chart using pie slices
        let currentAngle = -Math.PI / 2;
        const innerRadius = chartRadius * 0.68;
        
        // Draw all slices first
        section.data.forEach((item, idx) => {
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
        
        // Inner white circle
        doc.setFillColor(255, 255, 255);
        doc.circle(chartCenterX, chartCenterY, innerRadius, 'F');
        
        // Total in center
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(85, 173, 155);
        doc.text(total.toString(), chartCenterX, chartCenterY - 2, { align: 'center' });
        doc.setFontSize(7);
        doc.setTextColor(100, 100, 100);
        doc.text('total', chartCenterX, chartCenterY + 3, { align: 'center' });
        
        // Draw labels AFTER inner circle (so they're visible)
        currentAngle = -Math.PI / 2;
        section.data.forEach((item, idx) => {
          const percent = item.count / total;
          const sliceAngle = percent * 2 * Math.PI;
          const endAngle = currentAngle + sliceAngle;
          const midAngle = currentAngle + sliceAngle / 2;
          
          // Position label at 55% radius (between inner and outer edge)
          const labelRadius = (chartRadius + innerRadius) / 2;
          const labelX = chartCenterX + labelRadius * Math.cos(midAngle);
          const labelY = chartCenterY + labelRadius * Math.sin(midAngle);
          
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(9);
          doc.setFont('helvetica', 'bold');
          doc.text(item.count.toString(), labelX, labelY, { align: 'center', baseline: 'middle' });
          
          currentAngle = endAngle;
        });
        
        // Legend (on the right side with more space)
        const legendX = colX + 38;
        let legendY = sectionY + 3;
        
        doc.setFontSize(8);
        section.data.forEach((item, idx) => {
          const colorHex = pieColors[idx % pieColors.length];
          const r = parseInt(colorHex.slice(1, 3), 16);
          const g = parseInt(colorHex.slice(3, 5), 16);
          const b = parseInt(colorHex.slice(5, 7), 16);
          
          // Color box
          doc.setFillColor(r, g, b);
          doc.roundedRect(legendX, legendY - 2.5, 3, 3, 0.3, 0.3, 'F');
          
          // Activity name
          doc.setTextColor(85, 173, 155);
          doc.setFont('helvetica', 'bold');
          const activityName = section.isSleepHours 
            ? `${item.activity}h` 
            : beautifyName(item.activity);
          const maxNameLength = 18;
          const truncatedName = activityName.length > maxNameLength ? activityName.substring(0, maxNameLength - 1) + '.' : activityName;
          doc.text(truncatedName, legendX + 5, legendY);
          
          // Count and percentage
          doc.setTextColor(60, 60, 60);
          doc.setFont('helvetica', 'normal');
          const percent = total ? Math.round((item.count / total) * 100) : 0;
          const countText = `${item.count}(${percent}%)`;
          // Right-align the count closer to the activity name
          doc.text(countText, colX + colWidth - 4, legendY, { align: 'right' });
          
          legendY += 6;
        });
        
        maxYForRow = Math.max(maxYForRow, Math.max(chartCenterY + chartRadius + 5, legendY));
      }
      
      yPos = maxYForRow + 10;
      
      // Separator line
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.2);
      doc.line(15, yPos, pageWidth - 15, yPos);
      yPos += 8;
    }
    
    // Footer on last page
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(150, 150, 150);
    doc.text(
      'This report was automatically generated by Mindful Map system.',
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
    
    // Save PDF with clean filename (camelCase, no timestamps)
    const emotionCamel = emotion.charAt(0).toUpperCase() + emotion.slice(1);
    const moodTypeCamel = moodType.charAt(0).toUpperCase() + moodType.slice(1);
    const periodCamel = moodPeriod.charAt(0).toUpperCase() + moodPeriod.slice(1);
    const filename = `ActivitiesReport_${emotionCamel}_${moodTypeCamel}_${periodCamel}.pdf`;
    doc.save(filename);
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}
