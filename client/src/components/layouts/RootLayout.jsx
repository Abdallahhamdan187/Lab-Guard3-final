import { Outlet, Link, useLocation, useNavigate, Navigate } from "react-router-dom";
import { getUserSession, clearUserSession } from "@/utils/auth";
import {
  LayoutDashboard,
  Package,
  FileText,
  Bell,
  Menu,
  X,
  Settings,
  ClipboardList,
  ShieldCheck,
  UserCheck
} from "lucide-react";
import {useState, useEffect} from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import api from "@/api.js";
import {socket} from "@/socket/socket.js";
export function RootLayout() {
  const user = getUserSession();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  useEffect(() => {
    if (!user?.id) return;
    socket.auth = { token: user.token };
    socket.connect();
    socket.emit("register_user", user.id);

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await api.get("/users/me/notifications")
        setNotifications(res.data);
      } catch (err) {
        console.error(
            "Failed loading notifications",
            err
        );
      }
    };
    fetchNotifications();
  }, []);
  useEffect(() => {
    const handleNotification = (notification) => {

      setNotifications(prev => [
        notification,
        ...prev
      ]);

    };

    socket.on("notification", handleNotification);

    return () => {
      socket.off("notification", handleNotification);
    };

  }, []);
  if (!user) return <Navigate to="/login" />;
  const markNotificationRead = async (id) => {
    try {
      await api.patch(`/users/me/notifications/${id}/read`)
      setNotifications(prev =>
          prev.map(n =>
              n.id === id
                  ? { ...n, is_read: true }
                  : n
          )
      );
    } catch (err) {
      console.error(err);
    }
  };
  const markAllRead = async () => {
    try {
      await api.patch("/users/me/notifications/read-all")
      setNotifications(prev =>
          prev.map(n => ({
            ...n,
            is_read: true
          }))
      );
    } catch (err) {
      console.error(err);
    }
  };
  const location = useLocation();

  const isActive = (path) => {
    if (path === "/" && location.pathname === "/") return true;
    if (path !== "/" && location.pathname.startsWith(path)) return true;
    return false;
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const notifIconColor = {
    success: "text-green-500",
    error:   "text-red-500",
    warning: "text-yellow-500",
    info:    "text-blue-500",
  };

  const handleLogout = () => {
    clearUserSession();
    navigate("/login");
  };
  const allNavItems = [
    { path: "/", label: "Dashboard", icon: LayoutDashboard, roles: ["student", "admin"], section: "Student Portal" },
    { path: "/equipment", label: "Browse Equipment", icon: Package, roles: ["student", "admin"], section: "Student Portal" },
    { path: "/borrow", label: "Borrow/Return", icon: ClipboardList, roles: ["student", "admin"], section: "Student Portal" },
    { path: "/history", label: "Transaction History", icon: FileText, roles: ["student", "admin"], section: "Student Portal" },

    { path: "/instructor", label: "Instructor Portal", icon: UserCheck, roles: ["instructor", "admin"], section: "Other Portals" },
    { path: "/lab-assistant", label: "Lab Assistant Portal", icon: Settings, roles: ["lab-assistant", "admin"], section: "Other Portals" },
    { path: "/admin", label: "Admin Portal", icon: ShieldCheck, roles: ["admin"], section: "Other Portals" },
  ];

  const visibleItems = allNavItems.filter(item => item.roles.includes(user.role));

  const studentSection = visibleItems.filter(item => item.section === "Student Portal");
  const portalSection = visibleItems.filter(item => item.section === "Other Portals");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Must-change-password banner */}
      {user.mustChangePassword && (
        <div className="bg-amber-500 text-white text-sm px-4 py-2 flex items-center justify-between">
          <span>⚠️ You must change your temporary password before continuing.</span>
          <button
            onClick={() => navigate("/change-password")}
            className="ml-4 underline font-semibold hover:text-amber-100"
          >
            Change Now →
          </button>
        </div>
      )}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#e9333f] rounded-lg flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-lg">LG</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">LabGuard</h1>
                <p className="text-xs text-gray-500">Al Hussein Technical University</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-[#e9333f] text-white text-xs">
                      {unreadCount}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 p-0 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Notifications</p>
                    {unreadCount > 0 && (
                      <p className="text-xs text-gray-500">{unreadCount} unread</p>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-xs text-[#e9333f] hover:underline font-semibold">
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-[400px] overflow-y-auto">
                  {notifications.length > 0 ? notifications.map(notif => (
                    <div
                      key={notif.id}
                      onClick={() => markNotificationRead(notif.id)}
                      className={`px-4 py-3 border-b border-gray-100 last:border-0 cursor-pointer hover:bg-gray-50 transition-colors ${!notif.is_read ? "bg-red-50/50" : ""}`}
                    >
                      <div className="flex items-start gap-2.5">
                        <span className={`mt-0.5 text-base leading-none flex-shrink-0 ${notifIconColor[notif.type]}`}>
                          {notif.type === "success" ? "✓" : notif.type === "error" ? "✕" : notif.type === "warning" ? "⚠" : "ℹ"}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-semibold text-gray-900 ${!notif.is_read ? "font-bold" : ""}`}>{notif.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{notif.message}</p>
                          <p className="text-[10px] text-gray-400 mt-1">{new Date(notif.created_at).toLocaleDateString()}</p>
                        </div>
                        {!notif.is_read && <div className="w-2 h-2 bg-[#e9333f] rounded-full mt-1 flex-shrink-0" />}
                      </div>
                    </div>
                  )) : (
                    <div className="px-4 py-10 text-center">
                      <p className="text-2xl mb-2">🔔</p>
                      <p className="text-sm text-gray-500 font-medium">You're all caught up!</p>
                      <p className="text-xs text-gray-400 mt-1">No notifications right now.</p>
                    </div>
                  )}
                </div>
                {notifications.length > 0 && (
                  <div className="px-4 py-2 border-t border-gray-100 bg-gray-50 text-center">
                    <p className="text-xs text-gray-400">{notifications.length} total notifications</p>
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 hover:bg-gray-100 rounded-lg p-2 transition-colors">
                  <img src={user.imageUrl || "https://github.com/shadcn.png"} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
                  <div className="text-left hidden md:block">
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <div className="px-3 py-2 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize text-white bg-[#e9333f]">{user.role}</span>
                </div>
                <DropdownMenuItem
                  className="cursor-pointer gap-2 mt-1"
                  onClick={() => navigate("/change-password")}
                >
                  🔒 Change Password
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-600 cursor-pointer gap-2"
                  onClick={handleLogout}
                >
                  🚪 Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside
          className={`
            fixed lg:static inset-y-0 left-0 z-40 w-64 bg-[#2c3e50] transform transition-transform duration-300 ease-in-out mt-[73px] lg:mt-0
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          `}
        >
          <nav className="p-4 space-y-2 h-[calc(100vh-73px)] overflow-y-auto">
            {/* Render Student Section — only if user has access to these pages */}
            {studentSection.length > 0 && (
            <div className="mb-6">
              <p className="text-xs uppercase text-gray-400 mb-2 px-3">Student Portal</p>
              {studentSection.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${active ? "bg-[#e9333f] text-white shadow-lg" : "text-gray-300 hover:bg-[#34495e] hover:text-white"
                      }`}
                  >
                    <Icon size={20} />
                    <span className="text-sm">{item.label}</span>
                  </Link>
                );
              })}
            </div>
            )}

            {/* Render Portal Section (Only if user has access to at least one) */}
            {portalSection.length > 0 && (
              <div className="pt-4 border-t border-gray-600">
                <p className="text-xs uppercase text-gray-400 mb-2 px-3">Other Portals</p>
                {portalSection.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${active ? "bg-[#e9333f] text-white shadow-lg" : "text-gray-300 hover:bg-[#34495e] hover:text-white"
                        }`}
                    >
                      <Icon size={20} />
                      <span className="text-sm">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </nav>
        </aside>

        {sidebarOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}

        <main className="flex-1 min-h-[calc(100vh-73px)]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}