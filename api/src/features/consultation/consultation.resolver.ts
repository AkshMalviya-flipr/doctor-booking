import { Resolver, Mutation, Query, Args, ID } from '@nestjs/graphql';
import { UnauthorizedException } from '@nestjs/common';

import { ConsultationService } from './consultation.service';
import {
  CurrentUser,
  JwtPayload,
} from '../../common/decorator/current-user.decorator';
import { CreateConsultationDto } from './dto/create-consultation.dto';
import { RescheduleConsultationDto } from './dto/reschedule-consultation.dto';
import { ConsultationEntity } from './entities/consultation.entity';

@Resolver(() => ConsultationEntity)
export class ConsultationResolver {
  constructor(private readonly consultationService: ConsultationService) {}

  @Mutation(() => String)
  async bookConsultation(
    @Args('input') createDto: CreateConsultationDto,
    @CurrentUser() user: JwtPayload | undefined,
  ): Promise<string> {
    if (!user?.sub) {
      throw new UnauthorizedException('Authentication credentials were not provided');
    }
    return this.consultationService.bookConsultation(user.sub, createDto);
  }

  @Mutation(() => String)
  async rescheduleConsultation(
    @Args('input') rescheduleDto: RescheduleConsultationDto,
    @CurrentUser() user: JwtPayload | undefined,
  ): Promise<string> {
    if (!user?.sub) {
      throw new UnauthorizedException('Authentication credentials were not provided');
    }
    return this.consultationService.rescheduleConsultation(user.sub, rescheduleDto);
  }

  @Mutation(() => String)
  async cancelConsultation(
    @Args('consultationId', { type: () => ID }) consultationId: string,
    @Args('reason', { type: () => String, nullable: true }) reason: string | undefined,
    @CurrentUser() user: JwtPayload | undefined,
  ): Promise<string> {
    if (!user?.sub) {
      throw new UnauthorizedException('Authentication credentials were not provided');
    }
    return this.consultationService.cancelConsultation(user.sub, consultationId, reason);
  }

  @Mutation(() => String)
  async completeConsultation(
    @Args('consultationId', { type: () => ID }) consultationId: string,
    @Args('notes', { type: () => String, nullable: true }) notes: string | undefined,
    @CurrentUser() user: JwtPayload | undefined,
  ): Promise<string> {
    if (!user?.sub) {
      throw new UnauthorizedException('Authentication credentials were not provided');
    }
    return this.consultationService.completeConsultation(user.sub, consultationId, notes);
  }

  @Query(() => ConsultationEntity)
  async getConsultationById(
    @Args('consultationId', { type: () => ID }) consultationId: string,
    @CurrentUser() user: JwtPayload | undefined,
  ): Promise<ConsultationEntity> {
    if (!user?.sub) {
      throw new UnauthorizedException('Authentication credentials were not provided');
    }
    return this.consultationService.getConsultationById(user.sub, consultationId);
  }

  @Query(() => [ConsultationEntity])
  async myConsultations(
    @CurrentUser() user: JwtPayload | undefined,
  ): Promise<ConsultationEntity[]> {
    if (!user?.sub) {
      throw new UnauthorizedException('Authentication credentials were not provided');
    }
    return this.consultationService.myConsultations(user.sub);
  }
}
