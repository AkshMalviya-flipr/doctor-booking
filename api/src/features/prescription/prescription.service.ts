// prescription.service.ts
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreatePrescriptionInput } from './dto/create-prescription.input';
import { Prescription } from '../../schemas/prescription.schema';
import { handleServiceError } from '../../utils/error/error.util';


@Injectable()
export class PrescriptionService {
    private readonly logger = new Logger(PrescriptionService.name);

    constructor(
        @InjectRepository(Prescription)
        private readonly prescriptionRepo: Repository<Prescription>,
    ) { }

    async createPrescription(input: CreatePrescriptionInput): Promise<Prescription> {
        try {
            const prescription = this.prescriptionRepo.create(input);
            return await this.prescriptionRepo.save(prescription);
        } catch (error: unknown) {
            handleServiceError(error, this.logger, 'Failed to create prescription');
        }
    }

    async getPrescriptionById(id: string): Promise<Prescription> {
        try {
            const prescription = await this.prescriptionRepo.findOne({
                where: { id },
                relations: {
                    medications: true,
                    doctor: true,
                    patient: true,
                    consultation: true,
                },
            });

            if (!prescription) {
                throw new NotFoundException(`Prescription with ID "${id}" not found`);
            }

            return prescription;
        } catch (error: unknown) {
            handleServiceError(error, this.logger, 'Failed to fetch prescription by ID');
        }
    }

    async getPrescriptionByConsultationId(consultationId: string): Promise<Prescription> {
        try {
            const prescription = await this.prescriptionRepo.findOne({
                where: { consultation_id: consultationId },
                relations: {
                    medications: true,
                    doctor: true,
                    patient: true,
                },
            });

            if (!prescription) {
                throw new NotFoundException(
                    `Prescription for consultation "${consultationId}" not found`,
                );
            }

            return prescription;
        } catch (error: unknown) {
            handleServiceError(
                error,
                this.logger,
                'Failed to fetch prescription by consultation ID',
            );
        }
    }

    async getPrescriptionsByPatientId(patientId: string): Promise<Prescription[]> {
        try {
            return await this.prescriptionRepo.find({
                where: { patient_id: patientId },
                relations: {
                    medications: true,
                    doctor: true,
                },
                order: { created_at: 'DESC' },
            });
        } catch (error: unknown) {
            handleServiceError(
                error,
                this.logger,
                'Failed to fetch prescriptions for patient',
            );
        }
    }
}