'use client';

import { Button } from '@udt/ui/components/button';
import { Input } from '@udt/ui/components/input';
import { Label } from '@udt/ui/components/label';
import { Textarea } from '@udt/ui/components/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@udt/ui/components/select';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@udt/ui/components/card';
import { Upload, Image as ImageIcon } from 'lucide-react';
import { RATING_OPTIONS } from '@constants/index';
import Image from 'next/image';
import type { ContentWithoutId } from '@type/admin/Content';
import type { JobValidationError } from '@type/admin/error';
import type { UseMutationResult } from '@tanstack/react-query';
import { useRef } from 'react';

interface BasicInfoProps {
  formData: ContentWithoutId;
  updateFormData: (
    updater: (prev: ContentWithoutId) => ContentWithoutId,
  ) => void;
  handleImageUpload: (
    files: FileList | null,
    imageType: 'poster' | 'backdrop',
  ) => Promise<void>;
  uploadImagesMutation: UseMutationResult<
    { data: { uploadedFileUrls: string[] } },
    Error,
    File[],
    unknown
  >;
  getFieldError?: (fieldPath: string) => JobValidationError | undefined;
}

export default function BasicInfo({
  formData,
  updateFormData,
  handleImageUpload,
  uploadImagesMutation,
  getFieldError,
}: BasicInfoProps) {
  const posterInputRef = useRef<HTMLInputElement>(null);
  const backdropInputRef = useRef<HTMLInputElement>(null);

  const titleErr = getFieldError?.('title');
  const ratingErr = getFieldError?.('rating');
  const descriptionErr = getFieldError?.('description');
  const posterErr = getFieldError?.('posterUrl');
  const backdropErr = getFieldError?.('backdropUrl');
  const trailerErr = getFieldError?.('trailerUrl');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="mt-5">기본 정보</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="title" className="mb-3">
              제목 *
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) =>
                updateFormData((prev) => ({
                  ...prev,
                  title: e.target.value,
                }))
              }
              aria-invalid={!!titleErr}
              required
            />
            {titleErr && (
              <p className="mt-1 text-xs text-red-600">{titleErr.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="rating" className="mb-3">
              관람등급 *
            </Label>
            <Select
              value={formData.rating}
              onValueChange={(value) =>
                updateFormData((prev) => ({ ...prev, rating: value }))
              }
            >
              <SelectTrigger
                aria-invalid={!!ratingErr}
                className={`cursor-pointer ${
                  ratingErr ? 'border-destructive ring-destructive/20' : ''
                }`}
              >
                <SelectValue placeholder="관람등급 선택" />
              </SelectTrigger>
              <SelectContent>
                {RATING_OPTIONS.map((rating) => (
                  <SelectItem
                    key={rating}
                    value={rating}
                    className="cursor-pointer"
                  >
                    {rating}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {ratingErr && (
              <p className="mt-1 text-xs text-red-600">{ratingErr.message}</p>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="description" className="mb-3">
            줄거리
          </Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) =>
              updateFormData((prev) => ({
                ...prev,
                description: e.target.value,
              }))
            }
            aria-invalid={!!descriptionErr}
            rows={4}
          />
          {descriptionErr && (
            <p className="mt-1 text-xs text-red-600">
              {descriptionErr.message}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="posterUpload" className="mb-3">
              포스터 이미지
            </Label>
            <div
              className={`space-y-2 ${
                posterErr
                  ? 'rounded-md border border-destructive bg-red-50/40 p-2'
                  : ''
              }`}
            >
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => posterInputRef.current?.click()}
                  disabled={uploadImagesMutation.isPending}
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  {uploadImagesMutation.isPending
                    ? '업로드 중...'
                    : '이미지 선택'}
                </Button>
                {formData.posterUrl && (
                  <div className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-green-600">업로드 완료</span>
                  </div>
                )}
              </div>
              <input
                ref={posterInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e.target.files, 'poster')}
                className="hidden"
              />
              {formData.posterUrl && (
                <div className="relative w-20 h-28 border rounded overflow-hidden">
                  <Image
                    src={formData.posterUrl}
                    alt="포스터 미리보기"
                    fill
                    unoptimized
                    className="object-cover"
                  />
                </div>
              )}
              {posterErr && (
                <p className="mt-1 text-xs text-red-600">{posterErr.message}</p>
              )}
            </div>
          </div>
          <div>
            <Label htmlFor="backdropUpload" className="mb-3">
              배경 이미지
            </Label>
            <div
              className={`space-y-2 ${
                backdropErr
                  ? 'rounded-md border border-destructive bg-red-50/40 p-2'
                  : ''
              }`}
            >
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => backdropInputRef.current?.click()}
                  disabled={uploadImagesMutation.isPending}
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  {uploadImagesMutation.isPending
                    ? '업로드 중...'
                    : '이미지 선택'}
                </Button>
                {formData.backdropUrl && (
                  <div className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-green-600">업로드 완료</span>
                  </div>
                )}
              </div>
              <input
                ref={backdropInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e.target.files, 'backdrop')}
                className="hidden"
              />
              {formData.backdropUrl && (
                <div className="relative w-32 h-20 border rounded overflow-hidden">
                  <Image
                    src={formData.backdropUrl}
                    alt="배경 이미지 미리보기"
                    fill
                    unoptimized
                    className="object-cover"
                  />
                </div>
              )}
              {backdropErr && (
                <p className="mt-1 text-xs text-red-600">
                  {backdropErr.message}
                </p>
              )}
            </div>
          </div>
        </div>

        <div>
          <Label htmlFor="trailerUrl" className="mb-3">
            예고편 URL
          </Label>
          <Input
            id="trailerUrl"
            value={formData.trailerUrl}
            onChange={(e) =>
              updateFormData((prev) => ({
                ...prev,
                trailerUrl: e.target.value,
              }))
            }
            aria-invalid={!!trailerErr}
            className="mb-1"
          />
          {trailerErr && (
            <p className="mb-5 mt-1 text-xs text-red-600">
              {trailerErr.message}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
