import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Employee } from './entities/employee.entity';

@Injectable()
export class EmployeeCronService {
  private readonly logger = new Logger(EmployeeCronService.name);

  constructor(
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async logEmployeeCount(): Promise<void> {
    const count = await this.employeeRepository.count();

    this.logger.log(`Active employees in database: ${count}`);
  }
}