// Sequential Phase Locking Logic Functions with Dual Approval

import { PhaseState, PhaseStatus, ValidationResult, PhasePaymentStatus } from './phaseLockingTypes';
import { Task } from './types';

/**
 * Get the currently active phase
 * Returns the first phase that is not locked
 */
export const getActivePhase = (
  phases: string[],
  phaseStates: PhaseState[]
): string | null => {
  // Find first phase that is 'active'
  for (let i = 0; i < phases.length; i++) {
    const phase = phases[i];
    const phaseState = phaseStates.find(ps => ps.phase_name === phase);

    // If phase state is 'active', it's the active phase
    if (phaseState?.status === 'active') {
      return phase;
    }
  }

  // No active phase found
  return null;
};

/**
 * Check if a task status can be changed
 * Only allowed if task is in active phase
 */
export const canChangeTaskStatus = (
  task: Task,
  activePhase: string | null,
  phaseStates: PhaseState[]
): ValidationResult => {
  const phaseState = phaseStates.find(ps => ps.phase_name === task.phase);

  // If phase is locked, cannot change status
  if (phaseState?.status === 'locked') {
    return {
      allowed: false,
      reason: 'This phase is locked and cannot be modified'
    };
  }

  // PAYMENT LOCK: If phase is not paid, it's not workable
  // Skip this check during initial setup (status === 'unlocked')
  if (phaseState?.payment_status !== 'paid' && phaseState?.status !== 'unlocked') {
    return {
      allowed: false,
      reason: 'Payment for this phase is pending. Work can only resume once payment is confirmed.'
    };
  }

  // If there's an active phase (after initial lock), only active phase can be modified
  if (activePhase && task.phase !== activePhase) {
    return {
      allowed: false,
      reason: `You can only modify tasks in the current active phase: ${activePhase}`
    };
  }

  // If phase is unlocked or active, allow status change
  return { allowed: true };
};

/**
 * Check if a new task can be added to a phase
 * Only allowed if phase is active
 */
export const canAddTaskToPhase = (
  phase: string,
  activePhase: string | null,
  phaseStates: PhaseState[],
  initialSetupComplete: boolean
): ValidationResult => {
  const phaseState = phaseStates.find(ps => ps.phase_name === phase);

  // If no phase states initialized yet, allow (initial setup)
  if (!phaseState) {
    return { allowed: true };
  }

  // If phase is locked, cannot add tasks
  if (phaseState.status === 'locked') {
    return {
      allowed: false,
      reason: 'This phase is locked and cannot be modified'
    };
  }

  // If phase is pending, cannot add tasks
  if (phaseState.status === 'pending') {
    return {
      allowed: false,
      reason: 'This phase is pending and cannot be modified'
    };
  }

  // Before initial setup is complete, unlocked phases can have tasks
  if (!initialSetupComplete && phaseState.status === 'unlocked') {
    return { allowed: true };
  }

  // After initial setup, only active phase can have tasks
  if (initialSetupComplete) {
    if (!activePhase) {
      return {
        allowed: false,
        reason: 'No active phase. All phases are locked.'
      };
    }

    // PAYMENT LOCK: Even if active, must be paid to add tasks
    // Skip this check during initial setup (status === 'unlocked')
    if (phaseState.payment_status !== 'paid' && phaseState.status !== 'unlocked') {
      return {
        allowed: false,
        reason: 'Payment for this phase is pending. You cannot add tasks until payment is confirmed.'
      };
    }

    if (phase !== activePhase) {
      return {
        allowed: false,
        reason: `You can only add tasks to the current active phase: ${activePhase}`
      };
    }
  }

  // Fallback for unexpected states, better to allow if it's unlocked just in case
  if (phaseState.status === 'unlocked') {
    return { allowed: true };
  }

  return { allowed: true };
};

/**
 * Check if freelancer can request to lock a phase
 * Only allowed if phase is active and all tasks are done
 */
export const canRequestLockPhase = (
  phase: string,
  tasks: Task[],
  phaseStates: PhaseState[]
): ValidationResult => {
  const phaseState = phaseStates.find(ps => ps.phase_name === phase);

  // Check if already locked
  if (phaseState?.status === 'locked') {
    return {
      allowed: false,
      reason: 'Phase is already locked'
    };
  }

  // Check if phase is active
  if (phaseState?.status !== 'active') {
    return {
      allowed: false,
      reason: 'Only active phases can be locked'
    };
  }

  // PAYMENT LOCK: Must be paid to request lock (submission)
  if (phaseState.payment_status !== 'paid') {
    return {
      allowed: false,
      reason: 'Payment for this phase is pending. You cannot submit work until payment is confirmed.'
    };
  }

  // Check if freelancer already approved
  if (phaseState.freelancer_approved) {
    return {
      allowed: false,
      reason: 'You have already requested lock. Waiting for client approval.'
    };
  }

  // Check if all tasks are done
  const phaseTasks = tasks.filter(t => t.phase === phase);
  if (phaseTasks.length === 0) {
    return {
      allowed: false,
      reason: 'Phase must have at least one task before locking'
    };
  }

  const allTasksDone = phaseTasks.every(task => task.status === 'done');
  if (!allTasksDone) {
    return {
      allowed: false,
      reason: 'All tasks in this phase must be completed before locking'
    };
  }

  return { allowed: true };
};

/**
 * Check if client can approve lock for a phase
 * Only allowed if freelancer has already approved
 */
export const canApproveLockPhase = (
  phase: string,
  phaseStates: PhaseState[]
): ValidationResult => {
  const phaseState = phaseStates.find(ps => ps.phase_name === phase);

  if (!phaseState) {
    return {
      allowed: false,
      reason: 'Phase state not found'
    };
  }

  // Check if already locked
  if (phaseState.status === 'locked') {
    return {
      allowed: false,
      reason: 'Phase is already locked'
    };
  }

  // Check if freelancer has approved first
  if (!phaseState.freelancer_approved) {
    return {
      allowed: false,
      reason: 'Freelancer must request lock first'
    };
  }

  // Check if client already approved
  if (phaseState.client_approved) {
    return {
      allowed: false,
      reason: 'You have already approved. Phase will be locked.'
    };
  }

  return { allowed: true };
};

/**
 * Check if phase should be locked (both approvals received)
 */
export const shouldLockPhase = (phaseState: PhaseState): boolean => {
  return phaseState.freelancer_approved && phaseState.client_approved && phaseState.status !== 'locked';
};

/**
 * Check if all phases can be locked (initial lock)
 * Only allowed if all phases have at least one task
 */
export const canLockAllPhases = (
  phases: string[],
  tasks: Task[]
): ValidationResult => {
  // Check if all phases have at least one task
  for (const phase of phases) {
    const phaseTasks = tasks.filter(t => t.phase === phase);
    if (phaseTasks.length === 0) {
      return {
        allowed: false,
        reason: `Phase "${phase}" must have at least one task before locking all phases`
      };
    }
  }

  return { allowed: true };
};

/**
 * Get phase status badge
 */
export const getPhaseStatusBadge = (status: PhaseStatus, paymentStatus?: string): {
  label: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  className: string;
} => {
  if (paymentStatus === 'pending_verification') {
    return {
      label: 'Processing',
      variant: 'secondary',
      className: 'bg-blue-500/10 text-blue-700 border-blue-200'
    };
  }

  if (status === 'active' && paymentStatus !== 'paid') {
    return {
      label: 'Payment Pending',
      variant: 'destructive',
      className: 'bg-red-500/10 text-red-700 border-red-200'
    };
  }

  switch (status) {
    case 'active':
      return {
        label: 'Active',
        variant: 'default',
        className: 'bg-green-500/10 text-green-700 border-green-200'
      };
    case 'pending':
      return {
        label: 'Pending',
        variant: 'secondary',
        className: 'bg-yellow-500/10 text-yellow-700 border-yellow-200'
      };
    case 'locked':
      return {
        label: 'Locked',
        variant: 'outline',
        className: 'bg-slate-500/10 text-slate-700 border-slate-200'
      };
    case 'unlocked':
      return {
        label: 'Unlocked',
        variant: 'secondary',
        className: 'bg-blue-500/10 text-blue-700 border-blue-200'
      };
    default:
      return {
        label: 'Unknown',
        variant: 'secondary',
        className: 'bg-slate-500/10 text-slate-700 border-slate-200'
      };
  }
};

/**
 * Get next phase after locking current phase
 */
export const getNextPhase = (
  currentPhase: string,
  phases: string[]
): string | null => {
  const currentIndex = phases.indexOf(currentPhase);
  if (currentIndex === -1 || currentIndex === phases.length - 1) {
    return null; // No next phase
  }
  return phases[currentIndex + 1];
};

/**
 * Get payment status for a phase.
 * Strictly Sequential Logic: Phase N is 'pending' (payable) ONLY if:
 * 1. It is currently 'unpaid'
 * 2. The phase PRIOR to it (N-1) has reached >= 50% task completion.
 */
export const getPhasePaymentStatus = (
  phaseIndex: number,
  phaseStates: PhaseState[],
  tasks: Task[],
  allPhaseNames: string[]
): PhasePaymentStatus => {
  const currentPhaseState = phaseStates.find(ps => ps.phase_order === phaseIndex + 1);
  if (!currentPhaseState) return 'not_yet_started';

  // 1. If already paid, it's done
  if (currentPhaseState.payment_status === 'paid') return 'done';
  if (currentPhaseState.payment_status === 'pending_verification') return 'pending';

  // 2. Identify how many phases were paid in advance
  const advancePhases = allPhaseNames.length > 4 ? 2 : 1;

  // 3. If this phase was part of the advance but isn't marked paid yet, it's not ready
  if (phaseIndex < advancePhases) {
    return 'not_yet_started';
  }

  // 4. Sequential Trigger Logic (Buffer Rule)
  // Phase N payment triggers when Phase N - offset is 50% complete.
  // For >4 phases: offset = 2 (e.g., Phase 3 triggers on Phase 1 @ 50%)
  // For <=4 phases: offset = 1 (e.g., Phase 2 triggers on Phase 1 @ 50%)
  const offset = allPhaseNames.length > 4 ? 2 : 1;
  const targetIndex = phaseIndex - offset;

  if (targetIndex < 0) return 'not_yet_started';

  const targetPhaseName = allPhaseNames[targetIndex];
  const targetPhaseTasks = tasks.filter(t => t.phase === targetPhaseName);

  // If target phase has no tasks, it can't reach 50% completion yet (unless it's empty by design?)
  // For now, if no tasks, we assume it's not ready to trigger next payment.
  if (targetPhaseTasks.length === 0) return 'not_yet_started';

  const completedTasks = targetPhaseTasks.filter(t => t.status === 'done').length;
  const progress = completedTasks / targetPhaseTasks.length;

  if (progress >= 0.5) {
    return 'pending';
  }

  return 'not_yet_started';
};

/**
 * Check if a phase can be unlocked (moved from pending to active)
 * Must be paid.
 */
export const canUnlockPhase = (
  phaseState: PhaseState
): ValidationResult => {
  if (phaseState.payment_status !== 'paid') {
    return {
      allowed: false,
      reason: 'Payment for this phase is pending. Please complete the payment to continue.'
    };
  }
  return { allowed: true };
};
