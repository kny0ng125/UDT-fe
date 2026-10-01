import { postContent } from '@lib/apis/admin/postContent';
import { ContentCreateUpdate } from '@type/admin/Content';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { showSimpleToast } from '@udt/ui/common/Toast';

// 콘텐츠 등록 훅
export const usePostContent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ContentCreateUpdate) => postContent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['infiniteAdminContentList'] });
      // 카테고리별 개수(차트)도 갱신
      queryClient.invalidateQueries({ queryKey: ['categoryMetrics'] });
      showSimpleToast.success({
        message: '콘텐츠가 등록되었습니다.',
        position: 'top-center',
      });
    },
  });
};
