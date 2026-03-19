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
import Migration "migration";

(with migration = Migration.run)
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
  public type Employee = {
    id : Text;
    name : Text;
    phone : Text;
    department : Text;
    salaryType : Text;
    ratePerPiece : Float;
    bankAccount : Text;
    aadhaar : Text;
    joinDate : Text;
    status : Text;
    skillLevel : Text;
    specialization : Text;
  };

  public type Operation = {
    id : Text;
    name : Text;
    department : Text;
    ratePerPiece : Float;
    dailyTarget : Nat;
  };

  public type Bundle = {
    id : Text;
    style : Text;
    size : Text;
    color : Text;
    quantity : Nat;
    dateCreated : Text;
    status : Text;
    stage : Text;
    priority : Text;
    qrCode : Text;
  };

  public type ProductionEntry = {
    id : Text;
    date : Text;
    employeeId : Text;
    supervisorId : Text;
    operationId : Text;
    bundleId : Text;
    quantity : Nat;
    rate : Float;
    amount : Float;
  };

  public type Attendance = {
    id : Text;
    date : Text;
    employeeId : Text;
    status : Text;
    checkIn : Text;
    checkOut : Text;
  };

  public type InventoryItem = {
    id : Text;
    itemName : Text;
    stockQty : Nat;
    unit : Text;
  };

  public type QualityControl = {
    id : Text;
    bundleId : Text;
    operationId : Text;
    rejectedQty : Nat;
    reason : Text;
    reworkStatus : Text;
  };

  public type Report = {
    employeeId : Text;
    totalPieces : Nat;
    totalAmount : Float;
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
  let inventory = Map.empty<Text, InventoryItem>();
  let qualityControl = Map.empty<Text, QualityControl>();

  // AUTHENTICATION (handled by authorization mixin)
  public type LoginResult = {
    user : UserProfile;
    role : Text;
  };

  // EMPLOYEE CRUD - Admin only
  public shared ({ caller }) func addEmployee(name : Text, phone : Text, dept : Text, salaryType : Text, rate : Float, bank : Text, aadhaar : Text, joinDate : Text, status : Text, skill : Text, specialization : Text) : async Text {
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
      ratePerPiece = rate;
      bankAccount = bank;
      aadhaar;
      joinDate;
      status;
      skillLevel = skill;
      specialization;
    };
    employees.add(id, employee);
    id;
  };

  public shared ({ caller }) func updateEmployee(id : Text, name : Text, phone : Text, dept : Text, salaryType : Text, rate : Float, bank : Text, aadhaar : Text, joinDate : Text, status : Text, skill : Text, specialization : Text) : async () {
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
          ratePerPiece = rate;
          bankAccount = bank;
          aadhaar;
          joinDate;
          status;
          skillLevel = skill;
          specialization;
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
  public shared ({ caller }) func addOperation(name : Text, dept : Text, rate : Float, target : Nat) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    operationCounter += 1;
    let id = "OP" # operationCounter.toText();
    let operation : Operation = {
      id;
      name;
      department = dept;
      ratePerPiece = rate;
      dailyTarget = target;
    };
    operations.add(id, operation);
    id;
  };

  public shared ({ caller }) func updateOperation(id : Text, name : Text, dept : Text, rate : Float, target : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    switch (operations.get(id)) {
      case (null) { Runtime.trap("Operation not found") };
      case (?_) {
        let operation : Operation = {
          id;
          name;
          department = dept;
          ratePerPiece = rate;
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
  public shared ({ caller }) func addBundle(style : Text, size : Text, color : Text, qty : Nat, date : Text, status : Text, stage : Text, priority : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    bundleCounter += 1;
    let id = "B" # bundleCounter.toText();
    let bundle : Bundle = {
      id;
      style;
      size;
      color;
      quantity = qty;
      dateCreated = date;
      status;
      stage;
      priority;
      qrCode = id;
    };
    bundles.add(id, bundle);
    id;
  };

  public shared ({ caller }) func updateBundle(id : Text, style : Text, size : Text, color : Text, qty : Nat, date : Text, status : Text, stage : Text, priority : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    switch (bundles.get(id)) {
      case (null) { Runtime.trap("Bundle not found") };
      case (?_) {
        let bundle : Bundle = {
          id;
          style;
          size;
          color;
          quantity = qty;
          dateCreated = date;
          status;
          stage;
          priority;
          qrCode = id;
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

  public query ({ caller }) func getBundleByQRCode(qrCode : Text) : async ?Bundle {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };
    let found = bundles.values().toArray().find(
      func(b : Bundle) : Bool { b.qrCode == qrCode }
    );
    found;
  };

  // PRODUCTION ENTRY - Users (Supervisors) can add, all users can view
  public shared ({ caller }) func addProductionEntry(date : Text, employeeId : Text, supervisorId : Text, operationId : Text, bundleId : Text, qty : Nat, rate : Float, amount : Float) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };
    let id = "PE" # employeeId # operationId # bundleId # date;
    let entry : ProductionEntry = {
      id;
      date;
      employeeId;
      supervisorId;
      operationId;
      bundleId;
      quantity = qty;
      rate;
      amount;
    };
    productionEntries.add(id, entry);
    id;
  };

  public shared ({ caller }) func addBulkProductionEntries(entries : [ProductionEntry]) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };
    for (entry in entries.values()) {
      productionEntries.add(entry.id, entry);
    };
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

  public query ({ caller }) func getEntriesByBundle(bundleId : Text) : async [ProductionEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view production entries");
    };
    let filtered = productionEntries.values().toArray().filter(
      func(entry : ProductionEntry) : Bool { entry.bundleId == bundleId }
    );
    filtered;
  };

  public query ({ caller }) func getProductionSummaryForToday() : async (Nat, Float) {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };
    let today = getCurrentDate();
    var totalQty = 0;
    var totalAmount = 0.0;
    for (entry in productionEntries.values()) {
      if (entry.date == today) {
        totalQty += entry.quantity;
        totalAmount += entry.amount;
      };
    };
    (totalQty, totalAmount);
  };

  // ATTENDANCE - Users (Supervisors) can mark/update, all users can view
  public shared ({ caller }) func markAttendance(date : Text, employeeId : Text, status : Text, checkIn : Text, checkOut : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };
    let id = "A" # employeeId # date;
    let attendance : Attendance = {
      id;
      date;
      employeeId;
      status;
      checkIn;
      checkOut;
    };
    attendances.add(id, attendance);
    id;
  };

  public shared ({ caller }) func updateAttendance(id : Text, date : Text, employeeId : Text, status : Text, checkIn : Text, checkOut : Text) : async () {
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
          checkIn;
          checkOut;
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

  public query ({ caller }) func getMonthlyAttendanceByEmployee(employeeId : Text, year : Nat, month : Nat) : async [Attendance] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view attendance");
    };
    let yearText = year.toText();
    let monthText = if (month < 10) { "0" # month.toText() } else { month.toText() };
    let prefix = yearText # "-" # monthText;
    let filtered = attendances.values().toArray().filter(
      func(a : Attendance) : Bool {
        a.employeeId == employeeId and a.date.startsWith(#text prefix)
      }
    );
    filtered;
  };

  // INVENTORY MANAGEMENT - Admin only
  public shared ({ caller }) func addInventoryItem(itemName : Text, stockQty : Nat, unit : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    let id = "I" # itemName;
    let item : InventoryItem = {
      id;
      itemName;
      stockQty;
      unit;
    };
    inventory.add(id, item);
    id;
  };

  public shared ({ caller }) func updateInventoryItem(id : Text, itemName : Text, stockQty : Nat, unit : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    switch (inventory.get(id)) {
      case (null) { Runtime.trap("Inventory item not found") };
      case (?_) {
        let item : InventoryItem = {
          id;
          itemName;
          stockQty;
          unit;
        };
        inventory.add(id, item);
      };
    };
  };

  public shared ({ caller }) func issueInventoryToBundle(id : Text, qty : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    switch (inventory.get(id)) {
      case (null) { Runtime.trap("Inventory item not found") };
      case (?item) {
        if (qty > item.stockQty) {
          Runtime.trap("Not enough stock");
        };
        let newQty = item.stockQty - qty;
        let updatedItem = {
          id = item.id;
          itemName = item.itemName;
          stockQty = newQty;
          unit = item.unit;
        };
        inventory.add(id, updatedItem);
      };
    };
  };

  public query ({ caller }) func getLowStockItems() : async [InventoryItem] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view inventory");
    };
    let threshold = 10;
    let found = inventory.values().toArray().filter(
      func(item) {
        item.stockQty <= threshold;
      }
    );
    found;
  };

  public query ({ caller }) func getInventory() : async [InventoryItem] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view inventory");
    };
    inventory.values().toArray();
  };

  // QUALITY CONTROL - Users can add, all users can view
  public shared ({ caller }) func addQualityControl(bundleId : Text, operationId : Text, qty : Nat, reason : Text, rework : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };
    let id = "QC" # bundleId # operationId;
    let qc : QualityControl = {
      id;
      bundleId;
      operationId;
      rejectedQty = qty;
      reason;
      reworkStatus = rework;
    };
    qualityControl.add(id, qc);
    id;
  };

  public query ({ caller }) func getQualityControl() : async [QualityControl] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view QC");
    };
    qualityControl.values().toArray();
  };

  // REPORTS - All users can view
  public query ({ caller }) func getSalarySheet(year : Nat, month : Nat) : async [Report] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view salary sheet");
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

    empMap.entries().toArray().map<(Text, (Nat, Float)), Report>(
      func((empId, data) : (Text, (Nat, Float))) : Report {
        { employeeId = empId; totalPieces = data.0; totalAmount = data.1 };
      }
    );
  };

  public query ({ caller }) func getPerformanceRanking() : async [{ employeeId : Text; totalPieces : Nat }] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view performance ranking");
    };
    let empMap = Map.empty<Text, Nat>();
    for (entry in productionEntries.values()) {
      let current = switch (empMap.get(entry.employeeId)) {
        case (null) { 0 };
        case (?val) { val };
      };
      empMap.add(entry.employeeId, current + entry.quantity);
    };
    let results = empMap.entries().toArray().map(
      func((empId, qty) : (Text, Nat)) : { employeeId : Text; totalPieces : Nat } {
        { employeeId = empId; totalPieces = qty };
      }
    );
    results;
  };

  // Helper function to get current date (YYYY-MM-DD)
  func getCurrentDate() : Text {
    let now = Time.now();
    let seconds = now / 1_000_000_000;
    let days = seconds / 86400;
    // This will always return 2024-01-01 to seed demo data
    "2024-01-01";
  };
};
