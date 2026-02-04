"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  Plus,
  Calendar,
  Sparkles,
  PartyPopper,
  MapPin,
  Clock,
  Globe,
  Lock,
  Loader2,
  Users,
} from "lucide-react";
import { useAuth } from "@/components/contexts/AuthContext";
import { eventService } from "@/lib/services/eventService";
import type { Event } from "@/lib/types/event";
import Image from "next/image";
import { useState, useEffect, useCallback } from "react";

interface EventsPageProps {
  onCreateEvent: () => void;
  onLogout: () => void;
  onEventSelect?: (eventId: string) => void;
}

export default function EventsPage({
  onCreateEvent,
  onLogout,
  onEventSelect,
}: EventsPageProps) {
  const { user, logout } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async (currentOffset: number) => {
    try {
      const response = await eventService.getAllEvents(12, currentOffset);
      if (response) {
        const newEvents = response.results || [];
        setEvents((prev) =>
          currentOffset === 0 ? newEvents : [...prev, ...newEvents]
        );
        setHasMore(response.next !== null);
        setOffset(currentOffset + 12);
      }
    } catch (err: any) {
      console.error("Failed to fetch events:", err);
      setError(err.message || "Failed to load events");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents(0);
  }, [fetchEvents]);

  const handleLoadMore = () => {
    if (!isLoading && hasMore) {
      fetchEvents(offset);
    }
  };

  const handleLogout = () => {
    logout();
    onLogout();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const hasEvents = events.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 left-10 w-72 h-72 bg-rose-200/20 rounded-full blur-3xl"
          animate={{
            x: [0, 30, 0],
            y: [0, 20, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-96 h-96 bg-amber-200/20 rounded-full blur-3xl"
          animate={{
            x: [0, -20, 0],
            y: [0, 30, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
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
          <div className="flex items-center space-x-2">
            <Heart className="w-8 h-8 text-rose-400" fill="currentColor" />
            <span className="text-2xl font-light text-gray-800">Moments</span>
          </div>

          <div className="flex items-center space-x-4">
            {/* Create Event Button */}
            <motion.button
              onClick={onCreateEvent}
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-rose-400 to-amber-400 text-white px-5 py-2.5 rounded-full font-medium shadow-md"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Plus className="w-5 h-5" />
              <span>Create Event</span>
            </motion.button>

            {/* User Profile */}
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
              <button
                onClick={handleLogout}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </motion.nav>

        {/* Loading State */}
        {isLoading && events.length === 0 && (
          <div className="container mx-auto px-4 py-16 flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin text-rose-400 mx-auto mb-4" />
              <p className="text-gray-500">Loading your events...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && events.length === 0 && (
          <div className="container mx-auto px-4 py-16">
            <div className="max-w-md mx-auto text-center">
              <p className="text-red-500 mb-4">{error}</p>
              <button
                onClick={() => {
                  setError(null);
                  setIsLoading(true);
                  fetchEvents(0);
                }}
                className="text-rose-500 hover:text-rose-600 font-medium"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && !hasEvents && (
          <div className="container mx-auto px-4 py-16 md:py-24">
            <div className="max-w-2xl mx-auto text-center">
              {/* Animated illustration */}
              <motion.div
                className="mb-12 relative"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <div className="relative w-64 h-64 mx-auto">
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-rose-100 to-amber-100 rounded-full"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  />

                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.4 }}
                    >
                      <div className="relative">
                        <motion.div
                          animate={{ rotate: [-5, 5, -5] }}
                          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        >
                          <Calendar className="w-24 h-24 text-rose-400" strokeWidth={1.5} />
                        </motion.div>

                        <motion.div
                          className="absolute -top-2 -right-2"
                          animate={{ y: [-5, 5, -5], rotate: [0, 15, 0] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        >
                          <Sparkles className="w-8 h-8 text-amber-400" />
                        </motion.div>

                        <motion.div
                          className="absolute -bottom-1 -left-3"
                          animate={{ y: [5, -5, 5], rotate: [0, -10, 0] }}
                          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                        >
                          <PartyPopper className="w-6 h-6 text-rose-300" />
                        </motion.div>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <h1 className="text-3xl md:text-4xl font-light text-gray-900 mb-4">
                  Welcome to{" "}
                  <span className="bg-gradient-to-r from-rose-400 to-amber-400 bg-clip-text text-transparent font-normal">
                    Moments
                  </span>
                  , {user?.full_name?.split(" ")[0] || "there"}!
                </h1>
                <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                  You haven't created any events yet. Create your first event to start
                  capturing and sharing beautiful moments with your guests.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <motion.button
                  onClick={onCreateEvent}
                  className="inline-flex items-center space-x-3 bg-gradient-to-r from-rose-400 to-amber-400 text-white px-8 py-4 rounded-full text-lg font-medium shadow-lg"
                  whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(251, 113, 133, 0.3)" }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Plus className="w-6 h-6" />
                  <span>Create Your First Event</span>
                </motion.button>
              </motion.div>

              {/* Feature hints */}
              <motion.div
                className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                {[
                  { title: "Upload Photos", description: "Add all your event photos in one place" },
                  { title: "AI Recognition", description: "Our AI finds faces automatically" },
                  { title: "Share Instantly", description: "Guests find their photos with a selfie" },
                ].map((feature, index) => (
                  <motion.div
                    key={index}
                    className="bg-white/60 backdrop-blur-sm p-6 rounded-xl border border-gray-100"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.7 + index * 0.1 }}
                    whileHover={{ y: -3, boxShadow: "0 10px 30px rgba(0,0,0,0.08)" }}
                  >
                    <h3 className="font-medium text-gray-900 mb-2">{feature.title}</h3>
                    <p className="text-sm text-gray-500">{feature.description}</p>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>
        )}

        {/* Events Grid */}
        {!isLoading && hasEvents && (
          <div className="container mx-auto px-4 py-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-2xl md:text-3xl font-light text-gray-900 mb-2">
                Your Events
              </h1>
              <p className="text-gray-500 mb-8">
                Manage and view all your moments events
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                  {events.map((event, index) => (
                    <motion.div
                      key={event.event_id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.05 }}
                      onClick={() => onEventSelect?.(event.event_id)}
                      className="bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg transition-all cursor-pointer group"
                      whileHover={{ y: -5 }}
                    >
                      {/* Event Image */}
                      <div className="relative h-40 bg-gradient-to-br from-rose-100 to-amber-100 overflow-hidden">
                        {event.event_image ? (
                          <Image
                            src={event.event_image || "/placeholder.svg"}
                            alt={event.event_name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Calendar className="w-16 h-16 text-rose-300/50" />
                          </div>
                        )}
                        {/* Event Type Badge */}
                        <div className="absolute top-3 right-3">
                          <span
                            className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium ${
                              event.event_type === "public"
                                ? "bg-green-100 text-green-700"
                                : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {event.event_type === "public" ? (
                              <Globe className="w-3 h-3" />
                            ) : (
                              <Lock className="w-3 h-3" />
                            )}
                            <span className="capitalize">{event.event_type}</span>
                          </span>
                        </div>
                      </div>

                      {/* Event Details */}
                      <div className="p-5">
                        <h3 className="font-medium text-gray-900 text-lg mb-2 truncate">
                          {event.event_name}
                        </h3>

                        <div className="space-y-2 text-sm text-gray-500">
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span>{formatDate(event.event_date)}</span>
                            <Clock className="w-4 h-4 text-gray-400 ml-2" />
                            <span>{event.event_time}</span>
                          </div>

                          <div className="flex items-center space-x-2">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span className="truncate">{event.event_location}</span>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Users className="w-4 h-4 text-gray-400" />
                            <span>{event.event_category_name}</span>
                          </div>
                        </div>

                        {event.event_description && (
                          <p className="mt-3 text-sm text-gray-500 line-clamp-2">
                            {event.event_description}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Load More Button */}
              {hasMore && (
                <div className="mt-8 text-center">
                  <motion.button
                    onClick={handleLoadMore}
                    disabled={isLoading}
                    className="inline-flex items-center space-x-2 px-6 py-3 border-2 border-gray-200 rounded-full text-gray-600 hover:border-rose-300 hover:text-rose-500 transition-colors disabled:opacity-50"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Loading...</span>
                      </>
                    ) : (
                      <span>Load More Events</span>
                    )}
                  </motion.button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
