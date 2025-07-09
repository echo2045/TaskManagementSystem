import React, { useState, useCallback } from 'react';
import { createTask } from '../api/tasks';
import { updateTaskRequest } from '../api/requests';
import DelegateModal from '../components/DelegateModal';

export const useTaskRequestFlowManager = (onCloseAcceptModal) => {
  const [showDelegateModal, setShowDelegateModal] = useState(false);
  const [taskToDelegate, setTaskToDelegate] = useState(null);
  const [requesterIdForDelegate, setRequesterIdForDelegate] = useState(null);

  const toUtcIsoDate = (dateStr) => {
    if (!dateStr) return null;
    const localDate = new Date(dateStr);
    localDate.setUTCHours(0, 0, 0, 0);
    return localDate.toISOString();
  };

  const startFlow = useCallback(async ({ formData, request, user, requesterId }) => {
    console.log('[useTaskRequestFlowManager startFlow] - Start', { formData, request, user });
    try {
      const isoStartDate = toUtcIsoDate(formData.start_date);
      const payload = {
        ...formData,
        owner_id: user.user_id, // Supervisor is the owner
        start_date: isoStartDate,
        deadline: formData.deadline ? new Date(formData.deadline).toISOString() : null,
        project_id: formData.project_id,
        area_id: formData.area_id,
        time_estimate: formData.time_estimate ? Number(formData.time_estimate) : null
      };

      const createdTask = await createTask(payload);

      await updateTaskRequest(request.request_id, 'accepted');

      setTaskToDelegate(createdTask);
      setRequesterIdForDelegate(requesterId);
      console.log('[useTaskRequestFlowManager startFlow] - Before setShowDelegateModal', { createdTask, requesterId });
      setShowDelegateModal(true);
      console.log('[useTaskRequestFlowManager startFlow] - setShowDelegateModal(true)');

    } catch (err) {
      console.error('Error in task request flow:', err);
      alert('Could not complete task request process');
    }
  }, []);

  const handleDelegateModalClose = useCallback(() => {
    console.log('[useTaskRequestFlowManager handleDelegateModalClose] - Start');
    setShowDelegateModal(false);
    console.log('[useTaskRequestFlowManager handleDelegateModalClose] - Calling onCloseAcceptModal');
    onCloseAcceptModal(); // Close the AcceptTaskRequestModal
  }, [onCloseAcceptModal]);

  const DelegateModalComponent = showDelegateModal && taskToDelegate && requesterIdForDelegate ? (
    <DelegateModal
      taskId={taskToDelegate.task_id}
      requesterId={requesterIdForDelegate}
      onClose={handleDelegateModalClose}
    />
  ) : null;

  return { startFlow, DelegateModalComponent, showDelegateModal };
};