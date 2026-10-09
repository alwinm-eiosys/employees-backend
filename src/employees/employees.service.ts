import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  Employee,
  UpdateEmployee,
  FilterEmployee,
} from './entities/employee.entity';

@Injectable()
export class EmployeesService {
  constructor(
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
  ) {}

  async create(createEmployeeDto: Employee): Promise<Employee> {
    const employee = this.employeeRepository.create(createEmployeeDto); // in memory only, no DB query
    return this.employeeRepository.save(employee); // INSERT INTO
  }

  async findAll(filter: FilterEmployee) {
    const { id, department } = filter;

    return this.employeeRepository.find({
      where: {
        ...(id !== undefined && { id }),
        ...(department && { department }),
      },
      order: { id: 'ASC' },
    });
  }

  async findOne(id: number) {
    const employee = await this.employeeRepository.findOneBy({ id });

    if (!employee) {
      throw new NotFoundException('Employee not found for entered ID!');
    }
    return employee;
  }

  async update(
    id: number,
    updateEmployeeDto: UpdateEmployee,
  ): Promise<Employee> {
    const employee = await this.employeeRepository.preload({
      id,
      ...updateEmployeeDto,
    });

    if (!employee) {
      throw new NotFoundException("Record with entered ID doesn't exist!");
    }

    return await this.employeeRepository.save(employee);
  }

  async delete(id: number) {
    const employee = await this.findOne(id);
    await this.employeeRepository.remove(employee);

    return { message: 'Employee with entered ID deleted!' };
  }
}
