import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';

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

const generateSummaryText = (chartId, data) => {
  const { monthlyUsers, monthlyUserData, activeVsInactiveUsersData, dailyMoodLogsData, dailyJournalLogsData, weeklyLogsData, currentWeekStart } = data;
  
  switch (chartId) {
    case 'monthly-users-chart':
      const totalMonthlyUsers = monthlyUsers;
      const highestMonth = monthlyUserData.reduce((max, data) => data.count > max.count ? data : max, { count: 0 }).month || 'N/A';
      const averageMonthlyUsers = monthlyUserData.length > 0 ? 
        (monthlyUserData.reduce((sum, data) => sum + data.count, 0) / monthlyUserData.length).toFixed(2) : 0;
      return `The total number of registered users (students and teachers) across all months is ${totalMonthlyUsers}. The highest number of registrations occurred in ${highestMonth}. The average number of users registered per month is ${averageMonthlyUsers}. This data helps track user growth trends over time and identify seasonal patterns in user registration.`;
    
    case 'active-vs-inactive-students-chart':
      const active = activeVsInactiveUsersData.active || 0;
      const inactive = activeVsInactiveUsersData.inactive || 0;
      const total = active + inactive;
      const activePercentage = total > 0 ? ((active / total) * 100).toFixed(2) : 0;
      return `Currently, there are ${active} active students and ${inactive} inactive students on the platform. Active students represent ${activePercentage}% of the total student base. This ratio is important for understanding student retention and engagement levels across the platform.`;
    
    case 'daily-mood-logs-chart':
      const totalMoodLogs = dailyMoodLogsData.reduce((sum, data) => sum + data.count, 0);
      const avgMoodLogs = dailyMoodLogsData.length > 0 ?
        (totalMoodLogs / dailyMoodLogsData.length).toFixed(2) : 0;
      const highestMoodLogDay = dailyMoodLogsData.reduce((max, data) => data.count > max.count ? data : max, { count: 0 }).date || 'N/A';
      return `Students have recorded a total of ${totalMoodLogs} mood entries across the displayed period. The average is ${avgMoodLogs} mood logs per day, with the highest activity on ${highestMoodLogDay}. This data shows how frequently students are tracking their emotional states.`;
    
    case 'daily-journal-logs-chart':
      const totalJournalLogs = dailyJournalLogsData.reduce((sum, data) => sum + data.count, 0);
      const avgJournalLogs = dailyJournalLogsData.length > 0 ?
        (totalJournalLogs / dailyJournalLogsData.length).toFixed(2) : 0;
      const highestJournalLogDay = dailyJournalLogsData.reduce((max, data) => data.count > max.count ? data : max, { count: 0 }).date || 'N/A';
      return `Students have created a total of ${totalJournalLogs} journal entries during this period. Daily journaling averages ${avgJournalLogs} entries per day, with peak activity occurring on ${highestJournalLogDay}. Journal logs represent deeper student engagement with the reflection process.`;
    
    case 'weekly-logs-by-category-chart':
      if (weeklyLogsData) {
        const { viewType = 'weekly' } = data;
        let dateRange = "";
        const labels = weeklyLogsData.labels || [];
        
        if (viewType === 'weekly') {
          dateRange = labels.length > 0 ? `${labels[0]} - ${labels[labels.length - 1]}` : "Last 8 Weeks";
        } else if (viewType === 'daily') {
          dateRange = labels.length > 0 ? `${labels[0]} - ${labels[labels.length - 1]}` : "Past 30 Days";
        } else {
          dateRange = labels.length > 0 ? `${labels[0]} - ${labels[labels.length - 1]}` : "Last 12 Months";
        }
        
        const activityTotal = weeklyLogsData.activity.reduce((sum, count) => sum + count, 0);
        const socialTotal = weeklyLogsData.social.reduce((sum, count) => sum + count, 0);
        const healthTotal = weeklyLogsData.health.reduce((sum, count) => sum + count, 0);
        const sleepTotal = weeklyLogsData.sleep.reduce((sum, count) => sum + count, 0);
        const grandTotal = activityTotal + socialTotal + healthTotal + sleepTotal;
        
        const activityPercent = grandTotal > 0 ? ((activityTotal / grandTotal) * 100).toFixed(1) : 0;
        const socialPercent = grandTotal > 0 ? ((socialTotal / grandTotal) * 100).toFixed(1) : 0;
        const healthPercent = grandTotal > 0 ? ((healthTotal / grandTotal) * 100).toFixed(1) : 0;
        const sleepPercent = grandTotal > 0 ? ((sleepTotal / grandTotal) * 100).toFixed(1) : 0;
        
        const highestCount = Math.max(...weeklyLogsData.activity, ...weeklyLogsData.social, ...weeklyLogsData.health, ...weeklyLogsData.sleep);
        const highestIndex = weeklyLogsData.activity.indexOf(highestCount) !== -1 ? weeklyLogsData.activity.indexOf(highestCount) : 
                           weeklyLogsData.social.indexOf(highestCount) !== -1 ? weeklyLogsData.social.indexOf(highestCount) :
                           weeklyLogsData.health.indexOf(highestCount) !== -1 ? weeklyLogsData.health.indexOf(highestCount) :
                           weeklyLogsData.sleep.indexOf(highestCount);
        const highestLabel = labels[highestIndex] || 'N/A';
        
        const periodText = viewType === 'weekly' ? `For the past 8 weeks (${dateRange})` : 
                          viewType === 'daily' ? `For the past 30 days (${dateRange})` : 
                          `For the past 12 months (${dateRange})`;

        return `${periodText}, students recorded a total of ${grandTotal} logs across all categories. Activity logs account for ${activityPercent}% (${activityTotal} logs), Social logs for ${socialPercent}% (${socialTotal} logs), Health logs for ${healthPercent}% (${healthTotal} logs), and Sleep logs for ${sleepPercent}% (${sleepTotal} logs).`;
      }
      return "Logs by category data is not available for this period.";
    
    default:
      return "This chart summarizes the data collected within the Mindful Map application. Please refer to the visual representation above for specific data points and trends.";
  }
};

export const generatePDF = async (chartId, title, data) => {
  try {
    let imgData;
    
    // Special handling for weekly logs chart
    if (chartId === 'weekly-logs-by-category-chart') {
      const element = document.querySelector(`#${chartId}`);
      if (!element) {
        throw new Error('Chart element not found');
      }
      // Find the canvas within the chart element
      const canvas = element.querySelector('canvas');
      if (canvas) {
        const tempCanvas = await html2canvas(canvas);
        imgData = tempCanvas.toDataURL('image/png');
      } else {
        // Fallback: capture the whole element
        const tempCanvas = await html2canvas(element);
        imgData = tempCanvas.toDataURL('image/png');
      }
    } else {
      const input = document.querySelector(`#${chartId} canvas`);
      if (!input) {
        throw new Error('Canvas element not found');
      }
      const canvas = await html2canvas(input);
      imgData = canvas.toDataURL('image/png');
    }
    
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const logoSize = 20;
    const headerY = 15;
    
    // Load logos
    const tupLogo = await loadImageAsDataURL('/images/tup.png');
    const mindfulLogo = await loadImageAsDataURL('/images/logo.png');
    
    // TUP Logo (left)
    pdf.addImage(tupLogo, 'PNG', 10, headerY, logoSize, logoSize);
    
    // Mindful Map Logo (right)
    pdf.addImage(mindfulLogo, 'PNG', pageWidth - 15 - logoSize, headerY, logoSize, logoSize);
    
    // Title (center)
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(85, 173, 155);
    const mainTitle = 'Mindful Map: Mood and Habits Analyzer';
    const titleWidth = pdf.getTextWidth(mainTitle);
    pdf.text(mainTitle, (pageWidth - titleWidth) / 2, headerY + 8);
    
    pdf.setFontSize(14);
    const subtitle = 'for Emotional Regulation';
    const subtitleWidth = pdf.getTextWidth(subtitle);
    pdf.text(subtitle, (pageWidth - subtitleWidth) / 2, headerY + 14);
    
    // Timestamp
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100, 100, 100);
    const now = new Date();
    const timestamp = now.toLocaleString('en-US', { 
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    const timestampWidth = pdf.getTextWidth(`Generated: ${timestamp}`);
    pdf.text(`Generated: ${timestamp}`, (pageWidth - timestampWidth) / 2, headerY + 20);
    
    // Horizontal line
    pdf.setDrawColor(85, 173, 155);
    pdf.setLineWidth(0.5);
    pdf.line(15, headerY + 27, pageWidth - 15, headerY + 27);
    
    // Report Details
    let yPos = headerY + 37;
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 0);
    pdf.text(title, pageWidth / 2, yPos, { align: 'center' });
    
    yPos += 8;
    
    // Add view type and period for weekly logs chart
    if (chartId === 'weekly-logs-by-category-chart') {
      const viewTypeLabel = data.viewType ? data.viewType.charAt(0).toUpperCase() + data.viewType.slice(1) : 'Weekly';
      const labels = data.weeklyLogsData?.labels || [];
      const dateRange = labels.length > 0 ? `${labels[0]} - ${labels[labels.length - 1]}` : "";
      const subtitleText = `${viewTypeLabel} | ${dateRange}`;
      
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100, 100, 100);
      pdf.text(subtitleText, pageWidth / 2, yPos, { align: 'center' });
      yPos += 10;
    }
    
    // Summary Box
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    const summary = generateSummaryText(chartId, data);
    const summaryLines = pdf.splitTextToSize(summary, pageWidth - 40);
    const summaryHeight = (summaryLines.length * 5) + 15;
    
    pdf.setFillColor(240, 248, 255);
    pdf.roundedRect(15, yPos, pageWidth - 30, summaryHeight, 3, 3, 'F');
    
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(85, 173, 155);
    pdf.text('Summary Overview', 20, yPos + 7);
    
    pdf.setTextColor(60, 60, 60);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    // Use justify alignment for equal space on both sides
    pdf.text(summaryLines, 20, yPos + 15, { 
      maxWidth: pageWidth - 40, 
      align: 'justify' 
    });
    
    yPos += summaryHeight + 10;
    
    // Chart image
    pdf.setFillColor(255, 255, 255);
    pdf.setDrawColor(85, 173, 155);
    pdf.setLineWidth(0.5);
    pdf.roundedRect(25, yPos, 160, 90, 3, 3, 'FD');
    pdf.addImage(imgData, 'PNG', 35, yPos + 5, 140, 80);
    
    yPos += 100;

    // Table
    if (chartId === 'weekly-logs-by-category-chart' && data.weeklyLogsData) {
      const tableData = data.weeklyLogsData.labels.map((label, index) => [
        label,
        data.weeklyLogsData.activity[index] || 0,
        data.weeklyLogsData.social[index] || 0,
        data.weeklyLogsData.health[index] || 0,
        data.weeklyLogsData.sleep[index] || 0
      ]);

      autoTable(pdf, {
        startY: yPos,
        head: [['Time Period', 'Activity', 'Social', 'Health', 'Sleep']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [85, 173, 155] },
        margin: { left: 15, right: 15 },
        styles: { fontSize: 9 }
      });
    } else if (chartId === 'monthly-users-chart' && data.monthlyUserData) {
        const tableData = data.monthlyUserData.map(item => [item.month, item.count]);
        autoTable(pdf, {
            startY: yPos,
            head: [['Month', 'New Registrations']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [85, 173, 155] },
            margin: { left: 15, right: 15 },
            styles: { fontSize: 9 }
        });
    } else if (chartId === 'active-vs-inactive-students-chart' && data.activeVsInactiveUsersData) {
        const active = data.activeVsInactiveUsersData.active || 0;
        const inactive = data.activeVsInactiveUsersData.inactive || 0;
        const total = active + inactive;
        const tableData = [
            ['Active', active, total > 0 ? `${((active/total)*100).toFixed(1)}%` : '0%'],
            ['Inactive', inactive, total > 0 ? `${((inactive/total)*100).toFixed(1)}%` : '0%'],
            ['Total', total, '100%']
        ];
        autoTable(pdf, {
            startY: yPos,
            head: [['Status', 'Count', 'Percentage']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [85, 173, 155] },
            margin: { left: 15, right: 15 },
            styles: { fontSize: 9 }
        });
    } else if (chartId === 'daily-mood-logs-chart' && data.dailyMoodLogsData) {
        const tableData = data.dailyMoodLogsData.map(item => [item.date, item.count]);
        autoTable(pdf, {
            startY: yPos,
            head: [['Date', 'Mood Logs']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [85, 173, 155] },
            margin: { left: 15, right: 15 },
            styles: { fontSize: 9 }
        });
    } else if (chartId === 'daily-journal-logs-chart' && data.dailyJournalLogsData) {
        const tableData = data.dailyJournalLogsData.map(item => [item.date, item.count]);
        autoTable(pdf, {
            startY: yPos,
            head: [['Date', 'Journal Entries']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [85, 173, 155] },
            margin: { left: 15, right: 15 },
            styles: { fontSize: 9 }
        });
    }
    
    // Footer
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'italic');
    pdf.setTextColor(150, 150, 150);
    pdf.text(
      'This report was automatically generated by Mindful Map system.',
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
    
    let filename = title;
    if (chartId === 'weekly-logs-by-category-chart') {
      const viewTypeLabel = data.viewType ? data.viewType.charAt(0).toUpperCase() + data.viewType.slice(1) : 'Weekly';
      filename = `CategoricalLogsReport_${viewTypeLabel}`;
    } else if (chartId === 'monthly-users-chart') {
      filename = 'UserRegistrationsReport';
    } else if (chartId === 'active-vs-inactive-students-chart') {
      filename = 'StudentStatusReport';
    }
    
    pdf.save(`${filename}.pdf`);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};
