import { ROLES, WORK_STATUSES, FIRST_LEVEL_APPROVER_ROLES, isFirstLevelApprover, isStaffCoordinator } from '../config/roles.js';
import { updateTask, createNotification, getSubmissionRules } from './firebaseService.js';
import { recordActivity, AUDIT_ACTIONS, AUDIT_MODULES } from './auditService.js';
import { isDateInCurrentWeekKolkata, getKolkataCurrentDateString } from '../utils/dateUtils.js';

/**
 * Validates whether work submission is allowed on the specified workDate:
 * When weekly restriction is ON:
 * - Students can submit work only for dates within the current week (Monday through Sunday, Asia/Kolkata).
 * - Previous week or backdated submissions are blocked.
 * When weekly restriction is OFF:
 * - Students can submit work completed on any past date.
 */
export async function validateSubmissionDatePolicy(workDate) {
  const rules = await getSubmissionRules();
  if (rules && rules.weeklyRestriction) {
    const isCurrent = isDateInCurrentWeekKolkata(workDate);
    if (!isCurrent) {
      throw new Error(
        'Weekly submission restriction is active. Students can submit work only for dates within the current week (Monday through Sunday).'
      );
    }
  }
  return true;
}

/**
 * Records an incremental work progress update or final work submission.
 * Preserves full history of multiple progress updates per task.
 * Tracks actual hours worked and minutes worked (0-59).
 */
export async function recordWorkProgress(task, progressData, submitter) {
  if (!task || !task.id) throw new Error('Task identifier is required.');
  if (!submitter || !submitter.id) throw new Error('Authenticated submitter identity required.');

  // Check work date against Weekly Restriction Policy
  const workDate = progressData.workDate || getKolkataCurrentDateString();
  await validateSubmissionDatePolicy(workDate);

  const hours = Math.max(0, parseInt(progressData.hoursWorked, 10) || 0);
  const minutes = Math.max(0, Math.min(59, parseInt(progressData.minutesWorked, 10) || 0));
  const sessionMinutes = (hours * 60) + minutes;
  const progressPct = Math.max(0, Math.min(100, Number(progressData.progressPercentage) || 0));

  const progressEntry = {
    id: `prog-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    updatedAt: new Date().toISOString(),
    workDate,
    progressPercentage: progressPct,
    description: progressData.description || '',
    completedWork: progressData.completedWork || '',
    remainingWork: progressData.remainingWork || '',
    hoursWorked: hours,
    minutesWorked: minutes,
    totalMinutes: sessionMinutes,
    attachments: progressData.attachments || progressData.evidenceFiles || [],
    isFinalReport: Boolean(progressData.isFinalReport),
    updatedById: submitter.id,
    updatedByName: submitter.name,
    updatedByRole: submitter.role
  };

  const existingHistory = Array.isArray(task.progressHistory) ? [...task.progressHistory] : [];
  existingHistory.push(progressEntry);

  const totalTaskMinutes = existingHistory.reduce(
    (acc, curr) => acc + (Number(curr.totalMinutes) || 0),
    0
  );
  const totalTaskHours = Number((totalTaskMinutes / 60).toFixed(2));

  // Determine status transition
  let newStatus = task.status || WORK_STATUSES.ASSIGNED;
  let submittedReport = task.submittedReport || null;

  if (progressData.isFinalReport || progressPct === 100) {
    const isSubmitterFirstLevel = isFirstLevelApprover(submitter.role);
    newStatus = isSubmitterFirstLevel
      ? WORK_STATUSES.PENDING_FINAL
      : WORK_STATUSES.PENDING_FIRST_LEVEL;

    submittedReport = {
      id: `rep-${Date.now()}`,
      title: progressData.title || `Work Report: ${task.title}`,
      summary: progressData.description || progressData.completedWork || task.title,
      completedWork: progressData.completedWork || '',
      remainingWork: progressData.remainingWork || '',
      submittedAt: new Date().toISOString(),
      workDate,
      hoursWorked: hours,
      minutesWorked: minutes,
      totalMinutes: sessionMinutes,
      submittedById: submitter.id,
      submittedByName: submitter.name,
      submittedByRole: submitter.role,
      attachments: progressEntry.attachments,
      firstLevelApproval: null,
      finalApproval: null,
      rejectionHistory: task.submittedReport?.rejection ? [task.submittedReport.rejection] : []
    };
  } else {
    // If not final and previously Assigned, advance to In Progress
    if (newStatus === WORK_STATUSES.ASSIGNED || newStatus === 'Not Started') {
      newStatus = WORK_STATUSES.IN_PROGRESS;
    }
  }

  const updatedTask = await updateTask(task.id, {
    progress: progressPct,
    status: newStatus,
    totalHoursWorked: totalTaskHours,
    totalMinutesWorked: totalTaskMinutes,
    progressHistory: existingHistory,
    ...(submittedReport ? { submittedReport } : {})
  });

  // Audit recording
  const isFinal = Boolean(progressData.isFinalReport || progressPct === 100);
  recordActivity({
    actor: submitter,
    action: isFinal ? AUDIT_ACTIONS.WORK_REPORT_SUBMITTED : AUDIT_ACTIONS.WORK_PROGRESS_UPDATED,
    module: AUDIT_MODULES.WORK,
    status: 'SUCCESS',
    details: isFinal
      ? `Final work report submitted by ${submitter.name} (${submitter.role}) for task "${task.title}". Logged ${hours}h ${minutes}m. Status transitioned to ${newStatus}.`
      : `Progress updated by ${submitter.name} on task "${task.title}" to ${progressPct}%. Logged ${hours}h ${minutes}m.`,
    targetId: task.id,
    newValues: { progress: progressPct, status: newStatus, totalTaskHours }
  });

  // Notifications if submitted for approval
  if (isFinal) {
    const isSubmitterFirstLevel = isFirstLevelApprover(submitter.role);
    if (isSubmitterFirstLevel) {
      await createNotification({
        recipientRole: ROLES.STAFF_COORDINATOR,
        title: 'Officer Work Report Awaiting Final Review',
        message: `${submitter.name} (${submitter.role}) submitted work report for "${task.title}". Direct Staff Coordinator review required.`,
        type: 'pending_final_approval',
        linkId: task.id
      });
    } else {
      FIRST_LEVEL_APPROVER_ROLES.forEach(async (role) => {
        await createNotification({
          recipientRole: role,
          title: 'Work Report Submitted for First-Level Review',
          message: `${submitter.name} (${submitter.role}) submitted work report for "${task.title}". First-level review needed.`,
          type: 'pending_first_level_review',
          linkId: task.id
        });
      });
    }
  }

  return updatedTask;
}

/**
 * Submits a work report for an assigned task.
 * If the submitter is an ordinary member, status becomes: 'Pending First-Level Approval'.
 * If the submitter is a First-Level Approver (Chairman, Vice Chairman, Secretary, Joint Secretary),
 * their report is forwarded DIRECTLY to Admin (Staff Coordinator) with status: 'Pending Final Approval'.
 */
export async function submitWorkReport(task, reportData, submitter) {
  // Validate submission date policy
  const workDate = reportData.workDate || getKolkataCurrentDateString();
  await validateSubmissionDatePolicy(workDate);

  const hours = Math.max(0, parseInt(reportData.hoursWorked, 10) || 0);
  const minutes = Math.max(0, Math.min(59, parseInt(reportData.minutesWorked, 10) || 0));
  const sessionMinutes = (hours * 60) + minutes;

  const isSubmitterFirstLevel = isFirstLevelApprover(submitter.role);

  // Status determined by role hierarchy
  const newStatus = isSubmitterFirstLevel
    ? WORK_STATUSES.PENDING_FINAL
    : WORK_STATUSES.PENDING_FIRST_LEVEL;

  const report = {
    id: `rep-${Date.now()}`,
    title: reportData.title || task.title,
    summary: reportData.summary || reportData.description || '',
    completedWork: reportData.completedWork || reportData.summary || '',
    remainingWork: reportData.remainingWork || '',
    workDate,
    hoursWorked: hours,
    minutesWorked: minutes,
    totalMinutes: sessionMinutes,
    submittedAt: new Date().toISOString(),
    submittedById: submitter.id,
    submittedByName: submitter.name,
    submittedByRole: submitter.role,
    attachments: reportData.attachments || [],
    firstLevelApproval: null,
    finalApproval: null,
    rejectionHistory: task.submittedReport?.rejection ? [task.submittedReport.rejection] : []
  };

  // Add to progress history
  const existingHistory = Array.isArray(task.progressHistory) ? [...task.progressHistory] : [];
  existingHistory.push({
    id: `prog-${Date.now()}`,
    updatedAt: new Date().toISOString(),
    workDate,
    progressPercentage: 100,
    description: report.summary,
    completedWork: report.completedWork,
    remainingWork: report.remainingWork,
    hoursWorked: hours,
    minutesWorked: minutes,
    totalMinutes: sessionMinutes,
    attachments: report.attachments,
    isFinalReport: true,
    updatedById: submitter.id,
    updatedByName: submitter.name,
    updatedByRole: submitter.role
  });

  const totalTaskMinutes = existingHistory.reduce(
    (acc, curr) => acc + (Number(curr.totalMinutes) || 0),
    0
  );
  const totalTaskHours = Number((totalTaskMinutes / 60).toFixed(2));

  const updatedTask = await updateTask(task.id, {
    status: newStatus,
    progress: 100,
    totalHoursWorked: totalTaskHours,
    totalMinutesWorked: totalTaskMinutes,
    progressHistory: existingHistory,
    submittedReport: report
  });

  // Record audit trail
  recordActivity({
    actor: submitter,
    action: AUDIT_ACTIONS.WORK_REPORT_SUBMITTED,
    module: AUDIT_MODULES.WORK,
    status: 'SUCCESS',
    details: `Work report submitted by ${submitter.name} (${submitter.role}) for task "${task.title}". Status transitioned to ${newStatus}.`,
    targetId: task.id,
    newValues: { status: newStatus, summary: reportData.summary }
  });

  // Distribute targeted notifications
  if (isSubmitterFirstLevel) {
    // Notify Staff Coordinator directly
    await createNotification({
      recipientRole: ROLES.STAFF_COORDINATOR,
      title: 'Officer Work Report Awaiting Final Review',
      message: `${submitter.name} (${submitter.role}) submitted work report for "${task.title}". Direct Staff Coordinator review required.`,
      type: 'pending_final_approval',
      linkId: task.id
    });
  } else {
    // Notify First-Level Approvers (Chairman, Vice Chairman, Secretary, Joint Secretary)
    FIRST_LEVEL_APPROVER_ROLES.forEach(async (role) => {
      await createNotification({
        recipientRole: role,
        title: 'Work Report Submitted for First-Level Review',
        message: `${submitter.name} (${submitter.role}) submitted work report for "${task.title}". First-level review needed.`,
        type: 'pending_first_level_review',
        linkId: task.id
      });
    });
  }

  return updatedTask;
}

/**
 * First-Level Approver reviews a submitted work report.
 * Authorized for: Chairman, Vice Chairman, Secretary, Joint Secretary.
 */
export async function processFirstLevelReview(task, approver, decision, remarks) {
  if (!isFirstLevelApprover(approver.role)) {
    throw new Error('Unauthorized: Only Chairman, Vice Chairman, Secretary, or Joint Secretary can perform first-level review.');
  }

  if (task.status !== WORK_STATUSES.PENDING_FIRST_LEVEL) {
    throw new Error(`Invalid state: Report is in status "${task.status}" and cannot receive first-level review.`);
  }

  const report = { ...task.submittedReport };

  if (decision === 'approve') {
    report.firstLevelApproval = {
      approvedById: approver.id,
      approvedByName: approver.name,
      approvedByRole: approver.role,
      approvedAt: new Date().toISOString(),
      remarks: remarks || 'Approved at First Level.'
    };

    const updatedTask = await updateTask(task.id, {
      status: WORK_STATUSES.PENDING_FINAL,
      submittedReport: report
    });

    // Record audit trail
    recordActivity({
      actor: approver,
      action: AUDIT_ACTIONS.WORK_LEVEL1_APPROVED,
      module: AUDIT_MODULES.WORK,
      status: 'SUCCESS',
      details: `First-level review approved by ${approver.name} (${approver.role}) for "${task.title}". Remarks: "${remarks || 'Approved'}".`,
      targetId: task.id,
      previousValues: { status: task.status },
      newValues: { status: WORK_STATUSES.PENDING_FINAL, remarks }
    });

    // Notify Staff Coordinator for Final Approval
    await createNotification({
      recipientRole: ROLES.STAFF_COORDINATOR,
      title: 'First-Level Approved — Final Sign-Off Required',
      message: `Work report for "${task.title}" was approved by ${approver.name} (${approver.role}). Awaiting your final Staff Coordinator decision.`,
      type: 'pending_final_approval',
      linkId: task.id
    });

    // Notify the submitting member
    await createNotification({
      recipientId: task.assignedToId,
      title: 'First-Level Approval Granted',
      message: `Your report for "${task.title}" was approved by ${approver.name} (${approver.role}) and forwarded to Staff Coordinator for final approval.`,
      type: 'first_level_approved',
      linkId: task.id
    });

    return updatedTask;
  } else if (decision === 'reject') {
    report.rejection = {
      rejectedById: approver.id,
      rejectedByName: approver.name,
      rejectedByRole: approver.role,
      rejectedAt: new Date().toISOString(),
      level: 'First-Level',
      reason: remarks || 'Returned for revision.'
    };

    const updatedTask = await updateTask(task.id, {
      status: WORK_STATUSES.REJECTED,
      submittedReport: report
    });

    // Record audit trail
    recordActivity({
      actor: approver,
      action: AUDIT_ACTIONS.WORK_REJECTED,
      module: AUDIT_MODULES.WORK,
      status: 'SUCCESS',
      details: `First-level review returned report for "${task.title}" by ${approver.name} (${approver.role}). Reason: "${remarks || 'Returned for revision'}".`,
      targetId: task.id,
      previousValues: { status: task.status },
      newValues: { status: WORK_STATUSES.REJECTED, reason: remarks }
    });

    // Notify submitting member
    await createNotification({
      recipientId: task.assignedToId,
      title: 'Work Report Returned for Correction',
      message: `Your report for "${task.title}" was rejected by ${approver.name} (${approver.role}). Reason: ${remarks}`,
      type: 'rejection',
      linkId: task.id
    });

    return updatedTask;
  }
}

/**
 * Final-Level Approver reviews a submitted work report.
 * Authorized for: Admin (Staff Coordinator) ONLY.
 */
export async function processFinalApproval(task, approver, decision, remarks) {
  if (!isStaffCoordinator(approver.role)) {
    throw new Error('Unauthorized: Only Staff Coordinator or Administrator has final approval authority.');
  }

  const isMaster = approver.role === ROLES.ADMINISTRATOR;
  if (!isMaster && task.status !== WORK_STATUSES.PENDING_FINAL) {
    throw new Error(`Invalid state: Report is in status "${task.status}". Final approval requires status "Pending Final Approval".`);
  }

  const report = { ...task.submittedReport };

  if (decision === 'approve') {
    report.finalApproval = {
      approvedById: approver.id,
      approvedByName: approver.name,
      approvedByRole: approver.role,
      approvedAt: new Date().toISOString(),
      remarks: remarks || 'Final approval granted. Institutional requirements met.'
    };

    // ONLY HERE DOES STATUS BECOME COMPLETED
    const updatedTask = await updateTask(task.id, {
      status: WORK_STATUSES.COMPLETED,
      progress: 100,
      submittedReport: report
    });

    // Record audit trail
    recordActivity({
      actor: approver,
      action: AUDIT_ACTIONS.WORK_FINAL_APPROVED,
      module: AUDIT_MODULES.WORK,
      status: 'SUCCESS',
      details: `Final Staff Coordinator approval granted by ${approver.name} (${approver.role}) for task "${task.title}". Status is now Completed.`,
      targetId: task.id,
      previousValues: { status: task.status },
      newValues: { status: WORK_STATUSES.COMPLETED, remarks }
    });

    // Notify the submitting member of completion
    await createNotification({
      recipientId: task.assignedToId,
      title: 'Work Report Officially Approved & Completed',
      message: `Staff Coordinator (${approver.name}) has granted final institutional approval for "${task.title}". Status is now Completed.`,
      type: 'final_approval',
      linkId: task.id
    });

    // Notify the original assigner if different from Staff Coordinator
    if (task.assignedById !== approver.id) {
      await createNotification({
        recipientId: task.assignedById,
        title: 'Assigned Work Completed',
        message: `Task "${task.title}" assigned to ${task.assignedToName} has received final Staff Coordinator approval and is completed.`,
        type: 'task_completed',
        linkId: task.id
      });
    }

    return updatedTask;
  } else if (decision === 'reject') {
    report.rejection = {
      rejectedById: approver.id,
      rejectedByName: approver.name,
      rejectedByRole: approver.role,
      rejectedAt: new Date().toISOString(),
      level: 'Final Staff Coordinator',
      reason: remarks || 'Returned by Staff Coordinator for correction.'
    };

    const updatedTask = await updateTask(task.id, {
      status: WORK_STATUSES.REJECTED,
      submittedReport: report
    });

    // Record audit trail
    recordActivity({
      actor: approver,
      action: AUDIT_ACTIONS.WORK_REJECTED,
      module: AUDIT_MODULES.WORK,
      status: 'SUCCESS',
      details: `Final Staff Coordinator review returned report for "${task.title}" by ${approver.name} (${approver.role}). Reason: "${remarks || 'Returned by Staff Coordinator'}".`,
      targetId: task.id,
      previousValues: { status: task.status },
      newValues: { status: WORK_STATUSES.REJECTED, reason: remarks }
    });

    // Notify the submitting member
    await createNotification({
      recipientId: task.assignedToId,
      title: 'Work Report Rejected by Staff Coordinator',
      message: `Staff Coordinator returned your report for "${task.title}". Reason: ${remarks}. Please revise and resubmit.`,
      type: 'rejection',
      linkId: task.id
    });

    return updatedTask;
  }
}
