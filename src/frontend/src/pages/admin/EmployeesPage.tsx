import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Pencil, Plus, Search, Trash2, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Employee } from "../../backend.d";
import {
  useAddEmployee,
  useDeleteEmployee,
  useGetEmployees,
  useUpdateEmployee,
} from "../../hooks/useQueries";

type EmployeeForm = {
  name: string;
  phone: string;
  dept: string;
  salaryType: string;
  rate: string;
  bank: string;
  aadhaar: string;
  joinDate: string;
  status: string;
  skill: string;
  specialization: string;
};

const emptyForm: EmployeeForm = {
  name: "",
  phone: "",
  dept: "",
  salaryType: "Piece Rate",
  rate: "0",
  bank: "",
  aadhaar: "",
  joinDate: new Date().toISOString().split("T")[0],
  status: "Active",
  skill: "Beginner",
  specialization: "",
};

const DEPT_SUGGESTIONS = [
  "Finishing",
  "Stitching",
  "Cutting",
  "Packing",
  "Ironing",
  "Checking",
  "Embroidery",
  "Office",
];

export default function EmployeesPage() {
  const employeesQuery = useGetEmployees();
  const addMutation = useAddEmployee();
  const updateMutation = useUpdateEmployee();
  const deleteMutation = useDeleteEmployee();

  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null);
  const [form, setForm] = useState<EmployeeForm>(emptyForm);

  const employees = employeesQuery.data ?? [];
  const departments = [...new Set(employees.map((e) => e.department))].sort();

  const filtered = employees.filter((e) => {
    const matchSearch =
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.department.toLowerCase().includes(search.toLowerCase()) ||
      e.phone.includes(search);
    const matchDept = deptFilter === "all" || e.department === deptFilter;
    return matchSearch && matchDept;
  });

  const openAdd = () => {
    setEditEmployee(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (emp: Employee) => {
    setEditEmployee(emp);
    setForm({
      name: emp.name,
      phone: emp.phone,
      dept: emp.department,
      salaryType: emp.salaryType,
      rate: String(emp.ratePerPiece),
      bank: emp.bankAccount,
      aadhaar: emp.aadhaar,
      joinDate: emp.joinDate,
      status: emp.status,
      skill: emp.skillLevel,
      specialization: emp.specialization,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.dept.trim()) {
      toast.error("Name and department are required");
      return;
    }
    const rate = Number.parseFloat(form.rate) || 0;
    try {
      if (editEmployee) {
        await updateMutation.mutateAsync({
          id: editEmployee.id,
          name: form.name.trim(),
          phone: form.phone.trim(),
          dept: form.dept.trim(),
          salaryType: form.salaryType,
          rate,
          bank: form.bank.trim(),
          aadhaar: form.aadhaar.trim(),
          joinDate: form.joinDate,
          status: form.status,
          skill: form.skill,
          specialization: form.specialization.trim(),
        });
        toast.success("Employee updated");
      } else {
        await addMutation.mutateAsync({
          name: form.name.trim(),
          phone: form.phone.trim(),
          dept: form.dept.trim(),
          salaryType: form.salaryType,
          rate,
          bank: form.bank.trim(),
          aadhaar: form.aadhaar.trim(),
          joinDate: form.joinDate,
          status: form.status,
          skill: form.skill,
          specialization: form.specialization.trim(),
        });
        toast.success("Employee added successfully");
      }
      setDialogOpen(false);
    } catch {
      toast.error("Failed to save employee");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteMutation.mutateAsync(deleteId);
      toast.success("Employee deleted");
      setDeleteId(null);
    } catch {
      toast.error("Failed to delete employee");
    }
  };

  const isPending = addMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            data-ocid="employee.search_input"
            placeholder="Search by name, dept, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={deptFilter} onValueChange={setDeptFilter}>
          <SelectTrigger
            className="w-full sm:w-44"
            data-ocid="employee.filter.select"
          >
            <SelectValue placeholder="All Departments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {departments.map((d) => (
              <SelectItem key={d} value={d}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          data-ocid="employee.add_button"
          onClick={openAdd}
          className="gap-2 flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add Employee
        </Button>
      </div>

      <div className="rounded-xl border border-border overflow-hidden bg-card shadow-card">
        <Table data-ocid="employee.table">
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground text-xs">
                Employee
              </TableHead>
              <TableHead className="text-muted-foreground text-xs hidden sm:table-cell">
                Department
              </TableHead>
              <TableHead className="text-muted-foreground text-xs hidden md:table-cell">
                Salary Type
              </TableHead>
              <TableHead className="text-muted-foreground text-xs hidden lg:table-cell">
                Skill
              </TableHead>
              <TableHead className="text-muted-foreground text-xs">
                Status
              </TableHead>
              <TableHead className="text-muted-foreground text-xs w-20">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employeesQuery.isLoading ? (
              [1, 2, 3, 4, 5].map((sk) => (
                <TableRow key={sk}>
                  <TableCell colSpan={6}>
                    <Skeleton className="h-8 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-muted-foreground py-12"
                  data-ocid="employee.empty_state"
                >
                  <Users className="w-10 h-10 mx-auto mb-2 opacity-20" />
                  <p>No employees found</p>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((emp, i) => (
                <TableRow
                  key={emp.id}
                  data-ocid={`employee.item.${i + 1}`}
                  className="border-border"
                >
                  <TableCell>
                    <div className="font-medium text-sm text-foreground">
                      {emp.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {emp.phone}
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                    {emp.department}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium badge-blue">
                      {emp.salaryType}
                    </span>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        emp.skillLevel === "Master"
                          ? "badge-purple"
                          : emp.skillLevel === "Skilled"
                            ? "badge-blue"
                            : "badge-amber"
                      }`}
                    >
                      {emp.skillLevel}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        emp.status === "Active" ? "badge-green" : "badge-red"
                      }`}
                    >
                      {emp.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        data-ocid={`employee.edit_button.${i + 1}`}
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => openEdit(emp)}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        data-ocid={`employee.delete_button.${i + 1}`}
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        onClick={() => setDeleteId(emp.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          className="max-w-lg max-h-[90vh] overflow-y-auto"
          data-ocid="employee.dialog"
        >
          <DialogHeader>
            <DialogTitle>
              {editEmployee ? "Edit Employee" : "Add Employee"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="emp-name">Full Name *</Label>
                <Input
                  id="emp-name"
                  data-ocid="employee.name.input"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  required
                  placeholder="Employee full name"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="emp-phone">Phone</Label>
                <Input
                  id="emp-phone"
                  value={form.phone}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, phone: e.target.value }))
                  }
                  placeholder="9876543210"
                  inputMode="tel"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="emp-dept">Department *</Label>
                <Input
                  id="emp-dept"
                  value={form.dept}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, dept: e.target.value }))
                  }
                  required
                  placeholder="e.g. Stitching"
                  list="dept-suggestions"
                />
                <datalist id="dept-suggestions">
                  {DEPT_SUGGESTIONS.map((d) => (
                    <option key={d} value={d} />
                  ))}
                </datalist>
              </div>
              <div className="space-y-1.5">
                <Label>Salary Type *</Label>
                <Select
                  value={form.salaryType}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, salaryType: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Piece Rate">Piece Rate</SelectItem>
                    <SelectItem value="Monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="emp-rate">Rate per Piece (₹)</Label>
                <Input
                  id="emp-rate"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.rate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, rate: e.target.value }))
                  }
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Skill Level</Label>
                <Select
                  value={form.skill}
                  onValueChange={(v) => setForm((f) => ({ ...f, skill: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Beginner">Beginner</SelectItem>
                    <SelectItem value="Skilled">Skilled</SelectItem>
                    <SelectItem value="Master">Master</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Status *</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="emp-spec">Specialization</Label>
                <Input
                  id="emp-spec"
                  value={form.specialization}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, specialization: e.target.value }))
                  }
                  placeholder="e.g. Collar Stitching, Button Fixing"
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="emp-join">Join Date *</Label>
                <Input
                  id="emp-join"
                  type="date"
                  value={form.joinDate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, joinDate: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="emp-bank">Bank Account Number</Label>
                <Input
                  id="emp-bank"
                  data-ocid="employee.account_number.input"
                  value={form.bank}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, bank: e.target.value }))
                  }
                  placeholder="Bank account number"
                  inputMode="numeric"
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="emp-aadhaar">Aadhaar Number</Label>
                <Input
                  id="emp-aadhaar"
                  data-ocid="employee.aadhar_number.input"
                  value={form.aadhaar}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, aadhaar: e.target.value }))
                  }
                  placeholder="12-digit Aadhaar number"
                  maxLength={12}
                  inputMode="numeric"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                data-ocid="employee.cancel_button"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                data-ocid="employee.save_button"
                disabled={isPending}
              >
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editEmployee ? "Update" : "Add Employee"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
      >
        <AlertDialogContent data-ocid="employee.modal">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Employee</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this employee record from the
              blockchain.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="employee.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="employee.confirm_button"
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
