"use client";

import React from "react";

import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Images,
  Upload,
  QrCode,
  Link2,
  Download,
  Play,
  Loader2,
  X,
  Copy,
  Check,
  RefreshCw,
  Video,
  ImageIcon,
  FileImage,
  FileVideo,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Clock,
  Shield,
  ShieldOff,
  Plus,
  ExternalLink,
  Trash2,
} from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/components/contexts/AuthContext";
import { eventService } from "@/lib/services/eventService";
import {
  getCertificateList,
  imageUrlToBase64,
  injectQRCodeIntoSVG,
  fetchCertificateSVG,
  extractTemplateVariables,
  replaceTemplateVariables,
  type CertificateTemplate,
  type TemplateVariable,
} from "@/lib/services/certificateService";
import type {
  MediaItem,
  UploadInitFileResponse,
  ApiUrlItem,
} from "@/lib/types/event";

interface EventDetailPageProps {
  eventId: string;
  onBack: () => void;
}

type TabType = "media" | "uploads" | "qrcode" | "webhook";

interface UploadingFile {
  file: File;
  id: string;
  name: string;
  size: number;
  type: string;
  progress: number;
  status: "pending" | "uploading" | "completed" | "error";
  uploadInfo?: UploadInitFileResponse;
  errorMessage?: string;
}

export default function EventDetailPage({
  eventId,
  onBack,
}: EventDetailPageProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("media");

  // Media state
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [isLoadingMedia, setIsLoadingMedia] = useState(true);
  const [mediaOffset, setMediaOffset] = useState(0);
  const [hasMoreMedia, setHasMoreMedia] = useState(true);
  const [isLoadingMoreMedia, setIsLoadingMoreMedia] = useState(false);

  // QR Code state
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [isLoadingQR, setIsLoadingQR] = useState(false);

  // Certificate state
  const certificates = getCertificateList();
  const [selectedCertificate, setSelectedCertificate] =
    useState<CertificateTemplate>(certificates[0]);
  const [certificateSvgContent, setCertificateSvgContent] = useState<
    string | null
  >(null);
  const [isLoadingCertificate, setIsLoadingCertificate] = useState(false);
  const [qrBase64, setQrBase64] = useState<string | null>(null);
  const [rawSvgText, setRawSvgText] = useState<string | null>(null);
  const [templateVariables, setTemplateVariables] = useState<
    TemplateVariable[]
  >([]);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>(
    {},
  );
  const [thumbnailSvgs, setThumbnailSvgs] = useState<Record<string, string>>(
    {},
  );

  // Media viewer state
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // API URL state
  const [apiUrls, setApiUrls] = useState<ApiUrlItem[]>([]);
  const [isLoadingApis, setIsLoadingApis] = useState(false);
  const [isGeneratingApi, setIsGeneratingApi] = useState(false);
  const [revokingApiId, setRevokingApiId] = useState<string | null>(null);
  const [copiedApiId, setCopiedApiId] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  // Upload state
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadProgress, setShowUploadProgress] = useState(false);
  const [isUploadMinimized, setIsUploadMinimized] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const tabs = [
    {
      id: "media" as TabType,
      label: "Media Gallery",
      icon: Images,
      description: "View all photos and videos",
    },
    {
      id: "uploads" as TabType,
      label: "Upload",
      icon: Upload,
      description: "Add new media",
    },
    {
      id: "qrcode" as TabType,
      label: "QR Code",
      icon: QrCode,
      description: "Share event QR",
    },
    {
      id: "webhook" as TabType,
      label: "API",
      icon: Link2,
      description: "Integration URL",
    },
  ];

  // Accepted file types
  const acceptedTypes = {
    image: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
    video: ["video/mp4", "video/webm", "video/quicktime", "video/x-msvideo"],
  };
  const acceptedExtensions = ".jpg,.jpeg,.png,.webp,.mp4,.webm,.mov,.avi";

  // Fetch media items
  const fetchMedia = useCallback(
    async (offset: number = 0, append: boolean = false) => {
      if (offset === 0) {
        setIsLoadingMedia(true);
      } else {
        setIsLoadingMoreMedia(true);
      }

      try {
        const response = await eventService.getEventMedia(eventId, 10, offset);
        const newItems = response.data.results;

        if (append) {
          setMediaItems((prev) => [...prev, ...newItems]);
        } else {
          setMediaItems(newItems);
        }

        setHasMoreMedia(newItems.length === 10);
        setMediaOffset(offset + newItems.length);
      } catch (error) {
        console.error("Failed to fetch media:", error);
      } finally {
        setIsLoadingMedia(false);
        setIsLoadingMoreMedia(false);
      }
    },
    [eventId],
  );

  // Fetch QR code
  const fetchQRCode = useCallback(async () => {
    setIsLoadingQR(true);
    try {
      const response = await eventService.getEventQRCode(eventId);
      setQrCodeUrl(response.qr_code);

      // Convert QR image URL to base64
      try {
        const base64 = await imageUrlToBase64(response.qr_code);
        setQrBase64(base64);
      } catch (b64Error) {
        console.error("Failed to convert QR to base64:", b64Error);
      }
    } catch (error) {
      console.error("Failed to fetch QR code:", error);
    } finally {
      setIsLoadingQR(false);
    }
  }, [eventId]);

  const processCertificate = useCallback(async (cert: CertificateTemplate) => {
    setIsLoadingCertificate(true);
    try {
      const svgText = await fetchCertificateSVG(cert.path);
      setRawSvgText(svgText);

      // Extract template variables and set default form values
      const vars = extractTemplateVariables(svgText);
      setTemplateVariables(vars);

      const defaults: Record<string, string> = {};
      for (const v of vars) {
        defaults[v.key] = v.defaultValue;
      }
      setFormValues(defaults);
      setTouchedFields({});
    } catch (error) {
      console.error("Failed to process certificate:", error);
      setRawSvgText(null);
      setCertificateSvgContent(null);
    } finally {
      setIsLoadingCertificate(false);
    }
  }, []);

  useEffect(() => {
    if (!rawSvgText) return;
    let svg = replaceTemplateVariables(rawSvgText, formValues);
    if (qrBase64) {
      svg = injectQRCodeIntoSVG(svg, qrBase64);
    }
    setCertificateSvgContent(svg);
  }, [rawSvgText, formValues, qrBase64]);

  // Initial data fetch
  useEffect(() => {
    fetchMedia(0);
  }, [fetchMedia]);

  // Fetch QR code when tab is selected
  useEffect(() => {
    if (activeTab === "qrcode" && !qrCodeUrl) {
      fetchQRCode();
    }
  }, [activeTab, qrCodeUrl, fetchQRCode]);

  // Process certificate when selection changes
  useEffect(() => {
    if (selectedCertificate) {
      processCertificate(selectedCertificate);
    }
  }, [selectedCertificate, processCertificate]);

  // Prefetch thumbnail SVGs for selector
  useEffect(() => {
    const loadThumbnails = async () => {
      const svgs: Record<string, string> = {};
      for (const cert of certificates) {
        try {
          const svg = await fetchCertificateSVG(cert.path);
          svgs[cert.id] = svg;
        } catch {
          // Skip failed thumbnails
        }
      }
      setThumbnailSvgs(svgs);
    };
    loadThumbnails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Download certificate as SVG file
  const downloadCertificate = () => {
    if (!certificateSvgContent) return;
    const blob = new Blob([certificateSvgContent], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${selectedCertificate.id}-event-${eventId}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Helper to determine if media is video
  const isVideo = (url: string): boolean => {
    const videoExtensions = [".mp4", ".webm", ".ogg", ".mov", ".avi"];
    return videoExtensions.some((ext) => url.toLowerCase().includes(ext));
  };

  // Handle download
  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Download failed:", error);
      window.open(url, "_blank");
    }
  };

  // Fetch API URLs
  const fetchApiUrls = useCallback(async () => {
    setIsLoadingApis(true);
    setApiError(null);
    try {
      const response = await eventService.getApiUrls();
      setApiUrls(response.Data || []);
    } catch (error) {
      console.error("Failed to fetch API URLs:", error);
      setApiError("Failed to load API URLs. Please try again.");
    } finally {
      setIsLoadingApis(false);
    }
  }, []);

  // Fetch API URLs when tab is selected
  useEffect(() => {
    if (activeTab === "webhook") {
      fetchApiUrls();
    }
  }, [activeTab, fetchApiUrls]);

  // Generate new API URL
  const handleGenerateApiUrl = async () => {
    setIsGeneratingApi(true);
    setApiError(null);
    try {
      const response = await eventService.generateApiUrl({
        action: "GENERATE_API",
      });
      // Add the new API URL to the list
      const newApiItem: ApiUrlItem = {
        Api_id: response.api_id,
        Api_url: response.api_url,
        Status: response.status as "active",
        Expires_at: response.expires_at,
      };
      setApiUrls((prev) => [newApiItem, ...prev]);
    } catch (error) {
      console.error("Failed to generate API URL:", error);
      setApiError("Failed to generate API URL. Please try again.");
    } finally {
      setIsGeneratingApi(false);
    }
  };

  // Revoke API URL
  const handleRevokeApiUrl = async (apiId: string) => {
    setRevokingApiId(apiId);
    setApiError(null);
    try {
      await eventService.revokeApiUrl({
        api_id: apiId,
        status: "revoke",
        revoke_at: new Date().toISOString(),
      });
      // Update the status in the local list
      setApiUrls((prev) =>
        prev.map((item) =>
          item.Api_id === apiId ? { ...item, Status: "revoked" } : item,
        ),
      );
    } catch (error) {
      console.error("Failed to revoke API URL:", error);
      setApiError("Failed to revoke API URL. Please try again.");
    } finally {
      setRevokingApiId(null);
    }
  };

  // Copy API URL
  const copyApiUrl = (apiId: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedApiId(apiId);
    setTimeout(() => setCopiedApiId(null), 2000);
  };

  // Format expiry date
  const formatExpiryDate = (utcDate: string): string => {
    try {
      const date = new Date(utcDate);
      return date.toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return utcDate;
    }
  };

  // Check if expired
  const isExpired = (utcDate: string): boolean => {
    try {
      return new Date(utcDate) < new Date();
    } catch {
      return false;
    }
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const validFiles: UploadingFile[] = [];
    const invalidFiles: string[] = [];

    Array.from(files).forEach((file) => {
      const isValidType = [
        ...acceptedTypes.image,
        ...acceptedTypes.video,
      ].includes(file.type);

      if (isValidType) {
        validFiles.push({
          file,
          id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          size: file.size,
          type: file.type,
          progress: 0,
          status: "pending",
        });
      } else {
        invalidFiles.push(file.name);
      }
    });

    if (invalidFiles.length > 0) {
      setUploadError(`Invalid file types: ${invalidFiles.join(", ")}`);
      setTimeout(() => setUploadError(null), 5000);
    }

    if (validFiles.length > 0) {
      setUploadingFiles((prev) => [...prev, ...validFiles]);
      startUpload([...uploadingFiles, ...validFiles]);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Handle drag and drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;

    const validFiles: UploadingFile[] = [];

    Array.from(files).forEach((file) => {
      const isValidType = [
        ...acceptedTypes.image,
        ...acceptedTypes.video,
      ].includes(file.type);

      if (isValidType) {
        validFiles.push({
          file,
          id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          size: file.size,
          type: file.type,
          progress: 0,
          status: "pending",
        });
      }
    });

    if (validFiles.length > 0) {
      setUploadingFiles((prev) => [...prev, ...validFiles]);
      startUpload([...uploadingFiles, ...validFiles]);
    }
  };

  // Start upload process
  const startUpload = async (files: UploadingFile[]) => {
    if (isUploading || files.length === 0) return;

    const pendingFiles = files.filter((f) => f.status === "pending");
    if (pendingFiles.length === 0) return;

    setIsUploading(true);
    setShowUploadProgress(true);
    setIsUploadMinimized(false);

    try {
      // Step 1: Initialize upload to get pre-signed URLs
      const initPayload = {
        files: pendingFiles.map((f) => ({
          file_name: f.name,
          mime_type: f.type,
          size_bytes: f.size,
        })),
      };

      const initResponse = await eventService.initUpload(initPayload);

      // Update files with upload info
      setUploadingFiles((prev) =>
        prev.map((f) => {
          const uploadInfo = initResponse.files.find(
            (info) => info.file_name === f.name,
          );
          if (uploadInfo && f.status === "pending") {
            return { ...f, uploadInfo, status: "uploading" as const };
          }
          return f;
        }),
      );

      // Step 2: Upload each file to S3
      const uploadPromises = pendingFiles.map(async (uploadFile) => {
        const uploadInfo = initResponse.files.find(
          (info) => info.file_name === uploadFile.name,
        );
        if (!uploadInfo) return;

        try {
          await eventService.uploadToS3(
            uploadInfo.upload_url,
            uploadFile.file,
            uploadInfo.content_type,
            (progress) => {
              setUploadingFiles((prev) =>
                prev.map((f) =>
                  f.id === uploadFile.id ? { ...f, progress } : f,
                ),
              );
            },
          );

          // Mark as completed
          setUploadingFiles((prev) =>
            prev.map((f) =>
              f.id === uploadFile.id
                ? { ...f, status: "completed" as const, progress: 100 }
                : f,
            ),
          );
        } catch (error) {
          setUploadingFiles((prev) =>
            prev.map((f) =>
              f.id === uploadFile.id
                ? {
                    ...f,
                    status: "error" as const,
                    errorMessage: "Upload failed",
                  }
                : f,
            ),
          );
        }
      });

      await Promise.all(uploadPromises);

      // Step 3: Complete upload
      const completedFiles = initResponse.files.map((f) => ({
        file_id: f.file_id,
        s3_key: f.s3_key,
      }));

      await eventService.completeUpload({
        upload_id: initResponse.upload_id,
        files: completedFiles,
      });

      // Refresh media gallery after short delay
      setTimeout(() => {
        fetchMedia(0);
        setActiveTab("media");
      }, 1500);
    } catch (error) {
      console.error("Upload failed:", error);
      setUploadError("Failed to initialize upload. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  // Cancel upload (remove from list)
  const cancelUpload = () => {
    setUploadingFiles([]);
    setShowUploadProgress(false);
    setIsUploading(false);
  };

  // Remove single file
  const removeFile = (fileId: string) => {
    setUploadingFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  // Get upload stats
  const getUploadStats = () => {
    const total = uploadingFiles.length;
    const completed = uploadingFiles.filter(
      (f) => f.status === "completed",
    ).length;
    const uploading = uploadingFiles.filter(
      (f) => f.status === "uploading",
    ).length;
    const pending = uploadingFiles.filter((f) => f.status === "pending").length;
    const errors = uploadingFiles.filter((f) => f.status === "error").length;
    return { total, completed, uploading, pending, errors };
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Get file icon based on type
  const getFileIcon = (type: string) => {
    if (type.startsWith("video/")) {
      return <FileVideo className="w-5 h-5 text-purple-500" />;
    }
    return <FileImage className="w-5 h-5 text-rose-500" />;
  };

  const uploadStats = getUploadStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50">
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <aside className="hidden md:flex md:w-72 lg:w-80 bg-white border-r border-gray-200 flex-col">
          <div className="p-6 border-b border-gray-200">
            <motion.button
              onClick={onBack}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
              whileHover={{ x: -4 }}
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back to Events</span>
            </motion.button>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Event Dashboard
              </h2>
              <p className="text-sm text-gray-500 mt-1">ID: {eventId}</p>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-start space-x-3 px-4 py-3 rounded-xl transition-all ${
                    isActive
                      ? "bg-gradient-to-r from-rose-400 to-amber-400 text-white shadow-lg"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Icon
                    className={`w-5 h-5 mt-0.5 flex-shrink-0 ${isActive ? "text-white" : "text-gray-400"}`}
                  />
                  <div className="text-left flex-1">
                    <div className="font-medium">{tab.label}</div>
                    <div
                      className={`text-xs mt-0.5 ${isActive ? "text-white/80" : "text-gray-400"}`}
                    >
                      {tab.description}
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Mobile Header */}
          <header className="md:hidden sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 py-3">
            <div className="flex items-center justify-between">
              <motion.button
                onClick={onBack}
                className="p-2 hover:bg-gray-100 rounded-full"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </motion.button>
              <div className="flex-1 text-center">
                <h1 className="text-sm font-semibold text-gray-900">
                  Event {eventId}
                </h1>
              </div>
              <div className="w-9" />
            </div>

            <div className="flex space-x-2 mt-3 overflow-x-auto scrollbar-hide">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
                      isActive
                        ? "bg-gradient-to-r from-rose-400 to-amber-400 text-white"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </header>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
              <AnimatePresence mode="wait">
                {/* Media Gallery Tab */}
                {activeTab === "media" && (
                  <motion.div
                    key="media"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="mb-6">
                      <h2 className="text-2xl font-bold text-gray-900">
                        Media Gallery
                      </h2>
                      <p className="text-gray-500 mt-1">
                        All photos and videos from your event
                      </p>
                    </div>

                    {isLoadingMedia ? (
                      <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-rose-400" />
                      </div>
                    ) : mediaItems.length === 0 ? (
                      <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
                        <div className="w-24 h-24 bg-gradient-to-br from-rose-100 to-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                          <Images className="w-12 h-12 text-rose-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                          No media yet
                        </h3>
                        <p className="text-gray-500 max-w-md mx-auto mb-6">
                          Upload photos and videos or share the QR code with
                          guests to start collecting memories.
                        </p>
                        <motion.button
                          onClick={() => setActiveTab("uploads")}
                          className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-rose-400 to-amber-400 text-white rounded-xl font-medium shadow-lg"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Upload className="w-5 h-5" />
                          <span>Upload Media</span>
                        </motion.button>
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
                          {mediaItems.map((item, index) => {
                            const mediaIsVideo = isVideo(item.media_file);
                            return (
                              <motion.div
                                key={`${item.name}-${index}`}
                                className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 cursor-pointer group shadow-sm hover:shadow-md transition-shadow"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.03 }}
                                whileHover={{ scale: 1.03 }}
                                onClick={() => setSelectedMedia(item)}
                              >
                                {mediaIsVideo ? (
                                  <div className="w-full h-full relative">
                                    <video
                                      src={item.media_file}
                                      className="w-full h-full object-cover"
                                      muted
                                      playsInline
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-black/40 to-transparent">
                                      <div className="w-14 h-14 bg-white/95 rounded-full flex items-center justify-center shadow-lg">
                                        <Play className="w-7 h-7 text-rose-500 ml-1" />
                                      </div>
                                    </div>
                                    <div className="absolute top-2 left-2">
                                      <div className="flex items-center space-x-1 px-2 py-1 bg-black/60 rounded-full text-white text-xs">
                                        <Video className="w-3 h-3" />
                                        <span>Video</span>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <img
                                      src={
                                        item.media_file || "/placeholder.svg"
                                      }
                                      alt={item.name}
                                      className="w-full h-full object-cover"
                                    />
                                    <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <div className="flex items-center space-x-1 px-2 py-1 bg-black/60 rounded-full text-white text-xs">
                                        <ImageIcon className="w-3 h-3" />
                                        <span>Photo</span>
                                      </div>
                                    </div>
                                  </>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <motion.button
                                  className="absolute bottom-2 right-2 p-2 bg-white/95 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDownload(item.media_file, item.name);
                                  }}
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                >
                                  <Download className="w-4 h-4 text-gray-700" />
                                </motion.button>
                              </motion.div>
                            );
                          })}
                        </div>

                        {hasMoreMedia && (
                          <div className="flex justify-center mt-8">
                            <motion.button
                              onClick={() => fetchMedia(mediaOffset, true)}
                              disabled={isLoadingMoreMedia}
                              className="flex items-center space-x-2 px-6 py-3 bg-white border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 shadow-sm"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              {isLoadingMoreMedia ? (
                                <>
                                  <Loader2 className="w-5 h-5 animate-spin" />
                                  <span>Loading...</span>
                                </>
                              ) : (
                                <>
                                  <RefreshCw className="w-5 h-5" />
                                  <span>Load More</span>
                                </>
                              )}
                            </motion.button>
                          </div>
                        )}
                      </>
                    )}
                  </motion.div>
                )}

                {/* Upload Tab */}
                {activeTab === "uploads" && (
                  <motion.div
                    key="uploads"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="mb-6">
                      <h2 className="text-2xl font-bold text-gray-900">
                        Upload Media
                      </h2>
                      <p className="text-gray-500 mt-1">
                        Add photos and videos to your event
                      </p>
                    </div>

                    <div className="max-w-2xl mx-auto">
                      {/* Error Alert */}
                      {uploadError && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-3"
                        >
                          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-red-700 text-sm">
                              {uploadError}
                            </p>
                          </div>
                          <button onClick={() => setUploadError(null)}>
                            <X className="w-4 h-4 text-red-400 hover:text-red-600" />
                          </button>
                        </motion.div>
                      )}

                      {/* Upload Drop Zone */}
                      <div
                        onDrop={handleDrop}
                        onDragOver={(e) => e.preventDefault()}
                        onDragEnter={(e) => e.preventDefault()}
                        className="bg-white rounded-2xl shadow-sm border-2 border-dashed border-gray-200 hover:border-rose-300 transition-colors"
                      >
                        <div className="p-12 text-center">
                          <div className="w-20 h-20 bg-gradient-to-br from-rose-100 to-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Upload className="w-10 h-10 text-rose-400" />
                          </div>
                          <h3 className="text-xl font-semibold text-gray-900 mb-3">
                            Drag and drop files here
                          </h3>
                          <p className="text-gray-500 mb-6 max-w-md mx-auto">
                            or click to browse. Supports JPG, PNG, WEBP images
                            and MP4, WebM, MOV videos.
                          </p>

                          <input
                            ref={fileInputRef}
                            type="file"
                            accept={acceptedExtensions}
                            multiple
                            onChange={handleFileSelect}
                            className="hidden"
                            id="file-upload"
                          />
                          <label htmlFor="file-upload">
                            <motion.span
                              className="inline-flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-rose-400 to-amber-400 text-white rounded-xl font-medium cursor-pointer shadow-lg"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Upload className="w-5 h-5" />
                              <span>Choose Files</span>
                            </motion.span>
                          </label>
                        </div>
                      </div>

                      {/* File List Preview (before upload starts) */}
                      {uploadingFiles.length > 0 && !showUploadProgress && (
                        <div className="mt-6 bg-white rounded-xl border border-gray-200 overflow-hidden">
                          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                            <p className="font-medium text-gray-700">
                              {uploadingFiles.length} file
                              {uploadingFiles.length > 1 ? "s" : ""} selected
                            </p>
                          </div>
                          <div className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
                            {uploadingFiles.map((file) => (
                              <div
                                key={file.id}
                                className="flex items-center px-4 py-3 space-x-3"
                              >
                                {getFileIcon(file.type)}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">
                                    {file.name}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {formatFileSize(file.size)}
                                  </p>
                                </div>
                                <button
                                  onClick={() => removeFile(file.id)}
                                  className="p-1 hover:bg-gray-100 rounded"
                                >
                                  <X className="w-4 h-4 text-gray-400" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* QR Code Tab */}
                {activeTab === "qrcode" && (
                  <motion.div
                    key="qrcode"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="mb-6">
                      <h2 className="text-2xl font-bold text-gray-900">
                        Event Certificate
                      </h2>
                      <p className="text-gray-500 mt-1">
                        Choose a certificate template with your event QR code
                      </p>
                    </div>

                    {/* Certificate Template Thumbnail Selector */}
                    <div className="mb-6">
                      <p className="text-sm font-medium text-gray-700 mb-3">
                        Select Template
                      </p>
                      <div className="flex space-x-4 overflow-x-auto pb-3">
                        {certificates.map((cert) => {
                          const isSelected = selectedCertificate.id === cert.id;
                          return (
                            <motion.button
                              key={cert.id}
                              onClick={() => setSelectedCertificate(cert)}
                              className={`flex-shrink-0 rounded-xl border-2 transition-all overflow-hidden ${
                                isSelected
                                  ? "border-rose-400 shadow-lg shadow-rose-100 ring-2 ring-rose-200"
                                  : "border-gray-200 hover:border-gray-300 hover:shadow-md"
                              }`}
                              whileHover={{ scale: 1.03 }}
                              whileTap={{ scale: 0.97 }}
                              style={{ width: 160 }}
                            >
                              {/* Thumbnail Preview */}
                              <div
                                className="w-full bg-gray-50 overflow-hidden"
                                style={{ height: 110 }}
                              >
                                {thumbnailSvgs[cert.id] ? (
                                  <div
                                    className="certificate-thumbnail"
                                    dangerouslySetInnerHTML={{
                                      __html: thumbnailSvgs[cert.id],
                                    }}
                                  />
                                ) : (
                                  <div className="flex items-center justify-center h-full">
                                    <Loader2 className="w-5 h-5 animate-spin text-gray-300" />
                                  </div>
                                )}
                              </div>
                              {/* Label */}
                              <div
                                className={`px-3 py-2.5 text-center text-xs font-semibold ${
                                  isSelected
                                    ? "bg-gradient-to-r from-rose-50 to-amber-50 text-rose-700"
                                    : "bg-white text-gray-600"
                                }`}
                              >
                                {cert.name}
                              </div>
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Two-Column Layout: Preview + Form */}
                    <div className="flex flex-col md:flex-row gap-6">
                      {/* Left: Certificate Preview */}
                      <div className="md:w-3/5 w-full">
                        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                          <div className="bg-gradient-to-r from-rose-400 to-amber-400 px-6 py-4 flex items-center justify-between">
                            <div className="flex items-center space-x-3 text-white">
                              <div className="w-9 h-9 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                                <QrCode className="w-4 h-4 text-white" />
                              </div>
                              <div>
                                <h3 className="font-bold text-base">Preview</h3>
                                <p className="text-white/80 text-xs">
                                  {selectedCertificate.name}
                                </p>
                              </div>
                            </div>

                            {certificateSvgContent && (
                              <motion.button
                                onClick={downloadCertificate}
                                className="flex items-center space-x-2 px-3 py-1.5 bg-white/20 backdrop-blur-sm text-white rounded-lg font-medium text-xs hover:bg-white/30 transition-colors"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>Download</span>
                              </motion.button>
                            )}
                          </div>

                          <div className="p-4">
                            {isLoadingQR || isLoadingCertificate ? (
                              <div className="flex flex-col items-center justify-center py-16">
                                <Loader2 className="w-8 h-8 animate-spin text-rose-400 mb-3" />
                                <p className="text-sm text-gray-500">
                                  {isLoadingQR
                                    ? "Loading QR code..."
                                    : "Processing certificate..."}
                                </p>
                              </div>
                            ) : certificateSvgContent ? (
                              <div className="w-full overflow-auto rounded-lg border border-gray-100">
                                <div
                                  className="certificate-preview"
                                  style={{ maxHeight: "70vh" }}
                                  dangerouslySetInnerHTML={{
                                    __html: certificateSvgContent,
                                  }}
                                />
                              </div>
                            ) : qrCodeUrl && !qrBase64 ? (
                              <div className="text-center py-12">
                                <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                  <AlertCircle className="w-8 h-8 text-amber-500" />
                                </div>
                                <p className="text-gray-600 mb-2 font-medium">
                                  Could not process QR code image
                                </p>
                                <p className="text-gray-400 text-sm mb-4">
                                  The QR code URL may have CORS restrictions
                                </p>
                                <motion.button
                                  onClick={fetchQRCode}
                                  className="text-rose-500 font-medium text-sm"
                                  whileHover={{ scale: 1.05 }}
                                >
                                  Try Again
                                </motion.button>
                              </div>
                            ) : (
                              <div className="text-center py-12">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                  <QrCode className="w-8 h-8 text-gray-400" />
                                </div>
                                <p className="text-gray-500 mb-4">
                                  Failed to load QR code
                                </p>
                                <motion.button
                                  onClick={fetchQRCode}
                                  className="inline-flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-rose-400 to-amber-400 text-white rounded-lg font-medium shadow-md"
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  <RefreshCw className="w-4 h-4" />
                                  <span>Try Again</span>
                                </motion.button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Dynamic Form Fields */}
                      <div className="md:w-2/5 w-full">
                        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                          <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-6 py-4 flex items-center space-x-3">
                            <div className="w-9 h-9 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center">
                              <FileImage className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <h3 className="font-bold text-base text-white">
                                Certificate Details
                              </h3>
                              <p className="text-white/60 text-xs">
                                Fill in all required fields
                              </p>
                            </div>
                          </div>

                          <div className="p-5 space-y-5">
                            {templateVariables.length > 0 ? (
                              templateVariables.map((variable) => {
                                const value = formValues[variable.key] ?? "";
                                const isTouched = touchedFields[variable.key];
                                const isEmpty =
                                  isTouched && value.trim() === "";
                                return (
                                  <div key={variable.key}>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                      {variable.label}
                                      <span className="text-rose-400 ml-0.5">
                                        *
                                      </span>
                                    </label>
                                    <input
                                      type="text"
                                      value={value}
                                      maxLength={variable.maxCharacters}
                                      placeholder={
                                        variable.defaultValue ||
                                        `Enter ${variable.label.toLowerCase()}`
                                      }
                                      onChange={(e) =>
                                        setFormValues((prev) => ({
                                          ...prev,
                                          [variable.key]: e.target.value,
                                        }))
                                      }
                                      onBlur={() =>
                                        setTouchedFields((prev) => ({
                                          ...prev,
                                          [variable.key]: true,
                                        }))
                                      }
                                      className={`w-full px-4 py-2.5 rounded-lg border text-sm transition-all duration-200 outline-none ${
                                        isEmpty
                                          ? "border-rose-300 bg-rose-50/50 focus:ring-2 focus:ring-rose-200 focus:border-rose-400"
                                          : "border-gray-200 bg-gray-50 focus:ring-2 focus:ring-rose-200 focus:border-rose-400 focus:bg-white"
                                      }`}
                                    />
                                    <div className="flex items-center justify-between mt-1">
                                      {isEmpty ? (
                                        <p className="text-xs text-rose-500">
                                          This field is required
                                        </p>
                                      ) : (
                                        <span />
                                      )}
                                      <p className="text-xs text-gray-400">
                                        {value.length}/{variable.maxCharacters}
                                      </p>
                                    </div>
                                  </div>
                                );
                              })
                            ) : isLoadingCertificate ? (
                              <div className="flex flex-col items-center justify-center py-12">
                                <Loader2 className="w-6 h-6 animate-spin text-gray-300 mb-2" />
                                <p className="text-sm text-gray-400">
                                  Loading fields...
                                </p>
                              </div>
                            ) : (
                              <div className="text-center py-12">
                                <p className="text-sm text-gray-400">
                                  No custom fields for this template
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Webhook/API Tab */}
                {activeTab === "webhook" && (
                  <motion.div
                    key="webhook"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                          API Integration
                        </h2>
                        <p className="text-gray-500 mt-1">
                          Generate and manage API URLs to programmatically
                          upload media
                        </p>
                      </div>
                      <motion.button
                        onClick={handleGenerateApiUrl}
                        disabled={isGeneratingApi}
                        className="inline-flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-rose-400 to-amber-400 text-white rounded-xl font-medium shadow-lg disabled:opacity-60 self-start sm:self-auto"
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                      >
                        {isGeneratingApi ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Plus className="w-5 h-5" />
                        )}
                        <span>
                          {isGeneratingApi
                            ? "Generating..."
                            : "Generate API URL"}
                        </span>
                      </motion.button>
                    </div>

                    {/* Error */}
                    {apiError && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-3"
                      >
                        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <p className="text-red-700 text-sm flex-1">
                          {apiError}
                        </p>
                        <button onClick={() => setApiError(null)}>
                          <X className="w-4 h-4 text-red-400 hover:text-red-600" />
                        </button>
                      </motion.div>
                    )}

                    <div className="max-w-3xl">
                      {isLoadingApis ? (
                        <div className="flex items-center justify-center py-20">
                          <Loader2 className="w-8 h-8 animate-spin text-rose-400" />
                        </div>
                      ) : apiUrls.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
                          <div className="w-24 h-24 bg-gradient-to-br from-rose-100 to-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Link2 className="w-12 h-12 text-rose-400" />
                          </div>
                          <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            No API URLs yet
                          </h3>
                          <p className="text-gray-500 max-w-md mx-auto mb-6">
                            Generate an API URL to upload photos and videos
                            programmatically from your applications or services.
                          </p>
                          <motion.button
                            onClick={handleGenerateApiUrl}
                            disabled={isGeneratingApi}
                            className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-rose-400 to-amber-400 text-white rounded-xl font-medium shadow-lg disabled:opacity-60"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            {isGeneratingApi ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                              <Plus className="w-5 h-5" />
                            )}
                            <span>
                              {isGeneratingApi
                                ? "Generating..."
                                : "Generate Your First API URL"}
                            </span>
                          </motion.button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {apiUrls.map((apiItem, index) => {
                            const expired = isExpired(apiItem.Expires_at);
                            const isRevoked = apiItem.Status === "revoked";
                            const isActive =
                              apiItem.Status === "active" && !expired;
                            const isRevoking = revokingApiId === apiItem.Api_id;
                            const isCopied = copiedApiId === apiItem.Api_id;

                            return (
                              <motion.div
                                key={apiItem.Api_id}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${
                                  isActive
                                    ? "border-green-200"
                                    : isRevoked
                                      ? "border-red-100"
                                      : "border-amber-200"
                                }`}
                              >
                                {/* Card Header */}
                                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                                  <div className="flex items-center space-x-3">
                                    <div
                                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                        isActive
                                          ? "bg-green-100"
                                          : isRevoked
                                            ? "bg-red-50"
                                            : "bg-amber-100"
                                      }`}
                                    >
                                      {isActive ? (
                                        <Shield className="w-5 h-5 text-green-600" />
                                      ) : isRevoked ? (
                                        <ShieldOff className="w-5 h-5 text-red-400" />
                                      ) : (
                                        <Clock className="w-5 h-5 text-amber-600" />
                                      )}
                                    </div>
                                    <div>
                                      <div className="flex items-center space-x-2">
                                        <span className="font-semibold text-gray-900 text-sm">
                                          {apiItem.Api_id}
                                        </span>
                                        <span
                                          className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                                            isActive
                                              ? "bg-green-100 text-green-700"
                                              : isRevoked
                                                ? "bg-red-100 text-red-600"
                                                : "bg-amber-100 text-amber-700"
                                          }`}
                                        >
                                          {isRevoked
                                            ? "Revoked"
                                            : expired
                                              ? "Expired"
                                              : "Active"}
                                        </span>
                                      </div>
                                      <div className="flex items-center space-x-1 mt-0.5">
                                        <Clock className="w-3 h-3 text-gray-400" />
                                        <span className="text-xs text-gray-500">
                                          {expired ? "Expired" : "Expires"}:{" "}
                                          {formatExpiryDate(apiItem.Expires_at)}
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Actions */}
                                  <div className="flex items-center space-x-2">
                                    {isActive && (
                                      <motion.button
                                        onClick={() =>
                                          handleRevokeApiUrl(apiItem.Api_id)
                                        }
                                        disabled={isRevoking}
                                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                                        whileHover={{ scale: 1.03 }}
                                        whileTap={{ scale: 0.97 }}
                                        title="Revoke this API URL"
                                      >
                                        {isRevoking ? (
                                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        ) : (
                                          <Trash2 className="w-3.5 h-3.5" />
                                        )}
                                        <span>
                                          {isRevoking
                                            ? "Revoking..."
                                            : "Revoke"}
                                        </span>
                                      </motion.button>
                                    )}
                                  </div>
                                </div>

                                {/* Card Body - URL */}
                                <div className="px-5 py-4">
                                  <p className="text-xs text-gray-500 font-medium mb-2">
                                    API Endpoint
                                  </p>
                                  <div className="flex items-center space-x-2">
                                    <div
                                      className={`flex-1 p-3 rounded-lg border text-sm font-mono break-all ${
                                        isActive
                                          ? "bg-gray-50 border-gray-200 text-gray-800"
                                          : "bg-gray-50 border-gray-100 text-gray-400"
                                      }`}
                                    >
                                      {apiItem.Api_url}
                                    </div>
                                    <div className="flex flex-col space-y-1.5">
                                      <motion.button
                                        onClick={() =>
                                          copyApiUrl(
                                            apiItem.Api_id,
                                            apiItem.Api_url,
                                          )
                                        }
                                        className="p-2.5 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        title="Copy URL"
                                      >
                                        {isCopied ? (
                                          <Check className="w-4 h-4 text-green-500" />
                                        ) : (
                                          <Copy className="w-4 h-4 text-gray-500" />
                                        )}
                                      </motion.button>
                                      {/* {isActive && (
                                        <motion.button
                                          onClick={() =>
                                            window.open(
                                              apiItem.Api_url,
                                              "_blank",
                                            )
                                          }
                                          className="p-2.5 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
                                          whileHover={{ scale: 1.1 }}
                                          whileTap={{ scale: 0.9 }}
                                          title="Open in new tab"
                                        >
                                          <ExternalLink className="w-4 h-4 text-gray-500" />
                                        </motion.button>
                                      )} */}
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </main>
      </div>

      {/* Upload Progress Modal (Google Docs Style) */}
      <AnimatePresence>
        {showUploadProgress && uploadingFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            className="fixed bottom-4 right-4 z-50 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <span className="font-medium text-gray-900">
                  Uploading {uploadStats.total} item
                  {uploadStats.total > 1 ? "s" : ""}
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setIsUploadMinimized(!isUploadMinimized)}
                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                >
                  {isUploadMinimized ? (
                    <ChevronUp className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  )}
                </button>
                <button
                  onClick={cancelUpload}
                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Progress Info */}
            {!isUploadMinimized && (
              <>
                <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    {uploadStats.completed === uploadStats.total
                      ? "Upload complete"
                      : isUploading
                        ? "Uploading..."
                        : "Preparing..."}
                  </span>
                  {isUploading && uploadStats.completed < uploadStats.total && (
                    <button
                      onClick={cancelUpload}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Cancel
                    </button>
                  )}
                </div>

                {/* File List */}
                <div className="max-h-64 overflow-y-auto">
                  {uploadingFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center px-4 py-3 space-x-3 border-b border-gray-50 last:border-b-0"
                    >
                      {getFileIcon(file.type)}
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-sm text-gray-900 truncate"
                          title={file.name}
                        >
                          {file.name}
                        </p>
                        {file.status === "uploading" && (
                          <div className="mt-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                            <motion.div
                              className="h-full bg-gradient-to-r from-rose-400 to-amber-400"
                              initial={{ width: 0 }}
                              animate={{ width: `${file.progress}%` }}
                              transition={{ duration: 0.3 }}
                            />
                          </div>
                        )}
                      </div>
                      <div className="flex-shrink-0">
                        {file.status === "completed" && (
                          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}
                        {file.status === "uploading" && (
                          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        )}
                        {file.status === "pending" && (
                          <div className="w-6 h-6 border-2 border-gray-300 rounded-full" />
                        )}
                        {file.status === "error" && (
                          <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                            <X className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Media Viewer Modal */}
      <AnimatePresence>
        {selectedMedia && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setSelectedMedia(null)}
          >
            <motion.button
              className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"
              onClick={() => setSelectedMedia(null)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <X className="w-6 h-6 text-white" />
            </motion.button>

            <motion.button
              className="absolute top-4 left-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"
              onClick={(e) => {
                e.stopPropagation();
                handleDownload(selectedMedia.media_file, selectedMedia.name);
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Download className="w-6 h-6 text-white" />
            </motion.button>

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-w-5xl max-h-[85vh] w-full"
              onClick={(e) => e.stopPropagation()}
            >
              {isVideo(selectedMedia.media_file) ? (
                <video
                  ref={videoRef}
                  src={selectedMedia.media_file}
                  className="w-full h-full max-h-[85vh] object-contain rounded-lg"
                  controls
                  autoPlay
                  playsInline
                />
              ) : (
                <img
                  src={selectedMedia.media_file || "/placeholder.svg"}
                  alt={selectedMedia.name}
                  className="w-full h-full max-h-[85vh] object-contain rounded-lg"
                />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
