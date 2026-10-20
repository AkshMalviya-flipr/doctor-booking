import { InputType, OmitType } from '@nestjs/graphql';
import { Payment } from '../../../schemas/payment.schema';

@InputType()
export class CreatePaymentInput extends OmitType(
    Payment,
    ['id', 'created_at', 'status'] as const,
    InputType,
) { }