'use client';

import { useMemo, useState } from 'react';
import { ArrowDown } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@udt/ui/components/dialog';
import { Button } from '@udt/ui/components/button';
import { Input } from '@udt/ui/components/input';
import { Label } from '@udt/ui/components/label';
import ContentForm from '@components/ContentForm';
import {
  useContentJobDetail,
  useResubmitContentJob,
} from '@hooks/admin/useContentJobs';
import { useMutationErrorToast } from '@udt/shared/hooks/useMutationErrorToast';
import { extractBulkValidationError } from '@utils/admin/extractBulkValidationError';
import { describeValidationError } from '@utils/admin/describeValidationError';
import type {
  ContentCreateUpdate,
  ContentWithoutId,
} from '@type/admin/Content';
import type {
  ContentDeleteJobDetail,
  ContentJobType,
  ContentUpsertJobDetail,
} from '@type/admin/ContentJob';
import type { JobValidationError } from '@type/admin/error';

export interface ResubmitTarget {
  jobType: ContentJobType;
  jobId: number;
}

// 작업 상세의 제출 입력값을 ContentForm 초기값으로 변환.
// 상세 응답은 감독/출연진을 ID 로만 주므로 이름 자리에 ID 를 표시한다.
const toFormContent = (d: ContentUpsertJobDetail): ContentWithoutId => ({
  title: d.title ?? '',
  description: d.description ?? '',
  posterUrl: d.posterUrl ?? '',
  backdropUrl: d.backdropUrl ?? '',
  trailerUrl: d.trailerUrl ?? '',
  openDate: d.openDate ?? '',
  runningTime: d.runningTime ?? 0,
  episode: d.episode ?? 0,
  rating: d.rating ?? '',
  categories: d.categories ?? [],
  countries: d.countries ?? [],
  directors: (d.directors ?? []).map((id) => ({
    directorId: id,
    directorName: `ID ${id}`,
    directorImageUrl: '',
  })),
  casts: (d.casts ?? []).map((id) => ({
    castId: id,
    castName: `ID ${id}`,
    castImageUrl: '',
  })),
  platforms: d.platforms ?? [],
});

function ValidationErrorList({ errors }: { errors: JobValidationError[] }) {
  if (errors.length === 0) return null;
  return (
    <ul className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800 space-y-1">
      {errors.map((e, i) => {
        const { target, reason } = describeValidationError(e);
        // 이 목록은 삭제 재제출(콘텐츠 ID 입력) 화면에서만 쓰인다.
        const canJump = e.field === 'contentId';
        return (
          <li
            key={`${e.field}-${i}`}
            title={e.code}
            className="flex items-start gap-2"
          >
            <span className="flex-1">
              <span className="font-medium">{target}</span> · {reason}
            </span>
            {canJump && (
              <button
                type="button"
                aria-label={`${target} 입력으로 이동`}
                title="해당 입력으로 이동"
                onClick={() => {
                  const input = document.getElementById('resubmit-content-id');
                  input?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center',
                  });
                  input?.focus({ preventScroll: true });
                }}
                className="shrink-0 cursor-pointer rounded-full p-1 hover:bg-red-100"
              >
                <ArrowDown className="size-4" />
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function DeleteResubmitForm({
  detail,
  errors,
  pending,
  onSubmit,
  onCancel,
}: {
  detail: ContentDeleteJobDetail;
  errors: JobValidationError[];
  pending: boolean;
  onSubmit: (contentId: number) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(
    detail.contentId != null ? String(detail.contentId) : '',
  );
  const contentId = Number(value);
  const valid =
    value.trim() !== '' && Number.isInteger(contentId) && contentId > 0;

  return (
    <div className="flex flex-col gap-4">
      <ValidationErrorList errors={errors} />
      <div className="flex flex-col gap-2">
        <Label htmlFor="resubmit-content-id">삭제할 콘텐츠 ID</Label>
        <Input
          id="resubmit-content-id"
          inputMode="numeric"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          aria-invalid={errors.some((e) => e.field === 'contentId')}
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          취소
        </Button>
        <Button
          disabled={!valid || pending}
          onClick={() => onSubmit(contentId)}
        >
          {pending ? '처리 중...' : '재제출'}
        </Button>
      </div>
    </div>
  );
}

export function JobResubmitDialog({
  target,
  onClose,
}: {
  target: ResubmitTarget | null;
  onClose: () => void;
}) {
  const detailQuery = useContentJobDetail(target?.jobType, target?.jobId);
  const resubmit = useResubmitContentJob();

  // 재제출이 다시 검증에 실패하면 그 결과를, 아니면 작업에 저장된 검증 실패 목록을 보여 준다.
  const resubmitValidationError = useMemo(
    () => extractBulkValidationError(resubmit.error),
    [resubmit.error],
  );
  useMutationErrorToast(
    resubmit,
    resubmitValidationError
      ? `검증 실패: ${resubmitValidationError.errors.length}건. 폼을 확인해주세요.`
      : undefined,
  );

  const detail = detailQuery.data;
  const errors: JobValidationError[] =
    resubmitValidationError?.errors ?? detail?.validationErrors ?? [];

  const close = () => {
    resubmit.reset();
    onClose();
  };

  const handleUpsert = (data: ContentCreateUpdate) => {
    if (!target || target.jobType === 'DELETE') return;
    resubmit.mutate(
      { jobType: target.jobType, jobId: target.jobId, data },
      { onSuccess: close },
    );
  };

  const handleDelete = (contentId: number) => {
    if (!target) return;
    resubmit.mutate(
      { jobType: 'DELETE', jobId: target.jobId, contentId },
      { onSuccess: close },
    );
  };

  return (
    <Dialog
      open={target !== null}
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <DialogContent className="w-full max-w-none sm:max-w-[1000px] max-h-[85svh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            요청 #{target?.jobId} 재제출 ({target?.jobType})
          </DialogTitle>
          <DialogDescription>
            검증에 실패한 항목을 고친 뒤 재제출하세요.
            {target?.jobType !== 'DELETE' &&
              ' 감독·출연진은 요청에 ID만 저장돼 있어 ID로 표시됩니다.'}
          </DialogDescription>
        </DialogHeader>

        {detailQuery.isPending && (
          <div className="py-8 text-center text-gray-400">불러오는 중...</div>
        )}
        {detailQuery.isError && (
          <div className="py-8 text-center text-red-500">
            요청 상세를 불러오지 못했습니다.
          </div>
        )}

        {detail?.errorMessage && (
          <div className="rounded-md border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
            {detail.errorMessage}
          </div>
        )}

        {detail && target && target.jobType !== 'DELETE' && (
          <ContentForm
            key={`${target.jobType}-${target.jobId}`}
            content={toFormContent(detail as ContentUpsertJobDetail)}
            validationErrors={errors}
            submitLabel="재제출"
            onSave={handleUpsert}
            onCancel={close}
          />
        )}

        {detail && target?.jobType === 'DELETE' && (
          <DeleteResubmitForm
            key={target.jobId}
            detail={detail as ContentDeleteJobDetail}
            errors={errors}
            pending={resubmit.isPending}
            onSubmit={handleDelete}
            onCancel={close}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
