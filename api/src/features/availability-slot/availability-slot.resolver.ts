import { Resolver, Mutation, Query, Args, ID } from '@nestjs/graphql';
import { UnauthorizedException } from '@nestjs/common';

import { AvailabilitySlotService } from './availability-slot.service';
import { Public } from '../../common/decorator/public.decorator';
import {
  CurrentUser,
  JwtPayload,
} from '../../common/decorator/current-user.decorator';
import { CreateAvailabilitySlotDto } from './dto/create-slot.dto';
import { UpdateAvailabilitySlotDto } from './dto/update-slot.dto';
import { BulkCreateSlotsDto } from './dto/bulk-create-slots.dto';
import { AvailabilitySlotEntity } from './entities/availability-slot.entity';

@Resolver(() => AvailabilitySlotEntity)
export class AvailabilitySlotResolver {
  constructor(
    private readonly availabilitySlotService: AvailabilitySlotService,
  ) {}

  @Mutation(() => AvailabilitySlotEntity)
  async createAvailabilitySlot(
    @Args('input') createDto: CreateAvailabilitySlotDto,
    @CurrentUser() user: JwtPayload | undefined,
  ): Promise<AvailabilitySlotEntity> {
    if (!user?.sub) {
      throw new UnauthorizedException('Authentication credentials were not provided');
    }
    return this.availabilitySlotService.createSlot(user.sub, createDto);
  }

  @Mutation(() => [AvailabilitySlotEntity])
  async createBulkAvailabilitySlots(
    @Args('input') bulkDto: BulkCreateSlotsDto,
    @CurrentUser() user: JwtPayload | undefined,
  ): Promise<AvailabilitySlotEntity[]> {
    if (!user?.sub) {
      throw new UnauthorizedException('Authentication credentials were not provided');
    }
    return this.availabilitySlotService.createBulkSlots(user.sub, bulkDto);
  }

  @Mutation(() => AvailabilitySlotEntity)
  async updateAvailabilitySlot(
    @Args('slotId', { type: () => ID }) slotId: string,
    @Args('input') updateDto: UpdateAvailabilitySlotDto,
    @CurrentUser() user: JwtPayload | undefined,
  ): Promise<AvailabilitySlotEntity> {
    if (!user?.sub) {
      throw new UnauthorizedException('Authentication credentials were not provided');
    }
    return this.availabilitySlotService.updateSlot(user.sub, slotId, updateDto);
  }

  @Mutation(() => Boolean)
  async deleteAvailabilitySlot(
    @Args('slotId', { type: () => ID }) slotId: string,
    @CurrentUser() user: JwtPayload | undefined,
  ): Promise<boolean> {
    if (!user?.sub) {
      throw new UnauthorizedException('Authentication credentials were not provided');
    }
    return this.availabilitySlotService.deleteSlot(user.sub, slotId);
  }

  @Public()
  @Query(() => [AvailabilitySlotEntity])
  async getDoctorAvailability(
    @Args('doctorId', { type: () => ID }) doctorId: string,
    @Args('fromDate', { type: () => Date, nullable: true }) fromDate?: Date,
  ): Promise<AvailabilitySlotEntity[]> {
    return this.availabilitySlotService.getDoctorAvailability(doctorId, fromDate);
  }

  @Query(() => [AvailabilitySlotEntity])
  async myAvailabilitySlots(
    @CurrentUser() user: JwtPayload | undefined,
  ): Promise<AvailabilitySlotEntity[]> {
    if (!user?.sub) {
      throw new UnauthorizedException('Authentication credentials were not provided');
    }
    return this.availabilitySlotService.mySlots(user.sub);
  }

  @Query(() => AvailabilitySlotEntity)
  async getAvailabilitySlotById(
    @Args('slotId', { type: () => ID }) slotId: string,
  ): Promise<AvailabilitySlotEntity> {
    return this.availabilitySlotService.getSlotById(slotId);
  }
}
