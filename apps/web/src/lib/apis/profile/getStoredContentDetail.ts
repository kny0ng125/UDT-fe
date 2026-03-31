import { StoredContentDetail } from '@type/profile/StoredContentDetail';
import axiosInstance from '@udt/shared/apis/axiosInstance';

export const getStoredContentDetail = async (
  contentId: number,
): Promise<StoredContentDetail> => {
  const { data } = await axiosInstance.get(`/api/contents/${contentId}`);
  return data;
};
