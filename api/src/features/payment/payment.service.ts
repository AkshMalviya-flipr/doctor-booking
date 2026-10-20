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

import { Payment } from '../../schema/payment.entity';
import { Consultation } from '../../schema/consultation.entity';
import { ConsultationType } from '../../common/enum/consultation-type.enum';
import { VerificationStatus } from '../../common/enum/verification-status.enum';
import { handleServiceError } from '../../utils/error/error.util';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { ProcessPaymentDto } from './dto/process-payment.dto';
import { PaymentEntity } from './entities/payment.entity';
import { ConsultationEntity } from '../consultation/entities/consultation.entity';
import { DoctorEntity } from '../doctor/entities/doctor.entity';
import { UserEntity } from '../auth/entities/user.entity';
import { ProfileEntity } from '../auth/entities/profile.entity';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(Consultation)
    private readonly consultationRepository: Repository<Consultation>,
  ) {}

  /**
   * Insert: Create and initiate a payment for a consultation.
   */
  async createPayment(
    patientUserId: string,
    createDto: CreatePaymentDto,
  ): Promise<PaymentEntity> {
    try {
      const consultation = await this.consultationRepository.findOne({
        where: { consultation_id: createDto.consultation_id },
        relations: [
          'patient',
          'patient.profile',
          'doctor',
          'doctor.user',
          'doctor.user.profile',
        ],
      });

      if (!consultation) {
        throw new NotFoundException('Consultation not found');
      }

      if (consultation.patient_id !== patientUserId) {
        throw new ForbiddenException(
          'Only the patient of this consultation can initiate a payment',
        );
      }

      if (consultation.status === 'CANCELLED') {
        throw new BadRequestException('Cannot initiate payment for a cancelled consultation');
      }

      // Generate unique transaction reference if not supplied
      const txRef =
        createDto.transaction_reference?.trim() ||
        `TXN_${Date.now()}_${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

      const existingPayment = await this.paymentRepository.findOne({
        where: { transaction_reference: txRef },
      });

      if (existingPayment) {
        throw new ConflictException(
          'A payment with this transaction reference already exists',
        );
      }

      const payment = this.paymentRepository.create({
        consultation_id: createDto.consultation_id,
        amount: createDto.amount.trim(),
        currency: createDto.currency.toUpperCase().trim(),
        payment_method: createDto.payment_method.trim(),
        payment_status: 'PENDING',
        transaction_reference: txRef,
        paid_at: null,
      });

      const savedPayment = await this.paymentRepository.save(payment);
      savedPayment.consultation = consultation;

      return this.mapToPaymentEntity(savedPayment);
    } catch (error) {
      handleServiceError(error, this.logger, 'PaymentService.createPayment');
    }
  }

  /**
   * Update: Process and update payment transaction status (e.g. mark as PAID).
   */
  async processPayment(
    userId: string,
    processDto: ProcessPaymentDto,
  ): Promise<PaymentEntity> {
    try {
      const payment = await this.paymentRepository.findOne({
        where: { payment_id: processDto.payment_id },
        relations: [
          'consultation',
          'consultation.patient',
          'consultation.doctor',
          'consultation.doctor.user',
        ],
      });

      if (!payment) {
        throw new NotFoundException('Payment record not found');
      }

      const isPatient = payment.consultation?.patient_id === userId;
      const isDoctor = payment.consultation?.doctor?.user_id === userId;

      if (!isPatient && !isDoctor) {
        throw new ForbiddenException(
          'You are not authorized to process this payment',
        );
      }

      payment.payment_status = processDto.payment_status.toUpperCase().trim();

      if (processDto.payment_method) {
        payment.payment_method = processDto.payment_method.trim();
      }

      if (processDto.transaction_reference) {
        payment.transaction_reference = processDto.transaction_reference.trim();
      }

      if (
        payment.payment_status === 'PAID' ||
        payment.payment_status === 'COMPLETED'
      ) {
        payment.paid_at = new Date();
      }

      const updatedPayment = await this.paymentRepository.save(payment);
      return this.mapToPaymentEntity(updatedPayment);
    } catch (error) {
      handleServiceError(error, this.logger, 'PaymentService.processPayment');
    }
  }

  /**
   * Update: Refund a completed payment.
   */
  async refundPayment(
    userId: string,
    paymentId: string,
  ): Promise<PaymentEntity> {
    try {
      const payment = await this.paymentRepository.findOne({
        where: { payment_id: paymentId },
        relations: [
          'consultation',
          'consultation.patient',
          'consultation.doctor',
          'consultation.doctor.user',
        ],
      });

      if (!payment) {
        throw new NotFoundException('Payment record not found');
      }

      const isPatient = payment.consultation?.patient_id === userId;
      const isDoctor = payment.consultation?.doctor?.user_id === userId;

      if (!isPatient && !isDoctor) {
        throw new ForbiddenException(
          'You are not authorized to refund this payment',
        );
      }

      if (payment.payment_status === 'REFUNDED') {
        throw new BadRequestException('This payment has already been refunded');
      }

      if (
        payment.payment_status !== 'PAID' &&
        payment.payment_status !== 'COMPLETED'
      ) {
        throw new BadRequestException(
          'Cannot refund a payment that has not been completed',
        );
      }

      payment.payment_status = 'REFUNDED';
      const updatedPayment = await this.paymentRepository.save(payment);

      return this.mapToPaymentEntity(updatedPayment);
    } catch (error) {
      handleServiceError(error, this.logger, 'PaymentService.refundPayment');
    }
  }

  /**
   * Get: Retrieve payment by ID.
   */
  async getPaymentById(
    userId: string,
    paymentId: string,
  ): Promise<PaymentEntity> {
    try {
      const payment = await this.paymentRepository.findOne({
        where: { payment_id: paymentId },
        relations: [
          'consultation',
          'consultation.patient',
          'consultation.patient.profile',
          'consultation.doctor',
          'consultation.doctor.user',
          'consultation.doctor.user.profile',
        ],
      });

      if (!payment) {
        throw new NotFoundException('Payment record not found');
      }

      const isPatient = payment.consultation?.patient_id === userId;
      const isDoctor = payment.consultation?.doctor?.user_id === userId;

      if (!isPatient && !isDoctor) {
        throw new ForbiddenException(
          'You are not authorized to view this payment',
        );
      }

      return this.mapToPaymentEntity(payment);
    } catch (error) {
      handleServiceError(error, this.logger, 'PaymentService.getPaymentById');
    }
  }

  /**
   * Get: Retrieve all payments for a consultation.
   */
  async getPaymentsByConsultation(
    userId: string,
    consultationId: string,
  ): Promise<PaymentEntity[]> {
    try {
      const consultation = await this.consultationRepository.findOne({
        where: { consultation_id: consultationId },
        relations: ['doctor', 'doctor.user'],
      });

      if (!consultation) {
        throw new NotFoundException('Consultation not found');
      }

      const isPatient = consultation.patient_id === userId;
      const isDoctor = consultation.doctor?.user_id === userId;

      if (!isPatient && !isDoctor) {
        throw new ForbiddenException(
          'You are not authorized to view payments for this consultation',
        );
      }

      const payments = await this.paymentRepository.find({
        where: { consultation_id: consultationId },
        relations: [
          'consultation',
          'consultation.patient',
          'consultation.patient.profile',
          'consultation.doctor',
          'consultation.doctor.user',
          'consultation.doctor.user.profile',
        ],
        order: { created_at: 'DESC' },
      });

      return payments.map((p) => this.mapToPaymentEntity(p));
    } catch (error) {
      handleServiceError(
        error,
        this.logger,
        'PaymentService.getPaymentsByConsultation',
      );
    }
  }

  /**
   * Get: List all payments for the authenticated user (patient or doctor).
   */
  async myPayments(userId: string): Promise<PaymentEntity[]> {
    try {
      const payments = await this.paymentRepository
        .createQueryBuilder('payment')
        .leftJoinAndSelect('payment.consultation', 'consultation')
        .leftJoinAndSelect('consultation.doctor', 'doctor')
        .leftJoinAndSelect('doctor.user', 'doctorUser')
        .leftJoinAndSelect('doctorUser.profile', 'doctorProfile')
        .leftJoinAndSelect('consultation.patient', 'patient')
        .leftJoinAndSelect('patient.profile', 'patientProfile')
        .where(
          'consultation.patient_id = :userId OR doctor.user_id = :userId',
          { userId },
        )
        .orderBy('payment.created_at', 'DESC')
        .getMany();

      return payments.map((p) => this.mapToPaymentEntity(p));
    } catch (error) {
      handleServiceError(error, this.logger, 'PaymentService.myPayments');
    }
  }

  /**
   * Helper: Map TypeORM Payment to GraphQL PaymentEntity.
   */
  private mapToPaymentEntity(payment: Payment): PaymentEntity {
    let consultationEntity: ConsultationEntity | null = null;

    if (payment.consultation) {
      let patientEntity: UserEntity | null = null;
      let doctorEntity: DoctorEntity | null = null;

      if (payment.consultation.patient) {
        let profileEntity: ProfileEntity | null = null;
        if (payment.consultation.patient.profile) {
          profileEntity = {
            profile_id: payment.consultation.patient.profile.profile_id,
            user_id: payment.consultation.patient.profile.user_id,
            full_name: payment.consultation.patient.profile.full_name,
            date_of_birth:
              payment.consultation.patient.profile.date_of_birth,
            gender: payment.consultation.patient.profile.gender,
            phone: payment.consultation.patient.profile.phone,
            address: payment.consultation.patient.profile.address,
            profile_image_url:
              payment.consultation.patient.profile.profile_image_url,
            created_at: payment.consultation.patient.profile.created_at,
            updated_at: payment.consultation.patient.profile.updated_at,
          };
        }

        patientEntity = {
          user_id: payment.consultation.patient.user_id,
          email: payment.consultation.patient.email,
          role: payment.consultation.patient.role,
          status: payment.consultation.patient.status,
          email_verified: payment.consultation.patient.email_verified,
          last_login_at: payment.consultation.patient.last_login_at,
          created_at: payment.consultation.patient.created_at,
          updated_at: payment.consultation.patient.updated_at,
          profile: profileEntity,
        };
      }

      if (payment.consultation.doctor) {
        let doctorUserEntity: UserEntity | null = null;
        if (payment.consultation.doctor.user) {
          let doctorProfileEntity: ProfileEntity | null = null;
          if (payment.consultation.doctor.user.profile) {
            doctorProfileEntity = {
              profile_id:
                payment.consultation.doctor.user.profile.profile_id,
              user_id: payment.consultation.doctor.user.profile.user_id,
              full_name:
                payment.consultation.doctor.user.profile.full_name,
              date_of_birth:
                payment.consultation.doctor.user.profile.date_of_birth,
              gender: payment.consultation.doctor.user.profile.gender,
              phone: payment.consultation.doctor.user.profile.phone,
              address: payment.consultation.doctor.user.profile.address,
              profile_image_url:
                payment.consultation.doctor.user.profile
                  .profile_image_url,
              created_at:
                payment.consultation.doctor.user.profile.created_at,
              updated_at:
                payment.consultation.doctor.user.profile.updated_at,
            };
          }

          doctorUserEntity = {
            user_id: payment.consultation.doctor.user.user_id,
            email: payment.consultation.doctor.user.email,
            role: payment.consultation.doctor.user.role,
            status: payment.consultation.doctor.user.status,
            email_verified:
              payment.consultation.doctor.user.email_verified,
            last_login_at:
              payment.consultation.doctor.user.last_login_at,
            created_at: payment.consultation.doctor.user.created_at,
            updated_at: payment.consultation.doctor.user.updated_at,
            profile: doctorProfileEntity,
          };
        }

        doctorEntity = {
          doctor_id: payment.consultation.doctor.doctor_id,
          user_id: payment.consultation.doctor.user_id,
          specialization: payment.consultation.doctor.specialization,
          license_number: payment.consultation.doctor.license_number,
          qualification: payment.consultation.doctor.qualification,
          experience_years: payment.consultation.doctor.experience_years,
          consultation_fee: payment.consultation.doctor.consultation_fee,
          verification_status:
            payment.consultation.doctor
              .verification_status as VerificationStatus,
          bio: payment.consultation.doctor.bio,
          created_at: payment.consultation.doctor.created_at,
          updated_at: payment.consultation.doctor.updated_at,
          user: doctorUserEntity,
        };
      }

      consultationEntity = {
        consultation_id: payment.consultation.consultation_id,
        patient_id: payment.consultation.patient_id,
        doctor_id: payment.consultation.doctor_id,
        slot_id: payment.consultation.slot_id,
        scheduled_at: payment.consultation.scheduled_at,
        consultation_type:
          payment.consultation.consultation_type as ConsultationType,
        reason: payment.consultation.reason,
        status: payment.consultation.status,
        notes: payment.consultation.notes,
        created_at: payment.consultation.created_at,
        updated_at: payment.consultation.updated_at,
        patient: patientEntity,
        doctor: doctorEntity,
      };
    }

    return {
      payment_id: payment.payment_id,
      consultation_id: payment.consultation_id,
      amount: payment.amount,
      currency: payment.currency,
      payment_method: payment.payment_method,
      payment_status: payment.payment_status,
      transaction_reference: payment.transaction_reference,
      paid_at: payment.paid_at,
      created_at: payment.created_at,
      consultation: consultationEntity,
    };
  }
}
