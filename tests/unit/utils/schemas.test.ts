/**
 * Unit tests for Zod validation schemas
 */

import {
  CreateGroupSchema,
  UpdateGroupSchema,
  CreateNetworkServiceSchema,
  UpdateNetworkServiceSchema,
  ServiceFiltersSchema
} from '../../../api/utils/schemas';

describe('Validation Schemas', () => {
  describe('CreateGroupSchema', () => {
    it('should validate correct group data', () => {
      const validData = {
        name: 'test-group',
        description: 'Test group description'
      };
      
      const result = CreateGroupSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate group data without description', () => {
      const validData = {
        name: 'test-group'
      };
      
      const result = CreateGroupSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject empty name', () => {
      const invalidData = {
        name: '',
        description: 'Test description'
      };
      
      const result = CreateGroupSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject name with invalid characters', () => {
      const invalidData = {
        name: 'test group!',
        description: 'Test description'
      };
      
      const result = CreateGroupSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject name that is too long', () => {
      const invalidData = {
        name: 'a'.repeat(101),
        description: 'Test description'
      };
      
      const result = CreateGroupSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject description that is too long', () => {
      const invalidData = {
        name: 'test-group',
        description: 'a'.repeat(501)
      };
      
      const result = CreateGroupSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('UpdateGroupSchema', () => {
    it('should validate partial updates', () => {
      const validData = {
        name: 'updated-group'
      };
      
      const result = UpdateGroupSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate empty object', () => {
      const validData = {};
      
      const result = UpdateGroupSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('CreateNetworkServiceSchema', () => {
    it('should validate correct service data', () => {
      const validData = {
        groupId: 'test-group',
        name: 'test-service',
        type: 'web',
        domain: 'example.com',
        internalPorts: [8080, 8081],
        externalPorts: [80, 443],
        vlan: 'vlan-100',
        cidr: '192.168.1.0/24',
        ipAddress: '192.168.1.10',
        tags: ['web', 'api']
      };
      
      const result = CreateNetworkServiceSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate minimal required data', () => {
      const validData = {
        groupId: 'test-group',
        name: 'test-service',
        type: 'web',
        domain: 'example.com',
        internalPorts: [8080],
        externalPorts: [80]
      };
      
      const result = CreateNetworkServiceSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.tags).toEqual([]);
      }
    });

    it('should reject missing required fields', () => {
      const invalidData = {
        name: 'test-service',
        domain: 'example.com',
        internalPorts: [8080],
        externalPorts: [80]
        // missing groupId
      };
      
      const result = CreateNetworkServiceSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid IP address', () => {
      const invalidData = {
        groupId: 'test-group',
        name: 'test-service',
        domain: 'example.com',
        internalPorts: [8080],
        externalPorts: [80],
        ipAddress: '256.1.1.1'
      };
      
      const result = CreateNetworkServiceSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid CIDR', () => {
      const invalidData = {
        groupId: 'test-group',
        name: 'test-service',
        domain: 'example.com',
        internalPorts: [8080],
        externalPorts: [80],
        cidr: '192.168.1.0/33'
      };
      
      const result = CreateNetworkServiceSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid port numbers', () => {
      const invalidData = {
        groupId: 'test-group',
        name: 'test-service',
        domain: 'example.com',
        internalPorts: [0, 8080],
        externalPorts: [80]
      };
      
      const result = CreateNetworkServiceSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject empty port arrays', () => {
      const invalidData = {
        groupId: 'test-group',
        name: 'test-service',
        domain: 'example.com',
        internalPorts: [],
        externalPorts: [80]
      };
      
      const result = CreateNetworkServiceSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid domain', () => {
      const invalidData = {
        groupId: 'test-group',
        name: 'test-service',
        domain: '.invalid-domain',
        internalPorts: [8080],
        externalPorts: [80]
      };
      
      const result = CreateNetworkServiceSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject too many ports', () => {
      const invalidData = {
        groupId: 'test-group',
        name: 'test-service',
        domain: 'example.com',
        internalPorts: Array.from({ length: 51 }, (_, i) => i + 1),
        externalPorts: [80]
      };
      
      const result = CreateNetworkServiceSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject too many tags', () => {
      const invalidData = {
        groupId: 'test-group',
        name: 'test-service',
        domain: 'example.com',
        internalPorts: [8080],
        externalPorts: [80],
        tags: Array.from({ length: 21 }, (_, i) => `tag${i}`)
      };
      
      const result = CreateNetworkServiceSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('UpdateNetworkServiceSchema', () => {
    it('should validate partial updates', () => {
      const validData = {
        name: 'updated-service',
        tags: ['updated']
      };
      
      const result = UpdateNetworkServiceSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate empty object', () => {
      const validData = {};
      
      const result = UpdateNetworkServiceSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('ServiceFiltersSchema', () => {
    it('should validate correct filter data', () => {
      const validData = {
        groupId: 'test-group',
        vlan: 'vlan-100',
        tags: ['web', 'api'],
        ipAddress: '192.168.1.10',
        cidrRange: '192.168.1.0/24',
        domain: 'example.com'
      };
      
      const result = ServiceFiltersSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate empty filters', () => {
      const validData = {};
      
      const result = ServiceFiltersSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid IP address in filters', () => {
      const invalidData = {
        ipAddress: '256.1.1.1'
      };
      
      const result = ServiceFiltersSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid CIDR in filters', () => {
      const invalidData = {
        cidrRange: '192.168.1.0/33'
      };
      
      const result = ServiceFiltersSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});