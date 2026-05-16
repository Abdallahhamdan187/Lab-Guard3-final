import {useEffect, useState} from "react";
import { Download, FileText, Filter, Calendar } from "lucide-react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { exportToPDF, exportToExcel } from "@/utils/exportUtils";
import { getUserSession } from "@/utils/auth";
import { toast } from "sonner";
import api from "@/api.js";

export function TransactionHistory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter]   = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo,   setDateTo]   = useState("");
  const [transactions,setTransactions] = useState([])
  const fetchTransactions = async () =>{
    try {
      const res = await api.get("/users/me/transactions")
      setTransactions(res.data)
    }catch (err) {
      console.log("Transaction History error:", err);
    }
  }
  useEffect(() => {
    fetchTransactions()
  },[])
  // Get the logged-in user from session
  const sessionUser = getUserSession();

  // Only show transactions that belong to the logged-in student (match by name)
  const myTransactions = transactions.filter(
    txn => txn.userName === sessionUser?.name
  );

  // Apply the search / type / status / date filters on top of that
  const filteredTransactions = myTransactions.filter(txn => {
    const matchesSearch =
      txn.equipmentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      txn.purpose.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType   = typeFilter   === "all" || txn.type   === typeFilter;
    const matchesStatus = statusFilter === "all" || txn.status === statusFilter;

    let matchesDate = true;

    const txnDate = new Date(txn.requestDate);
    txnDate.setHours(0, 0, 0, 0);

    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      matchesDate = txnDate >= fromDate;
    }

    if (dateTo && matchesDate) {
      const toDate = new Date(dateTo);
      toDate.setHours(0, 0, 0, 0);
      matchesDate = txnDate <= toDate;
    }

    return matchesSearch && matchesType && matchesStatus && matchesDate;
  });
  const handleExportPDF = () => {
    exportToPDF(
      filteredTransactions,
      `my-transactions-${sessionUser?.name?.replace(/\s+/g, "-") || "student"}.pdf`,
      `Transaction History — ${sessionUser?.name || "Student"}`
    );
    toast.success("PDF exported successfully!");
  };

  const handleExportExcel = () => {
    exportToExcel(
      filteredTransactions,
      `my-transactions-${sessionUser?.name?.replace(/\s+/g, "-") || "student"}.xlsx`,
      `Transaction History — ${sessionUser?.name || "Student"}`
    );
    toast.success("Excel file exported successfully!");
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Transaction History</h1>
          <p className="text-gray-600 mt-1">
            Your personal equipment transaction records
            {sessionUser?.name && (
              <span className="ml-1 text-[#e9333f] font-medium">— {sessionUser.name}</span>
            )}
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleExportPDF}
            variant="outline"
            className="flex items-center gap-2"
            disabled={filteredTransactions.length === 0}
          >
            <FileText size={16} />
            Export PDF
          </Button>
          <Button
            onClick={handleExportExcel}
            className="flex items-center gap-2 bg-[#e9333f] hover:bg-[#d12233] text-white"
            disabled={filteredTransactions.length === 0}
          >
            <Download size={16} />
            Export Excel
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="md:col-span-2">
            <Input
              type="text"
              placeholder="Search by equipment or purpose..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger>
              <Filter className="mr-2" size={16} />
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="Borrow">Borrow</SelectItem>
              <SelectItem value="Return">Return</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <Filter className="mr-2" size={16} />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Approved">Approved</SelectItem>
              <SelectItem value="Denied">Denied</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <div className="flex flex-col gap-1 flex-1">
              <span className="text-xs text-gray-500 font-medium pl-1">From</span>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1 flex-1">
              <span className="text-xs text-gray-500 font-medium pl-1">To</span>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Total Transactions", value: filteredTransactions.length,                                           color: "text-gray-900" },
          { label: "Approved",           value: filteredTransactions.filter(t => t.status === "Approved").length,   color: "text-green-600" },
          { label: "Pending",            value: filteredTransactions.filter(t => t.status === "Pending").length,    color: "text-yellow-600" },
          { label: "Completed",          value: filteredTransactions.filter(t => t.status === "Completed").length,  color: "text-blue-600" },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
            <p className="text-sm text-gray-600">{stat.label}</p>
            <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>Date</TableHead>
                <TableHead>Equipment</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Purpose</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Approved By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((txn) => (
                  <TableRow key={txn.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-gray-400" />
                        <div>
                          <p className="text-sm font-medium">
                            {new Date(txn.requestDate).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(txn.requestDate).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm font-medium text-gray-900">{txn.equipmentName}</p>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                        txn.type === "Borrow"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-purple-100 text-purple-800"
                      }`}>
                        {txn.type}
                      </span>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{txn.quantity}</p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-gray-600 max-w-xs truncate">{txn.purpose}</p>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={txn.status} />
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-gray-600">{txn.approvedByName || "—"}</p>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <FileText className="mx-auto text-gray-300 mb-3" size={48} />
                    <p className="text-gray-500 font-medium">No transactions found</p>
                    <p className="text-gray-400 text-sm mt-1">
                      {myTransactions.length === 0
                        ? "You have no transaction records yet."
                        : "Try adjusting your search or filters."}
                    </p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
