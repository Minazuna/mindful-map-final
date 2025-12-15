import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

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

function formatTimestamp(date) {
  const logDate = new Date(date);
  const dateStr = logDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
  const timeStr = logDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
  return `${dateStr} ${timeStr}`;
}

function toTitleCase(str) {
  if (!str) return '';
  return str.replace(/[-_]/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
}

const activityMap = {
  // Activity category
  'commute': 'Commute',
  'exam': 'Exam',
  'homework': 'Homework',
  'study': 'Study',
  'project': 'Project',
  'read': 'Read',
  'extracurricular': 'Extracurricular Activities',
  'household-chores': 'Household Chores',
  'relax': 'Relax',
  'watch-movie': 'Watch Movie',
  'listen-music': 'Listen to Music',
  'gaming': 'Gaming',
  'browse-internet': 'Browse the Internet',
  'shopping': 'Shopping',
  'travel': 'Travel',
  
  // Social category
  'alone': 'Alone',
  'friends': 'Friend/s',
  'family': 'Family',
  'classmates': 'Classmate/s',
  'relationship': 'Relationship',
  'online': 'Online Interaction',
  'pet': 'Pet',
  
  // Health category
  'jog': 'Jog',
  'walk': 'Walk',
  'exercise': 'Exercise',
  'sports': 'Sports',
  'meditate': 'Meditate',
  'eat-healthy': 'Eat Healthy',
  'no-physical': 'No Physical Activity',
  'eat-unhealthy': 'Eat Unhealthy',
  'drink-alcohol': 'Drink Alcohol',
};

function getActivityName(activityId) {
  return activityMap[activityId] || toTitleCase(activityId);
}

export async function generateStudentLogsPDF(student, logs, section) {
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
    doc.addImage(mindfulLogo, 'PNG', pageWidth - 15 - logoSize, headerY, logoSize, logoSize
        
    );
    
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
    
    // Report Title
    let yPos = headerY + 37;
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Student Mood Logs Report', pageWidth / 2, yPos, { align: 'center' });
    
    // Student Information
    yPos += 12;
    doc.setFillColor(240, 248, 255);
    doc.roundedRect(15, yPos, pageWidth - 30, 20, 3, 3, 'F');
    
    // Student info items in horizontal layout (no label, no total logs)
    const infoItemWidth = (pageWidth - 40) / 3;
    const infoStartY = yPos + 7;
    const drawInfoItem = (x, y, label, value) => {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(85, 173, 155);
      doc.text(label, x, y, { align: 'center' });
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      doc.text(value, x, y + 6, { align: 'center' });
    };
    const infoStartX = 20;
    drawInfoItem(infoStartX + infoItemWidth / 2, infoStartY, 'STUDENT NAME', student.name);
    drawInfoItem(infoStartX + infoItemWidth * 1.5, infoStartY, 'EMAIL', student.email);
    drawInfoItem(infoStartX + infoItemWidth * 2.5, infoStartY, 'SECTION', section ? decodeURIComponent(section) : 'N/A');
    yPos += 25;
    
    if (logs.length === 0) {
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text('No mood logs found for this student.', pageWidth / 2, yPos, { align: 'center' });
    } else {
      // Calculate statistics
      const categoryCount = {
        activity: 0,
        social: 0,
        health: 0,
        sleep: 0
      };
      const emotionCountBefore = {};
      const emotionCountAfter = {};
      
      logs.forEach(log => {
        if (categoryCount.hasOwnProperty(log.category)) {
          categoryCount[log.category]++;
        }
        if (log.beforeEmotion) {
          emotionCountBefore[log.beforeEmotion] = (emotionCountBefore[log.beforeEmotion] || 0) + 1;
        }
        if (log.afterEmotion) {
          emotionCountAfter[log.afterEmotion] = (emotionCountAfter[log.afterEmotion] || 0) + 1;
        }
      });
      
      const topEmotionBefore = Object.keys(emotionCountBefore).length > 0
        ? Object.entries(emotionCountBefore).reduce((a, b) => a[1] > b[1] ? a : b)[0]
        : 'N/A';
      
      const topEmotionAfter = Object.keys(emotionCountAfter).length > 0
        ? Object.entries(emotionCountAfter).reduce((a, b) => a[1] > b[1] ? a : b)[0]
        : 'N/A';
      
      // Statistics cards - 2 rows, 4 columns, with gaps, aligned to container edges
      const cardContainerWidth = pageWidth - 30;
      const cardGap = 4; // increased gap
      const cardWidth = (cardContainerWidth - cardGap * 3) / 4;
      const cardHeight = 28; // increased height
      let cardY = yPos;
      const cardX = 15;
      // Helper function to draw stat card (with entries text)
      const drawStatCard = (x, y, label, value, sublabel = 'entries') => {
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(230, 230, 230);
        doc.setLineWidth(0.3);
        doc.roundedRect(x, y, cardWidth, cardHeight, 4, 4); // rounded corners
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(120, 120, 120);
        doc.text(label, x + cardWidth / 2, y + 7, { align: 'center' });
        doc.setFontSize(18); // larger count
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(85, 173, 155);
        doc.text(value.toString(), x + cardWidth / 2, y + 18, { align: 'center' });
        if (sublabel) {
          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(120, 120, 120);
          doc.text(sublabel, x + cardWidth / 2, y + cardHeight - 5, { align: 'center' });
        }
      };
      // Row 1: Category cards
      drawStatCard(cardX, cardY, 'ACTIVITY LOGS', categoryCount.activity);
      drawStatCard(cardX + cardWidth + cardGap, cardY, 'SOCIAL LOGS', categoryCount.social);
      drawStatCard(cardX + (cardWidth + cardGap) * 2, cardY, 'HEALTH LOGS', categoryCount.health);
      drawStatCard(cardX + (cardWidth + cardGap) * 3, cardY, 'SLEEP LOGS', categoryCount.sleep);
      // Row 2: Emotion and overall (with gaps between all cards)
      cardY += cardHeight + cardGap;
        // Only widen Top Emotion cards, keep Overall card same width as first row
        const wideCardWidth = (cardContainerWidth - cardWidth * 1 - cardGap * 2) / 2;
        // Draw Top Emotion Before (wide)
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(230, 230, 230);
        doc.setLineWidth(0.3);
        doc.roundedRect(cardX, cardY, wideCardWidth, cardHeight, 4, 4);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(120, 120, 120);
        doc.text('TOP EMOTION BEFORE', cardX + wideCardWidth / 2, cardY + 7, { align: 'center' });
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(85, 173, 155);
        doc.text(toTitleCase(topEmotionBefore), cardX + wideCardWidth / 2, cardY + 18, { align: 'center' });
        // Draw Top Emotion After (wide)
        const afterX = cardX + wideCardWidth + cardGap;
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(230, 230, 230);
        doc.setLineWidth(0.3);
        doc.roundedRect(afterX, cardY, wideCardWidth, cardHeight, 4, 4);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(120, 120, 120);
        doc.text('TOP EMOTION AFTER', afterX + wideCardWidth / 2, cardY + 7, { align: 'center' });
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(85, 173, 155);
        doc.text(toTitleCase(topEmotionAfter), afterX + wideCardWidth / 2, cardY + 18, { align: 'center' });
        // Draw Overall card (normal width)
        const overallX = afterX + wideCardWidth + cardGap;
        drawStatCard(overallX, cardY, 'OVERALL', logs.length, '');
      yPos = cardY + cardHeight + 15;
      
      // Add page break before table
      doc.addPage();
      yPos = 20;
      
      // Table data with formatted timestamp
      const tableData = logs.map(log => {
        const timestamp = formatTimestamp(log.date);
        
        return [
          timestamp,
          toTitleCase(log.category),
          log.category === 'sleep' ? `${log.hrs} hours` : getActivityName(log.activity) || 'N/A',
          toTitleCase(log.beforeValence) || 'N/A',
          toTitleCase(log.beforeEmotion) || 'N/A',
          log.beforeIntensity || 'N/A',
          toTitleCase(log.afterValence) || 'N/A',
          toTitleCase(log.afterEmotion) || 'N/A',
          log.afterIntensity || 'N/A'
        ];
      });

      doc.autoTable({
        head: [[
          'TIMESTAMP',
          'CATEGORY',
          'ACTIVITY',
          'BEFORE VALENCE',
          'BEFORE EMOTION',
          'BEFORE    INTENSITY',
          'AFTER VALENCE',
          'AFTER EMOTION',
          'AFTER      INTENSITY',
        ]],
        body: tableData,
        startY: yPos,
        margin: { left: 12, right: 12, top: 10, bottom: 20 },
        styles: { 
          fontSize: 7,
          cellPadding: 2,
          textColor: [50, 50, 50]
        },
        headStyles: { 
          fillColor: [85, 173, 155],
          textColor: 255,
          fontSize: 7,
          fontStyle: 'bold'
        },
        columnStyles: {
          0: { cellWidth: 32 },
          1: { cellWidth: 18 },
          2: { cellWidth: 25 },
          3: { cellWidth: 18 },
          4: { cellWidth: 21 },
          5: { cellWidth: 17 },
          6: { cellWidth: 18 },
          7: { cellWidth: 21 },
          8: { cellWidth: 17 }
        },
        didDrawPage: (data) => {
          // Footer
          const pageCount = doc.getNumberOfPages();
          const footerY = pageHeight - 15;
          doc.setFontSize(8);
          doc.setTextColor(150, 150, 150);
          doc.text(
            `Page ${data.pageNumber} of ${pageCount}`,
            pageWidth / 2,
            footerY,
            { align: 'center' }
          );
        }
      });
    }

    // Save the PDF
    doc.save(`${student.name.replace(/\s+/g, '_')}_Mood_Logs.pdf`);
    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}
