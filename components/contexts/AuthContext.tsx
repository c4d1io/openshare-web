"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useCallback,
} from "react";
import { apiClient } from "@/lib/apiClient";

interface User {
  consumer_id: number;
  phone_number: string;
  full_name?: string;
  is_new?: boolean;
  email?: string;
  picture?: string;
  auth_type?: "phone" | "google";
}

interface GoogleUser {
  email: string;
  name: string;
  picture: string;
  sub: string;
}

interface Tokens {
  refresh: string;
  access: string;
}

interface SendOtpResponse {
  success: boolean;
  message: string;
  data?: {
    consumer_id: number;
    phone_number: string;
    is_new: boolean;
  };
  errors: null;
}

interface VerifyOtpResponse {
  success: boolean;
  message: string;
  data: {
    consumer_id: number;
    phone_number: string;
    tokens: Tokens;
  };
  errors: null;
}

interface AuthContextType {
  user: User | null;
  tokens: Tokens | null;
  isLoading: boolean;
  error: string | null;
  sendOtp: (
    phone: string,
    fullName: string
  ) => Promise<{
    success: boolean;
    message: string;
    data?: any;
  }>;
  verifyOtp: (
    phone: string,
    otp: string
  ) => Promise<{
    success: boolean;
    message: string;
    data?: any;
  }>;
  loginWithGoogle: (googleUser: GoogleUser) => Promise<{
    success: boolean;
    message: string;
    data?: any;
  }>;
  logout: () => void;
  clearError: () => void;
  isAuthenticated: boolean;
  checkAuth: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
  eventCode?: string;
}

export const AuthProvider = ({
  children,
  eventCode = "demo-event",
}: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<Tokens | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedUser = localStorage.getItem("moments_user");
      const savedTokens = localStorage.getItem("moments_tokens");

      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }

      if (savedTokens) {
        const parsedTokens = JSON.parse(savedTokens);
        apiClient.setToken(parsedTokens.access);
        setTokens(parsedTokens);
      }

      setIsInitialized(true);
    }
  }, []);

  const formatPhoneNumber = (phone: string): string => {
    const digits = phone.replace(/\D/g, "");

    if (digits.length === 12 && digits.startsWith("91")) {
      return `+${digits}`;
    }

    if (digits.startsWith("0")) {
      return `+91${digits.substring(1)}`;
    }

    if (digits.length === 10) {
      return `+91${digits}`;
    }

    if (phone.startsWith("+")) {
      return phone;
    }

    return `+91${digits}`;
  };

  const checkAuth = (): boolean => {
    return !!(user && tokens?.access);
  };

  const sendOtp = async (
    phone: string,
    fullName: string
  ): Promise<{ success: boolean; message: string; data?: any }> => {
    setIsLoading(true);
    setError(null);

    try {
      const formattedPhone = formatPhoneNumber(phone);

      const payload = {
        phone_number: formattedPhone,
        full_name: fullName.trim(),
      };

      const response = await apiClient.post<SendOtpResponse>(
        `/consumers/register?event_code=${eventCode}`,
        payload
      );

      if (response.success) {
        const userData: User = {
          consumer_id: response.data?.consumer_id || 0,
          phone_number: response.data?.phone_number || formattedPhone,
          full_name: fullName.trim(),
          is_new: response.data?.is_new || false,
        };

        setUser(userData);
        localStorage.setItem("moments_user", JSON.stringify(userData));

        return {
          success: true,
          message: response.message,
          data: userData,
        };
      } else {
        throw new Error(response.message || "Failed to send OTP");
      }
    } catch (err: any) {
      const errorMessage = err.message || "Failed to send OTP";
      setError(errorMessage);
      return {
        success: false,
        message: errorMessage,
      };
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = async (
    phone: string,
    otp: string
  ): Promise<{ success: boolean; message: string; data?: any }> => {
    setIsLoading(true);
    setError(null);

    try {
      const formattedPhone = formatPhoneNumber(phone);

      const response = await apiClient.post<VerifyOtpResponse>(
        `/consumers/verify-otp?event_code=${eventCode}`,
        {
          phone_number: formattedPhone,
          otp: otp,
        }
      );

      if (response.success && response.data) {
        const existingUserStr = localStorage.getItem("moments_user");
        const existingUser = existingUserStr
          ? JSON.parse(existingUserStr)
          : null;

        const userData: User = {
          consumer_id: response.data.consumer_id,
          phone_number: response.data.phone_number,
          full_name: existingUser?.full_name || "",
          is_new: false,
        };

        setUser(userData);
        apiClient.setToken(response.data.tokens.access);
        setTokens(response.data.tokens);

        localStorage.setItem("moments_user", JSON.stringify(userData));
        localStorage.setItem(
          "moments_tokens",
          JSON.stringify(response.data.tokens)
        );

        return {
          success: true,
          message: response.message,
          data: {
            user: userData,
            tokens: response.data.tokens,
          },
        };
      } else {
        throw new Error(response.message || "Invalid OTP");
      }
    } catch (err: any) {
      const errorMessage = err.message || "Failed to verify OTP";
      setError(errorMessage);
      return {
        success: false,
        message: errorMessage,
      };
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = useCallback(async (
    googleUser: GoogleUser
  ): Promise<{ success: boolean; message: string; data?: any }> => {
    setIsLoading(true);
    setError(null);

    try {
      // For now, we're storing Google user locally
      // In the future, this will call the API to register/login the user
      const userData: User = {
        consumer_id: 0, // Will be set by API in future
        phone_number: "",
        full_name: googleUser.name,
        email: googleUser.email,
        picture: googleUser.picture,
        is_new: true,
        auth_type: "google",
      };

      // Create mock tokens for now - will be replaced by API response
      const mockTokens: Tokens = {
        access: `google_${googleUser.sub}_${Date.now()}`,
        refresh: `refresh_${googleUser.sub}_${Date.now()}`,
      };

      setUser(userData);
      setTokens(mockTokens);
      apiClient.setToken(mockTokens.access);

      localStorage.setItem("moments_user", JSON.stringify(userData));
      localStorage.setItem("moments_tokens", JSON.stringify(mockTokens));

      return {
        success: true,
        message: "Successfully logged in with Google",
        data: {
          user: userData,
          tokens: mockTokens,
        },
      };
    } catch (err: any) {
      const errorMessage = err.message || "Failed to login with Google";
      setError(errorMessage);
      return {
        success: false,
        message: errorMessage,
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = () => {
    setUser(null);
    setTokens(null);
    apiClient.clearToken();
    localStorage.removeItem("moments_user");
    localStorage.removeItem("moments_tokens");
  };

  const clearError = () => {
    setError(null);
  };

  useEffect(() => {
    const checkTokenExpiration = () => {
      if (!tokens?.access) return;

      try {
        const tokenParts = tokens.access.split(".");
        if (tokenParts.length !== 3) return;

        const payload = JSON.parse(atob(tokenParts[1]));
        const expirationTime = payload.exp * 1000;
        const currentTime = Date.now();

        if (expirationTime - currentTime < 5 * 60 * 1000) {
          logout();
        }
      } catch (error) {
        console.error("Error checking token expiration:", error);
      }
    };

    const interval = setInterval(checkTokenExpiration, 60 * 1000);
    checkTokenExpiration();

    return () => clearInterval(interval);
  }, [tokens]);

  const value: AuthContextType = {
    user,
    tokens,
    isLoading,
    error,
    sendOtp,
    verifyOtp,
    loginWithGoogle,
    logout,
    clearError,
    isAuthenticated: checkAuth(),
    checkAuth,
  };

  if (!isInitialized) {
    return null;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthStatus = () => {
  const { isAuthenticated, isLoading } = useAuth();
  return { isAuthenticated, isLoading };
};

export const useRequireAuth = () => {
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      console.log("User not authenticated");
    }
  }, [isAuthenticated, isLoading]);

  return { isAuthenticated, isLoading };
};
