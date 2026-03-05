import Array "mo:core/Array";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Float "mo:core/Float";
import Text "mo:core/Text";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Iter "mo:core/Iter";
import Order "mo:core/Order";
import Principal "mo:core/Principal";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // USER PROFILE
  public type UserProfile = {
    name : Text;
    role : Text; // "Admin" or "Supervisor"
  };

  let userProfiles = Map.empty<Principal, UserProfile>();

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // DATA MODELS
  type Employee = {
    id : Text;
    name : Text;
    phone : Text;
    department : Text;
    salaryType : Text;
    joinDate : Text;
    status : Text;
  };

  type Operation = {
    id : Text;
    name : Text;
    ratePerPiece : Float;
    department : Text;
    dailyTarget : Nat;
  };

  type Bundle = {
    id : Text;
    styleNumber : Text;
    size : Text;
    color : Text;
    quantity : Nat;
    createdDate : Text;
    status : Text;
  };

  type ProductionEntry = {
    id : Text;
    date : Text;
    employeeId : Text;
    operationId : Text;
    bundleId : Text;
    quantity : Nat;
    rate : Float;
    amount : Float;
  };

  type Attendance = {
    id : Text;
    date : Text;
    employeeId : Text;
    status : Text;
  };

  type Target = {
    id : Text;
    operationId : Text;
    targetQty : Nat;
    date : Text;
  };

  // DASHBOARD STATS
  type DashboardStats = {
    todayProduction : Nat;
    runningBundlesCount : Nat;
  };

  // DATA STRUCTURES
  var employeeCounter = 0;
  var operationCounter = 0;
  var bundleCounter = 0;

  let employees = Map.empty<Text, Employee>();
  let operations = Map.empty<Text, Operation>();
  let bundles = Map.empty<Text, Bundle>();
  let productionEntries = Map.empty<Text, ProductionEntry>();
  let attendances = Map.empty<Text, Attendance>();
  let targets = Map.empty<Text, Target>();

  // EMPLOYEE CRUD - Admin only
  public shared ({ caller }) func addEmployee(name : Text, phone : Text, dept : Text, salaryType : Text, joinDate : Text, status : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    employeeCounter += 1;
    let id = "EMP" # employeeCounter.toText();
    let employee : Employee = {
      id;
      name;
      phone;
      department = dept;
      salaryType;
      joinDate;
      status;
    };
    employees.add(id, employee);
    id;
  };

  public shared ({ caller }) func updateEmployee(id : Text, name : Text, phone : Text, dept : Text, salaryType : Text, joinDate : Text, status : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    switch (employees.get(id)) {
      case (null) { Runtime.trap("Employee not found") };
      case (?_) {
        let employee : Employee = {
          id;
          name;
          phone;
          department = dept;
          salaryType;
          joinDate;
          status;
        };
        employees.add(id, employee);
      };
    };
  };

  public shared ({ caller }) func deleteEmployee(id : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    if (not employees.containsKey(id)) {
      Runtime.trap("Already deleted");
    };
    employees.remove(id);
  };

  public query ({ caller }) func getEmployees() : async [Employee] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view employees");
    };
    employees.values().toArray();
  };

  public query ({ caller }) func getEmployee(_id : Text) : async ?Employee {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view employees");
    };
    employees.get(_id);
  };

  // OPERATION CRUD - Admin only
  public shared ({ caller }) func addOperation(name : Text, rate : Float, dept : Text, target : Nat) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    operationCounter += 1;
    let id = "OP" # operationCounter.toText();
    let operation : Operation = {
      id;
      name;
      ratePerPiece = rate;
      department = dept;
      dailyTarget = target;
    };
    operations.add(id, operation);
    id;
  };

  public shared ({ caller }) func updateOperation(id : Text, name : Text, rate : Float, dept : Text, target : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    switch (operations.get(id)) {
      case (null) { Runtime.trap("Operation not found") };
      case (?_) {
        let operation : Operation = {
          id;
          name;
          ratePerPiece = rate;
          department = dept;
          dailyTarget = target;
        };
        operations.add(id, operation);
      };
    };
  };

  public shared ({ caller }) func deleteOperation(id : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    if (not operations.containsKey(id)) {
      Runtime.trap("Already deleted");
    };
    operations.remove(id);
  };

  public query ({ caller }) func getOperations() : async [Operation] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view operations");
    };
    operations.values().toArray();
  };

  public query ({ caller }) func getOperation(_id : Text) : async ?Operation {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view operations");
    };
    operations.get(_id);
  };

  // BUNDLE CRUD - Admin only
  public shared ({ caller }) func addBundle(styleNumber : Text, size : Text, color : Text, qty : Nat, createdDate : Text, status : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    bundleCounter += 1;
    let id = "B" # bundleCounter.toText();
    let bundle : Bundle = {
      id;
      styleNumber;
      size;
      color;
      quantity = qty;
      createdDate;
      status;
    };
    bundles.add(id, bundle);
    id;
  };

  public shared ({ caller }) func updateBundle(id : Text, styleNumber : Text, size : Text, color : Text, qty : Nat, createdDate : Text, status : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    switch (bundles.get(id)) {
      case (null) { Runtime.trap("Bundle not found") };
      case (?_) {
        let bundle : Bundle = {
          id;
          styleNumber;
          size;
          color;
          quantity = qty;
          createdDate;
          status;
        };
        bundles.add(id, bundle);
      };
    };
  };

  public shared ({ caller }) func deleteBundle(id : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    if (not bundles.containsKey(id)) {
      Runtime.trap("Already deleted");
    };
    bundles.remove(id);
  };

  public query ({ caller }) func getBundles() : async [Bundle] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view bundles");
    };
    bundles.values().toArray();
  };

  public query ({ caller }) func getBundle(_id : Text) : async ?Bundle {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view bundles");
    };
    bundles.get(_id);
  };

  // PRODUCTION ENTRY - Users (Supervisors) can add, all users can view
  public shared ({ caller }) func addProductionEntry(date : Text, employeeId : Text, operationId : Text, bundleId : Text, qty : Nat, rate : Float, amount : Float) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };
    let id = "PE" # employeeId # operationId # bundleId # date;
    let entry : ProductionEntry = {
      id;
      date;
      employeeId;
      operationId;
      bundleId;
      quantity = qty;
      rate;
      amount;
    };
    productionEntries.add(id, entry);
    id;
  };

  public query ({ caller }) func getProductionEntries() : async [ProductionEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view production entries");
    };
    productionEntries.values().toArray();
  };

  public query ({ caller }) func getEntriesByDate(date : Text) : async [ProductionEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view production entries");
    };
    let filtered = productionEntries.values().toArray().filter(
      func(entry : ProductionEntry) : Bool { entry.date == date }
    );
    filtered;
  };

  public query ({ caller }) func getEntriesByEmployee(employeeId : Text) : async [ProductionEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view production entries");
    };
    let filtered = productionEntries.values().toArray().filter(
      func(entry : ProductionEntry) : Bool { entry.employeeId == employeeId }
    );
    filtered;
  };

  public query ({ caller }) func getEntriesByMonth(year : Nat, month : Nat) : async [ProductionEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view production entries");
    };
    let yearText = year.toText();
    let monthText = if (month < 10) { "0" # month.toText() } else { month.toText() };
    let prefix = yearText # "-" # monthText;
    let filtered = productionEntries.values().toArray().filter(
      func(entry : ProductionEntry) : Bool { 
        entry.date.startsWith(#text prefix)
      }
    );
    filtered;
  };

  // ATTENDANCE - Users (Supervisors) can mark/update, all users can view
  public shared ({ caller }) func markAttendance(date : Text, employeeId : Text, status : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };
    let id = "A" # employeeId # date;
    let attendance : Attendance = {
      id;
      date;
      employeeId;
      status;
    };
    attendances.add(id, attendance);
    id;
  };

  public shared ({ caller }) func updateAttendance(id : Text, date : Text, employeeId : Text, status : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };
    switch (attendances.get(id)) {
      case (null) { Runtime.trap("Attendance not found") };
      case (?_) {
        let attendance : Attendance = {
          id;
          date;
          employeeId;
          status;
        };
        attendances.add(id, attendance);
      };
    };
  };

  public query ({ caller }) func getAttendanceByDate(date : Text) : async [Attendance] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view attendance");
    };
    attendances.values().toArray().filter(
      func(a : Attendance) : Bool { a.date == date }
    );
  };

  public query ({ caller }) func getAllAttendance() : async [Attendance] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view attendance");
    };
    attendances.values().toArray();
  };

  // TARGETS - Admin only
  public shared ({ caller }) func setTarget(operationId : Text, qty : Nat, date : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    let id = "T" # operationId # date;
    let target : Target = {
      id;
      operationId;
      targetQty = qty;
      date;
    };
    targets.add(id, target);
    id;
  };

  public query ({ caller }) func getTargets() : async [Target] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view targets");
    };
    targets.values().toArray();
  };

  // ANALYTICS - All users can view
  public query ({ caller }) func getDashboardStats() : async DashboardStats {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view dashboard stats");
    };
    let today = getCurrentDate();
    var todayProd : Nat = 0;
    for (entry in productionEntries.values()) {
      if (entry.date == today) {
        todayProd += entry.quantity;
      };
    };
    var runningCount : Nat = 0;
    for (bundle in bundles.values()) {
      if (bundle.status == "running" or bundle.status == "Running") {
        runningCount += 1;
      };
    };
    {
      todayProduction = todayProd;
      runningBundlesCount = runningCount;
    };
  };

  public query ({ caller }) func getOperatorRankingToday(todayDate : Text) : async [{ employeeId : Text; totalQty : Nat }] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view operator ranking");
    };
    let empMap = Map.empty<Text, Nat>();
    for (entry in productionEntries.values()) {
      if (entry.date == todayDate) {
        let current = switch (empMap.get(entry.employeeId)) {
          case (null) { 0 };
          case (?val) { val };
        };
        empMap.add(entry.employeeId, current + entry.quantity);
      };
    };
    let results = empMap.entries().toArray().map(
      func((empId, qty) : (Text, Nat)) : { employeeId : Text; totalQty : Nat } {
        { employeeId = empId; totalQty = qty };
      }
    );
    results.sort(func(a : { employeeId : Text; totalQty : Nat }, b : { employeeId : Text; totalQty : Nat }) : Order.Order {
      Nat.compare(b.totalQty, a.totalQty);
    });
  };

  public query ({ caller }) func getMonthlySalary(year : Nat, month : Nat) : async [{ employeeId : Text; totalPieces : Nat; totalAmount : Float }] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view monthly salary");
    };
    let yearText = year.toText();
    let monthText = if (month < 10) { "0" # month.toText() } else { month.toText() };
    let prefix = yearText # "-" # monthText;
    
    let empMap = Map.empty<Text, (Nat, Float)>();
    for (entry in productionEntries.values()) {
      if (entry.date.startsWith(#text prefix)) {
        let (currentPieces, currentAmount) = switch (empMap.get(entry.employeeId)) {
          case (null) { (0, 0.0) };
          case (?val) { val };
        };
        empMap.add(entry.employeeId, (currentPieces + entry.quantity, currentAmount + entry.amount));
      };
    };
    
    empMap.entries().toArray().map<(Text, (Nat, Float)), { employeeId : Text; totalPieces : Nat; totalAmount : Float }>(
      func((empId, data) : (Text, (Nat, Float))) : { employeeId : Text; totalPieces : Nat; totalAmount : Float } {
        { employeeId = empId; totalPieces = data.0; totalAmount = data.1 };
      }
    );
  };

  public query ({ caller }) func getBundleProgress(bundleId : Text) : async [{ operationId : Text; completed : Bool }] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view bundle progress");
    };
    let opSet = Map.empty<Text, Bool>();
    for (entry in productionEntries.values()) {
      if (entry.bundleId == bundleId) {
        opSet.add(entry.operationId, true);
      };
    };
    opSet.entries().toArray().map<(Text, Bool), { operationId : Text; completed : Bool }>(
      func((opId, _) : (Text, Bool)) : { operationId : Text; completed : Bool } {
        { operationId = opId; completed = true };
      }
    );
  };

  // Helper function to get current date (simplified)
  func getCurrentDate() : Text {
    let now = Time.now();
    let seconds = now / 1_000_000_000;
    let days = seconds / 86400;
    "2024-01-01"; // Placeholder - in production, use proper date formatting
  };
};
