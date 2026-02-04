"use client";

import React from "react"

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  Shield,
  ArrowLeft,
  CheckCircle,
  Video,
  AlertCircle,
} from "lucide-react";
import CameraCapture from "./CameraCapture";
import CameraPermissionPrompt from "./CameraPermissionPrompt";
import { useAuth } from "@/components/contexts/AuthContext";
import { uploadService } from "@/lib/uploadService";

interface UploadPageProps {
  onUpload: () => void;
  onBack: () => void;
}

// Upload configuration
const uploadConfig = {
  uploadOptions: "both" as "upload-only" | "selfie-only" | "both",
  maxFileSizeMB: 10,
  supportedFormats: ["JPG", "PNG", "WEBP"],
};

export default function UploadPage({ onUpload, onBack }: UploadPageProps) {
  const { tokens } = useAuth();
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [cameraMode, setCameraMode] = useState(false);
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { uploadOptions, maxFileSizeMB, supportedFormats } = uploadConfig;

  const showFileUpload =
    uploadOptions === "both" || uploadOptions === "upload-only";
  const showSelfieOption =
    uploadOptions === "both" || uploadOptions === "selfie-only";

  const hasSingleOption = !(showFileUpload && showSelfieOption);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      handleFile(file);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleFile = async (file: File) => {
    const validation = uploadService.validateFile(file, maxFileSizeMB);
    if (!validation.isValid) {
      setError(validation.error || "Invalid file");
      return;
    }

    setUploadedFile(file);

    try {
      const dataUrl = await uploadService.fileToDataUrl(file);
      setPreviewUrl(dataUrl);
      setError(null);
    } catch (err) {
      setError("Failed to preview image");
    }
  };

  const handleSubmit = async () => {
    if (!tokens?.access) {
      setError("Please login first");
      return;
    }

    if (!uploadedFile && !previewUrl) {
      setError("Please select or take a photo first");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      let fileToUpload: File;

      if (uploadedFile) {
        fileToUpload = uploadedFile;
      } else if (previewUrl) {
        fileToUpload = await uploadService.dataUrlToFile(
          previewUrl,
          "selfie.jpg"
        );
      } else {
        throw new Error("No file to upload");
      }

      const response = await uploadService.uploadSelfie(fileToUpload);
      console.log("Profile uploaded successfully:", response.data);
      onUpload();
    } catch (err: any) {
      console.error("Upload error:", err);
      setError(err.message || "Failed to upload photo. Please try again.");
      setIsUploading(false);
    }
  };

  const handleCameraClick = () => {
    setShowPermissionPrompt(true);
  };

  const handlePermissionAllow = () => {
    setShowPermissionPrompt(false);
    setCameraMode(true);
  };

  const handlePermissionDeny = () => {
    setShowPermissionPrompt(false);
  };

  const handleCameraCapture = (imageData: string) => {
    setPreviewUrl(imageData);
    setUploadedFile(null);
    setCameraMode(false);
    setError(null);
  };

  const handleCameraCancel = () => {
    setCameraMode(false);
  };

  const handleChangePhoto = () => {
    setPreviewUrl(null);
    setUploadedFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50">
      <AnimatePresence>
        {showPermissionPrompt && (
          <CameraPermissionPrompt
            onAllow={handlePermissionAllow}
            onDeny={handlePermissionDeny}
          />
        )}
        {cameraMode && (
          <CameraCapture
            onCapture={handleCameraCapture}
            onCancel={handleCameraCancel}
          />
        )}
      </AnimatePresence>

      <motion.div
        className="container mx-auto px-4 py-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <button
          onClick={onBack}
          className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-50"
          disabled={isUploading}
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>

        <div className="max-w-2xl mx-auto mt-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl md:text-4xl font-light text-gray-900 mb-3">
              {showSelfieOption && !showFileUpload
                ? "Take a Selfie"
                : "Upload Your Photo"}
            </h1>
            <p className="text-gray-600 text-lg">
              {showSelfieOption && !showFileUpload
                ? "Take a clear selfie to find your wedding moments"
                : "Upload a clear photo of yourself to find your wedding moments"}
            </p>
          </motion.div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-2"
            >
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <div
              onDragOver={showFileUpload ? handleDragOver : () => {}}
              onDragLeave={showFileUpload ? handleDragLeave : () => {}}
              onDrop={showFileUpload ? handleDrop : () => {}}
              className={`bg-white rounded-3xl shadow-lg border-2 border-dashed transition-all duration-300 overflow-hidden ${
                isDragging
                  ? "border-rose-400 bg-rose-50 scale-[1.02]"
                  : previewUrl
                    ? "border-green-300"
                    : "border-gray-200"
              } ${!showFileUpload ? "cursor-default" : ""}`}
            >
              <AnimatePresence mode="wait">
                {previewUrl ? (
                  <motion.div
                    key="preview"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="p-8"
                  >
                    <div className="relative">
                      <img
                        src={previewUrl || "/placeholder.svg"}
                        alt="Preview"
                        className="w-full max-h-96 object-contain rounded-2xl"
                      />
                      <div className="absolute top-4 right-4 bg-green-500 text-white p-2 rounded-full shadow-lg">
                        <CheckCircle className="w-6 h-6" />
                      </div>
                    </div>

                    <div className="mt-6 space-y-3">
                      {uploadedFile && (
                        <p className="text-center text-gray-700 font-medium">
                          {uploadedFile.name}
                        </p>
                      )}
                      <div className="flex justify-center space-x-3">
                        {showFileUpload && (
                          <button
                            onClick={handleChangePhoto}
                            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-full hover:bg-gray-50 transition-colors disabled:opacity-50"
                            disabled={isUploading}
                          >
                            Change Photo
                          </button>
                        )}
                        {showSelfieOption && (
                          <button
                            onClick={handleCameraClick}
                            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-full hover:bg-gray-50 transition-colors disabled:opacity-50"
                            disabled={isUploading}
                          >
                            Take New Selfie
                          </button>
                        )}
                        <motion.button
                          onClick={handleSubmit}
                          disabled={isUploading || !tokens?.access}
                          className="px-8 py-2 bg-gradient-to-r from-rose-400 to-amber-400 text-white rounded-full font-medium shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          {isUploading ? (
                            <>
                              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                              Processing...
                            </>
                          ) : (
                            "Find My Photos"
                          )}
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="upload"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="p-12 text-center"
                  >
                    <div className="mb-6">
                      <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-rose-100 to-amber-100 rounded-full mb-4">
                        {showFileUpload && showSelfieOption ? (
                          <Upload className="w-10 h-10 text-rose-400" />
                        ) : (
                          <Video className="w-10 h-10 text-rose-400" />
                        )}
                      </div>
                      <h3 className="text-xl font-medium text-gray-900 mb-2">
                        {hasSingleOption
                          ? showSelfieOption
                            ? "Take a Selfie"
                            : "Upload Your Photo"
                          : "Drag & drop your photo here"}
                      </h3>
                      <p className="text-gray-500 mb-6">
                        {hasSingleOption
                          ? showSelfieOption
                            ? "Click below to take a selfie"
                            : "Click below to choose a photo"
                          : "or choose an option below"}
                      </p>

                      <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        {showFileUpload && (
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            className="inline-flex items-center justify-center space-x-2 px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-full hover:border-rose-300 hover:text-rose-600 transition-all disabled:opacity-50"
                            disabled={isUploading}
                          >
                            <Upload className="w-5 h-5" />
                            <span>Browse Files</span>
                          </button>
                        )}

                        {showSelfieOption && (
                          <button
                            onClick={handleCameraClick}
                            className="inline-flex items-center justify-center space-x-2 px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-full hover:border-rose-300 hover:text-rose-600 transition-all disabled:opacity-50"
                            disabled={isUploading}
                          >
                            <Video className="w-5 h-5" />
                            <span>Take a Selfie</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {showFileUpload && (
                      <p className="text-sm text-gray-400 mt-6">
                        Supports: {supportedFormats.join(", ")} (Max{" "}
                        {maxFileSizeMB}MB)
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {showFileUpload && (
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileInput}
                className="hidden"
                disabled={isUploading}
              />
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-8 bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-100"
          >
            <div className="flex items-start space-x-3">
              <Shield className="w-5 h-5 text-rose-400 mt-1 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-gray-900 mb-1">
                  Privacy & Security
                </h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Your photo is processed securely and used only for facial
                  recognition matching. We never store or share your images
                  without permission.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
