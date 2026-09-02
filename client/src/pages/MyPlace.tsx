import { Heart, Trash2 } from 'lucide-react';

import { motion } from 'framer-motion';

const MyPlace = () => {
  const savedProperties = [
    {
      id: 1,
      title: "Modern Downtown Loft",
      price: 2500,
      location: "Hayat, Addis Ababa",
      image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=500"
    },
    // Add more saved properties
  ];

  return (
    <div className="container-custom py-12 min-h-screen">
      <div className="flex items-center space-x-3 mb-8">
        <Heart className="text-amber-600 dark:text-amber-400" size={32} />
        <h1 className="text-4xl font-bold text-gray-800 dark:text-white">My Place</h1>
      </div>

      {savedProperties.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedProperties.map((property) => (
            <motion.div
              key={property.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white dark:bg-gray-800 dark:border dark:border-gray-700 rounded-xl shadow-md overflow-hidden transition-colors"
            >
              <img src={property.image} alt={property.title} className="w-full h-48 object-cover" />
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{property.title}</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-2">{property.location}</p>
                <div className="flex justify-between items-center">
                  <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">ETB {property.price}<span className="text-sm text-gray-500 dark:text-gray-400">/month</span></p>
                  <button className="p-2 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-full transition-colors">
                    <Trash2 size={20} className="text-red-500" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700 p-8">
          <Heart size={64} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <h3 className="text-2xl font-semibold text-gray-700 dark:text-gray-200 mb-2">Your Place is Empty</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">Start exploring properties and save your favorites</p>
          <button className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-lg shadow-amber-600/20 transition">Explore Properties</button>
        </div>
      )}
    </div>
  );
};

export default MyPlace;