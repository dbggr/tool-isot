/**
 * Unit tests for NetworkServiceService
 */

import { DefaultNetworkServiceService } from '../../../api/services/NetworkServiceService';
import type { NetworkServiceRepository } from '../../../api/repositories/NetworkServiceRepository';
import type { GroupRepository } from '../../../api/repositories/GroupRepository';
import type { 
  NetworkService, 
  CreateNetworkServiceDto, 
  UpdateNetworkServiceDto, 
  ServiceFilters 
} from '../../../api/models/NetworkService';
import type { Group, CreateGroupDto, UpdateGroupDto } from '../../../api/models/Group';
import { ValidationError, NotFoundError, ConflictError } from '../../../api/utils/errors';

// Mock NetworkServiceRepository
class MockNetworkServiceRepository implements NetworkServiceRepository {
  private services: NetworkService[] = [];
  private nextId = 1;

  async create(service: CreateNetworkServiceDto): Promise<NetworkService> {
    const newService: NetworkService = {
      id: `service-${this.nextId++}`,
      groupId: service.groupId,
      name: service.name,
      domain: service.domain,
      internalPorts: service.internalPorts,
      externalPorts: service.externalPorts,
      vlan: service.vlan || '',
      cidr: service.cidr || '',
      ipAddress: service.ipAddress || '',
      tags: service.tags || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.services.push(newService);
    return newService;
  }

  async findById(id: string): Promise<NetworkService | null> {
    return this.services.find(s => s.id === id) || null;
  }

  async findAll(filters?: ServiceFilters): Promise<NetworkService[]> {
    let filteredServices = [...this.services];

    if (filters) {
      if (filters.groupId) {
        filteredServices = filteredServices.filter(s => s.groupId === filters.groupId);
      }
      if (filters.vlan) {
        filteredServices = filteredServices.filter(s => s.vlan === filters.vlan);
      }
      if (filters.ipAddress) {
        filteredServices = filteredServices.filter(s => s.ipAddress === filters.ipAddress);
      }
      if (filters.domain) {
        filteredServices = filteredServices.filter(s => s.domain.includes(filters.domain!));
      }
      if (filters.cidrRange) {
        filteredServices = filteredServices.filter(s => s.cidr.includes(filters.cidrRange!));
      }
      if (filters.tags && filters.tags.length > 0) {
        filteredServices = filteredServices.filter(s => 
          filters.tags!.some(tag => s.tags.includes(tag))
        );
      }
    }

    return filteredServices.sort((a, b) => a.name.localeCompare(b.name));
  }

  async update(id: string, updates: UpdateNetworkServiceDto): Promise<NetworkService> {
    const serviceIndex = this.services.findIndex(s => s.id === id);
    if (serviceIndex === -1) {
      throw new NotFoundError('NetworkService', id);
    }

    const updatedService: NetworkService = {
      ...this.services[serviceIndex],
      ...updates,
      updatedAt: new Date(),
    };

    this.services[serviceIndex] = updatedService;
    return updatedService;
  }

  async delete(id: string): Promise<boolean> {
    const initialLength = this.services.length;
    this.services = this.services.filter(s => s.id !== id);
    return this.services.length < initialLength;
  }

  async findByGroupId(groupId: string): Promise<NetworkService[]> {
    return this.services
      .filter(s => s.groupId === groupId)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  // Test helper methods
  reset(): void {
    this.services = [];
    this.nextId = 1;
  }

  addService(service: NetworkService): void {
    this.services.push(service);
  }
}

// Mock GroupRepository
class MockGroupRepository implements GroupRepository {
  private groups: Group[] = [];

  async create(group: CreateGroupDto): Promise<Group> {
    throw new Error('Not implemented in mock');
  }

  async findById(id: string): Promise<Group | null> {
    return this.groups.find(g => g.id === id) || null;
  }

  async findAll(): Promise<Group[]> {
    return [...this.groups];
  }

  async update(id: string, updates: UpdateGroupDto): Promise<Group> {
    throw new Error('Not implemented in mock');
  }

  async delete(id: string): Promise<boolean> {
    throw new Error('Not implemented in mock');
  }

  async findByName(name: string): Promise<Group | null> {
    return this.groups.find(g => g.name === name) || null;
  }

  // Test helper methods
  reset(): void {
    this.groups = [];
  }

  addGroup(group: Group): void {
    this.groups.push(group);
  }
}

describe('NetworkServiceService', () => {
  let networkServiceService: DefaultNetworkServiceService;
  let mockNetworkServiceRepository: MockNetworkServiceRepository;
  let mockGroupRepository: MockGroupRepository;

  beforeEach(() => {
    mockNetworkServiceRepository = new MockNetworkServiceRepository();
    mockGroupRepository = new MockGroupRepository();
    networkServiceService = new DefaultNetworkServiceService(
      mockNetworkServiceRepository,
      mockGroupRepository
    );

    // Add a default group for testing
    mockGroupRepository.addGroup({
      id: 'test-group-id',
      name: 'test-group',
      description: 'Test group',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  afterEach(() => {
    mockNetworkServiceRepository.reset();
    mockGroupRepository.reset();
  });

  describe('createService', () => {
    it('should create a service with valid data', async () => {
      const serviceData: CreateNetworkServiceDto = {
        groupId: 'test-group-id',
        name: 'test-service',
        type: 'web',
        domain: 'example.com',
        internalPorts: [8080, 8081],
        externalPorts: [80, 443],
        vlan: 'vlan-100',
        cidr: '192.168.1.0/24',
        ipAddress: '192.168.1.10',
        tags: ['web', 'api'],
      };

      const result = await networkServiceService.createService(serviceData);

      expect(result).toMatchObject({
        name: 'test-service',
        domain: 'example.com',
        groupId: 'test-group-id',
        internalPorts: [8080, 8081],
        externalPorts: [80, 443],
        vlan: 'vlan-100',
        cidr: '192.168.1.0/24',
        ipAddress: '192.168.1.10',
        tags: ['web', 'api'],
      });
      expect(result.id).toBeDefined();
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it('should create a service with minimal required data', async () => {
      const serviceData: CreateNetworkServiceDto = {
        groupId: 'test-group-id',
        name: 'minimal-service',
        type: 'web',
        domain: 'minimal.com',
        internalPorts: [3000],
        externalPorts: [80],
      };

      const result = await networkServiceService.createService(serviceData);

      expect(result.name).toBe('minimal-service');
      expect(result.domain).toBe('minimal.com');
      expect(result.vlan).toBe('');
      expect(result.cidr).toBe('');
      expect(result.ipAddress).toBe('');
      expect(result.tags).toEqual([]);
    });

    it('should throw ValidationError for non-existent group', async () => {
      const serviceData: CreateNetworkServiceDto = {
        groupId: 'non-existent-group',
        name: 'test-service',
        type: 'web',
        domain: 'example.com',
        internalPorts: [8080],
        externalPorts: [80],
      };

      await expect(networkServiceService.createService(serviceData)).rejects.toThrow(ValidationError);
      await expect(networkServiceService.createService(serviceData)).rejects.toThrow('does not exist');
    });

    it('should throw ValidationError for missing required fields', async () => {
      const serviceData = {
        groupId: 'test-group-id',
        // Missing name, domain, internalPorts, externalPorts
      };

      await expect(networkServiceService.createService(serviceData as any)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid IP address', async () => {
      const serviceData: CreateNetworkServiceDto = {
        groupId: 'test-group-id',
        name: 'test-service',
        domain: 'example.com',
        internalPorts: [8080],
        externalPorts: [80],
        ipAddress: '999.999.999.999', // Invalid IP
      };

      await expect(networkServiceService.createService(serviceData)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid CIDR', async () => {
      const serviceData: CreateNetworkServiceDto = {
        groupId: 'test-group-id',
        name: 'test-service',
        domain: 'example.com',
        internalPorts: [8080],
        externalPorts: [80],
        cidr: '192.168.1.0/99', // Invalid CIDR prefix
      };

      await expect(networkServiceService.createService(serviceData)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid port numbers', async () => {
      const serviceData: CreateNetworkServiceDto = {
        groupId: 'test-group-id',
        name: 'test-service',
        domain: 'example.com',
        internalPorts: [70000], // Invalid port > 65535
        externalPorts: [80],
      };

      await expect(networkServiceService.createService(serviceData)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid domain', async () => {
      const serviceData: CreateNetworkServiceDto = {
        groupId: 'test-group-id',
        name: 'test-service',
        domain: 'invalid..domain', // Invalid domain format
        internalPorts: [8080],
        externalPorts: [80],
      };

      await expect(networkServiceService.createService(serviceData)).rejects.toThrow(ValidationError);
    });
  });

  describe('getService', () => {
    it('should return service by ID', async () => {
      const service: NetworkService = {
        id: 'test-service-id',
        groupId: 'test-group-id',
        name: 'test-service',
        domain: 'example.com',
        internalPorts: [8080],
        externalPorts: [80],
        vlan: 'vlan-100',
        cidr: '192.168.1.0/24',
        ipAddress: '192.168.1.10',
        tags: ['web'],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockNetworkServiceRepository.addService(service);

      const result = await networkServiceService.getService('test-service-id');

      expect(result).toEqual(service);
    });

    it('should throw NotFoundError for non-existent service', async () => {
      await expect(networkServiceService.getService('non-existent')).rejects.toThrow(NotFoundError);
    });

    it('should throw ValidationError for empty ID', async () => {
      await expect(networkServiceService.getService('')).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for non-string ID', async () => {
      await expect(networkServiceService.getService(null as any)).rejects.toThrow(ValidationError);
    });
  });

  describe('getAllServices', () => {
    beforeEach(() => {
      // Add test services
      const services: NetworkService[] = [
        {
          id: 'service-1',
          groupId: 'test-group-id',
          name: 'web-service',
          domain: 'web.example.com',
          internalPorts: [8080],
          externalPorts: [80],
          vlan: 'vlan-100',
          cidr: '192.168.1.0/24',
          ipAddress: '192.168.1.10',
          tags: ['web', 'frontend'],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'service-2',
          groupId: 'test-group-id',
          name: 'api-service',
          domain: 'api.example.com',
          internalPorts: [3000],
          externalPorts: [443],
          vlan: 'vlan-200',
          cidr: '192.168.2.0/24',
          ipAddress: '192.168.2.10',
          tags: ['api', 'backend'],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      services.forEach(service => mockNetworkServiceRepository.addService(service));
    });

    it('should return all services when no filters provided', async () => {
      const result = await networkServiceService.getAllServices();

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('api-service'); // Sorted alphabetically
      expect(result[1].name).toBe('web-service');
    });

    it('should filter services by groupId', async () => {
      const filters: ServiceFilters = { groupId: 'test-group-id' };

      const result = await networkServiceService.getAllServices(filters);

      expect(result).toHaveLength(2);
      expect(result.every(s => s.groupId === 'test-group-id')).toBe(true);
    });

    it('should filter services by VLAN', async () => {
      const filters: ServiceFilters = { vlan: 'vlan-100' };

      const result = await networkServiceService.getAllServices(filters);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('web-service');
    });

    it('should filter services by IP address', async () => {
      const filters: ServiceFilters = { ipAddress: '192.168.1.10' };

      const result = await networkServiceService.getAllServices(filters);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('web-service');
    });

    it('should filter services by domain', async () => {
      const filters: ServiceFilters = { domain: 'api' };

      const result = await networkServiceService.getAllServices(filters);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('api-service');
    });

    it('should filter services by CIDR range', async () => {
      const filters: ServiceFilters = { cidrRange: '192.168.1' };

      const result = await networkServiceService.getAllServices(filters);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('web-service');
    });

    it('should filter services by tags', async () => {
      const filters: ServiceFilters = { tags: ['web'] };

      const result = await networkServiceService.getAllServices(filters);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('web-service');
    });

    it('should filter services by multiple tags', async () => {
      const filters: ServiceFilters = { tags: ['web', 'api'] };

      const result = await networkServiceService.getAllServices(filters);

      expect(result).toHaveLength(2); // Both services have at least one matching tag
    });

    it('should throw ValidationError for non-existent group in filters', async () => {
      const filters: ServiceFilters = { groupId: 'non-existent-group' };

      await expect(networkServiceService.getAllServices(filters)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid IP address in filters', async () => {
      const filters: ServiceFilters = { ipAddress: '999.999.999.999' };

      await expect(networkServiceService.getAllServices(filters)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid CIDR in filters', async () => {
      const filters: ServiceFilters = { cidrRange: '192.168.1.0/99' };

      await expect(networkServiceService.getAllServices(filters)).rejects.toThrow(ValidationError);
    });
  });

  describe('updateService', () => {
    let existingService: NetworkService;

    beforeEach(() => {
      existingService = {
        id: 'test-service-id',
        groupId: 'test-group-id',
        name: 'original-service',
        domain: 'original.com',
        internalPorts: [8080],
        externalPorts: [80],
        vlan: 'vlan-100',
        cidr: '192.168.1.0/24',
        ipAddress: '192.168.1.10',
        tags: ['web'],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockNetworkServiceRepository.addService(existingService);
    });

    it('should update service name', async () => {
      const updates: UpdateNetworkServiceDto = {
        name: 'updated-service',
      };

      const result = await networkServiceService.updateService('test-service-id', updates);

      expect(result.name).toBe('updated-service');
      expect(result.domain).toBe('original.com'); // Unchanged
    });

    it('should update service domain', async () => {
      const updates: UpdateNetworkServiceDto = {
        domain: 'updated.com',
      };

      const result = await networkServiceService.updateService('test-service-id', updates);

      expect(result.domain).toBe('updated.com');
      expect(result.name).toBe('original-service'); // Unchanged
    });

    it('should update service ports', async () => {
      const updates: UpdateNetworkServiceDto = {
        internalPorts: [3000, 3001],
        externalPorts: [443, 8443],
      };

      const result = await networkServiceService.updateService('test-service-id', updates);

      expect(result.internalPorts).toEqual([3000, 3001]);
      expect(result.externalPorts).toEqual([443, 8443]);
    });

    it('should update service network configuration', async () => {
      const updates: UpdateNetworkServiceDto = {
        vlan: 'vlan-200',
        cidr: '192.168.2.0/24',
        ipAddress: '192.168.2.20',
      };

      const result = await networkServiceService.updateService('test-service-id', updates);

      expect(result.vlan).toBe('vlan-200');
      expect(result.cidr).toBe('192.168.2.0/24');
      expect(result.ipAddress).toBe('192.168.2.20');
    });

    it('should update service tags', async () => {
      const updates: UpdateNetworkServiceDto = {
        tags: ['api', 'backend', 'microservice'],
      };

      const result = await networkServiceService.updateService('test-service-id', updates);

      expect(result.tags).toEqual(['api', 'backend', 'microservice']);
    });

    it('should update service group with validation', async () => {
      // Add another group
      mockGroupRepository.addGroup({
        id: 'another-group-id',
        name: 'another-group',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const updates: UpdateNetworkServiceDto = {
        groupId: 'another-group-id',
      };

      const result = await networkServiceService.updateService('test-service-id', updates);

      expect(result.groupId).toBe('another-group-id');
    });

    it('should throw ValidationError for non-existent group in update', async () => {
      const updates: UpdateNetworkServiceDto = {
        groupId: 'non-existent-group',
      };

      await expect(networkServiceService.updateService('test-service-id', updates)).rejects.toThrow(ValidationError);
    });

    it('should throw NotFoundError for non-existent service', async () => {
      const updates: UpdateNetworkServiceDto = {
        name: 'updated-name',
      };

      await expect(networkServiceService.updateService('non-existent', updates)).rejects.toThrow(NotFoundError);
    });

    it('should throw ValidationError for empty ID', async () => {
      const updates: UpdateNetworkServiceDto = {
        name: 'updated-name',
      };

      await expect(networkServiceService.updateService('', updates)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid update data', async () => {
      const updates = {
        ipAddress: '999.999.999.999', // Invalid IP
      };

      await expect(networkServiceService.updateService('test-service-id', updates)).rejects.toThrow(ValidationError);
    });
  });

  describe('deleteService', () => {
    let existingService: NetworkService;

    beforeEach(() => {
      existingService = {
        id: 'test-service-id',
        groupId: 'test-group-id',
        name: 'test-service',
        domain: 'example.com',
        internalPorts: [8080],
        externalPorts: [80],
        vlan: 'vlan-100',
        cidr: '192.168.1.0/24',
        ipAddress: '192.168.1.10',
        tags: ['web'],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockNetworkServiceRepository.addService(existingService);
    });

    it('should delete existing service', async () => {
      await expect(networkServiceService.deleteService('test-service-id')).resolves.not.toThrow();

      // Verify service is deleted
      await expect(networkServiceService.getService('test-service-id')).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError for non-existent service', async () => {
      await expect(networkServiceService.deleteService('non-existent')).rejects.toThrow(NotFoundError);
    });

    it('should throw ValidationError for empty ID', async () => {
      await expect(networkServiceService.deleteService('')).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for non-string ID', async () => {
      await expect(networkServiceService.deleteService(null as any)).rejects.toThrow(ValidationError);
    });
  });

  describe('getServicesByGroup', () => {
    beforeEach(() => {
      // Add another group
      mockGroupRepository.addGroup({
        id: 'another-group-id',
        name: 'another-group',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Add services for different groups
      const services: NetworkService[] = [
        {
          id: 'service-1',
          groupId: 'test-group-id',
          name: 'service-1',
          domain: 'service1.com',
          internalPorts: [8080],
          externalPorts: [80],
          vlan: '',
          cidr: '',
          ipAddress: '',
          tags: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'service-2',
          groupId: 'test-group-id',
          name: 'service-2',
          domain: 'service2.com',
          internalPorts: [3000],
          externalPorts: [443],
          vlan: '',
          cidr: '',
          ipAddress: '',
          tags: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'service-3',
          groupId: 'another-group-id',
          name: 'service-3',
          domain: 'service3.com',
          internalPorts: [5000],
          externalPorts: [8080],
          vlan: '',
          cidr: '',
          ipAddress: '',
          tags: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      services.forEach(service => mockNetworkServiceRepository.addService(service));
    });

    it('should return services for specific group', async () => {
      const result = await networkServiceService.getServicesByGroup('test-group-id');

      expect(result).toHaveLength(2);
      expect(result.every(s => s.groupId === 'test-group-id')).toBe(true);
      expect(result[0].name).toBe('service-1'); // Sorted alphabetically
      expect(result[1].name).toBe('service-2');
    });

    it('should return empty array for group with no services', async () => {
      // Add a group with no services
      mockGroupRepository.addGroup({
        id: 'empty-group-id',
        name: 'empty-group',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await networkServiceService.getServicesByGroup('empty-group-id');

      expect(result).toEqual([]);
    });

    it('should throw ValidationError for non-existent group', async () => {
      await expect(networkServiceService.getServicesByGroup('non-existent-group')).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for empty group ID', async () => {
      await expect(networkServiceService.getServicesByGroup('')).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for non-string group ID', async () => {
      await expect(networkServiceService.getServicesByGroup(null as any)).rejects.toThrow(ValidationError);
    });
  });

  describe('validateServiceData', () => {
    it('should return valid for correct data', () => {
      const data = {
        groupId: 'test-group-id',
        name: 'test-service',
        type: 'web',
        domain: 'example.com',
        internalPorts: [8080],
        externalPorts: [80],
        vlan: 'vlan-100',
        cidr: '192.168.1.0/24',
        ipAddress: '192.168.1.10',
        tags: ['web', 'api'],
      };

      const result = networkServiceService.validateServiceData(data);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should return valid for minimal required data', () => {
      const data = {
        groupId: 'test-group-id',
        name: 'test-service',
        type: 'web',
        domain: 'example.com',
        internalPorts: [8080],
        externalPorts: [80],
      };

      const result = networkServiceService.validateServiceData(data);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should return invalid for missing required fields', () => {
      const data = {
        groupId: 'test-group-id',
        // Missing name, domain, internalPorts, externalPorts
      };

      const result = networkServiceService.validateServiceData(data);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should return invalid for invalid IP address', () => {
      const data = {
        groupId: 'test-group-id',
        name: 'test-service',
        domain: 'example.com',
        internalPorts: [8080],
        externalPorts: [80],
        ipAddress: '999.999.999.999',
      };

      const result = networkServiceService.validateServiceData(data);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('IP address'))).toBe(true);
    });

    it('should return invalid for invalid CIDR', () => {
      const data = {
        groupId: 'test-group-id',
        name: 'test-service',
        domain: 'example.com',
        internalPorts: [8080],
        externalPorts: [80],
        cidr: '192.168.1.0/99',
      };

      const result = networkServiceService.validateServiceData(data);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('CIDR'))).toBe(true);
    });

    it('should return invalid for invalid port numbers', () => {
      const data = {
        groupId: 'test-group-id',
        name: 'test-service',
        domain: 'example.com',
        internalPorts: [70000], // Invalid port
        externalPorts: [80],
      };

      const result = networkServiceService.validateServiceData(data);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('Port'))).toBe(true);
    });

    it('should return invalid for invalid domain', () => {
      const data = {
        groupId: 'test-group-id',
        name: 'test-service',
        domain: 'invalid..domain',
        internalPorts: [8080],
        externalPorts: [80],
      };

      const result = networkServiceService.validateServiceData(data);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('domain'))).toBe(true);
    });

    it('should return invalid for empty arrays', () => {
      const data = {
        groupId: 'test-group-id',
        name: 'test-service',
        domain: 'example.com',
        internalPorts: [], // Empty array
        externalPorts: [80],
      };

      const result = networkServiceService.validateServiceData(data);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('internal'))).toBe(true);
    });
  });
});