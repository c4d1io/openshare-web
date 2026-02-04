"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { AuthProvider, useAuth } from "@/components/contexts/AuthContext";
import LandingPage from "@/components/LandingPage";
import EventsPage from "@/components/EventsPage";
import CreateEventPage from "@/components/CreateEventPage";
import UploadPage from "@/components/UploadPage";
import ProcessingScreen from "@/components/ProcessingScreen";
import ResultsGallery from "@/components/ResultsGallery";
import EmptyState from "@/components/EmptyState";
import EventDetailPage from "@/components/EventDetailPage"; // Import EventDetailPage

type Screen =
  | "landing"
  | "events"
  | "create-event"
  | "upload"
  | "processing"
  | "results"
  | "empty";

function AppContent() {
  const router = useRouter();
  const [currentScreen, setCurrentScreen] = useState<Screen>("landing");
  const [isProcessing, setIsProcessing] = useState(false);
  const { isAuthenticated, user } = useAuth();
  const [currentEventId, setCurrentEventId] = useState<string | null>(null); // Declare currentEventId

  // Check if user is already authenticated on mount
  useEffect(() => {
    if (isAuthenticated && user) {
      setCurrentScreen("events");
    }
  }, [isAuthenticated, user]);

  const handleGetStarted = () => {
    setCurrentScreen("upload");
  };

  const handleLoginSuccess = () => {
    setCurrentScreen("events");
  };

  const handleCreateEvent = () => {
    setCurrentScreen("create-event");
  };

  const handleEventCreated = (eventId: string) => {
    // Navigate to the dynamic event route
    router.push(`/event/${eventId}`);
  };

  const handleEventSelect = (eventId: string) => {
    // Navigate to the dynamic event route
    router.push(`/event/${eventId}`);
  };

  const handleLogout = () => {
    setCurrentScreen("landing");
  };

  const handleUpload = async () => {
    setCurrentScreen("processing");
    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      setCurrentScreen("results");
    }, 2500);
  };

  const handleBackToLanding = () => {
    setIsProcessing(false);
    setCurrentScreen("landing");
  };

  const handleBackToEvents = () => {
    setIsProcessing(false);
    setCurrentScreen("events");
  };

  const handleTryAgain = () => {
    setCurrentScreen("upload");
  };

  const pageVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  };

  return (
    <div className="min-h-screen">
      <AnimatePresence mode="wait">
        {currentScreen === "landing" && (
          <motion.div
            key="landing"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.4 }}
          >
            <LandingPage
              onGetStarted={handleGetStarted}
              onLoginSuccess={handleLoginSuccess}
            />
          </motion.div>
        )}

        {currentScreen === "events" && (
          <motion.div
            key="events"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.4 }}
          >
            <EventsPage 
              onCreateEvent={handleCreateEvent} 
              onLogout={handleLogout}
              onEventSelect={handleEventSelect}
            />
          </motion.div>
        )}

        {currentScreen === "create-event" && (
          <motion.div
            key="create-event"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.4 }}
          >
            <CreateEventPage
              onBack={handleBackToEvents}
              onEventCreated={handleEventCreated}
            />
          </motion.div>
        )}

        {currentScreen === "upload" && (
          <motion.div
            key="upload"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.4 }}
          >
            <UploadPage onUpload={handleUpload} onBack={handleBackToEvents} />
          </motion.div>
        )}

        {currentScreen === "processing" && (
          <motion.div
            key="processing"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.4 }}
          >
            <ProcessingScreen
              isProcessing={isProcessing}
              onComplete={() => {
                setCurrentScreen("results");
              }}
            />
          </motion.div>
        )}

        {currentScreen === "results" && (
          <motion.div
            key="results"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.4 }}
          >
            <ResultsGallery onBack={handleBackToEvents} onTryAgain={handleTryAgain} />
          </motion.div>
        )}

        {currentScreen === "empty" && (
          <motion.div
            key="empty"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.4 }}
          >
            <EmptyState onBack={handleBackToEvents} onTryAgain={handleTryAgain} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Page() {
  return (
    <AuthProvider eventCode="demo-event">
      <AppContent />
    </AuthProvider>
  );
}
