'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@udt/ui/components/card';
import { Button } from '@udt/ui/components/button';
import { ScrollArea } from '@udt/ui/components/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@udt/ui/components/dialog';
import { Plus } from 'lucide-react';

import type { ContentCreateUpdate } from '@type/admin/Content';
import { useInfiniteAdminContentList } from '@hooks/admin/useGetContentList';
import { usePostContent } from '@hooks/admin/usePostContent';
import { useUpdateContent } from '@hooks/admin/usePatchContent';
import { useDeleteContent } from '@hooks/admin/useDeleteContent';
import { useGetContentDetail } from '@hooks/admin/useGetContentDetail';
import { useMutationErrorToast } from '@udt/shared/hooks/useMutationErrorToast';
import { extractBulkValidationError } from '@utils/admin/extractBulkValidationError';
import ContentForm from '@components/ContentForm';
import ContentSheet from '@components/ContentSheet';
import ContentCard from '@components/ContentCard';
import CategoryChart from '@components/CategoryChart';
import StatePanel from '@components/StatePanel';
import ContentDetail from '@components/ContentDetail';
import SearchFilter from '@components/SearchFilter';
import { useGetCategoryMetrics } from '@hooks/admin/useGetCategoryMetrics';

export default function AdminDashboard() {
  // 카테고리 지표 조회
  const {
    data: categoryMetricsData,
    isLoading: isMetricsLoading,
    error: metricsError,
    refetch: refetchMetrics,
  } = useGetCategoryMetrics();

  const [categoryType, setCategoryType] = useState<string>('');

  const filteredCategoryCount =
    categoryType && categoryType !== 'all'
      ? (categoryMetricsData?.categoryMetrics.find(
          (metric) => metric.categoryType === categoryType,
        )?.count ?? 0)
      : (categoryMetricsData?.categoryMetrics.reduce(
          (sum, metric) => sum + metric.count,
          0,
        ) ?? 0);

  // 무한 스크롤용 필터 상태
  const size = 20;

  // 무한 스크롤 쿼리
  const {
    data,
    isLoading: isContentsLoading,
    isError,
    refetch: refetchContents,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteAdminContentList({ size, categoryType });

  // Intersection Observer로 하단 감지
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        fetchNextPage();
      }
    });
    const element = loadMoreRef.current;
    if (element) observer.observe(element);

    return () => {
      if (element) observer.unobserve(element);
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const postContent = usePostContent();
  const updateContent = useUpdateContent();
  const deleteContent = useDeleteContent();

  // 서버측 검증 실패(BulkValidationException) 응답을 추출하여 폼에 inline 표시
  const postValidationError = useMemo(
    () => extractBulkValidationError(postContent.error),
    [postContent.error],
  );
  const updateValidationError = useMemo(
    () => extractBulkValidationError(updateContent.error),
    [updateContent.error],
  );

  // 검증 실패는 폼에서 상세히 표시하므로 토스트는 짧은 요약만 띄움.
  // 그 외 에러는 기본 메시지(잘못된 요청/권한 없음 등) 유지.
  useMutationErrorToast(
    postContent,
    postValidationError
      ? `검증 실패: ${postValidationError.errors.length}건. 폼을 확인해주세요.`
      : undefined,
  );
  useMutationErrorToast(
    updateContent,
    updateValidationError
      ? `검증 실패: ${updateValidationError.errors.length}건. 폼을 확인해주세요.`
      : undefined,
  );
  useMutationErrorToast(deleteContent);

  // 모달 상태 관리 (독립적으로 관리)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSheetDialogOpen, setIsSheetDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // 선택된 콘텐츠 ID (상세/수정 모달에서 공유)
  const [selectedContentId, setSelectedContentId] = useState<number | null>(
    null,
  );

  // 단일 데이터 fetch (상세/수정 모달에서 공유)
  const {
    data: contentDetailData,
    isLoading: isContentDetailLoading,
    isError: isContentDetailError,
  } = useGetContentDetail(
    isDetailDialogOpen || isEditDialogOpen
      ? (selectedContentId ?? undefined)
      : undefined,
  );

  // 모달 오픈 핸들러
  const openDetailDialog = useCallback((contentId: number) => {
    setSelectedContentId(contentId);
    setIsDetailDialogOpen(true);
  }, []);

  const openEditDialog = useCallback((contentId: number) => {
    setSelectedContentId(contentId);
    setIsEditDialogOpen(true);
  }, []);

  // 모달 클로즈 핸들러
  const closeDetailDialog = useCallback(() => {
    setIsDetailDialogOpen(false);
    setSelectedContentId(null);
  }, []);

  const closeEditDialog = useCallback(() => {
    setIsEditDialogOpen(false);
    setSelectedContentId(null);
  }, []);

  // 필터 변경 시 refetch
  const handleFilterChange = (type: string) => {
    setCategoryType(type);
  };

  // 콘텐츠 추가 핸들러
  const handleAddContent = useCallback(
    (contentData: ContentCreateUpdate) => {
      postContent.mutate(contentData, {
        onSuccess: () => setIsAddDialogOpen(false),
      });
    },
    [postContent],
  );

  // 콘텐츠 수정 핸들러
  const handleEditContent = useCallback(
    (contentData: ContentCreateUpdate) => {
      if (selectedContentId) {
        updateContent.mutate(
          { contentId: selectedContentId, data: contentData },
          {
            onSuccess: () => {
              setIsEditDialogOpen(false);
              setSelectedContentId(null);
            },
          },
        );
      }
    },
    [updateContent, selectedContentId],
  );

  // 콘텐츠 삭제 핸들러
  const handleDeleteContent = useCallback(
    (contentId: number) => {
      deleteContent.mutate(contentId, {
        onSuccess: () => {
          setIsDetailDialogOpen(false);
          setSelectedContentId(null);
        },
      });
    },
    [deleteContent],
  );

  // 상세에서 수정으로 전환 핸들러
  const handleDetailToEdit = useCallback(() => {
    setIsDetailDialogOpen(false);
    setIsEditDialogOpen(true);
  }, []);

  // 모든 페이지의 콘텐츠 합치기
  const allContents = data?.pages.flatMap((page) => page.item) || [];
  const triggerIndex = useMemo(
    () => allContents.length - 8,
    [allContents.length],
  );

  return (
    <div className="h-screen overflow-y-auto bg-white p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* 콘텐츠 분포 차트 */}
        <div className="w-full flex justify-center">
          <div className="w-full max-w-5xl">
            <CategoryChart
              categoryMetrics={categoryMetricsData?.categoryMetrics}
              isLoading={isMetricsLoading}
              isError={!!metricsError}
              onRetry={() => refetchMetrics()}
            />
          </div>
        </div>

        {/* 콘텐츠 목록 */}
        <Card className="bg-white py-5 gap-4">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-semibold text-gray-900">
                  등록된 콘텐츠 목록
                </CardTitle>
                <CardDescription>
                  전체 {filteredCategoryCount}개의 콘텐츠
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  className="rounded-lg px-4 py-5 flex items-center font-semibold text-md cursor-pointer"
                  onClick={() => setIsSheetDialogOpen(true)}
                >
                  시트로 등록
                </Button>
                <Button
                  className="bg-slate-900 hover:bg-slate-800 text-white rounded-lg px-4 py-5 flex items-center font-semibold text-md min-w-[160px] cursor-pointer"
                  onClick={() => setIsAddDialogOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />새 항목 추가
                </Button>
              </div>
            </div>

            {/* 검색 및 필터 */}
            <div className="mt-3">
              <SearchFilter
                filterType={categoryType}
                onFilterChange={handleFilterChange}
              />
            </div>
          </CardHeader>

          <CardContent>
            <ScrollArea className="h-[500px]">
              {isContentsLoading ? (
                <StatePanel state="loading" className="h-[460px]" />
              ) : isError ? (
                <StatePanel
                  state="error"
                  className="h-[460px]"
                  onRetry={() => refetchContents()}
                />
              ) : allContents.length === 0 ? (
                <StatePanel
                  state="empty"
                  message="등록된 콘텐츠가 없어요."
                  className="h-[460px]"
                />
              ) : (
                <div className="space-y-4 mb-4">
                  {allContents.map((content, idx) => (
                    <div key={content.contentId}>
                      <ContentCard
                        content={content}
                        onView={openDetailDialog}
                        onEdit={openEditDialog}
                        onDelete={handleDeleteContent}
                      />
                      {idx === triggerIndex && (
                        <div ref={loadMoreRef} style={{ height: 1 }} />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
            {isFetchingNextPage && (
              <div className="text-center py-2">불러오는 중...</div>
            )}
            {!isContentsLoading &&
              !isError &&
              allContents.length > 0 &&
              !hasNextPage && (
                <div className="text-center py-2">
                  더 이상 데이터가 없습니다.
                </div>
              )}
          </CardContent>
        </Card>

        {/* 다이얼로그들 */}
        {isSheetDialogOpen && (
          <Dialog open={isSheetDialogOpen} onOpenChange={setIsSheetDialogOpen}>
            <DialogContent className="w-full max-w-none sm:max-w-[1200px] max-h-[85svh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>시트로 콘텐츠 등록</DialogTitle>
                <DialogDescription>
                  여러 콘텐츠를 표로 입력하고 한 번에 등록해요.
                </DialogDescription>
              </DialogHeader>
              <ContentSheet onClose={() => setIsSheetDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        )}

        {isAddDialogOpen && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogContent className="w-full max-w-none sm:max-w-[1000px] max-h-[75svh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>새 정보 추가</DialogTitle>
                <DialogDescription>
                  콘텐츠/인물 정보를 등록해주세요.
                </DialogDescription>
              </DialogHeader>
              <ContentForm
                onSave={handleAddContent}
                onCancel={() => setIsAddDialogOpen(false)}
                validationErrors={postValidationError?.errors}
              />
            </DialogContent>
          </Dialog>
        )}

        {isEditDialogOpen && selectedContentId && (
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="w-full max-w-none sm:max-w-[1000px] max-h-[75svh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>정보 수정</DialogTitle>
                <DialogDescription>
                  콘텐츠 정보를 수정해주세요.
                </DialogDescription>
              </DialogHeader>
              {isContentDetailLoading ? (
                <div>불러오는 중...</div>
              ) : isContentDetailError || !contentDetailData ? (
                <div>수정 정보를 불러오지 못했습니다.</div>
              ) : (
                <ContentForm
                  content={contentDetailData}
                  onSave={handleEditContent}
                  onCancel={closeEditDialog}
                  validationErrors={updateValidationError?.errors}
                />
              )}
            </DialogContent>
          </Dialog>
        )}

        {isDetailDialogOpen && selectedContentId && (
          <Dialog
            open={isDetailDialogOpen}
            onOpenChange={setIsDetailDialogOpen}
          >
            <DialogContent
              aria-describedby={undefined}
              className="w-full max-w-none sm:max-w-[1000px] max-h-[90vh] overflow-y-auto"
            >
              <DialogHeader>
                <DialogTitle>콘텐츠 상세 정보</DialogTitle>
              </DialogHeader>
              {isContentDetailLoading ? (
                <div>상세 정보를 불러오는 중...</div>
              ) : isContentDetailError || !contentDetailData ? (
                <div>상세 정보를 불러오지 못했습니다.</div>
              ) : (
                <ContentDetail
                  content={{
                    ...contentDetailData,
                    contentId: selectedContentId,
                  }}
                  onEdit={handleDetailToEdit}
                  onClose={closeDetailDialog}
                />
              )}
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}
