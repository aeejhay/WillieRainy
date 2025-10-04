import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const DashboardModal = ({ activeItem, dimensions, onClose }) => {
  if (!activeItem) return null;

  return (
    <AnimatePresence>
      <>
        {/* Overlay */}
        <motion.div
          className="fixed inset-0 bg-black/40 z-40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />
        
        {/* Expanding card */}
        <motion.div
          className={`fixed z-50 ${activeItem.color} overflow-hidden shadow-2xl`}
          style={{ transformOrigin: "top left" }}
          initial={{
            left: dimensions.x,
            top: dimensions.y,
            width: dimensions.width,
            height: dimensions.height,
            borderRadius: "1rem",
          }}
          animate={{
            left: window.innerWidth * 0.05,
            top: window.innerHeight * 0.1,
            width: window.innerWidth * 0.9,
            height: window.innerHeight * 0.8,
            borderRadius: "2rem",
          }}
          exit={{
            left: dimensions.x,
            top: dimensions.y,
            width: dimensions.width,
            height: dimensions.height,
            borderRadius: "1rem",
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <motion.div
            className="p-8 h-full overflow-auto relative"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.1 }}
          >
            <button
              className="absolute top-5 right-5 text-white/70 hover:text-white text-2xl w-9 h-9 flex items-center justify-center rounded-full bg-black/10 hover:bg-black/20 active:scale-95 transition-all"
              onClick={onClose}
            >
              ✕
            </button>
            
            {activeItem.icon && (
              <div className="inline-block p-4 rounded-2xl bg-white/15 mb-5">
                <activeItem.icon className="w-11 h-11 text-white" />
              </div>
            )}
            
            <h2 className="text-4xl font-semibold mb-5 text-white tracking-tight">{activeItem.title}</h2>
            <p className="mb-8 text-white/80 text-base leading-relaxed">{activeItem.content}</p>
            
            <div className="grid grid-cols-2 gap-4 mt-8">
              <div className="bg-white/15 backdrop-blur-sm p-5 rounded-2xl">
                <h3 className="text-white font-semibold mb-1.5 text-sm tracking-tight">Status</h3>
                <p className="text-white/70 text-sm">Operational</p>
              </div>
              <div className="bg-white/15 backdrop-blur-sm p-5 rounded-2xl">
                <h3 className="text-white font-semibold mb-1.5 text-sm tracking-tight">Updated</h3>
                <p className="text-white/70 text-sm">2 min ago</p>
              </div>
            </div>
            
            <div className="mt-6 bg-white/15 backdrop-blur-sm p-5 rounded-2xl">
              <h3 className="text-white font-semibold mb-4 text-sm tracking-tight">Activity</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-white/90 rounded-full"></div>
                  <p className="text-white/70 text-sm">Data synced</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-white/90 rounded-full"></div>
                  <p className="text-white/70 text-sm">New insights</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-white/90 rounded-full"></div>
                  <p className="text-white/70 text-sm">Maintenance scheduled</p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </>
    </AnimatePresence>
  );
};

export default DashboardModal;