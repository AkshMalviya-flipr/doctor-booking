import { ObjectType, Field, ID } from '@nestjs/graphql';
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
    Index,
} from 'typeorm';
import { DoctorSlot } from './doctor-slot.schema';

@ObjectType('DoctorSchedule')
@Entity({ name: 'doctor_schedules' })
@Index(['doctor_id', 'date'], { unique: true })
export class DoctorSchedule {
    @Field(() => ID)
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Field(() => ID)
    @Column({ type: 'uuid' })
    doctor_id: string;

    @Field(() => String)
    @Column({ type: 'date' })
    date: string;

    @Field(() => Boolean, { defaultValue: true })
    @Column({ type: 'boolean', default: true })
    is_available: boolean;

    @Field(() => [DoctorSlot], { nullable: 'itemsAndList' })
    @OneToMany(() => DoctorSlot, (slot) => slot.schedule, {
        cascade: true,
        onDelete: 'CASCADE',
    })
    slots?: DoctorSlot[];

    @Field(() => Date)
    @CreateDateColumn({ type: 'timestamptz' })
    created_at: Date;

    @Field(() => Date)
    @UpdateDateColumn({ type: 'timestamptz' })
    updated_at: Date;
}