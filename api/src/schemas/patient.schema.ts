import { ObjectType, Field, ID } from '@nestjs/graphql';
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { BloodGroup, Gender, MaritalStatus, PatientStatus } from '../common/enum/patient.enums';


@ObjectType()
@Entity('patients')
export class Patient {
    @Field(() => ID)
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Field(() => ID)
    @Column({ type: 'uuid' })
    user_id: string;

    @Field(() => Date, { nullable: true })
    @Column({ type: 'date', nullable: true })
    dob?: Date;

    @Field(() => Gender, { nullable: true })
    @Column({
        type: 'enum',
        enum: Gender,
        nullable: true,
    })
    gender?: Gender;

    @Field(() => BloodGroup, { nullable: true })
    @Column({
        type: 'enum',
        enum: BloodGroup,
        nullable: true,
    })
    blood_group?: BloodGroup;

    @Field({ nullable: true })
    @Column({ type: 'text', nullable: true })
    address_line1?: string;

    @Field({ nullable: true })
    @Column({ type: 'varchar', length: 100, nullable: true })
    city?: string;

    @Field({ nullable: true })
    @Column({ type: 'varchar', length: 100, nullable: true })
    state?: string;

    @Field({ nullable: true })
    @Column({ type: 'varchar', length: 20, nullable: true })
    postal_code?: string;

    @Field({ nullable: true })
    @Column({ type: 'varchar', length: 100, nullable: true, default: 'India' })
    country?: string;

    @Field({ nullable: true })
    @Column({ type: 'varchar', length: 150, nullable: true })
    emergency_contact_name?: string;

    @Field({ nullable: true })
    @Column({ type: 'varchar', length: 20, nullable: true })
    emergency_contact_phone?: string;

    @Field({ nullable: true })
    @Column({ type: 'varchar', length: 50, nullable: true })
    emergency_contact_relationship?: string;

    @Field({ nullable: true })
    @Column({ type: 'text', nullable: true })
    profile_photo_url?: string;

    @Field(() => MaritalStatus, { nullable: true })
    @Column({
        type: 'enum',
        enum: MaritalStatus,
        nullable: true,
    })
    marital_status?: MaritalStatus;

    @Field({ nullable: true })
    @Column({ type: 'varchar', length: 100, nullable: true })
    occupation?: string;

    @Field({ nullable: true })
    @Column({ type: 'varchar', length: 50, nullable: true, default: 'en' })
    preferred_language?: string;

    @Field(() => PatientStatus)
    @Column({
        type: 'enum',
        enum: PatientStatus,
        default: PatientStatus.ACTIVE,
    })
    status: PatientStatus;

    @Field(() => Date)
    @CreateDateColumn({ type: 'timestamp with time zone' })
    created_at: Date;

    @Field(() => Date)
    @UpdateDateColumn({ type: 'timestamp with time zone' })
    updated_at: Date;
}