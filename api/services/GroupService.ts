/**
 * Group service layer
 * Handles business logic for Group operations
 */

import type { Group, CreateGroupDto, UpdateGroupDto } from '../models/Group';
import type { GroupRepository } from '../repositories/GroupRepository';
import { SQLiteGroupRepository } from '../repositories/GroupRepository';
import { CreateGroupSchema, UpdateGroupSchema } from '../utils/schemas';
import { ValidationError, NotFoundError, ConflictError } from '../utils/errors';
import { ZodError } from 'zod';

export interface GroupService {
  createGroup(data: CreateGroupDto): Promise<Group>;
  getGroup(id: string): Promise<Group>;
  getAllGroups(): Promise<Group[]>;
  updateGroup(id: string, data: UpdateGroupDto): Promise<Group>;
  deleteGroup(id: string): Promise<void>;
  validateGroupData(data: any): { isValid: boolean; errors?: string[] };
}

export class DefaultGroupService implements GroupService {
  private groupRepository: GroupRepository;

  constructor(groupRepository?: GroupRepository) {
    this.groupRepository = groupRepository || new SQLiteGroupRepository();
  }

  /**
   * Create a new group with validation
   */
  async createGroup(data: CreateGroupDto): Promise<Group> {
    // Validate input data
    try {
      const validatedData = CreateGroupSchema.parse(data);
      
      // Check if group with same name already exists
      const existingGroup = await this.groupRepository.findByName(validatedData.name);
      if (existingGroup) {
        throw new ConflictError(`Group with name '${validatedData.name}' already exists`);
      }

      return await this.groupRepository.create(validatedData);
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.issues.map(err => `${err.path.join('.')}: ${err.message}`);
        throw new ValidationError(`Validation failed: ${errorMessages.join(', ')}`);
      }
      throw error;
    }
  }

  /**
   * Get a group by ID
   */
  async getGroup(id: string): Promise<Group> {
    if (!id || typeof id !== 'string' || id.trim() === '') {
      throw new ValidationError('Group ID is required and must be a non-empty string');
    }

    const group = await this.groupRepository.findById(id);
    if (!group) {
      throw new NotFoundError('Group', id);
    }

    return group;
  }

  /**
   * Get all groups
   */
  async getAllGroups(): Promise<Group[]> {
    return await this.groupRepository.findAll();
  }

  /**
   * Update an existing group
   */
  async updateGroup(id: string, data: UpdateGroupDto): Promise<Group> {
    if (!id || typeof id !== 'string' || id.trim() === '') {
      throw new ValidationError('Group ID is required and must be a non-empty string');
    }

    // Validate input data
    try {
      const validatedData = UpdateGroupSchema.parse(data);

      // If name is being updated, check for duplicates
      if (validatedData.name) {
        const existingGroup = await this.groupRepository.findByName(validatedData.name);
        if (existingGroup && existingGroup.id !== id) {
          throw new ConflictError(`Group with name '${validatedData.name}' already exists`);
        }
      }

      return await this.groupRepository.update(id, validatedData);
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.issues.map(err => `${err.path.join('.')}: ${err.message}`);
        throw new ValidationError(`Validation failed: ${errorMessages.join(', ')}`);
      }
      throw error;
    }
  }

  /**
   * Delete a group by ID
   */
  async deleteGroup(id: string): Promise<void> {
    if (!id || typeof id !== 'string' || id.trim() === '') {
      throw new ValidationError('Group ID is required and must be a non-empty string');
    }

    // Check if group exists before attempting to delete
    const group = await this.groupRepository.findById(id);
    if (!group) {
      throw new NotFoundError('Group', id);
    }

    const deleted = await this.groupRepository.delete(id);
    if (!deleted) {
      throw new NotFoundError('Group', id);
    }
  }

  /**
   * Validate group data without persisting
   */
  validateGroupData(data: any): { isValid: boolean; errors?: string[] } {
    try {
      CreateGroupSchema.parse(data);
      return { isValid: true };
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.issues.map(err => `${err.path.join('.')}: ${err.message}`);
        return { isValid: false, errors };
      }
      return { isValid: false, errors: ['Unknown validation error'] };
    }
  }
}