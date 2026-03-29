const { z } = require('zod');

const uuidPattern = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
const uuid = z.string().regex(uuidPattern, 'Invalid ID format');

const phone = z.string().min(1, 'Phone is required').regex(/^\+?[0-9]{7,15}$/, 'Invalid phone number format');

const signup = z.object({
  fullName: z.string().min(1, 'Full name is required').max(100),
  phone,
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  city: z.string().max(100).optional().default(''),
});

const login = z.object({
  phone: z.string().min(1, 'Phone is required'),
  password: z.string().min(1, 'Password is required'),
});

const updateProfile = z.object({
  fullName: z.string().min(1, 'Name is required').max(100).optional(),
  city: z.string().max(100).optional(),
});

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

const createBooking = z.object({
  carId: uuid,
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be YYYY-MM-DD'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be YYYY-MM-DD'),
  pickupTime: z.string().regex(timePattern, 'Time must be HH:MM').optional().default('09:00'),
  dropoffTime: z.string().regex(timePattern, 'Time must be HH:MM').optional().default('09:00'),
  pickupLocation: z.string().max(200).optional().default(''),
  dropoffLocation: z.string().max(200).optional().default(''),
}).refine((data) => new Date(data.endDate) > new Date(data.startDate), {
  message: 'End date must be after start date',
});

const addFavorite = z.object({
  carId: uuid,
});

const carListQuery = z.object({
  city: z.string().max(100).optional(),
  min_price: z.coerce.number().min(0).optional(),
  max_price: z.coerce.number().min(0).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

const uuidParam = z.object({
  id: uuid,
});

const carIdParam = z.object({
  carId: uuid,
});

const requestReset = z.object({
  phone: z.string().min(1, 'Phone is required'),
});

const verifyOtp = z.object({
  phone: z.string().min(1, 'Phone is required'),
  otp: z.string().length(6, 'Code must be 6 digits'),
});

const resetPassword = z.object({
  phone: z.string().min(1, 'Phone is required'),
  resetToken: z.string().min(1, 'Reset token is required'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

const registerDevice = z.object({
  pushToken: z.string().min(1, 'Push token is required'),
  platform: z.enum(['ios', 'android']).optional().default('ios'),
});

const unregisterDevice = z.object({
  pushToken: z.string().min(1, 'Push token is required'),
});

const sendNotification = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  body: z.string().min(1, 'Body is required').max(500),
});

module.exports = {
  signup,
  login,
  updateProfile,
  createBooking,
  addFavorite,
  carListQuery,
  uuidParam,
  carIdParam,
  requestReset,
  verifyOtp,
  resetPassword,
  registerDevice,
  unregisterDevice,
  sendNotification,
};
