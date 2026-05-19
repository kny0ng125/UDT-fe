'use client';

import { Button } from '@udt/ui/components/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@udt/ui/components/card';
import { Plus, X } from 'lucide-react';
import Image from 'next/image';
import type { ContentWithoutId } from '@type/admin/Content';
import type { JobValidationError } from '@type/admin/error';

interface CastInfoProps {
  formData: ContentWithoutId;
  setIsActorSearchOpen: (open: boolean) => void;
  removeCast: (castIdToRemove: number) => void;
  getFieldError?: (fieldPath: string) => JobValidationError | undefined;
}

export default function CastInfo({
  formData,
  setIsActorSearchOpen,
  removeCast,
  getFieldError,
}: CastInfoProps) {
  const castsErr = getFieldError?.('casts');
  return (
    <Card>
      <CardHeader>
        <CardTitle className="mt-5">출연진 정보</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {castsErr && <p className="text-xs text-red-600">{castsErr.message}</p>}
        <Button
          type="button"
          onClick={() => setIsActorSearchOpen(true)}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          출연진 검색 및 추가
        </Button>
        <div className="space-y-2 mb-5">
          {formData.casts.map((cast) => (
            <div
              key={cast.castId}
              className="flex items-center justify-between p-2 border rounded"
            >
              <div className="flex items-center gap-2">
                {cast.castImageUrl && (
                  <div className="relative w-12 h-12 rounded-full overflow-hidden shrink-0">
                    <Image
                      src={cast.castImageUrl}
                      alt={cast.castName || '출연진 이미지'}
                      fill
                      unoptimized
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  </div>
                )}
                <span>{cast.castName}</span>
              </div>
              <Button
                type="button"
                className="cursor-pointer"
                size="sm"
                onClick={() => removeCast(cast.castId)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
