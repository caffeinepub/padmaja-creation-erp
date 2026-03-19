import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Activity,
  AlertTriangle,
  Award,
  BarChart3,
  Medal,
  Package,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  useGetDashboardStats,
  useGetEmployees,
  useGetEntriesByDate,
  useGetOperatorRankingToday,
  useGetTargets,
} from "../../hooks/useQueries";

function today() {
  return new Date().toISOString().split("T")[0];
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const MEDAL_COLORS = [
  "text-yellow-400", // gold
  "text-slate-400", // silver
  "text-amber-600", // bronze
];

export default function AdminDashboard() {
  const todayStr = today();
  const statsQuery = useGetDashboardStats();
  const rankingQuery = useGetOperatorRankingToday(todayStr);
  const employeesQuery = useGetEmployees();
  const targetsQuery = useGetTargets();
  const entriesQuery = useGetEntriesByDate(todayStr);

  const employees = employeesQuery.data ?? [];
  const ranking = rankingQuery.data ?? [];
  const targets = targetsQuery.data ?? [];
  const entries = entriesQuery.data ?? [];

  const empMap = new Map(employees.map((e) => [e.id, e]));

  const sortedRanking = [...ranking].sort(
    (a, b) => Number(b.totalQty) - Number(a.totalQty),
  );
  const topPerformer = sortedRanking[0]
    ? (empMap.get(sortedRanking[0].employeeId)?.name ?? "—")
    : "—";
  const topPieces = sortedRanking[0] ? Number(sortedRanking[0].totalQty) : 0;

  // Efficiency rows
  const todayProdByEmployee = new Map<string, number>();
  for (const entry of entries) {
    const prev = todayProdByEmployee.get(entry.employeeId) ?? 0;
    todayProdByEmployee.set(entry.employeeId, prev + Number(entry.quantity));
  }
  const todayTargets = targets.filter((t) => t.date === todayStr);
  const targetByOp = new Map(
    todayTargets.map((t) => [t.operationId, Number(t.targetQty)]),
  );

  const efficiencyRows = employees
    .filter((e) => e.status === "Active" && todayProdByEmployee.has(e.id))
    .map((emp) => {
      const produced = todayProdByEmployee.get(emp.id) ?? 0;
      const avgTarget =
        targets.length > 0
          ? targets.reduce((s, t) => s + Number(t.targetQty), 0) /
            targets.length
          : 0;
      const empEntries = entries.filter((e) => e.employeeId === emp.id);
      let totalTarget = 0;
      for (const entry of empEntries) {
        const opTarget = targetByOp.get(entry.operationId);
        if (opTarget) totalTarget += opTarget;
      }
      if (totalTarget === 0) totalTarget = avgTarget || 1000;
      const efficiency = Math.round((produced / totalTarget) * 100);
      return { emp, produced, target: Math.round(totalTarget), efficiency };
    })
    .sort((a, b) => b.efficiency - a.efficiency);

  const avgEfficiency =
    efficiencyRows.length > 0
      ? Math.round(
          efficiencyRows.reduce((s, r) => s + r.efficiency, 0) /
            efficiencyRows.length,
        )
      : 0;

  const isLoading =
    statsQuery.isLoading || rankingQuery.isLoading || employeesQuery.isLoading;

  const activeEmployees = employees.filter((e) => e.status === "Active").length;

  // Top KPI cards
  const kpiTop = [
    {
      title: "Today's Production",
      value: statsQuery.data?.todayPieces?.toString() ?? "0",
      subtitle: "pieces produced today",
      icon: TrendingUp,
      accent: "text-blue-400",
      accentBg: "bg-blue-500/10",
      progress: Math.min(100, topPieces > 0 ? 85 : 0),
      progressColor: "bg-blue-500",
    },
    {
      title: "Running Bundles",
      value: statsQuery.data?.activeBundles?.toString() ?? "0",
      subtitle: "bundles in production",
      icon: Package,
      accent: "text-purple-400",
      accentBg: "bg-purple-500/10",
      progress: 60,
      progressColor: "bg-purple-500",
    },
    {
      title: "Active Workers",
      value: activeEmployees.toString(),
      subtitle: "employees on roster",
      icon: Users,
      accent: "text-teal-400",
      accentBg: "bg-teal-500/10",
      progress: 100,
      progressColor: "bg-teal-500",
    },
  ];

  // Second row smaller cards
  const kpiSecond = [
    {
      title: "Efficiency",
      value: avgEfficiency > 0 ? `${avgEfficiency}%` : "—",
      icon: Activity,
      accent:
        avgEfficiency >= 100
          ? "text-green-400"
          : avgEfficiency >= 80
            ? "text-amber-400"
            : "text-red-400",
      accentBg:
        avgEfficiency >= 100
          ? "bg-green-500/10"
          : avgEfficiency >= 80
            ? "bg-amber-500/10"
            : "bg-red-500/10",
    },
    {
      title: "Top Performer",
      value: topPerformer,
      icon: Award,
      accent: "text-yellow-400",
      accentBg: "bg-yellow-500/10",
    },
    {
      title: "Entries Today",
      value: entries.length.toString(),
      icon: BarChart3,
      accent: "text-indigo-400",
      accentBg: "bg-indigo-500/10",
    },
    {
      title: "Low Performer",
      value:
        sortedRanking.length > 1
          ? (empMap.get(sortedRanking[sortedRanking.length - 1]?.employeeId)
              ?.name ?? "—")
          : "—",
      icon: AlertTriangle,
      accent: "text-red-400",
      accentBg: "bg-red-500/10",
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-foreground">
          Dashboard Overview
        </h2>
        <p className="text-sm text-muted-foreground">{formatDate(todayStr)}</p>
      </div>

      {/* Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {kpiTop.map((card) => {
          const Icon = card.icon;
          return (
            <Card
              key={card.title}
              className="bg-card border-border shadow-card overflow-hidden"
            >
              <CardContent className="p-5">
                {isLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-9 w-24" />
                    <Skeleton className="h-2 w-full" />
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-medium text-muted-foreground">
                        {card.title}
                      </p>
                      <div
                        className={`w-9 h-9 rounded-lg ${card.accentBg} flex items-center justify-center`}
                      >
                        <Icon className={`w-5 h-5 ${card.accent}`} />
                      </div>
                    </div>
                    <p className={`text-4xl font-bold ${card.accent} mb-1`}>
                      {card.value}
                    </p>
                    <p className="text-xs text-muted-foreground mb-3">
                      {card.subtitle}
                    </p>
                    <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${card.progressColor} transition-all`}
                        style={{ width: `${card.progress}%` }}
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Second Row — Smaller Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {kpiSecond.map((card) => {
          const Icon = card.icon;
          return (
            <Card
              key={card.title}
              className="bg-card border-border shadow-card"
            >
              <CardContent className="p-4">
                {isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-6 w-20" />
                  </div>
                ) : (
                  <div className="flex items-start gap-2.5">
                    <div
                      className={`mt-0.5 w-8 h-8 rounded-lg ${card.accentBg} flex items-center justify-center flex-shrink-0`}
                    >
                      <Icon className={`w-4 h-4 ${card.accent}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground font-medium leading-tight">
                        {card.title}
                      </p>
                      <p className="font-bold text-sm text-foreground mt-0.5 truncate">
                        {card.value}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Bottom panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Operator Rankings */}
        <Card className="bg-card border-border shadow-card">
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Medal className="w-4 h-4 text-yellow-400" />
              Top Operators Today
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {rankingQuery.isLoading ? (
              <div className="p-4 space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : sortedRanking.length === 0 ? (
              <div
                className="p-8 text-center text-muted-foreground text-sm"
                data-ocid="ranking.empty_state"
              >
                No production entries today
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
                    <TableHead className="text-muted-foreground text-xs text-right">
                      Pieces
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedRanking.slice(0, 8).map((r, i) => (
                    <TableRow
                      key={r.employeeId}
                      data-ocid={`ranking.item.${i + 1}`}
                      className="border-border"
                    >
                      <TableCell>
                        {i < 3 ? (
                          <Medal className={`w-4 h-4 ${MEDAL_COLORS[i]}`} />
                        ) : (
                          <span className="text-xs text-muted-foreground font-mono w-4 inline-block text-center">
                            {i + 1}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="font-medium text-sm text-foreground">
                        {empMap.get(r.employeeId)?.name ?? r.employeeId}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-foreground">
                        {Number(r.totalQty).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Target vs Production */}
        <Card className="bg-card border-border shadow-card">
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-400" />
              Target vs Production
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-4 space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : efficiencyRows.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                No production data for today
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground text-xs">
                      Operator
                    </TableHead>
                    <TableHead className="text-muted-foreground text-xs text-right">
                      Produced
                    </TableHead>
                    <TableHead className="text-muted-foreground text-xs text-right">
                      Status
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {efficiencyRows.map((row, i) => {
                    const eff = row.efficiency;
                    const statusClass =
                      eff >= 100
                        ? "badge-green"
                        : eff >= 80
                          ? "badge-amber"
                          : "badge-red";
                    const statusLabel =
                      eff >= 100 ? "Above" : eff >= 80 ? "On Track" : "Low";
                    return (
                      <TableRow
                        key={row.emp.id}
                        data-ocid={`efficiency.item.${i + 1}`}
                        className="border-border"
                      >
                        <TableCell className="font-medium text-sm text-foreground">
                          {row.emp.name}
                        </TableCell>
                        <TableCell className="text-right text-sm font-mono text-foreground">
                          {row.produced.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusClass}`}
                          >
                            {statusLabel}
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

      {/* Recent Entries */}
      {entries.length > 0 && (
        <Card className="bg-card border-border shadow-card">
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              Live Production Feed
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground text-xs">
                    Employee
                  </TableHead>
                  <TableHead className="text-muted-foreground text-xs hidden sm:table-cell">
                    Bundle
                  </TableHead>
                  <TableHead className="text-muted-foreground text-xs text-right">
                    Qty
                  </TableHead>
                  <TableHead className="text-muted-foreground text-xs text-right">
                    Amount
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries
                  .slice(-8)
                  .reverse()
                  .map((entry, i) => (
                    <TableRow
                      key={entry.id}
                      data-ocid={`feed.item.${i + 1}`}
                      className="border-border"
                    >
                      <TableCell className="text-sm text-foreground font-medium">
                        {empMap.get(entry.employeeId)?.name ?? entry.employeeId}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground font-mono hidden sm:table-cell">
                        {entry.bundleId}
                      </TableCell>
                      <TableCell className="text-right text-sm font-mono text-foreground">
                        {Number(entry.quantity).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-sm font-mono text-green-400">
                        ₹{entry.amount.toFixed(0)}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
