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
  Req,
} from '@nestjs/common';

import { EmployeesService } from './employees.service';
import { Employee, UpdateEmployee, FilterEmployee } from './entities/employee.entity';

import { UseGuards } from '@nestjs/common'; // add to your existing @nestjs/common import
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
// ClassSerializerInterceptor applies @Exclude (hides bank details in responses)
@UseInterceptors(ClassSerializerInterceptor)
@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Post()
  async create(@Body() createEmployee: Employee) {
    return await this.employeesService.create(createEmployee);
  }

  @Get() //caching just bare endpoint, if any filters applied, query pg
  async findAll(@Query() filter: FilterEmployee, @Req() req: { query: Record<string, unknown> }) {
    const cacheDefaultList = (Object.keys(req.query)).length === 0; //boolean val

    return this.employeesService.findAll(filter, cacheDefaultList);
  }

  // Keep this static route before `:id` so `/deleted` is not parsed as an integer ID.
  @Get('deleted')
  async findDeleted(@Query() filter: FilterEmployee) {
    return await this.employeesService.findDeleted(filter);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number, @Req() req: { user: { userId: number } }) {
    return this.employeesService.findOne(id, req.user.userId);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEmployee: UpdateEmployee,
    @Req() req: { user: { userId: number } },
  ) {
    return this.employeesService.update(id, updateEmployee, req.user.userId);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number, @Req() req: { user: { userId: number } }) {
    await this.employeesService.delete(id, req.user.userId);
  }

  @Patch(':id/restore')
  async restore(@Param('id', ParseIntPipe) id: number, @Req() req: { user: { userId: number } }) {
    return this.employeesService.restore(id, req.user.userId);
  }
}
