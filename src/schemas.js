const { z } = require('zod');

const uuidPattern = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
const uuid = z.string().regex(uuidPattern, 'Invalid ID format');

const phone = z.string().min(1, 'Phone is required').regex(/^\+?[0-9]{7,15}$/, 'Invalid phone number format');

const signup = z.object({
  fullName: z.string().min(1, 'Full name is required').max(100),
  phone,
  email: z.string().email('Invalid email format').max(255).optional().default(''),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  city: z.string().max(100).optional().default(''),
});

const verifySignup = z.object({
  phone: z.string().min(1, 'Phone is required'),
  otp: z.string().length(6, 'Code must be 6 digits'),
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

const createReview = z.object({
  bookingId: uuid,
  rating: z.number().int().min(1).max(5),
  reviewText: z.string().max(1000).optional().default(''),
});

const sendSupportMessage = z.object({
  message: z.string().min(1, 'Message is required').max(2000),
});

// Chat system schemas
const createConversation = z.object({
  subject: z.string().max(200).optional(),
  category: z.enum(['booking_issue', 'payment_issue', 'car_problem', 'account_issue', 'general_inquiry', 'complaint', 'other']).optional().default('general_inquiry'),
  relatedBookingId: uuid.optional(),
  message: z.string().min(1, 'Message is required').max(2000),
});

const sendChatMessage = z.object({
  content: z.string().min(1, 'Message is required').max(2000),
  messageType: z.enum(['text', 'image', 'file', 'canned_response']).optional().default('text'),
});

const updateConversationSchema = z.object({
  status: z.enum(['open', 'waiting_on_customer', 'waiting_on_agent', 'resolved', 'closed']).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  assignedAgentId: uuid.nullable().optional(),
  subject: z.string().max(200).optional(),
});

const chatMessagesQuery = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
  before: z.string().optional(),
});

const conversationListQuery = z.object({
  status: z.enum(['open', 'waiting_on_customer', 'waiting_on_agent', 'resolved', 'closed']).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  category: z.enum(['booking_issue', 'payment_issue', 'car_problem', 'account_issue', 'general_inquiry', 'complaint', 'other']).optional(),
  assignedAgentId: uuid.optional(),
  unassigned: z.enum(['true', 'false']).optional(),
  search: z.string().max(100).optional(),
});

const createCannedResponseSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  content: z.string().min(1, 'Content is required').max(2000),
  category: z.string().max(50).optional().default('General'),
  shortcut: z.string().min(1, 'Shortcut is required').max(30),
});

const updateCannedResponseSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  content: z.string().min(1).max(2000).optional(),
  category: z.string().max(50).optional(),
  shortcut: z.string().min(1).max(30).optional(),
});

const addChatNote = z.object({
  content: z.string().min(1, 'Note content is required').max(2000),
});

const editMessage = z.object({
  content: z.string().min(1, 'Message is required').max(2000),
});

// Backoffice schemas
const backofficeLogin = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(1, 'Password is required'),
});

const createRole = z.object({
  name: z.string().min(1, 'Role name is required').max(100),
  description: z.string().max(500).optional().default(''),
  permissions: z.record(z.string(), z.boolean()),
});

const updateRole = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  permissions: z.record(z.string(), z.boolean()).optional(),
});

const createBackofficeUser = z.object({
  fullName: z.string().min(1, 'Full name is required').max(100),
  email: z.string().email('Valid email is required'),
  roleId: uuid,
});

const updateBackofficeUser = z.object({
  fullName: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  roleId: uuid.optional(),
  isActive: z.boolean().optional(),
});

module.exports = {
  signup,
  verifySignup,
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
  createReview,
  sendSupportMessage,
  backofficeLogin,
  createRole,
  updateRole,
  createBackofficeUser,
  updateBackofficeUser,
  createConversation,
  sendChatMessage,
  updateConversationSchema,
  chatMessagesQuery,
  conversationListQuery,
  createCannedResponseSchema,
  updateCannedResponseSchema,
  addChatNote,
  editMessage,
};
