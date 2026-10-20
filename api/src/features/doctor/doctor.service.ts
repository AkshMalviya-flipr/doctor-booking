import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Doctor } from '../../schemas/doctor.schema';
import { handleServiceError } from '../../utils/error/error.util';
import { UserService } from '../user/user.service';
import { UpsertDoctorInput } from './dto/upsert-doctor.input';
import { DoctorDetailResponse } from './entity/doctor-detail.entity';

@Injectable()
export class DoctorService {
  private readonly logger = new Logger(DoctorService.name);

  constructor(
    @InjectRepository(Doctor)
    private readonly doctorRepository: Repository<Doctor>,
    private readonly userService: UserService,
  ) {}

  async upsertDoctorDetail(input: UpsertDoctorInput): Promise<Doctor> {
    try {
      let doctor = await this.doctorRepository.findOne({
        where: { user_id: input.user_id },
      });

      if (doctor) {
        Object.assign(doctor, input);
      } else {
        doctor = this.doctorRepository.create(input);
      }

      return await this.doctorRepository.save(doctor);
    } catch (error: unknown) {
      handleServiceError(error, this.logger, 'Failed to upsert doctor profile');
    }
  }

  async getDoctorDetailByUserId(userId: string): Promise<DoctorDetailResponse> {
    try {
      const doctor = await this.doctorRepository.findOne({
        where: { user_id: userId },
      });

      if (!doctor) {
        throw new NotFoundException(
          `Doctor profile for user ID "${userId}" not found`,
        );
      }

      const user = await this.userService.getUserById(userId);

      return { doctor, user };
    } catch (error: unknown) {
      handleServiceError(error, this.logger, 'Failed to retrieve doctor details');
    }
  }
}
