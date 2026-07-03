/**
 * Unit tests for frontend validation schemas
 */

import {
  createServiceSchema,
  updateServiceSchema,
  createGroupSchema,
  updateGroupSchema,
  serviceFiltersSchema,
  queryParamsSchema,
  bulkDeleteSchema,
  bulkUpdateGroupSchema,
  validateServiceForm,
  validateGroupForm,
  validateIPAddress,
  validatePort,
  validateVLAN,
  validateDomain,
  createGroupNameUniqueSchema,
  updateGroupNameUniqueSchema
} from '../../../lib/validations';

describe('Service Validation Schemas', () => {
  describe('createServiceSchema', () => {
    const validServiceData = {
      name: 'test-service',
      type: 'web' as const,
      ipAddress: '192.168.1.1',
      internalPorts: [80],
      externalPorts: [443],
      vlan: 100,
      domain: 'example.com',
      groupId: '123e4567-e89b-12d3-a456-426614174000'
    };

    it('should validate valid service data', () => {
      const result = createServiceSchema.safeParse(validServiceData);
      expect(result.success).toBe(true);
    });

    it('should require service name', () => {
      const result = createServiceSchema.safeParse({
        ...validServiceData,
        name: ''
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Service name is required');
      }
    });

    it('should validate service name format', () => {
      const result = createServiceSchema.safeParse({
        ...validServiceData,
        name: 'invalid name with spaces'
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('can only contain letters, numbers, underscores, and hyphens');
      }
    });

    it('should validate service type', () => {
      const result = createServiceSchema.safeParse({
        ...validServiceData,
        type: 'invalid-type'
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Please select a valid service type');
      }
    });

    it('should require at least one IP address', () => {
      const result = createServiceSchema.safeParse({
        ...validServiceData,
        ipAddress: undefined
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('IP address is required');
      }
    });

    it('should validate IP address format', () => {
      const result = createServiceSchema.safeParse({
        ...validServiceData,
        ipAddress: 'invalid-ip'
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Invalid IP address format');
      }
    });

    it('should require at least one port', () => {
      const result = createServiceSchema.safeParse({
        ...validServiceData,
        internalPorts: undefined,
        externalPorts: undefined
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('At least one internal port is required');
      }
    });

    it('should validate port range', () => {
      const result = createServiceSchema.safeParse({
        ...validServiceData,
        internalPorts: [0, 65536],
        externalPorts: [0, 65536]
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(issue => 
          issue.message === 'Port must be between 1 and 65535'
        )).toBe(true);
      }
    });

    it('should validate VLAN ID range', () => {
      const result = createServiceSchema.safeParse({
        ...validServiceData,
        vlan: 5000
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('VLAN ID must be between 1 and 4094');
      }
    });

    it('should validate domain format', () => {
      const result = createServiceSchema.safeParse({
        ...validServiceData,
        domain: 'invalid..domain'
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Invalid domain format');
      }
    });

    it('should require valid group UUID', () => {
      const result = createServiceSchema.safeParse({
        ...validServiceData,
        groupId: 'invalid-uuid'
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Invalid group selection');
      }
    });

    it('should allow optional fields to be undefined', () => {
      const minimalData = {
        name: 'test-service',
        type: 'web' as const,
        ipAddress: '192.168.1.1',
        internalPorts: [80],
        externalPorts: [80],
        groupId: '123e4567-e89b-12d3-a456-426614174000'
      };
      const result = createServiceSchema.safeParse(minimalData);
      expect(result.success).toBe(true);
    });
  });

  describe('updateServiceSchema', () => {
    it('should allow all fields to be optional', () => {
      const result = updateServiceSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should validate fields when provided', () => {
      const result = updateServiceSchema.safeParse({
        name: 'invalid name with spaces'
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('can only contain letters, numbers, underscores, and hyphens');
      }
    });
  });
});

describe('Group Validation Schemas', () => {
  describe('createGroupSchema', () => {
    const validGroupData = {
      name: 'test-group',
      description: 'Test group description'
    };

    it('should validate valid group data', () => {
      const result = createGroupSchema.safeParse(validGroupData);
      expect(result.success).toBe(true);
    });

    it('should require group name', () => {
      const result = createGroupSchema.safeParse({
        ...validGroupData,
        name: ''
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Group name is required');
      }
    });

    it('should validate group name format', () => {
      const result = createGroupSchema.safeParse({
        ...validGroupData,
        name: 'invalid name with spaces'
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('can only contain letters, numbers, underscores, and hyphens');
      }
    });

    it('should allow description to be optional', () => {
      const result = createGroupSchema.safeParse({
        name: 'test-group'
      });
      expect(result.success).toBe(true);
    });

    it('should validate description length', () => {
      const longDescription = 'a'.repeat(501);
      const result = createGroupSchema.safeParse({
        ...validGroupData,
        description: longDescription
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Description must be 500 characters or less');
      }
    });
  });

  describe('updateGroupSchema', () => {
    it('should allow all fields to be optional', () => {
      const result = updateGroupSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should validate fields when provided', () => {
      const result = updateGroupSchema.safeParse({
        name: 'invalid name with spaces'
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('can only contain letters, numbers, underscores, and hyphens');
      }
    });
  });
});

describe('Filter and Query Validation', () => {
  describe('serviceFiltersSchema', () => {
    it('should validate valid filters', () => {
      const filters = {
        search: 'test',
        group_id: '123e4567-e89b-12d3-a456-426614174000',
        type: 'web' as const,
        vlan_id: 100,
        domain: 'example.com'
      };
      const result = serviceFiltersSchema.safeParse(filters);
      expect(result.success).toBe(true);
    });

    it('should allow empty filters', () => {
      const result = serviceFiltersSchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });

  describe('queryParamsSchema', () => {
    it('should use default values', () => {
      const result = queryParamsSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
        expect(result.data.order).toBe('asc');
      }
    });

    it('should validate page and limit ranges', () => {
      const result = queryParamsSchema.safeParse({
        page: 0,
        limit: 101
      });
      expect(result.success).toBe(false);
    });
  });
});

describe('Bulk Operations Validation', () => {
  describe('bulkDeleteSchema', () => {
    it('should require at least one ID', () => {
      const result = bulkDeleteSchema.safeParse({ ids: [] });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('At least one item must be selected');
      }
    });

    it('should validate UUID format', () => {
      const result = bulkDeleteSchema.safeParse({ ids: ['invalid-uuid'] });
      expect(result.success).toBe(false);
    });

    it('should limit maximum items', () => {
      const ids = Array(101).fill('123e4567-e89b-12d3-a456-426614174000');
      const result = bulkDeleteSchema.safeParse({ ids });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Maximum 100 items can be deleted at once');
      }
    });
  });

  describe('bulkUpdateGroupSchema', () => {
    it('should validate valid bulk update data', () => {
      const data = {
        ids: ['123e4567-e89b-12d3-a456-426614174000'],
        group_id: '123e4567-e89b-12d3-a456-426614174001'
      };
      const result = bulkUpdateGroupSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should require group_id', () => {
      const result = bulkUpdateGroupSchema.safeParse({
        ids: ['123e4567-e89b-12d3-a456-426614174000']
      });
      expect(result.success).toBe(false);
    });
  });
});

describe('Validation Helper Functions', () => {
  describe('validateServiceForm', () => {
    it('should validate service form data', () => {
      const validData = {
        name: 'test-service',
        type: 'web',
        ipAddress: '192.168.1.1',
        internalPorts: [80],
        externalPorts: [80],
        groupId: '123e4567-e89b-12d3-a456-426614174000'
      };
      const result = validateServiceForm(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('validateGroupForm', () => {
    it('should validate group form data', () => {
      const validData = {
        name: 'test-group',
        description: 'Test description'
      };
      const result = validateGroupForm(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('Field-level validation helpers', () => {
    it('should validate IP addresses', () => {
      expect(validateIPAddress('192.168.1.1').success).toBe(true);
      expect(validateIPAddress('invalid-ip').success).toBe(false);
    });

    it('should validate ports', () => {
      expect(validatePort(80).success).toBe(true);
      expect(validatePort(0).success).toBe(false);
      expect(validatePort(65536).success).toBe(false);
    });

    it('should validate VLAN IDs', () => {
      expect(validateVLAN(100).success).toBe(true);
      expect(validateVLAN(0).success).toBe(false);
      expect(validateVLAN(5000).success).toBe(false);
    });

    it('should validate domains', () => {
      expect(validateDomain('example.com').success).toBe(true);
      expect(validateDomain('localhost').success).toBe(true);
      expect(validateDomain('invalid..domain').success).toBe(false);
    });
  });
});

describe('Group Name Uniqueness Validation', () => {
  describe('createGroupNameUniqueSchema', () => {
    it('should reject existing group names', () => {
      const existingNames = ['existing-group', 'another-group'];
      const schema = createGroupNameUniqueSchema(existingNames);
      
      const result = schema.safeParse({
        name: 'existing-group',
        description: 'Test'
      });
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Group name already exists');
      }
    });

    it('should allow new group names', () => {
      const existingNames = ['existing-group'];
      const schema = createGroupNameUniqueSchema(existingNames);
      
      const result = schema.safeParse({
        name: 'new-group',
        description: 'Test'
      });
      
      expect(result.success).toBe(true);
    });

    it('should be case insensitive', () => {
      const existingNames = ['existing-group'];
      const schema = createGroupNameUniqueSchema(existingNames);
      
      const result = schema.safeParse({
        name: 'EXISTING-GROUP',
        description: 'Test'
      });
      
      expect(result.success).toBe(false);
    });
  });

  describe('updateGroupNameUniqueSchema', () => {
    it('should allow keeping the same name', () => {
      const existingNames = ['existing-group', 'another-group'];
      const schema = updateGroupNameUniqueSchema(existingNames, 'existing-group');
      
      const result = schema.safeParse({
        name: 'existing-group'
      });
      
      expect(result.success).toBe(true);
    });

    it('should reject changing to existing name', () => {
      const existingNames = ['existing-group', 'another-group'];
      const schema = updateGroupNameUniqueSchema(existingNames, 'current-group');
      
      const result = schema.safeParse({
        name: 'existing-group'
      });
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Group name already exists');
      }
    });
  });
});