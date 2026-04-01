import { Home, Users, Star, TrendingUp, Plus } from 'lucide-react';

const Dashboard = () => {
  const stats = [
    { icon: Home, label: "Properties", value: "12", change: "+2", color: "text-blue-500" },
    { icon: Users, label: "Total Views", value: "1,234", change: "+15%", color: "text-green-500" },
    { icon: Star, label: "Reviews", value: "89", change: "4.8⭐", color: "text-yellow-500" },
    { icon: TrendingUp, label: "Revenue", value: "$12,345", change: "+23%", color: "text-purple-500" }
  ];

  return (
    <div className="container-custom py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800">My Space</h1>
        <button className="btn-primary flex items-center space-x-2">
          <Plus size={20} />
          <span>List a Property</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <Icon className={stat.color} size={32} />
                <span className="text-sm font-semibold text-green-500">{stat.change}</span>
              </div>
              <p className="text-gray-600 mb-1">{stat.label}</p>
              <p className="text-3xl font-bold text-gray-800">{stat.value}</p>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-2xl font-bold mb-4">Recent Activity</h2>
        <div className="space-y-4">
          {[1, 2, 3].map((item) => (
            <div key={item} className="flex items-center justify-between py-3 border-b border-gray-100">
              <div>
                <p className="font-semibold">New inquiry about Modern Downtown city</p>
                <p className="text-sm text-gray-500">2 hours ago</p>
              </div>
              <button className="text-[#10B981] hover:underline">View</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;