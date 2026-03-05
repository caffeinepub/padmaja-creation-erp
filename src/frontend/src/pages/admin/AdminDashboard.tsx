import { Badge } from "@/components/ui/badge";
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
import {
  Activity,
  AlertTriangle,
  Award,
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

function getEfficiencyStatus(efficiency: number) {
  if (efficiency >= 100)
    return {
      label: "Above Target",
      className: "bg-green-100 text-green-800",
    };
  if (efficiency >= 80)
    return {
      label: "Slightly Low",
      className: "bg-yellow-100 text-yellow-800",
    };
  return { label: "Low", className: "bg-red-100 text-red-800" };
}

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

  // Build employee map
  const empMap = new Map(employees.map((e) => [e.id, e]));

  // Top and bottom performer
  const sortedRanking = [...ranking].sort(
    (a, b) => Number(b.totalQty) - Number(a.totalQty),
  );
  const topPerformer = sortedRanking[0]
    ? `${empMap.get(sortedRanking[0].employeeId)?.name ?? "—"} (${sortedRanking[0].totalQty} pcs)`
    : "No data today";
  const lowPerformer =
    sortedRanking[sortedRanking.length - 1] && sortedRanking.length > 1
      ? `${empMap.get(sortedRanking[sortedRanking.length - 1].employeeId)?.name ?? "—"} (${sortedRanking[sortedRanking.length - 1].totalQty} pcs)`
      : "No data today";

  // Efficiency calculations per employee for today
  const todayProdByEmployee = new Map<string, number>();
  for (const entry of entries) {
    const prev = todayProdByEmployee.get(entry.employeeId) ?? 0;
    todayProdByEmployee.set(entry.employeeId, prev + Number(entry.quantity));
  }

  // Get targets for today
  const todayTargets = targets.filter((t) => t.date === todayStr);
  const targetByOp = new Map(
    todayTargets.map((t) => [t.operationId, Number(t.targetQty)]),
  );

  // Build per-employee efficiency data
  const efficiencyRows = employees
    .filter((e) => e.status === "Active" && todayProdByEmployee.has(e.id))
    .map((emp) => {
      const produced = todayProdByEmployee.get(emp.id) ?? 0;
      // Use average target from all operations as rough daily target per employee
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

  const kpiCards = [
    {
      title: "Total Production Today",
      value: statsQuery.data ? statsQuery.data.todayProduction.toString() : "—",
      subtitle: "pieces produced",
      icon: TrendingUp,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      title: "Running Bundles",
      value: statsQuery.data
        ? statsQuery.data.runningBundlesCount.toString()
        : "—",
      subtitle: "in progress",
      icon: Package,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
    },
    {
      title: "Active Employees",
      value: employees.filter((e) => e.status === "Active").length.toString(),
      subtitle: "working today",
      icon: Users,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      title: "Top Performer",
      value: empMap.get(sortedRanking[0]?.employeeId)?.name ?? "—",
      subtitle: sortedRanking[0]
        ? `${sortedRanking[0].totalQty} pcs`
        : "No entries today",
      icon: Award,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      title: "Low Performer",
      value:
        empMap.get(sortedRanking[sortedRanking.length - 1]?.employeeId)?.name ??
        "—",
      subtitle:
        sortedRanking.length > 1
          ? `${sortedRanking[sortedRanking.length - 1]?.totalQty} pcs`
          : "Not enough data",
      icon: AlertTriangle,
      color: "text-red-600",
      bg: "bg-red-50",
    },
    {
      title: "Production Efficiency",
      value:
        efficiencyRows.length > 0
          ? `${Math.round(efficiencyRows.reduce((s, r) => s + r.efficiency, 0) / efficiencyRows.length)}%`
          : "—",
      subtitle: "average today",
      icon: Activity,
      color: "text-violet-600",
      bg: "bg-violet-50",
    },
  ];

  const isLoading =
    statsQuery.isLoading || rankingQuery.isLoading || employeesQuery.isLoading;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title} className="shadow-card">
              <CardContent className="p-4">
                {isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-7 w-16" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${card.bg} flex-shrink-0`}>
                      <Icon className={`w-4 h-4 ${card.color}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground font-medium leading-tight mb-0.5">
                        {card.title}
                      </p>
                      <p className="font-display font-bold text-lg leading-tight text-foreground truncate">
                        {card.value}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {card.subtitle}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Operator Ranking */}
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-display flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
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
              <div className="p-6 text-center text-muted-foreground text-sm">
                No production entries today
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Rank</TableHead>
                    <TableHead>Operator</TableHead>
                    <TableHead className="text-right">Total Pcs</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedRanking.slice(0, 10).map((r, i) => (
                    <TableRow
                      key={r.employeeId}
                      data-ocid={`ranking.item.${i + 1}`}
                    >
                      <TableCell>
                        <span
                          className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                            i === 0
                              ? "bg-amber-100 text-amber-700"
                              : i === 1
                                ? "bg-slate-100 text-slate-600"
                                : i === 2
                                  ? "bg-orange-100 text-orange-700"
                                  : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {i + 1}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium">
                        {empMap.get(r.employeeId)?.name ?? r.employeeId}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
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
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-display flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-500" />
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
              <div className="p-6 text-center text-muted-foreground text-sm">
                No production data available today
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Operator</TableHead>
                    <TableHead className="text-right">Target</TableHead>
                    <TableHead className="text-right">Produced</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {efficiencyRows.map((row, i) => {
                    const status = getEfficiencyStatus(row.efficiency);
                    return (
                      <TableRow
                        key={row.emp.id}
                        data-ocid={`efficiency.item.${i + 1}`}
                      >
                        <TableCell className="font-medium text-sm">
                          {row.emp.name}
                        </TableCell>
                        <TableCell className="text-right text-sm font-mono">
                          {row.target.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right text-sm font-mono">
                          {row.produced.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge
                            className={`text-xs ${status.className}`}
                            variant="secondary"
                          >
                            {status.label}
                          </Badge>
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

      {/* Summary row */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <Card className="shadow-card">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Top Performer</p>
            <p className="font-medium text-foreground">{topPerformer}</p>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">
              Lowest Performer
            </p>
            <p className="font-medium text-foreground">{lowPerformer}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
