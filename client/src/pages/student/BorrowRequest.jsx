import {useEffect, useState} from "react";
import {
  PackagePlus, PackageMinus, Calendar, MapPin,
  Clock, AlertTriangle, CheckCircle, Package
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useLocation } from "react-router-dom";
import { getUserSession } from "@/utils/auth";
import api from "@/api.js";

const STATUS_STYLES = {
  Available:   "bg-green-100 text-green-800 border-green-200",
  "In Use":    "bg-blue-100 text-blue-800 border-blue-200",
  Maintenance: "bg-orange-100 text-orange-800 border-orange-200",
  Reserved:    "bg-purple-100 text-purple-800 border-purple-200",
};

function getDaysUntilDue(date) {
  if (!date) return null;
  return Math.ceil((new Date(date) - new Date()) / (1000 * 60 * 60 * 24));
}

export function BorrowRequest() {
  const location    = useLocation();
  const sessionUser = getUserSession();
  const preId = location.state?.selectedEquipmentId?.toString() || "";
  const [tab, setTab] = useState("borrow");
  const [borrowForm, setBorrowForm] = useState({
    equipmentId: preId, quantity: 1, purpose: "", expectedReturnDate: "", notes: "",
  });
  const [returnForm, setReturnForm] = useState({
    transactionId: "", condition: "good", notes: "",
  });
  const [equipmentList, setEquipmentList] = useState([]);
  const [myActiveBorrows,setMyActiveBorrows] = useState([])
  const fetchEquipment = async () => {
    try {
      const res = await api.get("/equipment");
      setEquipmentList(res.data);
    } catch (err) {
      console.log("Error fetching equipment:", err);
    }
  };
  const fetchMyActiveBorrows = async () => {
    try{
      const res = await api.get(
          "/users/me/transactions?type=Borrow&status=Approved&returned=false"
      );
      setMyActiveBorrows(res.data);
    }catch (err) {
      console.log("Error fetching active borrows:", err);
    }
  }
  useEffect(()=>{
    fetchEquipment()
    fetchMyActiveBorrows()
  },[])
  const availableEquipment = equipmentList.filter(e => e.availableQuantity > 0);
  const selectedEquipment = equipmentList.find(e => String(e.id) === borrowForm.equipmentId);
  const selectedTxn       = myActiveBorrows.find(t => String(t.id) === returnForm.transactionId);

  const minDateStr = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  })();

  const handleBorrowSubmit = async (e) => {
    e.preventDefault();
    if (!borrowForm.equipmentId || !borrowForm.purpose || !borrowForm.expectedReturnDate) {
      toast.error("Please fill in all required fields");
      return;
    }
    try {
      await api.post("/users/me/transactions", {
        equipmentId: borrowForm.equipmentId,
        quantity: borrowForm.quantity,
        purpose: borrowForm.purpose,
        expectedReturnDate: borrowForm.expectedReturnDate
      });
      const eq = equipmentList.find(e => String(e.id) === borrowForm.equipmentId);
      toast.success("Borrow request submitted!", {
        description: `Request for ${eq?.name} has been sent for instructor approval.`,
      });
      setBorrowForm({equipmentId: "", quantity: 1, purpose: "", expectedReturnDate: "", notes: ""});
    }catch (err) {
      toast.error("Error!",{
        description: err.response?.data?.error
      });
    }
  };

  const handleReturnSubmit = async (e) => {
    e.preventDefault();
    if (!returnForm.transactionId) {
      toast.error("Please select which equipment to return");
      return;
    }
    try {
      await api.patch(`/users/me/transactions/${returnForm.transactionId}/return`,{
        conditionType: returnForm.condition,
        notes: returnForm.notes
      })
      const txn = myActiveBorrows.find(t => String(t.id) === returnForm.transactionId);
      toast.success("Return submitted!", {
        description: `${txn?.equipmentName} return has been recorded.`,
      });
      setReturnForm({transactionId: "", condition: "good", notes: ""});
      await fetchMyActiveBorrows()
    }catch (err) {
      toast.error("Error!",{
        description: err.response?.data?.error
      });
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">

      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Borrow & Return</h1>
        <p className="text-gray-500 mt-1">Submit borrow requests or return borrowed equipment</p>
      </div>

      {/* Active borrows strip */}
      {myActiveBorrows.length > 0 && (
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {myActiveBorrows.map(txn => {
            const days = getDaysUntilDue(txn.expectedReturnDate);
            const overdue = days !== null && days < 0;
            const soon    = days !== null && days >= 0 && days <= 2;
            return (
              <div key={txn.id} className={`rounded-xl border-2 p-4 flex items-start gap-3 ${
                overdue ? "border-red-300 bg-red-50"
                : soon  ? "border-amber-300 bg-amber-50"
                : "border-blue-200 bg-blue-50"}`}>
                {overdue
                  ? <AlertTriangle className="text-red-500 flex-shrink-0 mt-0.5" size={17} />
                  : soon
                  ? <Clock className="text-amber-500 flex-shrink-0 mt-0.5" size={17} />
                  : <CheckCircle className="text-blue-500 flex-shrink-0 mt-0.5" size={17} />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{txn.equipmentName}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Qty: {txn.quantity} · Due: {new Date(txn.expectedReturnDate).toLocaleDateString()}
                  </p>
                  <p className={`text-xs font-semibold mt-1 ${
                    overdue ? "text-red-600" : soon ? "text-amber-600" : "text-blue-600"}`}>
                    {overdue
                      ? `Overdue by ${Math.abs(days)} day${Math.abs(days) !== 1 ? "s" : ""}`
                      : soon ? `Due in ${days} day${days !== 1 ? "s" : ""}` : `${days} days remaining`}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Tab bar ── */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab("borrow")}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm transition-all ${
            tab === "borrow"
              ? "bg-[#e9333f] text-white shadow-md"
              : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
          }`}
        >
          <PackagePlus size={16} /> Borrow Equipment
        </button>
        <button
          onClick={() => setTab("return")}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm transition-all ${
            tab === "return"
              ? "bg-[#2c3e50] text-white shadow-md"
              : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
          }`}
        >
          <PackageMinus size={16} /> Return Equipment
          {myActiveBorrows.length > 0 && (
            <span className="ml-0.5 bg-[#e9333f] text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
              {myActiveBorrows.length}
            </span>
          )}
        </button>
      </div>

      {/* ── BORROW PANEL ── */}
      {tab === "borrow" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <PackagePlus className="text-[#e9333f]" size={20} /> New Borrow Request
            </h2>
            <form onSubmit={handleBorrowSubmit} className="space-y-5">

              <div className="space-y-1.5">
                <Label className="text-sm font-semibold text-gray-700">Equipment *</Label>
                <Select
                  value={borrowForm.equipmentId}
                  onValueChange={v => setBorrowForm(p => ({ ...p, equipmentId: v }))}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select equipment to borrow..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableEquipment.map(eq => (
                      <SelectItem key={eq.id} value={String(eq.id)}>
                        <span>{eq.name}</span>
                        <span className="ml-2 text-xs text-gray-400">{eq.availableQuantity} available</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedEquipment && (
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 flex gap-4">
                  <img src={selectedEquipment.imageUrl} alt={selectedEquipment.name}
                    className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <p className="font-semibold text-gray-900">{selectedEquipment.name}</p>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${STATUS_STYLES[selectedEquipment.status]}`}>
                        {selectedEquipment.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{selectedEquipment.model} · {selectedEquipment.serialNumber}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <MapPin size={12} className="text-gray-400" />
                      <span className="text-xs text-gray-600">{selectedEquipment.location}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      <span className="font-medium text-green-700">{selectedEquipment.availableQuantity}</span> of {selectedEquipment.totalQuantity} units available
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold text-gray-700">Quantity *</Label>
                  <Input
                    type="number" min={1}
                    max={selectedEquipment?.availableQuantity || 1}
                    value={borrowForm.quantity}
                    onChange={e => setBorrowForm(p => ({ ...p, quantity: parseInt(e.target.value) || 1 }))}
                    className="h-11"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                    <Calendar size={13} /> Expected Return Date *
                  </Label>
                  <Input
                    type="date" min={minDateStr}
                    value={borrowForm.expectedReturnDate}
                    onChange={e => setBorrowForm(p => ({ ...p, expectedReturnDate: e.target.value }))}
                    className="h-11"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-semibold text-gray-700">Purpose / Reason *</Label>
                <Textarea
                  placeholder="e.g. IoT project for EE302 course — building a sensor network..."
                  value={borrowForm.purpose}
                  onChange={e => setBorrowForm(p => ({ ...p, purpose: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-semibold text-gray-700">Additional Notes</Label>
                <Textarea
                  placeholder="Any special requirements or notes for the lab assistant..."
                  value={borrowForm.notes}
                  onChange={e => setBorrowForm(p => ({ ...p, notes: e.target.value }))}
                  rows={2}
                />
              </div>

              <Button type="submit" className="w-full h-11 bg-[#e9333f] hover:bg-[#d12233] text-white font-semibold">
                <PackagePlus size={16} className="mr-2" /> Submit Borrow Request
              </Button>
            </form>
          </div>

          {/* Side info */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <Clock size={14} className="text-[#e9333f]" /> Request Process
              </h3>
              <ol className="space-y-3">
                {[
                  { step: "Submit request with purpose",    color: "#e9333f" },
                  { step: "Instructor reviews & approves", color: "#f39c12" },
                  { step: "Pick up from lab location",     color: "#3498db" },
                  { step: "Return before due date",        color: "#27ae60" },
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-xs text-gray-600">
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                      style={{ backgroundColor: item.color }}>{i + 1}</span>
                    {item.step}
                  </li>
                ))}
              </ol>
            </div>

            <div className="bg-amber-50 rounded-2xl border border-amber-200 p-5">
              <h3 className="text-sm font-semibold text-amber-800 mb-2 flex items-center gap-1.5">
                <AlertTriangle size={14} /> Important Rules
              </h3>
              <ul className="text-xs text-amber-700 space-y-1.5">
                <li>• Return equipment on or before the due date</li>
                <li>• Report any damage immediately to the lab assistant</li>
                <li>• Overdue returns will affect future request approvals</li>
                <li>• Maximum borrow period is 2 weeks</li>
              </ul>
            </div>

            {myActiveBorrows.length > 0 && (
              <div className="bg-blue-50 rounded-2xl border border-blue-200 p-5">
                <h3 className="text-sm font-semibold text-blue-800 mb-2">Your Active Borrows</h3>
                <p className="text-xs text-blue-700">
                  You have <strong>{myActiveBorrows.length}</strong> active borrow{myActiveBorrows.length > 1 ? "s" : ""}.
                  Switch to the Return tab to return equipment.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── RETURN PANEL ── */}
      {tab === "return" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <PackageMinus className="text-[#2c3e50]" size={20} /> Return Equipment
            </h2>

            {myActiveBorrows.length === 0 ? (
              <div className="text-center py-16">
                <Package className="mx-auto text-gray-300 mb-3" size={52} />
                <p className="text-gray-500 font-medium text-base">No active borrows</p>
                <p className="text-gray-400 text-sm mt-1">You have no equipment to return right now.</p>
                <button
                  onClick={() => setTab("borrow")}
                  className="mt-4 text-sm text-[#e9333f] font-semibold hover:underline"
                >
                  Borrow equipment →
                </button>
              </div>
            ) : (
              <form onSubmit={handleReturnSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold text-gray-700">Select Equipment to Return *</Label>
                  <Select
                    value={returnForm.transactionId}
                    onValueChange={v => setReturnForm(p => ({ ...p, transactionId: v }))}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Choose borrowed equipment..." />
                    </SelectTrigger>
                    <SelectContent>
                      {myActiveBorrows.map(txn => {
                        const days = getDaysUntilDue(txn.expectedReturnDate);
                        const overdue = days !== null && days < 0;
                        return (
                          <SelectItem key={txn.id} value={String(txn.id)}>
                            <span>{txn.equipmentName}</span>
                            {overdue && <span className="ml-2 text-xs text-red-600 font-semibold">OVERDUE</span>}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {selectedTxn && (() => {
                  const eq = equipmentList.find(e => e.id === selectedTxn.equipmentId);
                  const days = getDaysUntilDue(selectedTxn.expectedReturnDate);
                  const overdue = days !== null && days < 0;
                  return (
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-2">
                      <div className="flex items-center gap-3">
                        {eq?.imageUrl && (
                          <img src={eq.imageUrl} alt={eq.name}
                            className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                        )}
                        <div>
                          <p className="font-semibold text-gray-900">{selectedTxn.equipmentName}</p>
                          <p className="text-xs text-gray-500">
                            Borrowed: {new Date(selectedTxn.requestDate).toLocaleDateString()} · Qty: {selectedTxn.quantity}
                          </p>
                        </div>
                      </div>
                      <div className={`flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg ${
                        overdue ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                        <Calendar size={12} />
                        Due: {new Date(selectedTxn.expectedReturnDate).toLocaleDateString()}
                        {overdue
                          ? ` — Overdue by ${Math.abs(days)} day${Math.abs(days) !== 1 ? "s" : ""}`
                          : ` — ${days} days remaining`}
                      </div>
                      {eq?.location && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <MapPin size={12} /> Return to: <span className="font-medium">{eq.location}</span>
                        </div>
                      )}
                    </div>
                  );
                })()}

                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold text-gray-700">Equipment Condition *</Label>
                  <Select
                    value={returnForm.condition}
                    onValueChange={v => setReturnForm(p => ({ ...p, condition: v }))}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="excellent">Excellent — No issues</SelectItem>
                      <SelectItem value="good">Good — Minor wear</SelectItem>
                      <SelectItem value="fair">Fair — Some issues to note</SelectItem>
                      <SelectItem value="damaged">Damaged — Needs repair</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold text-gray-700">Notes / Issues</Label>
                  <Textarea
                    placeholder="Describe any damage, issues, or notes about the equipment condition..."
                    value={returnForm.notes}
                    onChange={e => setReturnForm(p => ({ ...p, notes: e.target.value }))}
                    rows={3}
                  />
                </div>

                <Button type="submit" className="w-full h-11 bg-[#2c3e50] hover:bg-[#34495e] text-white font-semibold">
                  <PackageMinus size={16} className="mr-2" /> Confirm Return
                </Button>
              </form>
            )}
          </div>

          {/* Side info */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Return Checklist</h3>
              <ul className="space-y-2.5">
                {[
                  "Clean the equipment before returning",
                  "Include all accessories and cables",
                  "Report any damage honestly",
                  "Confirm return with lab assistant",
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs text-gray-600">
                    <CheckCircle size={14} className="text-green-500 flex-shrink-0" /> {item}
                  </li>
                ))}
              </ul>
            </div>

            {myActiveBorrows.some(t => getDaysUntilDue(t.expectedReturnDate) < 0) && (
              <div className="bg-red-50 rounded-2xl border-2 border-red-300 p-5">
                <h3 className="text-sm font-semibold text-red-800 mb-1 flex items-center gap-1.5">
                  <AlertTriangle size={14} /> Overdue Items!
                </h3>
                <p className="text-xs text-red-700">
                  You have overdue equipment. Please return it immediately to avoid penalties.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
