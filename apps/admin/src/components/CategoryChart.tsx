'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@udt/ui/components/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@udt/ui/components/chart';
import { PieChart, Pie, Cell } from 'recharts';
import { CHART_COLORS } from '@constants/index';
import { useMemo } from 'react';
import { CategoryMetric } from '@type/admin/CategoryMetric';
import StatePanel from '@components/StatePanel';

interface CategoryChartProps {
  categoryMetrics?: CategoryMetric[];
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
}
export default function CategoryChart({
  categoryMetrics = [],
  isLoading = false,
  isError = false,
  onRetry,
}: CategoryChartProps) {
  const formattedData = useMemo(() => {
    return categoryMetrics.map((item) => ({
      name: item.categoryType,
      count: item.count,
      fill: CHART_COLORS[item.categoryId % CHART_COLORS.length],
    }));
  }, [categoryMetrics]);

  const totalCount = formattedData.reduce((sum, item) => sum + item.count, 0);

  const chartConfig = useMemo(() => {
    return categoryMetrics.reduce(
      (acc, item) => {
        acc[item.categoryType] = {
          label: item.categoryType,
          color: CHART_COLORS[item.categoryId % CHART_COLORS.length],
        };
        return acc;
      },
      {} as Record<string, { label: string; color: string }>,
    );
  }, [categoryMetrics]);

  return (
    <Card className="bg-white py-5 gap-4">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-gray-900">
          콘텐츠 분포
        </CardTitle>
        <CardDescription>카테고리별 콘텐츠 비율</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <StatePanel state="loading" className="h-[260px]" />
        ) : isError ? (
          <StatePanel state="error" className="h-[260px]" onRetry={onRetry} />
        ) : totalCount === 0 ? (
          <StatePanel
            state="empty"
            message="등록된 콘텐츠가 없어요."
            className="h-[260px]"
          />
        ) : (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[260px] w-full"
          >
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <Pie
                data={formattedData}
                dataKey="count"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
              >
                {formattedData.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
