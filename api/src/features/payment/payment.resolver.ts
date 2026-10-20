// payment.resolver.ts
import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { ParseUUIDPipe } from '@nestjs/common';

import { PaymentService } from './payment.service';
import { CreatePaymentInput } from './dto/create-payment.input';
import { UpdatePaymentStatusInput } from './dto/update-payment-status.input';
import { Payment } from '../../schemas/payment.schema';

@Resolver(() => Payment)
export class PaymentResolver {
  constructor(private readonly paymentService: PaymentService) { }

  @Mutation(() => Payment)
  async createPayment(
    @Args('createPaymentInput') input: CreatePaymentInput,
  ): Promise<Payment> {
    return await this.paymentService.createPayment(input);
  }

  @Mutation(() => Payment)
  async updatePaymentStatus(
    @Args('updatePaymentStatusInput') input: UpdatePaymentStatusInput,
  ): Promise<Payment> {
    return await this.paymentService.updatePaymentStatus(input);
  }

  @Query(() => Payment)
  async getPaymentById(
    @Args('id', { type: () => ID }, ParseUUIDPipe) id: string,
  ): Promise<Payment> {
    return await this.paymentService.getPaymentById(id);
  }

  @Query(() => Payment)
  async getPaymentByConsultation(
    @Args('consultationId', { type: () => ID }, ParseUUIDPipe)
    consultationId: string,
  ): Promise<Payment> {
    return await this.paymentService.getPaymentByConsultationId(consultationId);
  }
}