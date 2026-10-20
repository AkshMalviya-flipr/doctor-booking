import {
    Injectable,
    NotFoundException,
    Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Patient } from '../../schemas/patient.schema';
import { UpsertPatientInput } from './dto/upsert-patient.input';
import { UserService } from '../user/user.service';

import { handleServiceError } from '../../utils/error/error.util';
import { PatientDetailResponse } from './entity/patient-detail.entity';

@Injectable()
export class PatientService {
    private readonly logger = new Logger(PatientService.name);

    constructor(
        @InjectRepository(Patient)
        private readonly patientRepository: Repository<Patient>,
        private readonly userService: UserService,
    ) { }

    async upsertPatientDetail(input: UpsertPatientInput): Promise<Patient> {
        try {
            let patient = await this.patientRepository.findOne({
                where: { user_id: input.user_id },
            });

            if (patient) {
                Object.assign(patient, input);
            } else {
                patient = this.patientRepository.create(input);
            }

            return await this.patientRepository.save(patient);
        } catch (error: unknown) {
            handleServiceError(
                error,
                this.logger,
                'Failed to upsert patient profile',
            );
            throw error;
        }
    }

    async getPatientDetailByUserId(userId: string): Promise<PatientDetailResponse> {
        try {
            // 1. Fetch patient first sequentially to avoid concurrent queries on a shared client
            const patient = await this.patientRepository.findOne({
                where: { user_id: userId },
            });

            if (!patient) {
                throw new NotFoundException(
                    `Patient profile for user ID "${userId}" not found`,
                );
            }

            const user = await this.userService.getUserById(userId);

            return {
                patient,
                user,
            };
        } catch (error: unknown) {
            handleServiceError(
                error,
                this.logger,
                'Failed to retrieve patient details',
            );
            throw error;
        }
    }
}