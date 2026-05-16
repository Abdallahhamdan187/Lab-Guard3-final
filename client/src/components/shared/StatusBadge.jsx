import { Badge } from "@/components/ui/badge";

/**
 * Status Badge Component
 * @param {Object} props
 * @param {string} props.status - Status text to display
 */
export function StatusBadge({ status }) {
  const getStatusStyle = (status) => {
    switch (status) {
      case 'Approved':
      case 'Available':
      case 'Completed':
        return 'bg-green-100 text-green-800 hover:bg-green-100';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100';
      case 'Denied':
        return 'bg-red-100 text-red-800 hover:bg-red-100';
      case 'In Use':
      case 'Reserved':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
      case 'Maintenance':
        return 'bg-orange-100 text-orange-800 hover:bg-orange-100';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
    }
  };

  return (
    <Badge className={getStatusStyle(status)}>
      {status}
    </Badge>
  );
}
