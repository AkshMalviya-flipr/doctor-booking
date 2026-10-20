import { ObjectType, Field, ID, Int } from '@nestjs/graphql';
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    Check,
} from 'typeorm';

@ObjectType()
@Entity('doctor_feedbacks')
@Check(`"rating" >= 1 AND "rating" <= 5`)
export class DoctorFeedback {
    @Field(() => ID)
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Field(() => ID)
    @Column({ type: 'uuid' })
    doctor_id: string;

    @Field(() => ID)
    @Column({ type: 'uuid' })
    patient_id: string;

    @Field(() => ID)
    @Column({ type: 'uuid' })
    consultancy_id: string;

    @Field(() => ID, { nullable: true })
    @Column({ type: 'uuid', nullable: true })
    prescription_id?: string;

    @Field({ nullable: true })
    @Column({ type: 'text', nullable: true })
    feedback?: string;

    @Field(() => Int)
    @Column({ type: 'smallint' })
    rating: number;

    @Field(() => Date)
    @CreateDateColumn({ type: 'timestamp with time zone' })
    created_at: Date;
}