/**
 * Zod validation schemas for API requests
 * Provides runtime validation for Group and NetworkService data
 */

import { z } from 'zod';
import { isValidIPAddress, isValidCIDR, isValidPortRange, isValidDomain } from './validation';

// Custom Zod refinements for network-specific validation
const ipAddressSchema = z.string().refine(isValidIPAddress, {
  message: 'Invalid IP address format'
});

const cidrSchema = z.string().refine(isValidCIDR, {
  message: 'Invalid CIDR notation format'
});

const portSchema = z.number().refine(isValidPortRange, {
  message: 'Port must be between 1 and 65535'
});

const domainSchema = z.string().refine(isValidDomain, {
  message: 'Invalid domain format'
});

// Service type — required by CreateNetworkServiceDto and the NetworkService entity.
const serviceTypeSchema = z.enum(
  ['web', 'database', 'api', 'storage', 'security', 'monitoring'],
  { error: 'Please select a valid service type' }
);

// Group validation schemas
export const CreateGroupSchema = z.object({
  name: z.string()
    .min(1, 'Group name is required')
    .max(100, 'Group name must be 100 characters or less')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Group name can only contain letters, numbers, underscores, and hyphens'),
  description: z.string()
    .max(500, 'Description must be 500 characters or less')
    .optional()
});

export const UpdateGroupSchema = z.object({
  name: z.string()
    .min(1, 'Group name is required')
    .max(100, 'Group name must be 100 characters or less')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Group name can only contain letters, numbers, underscores, and hyphens')
    .optional(),
  description: z.string()
    .max(500, 'Description must be 500 characters or less')
    .optional()
});

// NetworkService validation schemas
export const CreateNetworkServiceSchema = z.object({
  groupId: z.string()
    .min(1, 'Group ID is required'),
  name: z.string()
    .min(1, 'Service name is required')
    .max(100, 'Service name must be 100 characters or less'),
  type: serviceTypeSchema,
  domain: domainSchema,
  internalPorts: z.array(portSchema)
    .min(1, 'At least one internal port is required')
    .max(50, 'Maximum 50 internal ports allowed'),
  externalPorts: z.array(portSchema)
    .min(1, 'At least one external port is required')
    .max(50, 'Maximum 50 external ports allowed'),
  vlan: z.string()
    .max(50, 'VLAN must be 50 characters or less')
    .optional(),
  cidr: cidrSchema.optional(),
  ipAddress: ipAddressSchema.optional(),
  tags: z.array(z.string().max(50, 'Tag must be 50 characters or less'))
    .max(20, 'Maximum 20 tags allowed')
    .default([])
});

export const UpdateNetworkServiceSchema = z.object({
  groupId: z.string()
    .min(1, 'Group ID is required')
    .optional(),
  name: z.string()
    .min(1, 'Service name is required')
    .max(100, 'Service name must be 100 characters or less')
    .optional(),
  type: serviceTypeSchema.optional(),
  domain: domainSchema.optional(),
  internalPorts: z.array(portSchema)
    .min(1, 'At least one internal port is required')
    .max(50, 'Maximum 50 internal ports allowed')
    .optional(),
  externalPorts: z.array(portSchema)
    .min(1, 'At least one external port is required')
    .max(50, 'Maximum 50 external ports allowed')
    .optional(),
  vlan: z.string()
    .max(50, 'VLAN must be 50 characters or less')
    .optional(),
  cidr: cidrSchema.optional(),
  ipAddress: ipAddressSchema.optional(),
  tags: z.array(z.string().max(50, 'Tag must be 50 characters or less'))
    .max(20, 'Maximum 20 tags allowed')
    .optional()
});

// Service filter validation schema
export const ServiceFiltersSchema = z.object({
  groupId: z.string().optional(),
  vlan: z.string().optional(),
  tags: z.array(z.string()).optional(),
  ipAddress: ipAddressSchema.optional(),
  cidrRange: cidrSchema.optional(),
  domain: z.string().optional()
});

// Type exports for use in other modules
export type CreateGroupInput = z.infer<typeof CreateGroupSchema>;
export type UpdateGroupInput = z.infer<typeof UpdateGroupSchema>;
export type CreateNetworkServiceInput = z.infer<typeof CreateNetworkServiceSchema>;
export type UpdateNetworkServiceInput = z.infer<typeof UpdateNetworkServiceSchema>;
export type ServiceFiltersInput = z.infer<typeof ServiceFiltersSchema>;