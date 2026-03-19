import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Medal, Target, TrendingUp } from "lucide-react";
import { useState } from "react";
import {
  useGetEmployees,
  useGetEntriesByDate,
  useGetOperatorRankingToday,
  useGetTargets,
} from "../../hooks/useQueries";

function today() {
  return new Date().toISOString().split("T")[0];
}

const MEDAL = [
  { color: "text-yellow-400", bg: "bg-yellow-400/10", label: "🥇" },
  { color: "text-slate-400", bg: "bg-slate-400/10", label: "🥈" },
  { color: "text-amber-600", bg: "bg-amber-600/10", label: "🥉" },
];

export default function PerformanceRankingPage() {
  const [date, setDate] = useState(today());
  const rankingQuery = useGetOperatorRankingToday(date);
  const employeesQuery = useGetEmployees();
  const entriesQuery = useGetEntriesByDate(date);
  const targetsQuery = useGetTargets();

  const employees = employeesQuery.data ?? [];
  const ranking = rankingQuery.data ?? [];
  const entries = entriesQuery.data ?? [];
  const targets = targetsQuery.data ?? [];

  const empMap = new Map(employees.map((e) => [e.id, e]));

  const dateTargets = targets.filter((t) => t.date === date);
  const targetByOp = new Map(
    dateTargets.map((t) => [t.operationId, Number(t.targetQty)]),
  );

  const avgTarget =
    targets.length > 0
      ? targets.reduce((s, t) => s + Number(t.targetQty), 0) / targets.length
      : 1000;

  const rows = [...ranking]
    .sort((a, b) => Number(b.totalQty) - Number(a.totalQty))
    .map((r, i) => {
      const empEntries = entries.filter((e) => e.employeeId === r.employeeId);
      let totalTarget = 0;
      for (const entry of empEntries) {
        const t = targetByOp.get(entry.operationId);
        if (t) totalTarget += t;
      }
      if (totalTarget === 0) totalTarget = avgTarget;
      const produced = Number(r.totalQty);
      const efficiency = Math.round((produced / totalTarget) * 100);
      return {
        rank: i + 1,
        employeeId: r.employeeId,
        produced,
        target: Math.round(totalTarget),
        efficiency,
      };
    });

  const isLoading = rankingQuery.isLoading || employeesQuery.isLoading;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Date filter */}
      <div className="flex items-center gap-3">
        <Medal className="w-5 h-5 text-yellow-400" />
        <h2 className="text-base font-semibold text-foreground flex-1">
          Performance Ranking
        </h2>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="bg-card border border-border text-foreground text-sm rounded-lg px-3 py-2 outline-none focus:border-primary"
          data-ocid="performance.date.input"
        />
      </div>

      {/* Top 3 podium */}
      {!isLoading && rows.slice(0, 3).length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {rows.slice(0, 3).map((row, i) => {
            const m = MEDAL[i];
            const emp = empMap.get(row.employeeId);
            return (
              <Card
                key={row.employeeId}
                className={`bg-card border shadow-card text-center ${
                  i === 0
                    ? "border-yellow-500/40 ring-1 ring-yellow-500/20"
                    : "border-border"
                }`}
              >
                <CardContent className="p-4">
                  <div
                    className={`w-10 h-10 rounded-full ${m.bg} flex items-center justify-center text-xl mx-auto mb-2`}
                  >
                    {m.label}
                  </div>
                  <p className="font-bold text-sm text-foreground truncate">
                    {emp?.name ?? "—"}
                  </p>
                  <p className={`text-lg font-bold ${m.color} mt-1`}>
                    {row.produced.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">pieces</p>
                  <p
                    className={`text-xs font-semibold mt-1 ${
                      row.efficiency >= 100
                        ? "text-green-400"
                        : row.efficiency >= 80
                          ? "text-amber-400"
                          : "text-red-400"
                    }`}
                  >
                    {row.efficiency}% efficiency
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Full table */}
      <Card className="bg-card border-border shadow-card">
        <CardHeader className="pb-3 border-b border-border">
          <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            Full Ranking — {date}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <div
              className="p-8 text-center text-muted-foreground"
              data-ocid="performance.empty_state"
            >
              <Target className="w-10 h-10 mx-auto mb-2 opacity-20" />
              <p className="text-sm">No production entries for this date</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground text-xs w-12">
                    Rank
                  </TableHead>
                  <TableHead className="text-muted-foreground text-xs">
                    Operator
                  </TableHead>
                  <TableHead className="text-muted-foreground text-xs hidden sm:table-cell">
                    Department
                  </TableHead>
                  <TableHead className="text-muted-foreground text-xs text-right">
                    Target
                  </TableHead>
                  <TableHead className="text-muted-foreground text-xs text-right">
                    Produced
                  </TableHead>
                  <TableHead className="text-muted-foreground text-xs text-right">
                    Efficiency
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => {
                  const emp = empMap.get(row.employeeId);
                  const effClass =
                    row.efficiency >= 100
                      ? "text-green-400"
                      : row.efficiency >= 80
                        ? "text-amber-400"
                        : "text-red-400";
                  const medal = MEDAL[row.rank - 1];
                  return (
                    <TableRow
                      key={row.employeeId}
                      data-ocid={`performance.item.${row.rank}`}
                      className="border-border"
                    >
                      <TableCell>
                        {row.rank <= 3 ? (
                          <span className="text-base">{medal?.label}</span>
                        ) : (
                          <span className="text-sm text-muted-foreground font-mono">
                            #{row.rank}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="font-medium text-sm text-foreground">
                        {emp?.name ?? row.employeeId}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground hidden sm:table-cell">
                        {emp?.department ?? "—"}
                      </TableCell>
                      <TableCell className="text-right text-sm font-mono text-muted-foreground">
                        {row.target.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-sm font-mono text-foreground font-semibold">
                        {row.produced.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={`text-sm font-bold ${effClass}`}>
                          {row.efficiency}%
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
