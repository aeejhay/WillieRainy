import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { MoreHorizontal } from 'lucide-react';
import SearchBar from './SearchBar';
import DashboardModal from './DashboardModal';

const Dashboard = ({ 
  dashboardItems, 
  activeItem,
  dimensions,
  searchData,
  onSearchChange,
  onSearch,
  showSuggestions,
  suggestions,
  onSuggestionClick,
  isSearching,
  onItemClick,
  onClose
}) => {
  return (
    <motion.div
      key="dashboard"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen pb-20"
    >
      {/* Close Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
        onClick={onClose}
        className="fixed top-6 right-6 z-[100] bg-red-500 hover:bg-red-600 text-white rounded-full p-3 shadow-xl hover:shadow-2xl active:scale-90 transition-all"
      >
        <X className="w-6 h-6" />
      </motion.button>

      {/* Search Bar */}
      <SearchBar 
        searchData={searchData}
        onSearchChange={onSearchChange}
        onSearch={onSearch}
        showSuggestions={showSuggestions}
        suggestions={suggestions}
        onSuggestionClick={onSuggestionClick}
        isSearching={isSearching}
      />

      {/* Dashboard Grid */}
      <div className="max-w-6xl mx-auto px-4 py-8 pt-28">
        <div className="grid grid-cols-4 auto-rows-[140px] gap-3">
          {dashboardItems.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className={`${item.span} ${item.color} p-4 rounded-2xl cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-lg hover:shadow-xl ${
                  activeItem?.id === item.id ? "opacity-0" : ""
                }`}
                onClick={(e) => onItemClick(item, e)}
              >
                <Icon className="w-7 h-7 text-white mb-2" />
                <h2 className="font-semibold text-base text-white tracking-tight">{item.title}</h2>
                <p className="text-white/50 mt-1 text-xs font-medium">Tap to view</p>
              </div>
            );
          })}
          
          {/* More Box */}
          <div className="col-span-1 row-span-1 bg-gray-400 p-4 rounded-2xl cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-lg hover:shadow-xl flex flex-col items-center justify-center">
            <MoreHorizontal className="w-7 h-7 text-white mb-1" />
            <h2 className="font-semibold text-base text-white tracking-tight">More</h2>
          </div>
        </div>
      </div>

      {/* Modal */}
      <DashboardModal 
        activeItem={activeItem}
        dimensions={dimensions}
        onClose={() => onClose()}
      />
    </motion.div>
  );
};

export default Dashboard;