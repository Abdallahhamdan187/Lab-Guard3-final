import {useEffect, useState} from "react";
import { X, Package, MapPin, Hash, Layers, Image, FileText, Plus, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import api from "@/api.js";

const STATUSES = ["Available", "In Use", "Maintenance", "Reserved"];

const EMPTY_FORM = {
  name: "", category: "", model: "", serialNumber: "",
  location: "", status: "Available",
  totalQuantity: 1, availableQuantity: 1,
  description: "", imageUrl: "",
};

export function AddEquipmentModal({ open, onClose, onAdd }) {
  const [form, setForm]     = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [locations,setLocations] = useState([])
  const [locationMap, setLocationMap] = useState({});
  const [categories,setCategories] = useState([])
  const [categoryMap, setCategoryMap] = useState({});
  useEffect(() => {
    if (!open) return;
    fetchLocations();
    fetchCategories();
  }, [open]);
  if (!open) return null;

  const fetchLocations = async () => {
    try {
      const res = await api.get("/locations")
      setLocations(res.data)
      const map = Object.fromEntries(
          res.data.map(l => [
            l.id,
            `${l.lab_name}${l.section ? " - " + l.section : ""}`
          ])
      );
      setLocationMap(map);
    }catch (err) {
      console.log("Fetch Locations Error",err)
    }
  }

  const fetchCategories = async ()=>{
    try {
      const res = await api.get("/categories")
      setCategories(res.data)
      setCategoryMap(
          Object.fromEntries(res.data.map(c => [c.id, c.name]))
      );
    }catch (err) {
      console.log("Fetch categories Error",err)
    }
  }

  const set = (field, value) => {
    setForm(prev => {
      const updated = { ...prev, [field]: value };
      // Keep availableQuantity ≤ totalQuantity
      if (field === "totalQuantity") {
        updated.availableQuantity = Math.min(updated.availableQuantity, Number(value));
      }
      return updated;
    });
    setErrors(prev => ({ ...prev, [field]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim())         e.name         = "Name is required";
    if (!form.category)            e.category     = "Category is required";
    if (!form.model.trim())        e.model        = "Model is required";
    if (!form.serialNumber.trim()) e.serialNumber = "Serial number is required";
    if (!form.location)            e.location     = "Location is required";
    if (!form.status)              e.status       = "Status is required";
    if (form.totalQuantity < 1)    e.totalQuantity = "Must be at least 1";
    if (form.availableQuantity < 0 || form.availableQuantity > form.totalQuantity)
      e.availableQuantity = `Must be 0–${form.totalQuantity}`;
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLoading(true);
    const {
      location,
      category,
      ...rest
    } = form;

    const newEquipment = {
      ...rest,

      locationId: Number(location),
      categoryId: Number(category),

      totalQuantity: Number(form.totalQuantity),
      availableQuantity: Number(form.availableQuantity),

      imageUrl:
          form.imageUrl.trim() ||
          "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=400&h=300&fit=crop",
    };

    try{
      await api.post("/equipment",newEquipment)
      onAdd?.(newEquipment);
      setLoading(false);
      setSuccess(true);
      toast.success("Equipment added!", {
        description: `${form.name} has been added to the inventory.`,
      });
    }catch (err) {
      toast.error("Error!",{
        description: err.response?.data?.error
      });
    }
  };

  const handleClose = () => {
    setForm(EMPTY_FORM);
    setErrors({});
    setSuccess(false);
    setLoading(false);
    onClose();
  };

  // ── Success screen ──────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-10 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="text-green-600" size={36} />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">Equipment Added!</h2>
          <p className="text-gray-500 text-sm mb-6">
            <span className="font-semibold text-gray-800">{form.name}</span> has been added to the inventory successfully.
          </p>
          <div className="bg-gray-50 rounded-xl p-4 text-left text-sm space-y-1.5 mb-6 border border-gray-200">
            {[
              ["Category",  categoryMap[form.category]],
              ["Model",     form.model],
              ["Serial #",  form.serialNumber],
              ["Location",  locationMap[form.location]],
              ["Quantity",  `${form.availableQuantity} / ${form.totalQuantity}`],
              ["Status",    form.status],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <span className="text-gray-500">{k}</span>
                <span className="font-medium text-gray-800">{v}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => { setSuccess(false); setForm(EMPTY_FORM); setErrors({}); }}>
              Add Another
            </Button>
            <Button className="flex-1 bg-[#e9333f] hover:bg-[#d12233] text-white" onClick={handleClose}>
              Done
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Form ────────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-7 py-5 border-b border-gray-200 bg-gradient-to-r from-[#2c3e50] to-[#34495e]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#e9333f] rounded-xl flex items-center justify-center">
              <Plus size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Add New Equipment</h2>
              <p className="text-gray-300 text-xs">Fill in the details to add to inventory</p>
            </div>
          </div>
          <button onClick={handleClose} className="p-2 rounded-full hover:bg-white/20 text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Form body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-7 py-6 space-y-5">

          {/* Name + Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                <Package size={13} /> Equipment Name *
              </Label>
              <Input
                placeholder="e.g. Arduino Uno R3"
                value={form.name}
                onChange={e => set("name", e.target.value)}
                className={errors.name ? "border-red-400" : ""}
              />
              {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                <Layers size={13} /> Category *
              </Label>
              <Select value={form.category} onValueChange={v => set("category", v)}>
                <SelectTrigger className={errors.category ? "border-red-400" : ""}>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(c => <SelectItem key={String(c.id)} value={String(c.id)}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
              {errors.category && <p className="text-xs text-red-500">{errors.category}</p>}
            </div>
          </div>

          {/* Model + Serial */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-gray-700">Model *</Label>
              <Input
                placeholder="e.g. UNO R3"
                value={form.model}
                onChange={e => set("model", e.target.value)}
                className={errors.model ? "border-red-400" : ""}
              />
              {errors.model && <p className="text-xs text-red-500">{errors.model}</p>}
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                <Hash size={13} /> Serial Number *
              </Label>
              <Input
                placeholder="e.g. ARD-UNO-001"
                value={form.serialNumber}
                onChange={e => set("serialNumber", e.target.value)}
                className={`font-mono ${errors.serialNumber ? "border-red-400" : ""}`}
              />
              {errors.serialNumber && <p className="text-xs text-red-500">{errors.serialNumber}</p>}
            </div>
          </div>

          {/* Location + Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                <MapPin size={13} /> Location *
              </Label>
              <Select value={form.location} onValueChange={v => set("location", v)}>
                <SelectTrigger className={errors.location ? "border-red-400" : ""}>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map(l => (
                      <SelectItem key={String(l.id)} value={String(l.id)}>
                        {locationMap[l.id]}
                      </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.location && <p className="text-xs text-red-500">{errors.location}</p>}
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-gray-700">Status *</Label>
              <Select value={form.status} onValueChange={v => set("status", v)}>
                <SelectTrigger className={errors.status ? "border-red-400" : ""}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
              {errors.status && <p className="text-xs text-red-500">{errors.status}</p>}
            </div>
          </div>

          {/* Quantities */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-gray-700">Total Quantity *</Label>
              <Input
                type="number" min={1}
                value={form.totalQuantity}
                onChange={e => set("totalQuantity", parseInt(e.target.value) || 1)}
                className={errors.totalQuantity ? "border-red-400" : ""}
              />
              {errors.totalQuantity && <p className="text-xs text-red-500">{errors.totalQuantity}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-gray-700">Available Quantity *</Label>
              <Input
                type="number" min={0} max={form.totalQuantity}
                value={form.availableQuantity}
                onChange={e => set("availableQuantity", parseInt(e.target.value) || 0)}
                className={errors.availableQuantity ? "border-red-400" : ""}
              />
              {errors.availableQuantity && <p className="text-xs text-red-500">{errors.availableQuantity}</p>}
            </div>
          </div>

          {/* Image URL */}
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
              <Image size={13} /> Image URL <span className="text-gray-400 font-normal">(optional)</span>
            </Label>
            <Input
              placeholder="https://..."
              value={form.imageUrl}
              onChange={e => set("imageUrl", e.target.value)}
            />
            <p className="text-xs text-gray-400">Leave blank to use default image</p>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
              <FileText size={13} /> Description
            </Label>
            <Textarea
              placeholder="Brief description of the equipment and its purpose..."
              value={form.description}
              onChange={e => set("description", e.target.value)}
              rows={3}
            />
          </div>
        </form>

        {/* Footer */}
        <div className="px-7 py-4 border-t border-gray-200 bg-gray-50 flex gap-3">
          <Button variant="outline" onClick={handleClose} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 bg-[#e9333f] hover:bg-[#d12233] text-white font-semibold"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Adding...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Plus size={16} /> Add Equipment
              </span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
