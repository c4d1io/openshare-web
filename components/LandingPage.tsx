"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import {
  Camera,
  Heart,
  Sparkles,
  Upload,
  Search,
  Download,
  Check,
  Github,
  Users,
  Zap,
  Shield,
  Star,
  ArrowRight,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { useState, useRef, useCallback } from "react";
import { useAuth } from "@/components/contexts/AuthContext";
import { GoogleOAuthProvider, useGoogleLogin } from "@react-oauth/google";

const GOOGLE_CLIENT_ID = "794802632272-lbl20i6684outteon5cl77sgg3hleobl.apps.googleusercontent.com"; // User needs to replace this

interface LandingPageProps {
  onGetStarted?: () => void;
  onLoginSuccess: () => void;
}

// ============================================
// TESTING MODE - Set to false for production
// ============================================
const USE_DUMMY_LOGIN = true; // TODO: Set to false and remove dummy login code for production

// Dummy user for testing - TODO: Remove this entire object for production
const DUMMY_USER = {
  email: "test@moments.com",
  name: "Test User",
  picture: "https://ui-avatars.com/api/?name=Test+User&background=f43f5e&color=fff",
  sub: "dummy_user_12345",
};

// Inner component that uses Google OAuth hooks
function LandingPageContent({ onLoginSuccess }: LandingPageProps) {
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();
  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const { loginWithGoogle } = useAuth();

  const handleGoogleSuccess = useCallback(async (tokenResponse: any) => {
    try {
      // Get user info from Google
      const userInfoResponse = await fetch(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        {
          headers: {
            Authorization: `Bearer ${tokenResponse.access_token}`,
          },
        }
      );
      
      const userInfo = await userInfoResponse.json();
      
      // Login with our auth context
      const result = await loginWithGoogle({
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture,
        sub: userInfo.sub,
      });

      if (result.success) {
        onLoginSuccess();
      }
    } catch (error) {
      console.error("Google login error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [loginWithGoogle, onLoginSuccess]);

  const handleGoogleError = useCallback(() => {
    console.error("Google login failed or was cancelled");
    setIsLoading(false);
  }, []);

  const googleLogin = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
    onError: handleGoogleError,
    onNonOAuthError: handleGoogleError, // Handles popup closed, etc.
  });

  // TODO: Remove this entire function for production - START
  const handleDummyLogin = useCallback(async () => {
    setIsLoading(true);
    try {
      // Simulate a brief delay like a real login
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const result = await loginWithGoogle(DUMMY_USER);
      
      if (result.success) {
        onLoginSuccess();
      }
    } catch (error) {
      console.error("Dummy login error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [loginWithGoogle, onLoginSuccess]);
  // TODO: Remove this entire function for production - END

  const handleSignIn = () => {
    // TODO: Remove USE_DUMMY_LOGIN check and keep only googleLogin() for production
    if (USE_DUMMY_LOGIN) {
      handleDummyLogin();
    } else {
      setIsLoading(true);
      googleLogin();
    }
  };

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div ref={containerRef} className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50 relative overflow-hidden">
      {/* Animated background pattern */}
      <motion.div 
        className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmYWY1ZjAiIGZpbGwtb3BhY2l0eT0iMC40Ij48cGF0aCBkPSJNMzYgMzRjMC0yLjIxIDEuNzktNCA0LTRzNCAxLjc5IDQgNC0xLjc5IDQtNCA0LTQtMS43OS00LTR6bTAgMTBjMC0yLjIxIDEuNzktNCA0LTRzNCAxLjc5IDQgNC0xLjc5IDQtNCA0LTQtMS43OS00LTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-40"
        style={{ y: backgroundY }}
      />

      {/* Floating orbs animation */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 left-10 w-72 h-72 bg-rose-200/30 rounded-full blur-3xl"
          animate={{
            x: [0, 50, 0],
            y: [0, 30, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute top-40 right-10 w-96 h-96 bg-amber-200/30 rounded-full blur-3xl"
          animate={{
            x: [0, -30, 0],
            y: [0, 50, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-20 left-1/3 w-80 h-80 bg-rose-100/40 rounded-full blur-3xl"
          animate={{
            x: [0, 40, 0],
            y: [0, -30, 0],
          }}
          transition={{
            duration: 12,
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
          <div className="hidden md:flex items-center space-x-8">
            <button 
              onClick={() => scrollToSection("how-it-works")}
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              How it Works
            </button>
            <button 
              onClick={() => scrollToSection("pricing")}
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Pricing
            </button>
            <button 
              onClick={() => scrollToSection("open-source")}
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Open Source
            </button>
          </div>
          <div className="flex items-center">
            <motion.button
              onClick={handleSignIn}
              disabled={isLoading}
              className="inline-flex items-center space-x-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 font-medium px-4 py-2 rounded-full transition-colors shadow-sm disabled:opacity-50"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              )}
              <span>{isLoading ? "Signing in..." : "Sign In"}</span>
            </motion.button>
          </div>
        </motion.nav>

        {/* Hero Section */}
        <section className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-5xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="mb-6"
            >
              <div className="inline-flex items-center space-x-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm border border-rose-100 mb-8">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span className="text-sm text-gray-600">
                  AI-Powered Face Recognition for Events
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
                Perfect Moments
              </span>{" "}
              Instantly
            </motion.h1>

            <motion.p
              className="text-lg md:text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              Moments uses advanced AI facial recognition to help guests at weddings, 
              parties, and events instantly find all photos featuring them. 
              No more scrolling through thousands of pictures.
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              <motion.button
                onClick={handleSignIn}
                disabled={isLoading}
                className="inline-flex items-center space-x-3 bg-gradient-to-r from-rose-400 to-amber-400 text-white px-8 py-4 rounded-full text-lg font-medium shadow-lg w-full sm:w-auto justify-center disabled:opacity-70"
                whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(251, 113, 133, 0.3)" }}
                whileTap={{ scale: 0.97 }}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    <span>Create Your First Event</span>
                  </>
                )}
              </motion.button>
              <motion.button
                onClick={() => scrollToSection("how-it-works")}
                className="inline-flex items-center space-x-2 text-gray-700 px-6 py-4 rounded-full text-lg font-medium border border-gray-200 bg-white/60 backdrop-blur-sm w-full sm:w-auto justify-center"
                whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.9)" }}
                whileTap={{ scale: 0.98 }}
              >
                <span>See How It Works</span>
                <ChevronDown className="w-5 h-5" />
              </motion.button>
            </motion.div>

            {/* Stats */}
            <motion.div
              className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.7 }}
            >
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  className="text-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.8 + index * 0.1 }}
                >
                  <div className="text-3xl md:text-4xl font-light text-gray-900 mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-500">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* What is Moments Section */}
        <section className="py-20 bg-white/50 backdrop-blur-sm">
          <div className="container mx-auto px-4">
            <motion.div
              className="max-w-4xl mx-auto text-center mb-16"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl md:text-5xl font-light text-gray-900 mb-6">
                What is{" "}
                <span className="bg-gradient-to-r from-rose-400 to-amber-400 bg-clip-text text-transparent">
                  Moments
                </span>
                ?
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                Moments is an AI-powered photo discovery platform designed for events. 
                Event photographers can upload all their photos, and guests simply take 
                a selfie to instantly find every photo they appear in. No manual tagging, 
                no endless scrolling - just magic.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {whatIsMoments.map((item, index) => (
                <motion.div
                  key={index}
                  className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-sm border border-gray-100 text-center"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -5, boxShadow: "0 20px 40px rgba(0,0,0,0.1)" }}
                >
                  <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                    {item.icon}
                  </div>
                  <h3 className="text-xl font-medium text-gray-900 mb-3">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">{item.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-20">
          <div className="container mx-auto px-4">
            <motion.div
              className="max-w-4xl mx-auto text-center mb-16"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl md:text-5xl font-light text-gray-900 mb-6">
                How It{" "}
                <span className="bg-gradient-to-r from-rose-400 to-amber-400 bg-clip-text text-transparent">
                  Works
                </span>
              </h2>
              <p className="text-lg text-gray-600">
                Three simple steps to find all your photos
              </p>
            </motion.div>

            <div className="max-w-5xl mx-auto">
              <div className="grid md:grid-cols-3 gap-8 relative">
                {/* Connection line */}
                <div className="hidden md:block absolute top-24 left-1/6 right-1/6 h-0.5 bg-gradient-to-r from-rose-200 via-amber-200 to-rose-200" />
                
                {howItWorks.map((step, index) => (
                  <motion.div
                    key={index}
                    className="relative"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.2 }}
                  >
                    <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-sm border border-gray-100 text-center relative z-10">
                      <motion.div 
                        className="w-16 h-16 bg-gradient-to-br from-rose-400 to-amber-400 rounded-full flex items-center justify-center mb-6 mx-auto text-white text-2xl font-medium shadow-lg"
                        whileHover={{ scale: 1.1, rotate: 5 }}
                      >
                        {index + 1}
                      </motion.div>
                      <div className="w-14 h-14 bg-gradient-to-br from-rose-100 to-amber-100 rounded-xl flex items-center justify-center mb-4 mx-auto">
                        {step.icon}
                      </div>
                      <h3 className="text-xl font-medium text-gray-900 mb-3">
                        {step.title}
                      </h3>
                      <p className="text-gray-600 leading-relaxed">{step.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-20 bg-white/50 backdrop-blur-sm">
          <div className="container mx-auto px-4">
            <motion.div
              className="max-w-4xl mx-auto text-center mb-16"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl md:text-5xl font-light text-gray-900 mb-6">
                Simple{" "}
                <span className="bg-gradient-to-r from-rose-400 to-amber-400 bg-clip-text text-transparent">
                  Pricing
                </span>
              </h2>
              <p className="text-lg text-gray-600">
                Choose the plan that works best for your events
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Free Plan */}
              <motion.div
                className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full"
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                whileHover={{ y: -5, boxShadow: "0 20px 40px rgba(0,0,0,0.1)" }}
              >
                <div className="flex-1">
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-medium text-gray-900 mb-2">Free</h3>
                    <div className="text-4xl font-light text-gray-900 mb-2">
                      $0
                      <span className="text-lg text-gray-500">/event</span>
                    </div>
                    <p className="text-gray-500">Perfect for small gatherings</p>
                  </div>
                  <ul className="space-y-4 mb-8">
                    {freePlanFeatures.map((feature, index) => (
                      <li key={index} className="flex items-start space-x-3">
                        <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <motion.button
                  onClick={handleSignIn}
                  disabled={isLoading}
                  className="w-full py-3 rounded-xl font-medium border-2 border-gray-200 text-gray-700 hover:border-gray-300 transition-colors mt-auto inline-flex items-center justify-center space-x-2 disabled:opacity-50"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  <span>Get Started Free</span>
                </motion.button>
              </motion.div>

              {/* Pro Plan */}
              <motion.div
                className="bg-gradient-to-br from-rose-50 to-amber-50 p-8 rounded-2xl shadow-lg border-2 border-rose-200 relative overflow-hidden"
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                whileHover={{ y: -5, boxShadow: "0 25px 50px rgba(251, 113, 133, 0.2)" }}
              >
                <div className="absolute top-4 right-4">
                  <span className="bg-gradient-to-r from-rose-400 to-amber-400 text-white text-xs font-medium px-3 py-1 rounded-full">
                    Popular
                  </span>
                </div>
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-medium text-gray-900 mb-2">Pro</h3>
                  <div className="text-4xl font-light text-gray-900 mb-2">
                    $29
                    <span className="text-lg text-gray-500">/event</span>
                  </div>
                  <p className="text-gray-500">For weddings and large events</p>
                </div>
                <ul className="space-y-4 mb-8">
                  {proPlanFeatures.map((feature, index) => (
                    <li key={index} className="flex items-start space-x-3">
                      <Check className="w-5 h-5 text-rose-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <motion.button
                  onClick={handleSignIn}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-rose-400 to-amber-400 text-white py-3 rounded-xl font-medium shadow-lg inline-flex items-center justify-center space-x-2 disabled:opacity-50"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  <span>Start Pro Trial</span>
                </motion.button>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Open Source Section */}
        <section id="open-source" className="py-20">
          <div className="container mx-auto px-4">
            <motion.div
              className="max-w-4xl mx-auto"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 md:p-12 text-center relative overflow-hidden">
                {/* Decorative elements */}
                <div className="absolute top-0 left-0 w-full h-full opacity-10">
                  <div className="absolute top-10 left-10 w-20 h-20 border border-white rounded-full" />
                  <div className="absolute bottom-10 right-10 w-32 h-32 border border-white rounded-full" />
                  <div className="absolute top-1/2 left-1/4 w-16 h-16 border border-white rounded-full" />
                </div>
                
                <motion.div
                  className="relative z-10"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Github className="w-10 h-10 text-white" />
                  </div>
                  <h2 className="text-3xl md:text-4xl font-light text-white mb-4">
                    Open Source & Community Driven
                  </h2>
                  <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto leading-relaxed">
                    Moments is proudly open source. We believe in transparency and 
                    community collaboration. Check out our code, contribute, or deploy 
                    your own instance.
                  </p>
                  <motion.a
                    href="https://github.com/Subhrajeet1234/Moments-in"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-3 bg-white text-gray-900 px-8 py-4 rounded-full font-medium shadow-lg"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Github className="w-5 h-5" />
                    <span>View on GitHub</span>
                    <ArrowRight className="w-5 h-5" />
                  </motion.a>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Powered By Section */}
        <section className="py-16 bg-white/50 backdrop-blur-sm">
          <div className="container mx-auto px-4">
            <motion.div
              className="text-center mb-10"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <p className="text-gray-500 text-sm uppercase tracking-wider mb-2">
                Powered By
              </p>
              <h3 className="text-xl text-gray-700">
                Built with cutting-edge technology
              </h3>
            </motion.div>

            <motion.div
              className="flex flex-wrap justify-center items-center gap-8 md:gap-16 max-w-4xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {poweredBy.map((tech, index) => (
                <motion.div
                  key={index}
                  className="flex items-center space-x-2 text-gray-500 hover:text-gray-700 transition-colors"
                  whileHover={{ scale: 1.05 }}
                >
                  {tech.icon}
                  <span className="font-medium">{tech.name}</span>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <motion.div
              className="max-w-4xl mx-auto text-center"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl md:text-5xl font-light text-gray-900 mb-6">
                Ready to Capture{" "}
                <span className="bg-gradient-to-r from-rose-400 to-amber-400 bg-clip-text text-transparent">
                  Every Moment
                </span>
                ?
              </h2>
              <p className="text-lg text-gray-600 mb-10 max-w-2xl mx-auto">
                Start using Moments today and give your event guests an unforgettable 
                experience. No credit card required for the free plan.
              </p>
              <motion.button
onClick={handleSignIn}
  disabled={isLoading}
  className="inline-flex items-center space-x-3 bg-gradient-to-r from-rose-400 to-amber-400 text-white px-10 py-5 rounded-full text-xl font-medium shadow-xl disabled:opacity-70"
                whileHover={{ scale: 1.05, boxShadow: "0 25px 50px rgba(251, 113, 133, 0.3)" }}
                whileTap={{ scale: 0.97 }}
              >
                <Sparkles className="w-6 h-6" />
                <span>Create Your First Event Now</span>
                <ArrowRight className="w-6 h-6" />
              </motion.button>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 border-t border-gray-100">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <div className="flex items-center space-x-2">
                <Heart className="w-6 h-6 text-rose-400" fill="currentColor" />
                <span className="text-xl font-light text-gray-800">Moments</span>
              </div>
              <div className="flex items-center space-x-6 text-sm text-gray-500">
                <a href="#" className="hover:text-gray-700 transition-colors">Privacy</a>
                <a href="#" className="hover:text-gray-700 transition-colors">Terms</a>
                <a 
                  href="https://github.com/Subhrajeet1234/Moments-in" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-gray-700 transition-colors flex items-center space-x-1"
                >
                  <Github className="w-4 h-4" />
                  <span>GitHub</span>
                </a>
              </div>
              <p className="text-sm text-gray-500">
                {new Date().getFullYear()} Moments. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

// Data
const stats = [
  { value: "10K+", label: "Photos Processed" },
  { value: "500+", label: "Events Hosted" },
  { value: "98%", label: "Match Accuracy" },
  { value: "< 3s", label: "Search Time" },
];

const whatIsMoments = [
  {
    icon: <Users className="w-8 h-8 text-rose-400" />,
    title: "For Event Organizers",
    description:
      "Upload all event photos to a secure gallery. Share a simple link or QR code with your guests.",
  },
  {
    icon: <Camera className="w-8 h-8 text-amber-500" />,
    title: "For Guests",
    description:
      "Take a quick selfie and instantly discover all photos featuring you from the event.",
  },
  {
    icon: <Zap className="w-8 h-8 text-rose-400" />,
    title: "AI-Powered",
    description:
      "Advanced facial recognition technology ensures accurate matching within seconds.",
  },
];

const howItWorks = [
  {
    icon: <Upload className="w-7 h-7 text-rose-400" />,
    title: "Upload Photos",
    description:
      "Event photographer uploads all photos to the Moments platform securely.",
  },
  {
    icon: <Search className="w-7 h-7 text-amber-500" />,
    title: "Take a Selfie",
    description:
      "Guests take a quick selfie which is processed by our AI for matching.",
  },
  {
    icon: <Download className="w-7 h-7 text-rose-400" />,
    title: "Get Your Photos",
    description:
      "Instantly view and download all photos featuring you from the event.",
  },
];

const freePlanFeatures = [
  "Up to 100 photos per event",
  "Basic facial recognition",
  "7-day photo storage",
  "Standard support",
  "Watermarked downloads",
];

const proPlanFeatures = [
  "Unlimited photos per event",
  "Advanced AI recognition",
  "90-day photo storage",
  "Priority support",
  "High-resolution downloads",
  "Custom branding",
  "Analytics dashboard",
  "QR code generation",
];

const poweredBy = [
  { name: "React", icon: <Zap className="w-5 h-5" /> },
  { name: "Next.js", icon: <Zap className="w-5 h-5" /> },
  { name: "TensorFlow", icon: <Sparkles className="w-5 h-5" /> },
  { name: "AWS", icon: <Shield className="w-5 h-5" /> },
  { name: "Vercel", icon: <Star className="w-5 h-5" /> },
];

// Main export wrapper with GoogleOAuthProvider
export default function LandingPage(props: LandingPageProps) {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <LandingPageContent {...props} />
    </GoogleOAuthProvider>
  );
}
