import { ObjectType, Field, ID, Float, Int } from '@nestjs/graphql';
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { DoctorSpecialization } from '../common/enum/doctor.enums';


@ObjectType()
@Entity('doctors')
export class Doctor {
    @Field(() => ID)
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Field(() => ID)
    @Column({ type: 'uuid' })
    user_id: string;

    @Field()
    @Column({ type: 'varchar', length: 100, unique: true })
    license_number: string;

    @Field(() => DoctorSpecialization)
    @Column({
        type: 'enum',
        enum: DoctorSpecialization,
        default: DoctorSpecialization.GENERAL_PHYSICIAN,
    })
    specialization: DoctorSpecialization;

    @Field()
    @Column({ type: 'varchar', length: 255 })
    qualification: string;

    @Field(() => Int, { nullable: true })
    @Column({ type: 'int', default: 0 })
    experience_years: number;

    @Field(() => Float)
    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0.0 })
    consultation_fee: number;

    @Field(() => Boolean)
    @Column({ type: 'boolean', default: false })
    is_verified: boolean;

    @Field({ nullable: true })
    @Column({ type: 'varchar', length: 20, nullable: true })
    phone_number?: string;

    @Field({ nullable: true })
    @Column({ type: 'text', nullable: true })
    bio?: string;

    @Field({ nullable: true })
    @Column({ type: 'text', nullable: true })
    profile_photo_url?: string;

    @Field(() => Date)
    @CreateDateColumn({ type: 'timestamp with time zone' })
    created_at: Date;

    @Field(() => Date)
    @UpdateDateColumn({ type: 'timestamp with time zone' })
    updated_at: Date;
}