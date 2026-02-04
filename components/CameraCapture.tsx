"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Rotate3D, Camera, RotateCcw, Check, X } from "lucide-react";

interface CameraCaptureProps {
  onCapture: (imageData: string) => void;
  onCancel: () => void;
}

type CameraFacing = "user" | "environment";

export default function CameraCapture({
  onCapture,
  onCancel,
}: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [facing, setFacing] = useState<CameraFacing>("user");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFlash, setShowFlash] = useState(false);

  useEffect(() => {
    let mounted = true;

    const initCamera = async () => {
      try {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: facing,
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        if (mounted && videoRef.current) {
          videoRef.current.srcObject = stream;
          streamRef.current = stream;
          setIsLoading(false);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          const errorMessage =
            err instanceof Error ? err.message : "Unable to access camera";
          setError(errorMessage);
          setIsLoading(false);
        }
      }
    };

    initCamera();

    return () => {
      mounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [facing]);

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    if (facing === "user") {
      ctx.scale(-1, 1);
      ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
    } else {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    }

    const imageData = canvas.toDataURL("image/jpeg", 0.95);
    setCapturedImage(imageData);

    setShowFlash(true);
    setTimeout(() => setShowFlash(false), 200);

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setError(null);
  };

  const handleFlipCamera = () => {
    setFacing((prev) => (prev === "user" ? "environment" : "user"));
  };

  const handleConfirm = () => {
    if (capturedImage) {
      onCapture(capturedImage);
    }
  };

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-gradient-to-br from-rose-50 via-white to-amber-50 flex items-center justify-center p-4 z-50"
      >
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <X className="w-8 h-8 text-red-500" />
          </div>

          <h2 className="text-2xl font-light text-gray-900 mb-3">
            Camera Access Denied
          </h2>
          <p className="text-gray-600 mb-8 leading-relaxed">
            {error ||
              "Please allow camera access in your browser settings to use the camera."}
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onCancel}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-full hover:border-gray-400 hover:bg-gray-50 transition-all"
            >
              Back
            </button>
            <button
              onClick={() => {
                setError(null);
                handleRetake();
              }}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-rose-400 to-amber-400 text-white rounded-full font-medium hover:shadow-lg transition-all"
            >
              Try Again
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 bg-black z-50 flex items-center justify-center"
    >
      <div className="relative w-full h-full flex flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          {!capturedImage ? (
            <motion.div
              key="camera"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative w-full h-full flex items-center justify-center"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 pointer-events-none" />

              <div className="relative w-full max-w-md aspect-square flex items-center justify-center">
                {isLoading && (
                  <motion.div
                    className="absolute inset-0 bg-black rounded-3xl flex items-center justify-center"
                    animate={{ opacity: [0.5, 0.8, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <div className="text-center">
                      <motion.div
                        className="inline-block mb-4"
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                      >
                        <Camera className="w-8 h-8 text-white" />
                      </motion.div>
                      <p className="text-white text-sm">
                        Initializing camera...
                      </p>
                    </div>
                  </motion.div>
                )}

                <motion.div
                  className="relative w-full aspect-square overflow-hidden rounded-3xl shadow-2xl"
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.4 }}
                >
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                    style={{ transform: facing === "user" ? "scaleX(-1)" : "none" }}
                  />

                  <div className="absolute inset-0 pointer-events-none">
                    <svg
                      className="w-full h-full"
                      viewBox="0 0 200 200"
                      preserveAspectRatio="none"
                    >
                      <defs>
                        <linearGradient
                          id="frameGradient"
                          x1="0%"
                          y1="0%"
                          x2="100%"
                          y2="100%"
                        >
                          <stop
                            offset="0%"
                            stopColor="rgba(251, 113, 133, 0.3)"
                          />
                          <stop
                            offset="100%"
                            stopColor="rgba(251, 146, 60, 0.3)"
                          />
                        </linearGradient>
                      </defs>
                      <rect
                        x="20"
                        y="20"
                        width="160"
                        height="160"
                        fill="none"
                        stroke="url(#frameGradient)"
                        strokeWidth="2"
                        rx="20"
                      />
                      <circle
                        cx="100"
                        cy="100"
                        r="85"
                        fill="none"
                        stroke="rgba(251, 113, 133, 0.1)"
                        strokeWidth="1"
                      />
                    </svg>
                  </div>
                </motion.div>

                <AnimatePresence>
                  {showFlash && (
                    <motion.div
                      className="absolute inset-0 bg-white rounded-3xl"
                      initial={{ opacity: 1 }}
                      animate={{ opacity: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    />
                  )}
                </AnimatePresence>
              </div>

              <motion.button
                onClick={onCancel}
                className="absolute top-6 left-6 p-2 bg-white/10 backdrop-blur-sm rounded-full hover:bg-white/20 transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X className="w-6 h-6 text-white" />
              </motion.button>

              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/60 to-transparent p-8">
                <div className="flex justify-center items-center gap-6">
                  <motion.button
                    onClick={handleFlipCamera}
                    disabled={isLoading}
                    className="p-3 bg-white/10 backdrop-blur-sm rounded-full hover:bg-white/20 transition-colors disabled:opacity-50"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Rotate3D className="w-6 h-6 text-white" />
                  </motion.button>

                  <motion.button
                    onClick={handleCapture}
                    disabled={isLoading}
                    className="relative w-16 h-16 bg-gradient-to-r from-rose-400 to-amber-400 rounded-full shadow-2xl hover:shadow-rose-500/50 disabled:opacity-50"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <motion.div
                      className="absolute inset-0 bg-white/20 rounded-full"
                      animate={{
                        scale: [0.8, 1.2],
                        opacity: [0.8, 0],
                      }}
                      transition={{
                        duration: 0.6,
                        repeat: Infinity,
                      }}
                    />
                    <Camera className="w-8 h-8 text-white mx-auto" />
                  </motion.button>

                  <div className="w-12 h-12" />
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="preview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative w-full h-full flex flex-col items-center justify-center p-4"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 pointer-events-none" />

              <div className="relative z-10 w-full max-w-md">
                <motion.img
                  src={capturedImage}
                  alt="Captured"
                  className="w-full aspect-square object-cover rounded-3xl shadow-2xl"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.4 }}
                />
              </div>

              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/60 to-transparent p-8">
                <div className="flex justify-center items-center gap-6 max-w-md mx-auto">
                  <motion.button
                    onClick={handleRetake}
                    className="flex-1 px-6 py-3 bg-white/10 backdrop-blur-sm text-white rounded-full hover:bg-white/20 transition-colors flex items-center justify-center gap-2"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <RotateCcw className="w-5 h-5" />
                    <span>Retake</span>
                  </motion.button>

                  <motion.button
                    onClick={handleConfirm}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-rose-400 to-amber-400 text-white rounded-full font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Check className="w-5 h-5" />
                    <span>Continue</span>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </motion.div>
  );
}
