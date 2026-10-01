'use client';

import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  CheckCircle2,
  Download,
  Loader2,
  Plus,
  Trash2,
  Upload,
} from 'lucide-react';
import { Button } from '@udt/ui/components/button';
import { Input } from '@udt/ui/components/input';
import { showSimpleToast } from '@udt/ui/common/Toast';
import { CONTENT_CATEGORIES, RATING_OPTIONS } from '@constants/index';
import { postContent } from '@lib/apis/admin/postContent';
import { getCastsSearch } from '@lib/apis/admin/getCastsSearch';
import { getDirectorsSearch } from '@lib/apis/admin/getDirectorsSearch';
import { extractBulkValidationError } from '@utils/admin/extractBulkValidationError';
import { describeValidationError } from '@utils/admin/describeValidationError';
import {
  SHEET_COLUMNS,
  createEmptyRow,
  fieldToColumn,
  importTable,
  TEMPLATE_CSV,
  resolvePeople,
  toRegisterRequest,
  validateRow,
  type CellErrors,
  type SheetColumn,
  type SheetRow,
} from '@utils/admin/contentSheet';
import type { Cast, Director } from '@type/admin/Content';

type RowStatus = 'idle' | 'sending' | 'done' | 'failed';

interface RowResult {
  status: RowStatus;
  cellErrors: CellErrors;
  // 칸에 붙일 수 없는 오류(서버 처리 실패 등)
  message?: string;
}

const COLUMN_BY_KEY = Object.fromEntries(
  SHEET_COLUMNS.map((c) => [c.key, c]),
) as Record<SheetColumn, (typeof SHEET_COLUMNS)[number]>;

// 한 행을 카드로 보여줄 때 입력칸 순서와 차지하는 칸 수(작은 화면 2열, 큰 화면 12열).
const FIELD_ORDER: SheetColumn[] = [
  'title',
  'category',
  'rating',
  'openDate',
  'genres',
  'runningTime',
  'episode',
  'platforms',
  'directors',
  'casts',
];
const FIELD_SPAN: Record<SheetColumn, string> = {
  title: 'col-span-2 lg:col-span-4',
  category: 'col-span-1 lg:col-span-2',
  rating: 'col-span-1 lg:col-span-3',
  openDate: 'col-span-2 lg:col-span-3',
  genres: 'col-span-2 lg:col-span-4',
  runningTime: 'col-span-1 lg:col-span-2',
  episode: 'col-span-1 lg:col-span-2',
  platforms: 'col-span-2 lg:col-span-4',
  directors: 'col-span-1 lg:col-span-6',
  casts: 'col-span-1 lg:col-span-6',
};

interface ContentSheetProps {
  onClose: () => void;
}

export default function ContentSheet({ onClose }: ContentSheetProps) {
  const queryClient = useQueryClient();
  const nextId = useRef(1);
  const [rows, setRows] = useState<SheetRow[]>(() => [
    createEmptyRow(nextId.current++),
  ]);
  const [results, setResults] = useState<Record<number, RowResult>>({});
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isRunning, setIsRunning] = useState(false);

  // 같은 이름은 한 번만 조회한다.
  const castCache = useRef(new Map<string, Promise<Cast[]>>());
  const directorCache = useRef(new Map<string, Promise<Director[]>>());

  const findCasts = (name: string) => {
    if (!castCache.current.has(name)) {
      castCache.current.set(
        name,
        getCastsSearch({ name, size: 30 }).then((r) => r.item),
      );
    }
    return castCache.current.get(name)!;
  };
  const findDirectors = (name: string) => {
    if (!directorCache.current.has(name)) {
      directorCache.current.set(
        name,
        getDirectorsSearch({ name, size: 30 }).then((r) => r.item),
      );
    }
    return directorCache.current.get(name)!;
  };

  const setResult = (id: number, result: RowResult) =>
    setResults((prev) => ({ ...prev, [id]: result }));

  const updateCell = (id: number, key: SheetColumn, value: string) => {
    setRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [key]: value } : row)),
    );
    // 고치는 중인 칸의 오류는 지우고, 실패 상태는 다시 시도할 수 있게 되돌린다.
    setResults((prev) => {
      const current = prev[id];
      if (!current || current.status === 'done') return prev;
      const { [key]: _removed, ...rest } = current.cellErrors;
      return {
        ...prev,
        [id]: { status: 'idle', cellErrors: rest },
      };
    });
  };

  const addRow = () =>
    setRows((prev) => [...prev, createEmptyRow(nextId.current++)]);

  const removeRow = (id: number) => {
    setRows((prev) => prev.filter((row) => row.id !== id));
    setResults((prev) => {
      const { [id]: _removed, ...rest } = prev;
      return rest;
    });
  };

  // 불러온 텍스트(CSV/TSV)를 행으로 바꿔 표에 추가한다.
  const importText = (text: string) => {
    const {
      rows: parsed,
      adjusted,
      ignoredColumns,
    } = importTable(text, nextId.current);
    if (parsed.length === 0) {
      showSimpleToast.error({ message: '불러올 데이터가 없어요.' });
      return;
    }
    nextId.current += parsed.length;
    setRows((prev) => {
      // 비어 있는 첫 행(처음 상태)은 대체한다.
      const onlyEmpty =
        prev.length === 1 && SHEET_COLUMNS.every((c) => prev[0][c.key] === '');
      return onlyEmpty ? parsed : [...prev, ...parsed];
    });
    const notes = [
      adjusted > 0 ? `${adjusted}개 값을 형식에 맞게 바꿨어요` : '',
      ignoredColumns.length > 0
        ? `인식하지 못한 열은 건너뛰었어요(${ignoredColumns.join(', ')})`
        : '',
    ].filter(Boolean);
    showSimpleToast.success({
      message: `${parsed.length}개 행을 불러왔어요.${notes.length ? ` ${notes.join(' · ')}` : ''}`,
      position: 'top-center',
    });
  };

  const importFile = async (file: File) => {
    if (/\.(xlsx|xls)$/i.test(file.name)) {
      showSimpleToast.error({
        message:
          '엑셀 파일은 아직 읽지 못해요. 엑셀에서 "CSV UTF-8"로 저장한 파일을 올려 주세요.',
      });
      return;
    }
    const buffer = await file.arrayBuffer();
    let text: string;
    try {
      text = new TextDecoder('utf-8', { fatal: true }).decode(buffer);
    } catch {
      // 엑셀의 "CSV(쉼표로 분리)"는 한글 윈도우에서 EUC-KR(CP949)로 저장된다.
      text = new TextDecoder('euc-kr').decode(buffer);
    }
    importText(text);
  };

  const downloadTemplate = () => {
    const url = URL.createObjectURL(
      new Blob([TEMPLATE_CSV], { type: 'text/csv;charset=utf-8' }),
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = '콘텐츠_등록_양식.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearDone = () => {
    setRows((prev) => prev.filter((row) => results[row.id]?.status !== 'done'));
    setResults((prev) =>
      Object.fromEntries(
        Object.entries(prev).filter(([, r]) => r.status !== 'done'),
      ),
    );
  };

  // 한 행을 검증하고(형식 → 인물 조회) 통과하면 등록한다.
  const submitRow = async (row: SheetRow): Promise<boolean> => {
    const cellErrors = validateRow(row);
    if (Object.keys(cellErrors).length > 0) {
      setResult(row.id, { status: 'failed', cellErrors });
      return false;
    }

    let people;
    try {
      people = await resolvePeople(row, findCasts, findDirectors);
    } catch {
      setResult(row.id, {
        status: 'failed',
        cellErrors: {},
        message: '감독/출연진을 조회하지 못했어요. 잠시 후 다시 시도해 주세요.',
      });
      return false;
    }
    if (Object.keys(people.errors).length > 0) {
      setResult(row.id, { status: 'failed', cellErrors: people.errors });
      return false;
    }

    setResult(row.id, { status: 'sending', cellErrors: {} });
    try {
      await postContent(toRegisterRequest(row, people.casts, people.directors));
      setResult(row.id, { status: 'done', cellErrors: {} });
      return true;
    } catch (error) {
      const bulk = extractBulkValidationError(error);
      if (bulk) {
        // 서버가 막은 값은 해당 칸에 붙이고, 어떤 값이 왜 틀렸는지 문장으로 보여준다.
        const errs: CellErrors = {};
        const lookup = {
          casts: people.casts,
          directors: people.directors,
          categories: [
            {
              categoryType: row.category,
              genres: [],
            },
          ],
        };
        const lines: string[] = [];
        bulk.errors.forEach((e) => {
          const { target, reason } = describeValidationError(e, lookup);
          const col = fieldToColumn(e.field);
          const text = `${target} · ${reason}`;
          if (col) errs[col] = errs[col] ? `${errs[col]} / ${text}` : text;
          else lines.push(text);
        });
        setResult(row.id, {
          status: 'failed',
          cellErrors: errs,
          message: lines.length > 0 ? lines.join(' / ') : undefined,
        });
      } else {
        const noResponse =
          typeof error === 'object' &&
          error !== null &&
          'isAxiosError' in error &&
          !(error as { response?: unknown }).response;
        setResult(row.id, {
          status: 'failed',
          cellErrors: {},
          message: noResponse
            ? '서버에 연결하지 못했어요. 연결을 확인하고 이 행만 다시 시도해 주세요.'
            : '서버 처리에 실패했어요. 잠시 후 이 행만 다시 시도해 주세요.',
        });
      }
      return false;
    }
  };

  const handleSubmit = async () => {
    const targets = rows.filter((row) => results[row.id]?.status !== 'done');
    if (targets.length === 0) {
      showSimpleToast.error({ message: '등록할 행이 없어요.' });
      return;
    }
    setIsRunning(true);
    let success = 0;
    // 한 번에 하나씩 보낸다(서버 부담과 오류 위치 파악을 위해).
    for (const row of targets) {
      if (await submitRow(row)) success += 1;
    }
    setIsRunning(false);

    if (success > 0) {
      queryClient.invalidateQueries({ queryKey: ['infiniteAdminContentList'] });
      queryClient.invalidateQueries({ queryKey: ['categoryMetrics'] });
    }
    const failed = targets.length - success;
    if (failed === 0) {
      showSimpleToast.success({
        message: `${success}건을 등록했어요.`,
        position: 'top-center',
      });
    } else {
      showSimpleToast.error({
        message: `${success}건 등록, ${failed}건은 확인이 필요해요.`,
        position: 'top-center',
      });
    }
  };

  const pendingCount = rows.filter(
    (row) => results[row.id]?.status !== 'done',
  ).length;
  const doneCount = rows.length - pendingCount;

  return (
    <div className="min-w-0 max-w-full space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          const file = e.dataTransfer.files?.[0];
          if (file) void importFile(file);
        }}
        className={`flex flex-col items-center gap-2 rounded-lg border-2 border-dashed px-4 py-6 text-center ${
          isDragging ? 'border-slate-900 bg-slate-50' : 'border-gray-300'
        }`}
      >
        <Upload className="h-6 w-6 text-gray-400" />
        <p className="text-sm text-gray-700">
          CSV 파일을 끌어다 놓거나 선택하면 표로 바꿔 줘요.
        </p>
        <p className="text-xs text-gray-500">
          열 이름(제목, 분류, 장르, 등급, 러닝타임, 회차, 개봉일, 플랫폼, 감독,
          출연진)으로 자동 인식하고, 값 표기(날짜, 등급, 플랫폼 이름 등)도 맞춰
          줘요.
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isRunning}
            className="cursor-pointer"
          >
            파일 선택
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={downloadTemplate}
            className="cursor-pointer"
          >
            <Download className="mr-1 h-4 w-4" /> 양식 받기
          </Button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.tsv,.txt,text/csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void importFile(file);
            e.target.value = '';
          }}
        />
      </div>

      <div className="space-y-3">
        {rows.map((row, index) => {
          const result = results[row.id];
          const status = result?.status ?? 'idle';
          const locked = status === 'done' || status === 'sending';
          return (
            <div
              key={row.id}
              className={`rounded-lg border p-3 ${
                status === 'done'
                  ? 'border-green-200 bg-green-50/40'
                  : status === 'failed'
                    ? 'border-red-200'
                    : ''
              }`}
            >
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-semibold text-gray-700">
                    {index + 1}번
                  </span>
                  {status === 'sending' && (
                    <span className="inline-flex items-center gap-1 text-gray-600">
                      <Loader2 className="h-4 w-4 animate-spin" /> 등록 중
                    </span>
                  )}
                  {status === 'done' && (
                    <span className="inline-flex items-center gap-1 text-green-600">
                      <CheckCircle2 className="h-4 w-4" /> 완료
                    </span>
                  )}
                  {status === 'failed' && (
                    <span className="inline-flex items-center gap-1 text-red-600">
                      <AlertCircle className="h-4 w-4" /> 확인 필요
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  aria-label={`${index + 1}번 행 삭제`}
                  disabled={status === 'sending' || isRunning}
                  onClick={() => removeRow(row.id)}
                  className="cursor-pointer rounded p-1 text-gray-400 hover:text-red-600 disabled:cursor-not-allowed"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {result?.message && (
                <p className="mb-2 text-xs text-red-600">{result.message}</p>
              )}

              <div className="grid grid-cols-2 gap-x-3 gap-y-2 lg:grid-cols-12">
                {FIELD_ORDER.map((key) => {
                  const col = COLUMN_BY_KEY[key];
                  const err = result?.cellErrors[key];
                  return (
                    <div key={key} className={FIELD_SPAN[key]}>
                      <label
                        htmlFor={`sheet-${row.id}-${key}`}
                        className="mb-1 block text-xs font-medium text-gray-600"
                      >
                        {col.label}
                      </label>
                      <Input
                        id={`sheet-${row.id}-${key}`}
                        value={row[key]}
                        list={
                          key === 'category'
                            ? 'sheet-categories'
                            : key === 'rating'
                              ? 'sheet-ratings'
                              : undefined
                        }
                        placeholder={col.placeholder}
                        disabled={locked || isRunning}
                        aria-invalid={Boolean(err)}
                        onChange={(e) =>
                          updateCell(row.id, key, e.target.value)
                        }
                        className="h-9 w-full text-sm"
                      />
                      {err && (
                        <p className="mt-1 text-xs text-red-600">{err}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <datalist id="sheet-categories">
        {CONTENT_CATEGORIES.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>
      <datalist id="sheet-ratings">
        {RATING_OPTIONS.map((r) => (
          <option key={r} value={r} />
        ))}
      </datalist>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addRow}
            disabled={isRunning}
            className="cursor-pointer"
          >
            <Plus className="mr-1 h-4 w-4" /> 행 추가
          </Button>
          {doneCount > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearDone}
              disabled={isRunning}
              className="cursor-pointer"
            >
              완료된 행 지우기 ({doneCount})
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isRunning}
            className="cursor-pointer"
          >
            닫기
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isRunning || pendingCount === 0}
            className="cursor-pointer"
          >
            {isRunning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 등록 중...
              </>
            ) : (
              `${pendingCount}건 등록`
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
