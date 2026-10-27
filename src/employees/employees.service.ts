import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';

import { Employee, UpdateEmployee, FilterEmployee } from './entities/employee.entity';

import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Injectable()
export class EmployeesService {
  constructor(
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,

    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  // Manager must exist, and an employee cannot be their own manager
  private async checkManager(managerId: number | null | undefined, employeeId?: number) {
    if (managerId === undefined || managerId === null) return;

    if (employeeId !== undefined && managerId === employeeId) {
      throw new BadRequestException('An employee cannot be their own reporting manager!');
    }

    const exists = await this.employeeRepository.existsBy({ id: managerId });
    if (!exists) {
      throw new NotFoundException('Reporting manager not found for entered ID!');
    }
  }

  async create(createEmployee: Employee): Promise<Employee> {
    await this.checkManager(createEmployee.reportingManagerId);

    const employee = this.employeeRepository.create(createEmployee); // in memory only
    const savedEmployee = await this.employeeRepository.save(employee); // INSERT INTO
    await this.cacheManager.del('employees:list');
    return savedEmployee;
  }

  async findAll(filter: FilterEmployee, cacheDefaultList = false) {
    const cacheKey = 'employees:list';

    if (cacheDefaultList) {
      const cached = await this.cacheManager.get<{
        data: Employee[];
        meta: {
          total: number;
          page: number;
          limit: number;
          totalPages: number;
        };
      }>(cacheKey);

      if (cached) {
        return cached;
      }
    }
    
    const {
      page,
      limit,
      search,
      sortBy,
      order,
      department,
      designation,
      employmentType,
      employmentStatus,
      joinedFrom,
      joinedTill,
    } = filter;

    if (joinedFrom && joinedTill && joinedFrom > joinedTill) {
      throw new BadRequestException('joinedFrom cannot be after joinedTill!');
    }

    // soft-deleted rows are excluded automatically
    //By default, whenever you run standard find operations (like find(), findOne(), etc.), TypeORM automatically adds a hidden
    //condition behind the scenes: WHERE deletedAt IS NULL. That is why soft-deleted records magically disappear from your standard
    //  GET responses even though they are still sitting safely in your database table.

    const qb = this.employeeRepository.createQueryBuilder('employee');

    if (search) {
      qb.andWhere(
        new Brackets((q) => {
          q.where('employee.firstName ILIKE :search')
            .orWhere('employee.lastName ILIKE :search')
            .orWhere('employee.email ILIKE :search')
            .orWhere('employee.employeeCode ILIKE :search');
        }),
        { search: `%${search}%` },
      );
    }

    if (department) qb.andWhere('employee.department = :department', { department }); // Parameter Binding ie: { department: department }
    if (designation) qb.andWhere('employee.designation = :designation', { designation });
    if (employmentType)
      qb.andWhere('employee.employmentType = :employmentType', {
        employmentType,
      });
    if (employmentStatus)
      qb.andWhere('employee.employmentStatus = :employmentStatus', {
        employmentStatus,
      });
    if (joinedFrom) qb.andWhere('employee.dateOfJoining >= :joinedFrom', { joinedFrom });
    if (joinedTill) qb.andWhere('employee.dateOfJoining <= :joinedTill', { joinedTill });

    // pagination & sorting
    qb.orderBy(`employee.${sortBy}`, order)
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount(); // all matching records & count

    const result = {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };

    if (cacheDefaultList) {
      await this.cacheManager.set(cacheKey, result);
    }

    return result;
  }

  // Separate endpoint for the soft-deleted queue so the normal list keeps its existing behaviour.
  async findDeleted(filter: FilterEmployee) {
    const {
      page,
      limit,
      search,
      sortBy,
      order,
      department,
      designation,
      employmentType,
      employmentStatus,
      joinedFrom,
      joinedTill,
    } = filter;

    if (joinedFrom && joinedTill && joinedFrom > joinedTill) {
      throw new BadRequestException('joinedFrom cannot be after joinedTill!');
    }

    const qb = this.employeeRepository
      .createQueryBuilder('employee')
      .withDeleted()
      .where('employee.deletedAt IS NOT NULL');

    if (search) {
      qb.andWhere(
        new Brackets((q) => {
          q.where('employee.firstName ILIKE :search')
            .orWhere('employee.lastName ILIKE :search')
            .orWhere('employee.email ILIKE :search')
            .orWhere('employee.employeeCode ILIKE :search');
        }),
        { search: `%${search}%` },
      );
    }
    if (department) qb.andWhere('employee.department = :department', { department });
    if (designation) qb.andWhere('employee.designation = :designation', { designation });
    if (employmentType)
      qb.andWhere('employee.employmentType = :employmentType', { employmentType });
    if (employmentStatus)
      qb.andWhere('employee.employmentStatus = :employmentStatus', { employmentStatus });
    if (joinedFrom) qb.andWhere('employee.dateOfJoining >= :joinedFrom', { joinedFrom });
    if (joinedTill) qb.andWhere('employee.dateOfJoining <= :joinedTill', { joinedTill });

    qb.orderBy(`employee.${sortBy}`, order)
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  // Basic findOne(), below we've fineOne() w/ ceching implemented
  // async findOne(id: number) {
  //   const employee = await this.employeeRepository.findOneBy({ id });

  //   if (!employee) {
  //     throw new NotFoundException('Employee not found for entered ID!');
  //   }
  //   return employee;
  // }

  async findOne(id: number, userId: number): Promise<Employee> {
    const cacheKey = `employee:${userId}:${id}`;

    // 1. Check Redis first
    const cachedEmployee = await this.cacheManager.get<Employee>(cacheKey);

    if (cachedEmployee) {
      // CACHE HIT
      return cachedEmployee;
    }

    // 2. Cache miss: query PostgreSQL
    const employee = await this.employeeRepository.findOneBy({ id });

    if (!employee) {
      throw new NotFoundException('Employee not found for entered ID!');
    }

    // 3. Store the result using the TTL configured in AppModule
    await this.cacheManager.set(cacheKey, employee);

    return employee;
  }

  async update(id: number, updateEmployee: UpdateEmployee, userId: number): Promise<Employee> {
    await this.checkManager(updateEmployee.reportingManagerId, id);

    //Find this record by ID, merge the incoming patch fields into it, and hand me back a ready-to-save entity." It saves you from
    // writing repetitive findOne + merge boilerplate
    const employee = await this.employeeRepository.preload({
      id,
      ...updateEmployee,
    });

    if (!employee) {
      throw new NotFoundException("Record with entered ID doesn't exist!");
    }

    const updatedEmployee = await this.employeeRepository.save(employee);

    // Invalidate the individual employee cache and the default employee list cache
    await Promise.all([
      this.cacheManager.del(`employee:${userId}:${id}`),
      this.cacheManager.del('employees:list'),
    ]);

    return updatedEmployee;
  }

  // // Soft delete: row stays in DB with deletedAt set
  // async delete(id: number): Promise<void> {
  //   const employee = await this.findOne(id);

  //   // people who reported to this employee are left without a manager
  //   await this.employeeRepository.update({ reportingManagerId: id }, { reportingManagerId: null });

  //   await this.employeeRepository.softRemove(employee);
  // }

  async delete(id: number, userId: number): Promise<void> {
    const employee = await this.employeeRepository.findOneBy({ id });

    if (!employee) {
      throw new NotFoundException('Employee not found for entered ID!');
    }

    // Find employees whose manager will be removed
    const directReports = await this.employeeRepository.find({
      select: { id: true },
      where: { reportingManagerId: id },
    });
//Finds employees whose reportingManagerId equals the ID of the employee being deleted. Update for them as null.
    await this.employeeRepository.update({ reportingManagerId: id }, { reportingManagerId: null });

    await this.employeeRepository.softRemove(employee);

    // Invalidate the deleted employee, affected employees, and the default list cache
    await Promise.all([
      this.cacheManager.del(`employee:${userId}:${id}`),
      //For every employee who reported to the deleted manager, delete that employee's Redis cache.
      ...directReports.map((report) => this.cacheManager.del(`employee:${userId}:${report.id}`)),
      this.cacheManager.del('employees:list'),
    ]);
  }

  async restore(id: number, userId: number): Promise<Employee> {
    // withDeleted: true so soft-deleted rows are visible to this lookup
    const employee = await this.employeeRepository.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!employee) {
      throw new NotFoundException('Employee not found for entered ID!');
    }
    if (!employee.deletedAt) {
      throw new BadRequestException('Employee is not deleted!');
    }

    await this.employeeRepository.restore(id); // sets deletedAt back to NULL
    await Promise.all([
      this.cacheManager.del(`employee:${userId}:${id}`),
      this.cacheManager.del('employees:list'),
    ]);

    return await this.findOne(id, userId);
  }
}
