"use client";

import { motion } from "framer-motion";
import { Camera, Heart, Sparkles } from "lucide-react";
import AuthModal from "./AuthModal";
import { useState } from "react";

interface LandingPageProps {
  onGetStarted: () => void;
}

export default function LandingPage({ onGetStarted }: LandingPageProps) {
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmYWY1ZjAiIGZpbGwtb3BhY2l0eT0iMC40Ij48cGF0aCBkPSJNMzYgMzRjMC0yLjIxIDEuNzktNCA0LTRzNCAxLjc5IDQgNC0xLjc5IDQtNCA0LTQtMS43OS00LTR6bTAgMTBjMC0yLjIxIDEuNzktNCA0LTRzNCAxLjc5IDQgNC0xLjc5IDQtNCA0LTQtMS43OS00LTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-40" />

      <div className="relative z-10">
        <motion.nav
          className="container mx-auto px-4 py-6 flex justify-between items-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center space-x-2">
            <Heart className="w-8 h-8 text-rose-400" fill="currentColor" />
            <span className="text-2xl font-light text-gray-800">Moments</span>
          </div>
        </motion.nav>

        <div className="container mx-auto px-4 py-12 md:py-20">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="mb-6"
            >
              <div className="inline-flex items-center space-x-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm border border-rose-100 mb-8">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span className="text-sm text-gray-600">
                  AI-Powered Face Recognition
                </span>
              </div>
            </motion.div>

            <motion.h1
              className="text-4xl md:text-6xl lg:text-7xl font-light text-gray-900 mb-6 leading-tight"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              Find Your{" "}
              <span className="bg-gradient-to-r from-rose-400 to-amber-400 bg-clip-text text-transparent font-normal">
                Wedding Moments
              </span>{" "}
              Instantly
            </motion.h1>

            <motion.p
              className="text-lg md:text-xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              Upload your selfie and instantly discover all the beautiful
              moments captured of you at the wedding. Powered by advanced facial
              recognition technology.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              <motion.button
                onClick={() => setIsAuthOpen(true)}
                className="inline-flex items-center space-x-3 bg-gradient-to-r from-rose-400 to-amber-400 text-white px-8 py-4 rounded-full text-lg font-medium shadow-lg"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
              >
                <Camera className="w-6 h-6" />
                <span>Find Photos</span>
              </motion.button>
            </motion.div>

            <motion.div
              className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  className="bg-white/60 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-gray-100"
                  whileHover={{
                    y: -5,
                    boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
                  }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-rose-100 to-amber-100 rounded-xl flex items-center justify-center mb-4 mx-auto">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onVerified={onGetStarted}
      />
    </div>
  );
}

const features = [
  {
    icon: <Camera className="w-6 h-6 text-rose-400" />,
    title: "Quick Upload",
    description:
      "Simply upload a selfie or photo of yourself to get started.",
  },
  {
    icon: <Sparkles className="w-6 h-6 text-amber-500" />,
    title: "AI Matching",
    description: "Advanced facial recognition finds all your photos instantly.",
  },
  {
    icon: <Heart className="w-6 h-6 text-rose-400" fill="currentColor" />,
    title: "Private & Secure",
    description: "Your photos are processed securely and never stored.",
  },
];
