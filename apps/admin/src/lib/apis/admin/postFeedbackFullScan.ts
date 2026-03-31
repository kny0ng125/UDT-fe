import axiosInstance from '@udt/shared/apis/axiosInstance';

export const postFeedbackFullScan = async (): Promise<void> => {
  await axiosInstance.post('/api/admin/feedback/full-scan');
};
