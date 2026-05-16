import { Users, Package, TrendingUp, Activity, UserPlus, ArrowUpRight, Clock } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  AreaChart, Area, ComposedChart
} from "recharts";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { StatCard } from "@/components/shared/StatCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {useEffect, useState} from "react";
import api from "@/api.js";
import {socket} from "@/socket/socket.js";

const COLORS = ["#27ae60", "#3498db", "#f39c12", "#9b59b6", "#e9333f"];

const roleRadarData = [
  { subject: "Active Users", students: 85, instructors: 90, assistants: 75 },
  { subject: "Requests", students: 70, instructors: 30, assistants: 50 },
  { subject: "Approvals", students: 20, instructors: 95, assistants: 60 },
  { subject: "Equipment Use", students: 75, instructors: 45, assistants: 80 },
  { subject: "Returns", students: 68, instructors: 25, assistants: 70 },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-3 text-xs">
        <p className="font-semibold text-gray-700 mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }}>{p.name}: <strong>{p.value}</strong></p>
        ))}
      </div>
    );
  }
  return null;
};

export function AdminDashboard() {
  const [stats,setStats] = useState(null)
  const [users,setUsers] = useState([])
  const [logs,setLogs] = useState([])
  const statusData = stats?.statusData || []
  const borrowData = stats?.borrowData || []
  const categoryData = stats?.categoryData || []
  const utilizationData = stats?.utilizationData || []
  const userDistribution = stats?.userDistribution || []
  const requestStatus = stats?.requestStatus || []
  const equipmentHealth = stats?.equipmentHealth || []
  const fetchAdminDashboardData = async ()=>{
    try{
      const res = await api.get("/dashboard/admin")
      setStats(res.data)
    }catch (err) {
      console.log("Admin Dashboard Error",err)
    }
  }

  const fetchUsers = async () => {
    try{
      const res = await api.get("/users?limit=4")
      setUsers(res.data)
    }catch (err){
      console.log("Users Error", err)
    }
  }

  const fetchLogs = async () => {
    try{
      const res = await api.get("/logs?limit=4")
      setLogs(res.data)
    }catch (err) {
        console.log("Logs Error",err)
    }
  }

  useEffect(()=>{
    fetchAdminDashboardData()
    fetchUsers()
    fetchLogs()
  },[])

  useEffect(() => {
    const handleSystemLogs = (log) => {
      setLogs(prev => [
        log,
        ...prev
      ].slice(0, 4));
    };

    socket.on("system_logs", handleSystemLogs);

    return () => {
      socket.off("system_logs", handleSystemLogs);
    };

  }, []);

  const navigate = useNavigate();
  const totalUsers = stats?.totalUsers || 0;
  const totalEquipment = stats?.totalEquipment || 0;
  const totalTransactions = stats?.totalTransactions || 0;
  const monthlyData = stats?.systemGrowth || []
  const systemUptime = "99.8%";

  const handleExportReport = undefined; // removed

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Administrator Dashboard</h1>
          <p className="text-gray-500 mt-1 text-sm">System overview · Last updated just now</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate("/admin/register-user")} className="flex items-center gap-2 bg-[#e9333f] hover:bg-[#d12233] text-white text-sm">
            <UserPlus size={15} /> Add User
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard title="Total Users" value={totalUsers} icon={Users} color="#3498db" trend={{ value: "12%", isPositive: true }} />
        <StatCard title="Total Equipment" value={totalEquipment} icon={Package} color="#e9333f" trend={{ value: "8%", isPositive: true }} />
        <StatCard title="Total Transactions" value={totalTransactions} icon={TrendingUp} color="#27ae60" trend={{ value: "15%", isPositive: true }} />
        <StatCard title="System Uptime" value={systemUptime} icon={Activity} color="#9b59b6" />
      </div>

      {/* Row 1: Growth + Status Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-900">Monthly Growth Overview</h3>
            <span className="text-xs text-green-600 font-medium flex items-center gap-1"><ArrowUpRight size={14} />+15% this month</span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="transactions" fill="#e9333f20" stroke="#e9333f" strokeWidth={2} name="Transactions" />
              <Bar dataKey="students" fill="#3498db40" stroke="#3498db" strokeWidth={1} name="Students" radius={[4,4,0,0]} />
              <Line type="monotone" dataKey="approved" stroke="#27ae60" strokeWidth={2} dot={{ r: 3 }} name="Approved" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Equipment Status</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value" nameKey="status">
                {statusData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {statusData.map((s, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                  <span className="text-gray-600">{s.status}</span>
                </div>
                <span className="font-semibold text-gray-800">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: Most Used Equipment Bar + Category Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Most Requested Equipment</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={borrowData} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis type="number" stroke="#9ca3af" fontSize={11} />
              <YAxis dataKey="name" type="category" stroke="#9ca3af" fontSize={11} width={100} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="borrows" name="Borrow Requests" fill="#e9333f" radius={[0,4,4,0]}>
                {borrowData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Equipment by Category</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={categoryData} cx="50%" cy="50%" outerRadius={75} paddingAngle={2} dataKey="value" label={({ name, percent }) => `${Math.round(percent * 100)}%`} labelLine={false} fontSize={10}>
                {categoryData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-3">
            {categoryData.map((c, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-gray-600">{c.name}</span>
                </div>
                <span className="font-semibold text-gray-800">{c.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: Equipment Utilization + Role Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Equipment Utilization Rate (%)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={utilizationData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" stroke="#9ca3af" fontSize={10} angle={-20} textAnchor="end" height={50} />
              <YAxis stroke="#9ca3af" fontSize={11} unit="%" domain={[0, 100]} />
              <Tooltip content={<CustomTooltip />} formatter={(v) => `${v}%`} />
              <Bar dataKey="utilization" name="Utilization" radius={[4,4,0,0]}>
                {utilizationData.map((entry, i) => (
                  <Cell key={i} fill={entry.utilization > 70 ? "#e9333f" : entry.utilization > 40 ? "#f39c12" : "#27ae60"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">User Role Activity Radar</h3>
          <ResponsiveContainer width="100%" height={250}>
            <RadarChart data={roleRadarData}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
              <Radar name="Students" dataKey="students" stroke="#3498db" fill="#3498db" fillOpacity={0.15} strokeWidth={2} />
              <Radar name="Instructors" dataKey="instructors" stroke="#27ae60" fill="#27ae60" fillOpacity={0.15} strokeWidth={2} />
              <Radar name="Lab Assistants" dataKey="assistants" stroke="#f39c12" fill="#f39c12" fillOpacity={0.15} strokeWidth={2} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 4: Recent Users + Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-900">Recently Added Users</h3>
            <Button size="sm" onClick={() => navigate("/admin/register-user")} className="bg-[#e9333f] hover:bg-[#d12233] text-white text-xs h-8">
              <UserPlus size={13} className="mr-1" /> Add User
            </Button>
          </div>
          <div className="divide-y divide-gray-50">
            {users.map(u => (
              <div key={u.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
                <div className="w-9 h-9 rounded-full bg-[#e9333f] text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {u.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{u.name}</p>
                  <p className="text-xs text-gray-500">{u.department}</p>
                </div>
                <div className="text-right">
                  <Badge variant="outline" className="text-xs mb-1">{u.role}</Badge>
                  <p className="text-xs text-gray-400">{new Date(u.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-900">System Activity Logs</h3>
            <span className="text-xs text-gray-400 flex items-center gap-1"><Clock size={12} /> Live</span>
          </div>
          <div className="divide-y divide-gray-50">
            {logs.map(log => (
              <div key={log.id} className="flex items-start gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${log.status === "Success" ? "bg-green-500" : "bg-red-500"}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{log.message}</p>
                  <p className="text-xs text-gray-500">{log.user} · {log.timestamp}</p>
                </div>
                <Badge className={`text-xs ${log.status === "Success" ? "bg-green-100 text-green-800 hover:bg-green-100" : "bg-red-100 text-red-800 hover:bg-red-100"}`}>
                  {log.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 5: Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          {
            title: "User Distribution",
            items: userDistribution
          },
          {
            title: "Request Status",
            items: requestStatus
          },
          {
            title: "Equipment Health",
            items: equipmentHealth
          }
        ].map((card, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h4 className="text-sm font-semibold text-gray-700 mb-4">{card.title}</h4>
            <div className="space-y-3">
              {card.items.map((item, j) => (
                <div key={j}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600">{item.label}</span>
                    <span className="text-xs font-semibold text-gray-800">{item.value}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div className="h-1.5 rounded-full transition-all duration-500" style={{ width: `${item.percentage}%`, backgroundColor: item.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
