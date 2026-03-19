import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Operation {
    id: string;
    dailyTarget: bigint;
    name: string;
    ratePerPiece: number;
    department: string;
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
    supervisorId: string;
}
export interface InventoryItem {
    id: string;
    stockQty: bigint;
    unit: string;
    itemName: string;
}
export interface Attendance {
    id: string;
    status: string;
    checkIn: string;
    date: string;
    employeeId: string;
    checkOut: string;
}
export interface Bundle {
    id: string;
    status: string;
    dateCreated: string;
    color: string;
    size: string;
    stage: string;
    style: string;
    quantity: bigint;
    priority: string;
    qrCode: string;
}
export interface Employee {
    id: string;
    status: string;
    bankAccount: string;
    joinDate: string;
    name: string;
    aadhaar: string;
    specialization: string;
    ratePerPiece: number;
    salaryType: string;
    skillLevel: string;
    phone: string;
    department: string;
}
export interface QualityControl {
    id: string;
    rejectedQty: bigint;
    reworkStatus: string;
    operationId: string;
    bundleId: string;
    reason: string;
}
export interface Report {
    totalPieces: bigint;
    employeeId: string;
    totalAmount: number;
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
    addBulkProductionEntries(entries: Array<ProductionEntry>): Promise<void>;
    addBundle(style: string, size: string, color: string, qty: bigint, date: string, status: string, stage: string, priority: string): Promise<string>;
    addEmployee(name: string, phone: string, dept: string, salaryType: string, rate: number, bank: string, aadhaar: string, joinDate: string, status: string, skill: string, specialization: string): Promise<string>;
    addInventoryItem(itemName: string, stockQty: bigint, unit: string): Promise<string>;
    addOperation(name: string, dept: string, rate: number, target: bigint): Promise<string>;
    addProductionEntry(date: string, employeeId: string, supervisorId: string, operationId: string, bundleId: string, qty: bigint, rate: number, amount: number): Promise<string>;
    addQualityControl(bundleId: string, operationId: string, qty: bigint, reason: string, rework: string): Promise<string>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    deleteBundle(id: string): Promise<void>;
    deleteEmployee(id: string): Promise<void>;
    deleteOperation(id: string): Promise<void>;
    getAttendanceByDate(date: string): Promise<Array<Attendance>>;
    getBundle(_id: string): Promise<Bundle | null>;
    getBundleByQRCode(qrCode: string): Promise<Bundle | null>;
    getBundles(): Promise<Array<Bundle>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getEmployee(_id: string): Promise<Employee | null>;
    getEmployees(): Promise<Array<Employee>>;
    getEntriesByBundle(bundleId: string): Promise<Array<ProductionEntry>>;
    getEntriesByDate(date: string): Promise<Array<ProductionEntry>>;
    getEntriesByEmployee(employeeId: string): Promise<Array<ProductionEntry>>;
    getInventory(): Promise<Array<InventoryItem>>;
    getLowStockItems(): Promise<Array<InventoryItem>>;
    getMonthlyAttendanceByEmployee(employeeId: string, year: bigint, month: bigint): Promise<Array<Attendance>>;
    getOperation(_id: string): Promise<Operation | null>;
    getOperations(): Promise<Array<Operation>>;
    getPerformanceRanking(): Promise<Array<{
        totalPieces: bigint;
        employeeId: string;
    }>>;
    getProductionEntries(): Promise<Array<ProductionEntry>>;
    getProductionSummaryForToday(): Promise<[bigint, number]>;
    getQualityControl(): Promise<Array<QualityControl>>;
    getSalarySheet(year: bigint, month: bigint): Promise<Array<Report>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    issueInventoryToBundle(id: string, qty: bigint): Promise<void>;
    markAttendance(date: string, employeeId: string, status: string, checkIn: string, checkOut: string): Promise<string>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateAttendance(id: string, date: string, employeeId: string, status: string, checkIn: string, checkOut: string): Promise<void>;
    updateBundle(id: string, style: string, size: string, color: string, qty: bigint, date: string, status: string, stage: string, priority: string): Promise<void>;
    updateEmployee(id: string, name: string, phone: string, dept: string, salaryType: string, rate: number, bank: string, aadhaar: string, joinDate: string, status: string, skill: string, specialization: string): Promise<void>;
    updateInventoryItem(id: string, itemName: string, stockQty: bigint, unit: string): Promise<void>;
    updateOperation(id: string, name: string, dept: string, rate: number, target: bigint): Promise<void>;
}
