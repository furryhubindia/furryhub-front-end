import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI, RegistrationDTO, JwtResponse } from '@/lib/api';
import { useNavigate } from 'react-router-dom';

interface User {
  email: string;
  role: 'CUSTOMER' | 'PROVIDER' | string;
  firstName?: string;
  lastName?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<{ role: 'CUSTOMER' | 'PROVIDER' }>;
  registerCustomer: (userData: RegistrationDTO) => Promise<void>;
  registerProvider: (userData: RegistrationDTO) => Promise<{ success: boolean; errors?: Record<string, string>; data?: unknown }>;
  verifyOtp: (email: string, otp: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
      // TODO: Decode token to get user info or fetch user profile
    }
  }, []);

  const login = async (email: string, password: string) => {
    const response = await authAPI.login({ email, password });
    setToken(response.token);
    localStorage.setItem('token', response.token);
    setUser({
      email,
      role: response.role,
      firstName: response.firstName,
      lastName: response.lastName
    });
    // Redirect based on role
    if (response.role === 'CUSTOMER') {
      navigate('/dashboard');
    } else if (response.role === 'PROVIDER') {
      navigate('/furry-squad-dashboard');
    }
    return { role: response.role as 'CUSTOMER' | 'PROVIDER' };
  };

  const registerCustomer = async (userData: RegistrationDTO) => {
    const response = await authAPI.registerCustomer(userData);
    setToken(response.token);
    localStorage.setItem('token', response.token);
    setUser({
      email: userData.email,
      role: response.role,
      firstName: response.firstName,
      lastName: response.lastName
    });
    // Navigate to main page after successful registration
    navigate('/');
  };

  const registerProvider = async (userData: RegistrationDTO) => {
    try {
      const response = await authAPI.registerProvider(userData);
      if (typeof response === 'string') {
        // Registration successful but no token returned (for providers without immediate login)
        return { success: true };
      } else {
        // Set token and user after successful registration
        setToken(response.token);
        localStorage.setItem('token', response.token);
        setUser({
          email: userData.email,
          role: response.role,
          firstName: response.firstName,
          lastName: response.lastName
        });
        // Navigate to main page after successful registration
        navigate('/');
        return { success: true };
      }
    } catch (error: unknown) {
      console.error('Provider registration error:', error);
      // Check if error is validation error object
      if (error && typeof error === 'object') {
        const errorData = error as Record<string, string>;
        // If it has field-specific errors, return them
        if (Object.keys(errorData).length > 0) {
          return {
            success: false,
            errors: errorData
          };
        }
      }

      // Handle Axios error specifically
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: unknown } };
        if (axiosError.response && axiosError.response.data) {
          const responseData = axiosError.response.data;
          if (typeof responseData === 'object' && responseData !== null && 'general' in responseData) {
            return {
              success: false,
              errors: {
                general: (responseData as { general: string }).general
              }
            };
          }
        }
      }

      return {
        success: false,
        errors: {
          general: 'Registration failed. Please try again.'
        }
      };
    }
  };

  const verifyOtp = async (email: string, otp: string) => {
    const response = await authAPI.verifyOtp(email, otp);
    setToken(response.token);
    localStorage.setItem('token', response.token);
    setUser({
      email,
      role: response.role,
      firstName: response.firstName,
      lastName: response.lastName
    });
    // Redirect based on role
    if (response.role === 'CUSTOMER') {
      navigate('/dashboard');
    } else if (response.role === 'PROVIDER') {
      navigate('/furry-squad-dashboard');
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    // Note: navigate('/') is handled by the caller to avoid double navigation
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    registerCustomer,
    registerProvider,
    verifyOtp,
    logout,
    isAuthenticated: !!token,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
