"use client";

import { motion } from "framer-motion";
import { Camera, Lock, ArrowRight, X } from "lucide-react";

interface CameraPermissionPromptProps {
  onAllow: () => void;
  onDeny: () => void;
}

export default function CameraPermissionPrompt({
  onAllow,
  onDeny,
}: CameraPermissionPromptProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ duration: 0.4 }}
        className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
      >
        <motion.div
          className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-rose-100 to-amber-100 rounded-full mb-6"
          animate={{
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
          }}
        >
          <Camera className="w-8 h-8 text-rose-500" />
        </motion.div>

        <h2 className="text-2xl font-light text-gray-900 mb-3">
          Camera Permission
        </h2>

        <p className="text-gray-600 mb-6 leading-relaxed">
          {"We'd like to access your camera to capture your photo for matching with wedding moments."}
        </p>

        <div className="space-y-3 mb-8 bg-gray-50 rounded-2xl p-4">
          {permissions.map((item, index) => (
            <motion.div
              key={index}
              className="flex items-start gap-3"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Lock className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
              <span className="text-sm text-gray-600">{item}</span>
            </motion.div>
          ))}
        </div>

        <div className="flex gap-3">
          <motion.button
            onClick={onDeny}
            className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-full hover:border-gray-400 hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <X className="w-5 h-5" />
            <span>Cancel</span>
          </motion.button>

          <motion.button
            onClick={onAllow}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-rose-400 to-amber-400 text-white rounded-full font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <span>Allow</span>
            <ArrowRight className="w-5 h-5" />
          </motion.button>
        </div>

        <p className="text-xs text-gray-500 mt-6 text-center">
          You can change camera permissions anytime in your browser settings
        </p>
      </motion.div>
    </motion.div>
  );
}

const permissions = [
  "Your camera is used only to capture your photo",
  "No recording or storage of camera feeds",
  "Photo is processed for face matching only",
  "You remain fully in control of permissions",
];
