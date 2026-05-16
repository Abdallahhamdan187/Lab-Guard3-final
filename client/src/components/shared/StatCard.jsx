/**
 * Stat Card Component
 * @param {Object} props
 * @param {string} props.title - Card title
 * @param {string | number} props.value - Main value to display
 * @param {Function} props.icon - Lucide icon component
 * @param {string} [props.color='#e9333f'] - Theme color
 * @param {Object} [props.trend] - Trend information
 * @param {string} props.trend.value - Trend value
 * @param {boolean} props.trend.isPositive - Whether trend is positive
 */
export function StatCard({ title, value, icon: Icon, color = "#e9333f", trend }) {
  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 p-6 border border-gray-200">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <span className={`text-xs ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {trend.isPositive ? '↑' : '↓'} {trend.value}
              </span>
              <span className="text-xs text-gray-500">vs last month</span>
            </div>
          )}
        </div>
        <div 
          className="w-12 h-12 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${color}15` }}
        >
          <Icon size={24} style={{ color }} />
        </div>
      </div>
    </div>
  );
}
