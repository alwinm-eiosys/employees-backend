import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';

import { EmployeesService } from './employees.service';
import { Employee, UpdateEmployee, FilterEmployee } from './entities/employee.entity';

// ClassSerializerInterceptor applies @Exclude (hides bank details in responses)
@UseInterceptors(ClassSerializerInterceptor)
@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Post()
  async create(@Body() createEmployee: Employee) {
    return await this.employeesService.create(createEmployee);
  }

  @Get()
  async findAll(@Query() filter: FilterEmployee) {
    return await this.employeesService.findAll(filter);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.employeesService.findOne(id);
  }

  @Patch(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateEmployee: UpdateEmployee) {
    return await this.employeesService.update(id, updateEmployee);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.employeesService.delete(id);
  }

  @Patch(':id/restore')
  async restore(@Param('id', ParseIntPipe) id: number) {
    return await this.employeesService.restore(id);
  }
}
