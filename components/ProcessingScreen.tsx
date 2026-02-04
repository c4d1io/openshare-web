"use client";

import { motion } from "framer-motion";
import { Sparkles, CheckCircle } from "lucide-react";
import { useState, useEffect } from "react";

interface ProcessingScreenProps {
  isProcessing?: boolean;
  onComplete?: () => void;
  processingSteps?: Array<{
    title: string;
    description: string;
    completed: boolean;
  }>;
}

export default function ProcessingScreen({
  isProcessing = true,
  onComplete,
  processingSteps = [
    {
      title: "Uploading Photo",
      description: "Sending your photo to our servers",
      completed: false,
    },
    {
      title: "Face Detection",
      description: "Analyzing facial features",
      completed: false,
    },
    {
      title: "Album Search",
      description: "Matching with wedding photos",
      completed: false,
    },
    {
      title: "Compiling Results",
      description: "Preparing your moments",
      completed: false,
    },
  ],
}: ProcessingScreenProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState(processingSteps);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (!isProcessing || isComplete) return;

    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => {
        const nextStep = prev + 1;

        if (prev < steps.length) {
          const updatedSteps = [...steps];
          updatedSteps[prev] = { ...updatedSteps[prev], completed: true };
          setSteps(updatedSteps);
        }

        if (nextStep >= steps.length) {
          setIsComplete(true);
          if (onComplete) {
            setTimeout(() => onComplete(), 1000);
          }
          clearInterval(stepInterval);
        }

        return nextStep;
      });
    }, 1500);

    return () => clearInterval(stepInterval);
  }, [isProcessing, isComplete, steps.length, onComplete, steps]);

  if (!isProcessing && !isComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center px-4"
        >
          <motion.div
            className="relative inline-block mb-8"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
          >
            <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h2 className="text-2xl md:text-3xl font-light text-gray-900 mb-4">
              Processing Complete!
            </h2>
            <p className="text-gray-600 text-lg">
              Your moments are ready to view
            </p>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center px-4 max-w-lg"
      >
        <motion.div
          className="relative inline-block mb-8"
          animate={{ rotate: isComplete ? 0 : 360 }}
          transition={{
            duration: isComplete ? 0 : 3,
            repeat: isComplete ? 0 : Infinity,
            ease: "linear",
          }}
        >
          <div className="w-24 h-24 rounded-full bg-gradient-to-r from-rose-400 to-amber-400 opacity-20" />
          <motion.div
            className="absolute inset-0 rounded-full border-4 border-transparent border-t-rose-400 border-r-amber-400"
            animate={{ rotate: isComplete ? 0 : 360 }}
            transition={{
              duration: isComplete ? 0 : 1.5,
              repeat: isComplete ? 0 : Infinity,
              ease: "linear",
            }}
          />

          {isComplete && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
            >
              <CheckCircle className="w-12 h-12 text-green-500" />
            </motion.div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Sparkles className="w-6 h-6 text-amber-500 animate-pulse" />
            <h2 className="text-2xl md:text-3xl font-light text-gray-900">
              {isComplete ? "Ready!" : "Finding your moments"}
            </h2>
            <Sparkles className="w-6 h-6 text-rose-400 animate-pulse" />
          </div>

          <motion.p
            className="text-gray-600 text-lg mb-8"
            animate={{ opacity: isComplete ? 1 : [0.5, 1, 0.5] }}
            transition={
              isComplete
                ? { duration: 0.5 }
                : { duration: 2, repeat: Infinity, ease: "easeInOut" }
            }
          >
            {isComplete
              ? "All set! Here are your wedding moments"
              : "Analyzing photos with AI..."}
          </motion.p>

          <div className="mt-8 space-y-4">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                className="flex items-start space-x-3 p-3 rounded-xl"
                initial={{ opacity: 0, x: -20 }}
                animate={{
                  opacity: 1,
                  x: 0,
                  backgroundColor: step.completed
                    ? "rgba(34, 197, 94, 0.1)"
                    : "rgba(255, 255, 255, 0.6)",
                  borderColor: step.completed
                    ? "rgb(34, 197, 94)"
                    : "rgb(229, 231, 235)",
                }}
                transition={{ delay: index * 0.1 }}
                style={{
                  backdropFilter: "blur(10px)",
                  borderWidth: "1px",
                  borderStyle: "solid",
                }}
              >
                <motion.div
                  className="flex-shrink-0"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.1 + 0.2 }}
                >
                  {step.completed ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <motion.div
                      className="w-5 h-5 rounded-full border-2 border-gray-300"
                      animate={
                        index === currentStep
                          ? {
                              scale: [1, 1.2, 1],
                              borderColor: [
                                "rgb(229, 231, 235)",
                                "rgb(244, 63, 94)",
                                "rgb(229, 231, 235)",
                              ],
                            }
                          : {}
                      }
                      transition={
                        index === currentStep
                          ? {
                              duration: 1.5,
                              repeat: Infinity,
                            }
                          : {}
                      }
                    />
                  )}
                </motion.div>
                <div className="text-left flex-1">
                  <h3
                    className={`font-medium ${step.completed ? "text-green-700" : "text-gray-900"}`}
                  >
                    {step.title}
                  </h3>
                  <p
                    className={`text-sm ${step.completed ? "text-green-600" : "text-gray-600"}`}
                  >
                    {step.description}
                  </p>
                </div>
                {index === currentStep && !step.completed && (
                  <motion.div
                    className="w-2 h-2 bg-rose-400 rounded-full"
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.3, 1, 0.3],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                    }}
                  />
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {!isComplete && (
          <motion.div
            className="mt-12 flex justify-center space-x-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-3 h-3 bg-gradient-to-r from-rose-400 to-amber-400 rounded-full"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.3, 1, 0.3],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
              />
            ))}
          </motion.div>
        )}

        {!isComplete && (
          <motion.div
            className="mt-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <motion.div
                className="bg-gradient-to-r from-rose-400 to-amber-400 h-2 rounded-full"
                initial={{ width: "0%" }}
                animate={{
                  width: `${(currentStep / steps.length) * 100}%`,
                }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <p className="text-sm text-gray-600">
              {Math.round((currentStep / steps.length) * 100)}% complete
            </p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
