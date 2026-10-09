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
  ParseIntPipe,
} from '@nestjs/common';

import { EmployeesService } from './employees.service';
import {
  Employee,
  UpdateEmployee,
  FilterEmployee,
} from './entities/employee.entity';


@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Post()
  async create(@Body() createEmployeeDto: Employee) {
    return await this.employeesService.create(createEmployeeDto);
  }

  @Get('/all')
  async findAll(@Query() filter: FilterEmployee) {
    return await this.employeesService.findAll(filter);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.employeesService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEmployeeDto: UpdateEmployee,
  ) {
    return await this.employeesService.update(id, updateEmployeeDto);
  }

  @HttpCode(204)
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return await this.employeesService.delete(id);
  }
}
