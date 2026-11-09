import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Institutional branding constants
const INSTITUTION_NAME = 'Dr. M.G.R. EDUCATIONAL AND RESEARCH INSTITUTE';
const DEEMED_AUTONOMY = 'Deemed to be University | Graded Autonomy Status | Accredited with A+ Grade by NAAC';
const CHAPTER_NAME = 'THE INSTITUTION OF ENGINEERS (INDIA) - MGR STUDENT CHAPTER';
const SUB_TEXT = 'Established by Royal Charter 1935 | Technical & Committee Affairs Directorate';

/**
 * Common header for all official institutional PDFs
 */
function addInstitutionalHeader(doc, title) {
  doc.setFillColor(11, 37, 69); // #0B2545 IEI Navy
  doc.rect(0, 0, 210, 32, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(INSTITUTION_NAME, 105, 11, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(DEEMED_AUTONOMY, 105, 17, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(227, 193, 72); // Gold
  doc.text(CHAPTER_NAME, 105, 24, { align: 'center' });

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.setTextColor(200, 215, 235);
  doc.text(SUB_TEXT, 105, 29, { align: 'center' });

  // Document Title Banner
  doc.setFillColor(241, 245, 249);
  doc.rect(0, 32, 210, 12, 'F');
  doc.setTextColor(11, 37, 69);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(title.toUpperCase(), 105, 40, { align: 'center' });

  // Border line
  doc.setDrawColor(197, 155, 39); // IEI Gold
  doc.setLineWidth(0.6);
  doc.line(14, 44, 196, 44);
}

function addInstitutionalFooter(doc) {
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);

    doc.setDrawColor(220, 220, 220);
    doc.line(14, 282, 196, 282);

    doc.text(`Official Document — MGR IEI Student Chapter Management System`, 14, 287);
    doc.text(`Generated: ${new Date().toLocaleString()} | Page ${i} of ${pageCount}`, 196, 287, { align: 'right' });
  }
}

/**
 * Generates an official Work Report & Approval Trail PDF
 */
export function generateWorkReportPDF(task) {
  const doc = new jsPDF();
  addInstitutionalHeader(doc, 'OFFICIAL WORK COMPLETION & APPROVAL RECORD');

  let y = 52;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(11, 37, 69);
  doc.text('1. TASK & ASSIGNMENT DETAILS', 14, y);
  y += 6;

  autoTable(doc, {
    startY: y,
    theme: 'grid',
    headStyles: { fillColor: [11, 37, 69], textColor: [255, 255, 255] },
    body: [
      ['Task Title', task.title],
      ['Status', task.status],
      ['Assigned To', `${task.assignedToName} (${task.assignedToRole})`],
      ['Assigned By', `${task.assignedByName} (${task.assignedByRole})`],
      ['Assigned Date', task.assignedDate || 'N/A'],
      ['Due Date', task.dueDate || 'N/A'],
      ['Description', task.description || 'N/A']
    ],
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 45, fillColor: [248, 250, 252] },
      1: { cellWidth: 137 }
    }
  });

  y = doc.lastAutoTable.finalY + 12;

  // Submitted Report Section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(11, 37, 69);
  doc.text('2. SUBMITTED WORK REPORT', 14, y);
  y += 6;

  const rep = task.submittedReport || {};
  autoTable(doc, {
    startY: y,
    theme: 'grid',
    body: [
      ['Report Title', rep.title || 'N/A'],
      ['Submitted By', `${rep.submittedByName || task.assignedToName} (${rep.submittedByRole || task.assignedToRole})`],
      ['Submitted At', rep.submittedAt ? new Date(rep.submittedAt).toLocaleString() : 'N/A'],
      ['Work Summary', rep.summary || 'N/A'],
      ['Attachments', rep.attachments?.map((a) => a.name).join(', ') || 'None']
    ],
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 45, fillColor: [248, 250, 252] },
      1: { cellWidth: 137 }
    }
  });

  y = doc.lastAutoTable.finalY + 12;

  // Institutional Approval History Trail (MANDATORY REQUIREMENT)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(11, 37, 69);
  doc.text('3. TWO-LEVEL APPROVAL AUDIT TRAIL', 14, y);
  y += 6;

  const firstLevel = rep.firstLevelApproval;
  const finalApp = rep.finalApproval;
  const rej = rep.rejection;

  const approvalRows = [];

  if (firstLevel) {
    approvalRows.push([
      'First-Level Approval',
      'APPROVED',
      `${firstLevel.approvedByName} — ${firstLevel.approvedByRole}`,
      new Date(firstLevel.approvedAt).toLocaleString(),
      firstLevel.remarks || 'Approved'
    ]);
  } else {
    approvalRows.push(['First-Level Approval', 'PENDING / DIRECT', 'N/A', 'N/A', 'Awaiting review or forwarded directly']);
  }

  if (finalApp) {
    approvalRows.push([
      'Final Staff Coordinator Approval',
      'OFFICIALLY COMPLETED',
      `${finalApp.approvedByName} — ${finalApp.approvedByRole}`,
      new Date(finalApp.approvedAt).toLocaleString(),
      finalApp.remarks || 'Approved'
    ]);
  } else if (rej) {
    approvalRows.push([
      'Review Decision',
      'REJECTED',
      `${rej.rejectedByName} — ${rej.rejectedByRole}`,
      new Date(rej.rejectedAt).toLocaleString(),
      rej.reason || 'Returned for correction'
    ]);
  } else {
    approvalRows.push(['Final Staff Coordinator Approval', 'PENDING FINAL REVIEW', 'Admin (Staff Coordinator)', 'N/A', 'Pending official sign-off']);
  }

  autoTable(doc, {
    startY: y,
    theme: 'striped',
    head: [['Stage', 'Decision', 'Approver Identity', 'Timestamp', 'Remarks']],
    headStyles: { fillColor: [19, 74, 138], textColor: [255, 255, 255], fontStyle: 'bold' },
    body: approvalRows,
    styles: { fontSize: 8.5 }
  });

  // Signature Blocks
  y = doc.lastAutoTable.finalY + 22;
  if (y > 240) {
    doc.addPage();
    y = 40;
  }

  doc.setDrawColor(150, 150, 150);
  doc.line(20, y, 75, y);
  doc.line(135, y, 190, y);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(11, 37, 69);
  doc.text('FIRST-LEVEL APPROVER', 47.5, y + 5, { align: 'center' });
  doc.text('STAFF COORDINATOR / ADMIN', 162.5, y + 5, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(firstLevel ? `${firstLevel.approvedByName}\n${firstLevel.approvedByRole}` : '(Seal & Signature)', 47.5, y + 10, { align: 'center' });
  doc.text(finalApp ? `${finalApp.approvedByName}\nStaff Coordinator, IEI Student Chapter` : '(Seal & Signature)', 162.5, y + 10, { align: 'center' });

  addInstitutionalFooter(doc);
  doc.save(`IEI_Work_Report_${task.id}.pdf`);
}

/**
 * Generates an official Weekly Status Report PDF
 */
export function generateWeeklyStatusPDF(weekLabel, tasks, summary) {
  const doc = new jsPDF('landscape');
  addInstitutionalHeader(doc, `WEEKLY STATUS & CHAPTER PROGRESS REPORT — ${weekLabel}`);

  let y = 50;

  // Summary Cards Table
  autoTable(doc, {
    startY: y,
    theme: 'grid',
    head: [['Total Work Assigned', 'Completed (Final Approved)', 'In Progress', 'Awaiting Approval', 'Rejected']],
    headStyles: { fillColor: [11, 37, 69], textColor: [255, 255, 255], halign: 'center' },
    body: [[
      summary.total,
      summary.completed,
      summary.inProgress,
      summary.awaitingApproval,
      summary.rejected
    ]],
    bodyStyles: { halign: 'center', fontStyle: 'bold', fontSize: 11 }
  });

  y = doc.lastAutoTable.finalY + 10;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(11, 37, 69);
  doc.text('DETAILED WEEKLY TASK REGISTER', 14, y);
  y += 4;

  const tableRows = tasks.map((t) => [
    t.title,
    t.assignedToName,
    t.assignedToRole,
    t.status,
    t.dueDate || 'N/A',
    t.submittedReport?.firstLevelApproval ? `${t.submittedReport.firstLevelApproval.approvedByName} (${t.submittedReport.firstLevelApproval.approvedByRole})` : 'Pending/Direct',
    t.submittedReport?.finalApproval ? t.submittedReport.finalApproval.approvedByName : 'Pending Final'
  ]);

  autoTable(doc, {
    startY: y,
    theme: 'striped',
    head: [['Work / Task Title', 'Assigned To', 'Role', 'Status', 'Due Date', '1st-Level Approver', 'Final Approver']],
    headStyles: { fillColor: [19, 74, 138], textColor: [255, 255, 255] },
    body: tableRows,
    styles: { fontSize: 8 }
  });

  addInstitutionalFooter(doc);
  doc.save(`IEI_Weekly_Status_${weekLabel.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
}

/**
 * Generates official Committee Meeting or Event Attendance PDF
 */
export function generateAttendancePDF(attendance) {
  const doc = new jsPDF();
  addInstitutionalHeader(doc, 'OFFICIAL COMMITTEE MEETING / EVENT ATTENDANCE REGISTER');

  let y = 52;
  autoTable(doc, {
    startY: y,
    theme: 'grid',
    body: [
      ['Meeting / Event', attendance.eventTitle],
      ['Category', attendance.category || 'Official Committee Meeting'],
      ['Date Recorded', attendance.date],
      ['Recorded By', `${attendance.recordedByName} (${attendance.recordedByRole})`],
      ['Official Notes', attendance.notes || 'No special remarks recorded.']
    ],
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 45, fillColor: [248, 250, 252] },
      1: { cellWidth: 137 }
    }
  });

  y = doc.lastAutoTable.finalY + 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(11, 37, 69);
  doc.text('COMMITTEE MEMBER ATTENDANCE ROLL', 14, y);
  y += 4;

  const rows = (attendance.records || []).map((r, i) => [
    i + 1,
    r.name,
    r.role,
    r.status.toUpperCase(),
    r.status === 'Present' ? 'Attended' : r.status === 'Excused' ? 'Leave Granted' : 'Absent'
  ]);

  autoTable(doc, {
    startY: y,
    theme: 'striped',
    head: [['S.No', 'Member Name', 'Chapter Role', 'Status', 'Remarks']],
    headStyles: { fillColor: [11, 37, 69], textColor: [255, 255, 255] },
    body: rows,
    styles: { fontSize: 8.5 }
  });

  // Footer signature
  y = doc.lastAutoTable.finalY + 20;
  if (y > 245) {
    doc.addPage();
    y = 40;
  }
  doc.setDrawColor(160, 160, 160);
  doc.line(130, y, 190, y);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('STAFF COORDINATOR / SECRETARY', 160, y + 5, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.text('Verified Official Record', 160, y + 10, { align: 'center' });

  addInstitutionalFooter(doc);
  doc.save(`IEI_Attendance_${attendance.id}.pdf`);
}
