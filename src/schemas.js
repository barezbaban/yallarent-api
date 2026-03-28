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

const createBooking = z.object({
  carId: uuid,
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be YYYY-MM-DD'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be YYYY-MM-DD'),
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

module.exports = {
  signup,
  login,
  updateProfile,
  createBooking,
  addFavorite,
  carListQuery,
  uuidParam,
  carIdParam,
};
