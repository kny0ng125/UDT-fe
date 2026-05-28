'use client';

import { Button } from '@udt/ui/components/button';
import { Input } from '@udt/ui/components/input';
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
import { Plus, X } from 'lucide-react';
import { PLATFORMS } from '@udt/shared/constants/platforms';
import type { ContentWithoutId, PlatformInfo } from '@type/admin/Content';
import type { JobValidationError } from '@type/admin/error';

interface PlatformSectionProps {
  formData: ContentWithoutId;
  newPlatform: PlatformInfo;
  setNewPlatform: (platform: PlatformInfo) => void;
  addPlatform: () => void;
  removePlatform: (index: number) => void;
  getFieldError?: (fieldPath: string) => JobValidationError | undefined;
}

export default function PlatformSection({
  formData,
  newPlatform,
  setNewPlatform,
  addPlatform,
  removePlatform,
  getFieldError,
}: PlatformSectionProps) {
  const platformsErr = getFieldError?.('platforms');
  return (
    <Card>
      <CardHeader>
        <CardTitle className="mt-5">시청 플랫폼 *</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 mb-5">
        {platformsErr && (
          <p className="text-xs text-red-600">{platformsErr.message}</p>
        )}
        <div className="grid grid-cols-2 gap-2 mb-2">
          <Select
            value={newPlatform.platformType}
            onValueChange={(value) =>
              setNewPlatform({
                ...newPlatform,
                platformType: value,
              })
            }
          >
            <SelectTrigger className="cursor-pointer">
              <SelectValue placeholder="플랫폼 선택" />
            </SelectTrigger>
            <SelectContent>
              {PLATFORMS.map((platform) => (
                <SelectItem
                  key={platform.id}
                  value={platform.label}
                  className="cursor-pointer"
                >
                  {platform.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            value={newPlatform.watchUrl}
            onChange={(e) =>
              setNewPlatform({ ...newPlatform, watchUrl: e.target.value })
            }
            placeholder="시청 URL"
          />
        </div>

        <Button
          type="button"
          onClick={addPlatform}
          className="w-full mb-10 cursor-pointer"
        >
          <Plus className="h-4 w-4 mr-2" />
          플랫폼 추가
        </Button>
        <div className="space-y-2">
          {formData.platforms.map((platform, index) => {
            const itemErr =
              getFieldError?.(`platforms[${index}]`) ??
              getFieldError?.(`platforms[${index}].watchUrl`) ??
              getFieldError?.(`platforms[${index}].platformType`);
            return (
              <div
                key={`${platform.platformType}-${platform.watchUrl}`}
                className={`flex items-center justify-between p-2 border rounded ${
                  itemErr ? 'border-destructive bg-red-50/40' : ''
                }`}
              >
                <div>
                  <div className="font-medium">{platform.platformType}</div>
                  <div className="text-sm text-gray-500">
                    {platform.watchUrl}
                  </div>
                  {itemErr && (
                    <div className="text-xs text-red-600 mt-1">
                      {itemErr.message}
                    </div>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  className="cursor-pointer"
                  size="sm"
                  onClick={() => removePlatform(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
