import axios from 'axios';

// Base URL for the backend API
const API_BASE_URL = 'http://localhost:8080';

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// TypeScript interfaces based on backend DTOs

export interface LoginRequest {
  email: string;
  password: string;
}

export interface JwtResponse {
  token: string;
  type: string;
  role: string;
  firstName: string;
  lastName: string;
}

export interface RegistrationDTO {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  address?: string;
  phoneNumber?: string;
  specialization?: string;
  experience?: number;
  licenseNumber?: string;
  petStoreName?: string;
  petClinicLocation?: string;
  fieldType?: string;
  providerAddress?: string;
  city?: string;
  houseVisit?: boolean;
  businessContactNumber?: string;
  onlineService?: boolean;
  rating?: number;
  latitude: number;
  longitude: number;
}

export interface ResetPasswordDTO {
  token: string;
  newPassword: string;
}

export interface BookingDTO {
  id: number;
  customerId: number;
  packageId: number;
  providerId: number;
  providerPhoneNumber: string;
  providerName?: string;
  bookingDate: string;
  status: string;
  totalPrice: number;
  createdAt: string;
  updatedAt: string;
  completedAt: string;
  otp: string;
  latitude?: number;
  longitude?: number;
  requestType?: string; // CONFIRMED, SPECIFIC, DISCOVERY
}

export interface PetDTO {
  id?: number;
  name: string;
  age?: number;
  breed: string;
  gender: string;
  weight?: number;
  color?: string;
}

export interface CustomerProfile {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  address: string;
}

export interface CartItemDto {
  id?: number;
  packageId: number;
  name?: string;
  qty: number;
  unitPrice?: number;
}

export interface CartDto {
  userId: number;
  items: CartItemDto[];
  total: number;
}

export interface CartMergeRequest {
  items: CartItemDto[];
}

export interface CompleteRequestDTO {
  otp: string;
}

export interface PackageRequestDTO {
  id?: number;
  providerId?: number;
  providerEmail?: string;
  name: string;
  description: string;
  price: number;
  duration: string;
  type: string;
}

export interface Provider {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  specialization: string;
  experience: number;
  licenseNumber: string;
  petStoreName: string;
  rating: number;
  petClinicLocation: string;
  phoneNumber: string;
  fieldType: string;
  address: string;
  city: string;
  houseVisit: string;
  businessContactNumber: string;
  onlineService: string;
}

// Auth API functions
export const authAPI = {
  login: async (loginRequest: LoginRequest): Promise<JwtResponse> => {
    const response = await api.post<JwtResponse>('/api/auth/login', loginRequest);
    return response.data;
  },

  registerCustomer: async (registrationDTO: RegistrationDTO): Promise<JwtResponse> => {
    const response = await api.post<JwtResponse>('/api/auth/register/customer', registrationDTO);
    return response.data;
  },

  registerProvider: async (registrationDTO: RegistrationDTO): Promise<JwtResponse> => {
    const response = await api.post<JwtResponse>('/api/auth/register/provider', registrationDTO);
    return response.data;
  },

  verifyOtp: async (email: string, otp: string): Promise<JwtResponse> => {
    const response = await api.post<JwtResponse>('/api/auth/verify-otp', null, {
      params: { email, otp }
    });
    return response.data;
  },

  verifyEmail: async (token: string): Promise<string> => {
    const response = await api.get<string>('/api/auth/verify-email', {
      params: { token }
    });
    return response.data;
  },

  forgotPassword: async (email: string): Promise<string> => {
    const response = await api.post<string>('/api/auth/forgot-password', null, {
      params: { email }
    });
    return response.data;
  },

  resetPassword: async (resetPasswordDTO: ResetPasswordDTO): Promise<string> => {
    const response = await api.post<string>('/api/auth/reset-password', resetPasswordDTO);
    return response.data;
  },
};

// Cart API functions
export const cartApi = {
  mergeCart: async (cartMergeRequest: CartMergeRequest): Promise<CartDto> => {
    const response = await api.post<CartDto>('/api/cart/merge', cartMergeRequest);
    return response.data;
  },

  getCart: async (): Promise<CartDto> => {
    const response = await api.get<CartDto>('/api/cart');
    return response.data;
  },

  addItem: async (cartItemDto: CartItemDto): Promise<CartDto> => {
    const response = await api.post<CartDto>('/api/cart/add', cartItemDto);
    return response.data;
  },

  clearCart: async (): Promise<void> => {
    await api.delete('/api/cart/clear');
  },

  clearSpecificItem: async (id: number): Promise<void> => {
    await api.delete(`/api/cart/clearSpecific/${id}`);
  },
};

// Customer API functions
export const customerApi = {
  createBooking: async (packageId: number, latitude?: number, longitude?: number): Promise<BookingDTO> => {
    const response = await api.post<BookingDTO>('/api/customer/create', null, {
      params: { packageId, latitude, longitude }
    });
    return response.data;
  },

  getBookingsByCustomerEmail: async (customerEmail: string): Promise<BookingDTO[]> => {
    const response = await api.get<BookingDTO[]>('/api/customer/by-customer-email', {
      params: { customerEmail }
    });
    return response.data;
  },

  addPet: async (petDTO: PetDTO): Promise<PetDTO> => {
    const response = await api.post<PetDTO>('/api/customer/addPet', petDTO);
    return response.data;
  },

  getPets: async (customerId: number): Promise<PetDTO[]> => {
    const response = await api.get<PetDTO[]>(`/api/customer/${customerId}/pets`);
    return response.data;
  },

  deletePet: async (petId: number): Promise<void> => {
    await api.delete(`/api/customer/deletePet/${petId}`);
  },

  updatePet: async (petId: number, petDTO: PetDTO): Promise<PetDTO> => {
    const response = await api.put<PetDTO>(`/api/customer/updatePet/${petId}`, petDTO);
    return response.data;
  },

  getProfile: async (): Promise<CustomerProfile> => {
    const response = await api.get<CustomerProfile>('/api/customer/profile');
    return response.data;
  },

  getAddress: async (): Promise<{ address: string }> => {
    const response = await api.get<{ address: string }>('/api/customer/address');
    return response.data;
  },

  cancelBooking: async (bookingId: number): Promise<BookingDTO> => {
    const response = await api.post<BookingDTO>(`/api/customer/cancel/${bookingId}`);
    return response.data;
  },

  deleteCustomer: async (id: number): Promise<void> => {
    await api.delete(`/api/customer/${id}`);
  },
};

// Provider API functions
export const providerApi = {
  addPackage: async (packageRequestDTO: PackageRequestDTO): Promise<PackageRequestDTO> => {
    const response = await api.post<PackageRequestDTO>('/api/packages/add', packageRequestDTO);
    return response.data;
  },

  getAllPackages: async (): Promise<PackageRequestDTO[]> => {
    const response = await api.get<PackageRequestDTO[]>('/api/packages/all');
    return response.data;
  },

  getProviderBookings: async (latitude?: number, longitude?: number): Promise<BookingDTO[]> => {
    const response = await api.get<BookingDTO[]>('/api/provider/bookings', {
      params: { latitude, longitude }
    });
    return response.data;
  },

  confirmBooking: async (bookingId: number): Promise<BookingDTO> => {
    const maxRetries = 3;
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await api.put<BookingDTO>(`/api/provider/${bookingId}/confirm`);
        return response.data;
      } catch (error) {
        lastError = error;

        // Don't retry on client errors (4xx) except 409 Conflict
        const status = error.response?.status;
        if (status >= 400 && status < 500 && status !== 409) {
          throw error;
        }

        // Wait before retry (exponential backoff)
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }
    throw lastError;
  },

  cancelBooking: async (bookingId: number): Promise<BookingDTO> => {
    const response = await api.put<BookingDTO>(`/api/provider/${bookingId}/cancel`);
    return response.data;
  },

  completeBooking: async (bookingId: number, completeRequestDTO: CompleteRequestDTO): Promise<BookingDTO> => {
    const response = await api.put<BookingDTO>(`/api/provider/${bookingId}/complete`, completeRequestDTO);
    return response.data;
  },

  deleteCustomer: async (id: number): Promise<void> => {
    await api.delete(`/api/provider/${id}`);
  },

  getProviderProfile: async (): Promise<Provider> => {
    const response = await api.get<Provider>('/api/provider/profile');
    return response.data;
  },
};

export default api;
