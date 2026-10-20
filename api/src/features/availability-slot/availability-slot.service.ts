import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AvailabilitySlot } from '../../schema/availability_slot.entity';
import { Doctor } from '../../schema/doctor.entity';
import { VerificationStatus } from '../../common/enum/verification-status.enum';
import { handleServiceError } from '../../utils/error/error.util';
import { CreateAvailabilitySlotDto } from './dto/create-slot.dto';
import { UpdateAvailabilitySlotDto } from './dto/update-slot.dto';
import { BulkCreateSlotsDto } from './dto/bulk-create-slots.dto';
import { AvailabilitySlotEntity } from './entities/availability-slot.entity';
import { DoctorEntity } from '../doctor/entities/doctor.entity';
import { UserEntity } from '../auth/entities/user.entity';
import { ProfileEntity } from '../auth/entities/profile.entity';

@Injectable()
export class AvailabilitySlotService {
  private readonly logger = new Logger(AvailabilitySlotService.name);

  constructor(
    @InjectRepository(AvailabilitySlot)
    private readonly slotRepository: Repository<AvailabilitySlot>,
    @InjectRepository(Doctor)
    private readonly doctorRepository: Repository<Doctor>,
  ) {}

  /**
   * Insert: Create a single availability slot for the authenticated doctor.
   */
  async createSlot(
    userId: string,
    createDto: CreateAvailabilitySlotDto,
  ): Promise<AvailabilitySlotEntity> {
    try {
      const doctor = await this.doctorRepository.findOne({
        where: { user_id: userId },
        relations: ['user', 'user.profile'],
      });

      if (!doctor) {
        throw new NotFoundException('Doctor profile not found');
      }

      const start = new Date(createDto.start_time);
      const end = new Date(createDto.end_time);

      if (start >= end) {
        throw new BadRequestException('Start time must be strictly before end time');
      }

      if (start.getTime() < Date.now() - 60000) {
        throw new BadRequestException('Cannot create availability slots in the past');
      }

      // Check for overlapping slots
      const overlapping = await this.slotRepository
        .createQueryBuilder('slot')
        .where('slot.doctor_id = :doctorId', { doctorId: doctor.doctor_id })
        .andWhere('slot.status != :cancelled', { cancelled: 'CANCELLED' })
        .andWhere('slot.start_time < :end AND slot.end_time > :start', {
          start,
          end,
        })
        .getOne();

      if (overlapping) {
        throw new ConflictException(
          'An overlapping availability slot already exists for this time window',
        );
      }

      const slot = this.slotRepository.create({
        doctor_id: doctor.doctor_id,
        start_time: start,
        end_time: end,
        status: 'AVAILABLE',
      });

      const savedSlot = await this.slotRepository.save(slot);
      savedSlot.doctor = doctor;

      return this.mapToSlotEntity(savedSlot);
    } catch (error) {
      handleServiceError(error, this.logger, 'AvailabilitySlotService.createSlot');
    }
  }

  /**
   * Insert: Bulk generate sequential availability slots within a time window.
   */
  async createBulkSlots(
    userId: string,
    bulkDto: BulkCreateSlotsDto,
  ): Promise<AvailabilitySlotEntity[]> {
    try {
      const doctor = await this.doctorRepository.findOne({
        where: { user_id: userId },
        relations: ['user', 'user.profile'],
      });

      if (!doctor) {
        throw new NotFoundException('Doctor profile not found');
      }

      const windowStart = new Date(bulkDto.start_time).getTime();
      const windowEnd = new Date(bulkDto.end_time).getTime();
      const durationMs = bulkDto.slot_duration_minutes * 60 * 1000;

      if (windowStart >= windowEnd) {
        throw new BadRequestException('Start time must be before end time');
      }

      if (windowStart < Date.now() - 60000) {
        throw new BadRequestException('Cannot create availability slots in the past');
      }

      const slotsToCreate: AvailabilitySlot[] = [];
      let currentStart = windowStart;

      while (currentStart + durationMs <= windowEnd) {
        const currentEnd = currentStart + durationMs;
        slotsToCreate.push(
          this.slotRepository.create({
            doctor_id: doctor.doctor_id,
            start_time: new Date(currentStart),
            end_time: new Date(currentEnd),
            status: 'AVAILABLE',
          }),
        );
        currentStart = currentEnd;
      }

      if (slotsToCreate.length === 0) {
        throw new BadRequestException(
          'No slots could be generated with the given duration and window',
        );
      }

      const savedSlots = await this.slotRepository.save(slotsToCreate);

      return savedSlots.map((slot) => {
        slot.doctor = doctor;
        return this.mapToSlotEntity(slot);
      });
    } catch (error) {
      handleServiceError(
        error,
        this.logger,
        'AvailabilitySlotService.createBulkSlots',
      );
    }
  }

  /**
   * Update: Modify time or status of an existing slot.
   */
  async updateSlot(
    userId: string,
    slotId: string,
    updateDto: UpdateAvailabilitySlotDto,
  ): Promise<AvailabilitySlotEntity> {
    try {
      const slot = await this.slotRepository.findOne({
        where: { slot_id: slotId },
        relations: ['doctor', 'doctor.user', 'doctor.user.profile'],
      });

      if (!slot) {
        throw new NotFoundException('Availability slot not found');
      }

      if (slot.doctor?.user_id !== userId) {
        throw new ForbiddenException(
          'You are not authorized to update this availability slot',
        );
      }

      if (
        slot.status === 'BOOKED' &&
        (updateDto.start_time || updateDto.end_time)
      ) {
        throw new BadRequestException(
          'Cannot modify the timing of an already booked slot',
        );
      }

      if (updateDto.start_time) {
        slot.start_time = new Date(updateDto.start_time);
      }

      if (updateDto.end_time) {
        slot.end_time = new Date(updateDto.end_time);
      }

      if (slot.start_time >= slot.end_time) {
        throw new BadRequestException('Start time must be strictly before end time');
      }

      if (updateDto.status) {
        slot.status = updateDto.status;
      }

      const updatedSlot = await this.slotRepository.save(slot);
      return this.mapToSlotEntity(updatedSlot);
    } catch (error) {
      handleServiceError(error, this.logger, 'AvailabilitySlotService.updateSlot');
    }
  }

  /**
   * Delete: Remove or cancel an unbooked availability slot.
   */
  async deleteSlot(userId: string, slotId: string): Promise<boolean> {
    try {
      const slot = await this.slotRepository.findOne({
        where: { slot_id: slotId },
        relations: ['doctor'],
      });

      if (!slot) {
        throw new NotFoundException('Availability slot not found');
      }

      if (slot.doctor?.user_id !== userId) {
        throw new ForbiddenException(
          'You are not authorized to delete this availability slot',
        );
      }

      if (slot.status === 'BOOKED') {
        throw new BadRequestException(
          'Cannot delete a slot that has an active booking',
        );
      }

      await this.slotRepository.remove(slot);
      return true;
    } catch (error) {
      handleServiceError(error, this.logger, 'AvailabilitySlotService.deleteSlot');
    }
  }

  /**
   * Get: Retrieve public available slots for a doctor.
   */
  async getDoctorAvailability(
    doctorId: string,
    fromDate?: Date,
  ): Promise<AvailabilitySlotEntity[]> {
    try {
      const query = this.slotRepository
        .createQueryBuilder('slot')
        .leftJoinAndSelect('slot.doctor', 'doctor')
        .leftJoinAndSelect('doctor.user', 'user')
        .leftJoinAndSelect('user.profile', 'profile')
        .where('slot.doctor_id = :doctorId', { doctorId })
        .andWhere('slot.status = :status', { status: 'AVAILABLE' });

      const dateFilter = fromDate || new Date();
      query.andWhere('slot.start_time >= :dateFilter', { dateFilter });
      query.orderBy('slot.start_time', 'ASC');

      const slots = await query.getMany();
      return slots.map((s) => this.mapToSlotEntity(s));
    } catch (error) {
      handleServiceError(
        error,
        this.logger,
        'AvailabilitySlotService.getDoctorAvailability',
      );
    }
  }

  /**
   * Get: List all slots belonging to the current doctor.
   */
  async myAvailabilitySlots(userId: string): Promise<AvailabilitySlotEntity[]> {
    try {
      const doctor = await this.doctorRepository.findOne({
        where: { user_id: userId },
      });

      if (!doctor) {
        throw new NotFoundException('Doctor profile not found');
      }

      const slots = await this.slotRepository.find({
        where: { doctor_id: doctor.doctor_id },
        relations: ['doctor', 'doctor.user', 'doctor.user.profile'],
        order: { start_time: 'ASC' },
      });

      return slots.map((s) => this.mapToSlotEntity(s));
    } catch (error) {
      handleServiceError(
        error,
        this.logger,
        'AvailabilitySlotService.myAvailabilitySlots',
      );
    }
  }

  /**
   * Get: Retrieve single slot by ID.
   */
  async getSlotById(slotId: string): Promise<AvailabilitySlotEntity> {
    try {
      const slot = await this.slotRepository.findOne({
        where: { slot_id: slotId },
        relations: ['doctor', 'doctor.user', 'doctor.user.profile'],
      });

      if (!slot) {
        throw new NotFoundException('Availability slot not found');
      }

      return this.mapToSlotEntity(slot);
    } catch (error) {
      handleServiceError(
        error,
        this.logger,
        'AvailabilitySlotService.getSlotById',
      );
    }
  }

  /**
   * Helper: Map TypeORM AvailabilitySlot to GraphQL AvailabilitySlotEntity.
   */
  private mapToSlotEntity(slot: AvailabilitySlot): AvailabilitySlotEntity {
    let doctorEntity: DoctorEntity | null = null;

    if (slot.doctor) {
      let doctorUserEntity: UserEntity | null = null;
      if (slot.doctor.user) {
        let doctorProfileEntity: ProfileEntity | null = null;
        if (slot.doctor.user.profile) {
          doctorProfileEntity = {
            profile_id: slot.doctor.user.profile.profile_id,
            user_id: slot.doctor.user.profile.user_id,
            full_name: slot.doctor.user.profile.full_name,
            date_of_birth: slot.doctor.user.profile.date_of_birth,
            gender: slot.doctor.user.profile.gender,
            phone: slot.doctor.user.profile.phone,
            address: slot.doctor.user.profile.address,
            profile_image_url:
              slot.doctor.user.profile.profile_image_url,
            created_at: slot.doctor.user.profile.created_at,
            updated_at: slot.doctor.user.profile.updated_at,
          };
        }

        doctorUserEntity = {
          user_id: slot.doctor.user.user_id,
          email: slot.doctor.user.email,
          role: slot.doctor.user.role,
          status: slot.doctor.user.status,
          email_verified: slot.doctor.user.email_verified,
          last_login_at: slot.doctor.user.last_login_at,
          created_at: slot.doctor.user.created_at,
          updated_at: slot.doctor.user.updated_at,
          profile: doctorProfileEntity,
        };
      }

      doctorEntity = {
        doctor_id: slot.doctor.doctor_id,
        user_id: slot.doctor.user_id,
        specialization: slot.doctor.specialization,
        license_number: slot.doctor.license_number,
        qualification: slot.doctor.qualification,
        experience_years: slot.doctor.experience_years,
        consultation_fee: slot.doctor.consultation_fee,
        verification_status:
          slot.doctor.verification_status as VerificationStatus,
        bio: slot.doctor.bio,
        created_at: slot.doctor.created_at,
        updated_at: slot.doctor.updated_at,
        user: doctorUserEntity,
      };
    }

    return {
      slot_id: slot.slot_id,
      doctor_id: slot.doctor_id,
      start_time: slot.start_time,
      end_time: slot.end_time,
      status: slot.status,
      created_at: slot.created_at,
      doctor: doctorEntity,
    };
  }
}
