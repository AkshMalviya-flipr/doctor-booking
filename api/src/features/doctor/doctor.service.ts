import {
  Injectable,
  Logger,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Doctor } from '../../schema/doctor.entity';
import { User } from '../../schema/user.entity';
import { UserRole } from '../../common/enum/user-role.enum';
import { VerificationStatus } from '../../common/enum/verification-status.enum';
import { handleServiceError } from '../../utils/error/error.util';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { DoctorEntity } from './entities/doctor.entity';
import { UserEntity } from '../auth/entities/user.entity';
import { ProfileEntity } from '../auth/entities/profile.entity';

@Injectable()
export class DoctorService {
  private readonly logger = new Logger(DoctorService.name);

  constructor(
    @InjectRepository(Doctor)
    private readonly doctorRepository: Repository<Doctor>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Insert: Create new doctor profile for the authenticated user.
   */
  async createDoctorProfile(
    userId: string,
    createDoctorDto: CreateDoctorDto,
  ): Promise<DoctorEntity> {
    try {
      // 1. Check if doctor profile already exists for this account
      const existingDoctor = await this.doctorRepository.findOne({
        where: { user_id: userId },
      });

      if (existingDoctor) {
        throw new ConflictException(
          'Doctor profile already exists for this account',
        );
      }

      // 2. Check license number uniqueness
      const existingLicense = await this.doctorRepository.findOne({
        where: { license_number: createDoctorDto.license_number.trim() },
      });

      if (existingLicense) {
        throw new ConflictException(
          'A doctor with this license number already exists',
        );
      }

      // 3. Verify user account exists
      const user = await this.userRepository.findOne({
        where: { user_id: userId },
        relations: ['profile'],
      });

      if (!user) {
        throw new NotFoundException('User account not found');
      }

      // 4. Ensure user role is updated to DOCTOR
      if (user.role !== UserRole.DOCTOR) {
        user.role = UserRole.DOCTOR;
        await this.userRepository.save(user);
      }

      // 5. Create doctor record
      const doctor = this.doctorRepository.create({
        user_id: userId,
        specialization: createDoctorDto.specialization.trim(),
        license_number: createDoctorDto.license_number.trim(),
        qualification: createDoctorDto.qualification.trim(),
        experience_years: createDoctorDto.experience_years ?? 0,
        consultation_fee: createDoctorDto.consultation_fee.trim(),
        verification_status: VerificationStatus.PENDING,
        bio: createDoctorDto.bio?.trim() || null,
      });

      const savedDoctor = await this.doctorRepository.save(doctor);
      savedDoctor.user = user;

      return this.mapToDoctorEntity(savedDoctor);
    } catch (error) {
      handleServiceError(error, this.logger, 'DoctorService.createDoctorProfile');
    }
  }

  /**
   * Update: Modify existing doctor profile attributes.
   */
  async updateDoctorProfile(
    userId: string,
    updateDoctorDto: UpdateDoctorDto,
  ): Promise<DoctorEntity> {
    try {
      // 1. Find doctor profile belonging to the user
      const doctor = await this.doctorRepository.findOne({
        where: { user_id: userId },
        relations: ['user', 'user.profile'],
      });

      if (!doctor) {
        throw new NotFoundException('Doctor profile not found');
      }

      // 2. Apply updates
      if (updateDoctorDto.specialization !== undefined) {
        doctor.specialization = updateDoctorDto.specialization.trim();
      }

      if (updateDoctorDto.qualification !== undefined) {
        doctor.qualification = updateDoctorDto.qualification.trim();
      }

      if (updateDoctorDto.experience_years !== undefined) {
        doctor.experience_years = updateDoctorDto.experience_years;
      }

      if (updateDoctorDto.consultation_fee !== undefined) {
        doctor.consultation_fee = updateDoctorDto.consultation_fee.trim();
      }

      if (updateDoctorDto.bio !== undefined) {
        doctor.bio = updateDoctorDto.bio?.trim() || null;
      }

      const updatedDoctor = await this.doctorRepository.save(doctor);
      return this.mapToDoctorEntity(updatedDoctor);
    } catch (error) {
      handleServiceError(error, this.logger, 'DoctorService.updateDoctorProfile');
    }
  }

  /**
   * Get: Retrieve doctor profile of current logged-in doctor.
   */
  async getDoctorProfile(userId: string): Promise<DoctorEntity> {
    try {
      const doctor = await this.doctorRepository.findOne({
        where: { user_id: userId },
        relations: ['user', 'user.profile'],
      });

      if (!doctor) {
        throw new NotFoundException('Doctor profile not found');
      }

      return this.mapToDoctorEntity(doctor);
    } catch (error) {
      handleServiceError(error, this.logger, 'DoctorService.getDoctorProfile');
    }
  }

  /**
   * Get: Retrieve public doctor profile by doctor_id.
   */
  async getDoctorById(doctorId: string): Promise<DoctorEntity> {
    try {
      const doctor = await this.doctorRepository.findOne({
        where: { doctor_id: doctorId },
        relations: ['user', 'user.profile'],
      });

      if (!doctor) {
        throw new NotFoundException('Doctor not found');
      }

      return this.mapToDoctorEntity(doctor);
    } catch (error) {
      handleServiceError(error, this.logger, 'DoctorService.getDoctorById');
    }
  }

  /**
   * Get: List all doctors.
   */
  async listDoctors(): Promise<DoctorEntity[]> {
    try {
      const doctors = await this.doctorRepository.find({
        relations: ['user', 'user.profile'],
        order: { created_at: 'DESC' },
      });

      return doctors.map((doc) => this.mapToDoctorEntity(doc));
    } catch (error) {
      handleServiceError(error, this.logger, 'DoctorService.listDoctors');
    }
  }

  /**
   * Helper: Map TypeORM Doctor to GraphQL DoctorEntity.
   */
  private mapToDoctorEntity(doctor: Doctor): DoctorEntity {
    let userEntity: UserEntity | null = null;

    if (doctor.user) {
      let profileEntity: ProfileEntity | null = null;
      if (doctor.user.profile) {
        profileEntity = {
          profile_id: doctor.user.profile.profile_id,
          user_id: doctor.user.profile.user_id,
          full_name: doctor.user.profile.full_name,
          date_of_birth: doctor.user.profile.date_of_birth,
          gender: doctor.user.profile.gender,
          phone: doctor.user.profile.phone,
          address: doctor.user.profile.address,
          profile_image_url: doctor.user.profile.profile_image_url,
          created_at: doctor.user.profile.created_at,
          updated_at: doctor.user.profile.updated_at,
        };
      }

      userEntity = {
        user_id: doctor.user.user_id,
        email: doctor.user.email,
        role: doctor.user.role,
        status: doctor.user.status,
        email_verified: doctor.user.email_verified,
        last_login_at: doctor.user.last_login_at,
        created_at: doctor.user.created_at,
        updated_at: doctor.user.updated_at,
        profile: profileEntity,
      };
    }

    return {
      doctor_id: doctor.doctor_id,
      user_id: doctor.user_id,
      specialization: doctor.specialization,
      license_number: doctor.license_number,
      qualification: doctor.qualification,
      experience_years: doctor.experience_years,
      consultation_fee: doctor.consultation_fee,
      verification_status: doctor.verification_status as VerificationStatus,
      bio: doctor.bio,
      created_at: doctor.created_at,
      updated_at: doctor.updated_at,
      user: userEntity,
    };
  }
}
