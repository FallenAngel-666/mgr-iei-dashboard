import { ROLES, WORK_STATUSES, FIRST_LEVEL_APPROVER_ROLES, isFirstLevelApprover, isStaffCoordinator } from '../config/roles.js';
import { updateTask, createNotification } from './firebaseService.js';

/**
 * Submits a work report for an assigned task.
 * If the submitter is an ordinary member, status becomes: 'Pending First-Level Approval'.
 * If the submitter is a First-Level Approver (Chairman, Vice Chairman, Secretary, Joint Secretary),
 * their report is forwarded DIRECTLY to Admin (Staff Coordinator) with status: 'Pending Final Approval'.
 */
export async function submitWorkReport(task, reportData, submitter) {
  const isSubmitterFirstLevel = isFirstLevelApprover(submitter.role);

  // Status determined by role hierarchy
  const newStatus = isSubmitterFirstLevel
    ? WORK_STATUSES.PENDING_FINAL
    : WORK_STATUSES.PENDING_FIRST_LEVEL;

  const report = {
    id: `rep-${Date.now()}`,
    title: reportData.title || task.title,
    summary: reportData.summary,
    submittedAt: new Date().toISOString(),
    submittedById: submitter.id,
    submittedByName: submitter.name,
    submittedByRole: submitter.role,
    attachments: reportData.attachments || [],
    firstLevelApproval: null,
    finalApproval: null,
    rejectionHistory: task.submittedReport?.rejection ? [task.submittedReport.rejection] : []
  };

  const updatedTask = await updateTask(task.id, {
    status: newStatus,
    progress: 100,
    submittedReport: report
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
    throw new Error('Unauthorized: Only Admin (Staff Coordinator) has final approval authority.');
  }

  if (task.status !== WORK_STATUSES.PENDING_FINAL) {
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
