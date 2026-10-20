import { ObjectType, Field, ID } from '@nestjs/graphql';
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    OneToOne,
    JoinColumn,
    Index,
} from 'typeorm';

import { Patient } from './patient.schema';
import { Doctor } from './doctor.schema';
import { AvailabilitySlot } from './availability-slot.schema';
import { ConsultationStatus } from '../common/enum/consultation.enums';

@ObjectType()
@Entity('consultations')
export class Consultation {
    @Field(() => ID)
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Field(() => ID)
    @Index()
    @Column({ type: 'uuid' })
    patient_id: string;

    @Field(() => Patient, { nullable: true })
    @ManyToOne(() => Patient, { onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'patient_id' })
    patient?: Patient;

    @Field(() => ID)
    @Index()
    @Column({ type: 'uuid' })
    doctor_id: string;


    @Field(() => ID)
    @Column({ type: 'uuid', unique: true })
    slot_id: string;

    @Field(() => AvailabilitySlot, { nullable: true })
    @OneToOne(() => AvailabilitySlot, { onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'slot_id' })
    slot?: AvailabilitySlot; @Field(() => ConsultationStatus)
    @Column({
        type: 'enum',
        enum: ConsultationStatus,
        default: ConsultationStatus.REQUESTED,
    })
    status: ConsultationStatus;

    @Field(() => Date)
    @Column({ type: 'timestamp with time zone' })
    scheduled_at: Date;

    @Field({ nullable: true })
    @Column({ type: 'varchar', length: 255, nullable: true })
    meeting_link?: string;

    @Field(() => Date, { nullable: true })
    @Column({ type: 'timestamp with time zone', nullable: true })
    started_at?: Date;

    @Field(() => Date, { nullable: true })
    @Column({ type: 'timestamp with time zone', nullable: true })
    ended_at?: Date;

    @Field(() => Date)
    @CreateDateColumn({ type: 'timestamp with time zone' })
    created_at: Date;
}