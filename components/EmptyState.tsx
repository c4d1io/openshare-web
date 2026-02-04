"use client";

import { motion } from "framer-motion";
import { Search, ArrowLeft } from "lucide-react";

interface EmptyStateProps {
  onBack: () => void;
  onTryAgain: () => void;
}

export default function EmptyState({ onBack, onTryAgain }: EmptyStateProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-md"
      >
        <motion.div
          className="relative inline-block mb-8"
          animate={{
            y: [0, -10, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <div className="w-32 h-32 bg-gradient-to-br from-rose-100 to-amber-100 rounded-full flex items-center justify-center">
            <Search className="w-16 h-16 text-gray-400" />
          </div>
          <motion.div
            className="absolute -top-2 -right-2 w-8 h-8 bg-amber-200 rounded-full opacity-60"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.6, 0.3, 0.6],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
            }}
          />
          <motion.div
            className="absolute -bottom-2 -left-2 w-6 h-6 bg-rose-200 rounded-full opacity-60"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.6, 0.3, 0.6],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
            }}
          />
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-2xl md:text-3xl font-light text-gray-900 mb-4"
        >
          No matching photos found yet
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-gray-600 mb-8 leading-relaxed"
        >
          {"We couldn't find any photos matching your face. This might be because the photos are still being uploaded or processed."}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-3 justify-center"
        >
          <button
            onClick={onBack}
            className="inline-flex items-center justify-center space-x-2 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-full hover:border-gray-400 hover:bg-gray-50 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Go Back</span>
          </button>

          <motion.button
            onClick={onTryAgain}
            className="inline-flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-rose-400 to-amber-400 text-white rounded-full font-medium shadow-md hover:shadow-lg transition-all"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            <Search className="w-5 h-5" />
            <span>Try Different Photo</span>
          </motion.button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-12 p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-gray-100"
        >
          <p className="text-sm text-gray-600">
            <span className="font-medium">Tip:</span> Make sure to use a clear,
            well-lit photo where your face is clearly visible.
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
