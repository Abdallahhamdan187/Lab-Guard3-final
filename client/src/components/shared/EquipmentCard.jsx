import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Package } from "lucide-react";

/**
 * Equipment Card Component
 * @param {Object} props
 * @param {Object} props.equipment - Equipment data object
 * @param {Function} [props.onBorrow] - Callback when borrow button is clicked
 * @param {boolean} [props.showActions=true] - Whether to show action buttons
 */
export function EquipmentCard({ equipment, onBorrow, showActions = true }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'Available':
        return 'bg-green-100 text-green-800 hover:bg-green-100';
      case 'In Use':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
      case 'Maintenance':
        return 'bg-orange-100 text-orange-800 hover:bg-orange-100';
      case 'Reserved':
        return 'bg-purple-100 text-purple-800 hover:bg-purple-100';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden border border-gray-200">
      <div className="relative h-48 bg-gray-100 overflow-hidden">
        <img
          src={equipment.imageUrl}
          alt={equipment.name}
          className="w-full h-full object-cover"
        />
        <Badge className={`absolute top-3 right-3 ${getStatusColor(equipment.status)}`}>
          {equipment.status}
        </Badge>
      </div>

      <div className="p-4">
        <div className="mb-3">
          <h3 className="font-semibold text-gray-900 mb-1">{equipment.name}</h3>
          <p className="text-sm text-gray-500">{equipment.model}</p>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin size={16} className="text-gray-400" />
            <span>{equipment.location}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Package size={16} className="text-gray-400" />
            <span>Available: {equipment.availableQuantity} / {equipment.totalQuantity}</span>
          </div>
        </div>

        <div className="mb-3">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-[#e9333f] h-2 rounded-full transition-all duration-300"
              style={{ width: `${(equipment.availableQuantity / equipment.totalQuantity) * 100}%` }}
            />
          </div>
        </div>

        {showActions && (
          <Button
            onClick={onBorrow}
            disabled={equipment.availableQuantity === 0}
            className="w-full bg-[#e9333f] hover:bg-[#d12233] text-white"
          >
            {equipment.availableQuantity === 0 ? 'Not Available' : 'Borrow Equipment'}
          </Button>
        )}
      </div>
    </div>
  );
}
