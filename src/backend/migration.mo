import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Float "mo:core/Float";
import Text "mo:core/Text";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";

module {
  // Type aliases for migration
  public type OldEmployee = {
    id : Text;
    name : Text;
    phone : Text;
    department : Text;
    salaryType : Text;
    joinDate : Text;
    status : Text;
  };

  public type OldOperation = {
    id : Text;
    name : Text;
    ratePerPiece : Float;
    department : Text;
    dailyTarget : Nat;
  };

  public type OldBundle = {
    id : Text;
    styleNumber : Text;
    size : Text;
    color : Text;
    quantity : Nat;
    createdDate : Text;
    status : Text;
  };

  public type OldProductionEntry = {
    id : Text;
    date : Text;
    employeeId : Text;
    operationId : Text;
    bundleId : Text;
    quantity : Nat;
    rate : Float;
    amount : Float;
  };

  public type OldAttendance = {
    id : Text;
    date : Text;
    employeeId : Text;
    status : Text;
  };

  public type OldTarget = {
    id : Text;
    operationId : Text;
    targetQty : Nat;
    date : Text;
  };

  public type OldActor = {
    employeeCounter : Nat;
    operationCounter : Nat;
    bundleCounter : Nat;
    employees : Map.Map<Text, OldEmployee>;
    operations : Map.Map<Text, OldOperation>;
    bundles : Map.Map<Text, OldBundle>;
    productionEntries : Map.Map<Text, OldProductionEntry>;
    attendances : Map.Map<Text, OldAttendance>;
    targets : Map.Map<Text, OldTarget>; // Include old stable targets map
  };

  public type NewEmployee = {
    id : Text;
    name : Text;
    phone : Text;
    department : Text;
    salaryType : Text; // "Hourly" or "PieceRate"
    ratePerPiece : Float;
    bankAccount : Text;
    aadhaar : Text;
    joinDate : Text;
    status : Text;
    skillLevel : Text;
    specialization : Text;
  };

  public type NewOperation = {
    id : Text;
    name : Text;
    department : Text;
    ratePerPiece : Float;
    dailyTarget : Nat;
  };

  public type NewBundle = {
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

  public type NewProductionEntry = {
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

  public type NewAttendance = {
    id : Text;
    date : Text;
    employeeId : Text;
    status : Text;
    checkIn : Text;
    checkOut : Text;
  };

  public type NewInventoryItem = {
    id : Text;
    itemName : Text;
    stockQty : Nat;
    unit : Text;
  };

  public type NewQualityControl = {
    id : Text;
    bundleId : Text;
    operationId : Text;
    rejectedQty : Nat;
    reason : Text;
    reworkStatus : Text;
  };

  public type NewReport = {
    employeeId : Text;
    totalPieces : Nat;
    totalAmount : Float;
  };

  public type NewActor = {
    employeeCounter : Nat;
    operationCounter : Nat;
    bundleCounter : Nat;
    employees : Map.Map<Text, NewEmployee>;
    operations : Map.Map<Text, NewOperation>;
    bundles : Map.Map<Text, NewBundle>;
    productionEntries : Map.Map<Text, NewProductionEntry>;
    attendances : Map.Map<Text, NewAttendance>;
    inventory : Map.Map<Text, NewInventoryItem>;
    qualityControl : Map.Map<Text, NewQualityControl>;
  };

  // Migration function
  public func run(old : OldActor) : NewActor {
    {
      employeeCounter = old.employeeCounter;
      operationCounter = old.operationCounter;
      bundleCounter = old.bundleCounter;
      employees = old.employees.map<Text, OldEmployee, NewEmployee>(
        func(_key, oldEmp) {
          {
            oldEmp with
            ratePerPiece = 0.0;
            bankAccount = "";
            aadhaar = "";
            skillLevel = "";
            specialization = "";
          };
        }
      );
      operations = old.operations.map<Text, OldOperation, NewOperation>(
        func(_key, oldOp) {
          oldOp;
        }
      );
      bundles = old.bundles.map<Text, OldBundle, NewBundle>(
        func(_key, oldBundle) {
          {
            id = oldBundle.id;
            style = oldBundle.styleNumber;
            size = oldBundle.size;
            color = oldBundle.color;
            quantity = oldBundle.quantity;
            dateCreated = oldBundle.createdDate;
            status = oldBundle.status;
            stage = "Cutting";
            priority = "Normal";
            qrCode = oldBundle.id;
          };
        }
      );
      productionEntries = old.productionEntries.map<Text, OldProductionEntry, NewProductionEntry>(
        func(_key, oldEntry) {
          {
            oldEntry with
            supervisorId = "";
          };
        }
      );
      attendances = old.attendances.map<Text, OldAttendance, NewAttendance>(
        func(_key, oldAttendance) {
          {
            oldAttendance with
            checkIn = "";
            checkOut = "";
          };
        }
      );
      inventory = Map.empty<Text, NewInventoryItem>();
      qualityControl = Map.empty<Text, NewQualityControl>();
    };
  };
};
