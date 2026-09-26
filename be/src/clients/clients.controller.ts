import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { AssignReviewerDto } from './dto/assign-reviewer.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/enums/role.enum';

@ApiTags('Clients & Brands')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create new client brand (ADMIN only)' })
  @ApiResponse({ status: 201, description: 'Client created' })
  @ApiResponse({ status: 409, description: 'Brand name already exists' })
  async create(@Body() createClientDto: CreateClientDto) {
    return this.clientsService.create(createClientDto);
  }

  @Get()
  @ApiOperation({ summary: 'List clients (scoped for reviewers to assigned clients only)' })
  @ApiResponse({ status: 200, description: 'List of clients' })
  async findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.clientsService.findAll(user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get client details by ID' })
  @ApiResponse({ status: 200, description: 'Client details' })
  @ApiResponse({ status: 404, description: 'Client not found' })
  async findOne(@Param('id') id: string) {
    return this.clientsService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update client brand name (ADMIN only)' })
  @ApiResponse({ status: 200, description: 'Client updated' })
  @ApiResponse({ status: 404, description: 'Client not found' })
  async update(
    @Param('id') id: string,
    @Body() updateClientDto: UpdateClientDto,
  ) {
    return this.clientsService.update(id, updateClientDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete client (ADMIN only)' })
  @ApiResponse({ status: 200, description: 'Client deleted' })
  @ApiResponse({ status: 404, description: 'Client not found' })
  async remove(@Param('id') id: string) {
    return this.clientsService.remove(id);
  }

  @Post(':id/reviewers')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Assign a reviewer to client (ADMIN only)' })
  @ApiResponse({ status: 200, description: 'Reviewer assigned' })
  @ApiResponse({ status: 400, description: 'User does not have REVIEWER role' })
  @ApiResponse({ status: 409, description: 'Reviewer already assigned' })
  async assignReviewer(
    @Param('id') id: string,
    @Body() assignReviewerDto: AssignReviewerDto,
  ) {
    return this.clientsService.assignReviewer(id, assignReviewerDto.reviewerId);
  }

  @Delete(':id/reviewers/:reviewerId')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Remove reviewer from client (ADMIN only)' })
  @ApiResponse({ status: 200, description: 'Reviewer removed' })
  @ApiResponse({ status: 404, description: 'Reviewer not assigned to client' })
  async removeReviewer(
    @Param('id') id: string,
    @Param('reviewerId') reviewerId: string,
  ) {
    return this.clientsService.removeReviewer(id, reviewerId);
  }
}
