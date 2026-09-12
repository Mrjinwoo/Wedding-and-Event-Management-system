import { z } from 'zod'

export const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^(\+63|0)[0-9]{10}$/, 'Enter a valid PH phone number (e.g. 09171234567)').optional().or(z.literal('')),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Must contain at least one special character'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
})

export const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Must contain at least one special character'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export const bookingSchema = z.object({
  venueId: z.string().uuid('Invalid venue'),
  packageId: z.string().uuid().optional(),
  eventType: z.string().min(1, 'Event type is required'),
  eventDate: z.string().min(1, 'Event date is required'),
  guestCount: z.number().int().min(1, 'Guest count must be at least 1').max(1000),
  notes: z.string().max(500).optional(),
})

export const messageSchema = z.object({
  receiverId: z.string().uuid('Invalid receiver'),
  content: z.string().min(1, 'Message cannot be empty').max(1000),
  bookingId: z.string().uuid().optional(),
})

export const venueSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  location: z.string().min(2).max(200),
  capacity: z.number().int().min(1),
  price: z.number().min(0),
  imageUrl: z.string().url().optional().or(z.literal('')),
  isActive: z.boolean().default(true),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type BookingInput = z.infer<typeof bookingSchema>
export type MessageInput = z.infer<typeof messageSchema>
export type VenueInput = z.infer<typeof venueSchema>
