// payment.service.ts
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreatePaymentInput } from './dto/create-payment.input';
import { UpdatePaymentStatusInput } from './dto/update-payment-status.input';
import { handleServiceError } from '../../utils/error/error.util';
import { Payment } from '../../schemas/payment.schema';


@Injectable()
export class PaymentService {
    private readonly logger = new Logger(PaymentService.name);

    constructor(
        @InjectRepository(Payment)
        private readonly paymentRepo: Repository<Payment>,
    ) { }

    async createPayment(input: CreatePaymentInput): Promise<Payment> {
        try {
            const payment = this.paymentRepo.create(input);
            return await this.paymentRepo.save(payment);
        } catch (error: unknown) {
            handleServiceError(error, this.logger, 'Failed to create payment');
        }
    }

    async getPaymentById(id: string): Promise<Payment> {
        try {
            const payment = await this.paymentRepo.findOne({
                where: { id },
            });

            if (!payment) {
                throw new NotFoundException(`Payment with ID "${id}" not found`);
            }

            return payment;
        } catch (error: unknown) {
            handleServiceError(error, this.logger, 'Failed to fetch payment by ID');
        }
    }

    async getPaymentByConsultationId(consultationId: string): Promise<Payment> {
        try {
            const payment = await this.paymentRepo.findOne({
                where: { consultation_id: consultationId },
            });

            if (!payment) {
                throw new NotFoundException(
                    `Payment for consultation "${consultationId}" not found`,
                );
            }

            return payment;
        } catch (error: unknown) {
            handleServiceError(
                error,
                this.logger,
                'Failed to fetch payment by consultation ID',
            );
        }
    }

    async updatePaymentStatus(input: UpdatePaymentStatusInput): Promise<Payment> {
        try {
            const payment = await this.paymentRepo.findOne({
                where: { id: input.id },
            });

            if (!payment) {
                throw new NotFoundException(`Payment with ID "${input.id}" not found`);
            }

            payment.status = input.status;
            if (input.method) payment.method = input.method;
            if (input.transaction_id) payment.transaction_id = input.transaction_id;

            return await this.paymentRepo.save(payment);
        } catch (error: unknown) {
            handleServiceError(error, this.logger, 'Failed to update payment status');
        }
    }
}