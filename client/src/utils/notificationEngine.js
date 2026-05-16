/**
 * Smart Notification Engine
 * Generates role-aware and user-aware notifications from live data.
 * Each notification has:
 *   forRoles  — which roles can see it (admin always sees all)
 *   forUsers  — which specific usernames can see it (empty = role-based only)
 */

export function generateSmartNotifications(transactions, equipment, user) {
  if (!user) return [];

  const { role, name } = user;
  const now = new Date();
  const notifications = [];

  // ── 1. OVERDUE RETURNS ────────────────────────────────────────────────
  const overdueTransactions = transactions.filter(txn =>
    txn.type === "Borrow" &&
    txn.status === "Approved" &&
    !txn.returnDate &&
    txn.expectedReturnDate &&
    new Date(txn.expectedReturnDate) < now
  );

  overdueTransactions.forEach(txn => {
    const daysOverdue = Math.floor((now - new Date(txn.expectedReturnDate)) / (1000 * 60 * 60 * 24));
    const urgent = daysOverdue >= 3;

    // Notify the student who borrowed it
    if (role === "student" && txn.userName === name) {
      notifications.push({
        id:       `smart-overdue-student-${txn.id}`,
        type:     urgent ? "error" : "warning",
        category: "overdue",
        title:    urgent ? "Overdue Return — Urgent!" : "Overdue Return",
        message:  `Your borrowed ${txn.equipmentName} is overdue by ${daysOverdue} day${daysOverdue !== 1 ? "s" : ""}. Return it immediately.`,
        date:     txn.expectedReturnDate,
        read:     false,
        priority: urgent ? 1 : 2,
      });
    }

    // Notify staff
    if (role === "instructor" || role === "lab-assistant" || role === "admin") {
      notifications.push({
        id:       `smart-overdue-staff-${txn.id}`,
        type:     urgent ? "error" : "warning",
        category: "overdue",
        title:    `Overdue Return${urgent ? " — Urgent" : ""}`,
        message:  `${txn.userName} (${txn.studentId || "—"}) has not returned ${txn.equipmentName}. Overdue by ${daysOverdue} day${daysOverdue !== 1 ? "s" : ""}.`,
        date:     txn.expectedReturnDate,
        read:     false,
        priority: urgent ? 1 : 2,
      });
    }
  });

  // ── 2. DUE SOON (student only) ────────────────────────────────────────
  if (role === "student" || role === "admin") {
    const dueSoon = transactions.filter(txn =>
      txn.type === "Borrow" &&
      txn.status === "Approved" &&
      !txn.returnDate &&
      txn.expectedReturnDate &&
      txn.userName === name
    ).filter(txn => {
      const days = Math.ceil((new Date(txn.expectedReturnDate) - now) / (1000 * 60 * 60 * 24));
      return days >= 0 && days <= 2;
    });

    dueSoon.forEach(txn => {
      const days = Math.ceil((new Date(txn.expectedReturnDate) - now) / (1000 * 60 * 60 * 24));
      notifications.push({
        id:       `smart-duesoon-${txn.id}`,
        type:     "warning",
        category: "due",
        title:    days === 0 ? "Due Today!" : `Due in ${days} Day${days !== 1 ? "s" : ""}`,
        message:  `Your borrowed ${txn.equipmentName} is due ${days === 0 ? "today" : `in ${days} day${days !== 1 ? "s" : ""}`}. Please return on time.`,
        date:     txn.expectedReturnDate,
        read:     false,
        priority: days === 0 ? 1 : 2,
      });
    });
  }

  // ── 3. APPROVED REQUEST (student) ─────────────────────────────────────
  if (role === "student" || role === "admin") {
    const recentApprovals = transactions.filter(txn =>
      txn.type === "Borrow" &&
      txn.status === "Approved" &&
      txn.userName === name &&
      txn.approvedBy &&
      txn.approvalDate
    );
    recentApprovals.forEach(txn => {
      notifications.push({
        id:       `smart-approved-${txn.id}`,
        type:     "success",
        category: "approval",
        title:    "Request Approved ✓",
        message:  `Your borrow request for ${txn.equipmentName} was approved by ${txn.approvedBy}.`,
        date:     txn.approvalDate,
        read:     false,
        priority: 3,
      });
    });
  }

  // ── 4. MAINTENANCE ALERTS (lab-assistant / admin) ────────────────────
  if (role === "lab-assistant" || role === "admin") {
    equipment.filter(eq => eq.status === "Maintenance").forEach(eq => {
      notifications.push({
        id:       `smart-maintenance-${eq.id}`,
        type:     "warning",
        category: "maintenance",
        title:    "Equipment Under Maintenance",
        message:  `${eq.name} (${eq.serialNumber}) is currently under maintenance and unavailable for borrowing.`,
        date:     new Date().toISOString(),
        read:     false,
        priority: 3,
      });
    });
  }

  // ── 5. LOW STOCK (lab-assistant / admin) ─────────────────────────────
  if (role === "lab-assistant" || role === "admin") {
    equipment.forEach(eq => {
      if (eq.availableQuantity <= 1 && eq.totalQuantity > 1) {
        const outOfStock = eq.availableQuantity === 0;
        notifications.push({
          id:       `smart-lowstock-${eq.id}`,
          type:     outOfStock ? "error" : "warning",
          category: "low_stock",
          title:    outOfStock ? "Out of Stock" : "Low Stock Alert",
          message:  outOfStock
            ? `${eq.name} has no units available — all ${eq.totalQuantity} are in use.`
            : `${eq.name} has only ${eq.availableQuantity} unit left out of ${eq.totalQuantity}.`,
          date:     new Date().toISOString(),
          read:     false,
          priority: outOfStock ? 1 : 3,
        });
      }
    });
  }

  // ── 6. PENDING APPROVALS (instructor / admin) ────────────────────────
  if (role === "instructor" || role === "admin") {
    const pending = transactions.filter(t => t.status === "Pending");
    if (pending.length > 0) {
      notifications.push({
        id:       "smart-pending",
        type:     pending.length >= 3 ? "warning" : "info",
        category: "pending",
        title:    `${pending.length} Pending Approval${pending.length > 1 ? "s" : ""}`,
        message:  `${pending.length} borrow request${pending.length > 1 ? "s are" : " is"} waiting for your review.`,
        date:     new Date().toISOString(),
        read:     false,
        priority: 2,
      });
    }
  }

  return notifications.sort((a, b) => a.priority - b.priority || new Date(b.date) - new Date(a.date));
}
