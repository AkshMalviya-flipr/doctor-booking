import { ObjectType, Field, ID, Float } from '@nestjs/graphql';
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    Index,
} from 'typeorm';
import { PaymentMethod, PaymentStatus } from '../common/enum/payment.enums';


@ObjectType()
@Entity('payments')
export class Payment {
    @Field(() => ID)
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Field(() => ID)
    @Index()
    @Column({ type: 'uuid' })
    consultation_id: string;

    @Field(() => Float)
    @Column({ type: 'decimal', precision: 10, scale: 2 })
    amount: number;

    @Field(() => PaymentStatus)
    @Column({
        type: 'enum',
        enum: PaymentStatus,
        default: PaymentStatus.PENDING,
    })
    status: PaymentStatus;

    @Field(() => PaymentMethod, { nullable: true })
    @Column({
        type: 'enum',
        enum: PaymentMethod,
        nullable: true,
    })
    method?: PaymentMethod;

    @Field({ nullable: true })
    @Column({ type: 'varchar', length: 100, nullable: true })
    transaction_id?: string;

    @Field(() => Date)
    @CreateDateColumn({ type: 'timestamp with time zone' })
    created_at: Date;
}