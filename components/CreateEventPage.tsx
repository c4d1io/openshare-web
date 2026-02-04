"use client";

import React from "react"

import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Tag,
  Globe,
  Lock,
  X,
  Loader2,
  ChevronDown,
  ImageIcon,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/components/contexts/AuthContext";
import { eventService } from "@/lib/services/eventService";
import type { EventCategory, CreateEventPayload } from "@/lib/types/event";
import Image from "next/image";

interface CreateEventPageProps {
  onBack: () => void;
  onEventCreated: (eventId: string) => void;
}

export default function CreateEventPage({
  onBack,
  onEventCreated,
}: CreateEventPageProps) {
  const { user } = useAuth();

  // Form state
  const [eventImage, setEventImage] = useState<File | null>(null);
  const [eventImagePreview, setEventImagePreview] = useState<string | null>(null);
  const [eventName, setEventName] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [eventType, setEventType] = useState<"public" | "private">("public");

  // Category state
  const [selectedCategory, setSelectedCategory] = useState<EventCategory | null>(null);
  const [customCategoryName, setCustomCategoryName] = useState("");
  const [isOtherCategory, setIsOtherCategory] = useState(false);
  const [categories, setCategories] = useState<EventCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoriesOffset, setCategoriesOffset] = useState(0);
  const [hasMoreCategories, setHasMoreCategories] = useState(true);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);

  // Form submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);

  // Fetch initial categories
  useEffect(() => {
    fetchCategories(0);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        categoryDropdownRef.current &&
        !categoryDropdownRef.current.contains(event.target as Node)
      ) {
        setIsCategoryDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchCategories = async (offset: number) => {
    if (categoriesLoading) return;

    setCategoriesLoading(true);
    try {
      const response = await eventService.getEventCategories(10, offset);
      if (response.data) {
        const newCategories = response.data.results;
        setCategories((prev) =>
          offset === 0 ? newCategories : [...prev, ...newCategories]
        );
        setCategoriesOffset(offset + 10);
        setHasMoreCategories(response.data.next !== null);
      }
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    } finally {
      setCategoriesLoading(false);
    }
  };

  const handleCategoryScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (
      scrollHeight - scrollTop <= clientHeight + 20 &&
      hasMoreCategories &&
      !categoriesLoading
    ) {
      fetchCategories(categoriesOffset);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEventImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setEventImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setEventImage(null);
    setEventImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const selectCategory = (category: EventCategory | null, isOther: boolean = false) => {
    setSelectedCategory(category);
    setIsOtherCategory(isOther);
    if (!isOther) {
      setCustomCategoryName("");
    }
    setIsCategoryDropdownOpen(false);
  };

  const formatTimeForAPI = (time: string): string => {
    if (!time) return "";
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes}${ampm}`;
  };

  const formatDateForAPI = (date: string, time: string): string => {
    if (!date) return "";
    const dateTime = time ? `${date}T${time}:00` : `${date}T00:00:00`;
    return new Date(dateTime).toISOString();
  };

  const convertImageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!eventName.trim()) {
      setError("Please enter an event name");
      return;
    }
    if (!eventDate) {
      setError("Please select an event date");
      return;
    }
    if (!eventTime) {
      setError("Please select an event time");
      return;
    }
    if (!eventLocation.trim()) {
      setError("Please enter an event location");
      return;
    }
    if (!selectedCategory && !isOtherCategory) {
      setError("Please select an event category");
      return;
    }
    if (isOtherCategory && !customCategoryName.trim()) {
      setError("Please enter a custom category name");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: CreateEventPayload = {
        event_name: eventName.trim(),
        event_date: formatDateForAPI(eventDate, eventTime),
        event_time: formatTimeForAPI(eventTime),
        event_location: eventLocation.trim(),
        event_description: eventDescription.trim(),
        event_type: eventType,
      };

      // Convert image to base64 if provided
      if (eventImage) {
        try {
          const base64Image = await convertImageToBase64(eventImage);
          payload.event_image = base64Image;
        } catch (err) {
          console.error("Image conversion failed, continuing without image:", err);
        }
      }

      if (isOtherCategory) {
        payload.event_category_name = customCategoryName.trim();
      } else if (selectedCategory) {
        payload.event_category_code = selectedCategory.category_code;
      }

const response = await eventService.createEvent(payload);
  onEventCreated(response.event_id);
    } catch (err: any) {
      setError(err.message || "Failed to create event. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 left-10 w-72 h-72 bg-rose-200/20 rounded-full blur-3xl"
          animate={{ x: [0, 30, 0], y: [0, 20, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-96 h-96 bg-amber-200/20 rounded-full blur-3xl"
          animate={{ x: [0, -20, 0], y: [0, 30, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="relative z-10">
        {/* Navigation */}
        <motion.nav
          className="container mx-auto px-4 py-6 flex justify-between items-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center space-x-4">
            <motion.button
              onClick={onBack}
              className="p-2 rounded-full hover:bg-white/50 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft className="w-6 h-6 text-gray-700" />
            </motion.button>
            <div className="flex items-center space-x-2">
              <Heart className="w-8 h-8 text-rose-400" fill="currentColor" />
              <span className="text-2xl font-light text-gray-800">Moments</span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {user?.picture ? (
              <Image
                src={user.picture || "/placeholder.svg"}
                alt={user.full_name || "User"}
                width={40}
                height={40}
                className="rounded-full border-2 border-white shadow-sm"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-400 to-amber-400 flex items-center justify-center text-white font-medium">
                {user?.full_name?.charAt(0) || user?.email?.charAt(0) || "U"}
              </div>
            )}
          </div>
        </motion.nav>

        {/* Form Container */}
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-3xl font-light text-gray-900 mb-2">
              Create New Event
            </h1>
            <p className="text-gray-500 mb-8">
              Fill in the details below to create your event and start capturing
              moments.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Event Image Upload */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Event Image <span className="text-gray-400">(Optional)</span>
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="relative border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-rose-300 transition-colors bg-white/50"
                >
                  {eventImagePreview ? (
                    <div className="relative">
                      <Image
                        src={eventImagePreview || "/placeholder.svg"}
                        alt="Event preview"
                        width={300}
                        height={200}
                        className="mx-auto rounded-lg object-cover max-h-48"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeImage();
                        }}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <ImageIcon className="w-12 h-12 text-gray-300 mx-auto" />
                      <p className="text-gray-500">Click to upload event image</p>
                      <p className="text-xs text-gray-400">PNG, JPG up to 5MB</p>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Event Name */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Event Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  placeholder="Enter event name"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-rose-300 focus:ring-2 focus:ring-rose-100 outline-none transition-all bg-white/80"
                />
              </div>

              {/* Event Description */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Event Description
                </label>
                <textarea
                  value={eventDescription}
                  onChange={(e) => setEventDescription(e.target.value)}
                  placeholder="Describe your event..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-rose-300 focus:ring-2 focus:ring-rose-100 outline-none transition-all bg-white/80 resize-none"
                />
              </div>

              {/* Date and Time Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Event Date <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="date"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                      className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-rose-300 focus:ring-2 focus:ring-rose-100 outline-none transition-all bg-white/80"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Event Time <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="time"
                      value={eventTime}
                      onChange={(e) => setEventTime(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-rose-300 focus:ring-2 focus:ring-rose-100 outline-none transition-all bg-white/80"
                    />
                  </div>
                </div>
              </div>

              {/* Location - Manual Entry */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Event Location <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={eventLocation}
                    onChange={(e) => setEventLocation(e.target.value)}
                    placeholder="Enter event location (e.g., HSR Layout, Bangalore)"
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-rose-300 focus:ring-2 focus:ring-rose-100 outline-none transition-all bg-white/80"
                  />
                </div>
              </div>

              {/* Event Category */}
              <div className="space-y-2" ref={categoryDropdownRef}>
                <label className="block text-sm font-medium text-gray-700">
                  Event Category <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-rose-300 focus:ring-2 focus:ring-rose-100 outline-none transition-all bg-white/80 text-left flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <Tag className="w-5 h-5 text-gray-400" />
                      <span
                        className={
                          selectedCategory || isOtherCategory
                            ? "text-gray-900"
                            : "text-gray-400"
                        }
                      >
                        {isOtherCategory
                          ? customCategoryName || "Others (Custom)"
                          : selectedCategory?.category_name || "Select category"}
                      </span>
                    </div>
                    <ChevronDown
                      className={`w-5 h-5 text-gray-400 transition-transform ${
                        isCategoryDropdownOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  <AnimatePresence>
                    {isCategoryDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute z-20 w-full mt-1 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden"
                      >
                        <div
                          className="max-h-60 overflow-y-auto"
                          onScroll={handleCategoryScroll}
                        >
                          {/* Others option first */}
                          <button
                            type="button"
                            onClick={() => selectCategory(null, true)}
                            className={`w-full px-4 py-3 text-left hover:bg-rose-50 transition-colors flex items-center space-x-3 ${
                              isOtherCategory ? "bg-rose-50" : ""
                            }`}
                          >
                            <Tag className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-700">
                              Others (Enter manually)
                            </span>
                          </button>

                          {/* API categories */}
                          {categories.map((category) => (
                            <button
                              key={category.category_code}
                              type="button"
                              onClick={() => selectCategory(category)}
                              className={`w-full px-4 py-3 text-left hover:bg-rose-50 transition-colors flex items-center space-x-3 ${
                                selectedCategory?.category_code ===
                                category.category_code
                                  ? "bg-rose-50"
                                  : ""
                              }`}
                            >
                              <Tag className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-700">
                                {category.category_name}
                              </span>
                            </button>
                          ))}

                          {categoriesLoading && (
                            <div className="px-4 py-3 text-center">
                              <Loader2 className="w-5 h-5 animate-spin mx-auto text-rose-400" />
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Custom category input */}
                <AnimatePresence>
                  {isOtherCategory && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <input
                        type="text"
                        value={customCategoryName}
                        onChange={(e) => setCustomCategoryName(e.target.value)}
                        placeholder="Enter custom category name"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-rose-300 focus:ring-2 focus:ring-rose-100 outline-none transition-all bg-white/80 mt-2"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Event Type */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Event Type <span className="text-rose-400">*</span>
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setEventType("public")}
                    className={`p-4 rounded-xl border-2 transition-all flex items-center justify-center space-x-3 ${
                      eventType === "public"
                        ? "border-rose-400 bg-rose-50"
                        : "border-gray-200 bg-white/80 hover:border-gray-300"
                    }`}
                  >
                    <Globe
                      className={`w-5 h-5 ${
                        eventType === "public" ? "text-rose-400" : "text-gray-400"
                      }`}
                    />
                    <span
                      className={`font-medium ${
                        eventType === "public" ? "text-rose-600" : "text-gray-600"
                      }`}
                    >
                      Public
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEventType("private")}
                    className={`p-4 rounded-xl border-2 transition-all flex items-center justify-center space-x-3 ${
                      eventType === "private"
                        ? "border-rose-400 bg-rose-50"
                        : "border-gray-200 bg-white/80 hover:border-gray-300"
                    }`}
                  >
                    <Lock
                      className={`w-5 h-5 ${
                        eventType === "private" ? "text-rose-400" : "text-gray-400"
                      }`}
                    />
                    <span
                      className={`font-medium ${
                        eventType === "private" ? "text-rose-600" : "text-gray-600"
                      }`}
                    >
                      Private
                    </span>
                  </button>
                </div>
              </div>

              {/* Error message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-rose-400 to-amber-400 text-white py-4 rounded-xl font-medium shadow-lg disabled:opacity-50 flex items-center justify-center space-x-2"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Creating Event...</span>
                  </>
                ) : (
                  <span>Create Event</span>
                )}
              </motion.button>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
