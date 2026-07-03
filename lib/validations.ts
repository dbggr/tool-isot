/**
 * Zod validation schemas for frontend forms
 * Provides client-side validation for service and group forms
 */

import { z } from 'zod';

// Custom validation functions for network-specific data
const isValidIPAddress = (ip: string): boolean => {
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return ipv4Regex.test(ip);
};

const isValidPortRange = (port: number): boolean => {
  return Number.isInteger(port) && port >= 1 && port <= 65535;
};

const isValidVLAN = (vlan: number): boolean => {
  return Number.isInteger(vlan) && vlan >= 1 && vlan <= 4094;
};

const isValidDomain = (domain: string): boolean => {
  // Allow single-label domains (like localhost) or multi-label domains
  const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return domainRegex.test(domain) && domain.length <= 253;
};

// Service type enum for validation
const serviceTypes = ['web', 'database', 'api', 'storage', 'security', 'monitoring'] as const;

// IP address validation schema
const ipAddressSchema = z.string({ error: 'IP address is required' })
  .min(1, 'IP address is required')
  .refine(isValidIPAddress, {
    message: 'Invalid IP address format (e.g., 192.168.1.1)'
  });

// Port validation schema
const portSchema = z.number()
  .int('Port must be an integer')
  .refine(isValidPortRange, {
    message: 'Port must be between 1 and 65535'
  });

// VLAN validation schema
const vlanSchema = z.number()
  .int('VLAN ID must be an integer')
  .refine(isValidVLAN, {
    message: 'VLAN ID must be between 1 and 4094'
  });

// Domain validation schema
const domainSchema = z.string()
  .refine(isValidDomain, {
    message: 'Invalid domain format (e.g., example.com or localhost)'
  });

// Service validation schema for creation
export const createServiceSchema = z.object({
  name: z.string()
    .min(1, 'Service name is required')
    .max(100, 'Service name must be 100 characters or less')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Service name can only contain letters, numbers, underscores, and hyphens'),
  
  type: z.enum(serviceTypes, {
    error: 'Please select a valid service type'
  }),
  
  ipAddress: ipAddressSchema,
  
  internalPorts: z.array(portSchema, { error: 'At least one internal port is required' })
    .min(1, 'At least one internal port is required')
    .max(50, 'Maximum 50 internal ports allowed'),

  externalPorts: z.array(portSchema, { error: 'At least one external port is required' })
    .min(1, 'At least one external port is required')
    .max(50, 'Maximum 50 external ports allowed'),

  vlan: vlanSchema.optional(),

  domain: domainSchema.optional(),

  groupId: z.string()
    .min(1, 'Group selection is required')
    .uuid('Invalid group selection'),

  tags: z.array(z.string()).optional(),
});

// Service validation schema for editing (all fields optional except required ones)
export const updateServiceSchema = z.object({
  name: z.string()
    .min(1, 'Service name is required')
    .max(100, 'Service name must be 100 characters or less')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Service name can only contain letters, numbers, underscores, and hyphens')
    .optional(),
  
  type: z.enum(serviceTypes, {
    error: 'Please select a valid service type'
  }).optional(),
  
  ipAddress: ipAddressSchema.optional(),
  
  internalPorts: z.array(portSchema)
    .min(1, 'At least one internal port is required')
    .max(50, 'Maximum 50 internal ports allowed')
    .optional(),
  
  externalPorts: z.array(portSchema)
    .min(1, 'At least one external port is required')
    .max(50, 'Maximum 50 external ports allowed')
    .optional(),
  
  vlan: vlanSchema.optional(),
  
  domain: domainSchema.optional(),
  
  groupId: z.string()
    .min(1, 'Group selection is required')
    .uuid('Invalid group selection')
    .optional(),
  
  tags: z.array(z.string()).optional(),
});

// Group validation schema for creation
export const createGroupSchema = z.object({
  name: z.string()
    .min(1, 'Group name is required')
    .max(100, 'Group name must be 100 characters or less')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Group name can only contain letters, numbers, underscores, and hyphens'),
  
  description: z.string()
    .max(500, 'Description must be 500 characters or less')
    .optional()
});

// Group validation schema for editing
export const updateGroupSchema = z.object({
  name: z.string()
    .min(1, 'Group name is required')
    .max(100, 'Group name must be 100 characters or less')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Group name can only contain letters, numbers, underscores, and hyphens')
    .optional(),
  
  description: z.string()
    .max(500, 'Description must be 500 characters or less')
    .optional()
});

// Search and filter validation schemas
export const serviceFiltersSchema = z.object({
  search: z.string().optional(),
  group_id: z.string().uuid().optional(),
  type: z.enum(serviceTypes).optional(),
  vlan_id: vlanSchema.optional(),
  domain: z.string().optional()
});

export const queryParamsSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('asc'),
  group_id: z.string().uuid().optional(),
  type: z.enum(serviceTypes).optional()
});

// Bulk operations validation
export const bulkDeleteSchema = z.object({
  ids: z.array(z.string().uuid())
    .min(1, 'At least one item must be selected')
    .max(100, 'Maximum 100 items can be deleted at once')
});

export const bulkUpdateGroupSchema = z.object({
  ids: z.array(z.string().uuid())
    .min(1, 'At least one service must be selected'),
  group_id: z.string()
    .min(1, 'Group selection is required')
    .uuid('Invalid group selection')
});

// Type exports for use in components
export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
export type CreateGroupInput = z.infer<typeof createGroupSchema>;
export type UpdateGroupInput = z.infer<typeof updateGroupSchema>;
export type ServiceFiltersInput = z.infer<typeof serviceFiltersSchema>;
export type QueryParamsInput = z.infer<typeof queryParamsSchema>;
export type BulkDeleteInput = z.infer<typeof bulkDeleteSchema>;
export type BulkUpdateGroupInput = z.infer<typeof bulkUpdateGroupSchema>;

// Validation helper functions
export const validateServiceForm = (data: unknown) => {
  return createServiceSchema.safeParse(data);
};

export const validateGroupForm = (data: unknown) => {
  return createGroupSchema.safeParse(data);
};

export const validateServiceUpdate = (data: unknown) => {
  return updateServiceSchema.safeParse(data);
};

export const validateGroupUpdate = (data: unknown) => {
  return updateGroupSchema.safeParse(data);
};

// Field-level validation helpers for real-time validation
export const validateIPAddress = (ip: string) => {
  return ipAddressSchema.safeParse(ip);
};

export const validatePort = (port: number) => {
  return portSchema.safeParse(port);
};

export const validateVLAN = (vlan: number) => {
  return vlanSchema.safeParse(vlan);
};

export const validateDomain = (domain: string) => {
  return domainSchema.safeParse(domain);
};

// Group name uniqueness validation (to be used with API call)
export const createGroupNameUniqueSchema = (existingNames: string[]) => {
  return createGroupSchema.extend({
    name: z.string()
      .min(1, 'Group name is required')
      .max(100, 'Group name must be 100 characters or less')
      .regex(/^[a-zA-Z0-9_-]+$/, 'Group name can only contain letters, numbers, underscores, and hyphens')
      .refine(
        (name) => !existingNames.includes(name.toLowerCase()),
        { message: 'Group name already exists' }
      )
  });
};

export const updateGroupNameUniqueSchema = (existingNames: string[], currentName?: string) => {
  return updateGroupSchema.extend({
    name: z.string()
      .min(1, 'Group name is required')
      .max(100, 'Group name must be 100 characters or less')
      .regex(/^[a-zA-Z0-9_-]+$/, 'Group name can only contain letters, numbers, underscores, and hyphens')
      .refine(
        (name) => {
          if (currentName && name.toLowerCase() === currentName.toLowerCase()) {
            return true; // Allow keeping the same name
          }
          return !existingNames.includes(name.toLowerCase());
        },
        { message: 'Group name already exists' }
      )
      .optional()
  });
};