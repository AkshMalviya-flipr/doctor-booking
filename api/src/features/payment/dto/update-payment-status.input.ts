import { InputType, Field, ID } from '@nestjs/graphql';
import { PaymentMethod, PaymentStatus } from '../../../common/enum/payment.enums';


@InputType()
export class UpdatePaymentStatusInput {
    @Field(() => ID)
    id: string;

    @Field(() => PaymentStatus)
    status: PaymentStatus;

    @Field(() => PaymentMethod, { nullable: true })
    method?: PaymentMethod;

    @Field({ nullable: true })
    transaction_id?: string;
}