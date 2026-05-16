import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, User, Mail, Phone, Building2, Hash,
  ShieldCheck, Eye, EyeOff, CheckCircle2, Send, Loader2, AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { sendRegistrationEmail, isEmailJSConfigured } from "@/utils/emailService";
import api from "@/api.js";

const ROLES = [
  { value: "student", label: "Student", color: "#3498db" },
  { value: "instructor", label: "Instructor", color: "#27ae60" },
  { value: "lab-assistant", label: "Lab Assistant", color: "#f39c12" },
  { value: "admin", label: "Administrator", color: "#e9333f" },
];

const DEPARTMENTS = [
  "Engineering",
  "Information Technology",
  
];

function generateTempPassword() {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$";
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

function generateEmailFromName(name, role) {
  const clean = name.toLowerCase().replace(/\s+/g, ".").replace(/[^a-z.]/g, "");
  const prefix = role === "instructor" ? "dr." : role === "admin" ? "admin." : "";
  return `${prefix}${clean}@htu.edu.jo`;
}

export function RegisterUser() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    department: "",
    role: "",
    studentId: "",
    tempPassword: generateTempPassword(),
    sendEmailValidation: true,
  });
  const [errors, setErrors] = useState({});

  const set = (field, value) => {
    setForm(prev => {
      const updated = { ...prev, [field]: value };
      // Auto-generate email when name or role changes
      if ((field === "fullName" || field === "role") && updated.fullName && updated.role) {
        if (!prev.email || prev.email === generateEmailFromName(prev.fullName, prev.role)) {
          updated.email = generateEmailFromName(updated.fullName, updated.role);
        }
      }
      return updated;
    });
    setErrors(prev => ({ ...prev, [field]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.fullName.trim()) e.fullName = "Full name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Invalid email address";
    if (!form.role) e.role = "Role is required";
    if (!form.department) e.department = "Department is required";
    if (form.role === "student" && !form.studentId.trim()) e.studentId = "Student ID is required";
    return e;
  };

  const sendValidationEmail = async () => {
    const result = await sendRegistrationEmail({
      toName:       form.fullName,
      toEmail:      form.email,
      role:         selectedRole?.label || form.role,
      department:   form.department,
      tempPassword: form.tempPassword,
    });
    if (!result.success) throw new Error(result.message);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setLoading(true);
    try{
      let role = (selectedRole?.label || form.role)
          .toLowerCase()
          .replace(/\s+/g, "-")
      if (role === "administrator") {
        role = "admin"
      }
      await api.post("/users",{
        name: form.fullName,
        email: form.email,
        password: form.tempPassword,
        role: role.toLowerCase(),
        department:   form.department,
        student_id: form?.studentId || null
      })
      if (form.sendEmailValidation) {
        try {
          await sendValidationEmail();
          setSuccess(true);
          toast.success("User registered successfully!", {
            description: `Activation email sent to ${form.email}.`
          });
        }catch (err) {
          toast.error("Account created but email failed to send.", {
            description: err.message + " — Share credentials manually.",
          });
          setSuccess(true); // still mark success, just email failed
        }
      }else{
        setSuccess(true);
        toast.success("User account created. Share credentials manually.")
      }
    }catch (err) {
      toast.error("Failed to create user", {
        description:
            err.response?.data?.error || err.message,
      });
    }finally {
      setLoading(false);
    }
  };

  const selectedRole = ROLES.find(r => r.value === form.role);

  if (success) {
    return (
      <div className="p-6 min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="text-green-600" size={36} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">User Registered!</h2>
          <p className="text-gray-600 mb-1">
            <span className="font-medium text-gray-900">{form.fullName}</span> has been added as a{" "}
            <span className="font-medium" style={{ color: selectedRole?.color }}>{selectedRole?.label}</span>.
          </p>
          {form.sendEmailValidation && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200 text-left">
              <p className="text-sm font-semibold text-blue-800 flex items-center gap-2">
                <Send size={14} /> Email Sent via Outlook
              </p>
              <p className="text-xs text-blue-700 mt-1">
                A validation email with login credentials and activation link was sent to{" "}
                <span className="font-medium">{form.email}</span>.
              </p>
            </div>
          )}
          <div className="mt-4 p-4 bg-gray-50 rounded-lg text-left border border-gray-200">
            <p className="text-xs text-gray-500 mb-1">Temporary Password</p>
            <p className="font-mono text-sm font-semibold text-gray-900">{form.tempPassword}</p>
            <p className="text-xs text-gray-500 mt-1">User must change this on first login.</p>
          </div>
          <div className="flex gap-3 mt-6">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setSuccess(false);
                setForm({ fullName: "", email: "", phone: "", department: "", role: "", studentId: "", tempPassword: generateTempPassword(), sendEmailValidation: true });
              }}
            >
              Add Another User
            </Button>
            <Button
              className="flex-1 bg-[#e9333f] hover:bg-[#d12233] text-white"
              onClick={() => navigate("/admin")}
            >
              Back to Admin
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/admin")}
          className="rounded-full"
        >
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Register New User</h1>
          <p className="text-gray-600 mt-1">Create a new account and send email validation</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 space-y-6">

            {/* Role Selection */}
            <div>
              <Label className="text-sm font-semibold text-gray-700 mb-3 block">
                <ShieldCheck size={15} className="inline mr-1" />
                User Role *
              </Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {ROLES.map(r => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => set("role", r.value)}
                    className={`p-3 rounded-xl border-2 text-center text-sm font-medium transition-all ${
                      form.role === r.value
                        ? "border-current shadow-md scale-105"
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                    style={form.role === r.value ? { borderColor: r.color, color: r.color, backgroundColor: r.color + "10" } : {}}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
              {errors.role && <p className="text-xs text-red-500 mt-1">{errors.role}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Full Name */}
              <div className="space-y-1">
                <Label htmlFor="fullName" className="text-sm font-medium text-gray-700">
                  <User size={14} className="inline mr-1" />Full Name *
                </Label>
                <Input
                  id="fullName"
                  placeholder="e.g. Ahmad Khalil"
                  value={form.fullName}
                  onChange={e => set("fullName", e.target.value)}
                  className={errors.fullName ? "border-red-400" : ""}
                />
                {errors.fullName && <p className="text-xs text-red-500">{errors.fullName}</p>}
              </div>

              {/* Email */}
              <div className="space-y-1">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  <Mail size={14} className="inline mr-1" />Email Address *
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@htu.edu.jo"
                  value={form.email}
                  onChange={e => set("email", e.target.value)}
                  className={errors.email ? "border-red-400" : ""}
                />
                {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
              </div>

              {/* Department */}
              <div className="space-y-1">
                <Label className="text-sm font-medium text-gray-700">
                  <Building2 size={14} className="inline mr-1" />Department *
                </Label>
                <Select value={form.department} onValueChange={v => set("department", v)}>
                  <SelectTrigger className={errors.department ? "border-red-400" : ""}>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map(d => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.department && <p className="text-xs text-red-500">{errors.department}</p>}
              </div>

              {/* Phone */}
              <div className="space-y-1">
                <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                  <Phone size={14} className="inline mr-1" />Phone Number
                </Label>
                <Input
                  id="phone"
                  placeholder="+962 7X XXX XXXX"
                  value={form.phone}
                  onChange={e => set("phone", e.target.value)}
                />
              </div>

              {/* Student ID (only for students) */}
              {form.role === "student" && (
                <div className="space-y-1">
                  <Label htmlFor="studentId" className="text-sm font-medium text-gray-700">
                    <Hash size={14} className="inline mr-1" />Student ID *
                  </Label>
                  <Input
                    id="studentId"
                    placeholder="e.g. 20210123"
                    value={form.studentId}
                    onChange={e => set("studentId", e.target.value)}
                    className={errors.studentId ? "border-red-400" : ""}
                  />
                  {errors.studentId && <p className="text-xs text-red-500">{errors.studentId}</p>}
                </div>
              )}

              {/* Temp Password */}
              <div className="space-y-1">
                <Label htmlFor="tempPassword" className="text-sm font-medium text-gray-700">
                  Temporary Password
                </Label>
                <div className="relative">
                  <Input
                    id="tempPassword"
                    type={showPassword ? "text" : "password"}
                    value={form.tempPassword}
                    onChange={e => set("tempPassword", e.target.value)}
                    className="pr-10 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <p className="text-xs text-gray-500">Auto-generated. User must change on first login.</p>
              </div>
            </div>

            {/* Email Validation Toggle */}
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.sendEmailValidation}
                  onChange={e => set("sendEmailValidation", e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-[#e9333f]"
                />
                <div>
                  <p className="text-sm font-semibold text-blue-900 flex items-center gap-1">
                    <Send size={14} /> Send Email Validation
                  </p>
                  <p className="text-xs text-blue-700 mt-0.5">
                    An activation email will be sent to the user's address with login credentials.
                  </p>
                  {!isEmailJSConfigured() && (
                    <div className="mt-2 flex items-start gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2">
                      <AlertTriangle size={13} className="mt-0.5 flex-shrink-0" />
                      <span>
                        EmailJS not configured — email will be <strong>simulated</strong>.
                        To enable real emails, fill in <code className="font-mono bg-amber-100 px-1 rounded">src/utils/emailService.js</code> with your EmailJS keys.
                      </span>
                    </div>
                  )}
                </div>
              </label>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#e9333f] hover:bg-[#d12233] text-white py-6 text-base font-semibold"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 size={18} className="animate-spin" />
                  {form.sendEmailValidation ? "Creating account & sending email..." : "Creating account..."}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <User size={18} />
                  Register User
                </span>
              )}
            </Button>
          </form>
        </div>

        {/* Side Info */}
        <div className="space-y-4">
          {/* Preview */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Account Preview</h3>
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold"
                style={{ backgroundColor: selectedRole?.color || "#e9333f" }}
              >
                {form.fullName ? form.fullName.charAt(0).toUpperCase() : "?"}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{form.fullName || "—"}</p>
                <p className="text-xs text-gray-500">{selectedRole?.label || "No role selected"}</p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Email</span>
                <span className="font-medium text-gray-800 text-right max-w-[60%] break-all">{form.email || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Department</span>
                <span className="font-medium text-gray-800 text-right max-w-[60%]">{form.department || "—"}</span>
              </div>
              {form.role === "student" && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Student ID</span>
                  <span className="font-medium text-gray-800">{form.studentId || "—"}</span>
                </div>
              )}
            </div>
          </div>

          {/* Email Flow */}
          {form.sendEmailValidation && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Mail size={14} /> Email Flow
              </h3>
              <ol className="space-y-3">
                {[
                  "Account created in system",
                  "Outlook sends validation email",
                  "User clicks activation link",
                  "User sets new password",
                  "Account fully activated",
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                    <span className="w-5 h-5 rounded-full bg-[#e9333f] text-white flex items-center justify-center flex-shrink-0 font-semibold text-[10px]">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Guidelines */}
          <div className="bg-amber-50 rounded-2xl border border-amber-200 p-6">
            <h3 className="text-sm font-semibold text-amber-800 mb-2">Admin Notes</h3>
            <ul className="text-xs text-amber-700 space-y-1.5">
              <li>• Email must be an official @htu.edu.jo address</li>
              <li>• Admin accounts have full system access</li>
              <li>• Student ID must be unique and valid</li>
              <li>• Users can be deactivated but not deleted</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
