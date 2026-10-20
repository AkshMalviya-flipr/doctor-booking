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

import { Consultation } from '../../schema/consultation.entity';
import { Doctor } from '../../schema/doctor.entity';
import { User } from '../../schema/user.entity';
import { AvailabilitySlot } from '../../schema/availability_slot.entity';
import { ConsultationType } from '../../common/enum/consultation-type.enum';
import { VerificationStatus } from '../../common/enum/verification-status.enum';
import { handleServiceError } from '../../utils/error/error.util';
import { CreateConsultationDto } from './dto/create-consultation.dto';
import { RescheduleConsultationDto } from './dto/reschedule-consultation.dto';
import { ConsultationEntity } from './entities/consultation.entity';
import { DoctorEntity } from '../doctor/entities/doctor.entity';
import { UserEntity } from '../auth/entities/user.entity';
import { ProfileEntity } from '../auth/entities/profile.entity';

@Injectable()
export class ConsultationService {
  private readonly logger = new Logger(ConsultationService.name);

  constructor(
    @InjectRepository(Consultation)
    private readonly consultationRepository: Repository<Consultation>,
    @InjectRepository(Doctor)
    private readonly doctorRepository: Repository<Doctor>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(AvailabilitySlot)
    private readonly slotRepository: Repository<AvailabilitySlot>,
  ) {}

  /**
   * Insert: Book a new consultation with a doctor.
   */
  async bookConsultation(
    patientUserId: string,
    createDto: CreateConsultationDto,
  ): Promise<ConsultationEntity> {
    try {
      // 1. Fetch doctor and check validity
      const doctor = await this.doctorRepository.findOne({
        where: { doctor_id: createDto.doctor_id },
        relations: ['user', 'user.profile'],
      });

      if (!doctor) {
        throw new NotFoundException('Doctor not found');
      }

      // Prevent doctor booking appointment with themselves
      if (doctor.user_id === patientUserId) {
        throw new BadRequestException(
          'Doctors cannot book consultations with themselves',
        );
      }

      // 2. Fetch patient user
      const patient = await this.userRepository.findOne({
        where: { user_id: patientUserId },
        relations: ['profile'],
      });

      if (!patient) {
        throw new NotFoundException('Patient account not found');
      }

      // 3. Handle availability slot if selected
      let slot: AvailabilitySlot | null = null;
      if (createDto.slot_id) {
        slot = await this.slotRepository.findOne({
          where: { slot_id: createDto.slot_id },
        });

        if (!slot) {
          throw new NotFoundException('Selected availability slot not found');
        }

        if (slot.doctor_id !== createDto.doctor_id) {
          throw new BadRequestException(
            'Selected slot does not belong to this doctor',
          );
        }

        if (slot.status !== 'AVAILABLE') {
          throw new ConflictException(
            'Selected availability slot is already booked',
          );
        }

        slot.status = 'BOOKED';
        await this.slotRepository.save(slot);
      }

      // 4. Create consultation
      const consultation = this.consultationRepository.create({
        patient_id: patientUserId,
        doctor_id: createDto.doctor_id,
        slot_id: createDto.slot_id || null,
        scheduled_at: createDto.scheduled_at,
        consultation_type: createDto.consultation_type,
        reason: createDto.reason?.trim() || null,
        status: 'BOOKED',
      });

      const savedConsultation =
        await this.consultationRepository.save(consultation);
      savedConsultation.patient = patient;
      savedConsultation.doctor = doctor;
      savedConsultation.slot = slot;

      return this.mapToConsultationEntity(savedConsultation);
    } catch (error) {
      handleServiceError(error, this.logger, 'ConsultationService.bookConsultation');
    }
  }

  /**
   * Update: Reschedule consultation to a new date or slot.
   */
  async rescheduleConsultation(
    userId: string,
    rescheduleDto: RescheduleConsultationDto,
  ): Promise<ConsultationEntity> {
    try {
      const consultation = await this.consultationRepository.findOne({
        where: { consultation_id: rescheduleDto.consultation_id },
        relations: [
          'doctor',
          'doctor.user',
          'doctor.user.profile',
          'patient',
          'patient.profile',
          'slot',
        ],
      });

      if (!consultation) {
        throw new NotFoundException('Consultation not found');
      }

      // Authorization check
      const isPatient = consultation.patient_id === userId;
      const isDoctor = consultation.doctor?.user_id === userId;

      if (!isPatient && !isDoctor) {
        throw new ForbiddenException(
          'You are not authorized to reschedule this consultation',
        );
      }

      if (
        consultation.status === 'COMPLETED' ||
        consultation.status === 'CANCELLED'
      ) {
        throw new BadRequestException(
          `Cannot reschedule a ${consultation.status.toLowerCase()} consultation`,
        );
      }

      // Release previous slot if changing
      if (
        consultation.slot_id &&
        consultation.slot_id !== rescheduleDto.slot_id
      ) {
        const previousSlot = await this.slotRepository.findOne({
          where: { slot_id: consultation.slot_id },
        });
        if (previousSlot) {
          previousSlot.status = 'AVAILABLE';
          await this.slotRepository.save(previousSlot);
        }
      }

      // Claim new slot if specified
      if (
        rescheduleDto.slot_id &&
        rescheduleDto.slot_id !== consultation.slot_id
      ) {
        const newSlot = await this.slotRepository.findOne({
          where: { slot_id: rescheduleDto.slot_id },
        });

        if (!newSlot) {
          throw new NotFoundException('New availability slot not found');
        }

        if (newSlot.doctor_id !== consultation.doctor_id) {
          throw new BadRequestException(
            'New slot does not belong to the assigned doctor',
          );
        }

        if (newSlot.status !== 'AVAILABLE') {
          throw new ConflictException(
            'New availability slot is no longer available',
          );
        }

        newSlot.status = 'BOOKED';
        await this.slotRepository.save(newSlot);
        consultation.slot_id = rescheduleDto.slot_id;
      }

      consultation.scheduled_at = rescheduleDto.scheduled_at;
      const updatedConsultation =
        await this.consultationRepository.save(consultation);

      return this.mapToConsultationEntity(updatedConsultation);
    } catch (error) {
      handleServiceError(
        error,
        this.logger,
        'ConsultationService.rescheduleConsultation',
      );
    }
  }

  /**
   * Update: Cancel consultation and release any assigned availability slot.
   */
  async cancelConsultation(
    userId: string,
    consultationId: string,
    reason?: string,
  ): Promise<ConsultationEntity> {
    try {
      const consultation = await this.consultationRepository.findOne({
        where: { consultation_id: consultationId },
        relations: [
          'doctor',
          'doctor.user',
          'doctor.user.profile',
          'patient',
          'patient.profile',
          'slot',
        ],
      });

      if (!consultation) {
        throw new NotFoundException('Consultation not found');
      }

      const isPatient = consultation.patient_id === userId;
      const isDoctor = consultation.doctor?.user_id === userId;

      if (!isPatient && !isDoctor) {
        throw new ForbiddenException(
          'You are not authorized to cancel this consultation',
        );
      }

      if (consultation.status === 'CANCELLED') {
        throw new BadRequestException('Consultation is already cancelled');
      }

      if (consultation.status === 'COMPLETED') {
        throw new BadRequestException(
          'Cannot cancel an already completed consultation',
        );
      }

      // Free up the availability slot
      if (consultation.slot_id) {
        const slot = await this.slotRepository.findOne({
          where: { slot_id: consultation.slot_id },
        });
        if (slot) {
          slot.status = 'AVAILABLE';
          await this.slotRepository.save(slot);
        }
      }

      consultation.status = 'CANCELLED';
      if (reason) {
        consultation.notes = consultation.notes
          ? `${consultation.notes}\nCancellation reason: ${reason}`
          : `Cancellation reason: ${reason}`;
      }

      const updatedConsultation =
        await this.consultationRepository.save(consultation);
      return this.mapToConsultationEntity(updatedConsultation);
    } catch (error) {
      handleServiceError(
        error,
        this.logger,
        'ConsultationService.cancelConsultation',
      );
    }
  }

  /**
   * Update: Mark consultation as completed with optional doctor notes.
   */
  async completeConsultation(
    doctorUserId: string,
    consultationId: string,
    notes?: string,
  ): Promise<ConsultationEntity> {
    try {
      const consultation = await this.consultationRepository.findOne({
        where: { consultation_id: consultationId },
        relations: [
          'doctor',
          'doctor.user',
          'doctor.user.profile',
          'patient',
          'patient.profile',
        ],
      });

      if (!consultation) {
        throw new NotFoundException('Consultation not found');
      }

      if (consultation.doctor?.user_id !== doctorUserId) {
        throw new ForbiddenException(
          'Only the assigned doctor can complete this consultation',
        );
      }

      if (consultation.status === 'CANCELLED') {
        throw new BadRequestException('Cannot complete a cancelled consultation');
      }

      consultation.status = 'COMPLETED';
      if (notes) {
        consultation.notes = notes;
      }

      const updatedConsultation =
        await this.consultationRepository.save(consultation);
      return this.mapToConsultationEntity(updatedConsultation);
    } catch (error) {
      handleServiceError(
        error,
        this.logger,
        'ConsultationService.completeConsultation',
      );
    }
  }

  /**
   * Get: Retrieve single consultation by ID.
   */
  async getConsultationById(
    userId: string,
    consultationId: string,
  ): Promise<ConsultationEntity> {
    try {
      const consultation = await this.consultationRepository.findOne({
        where: { consultation_id: consultationId },
        relations: [
          'doctor',
          'doctor.user',
          'doctor.user.profile',
          'patient',
          'patient.profile',
        ],
      });

      if (!consultation) {
        throw new NotFoundException('Consultation not found');
      }

      const isPatient = consultation.patient_id === userId;
      const isDoctor = consultation.doctor?.user_id === userId;

      if (!isPatient && !isDoctor) {
        throw new ForbiddenException(
          'You are not authorized to view this consultation',
        );
      }

      return this.mapToConsultationEntity(consultation);
    } catch (error) {
      handleServiceError(
        error,
        this.logger,
        'ConsultationService.getConsultationById',
      );
    }
  }

  /**
   * Get: List consultations for current authenticated user (patient or doctor).
   */
  async myConsultations(userId: string): Promise<ConsultationEntity[]> {
    try {
      const doctor = await this.doctorRepository.findOne({
        where: { user_id: userId },
      });

      const whereConditions: any[] = [{ patient_id: userId }];
      if (doctor) {
        whereConditions.push({ doctor_id: doctor.doctor_id });
      }

      const consultations = await this.consultationRepository.find({
        where: whereConditions,
        relations: [
          'doctor',
          'doctor.user',
          'doctor.user.profile',
          'patient',
          'patient.profile',
        ],
        order: { scheduled_at: 'DESC' },
      });

      return consultations.map((c) => this.mapToConsultationEntity(c));
    } catch (error) {
      handleServiceError(
        error,
        this.logger,
        'ConsultationService.myConsultations',
      );
    }
  }

  /**
   * Helper: Map TypeORM Consultation to GraphQL ConsultationEntity.
   */
  private mapToConsultationEntity(
    consultation: Consultation,
  ): ConsultationEntity {
    let patientEntity: UserEntity | null = null;
    let doctorEntity: DoctorEntity | null = null;

    if (consultation.patient) {
      let profileEntity: ProfileEntity | null = null;
      if (consultation.patient.profile) {
        profileEntity = {
          profile_id: consultation.patient.profile.profile_id,
          user_id: consultation.patient.profile.user_id,
          full_name: consultation.patient.profile.full_name,
          date_of_birth: consultation.patient.profile.date_of_birth,
          gender: consultation.patient.profile.gender,
          phone: consultation.patient.profile.phone,
          address: consultation.patient.profile.address,
          profile_image_url: consultation.patient.profile.profile_image_url,
          created_at: consultation.patient.profile.created_at,
          updated_at: consultation.patient.profile.updated_at,
        };
      }

      patientEntity = {
        user_id: consultation.patient.user_id,
        email: consultation.patient.email,
        role: consultation.patient.role,
        status: consultation.patient.status,
        email_verified: consultation.patient.email_verified,
        last_login_at: consultation.patient.last_login_at,
        created_at: consultation.patient.created_at,
        updated_at: consultation.patient.updated_at,
        profile: profileEntity,
      };
    }

    if (consultation.doctor) {
      let doctorUserEntity: UserEntity | null = null;
      if (consultation.doctor.user) {
        let doctorProfileEntity: ProfileEntity | null = null;
        if (consultation.doctor.user.profile) {
          doctorProfileEntity = {
            profile_id: consultation.doctor.user.profile.profile_id,
            user_id: consultation.doctor.user.profile.user_id,
            full_name: consultation.doctor.user.profile.full_name,
            date_of_birth: consultation.doctor.user.profile.date_of_birth,
            gender: consultation.doctor.user.profile.gender,
            phone: consultation.doctor.user.profile.phone,
            address: consultation.doctor.user.profile.address,
            profile_image_url:
              consultation.doctor.user.profile.profile_image_url,
            created_at: consultation.doctor.user.profile.created_at,
            updated_at: consultation.doctor.user.profile.updated_at,
          };
        }

        doctorUserEntity = {
          user_id: consultation.doctor.user.user_id,
          email: consultation.doctor.user.email,
          role: consultation.doctor.user.role,
          status: consultation.doctor.user.status,
          email_verified: consultation.doctor.user.email_verified,
          last_login_at: consultation.doctor.user.last_login_at,
          created_at: consultation.doctor.user.created_at,
          updated_at: consultation.doctor.user.updated_at,
          profile: doctorProfileEntity,
        };
      }

      doctorEntity = {
        doctor_id: consultation.doctor.doctor_id,
        user_id: consultation.doctor.user_id,
        specialization: consultation.doctor.specialization,
        license_number: consultation.doctor.license_number,
        qualification: consultation.doctor.qualification,
        experience_years: consultation.doctor.experience_years,
        consultation_fee: consultation.doctor.consultation_fee,
        verification_status:
          consultation.doctor.verification_status as VerificationStatus,
        bio: consultation.doctor.bio,
        created_at: consultation.doctor.created_at,
        updated_at: consultation.doctor.updated_at,
        user: doctorUserEntity,
      };
    }

    return {
      consultation_id: consultation.consultation_id,
      patient_id: consultation.patient_id,
      doctor_id: consultation.doctor_id,
      slot_id: consultation.slot_id,
      scheduled_at: consultation.scheduled_at,
      consultation_type: consultation.consultation_type as ConsultationType,
      reason: consultation.reason,
      status: consultation.status,
      notes: consultation.notes,
      created_at: consultation.created_at,
      updated_at: consultation.updated_at,
      patient: patientEntity,
      doctor: doctorEntity,
    };
  }
}
