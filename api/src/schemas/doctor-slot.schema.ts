// src/schemas/doctor-slot.schema.ts

import { ObjectType, Field, ID } from '@nestjs/graphql';
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { DoctorSchedule } from './doctor-schedule.schema';

@ObjectType('DoctorSlot')
@Entity({ name: 'doctor_slots' })
@Index(['schedule_id', 'start_time', 'end_time'], { unique: true })
export class DoctorSlot {
    @Field(() => ID)
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Field(() => ID)
    @Column({ type: 'uuid' })
    schedule_id: string;

    @Field(() => String)
    @Column({ type: 'time' })
    start_time: string;

    @Field(() => String)
    @Column({ type: 'time' })
    end_time: string;

    @Field(() => Boolean, { defaultValue: true })
    @Column({ type: 'boolean', default: true })
    is_available: boolean;

    @Field(() => Boolean, { defaultValue: false })
    @Column({ type: 'boolean', default: false })
    is_booked: boolean;

    @ManyToOne(() => DoctorSchedule, (schedule) => schedule.slots, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'schedule_id' })
    schedule: DoctorSchedule;

    @Field(() => Date)
    @CreateDateColumn({ type: 'timestamptz' })
    created_at: Date;

    @Field(() => Date)
    @UpdateDateColumn({ type: 'timestamptz' })
    updated_at: Date;
}