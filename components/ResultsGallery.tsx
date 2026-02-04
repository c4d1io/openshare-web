"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Download,
  X,
  ArrowLeft,
  Heart,
  AlertCircle,
  Calendar,
  Users,
  RefreshCw,
} from "lucide-react";
import { photoService, MatchedPhoto } from "@/lib/photoService";

interface Photo {
  id: string;
  url: string;
  thumbnailUrl: string;
  title: string;
  description: string;
  date: string;
  faces?: number;
  metadata?: {
    moment_uuid: string;
    event_uuid: string;
    flag: string;
    is_active: boolean;
    faces_metadata?: Array<{
      bbox: [number, number, number, number];
      face_uuid: string;
      image_url: string;
      embedding_url: string;
    }>;
  };
}

interface ResultsGalleryProps {
  onBack: () => void;
  onTryAgain: () => void;
}

export default function ResultsGallery({
  onBack,
  onTryAgain,
}: ResultsGalleryProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<{
    totalPhotos: number;
    totalFaces: number;
    dateRange: string | null;
  }>({
    totalPhotos: 0,
    totalFaces: 0,
    dateRange: null,
  });

  useEffect(() => {
    fetchMatchedPhotos();
  }, []);

  const fetchMatchedPhotos = async () => {
    setIsLoading(true);
    setError(null);
    setPhotos([]);

    try {
      const response = await photoService.getMatchedPhotos();

      if (
        response.results?.success &&
        response.results.data &&
        response.results.data.length > 0
      ) {
        const appPhotos = response.results.data.map(
          (matchedPhoto: MatchedPhoto, index: number) =>
            photoService.convertToAppPhoto(matchedPhoto, index)
        );

        setPhotos(appPhotos);

        const photoStats = photoService.getPhotoStats(response.results.data);
        setStats({
          totalPhotos: photoStats.totalPhotos,
          totalFaces: photoStats.totalFaces,
          dateRange: photoStats.dateRange,
        });
      } else {
        setError(
          response.results?.message ||
            "No matching photos found. Try uploading a different photo."
        );
        setPhotos([]);
      }
    } catch (err: any) {
      setError(err.message || "Failed to find matching photos. Please try again.");
      setPhotos([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (url: string, id: string) => {
    try {
      await photoService.downloadPhoto(url, `wedding-moment-${id}.jpg`);
    } catch (err: any) {
      console.error("Download error:", err);
      alert("Failed to download photo. Please try again.");
    }
  };

  const handleRetry = () => {
    fetchMatchedPhotos();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 border-4 border-rose-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-medium text-gray-900 mb-2">
            Finding Your Moments...
          </h2>
          <p className="text-gray-600">Searching through wedding photos</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50">
      <motion.div
        className="container mx-auto px-4 py-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={onBack}
            className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>

          <div className="flex items-center space-x-2">
            <Heart className="w-6 h-6 text-rose-400" fill="currentColor" />
            <span className="text-gray-600">Moments</span>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-light text-gray-900 mb-6">
            Your Wedding Moments
          </h1>

          {error ? (
            <div className="mb-8">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <p className="text-red-600 mb-4">{error}</p>
              <div className="flex justify-center space-x-3">
                <button
                  onClick={handleRetry}
                  className="inline-flex items-center px-6 py-2 bg-gradient-to-r from-rose-400 to-amber-400 text-white rounded-full font-medium hover:shadow-lg transition-shadow"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </button>
                <button
                  onClick={onTryAgain}
                  className="px-6 py-2 border border-rose-400 text-rose-600 rounded-full font-medium hover:bg-rose-50"
                >
                  Upload Different Photo
                </button>
              </div>
            </div>
          ) : stats.totalPhotos > 0 ? (
            <div className="mb-8">
              <div className="flex flex-wrap justify-center items-center gap-6 mb-4">
                <div className="text-center bg-white/80 backdrop-blur-sm rounded-2xl p-4 min-w-[120px]">
                  <div className="flex items-center justify-center space-x-2 mb-1">
                    <Heart
                      className="w-5 h-5 text-rose-400"
                      fill="currentColor"
                    />
                    <span className="text-2xl font-bold text-rose-500">
                      {stats.totalPhotos}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">Moments</p>
                </div>

                <div className="text-center bg-white/80 backdrop-blur-sm rounded-2xl p-4 min-w-[120px]">
                  <div className="flex items-center justify-center space-x-2 mb-1">
                    <Users className="w-5 h-5 text-amber-500" />
                    <span className="text-2xl font-bold text-amber-500">
                      {stats.totalFaces}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">Faces</p>
                </div>

                {stats.dateRange && (
                  <div className="text-center bg-white/80 backdrop-blur-sm rounded-2xl p-4 min-w-[120px]">
                    <div className="flex items-center justify-center space-x-2 mb-1">
                      <Calendar className="w-5 h-5 text-emerald-500" />
                      <span className="text-lg font-medium text-emerald-600">
                        Date Range
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{stats.dateRange}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="mb-8">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-amber-500" />
              </div>
              <p className="text-amber-600 mb-4">
                No photos found yet. The system might still be processing.
              </p>
              <div className="flex justify-center space-x-3">
                <button
                  onClick={handleRetry}
                  className="inline-flex items-center px-6 py-2 bg-gradient-to-r from-rose-400 to-amber-400 text-white rounded-full font-medium hover:shadow-lg transition-shadow"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </button>
                <button
                  onClick={onTryAgain}
                  className="px-6 py-2 border border-rose-400 text-rose-600 rounded-full font-medium hover:bg-rose-50"
                >
                  Upload Different Photo
                </button>
              </div>
            </div>
          )}
        </motion.div>

        {photos.length > 0 ? (
          <>
            <div className="columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4">
              {photos.map((photo, index) => (
                <motion.div
                  key={photo.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="break-inside-avoid"
                >
                  <motion.div
                    className="relative group cursor-pointer bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300"
                    whileHover={{ y: -8 }}
                    transition={{ duration: 0.3 }}
                    onClick={() => setSelectedPhoto(photo)}
                  >
                    <img
                      src={photo.thumbnailUrl || "/placeholder.svg"}
                      alt={`Wedding photo ${photo.title}`}
                      className="w-full h-auto"
                      loading="lazy"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
                        <div className="text-left">
                          <span className="text-white text-sm font-medium block">
                            View Full Size
                          </span>
                          {photo.faces && (
                            <span className="text-white/80 text-xs flex items-center">
                              <Users className="w-3 h-3 mr-1" />
                              {photo.faces} face(s)
                            </span>
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(photo.url, photo.id);
                          }}
                          className="p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors"
                        >
                          <Download className="w-5 h-5 text-white" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-12 text-center space-y-4"
            >
              <div className="flex justify-center space-x-3">
                <button
                  onClick={handleRetry}
                  className="inline-flex items-center px-6 py-3 border-2 border-rose-400 text-rose-600 rounded-full font-medium hover:bg-rose-50 transition-colors"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh Results
                </button>
                <button
                  onClick={onTryAgain}
                  className="px-8 py-3 bg-gradient-to-r from-rose-400 to-amber-400 text-white rounded-full font-medium hover:shadow-lg transition-shadow"
                >
                  Upload Different Photo
                </button>
              </div>
              <p className="text-gray-500 text-sm">
                Showing {photos.length} of {stats.totalPhotos} moments
              </p>
            </motion.div>
          </>
        ) : (
          !error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12"
            >
              <div className="w-24 h-24 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-12 h-12 text-rose-400" />
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                No Photos Found
              </h3>
              <p className="text-gray-600 mb-6">
                {"We couldn't find any matching photos. Try uploading a different photo."}
              </p>
              <div className="flex justify-center space-x-3">
                <button
                  onClick={handleRetry}
                  className="inline-flex items-center px-6 py-2 border border-rose-400 text-rose-600 rounded-full font-medium hover:bg-rose-50"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </button>
                <button
                  onClick={onTryAgain}
                  className="px-6 py-2 bg-gradient-to-r from-rose-400 to-amber-400 text-white rounded-full font-medium hover:shadow-lg transition-shadow"
                >
                  Upload Different Photo
                </button>
              </div>
            </motion.div>
          )
        )}
      </motion.div>

      <AnimatePresence>
        {selectedPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedPhoto(null)}
          >
            <div className="absolute top-4 right-4 flex space-x-2">
              <motion.button
                className="p-2 bg-white/10 backdrop-blur-sm rounded-full hover:bg-white/20 transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setSelectedPhoto(null)}
              >
                <X className="w-6 h-6 text-white" />
              </motion.button>

              <motion.button
                className="p-2 bg-white/10 backdrop-blur-sm rounded-full hover:bg-white/20 transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload(selectedPhoto.url, selectedPhoto.id);
                }}
              >
                <Download className="w-6 h-6 text-white" />
              </motion.button>
            </div>

            <div className="max-w-4xl w-full">
              <motion.img
                src={selectedPhoto.url || "/placeholder.svg"}
                alt="Full size"
                className="w-full max-h-[80vh] object-contain rounded-lg mb-4"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ duration: 0.3 }}
                onClick={(e) => e.stopPropagation()}
              />

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/10 backdrop-blur-sm rounded-lg p-4"
              >
                <h3 className="text-white font-medium mb-2">
                  {selectedPhoto.title}
                </h3>
                <p className="text-white/80 text-sm mb-2">
                  {selectedPhoto.description}
                </p>

                <div className="mt-3 pt-3 border-t border-white/20">
                  <div className="flex items-center space-x-4">
                    {selectedPhoto.faces && (
                      <div className="flex items-center space-x-1">
                        <Users className="w-4 h-4 text-white/70" />
                        <span className="text-white/70 text-xs">
                          {selectedPhoto.faces} faces
                        </span>
                      </div>
                    )}
                    {selectedPhoto.date && (
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4 text-white/70" />
                        <span className="text-white/70 text-xs">
                          {new Date(selectedPhoto.date).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {selectedPhoto.metadata?.flag && (
                      <div className="flex items-center space-x-1">
                        <span className="text-xs px-2 py-1 rounded-full bg-white/20 text-white/70">
                          {selectedPhoto.metadata.flag}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
