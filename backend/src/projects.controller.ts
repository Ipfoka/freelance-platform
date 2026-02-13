import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './projects/dto/create-project.dto';
import { FilterProjectsDto } from './projects/dto/filter-projects.dto';
import { CreateProposalDto } from './projects/dto/create-proposal.dto';
import { CreateProjectInviteDto } from './projects/dto/create-project-invite.dto';

@Controller('api/projects')
export class ProjectsController {
  constructor(private projectsService: ProjectsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createProject(
    @Body() createProjectDto: CreateProjectDto,
    @Request() req,
  ) {
    return this.projectsService.createProject(req.user.id, createProjectDto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async getProjects(@Query() filterProjectsDto: FilterProjectsDto) {
    return this.projectsService.getProjects(filterProjectsDto);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/proposals')
  @HttpCode(HttpStatus.CREATED)
  async createProposal(
    @Param('id') projectId: string,
    @Body() createProposalDto: CreateProposalDto,
    @Request() req,
  ) {
    return this.projectsService.createProposal(
      req.user.id,
      projectId,
      createProposalDto,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/proposals')
  @HttpCode(HttpStatus.OK)
  async getProjectProposals(@Param('id') projectId: string, @Request() req) {
    return this.projectsService.getProjectProposals(req.user.id, projectId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/top-executors')
  @HttpCode(HttpStatus.OK)
  async getTopExecutors(
    @Param('id') projectId: string,
    @Request() req,
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = limit ? Number(limit) : undefined;
    return this.projectsService.getTopExecutors(
      req.user.id,
      projectId,
      parsedLimit,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/invites')
  @HttpCode(HttpStatus.OK)
  async getProjectInvites(@Param('id') projectId: string, @Request() req) {
    return this.projectsService.getProjectInvites(req.user.id, projectId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/invites')
  @HttpCode(HttpStatus.CREATED)
  async inviteFreelancer(
    @Param('id') projectId: string,
    @Body() createProjectInviteDto: CreateProjectInviteDto,
    @Request() req,
  ) {
    return this.projectsService.inviteFreelancer(
      req.user.id,
      projectId,
      createProjectInviteDto,
    );
  }
}
