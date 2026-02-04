"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, AlertCircle, Phone, User, ShieldCheck } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/components/contexts/AuthContext";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import ReCAPTCHA from "react-google-recaptcha";

const RECAPTCHA_SITE_KEY = "6LccmU0sAAAAADUwBGUdIFu8vWLz7uGHYZ2qO6i4";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified: () => void;
}

const phoneNameSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Name must be at least 2 characters" })
    .max(50, { message: "Name cannot exceed 50 characters" })
    .regex(/^[a-zA-Z\s]+$/, {
      message: "Name can only contain letters and spaces",
    }),
  phone: z
    .string()
    .length(10, { message: "Phone number must be exactly 10 digits" })
    .regex(/^[6-9]\d{9}$/, {
      message: "Please enter a valid Indian mobile number",
    }),
});

const otpSchema = z.object({
  otp: z
    .string()
    .length(4, { message: "OTP must be exactly 4 digits" })
    .regex(/^\d{4}$/, { message: "OTP must contain only digits" }),
});

type PhoneNameFormData = z.infer<typeof phoneNameSchema>;
type OtpFormData = z.infer<typeof otpSchema>;

export default function AuthModal({
  isOpen,
  onClose,
  onVerified,
}: AuthModalProps) {
  const {
    sendOtp,
    verifyOtp,
    isLoading,
    error: authError,
    clearError,
  } = useAuth();
  const [step, setStep] = useState<"phone-name" | "otp">("phone-name");
  const [phoneSubmitted, setPhoneSubmitted] = useState("");
  const [countdown, setCountdown] = useState<number>(0);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  const {
    control: phoneNameControl,
    handleSubmit: handlePhoneNameSubmit,
    formState: { errors: phoneNameErrors, isValid: isPhoneNameValid },
    watch: watchPhoneName,
    reset: resetPhoneNameForm,
    trigger: triggerPhoneNameValidation,
    setError: setPhoneNameError,
    clearErrors: clearPhoneNameErrors,
  } = useForm<PhoneNameFormData>({
    resolver: async (data, context, options) => {
      // Use safeParse to prevent throwing
      const result = phoneNameSchema.safeParse(data);
      if (result.success) {
        return { values: result.data, errors: {} };
      }
      return {
        values: {},
        errors: result.error.issues.reduce((acc, issue) => {
          const path = issue.path.join(".");
          if (!acc[path]) {
            acc[path] = { type: issue.code, message: issue.message };
          }
          return acc;
        }, {} as Record<string, { type: string; message: string }>),
      };
    },
    mode: "onChange",
    defaultValues: {
      name: "",
      phone: "",
    },
  });

  const {
    control: otpControl,
    handleSubmit: handleOtpSubmit,
    formState: { errors: otpErrors, isValid: isOtpValid },
    reset: resetOtpForm,
    setError: setOtpError,
    clearErrors: clearOtpErrors,
    setValue: setOtpValue,
  } = useForm<OtpFormData>({
    resolver: async (data, context, options) => {
      // Use safeParse to prevent throwing
      const result = otpSchema.safeParse(data);
      if (result.success) {
        return { values: result.data, errors: {} };
      }
      return {
        values: {},
        errors: result.error.issues.reduce((acc, issue) => {
          const path = issue.path.join(".");
          if (!acc[path]) {
            acc[path] = { type: issue.code, message: issue.message };
          }
          return acc;
        }, {} as Record<string, { type: string; message: string }>),
      };
    },
    mode: "onChange",
    defaultValues: {
      otp: "",
    },
  });

  const phoneValue = watchPhoneName("phone");

  const handleRecaptchaChange = useCallback((token: string | null) => {
    setRecaptchaToken(token);
  }, []);

  const handleRecaptchaExpired = useCallback(() => {
    setRecaptchaToken(null);
  }, []);

  const formatDisplayPhone = (phone: string) => {
    if (!phone || phone.length !== 10) return "";
    return typeof window !== "undefined" && window.innerWidth < 640
      ? `+91 ${phone.slice(0, 5)} ${phone.slice(5, 10)}`
      : `+91 ${phone}`;
  };

  const formatPhoneInput = (value: string) => {
    const digits = value.replace(/\D/g, "");

    if (digits.startsWith("0")) {
      return digits.substring(1);
    }

    if (digits.length <= 10) {
      return digits;
    }

    return value;
  };

  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY;

      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";
      document.body.style.overflow = "hidden";

      return () => {
        const scrollY = parseInt(document.body.style.top || "0") * -1;
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.width = "";
        document.body.style.overflow = "";
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [countdown]);

  const onPhoneNameSubmit = async (data: PhoneNameFormData) => {
    clearError();
    clearPhoneNameErrors();

    // Validate reCAPTCHA
    if (!recaptchaToken) {
      setPhoneNameError("root", {
        type: "manual",
        message: "Please complete the reCAPTCHA verification",
      });
      return;
    }

    try {
      const result = await sendOtp(data.phone, data.name.trim());

      if (result.success) {
        setPhoneSubmitted(data.phone);
        setStep("otp");
        setCountdown(30);
        resetOtpForm();
        // Reset reCAPTCHA after successful submission
        recaptchaRef.current?.reset();
        setRecaptchaToken(null);
      } else {
        setPhoneNameError("root", {
          type: "manual",
          message: result.message || "Failed to send OTP",
        });
        // Reset reCAPTCHA on failure so user can try again
        recaptchaRef.current?.reset();
        setRecaptchaToken(null);
      }
    } catch (err: any) {
      setPhoneNameError("root", {
        type: "manual",
        message: err.message || "Failed to send OTP",
      });
      // Reset reCAPTCHA on error
      recaptchaRef.current?.reset();
      setRecaptchaToken(null);
    }
  };

  const onOtpSubmit = async (data: OtpFormData) => {
    clearError();
    clearOtpErrors();

    try {
      const result = await verifyOtp(phoneSubmitted, data.otp);

      if (result.success) {
        onVerified();
        onClose();
        resetForm();
      } else {
        setOtpError("root", {
          type: "manual",
          message: result.message || "Failed to verify OTP",
        });
      }
    } catch (err: any) {
      setOtpError("root", {
        type: "manual",
        message: err.message || "Failed to verify OTP",
      });
    }
  };

  const handleResendOtp = async () => {
    clearError();
    clearOtpErrors();

    const currentPhone = watchPhoneName("phone");
    const currentName = watchPhoneName("name");

    if (!currentPhone || !currentName) {
      setOtpError("root", {
        type: "manual",
        message: "Please go back and re-enter your details",
      });
      return;
    }

    const result = await sendOtp(currentPhone, currentName.trim());

    if (result.success) {
      setOtpValue("otp", "");
      setCountdown(30);
    } else {
      setOtpError("root", {
        type: "manual",
        message: result.message || "Failed to resend OTP",
      });
    }
  };

  const handleBackToPhoneName = () => {
    setStep("phone-name");
    clearError();
    clearOtpErrors();
    setCountdown(0);
  };

  const resetForm = () => {
    resetPhoneNameForm();
    resetOtpForm();
    setPhoneSubmitted("");
    setStep("phone-name");
    setCountdown(0);
    clearError();
    clearPhoneNameErrors();
    clearOtpErrors();
    // Reset reCAPTCHA
    recaptchaRef.current?.reset();
    setRecaptchaToken(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      clearError();
      clearPhoneNameErrors();
      clearOtpErrors();
    }
  }, [isOpen]);

  useEffect(() => {
    if (phoneValue) {
      // Wrap in try-catch to prevent unhandled promise rejection from Zod validation
      triggerPhoneNameValidation("phone").catch(() => {
        // Validation errors are already displayed in the form UI
      });
    }
  }, [phoneValue, triggerPhoneNameValidation]);

  const getFormError = () => {
    if (step === "phone-name") {
      return phoneNameErrors.root?.message || authError;
    } else {
      return otpErrors.root?.message || authError;
    }
  };

  const formError = getFormError();

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          <motion.div
            className="bg-white rounded-2xl w-full max-w-md mx-auto shadow-xl relative overflow-hidden"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <button
              onClick={handleClose}
              className="absolute right-3 top-3 sm:right-4 sm:top-4 text-gray-400 hover:text-gray-600 z-10 bg-white rounded-full p-1"
              disabled={isLoading}
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            <div className="p-4 sm:p-6 md:p-8">
              <div className="text-center mb-4 sm:mb-6">
                <h2 className="text-xl sm:text-2xl font-medium text-gray-900 mb-1 sm:mb-2">
                  {step === "phone-name" ? "Welcome to Moments" : "Verify OTP"}
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 px-2">
                  {step === "phone-name"
                    ? "Enter your details to find your wedding photos"
                    : ` 4-digit verification code sent to ${formatDisplayPhone(phoneSubmitted)}`}
                </p>
              </div>

              {formError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-3 sm:mb-4 p-2 sm:p-3 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-2"
                >
                  <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs sm:text-sm text-red-700 break-words">
                    {formError}
                  </p>
                </motion.div>
              )}

              {step === "phone-name" && (
                <form
                  onSubmit={handlePhoneNameSubmit(onPhoneNameSubmit, () => {
                    // Handle validation errors gracefully - they're already displayed in the form
                  })}
                  className="space-y-3 sm:space-y-4"
                >
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                      <Controller
                        name="name"
                        control={phoneNameControl}
                        render={({ field }) => (
                          <input
                            type="text"
                            placeholder="Enter your full name"
                            {...field}
                            className={`w-full border rounded-lg sm:rounded-xl pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 text-sm sm:text-base focus:outline-none focus:ring-2 disabled:opacity-50 ${
                              phoneNameErrors.name
                                ? "border-red-300 focus:ring-red-300"
                                : "border-gray-200 focus:ring-rose-300"
                            }`}
                            disabled={isLoading}
                            autoComplete="name"
                          />
                        )}
                      />
                    </div>
                    {phoneNameErrors.name && (
                      <p className="mt-1 text-xs sm:text-sm text-red-600">
                        {phoneNameErrors.name.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                      Phone Number
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                        <span className="text-gray-700 font-medium text-sm sm:text-base">
                          +91
                        </span>
                        <div className="w-px h-3 sm:h-4 bg-gray-300" />
                      </div>
                      <Controller
                        name="phone"
                        control={phoneNameControl}
                        render={({ field }) => (
                          <input
                            type="tel"
                            placeholder="Enter 10-digit number"
                            {...field}
                            value={field.value}
                            onChange={(e) => {
                              const formattedValue = formatPhoneInput(
                                e.target.value
                              );
                              field.onChange(formattedValue);
                            }}
                            className={`w-full border rounded-lg sm:rounded-xl pl-14 sm:pl-16 pr-3 sm:pr-4 py-2.5 sm:py-3 text-sm sm:text-base focus:outline-none focus:ring-2 disabled:opacity-50 ${
                              phoneNameErrors.phone
                                ? "border-red-300 focus:ring-red-300"
                                : "border-gray-200 focus:ring-rose-300"
                            }`}
                            disabled={isLoading}
                            maxLength={10}
                            autoComplete="tel"
                          />
                        )}
                      />
                    </div>
                    {phoneNameErrors.phone ? (
                      <p className="mt-1 text-xs sm:text-sm text-red-600">
                        {phoneNameErrors.phone.message}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-500 mt-1 sm:mt-2">
                        {"We'll send an OTP to this number for verification"}
                      </p>
                  )}
                  </div>

                  {/* Google reCAPTCHA */}
                  <div className="flex flex-col items-center">
                    <div className="flex items-center gap-2 mb-2">
                      <ShieldCheck className="w-4 h-4 text-gray-500" />
                      <span className="text-xs text-gray-500">Security verification</span>
                    </div>
                    <div className="transform scale-[0.85] sm:scale-100 origin-center">
                      <ReCAPTCHA
                        ref={recaptchaRef}
                        sitekey={RECAPTCHA_SITE_KEY}
                        onChange={handleRecaptchaChange}
                        onExpired={handleRecaptchaExpired}
                        theme="light"
                        size="normal"
                      />
                    </div>
                    {!recaptchaToken && isPhoneNameValid && (
                      <p className="text-xs text-amber-600 mt-2">
                        Please complete the verification above
                      </p>
                    )}
                  </div>
                  
                  <button
                  type="submit"
                  disabled={!isPhoneNameValid || !recaptchaToken || isLoading}
                  className="w-full bg-gradient-to-r from-rose-400 to-amber-400 text-white py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow text-sm sm:text-base"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-spin" />
                        Sending OTP...
                      </>
                    ) : (
                      "Send OTP"
                    )}
                  </button>

                  <p className="text-xs text-gray-500 text-center mt-2 sm:mt-4 px-2">
                    By continuing, you agree to our Terms of Service and Privacy
                    Policy
                  </p>
                </form>
              )}

              {step === "otp" && (
                <form
                  onSubmit={handleOtpSubmit(onOtpSubmit, () => {
                    // Handle validation errors gracefully - they're already displayed in the form
                  })}
                  className="space-y-3 sm:space-y-4"
                >
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                      Enter OTP
                    </label>
                    <Controller
                      name="otp"
                      control={otpControl}
                      render={({ field }) => (
                        <input
                          type="text"
                          placeholder="0000"
                          {...field}
                          value={field.value}
                          onChange={(e) => {
                            const value = e.target.value
                              .replace(/\D/g, "")
                              .slice(0, 4);
                            field.onChange(value);
                          }}
                          className={`w-full border rounded-lg sm:rounded-xl px-3 sm:px-4 py-3 sm:py-4 tracking-widest text-center text-xl sm:text-2xl font-medium focus:outline-none focus:ring-2 disabled:opacity-50 ${
                            otpErrors.otp
                              ? "border-red-300 focus:ring-red-300"
                              : "border-gray-200 focus:ring-rose-300"
                          }`}
                          disabled={isLoading}
                          autoComplete="one-time-code"
                          maxLength={4}
                        />
                      )}
                    />
                    {otpErrors.otp && (
                      <p className="mt-1 text-xs sm:text-sm text-red-600 text-center">
                        {otpErrors.otp.message}
                      </p>
                    )}
                  </div>

                  <div className="flex space-x-2 sm:space-x-3">
                    <button
                      type="button"
                      onClick={handleBackToPhoneName}
                      className="flex-1 border border-gray-300 text-gray-700 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-medium hover:bg-gray-50 disabled:opacity-50 text-sm sm:text-base"
                      disabled={isLoading}
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={!isOtpValid || isLoading}
                      className="flex-1 bg-gradient-to-r from-rose-400 to-amber-400 text-white py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-sm sm:text-base"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        "Verify & Continue"
                      )}
                    </button>
                  </div>

                  <div className="text-center">
                    <p className="text-xs sm:text-sm text-gray-600 mb-1 sm:mb-2">
                      {countdown > 0 ? (
                        <span>Resend OTP in {formatCountdown(countdown)}</span>
                      ) : (
                        "Didn't receive the code?"
                      )}
                    </p>
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={isLoading || countdown > 0}
                      className={`text-xs sm:text-sm font-medium disabled:opacity-50 ${
                        countdown > 0
                          ? "text-gray-400 cursor-not-allowed"
                          : "text-rose-500 hover:text-rose-600"
                      }`}
                    >
                      Resend OTP
                    </button>
                  </div>

                  <div className="pt-3 sm:pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-500 text-center">
                      Having trouble receiving OTP? Try again or contact support
                    </p>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
