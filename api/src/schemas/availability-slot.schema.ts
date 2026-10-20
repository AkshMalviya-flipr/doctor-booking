import { ObjectType, Field, ID, Int } from '@nestjs/graphql';
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    VersionColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';

import { Doctor } from './doctor.schema';
import { SlotStatus } from '../common/enum/availability-slot.enums';

@ObjectType()
@Entity('availability_slots')
@Index(['doctor_id', 'start_time', 'end_time'])
export class AvailabilitySlot {
    @Field(() => ID)
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Field(() => ID)
    @Column({ type: 'uuid' })
    doctor_id: string;

    @Field(() => Doctor, { nullable: true })
    @ManyToOne(() => Doctor, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'doctor_id' })
    doctor?: Doctor;

    @Field(() => Date)
    @Column({ type: 'timestamp with time zone' })
    start_time: Date;

    @Field(() => Date)
    @Column({ type: 'timestamp with time zone' })
    end_time: Date;

    @Field(() => SlotStatus)
    @Column({
        type: 'enum',
        enum: SlotStatus,
        default: SlotStatus.AVAILABLE,
    })
    status: SlotStatus;

    @Field(() => Date, { nullable: true })
    @Column({ type: 'timestamp with time zone', nullable: true })
    locked_until?: Date;

    @Field(() => Int)
    @VersionColumn({ default: 1 })
    version: number;
}