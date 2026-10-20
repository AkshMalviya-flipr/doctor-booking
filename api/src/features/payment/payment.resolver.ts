import { Resolver, Mutation, Query, Args, ID } from '@nestjs/graphql';
import { UnauthorizedException } from '@nestjs/common';

import { PaymentService } from './payment.service';
import {
  CurrentUser,
  JwtPayload,
} from '../../common/decorator/current-user.decorator';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { ProcessPaymentDto } from './dto/process-payment.dto';
import { PaymentEntity } from './entities/payment.entity';

@Resolver(() => PaymentEntity)
export class PaymentResolver {
  constructor(private readonly paymentService: PaymentService) {}

  @Mutation(() => PaymentEntity)
  async createPayment(
    @Args('input') createDto: CreatePaymentDto,
    @CurrentUser() user: JwtPayload | undefined,
  ): Promise<PaymentEntity> {
    if (!user?.sub) {
      throw new UnauthorizedException('Authentication credentials were not provided');
    }
    return this.paymentService.createPayment(user.sub, createDto);
  }

  @Mutation(() => PaymentEntity)
  async processPayment(
    @Args('input') processDto: ProcessPaymentDto,
    @CurrentUser() user: JwtPayload | undefined,
  ): Promise<PaymentEntity> {
    if (!user?.sub) {
      throw new UnauthorizedException('Authentication credentials were not provided');
    }
    return this.paymentService.processPayment(user.sub, processDto);
  }

  @Mutation(() => PaymentEntity)
  async refundPayment(
    @Args('paymentId', { type: () => ID }) paymentId: string,
    @CurrentUser() user: JwtPayload | undefined,
  ): Promise<PaymentEntity> {
    if (!user?.sub) {
      throw new UnauthorizedException('Authentication credentials were not provided');
    }
    return this.paymentService.refundPayment(user.sub, paymentId);
  }

  @Query(() => PaymentEntity)
  async getPaymentById(
    @Args('paymentId', { type: () => ID }) paymentId: string,
    @CurrentUser() user: JwtPayload | undefined,
  ): Promise<PaymentEntity> {
    if (!user?.sub) {
      throw new UnauthorizedException('Authentication credentials were not provided');
    }
    return this.paymentService.getPaymentById(user.sub, paymentId);
  }

  @Query(() => [PaymentEntity])
  async getPaymentsByConsultation(
    @Args('consultationId', { type: () => ID }) consultationId: string,
    @CurrentUser() user: JwtPayload | undefined,
  ): Promise<PaymentEntity[]> {
    if (!user?.sub) {
      throw new UnauthorizedException('Authentication credentials were not provided');
    }
    return this.paymentService.getPaymentsByConsultation(
      user.sub,
      consultationId,
    );
  }

  @Query(() => [PaymentEntity])
  async myPayments(
    @CurrentUser() user: JwtPayload | undefined,
  ): Promise<PaymentEntity[]> {
    if (!user?.sub) {
      throw new UnauthorizedException('Authentication credentials were not provided');
    }
    return this.paymentService.myPayments(user.sub);
  }
}
