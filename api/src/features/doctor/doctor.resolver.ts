import { Resolver, Mutation, Query, Args, ID } from '@nestjs/graphql';
import { UnauthorizedException } from '@nestjs/common';

import { DoctorService } from './doctor.service';
import { Public } from '../../common/decorator/public.decorator';
import {
  CurrentUser,
  JwtPayload,
} from '../../common/decorator/current-user.decorator';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { DoctorEntity } from './entities/doctor.entity';

@Resolver(() => DoctorEntity)
export class DoctorResolver {
  constructor(private readonly doctorService: DoctorService) {}

  @Mutation(() => DoctorEntity)
  async createDoctorProfile(
    @Args('input') createDoctorDto: CreateDoctorDto,
    @CurrentUser() user: JwtPayload | undefined,
  ): Promise<DoctorEntity> {
    if (!user?.sub) {
      throw new UnauthorizedException('Authentication credentials were not provided');
    }
    return this.doctorService.createDoctorProfile(user.sub, createDoctorDto);
  }

  @Mutation(() => DoctorEntity)
  async updateDoctorProfile(
    @Args('input') updateDoctorDto: UpdateDoctorDto,
    @CurrentUser() user: JwtPayload | undefined,
  ): Promise<DoctorEntity> {
    if (!user?.sub) {
      throw new UnauthorizedException('Authentication credentials were not provided');
    }
    return this.doctorService.updateDoctorProfile(user.sub, updateDoctorDto);
  }

  @Query(() => DoctorEntity)
  async myDoctorProfile(
    @CurrentUser() user: JwtPayload | undefined,
  ): Promise<DoctorEntity> {
    if (!user?.sub) {
      throw new UnauthorizedException('Authentication credentials were not provided');
    }
    return this.doctorService.getDoctorProfile(user.sub);
  }

  @Public()
  @Query(() => DoctorEntity)
  async getDoctorById(
    @Args('doctorId', { type: () => ID }) doctorId: string,
  ): Promise<DoctorEntity> {
    return this.doctorService.getDoctorById(doctorId);
  }

  @Public()
  @Query(() => [DoctorEntity])
  async listDoctors(): Promise<DoctorEntity[]> {
    return this.doctorService.listDoctors();
  }
}
