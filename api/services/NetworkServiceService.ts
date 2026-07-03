/**
 * NetworkService service layer
 * Handles business logic for NetworkService operations
 */

import type { 
  NetworkService, 
  CreateNetworkServiceDto, 
  UpdateNetworkServiceDto, 
  ServiceFilters 
} from '../models/NetworkService';
import type { NetworkServiceRepository } from '../repositories/NetworkServiceRepository';
import type { GroupRepository } from '../repositories/GroupRepository';
import { SQLiteNetworkServiceRepository } from '../repositories/NetworkServiceRepository';
import { SQLiteGroupRepository } from '../repositories/GroupRepository';
import { CreateNetworkServiceSchema, UpdateNetworkServiceSchema, ServiceFiltersSchema } from '../utils/schemas';
import { ValidationError, NotFoundError, ConflictError } from '../utils/errors';
import { ZodError } from 'zod';

export interface ServiceValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface NetworkServiceService {
  createService(data: CreateNetworkServiceDto): Promise<NetworkService>;
  getService(id: string): Promise<NetworkService>;
  getAllServices(filters?: ServiceFilters): Promise<NetworkService[]>;
  updateService(id: string, data: UpdateNetworkServiceDto): Promise<NetworkService>;
  deleteService(id: string): Promise<void>;
  getServicesByGroup(groupId: string): Promise<NetworkService[]>;
  validateServiceData(data: any): ServiceValidationResult;
}

export class DefaultNetworkServiceService implements NetworkServiceService {
  private networkServiceRepository: NetworkServiceRepository;
  private groupRepository: GroupRepository;

  constructor(
    networkServiceRepository?: NetworkServiceRepository,
    groupRepository?: GroupRepository
  ) {
    this.networkServiceRepository = networkServiceRepository || new SQLiteNetworkServiceRepository();
    this.groupRepository = groupRepository || new SQLiteGroupRepository();
  }

  /**
   * Create a new network service with validation
   */
  async createService(data: CreateNetworkServiceDto): Promise<NetworkService> {
    // Validate input data
    try {
      const validatedData = CreateNetworkServiceSchema.parse(data);
      
      // Validate that the group exists
      const group = await this.groupRepository.findById(validatedData.groupId);
      if (!group) {
        throw new ValidationError(`Group with id '${validatedData.groupId}' does not exist`);
      }

      return await this.networkServiceRepository.create(validatedData);
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.issues.map(err => `${err.path.join('.')}: ${err.message}`);
        throw new ValidationError(`Validation failed: ${errorMessages.join(', ')}`);
      }
      throw error;
    }
  }

  /**
   * Get a network service by ID
   */
  async getService(id: string): Promise<NetworkService> {
    if (!id || typeof id !== 'string' || id.trim() === '') {
      throw new ValidationError('Service ID is required and must be a non-empty string');
    }

    const service = await this.networkServiceRepository.findById(id);
    if (!service) {
      throw new NotFoundError('NetworkService', id);
    }

    return service;
  }

  /**
   * Get all network services with optional filtering
   */
  async getAllServices(filters?: ServiceFilters): Promise<NetworkService[]> {
    // Validate filters if provided
    if (filters) {
      // Create a copy of filters for validation, handling cidrRange specially
      const filtersForValidation = { ...filters };
      
      // For cidrRange, we allow partial matching (not full CIDR validation)
      // but we still want to validate if it looks like a valid CIDR when it's a complete one
      if (filters.cidrRange) {
        // If it looks like a complete CIDR (contains /), validate it fully
        if (filters.cidrRange.includes('/')) {
          try {
            const tempFilter = { cidrRange: filters.cidrRange };
            ServiceFiltersSchema.parse(tempFilter);
          } catch (error) {
            if (error instanceof ZodError) {
              const errorMessages = error.issues.map(err => `${err.path.join('.')}: ${err.message}`);
              throw new ValidationError(`Filter validation failed: ${errorMessages.join(', ')}`);
            }
            throw error;
          }
        }
        // For partial CIDR ranges (like "192.168.1"), we skip validation to allow substring matching
        delete filtersForValidation.cidrRange;
      }

      try {
        ServiceFiltersSchema.parse(filtersForValidation);
      } catch (error) {
        if (error instanceof ZodError) {
          const errorMessages = error.issues.map(err => `${err.path.join('.')}: ${err.message}`);
          throw new ValidationError(`Filter validation failed: ${errorMessages.join(', ')}`);
        }
        throw error;
      }

      // Validate group existence if groupId filter is provided
      if (filters.groupId) {
        const group = await this.groupRepository.findById(filters.groupId);
        if (!group) {
          throw new ValidationError(`Group with id '${filters.groupId}' does not exist`);
        }
      }
    }

    return await this.networkServiceRepository.findAll(filters);
  }

  /**
   * Update an existing network service
   */
  async updateService(id: string, data: UpdateNetworkServiceDto): Promise<NetworkService> {
    if (!id || typeof id !== 'string' || id.trim() === '') {
      throw new ValidationError('Service ID is required and must be a non-empty string');
    }

    // Validate input data
    try {
      const validatedData = UpdateNetworkServiceSchema.parse(data);

      // If groupId is being updated, validate that the new group exists
      if (validatedData.groupId) {
        const group = await this.groupRepository.findById(validatedData.groupId);
        if (!group) {
          throw new ValidationError(`Group with id '${validatedData.groupId}' does not exist`);
        }
      }

      return await this.networkServiceRepository.update(id, validatedData);
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.issues.map(err => `${err.path.join('.')}: ${err.message}`);
        throw new ValidationError(`Validation failed: ${errorMessages.join(', ')}`);
      }
      throw error;
    }
  }

  /**
   * Delete a network service by ID
   */
  async deleteService(id: string): Promise<void> {
    if (!id || typeof id !== 'string' || id.trim() === '') {
      throw new ValidationError('Service ID is required and must be a non-empty string');
    }

    // Check if service exists before attempting to delete
    const service = await this.networkServiceRepository.findById(id);
    if (!service) {
      throw new NotFoundError('NetworkService', id);
    }

    const deleted = await this.networkServiceRepository.delete(id);
    if (!deleted) {
      throw new NotFoundError('NetworkService', id);
    }
  }

  /**
   * Get all network services for a specific group
   */
  async getServicesByGroup(groupId: string): Promise<NetworkService[]> {
    if (!groupId || typeof groupId !== 'string' || groupId.trim() === '') {
      throw new ValidationError('Group ID is required and must be a non-empty string');
    }

    // Validate that the group exists
    const group = await this.groupRepository.findById(groupId);
    if (!group) {
      throw new ValidationError(`Group with id '${groupId}' does not exist`);
    }

    return await this.networkServiceRepository.findByGroupId(groupId);
  }

  /**
   * Validate network service data without persisting
   */
  validateServiceData(data: any): ServiceValidationResult {
    try {
      CreateNetworkServiceSchema.parse(data);
      return { isValid: true, errors: [] };
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.issues.map(err => `${err.path.join('.')}: ${err.message}`);
        return { isValid: false, errors };
      }
      return { isValid: false, errors: ['Unknown validation error'] };
    }
  }
}