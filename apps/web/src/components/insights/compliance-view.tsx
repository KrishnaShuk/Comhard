"use client";

import { useState } from "react";
import {
  addDaysToDateKey,
  getTodayInTz,
  type ComplianceBucket,
} from "@taskflow/shared";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { useTimeZone } from "@/hooks/use-time-zone";
import { formatPercent } from "@/lib/format";
import { errorMessage, useCompliance } from "@/lib/tasks";
import { cn } from "@/lib/cn";

const ranges = [7, 30, 90] as const;
type Range = (typeof ranges)[number];

function bucketTone(bucket: ComplianceBucket): string {
  if (bucket.rate === null) return "No data";
  if (bucket.rate >= bucket.target) return "At or above target";
  return "Below target";
}

function ComplianceChart({ buckets }: { buckets: ComplianceBucket[] }) {
  return (
    <div>
      <div className="relative h-36 border-b border-border">
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-[90%] border-t border-dashed border-border"
        />
        <div aria-hidden="true" className="flex h-full items-end gap-[2px]">
          {buckets.map((bucket) => (
            <div
              key={bucket.date}
              title={`${bucket.date}: ${formatPercent(bucket.rate)} (${bucket.met} met, ${bucket.breached} breached)`}
              className="group relative flex h-full flex-1 items-end"
            >
              {bucket.rate === null ? (
                <span className="h-[2px] w-full bg-border" />
              ) : (
                <span
                  className="w-full bg-foreground/70 transition-colors duration-100 group-hover:bg-foreground"
                  style={{ height: `${Math.max(bucket.rate * 100, 2)}%` }}
                />
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between text-xs leading-4 text-muted tabular">
        <span>{buckets[0]?.date}</span>
        <span>90% target</span>
        <span>{buckets[buckets.length - 1]?.date}</span>
      </div>
    </div>
  );
}

export function ComplianceView() {
  const timeZone = useTimeZone();
  const [range, setRange] = useState<Range>(30);
  const [custom, setCustom] = useState<{ from: string; to: string } | null>(null);
  const today = getTodayInTz(timeZone);
  const from = custom?.from ?? addDaysToDateKey(today, -(range - 1));
  const to = custom?.to ?? today;
  const report = useCompliance(from, to, timeZone);

  function chooseRange(next: Range): void {
    setRange(next);
    setCustom(null);
  }

  const total = report.data?.total;
  const belowTarget =
    total?.rate !== null && total?.rate !== undefined && total.rate < total.target;

  return (
    <div>
      <PageHeader
        title="Insights"
        description={
          report.data
            ? `Tasks created ${report.data.from} to ${report.data.to} · days bucketed in ${timeZone}`
            : "SLA compliance by day"
        }
      />

      <div className="mt-5 flex flex-wrap items-end gap-3">
        <div className="flex items-center gap-1 rounded-md border border-border bg-surface p-1">
          {ranges.map((value) => (
            <Button
              key={value}
              size="sm"
              variant={range === value && !custom ? "tint" : "ghost"}
              onClick={() => chooseRange(value)}
            >
              {value}d
            </Button>
          ))}
        </div>

        <div>
          <label htmlFor="range-from" className="mb-1 block text-xs text-muted">
            From
          </label>
          <Input
            id="range-from"
            type="date"
            value={from}
            max={to}
            onChange={(event) =>
              setCustom({ from: event.target.value, to })
            }
            className="w-40"
          />
        </div>

        <div>
          <label htmlFor="range-to" className="mb-1 block text-xs text-muted">
            To
          </label>
          <Input
            id="range-to"
            type="date"
            value={to}
            min={from}
            max={today}
            onChange={(event) =>
              setCustom({ from, to: event.target.value })
            }
            className="w-40"
          />
        </div>
      </div>

      <div className="mt-5">
        {report.isPending ? (
          <div className="space-y-4">
            <Skeleton className="h-40" />
            <Skeleton className="h-56" />
          </div>
        ) : null}

        {report.isError ? (
          <EmptyState
            title="Could not load compliance"
            description={errorMessage(report.error)}
            action={
              <Button variant="secondary" onClick={() => void report.refetch()}>
                Try again
              </Button>
            }
          />
        ) : null}

        {report.data ? (
          <div className="space-y-5">
            <section className="rounded-lg border border-border bg-surface p-5">
              <div className="flex flex-wrap items-start justify-between gap-6">
                <div>
                  <h2 className="text-xs font-medium uppercase tracking-wide text-muted">
                    SLA compliance
                  </h2>
                  <p className="mt-2 text-xl font-semibold leading-7 tabular">
                    {formatPercent(total?.rate ?? null)}
                  </p>
                  <p className="mt-1 text-sm leading-5 text-muted">
                    Target {Math.round((total?.target ?? 0.9) * 100)}%
                    {belowTarget ? " · below target" : ""}
                  </p>
                </div>

                <dl className="flex gap-6">
                  <div>
                    <dt className="text-xs text-muted">Met</dt>
                    <dd className="mt-1">
                      <span className="pill pill-met tabular">{total?.met ?? 0}</span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted">Breached</dt>
                    <dd className="mt-1">
                      <span className="pill pill-breached tabular">
                        {total?.breached ?? 0}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted">Denominator</dt>
                    <dd className="mt-1 text-sm font-medium tabular">
                      {total?.denominator ?? 0}
                    </dd>
                  </div>
                </dl>
              </div>

              <div
                role="img"
                aria-label={`Compliance ${formatPercent(total?.rate ?? null)}, target 90 percent`}
                className="relative mt-5 h-1.5 overflow-hidden rounded-full bg-border"
              >
                <div
                  className="h-full rounded-full bg-foreground/70"
                  style={{ width: `${(total?.rate ?? 0) * 100}%` }}
                />
                <span
                  aria-hidden="true"
                  className="absolute inset-y-0 left-[90%] w-px bg-foreground"
                />
              </div>

              {total?.rate === null ? (
                <p className="mt-3 text-xs leading-4 text-muted">
                  No data. Compliance appears once a task in the range is met or
                  breached.
                </p>
              ) : null}
            </section>

            <section className="rounded-lg border border-border bg-surface p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-sm font-medium leading-5">Daily compliance</h2>
                <p className="text-xs leading-4 text-muted">
                  Met vs breached, by creation day
                </p>
              </div>
              <div className="mt-4">
                <ComplianceChart buckets={report.data.buckets} />
              </div>
            </section>

            <section className="overflow-hidden rounded-lg border border-border bg-surface">
              <div className="max-h-80 overflow-auto">
                <table className="w-full border-collapse text-sm">
                  <caption className="sr-only">
                    Daily SLA compliance for {report.data.from} to {report.data.to}
                  </caption>
                  <thead className="sticky top-0 bg-background">
                    <tr className="h-8 border-b border-border text-left text-xs text-muted">
                      <th scope="col" className="px-3 font-medium">Date</th>
                      <th scope="col" className="px-3 text-right font-medium">Met</th>
                      <th scope="col" className="px-3 text-right font-medium">Breached</th>
                      <th scope="col" className="px-3 text-right font-medium">Compliance</th>
                      <th scope="col" className="px-3 font-medium">Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.data.buckets.map((bucket) => (
                      <tr
                        key={bucket.date}
                        className={cn(
                          "h-8 border-b border-border last:border-b-0",
                          bucket.rate === null && "text-muted",
                        )}
                      >
                        <td className="px-3 tabular">{bucket.date}</td>
                        <td className="px-3 text-right tabular">{bucket.met}</td>
                        <td className="px-3 text-right tabular">{bucket.breached}</td>
                        <td className="px-3 text-right tabular">
                          {formatPercent(bucket.rate)}
                        </td>
                        <td className="px-3 text-xs text-muted">{bucketTone(bucket)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        ) : null}
      </div>
    </div>
  );
}
