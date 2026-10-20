import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Prescription } from '../../schema/prescription.entity';
import { Consultation } from '../../schema/consultation.entity';
import { ConsultationType } from '../../common/enum/consultation-type.enum';
import { VerificationStatus } from '../../common/enum/verification-status.enum';
import { handleServiceError } from '../../utils/error/error.util';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { UpdatePrescriptionDto } from './dto/update-prescription.dto';
import { PrescriptionEntity } from './entities/prescription.entity';
import { MedicationItemEntity } from './entities/medication-item.entity';
import { ConsultationEntity } from '../consultation/entities/consultation.entity';
import { DoctorEntity } from '../doctor/entities/doctor.entity';
import { UserEntity } from '../auth/entities/user.entity';
import { ProfileEntity } from '../auth/entities/profile.entity';

@Injectable()
export class PrescriptionService {
  private readonly logger = new Logger(PrescriptionService.name);

  constructor(
    @InjectRepository(Prescription)
    private readonly prescriptionRepository: Repository<Prescription>,
    @InjectRepository(Consultation)
    private readonly consultationRepository: Repository<Consultation>,
  ) {}

  /**
   * Insert: Doctor creates and issues a new prescription for a consultation.
   */
  async createPrescription(
    doctorUserId: string,
    createDto: CreatePrescriptionDto,
  ): Promise<PrescriptionEntity> {
    try {
      const consultation = await this.consultationRepository.findOne({
        where: { consultation_id: createDto.consultation_id },
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
          'Only the assigned doctor can issue prescriptions for this consultation',
        );
      }

      if (consultation.status === 'CANCELLED') {
        throw new BadRequestException(
          'Cannot issue prescriptions for a cancelled consultation',
        );
      }

      const prescription = this.prescriptionRepository.create({
        consultation_id: createDto.consultation_id,
        diagnosis: createDto.diagnosis.trim(),
        medication_details: createDto.medication_details,
        instructions: createDto.instructions?.trim() || null,
      });

      const savedPrescription =
        await this.prescriptionRepository.save(prescription);
      savedPrescription.consultation = consultation;

      return this.mapToPrescriptionEntity(savedPrescription);
    } catch (error) {
      handleServiceError(
        error,
        this.logger,
        'PrescriptionService.createPrescription',
      );
    }
  }

  /**
   * Update: Doctor updates an existing prescription.
   */
  async updatePrescription(
    doctorUserId: string,
    prescriptionId: string,
    updateDto: UpdatePrescriptionDto,
  ): Promise<PrescriptionEntity> {
    try {
      const prescription = await this.prescriptionRepository.findOne({
        where: { prescription_id: prescriptionId },
        relations: [
          'consultation',
          'consultation.doctor',
          'consultation.doctor.user',
          'consultation.doctor.user.profile',
          'consultation.patient',
          'consultation.patient.profile',
        ],
      });

      if (!prescription) {
        throw new NotFoundException('Prescription not found');
      }

      if (prescription.consultation?.doctor?.user_id !== doctorUserId) {
        throw new ForbiddenException(
          'Only the issuing doctor can modify this prescription',
        );
      }

      if (updateDto.diagnosis !== undefined) {
        prescription.diagnosis = updateDto.diagnosis.trim();
      }

      if (updateDto.medication_details !== undefined) {
        prescription.medication_details = updateDto.medication_details;
      }

      if (updateDto.instructions !== undefined) {
        prescription.instructions = updateDto.instructions?.trim() || null;
      }

      const updated = await this.prescriptionRepository.save(prescription);
      return this.mapToPrescriptionEntity(updated);
    } catch (error) {
      handleServiceError(
        error,
        this.logger,
        'PrescriptionService.updatePrescription',
      );
    }
  }

  /**
   * Get: Retrieve a single prescription by ID.
   */
  async getPrescriptionById(
    userId: string,
    prescriptionId: string,
  ): Promise<PrescriptionEntity> {
    try {
      const prescription = await this.prescriptionRepository.findOne({
        where: { prescription_id: prescriptionId },
        relations: [
          'consultation',
          'consultation.doctor',
          'consultation.doctor.user',
          'consultation.doctor.user.profile',
          'consultation.patient',
          'consultation.patient.profile',
        ],
      });

      if (!prescription) {
        throw new NotFoundException('Prescription not found');
      }

      const isPatient = prescription.consultation?.patient_id === userId;
      const isDoctor =
        prescription.consultation?.doctor?.user_id === userId;

      if (!isPatient && !isDoctor) {
        throw new ForbiddenException(
          'You are not authorized to view this prescription',
        );
      }

      return this.mapToPrescriptionEntity(prescription);
    } catch (error) {
      handleServiceError(
        error,
        this.logger,
        'PrescriptionService.getPrescriptionById',
      );
    }
  }

  /**
   * Get: Retrieve all prescriptions associated with a specific consultation.
   */
  async getPrescriptionsByConsultation(
    userId: string,
    consultationId: string,
  ): Promise<PrescriptionEntity[]> {
    try {
      const consultation = await this.consultationRepository.findOne({
        where: { consultation_id: consultationId },
        relations: ['doctor', 'doctor.user', 'patient'],
      });

      if (!consultation) {
        throw new NotFoundException('Consultation not found');
      }

      const isPatient = consultation.patient_id === userId;
      const isDoctor = consultation.doctor?.user_id === userId;

      if (!isPatient && !isDoctor) {
        throw new ForbiddenException(
          'You are not authorized to view prescriptions for this consultation',
        );
      }

      const prescriptions = await this.prescriptionRepository.find({
        where: { consultation_id: consultationId },
        relations: [
          'consultation',
          'consultation.doctor',
          'consultation.doctor.user',
          'consultation.doctor.user.profile',
          'consultation.patient',
          'consultation.patient.profile',
        ],
        order: { issued_at: 'DESC' },
      });

      return prescriptions.map((p) => this.mapToPrescriptionEntity(p));
    } catch (error) {
      handleServiceError(
        error,
        this.logger,
        'PrescriptionService.getPrescriptionsByConsultation',
      );
    }
  }

  /**
   * Get: List all prescriptions for the current authenticated user (patient or doctor).
   */
  async myPrescriptions(userId: string): Promise<PrescriptionEntity[]> {
    try {
      const prescriptions = await this.prescriptionRepository
        .createQueryBuilder('prescription')
        .leftJoinAndSelect('prescription.consultation', 'consultation')
        .leftJoinAndSelect('consultation.doctor', 'doctor')
        .leftJoinAndSelect('doctor.user', 'doctorUser')
        .leftJoinAndSelect('doctorUser.profile', 'doctorProfile')
        .leftJoinAndSelect('consultation.patient', 'patient')
        .leftJoinAndSelect('patient.profile', 'patientProfile')
        .where(
          'consultation.patient_id = :userId OR doctor.user_id = :userId',
          { userId },
        )
        .orderBy('prescription.issued_at', 'DESC')
        .getMany();

      return prescriptions.map((p) => this.mapToPrescriptionEntity(p));
    } catch (error) {
      handleServiceError(
        error,
        this.logger,
        'PrescriptionService.myPrescriptions',
      );
    }
  }

  /**
   * Helper: Map TypeORM Prescription to GraphQL PrescriptionEntity.
   */
  private mapToPrescriptionEntity(
    prescription: Prescription,
  ): PrescriptionEntity {
    let consultationEntity: ConsultationEntity | null = null;

    if (prescription.consultation) {
      let patientEntity: UserEntity | null = null;
      let doctorEntity: DoctorEntity | null = null;

      if (prescription.consultation.patient) {
        let profileEntity: ProfileEntity | null = null;
        if (prescription.consultation.patient.profile) {
          profileEntity = {
            profile_id:
              prescription.consultation.patient.profile.profile_id,
            user_id: prescription.consultation.patient.profile.user_id,
            full_name:
              prescription.consultation.patient.profile.full_name,
            date_of_birth:
              prescription.consultation.patient.profile.date_of_birth,
            gender: prescription.consultation.patient.profile.gender,
            phone: prescription.consultation.patient.profile.phone,
            address: prescription.consultation.patient.profile.address,
            profile_image_url:
              prescription.consultation.patient.profile.profile_image_url,
            created_at:
              prescription.consultation.patient.profile.created_at,
            updated_at:
              prescription.consultation.patient.profile.updated_at,
          };
        }

        patientEntity = {
          user_id: prescription.consultation.patient.user_id,
          email: prescription.consultation.patient.email,
          role: prescription.consultation.patient.role,
          status: prescription.consultation.patient.status,
          email_verified:
            prescription.consultation.patient.email_verified,
          last_login_at:
            prescription.consultation.patient.last_login_at,
          created_at: prescription.consultation.patient.created_at,
          updated_at: prescription.consultation.patient.updated_at,
          profile: profileEntity,
        };
      }

      if (prescription.consultation.doctor) {
        let doctorUserEntity: UserEntity | null = null;
        if (prescription.consultation.doctor.user) {
          let doctorProfileEntity: ProfileEntity | null = null;
          if (prescription.consultation.doctor.user.profile) {
            doctorProfileEntity = {
              profile_id:
                prescription.consultation.doctor.user.profile.profile_id,
              user_id:
                prescription.consultation.doctor.user.profile.user_id,
              full_name:
                prescription.consultation.doctor.user.profile.full_name,
              date_of_birth:
                prescription.consultation.doctor.user.profile
                  .date_of_birth,
              gender:
                prescription.consultation.doctor.user.profile.gender,
              phone:
                prescription.consultation.doctor.user.profile.phone,
              address:
                prescription.consultation.doctor.user.profile.address,
              profile_image_url:
                prescription.consultation.doctor.user.profile
                  .profile_image_url,
              created_at:
                prescription.consultation.doctor.user.profile.created_at,
              updated_at:
                prescription.consultation.doctor.user.profile.updated_at,
            };
          }

          doctorUserEntity = {
            user_id: prescription.consultation.doctor.user.user_id,
            email: prescription.consultation.doctor.user.email,
            role: prescription.consultation.doctor.user.role,
            status: prescription.consultation.doctor.user.status,
            email_verified:
              prescription.consultation.doctor.user.email_verified,
            last_login_at:
              prescription.consultation.doctor.user.last_login_at,
            created_at:
              prescription.consultation.doctor.user.created_at,
            updated_at:
              prescription.consultation.doctor.user.updated_at,
            profile: doctorProfileEntity,
          };
        }

        doctorEntity = {
          doctor_id: prescription.consultation.doctor.doctor_id,
          user_id: prescription.consultation.doctor.user_id,
          specialization:
            prescription.consultation.doctor.specialization,
          license_number:
            prescription.consultation.doctor.license_number,
          qualification:
            prescription.consultation.doctor.qualification,
          experience_years:
            prescription.consultation.doctor.experience_years,
          consultation_fee:
            prescription.consultation.doctor.consultation_fee,
          verification_status:
            prescription.consultation.doctor
              .verification_status as VerificationStatus,
          bio: prescription.consultation.doctor.bio,
          created_at: prescription.consultation.doctor.created_at,
          updated_at: prescription.consultation.doctor.updated_at,
          user: doctorUserEntity,
        };
      }

      consultationEntity = {
        consultation_id: prescription.consultation.consultation_id,
        patient_id: prescription.consultation.patient_id,
        doctor_id: prescription.consultation.doctor_id,
        slot_id: prescription.consultation.slot_id,
        scheduled_at: prescription.consultation.scheduled_at,
        consultation_type:
          prescription.consultation
            .consultation_type as ConsultationType,
        reason: prescription.consultation.reason,
        status: prescription.consultation.status,
        notes: prescription.consultation.notes,
        created_at: prescription.consultation.created_at,
        updated_at: prescription.consultation.updated_at,
        patient: patientEntity,
        doctor: doctorEntity,
      };
    }

    // Safely cast medication_details JSON array to MedicationItemEntity[]
    const medicationItems: MedicationItemEntity[] = Array.isArray(
      prescription.medication_details,
    )
      ? (prescription.medication_details as MedicationItemEntity[])
      : [];

    return {
      prescription_id: prescription.prescription_id,
      consultation_id: prescription.consultation_id,
      diagnosis: prescription.diagnosis,
      medication_details: medicationItems,
      instructions: prescription.instructions,
      issued_at: prescription.issued_at,
      consultation: consultationEntity,
    };
  }
}
