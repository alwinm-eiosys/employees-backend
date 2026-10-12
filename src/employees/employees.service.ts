import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';

import { Employee, UpdateEmployee, FilterEmployee } from './entities/employee.entity';

@Injectable()
export class EmployeesService {
  constructor(
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
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
    return this.employeeRepository.save(employee); // INSERT INTO
  }

  async findAll(filter: FilterEmployee) {
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

    if (department) qb.andWhere('employee.department = :department', { department });  // Parameter Binding ie: { department: department }
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

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: number) {
    const employee = await this.employeeRepository.findOneBy({ id });

    if (!employee) {
      throw new NotFoundException('Employee not found for entered ID!');
    }
    return employee;
  }

  async update(id: number, updateEmployee: UpdateEmployee): Promise<Employee> {
    await this.checkManager(updateEmployee.reportingManagerId, id);

    const employee = await this.employeeRepository.preload({
      id,
      ...updateEmployee,
    });

    if (!employee) {
      throw new NotFoundException("Record with entered ID doesn't exist!");
    }

    return await this.employeeRepository.save(employee);
  }

  // Soft delete: row stays in DB with deletedAt set
  async delete(id: number): Promise<void> {
    const employee = await this.findOne(id);

    // people who reported to this employee are left without a manager
    await this.employeeRepository.update({ reportingManagerId: id }, { reportingManagerId: null });

    await this.employeeRepository.softRemove(employee);
  }

  async restore(id: number): Promise<Employee> {
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
    return await this.findOne(id);
  }
}
