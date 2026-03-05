import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Target {
    id: string;
    date: string;
    targetQty: bigint;
    operationId: string;
}
export interface ProductionEntry {
    id: string;
    date: string;
    rate: number;
    employeeId: string;
    operationId: string;
    quantity: bigint;
    bundleId: string;
    amount: number;
}
export interface Operation {
    id: string;
    dailyTarget: bigint;
    name: string;
    ratePerPiece: number;
    department: string;
}
export interface Attendance {
    id: string;
    status: string;
    date: string;
    employeeId: string;
}
export interface Bundle {
    id: string;
    status: string;
    styleNumber: string;
    color: string;
    size: string;
    createdDate: string;
    quantity: bigint;
}
export interface Employee {
    id: string;
    status: string;
    joinDate: string;
    name: string;
    salaryType: string;
    phone: string;
    department: string;
}
export interface DashboardStats {
    todayProduction: bigint;
    runningBundlesCount: bigint;
}
export interface UserProfile {
    name: string;
    role: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addBundle(styleNumber: string, size: string, color: string, qty: bigint, createdDate: string, status: string): Promise<string>;
    addEmployee(name: string, phone: string, dept: string, salaryType: string, joinDate: string, status: string): Promise<string>;
    addOperation(name: string, rate: number, dept: string, target: bigint): Promise<string>;
    addProductionEntry(date: string, employeeId: string, operationId: string, bundleId: string, qty: bigint, rate: number, amount: number): Promise<string>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    deleteBundle(id: string): Promise<void>;
    deleteEmployee(id: string): Promise<void>;
    deleteOperation(id: string): Promise<void>;
    getAllAttendance(): Promise<Array<Attendance>>;
    getAttendanceByDate(date: string): Promise<Array<Attendance>>;
    getBundle(_id: string): Promise<Bundle | null>;
    getBundleProgress(bundleId: string): Promise<Array<{
        completed: boolean;
        operationId: string;
    }>>;
    getBundles(): Promise<Array<Bundle>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getDashboardStats(): Promise<DashboardStats>;
    getEmployee(_id: string): Promise<Employee | null>;
    getEmployees(): Promise<Array<Employee>>;
    getEntriesByDate(date: string): Promise<Array<ProductionEntry>>;
    getEntriesByEmployee(employeeId: string): Promise<Array<ProductionEntry>>;
    getEntriesByMonth(year: bigint, month: bigint): Promise<Array<ProductionEntry>>;
    getMonthlySalary(year: bigint, month: bigint): Promise<Array<{
        totalPieces: bigint;
        employeeId: string;
        totalAmount: number;
    }>>;
    getOperation(_id: string): Promise<Operation | null>;
    getOperations(): Promise<Array<Operation>>;
    getOperatorRankingToday(todayDate: string): Promise<Array<{
        totalQty: bigint;
        employeeId: string;
    }>>;
    getProductionEntries(): Promise<Array<ProductionEntry>>;
    getTargets(): Promise<Array<Target>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    markAttendance(date: string, employeeId: string, status: string): Promise<string>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setTarget(operationId: string, qty: bigint, date: string): Promise<string>;
    updateAttendance(id: string, date: string, employeeId: string, status: string): Promise<void>;
    updateBundle(id: string, styleNumber: string, size: string, color: string, qty: bigint, createdDate: string, status: string): Promise<void>;
    updateEmployee(id: string, name: string, phone: string, dept: string, salaryType: string, joinDate: string, status: string): Promise<void>;
    updateOperation(id: string, name: string, rate: number, dept: string, target: bigint): Promise<void>;
}
