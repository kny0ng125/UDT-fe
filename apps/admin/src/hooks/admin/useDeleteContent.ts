import { deleteContent } from '@lib/apis/admin/deleteContent';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { showSimpleToast } from '@udt/ui/common/Toast';

// 콘텐츠 삭제를 처리하는 커스텀 훅
export const useDeleteContent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (contentId: number) => deleteContent(contentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['infiniteAdminContentList'] });
      // 카테고리별 개수(차트)도 갱신
      queryClient.invalidateQueries({ queryKey: ['categoryMetrics'] });
      showSimpleToast.success({
        message: '콘텐츠가 삭제되었습니다.',
        position: 'top-center',
      });
    },
  });
};
