import { Resolver, Mutation, Query, Args, ID } from '@nestjs/graphql';
import { UnauthorizedException } from '@nestjs/common';

import { PrescriptionService } from './prescription.service';
import {
  CurrentUser,
  JwtPayload,
} from '../../common/decorator/current-user.decorator';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { UpdatePrescriptionDto } from './dto/update-prescription.dto';
import { PrescriptionEntity } from './entities/prescription.entity';

@Resolver(() => PrescriptionEntity)
export class PrescriptionResolver {
  constructor(private readonly prescriptionService: PrescriptionService) {}

  @Mutation(() => String)
  async createPrescription(
    @Args('input') createDto: CreatePrescriptionDto,
    @CurrentUser() user: JwtPayload | undefined,
  ): Promise<string> {
    if (!user?.sub) {
      throw new UnauthorizedException('Authentication credentials were not provided');
    }
    return this.prescriptionService.createPrescription(user.sub, createDto);
  }

  @Mutation(() => String)
  async updatePrescription(
    @Args('prescriptionId', { type: () => ID }) prescriptionId: string,
    @Args('input') updateDto: UpdatePrescriptionDto,
    @CurrentUser() user: JwtPayload | undefined,
  ): Promise<string> {
    if (!user?.sub) {
      throw new UnauthorizedException('Authentication credentials were not provided');
    }
    return this.prescriptionService.updatePrescription(
      user.sub,
      prescriptionId,
      updateDto,
    );
  }

  @Query(() => PrescriptionEntity)
  async getPrescriptionById(
    @Args('prescriptionId', { type: () => ID }) prescriptionId: string,
    @CurrentUser() user: JwtPayload | undefined,
  ): Promise<PrescriptionEntity> {
    if (!user?.sub) {
      throw new UnauthorizedException('Authentication credentials were not provided');
    }
    return this.prescriptionService.getPrescriptionById(user.sub, prescriptionId);
  }

  @Query(() => [PrescriptionEntity])
  async getPrescriptionsByConsultation(
    @Args('consultationId', { type: () => ID }) consultationId: string,
    @CurrentUser() user: JwtPayload | undefined,
  ): Promise<PrescriptionEntity[]> {
    if (!user?.sub) {
      throw new UnauthorizedException('Authentication credentials were not provided');
    }
    return this.prescriptionService.getPrescriptionsByConsultation(
      user.sub,
      consultationId,
    );
  }

  @Query(() => [PrescriptionEntity])
  async myPrescriptions(
    @CurrentUser() user: JwtPayload | undefined,
  ): Promise<PrescriptionEntity[]> {
    if (!user?.sub) {
      throw new UnauthorizedException('Authentication credentials were not provided');
    }
    return this.prescriptionService.myPrescriptions(user.sub);
  }
}
