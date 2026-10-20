import { ObjectType, Field, ID } from '@nestjs/graphql';
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    OneToOne,
    ManyToOne,
    OneToMany,
    JoinColumn,
    Index,
} from 'typeorm';
import { Consultation } from './consultation.schema';
import { Doctor } from './doctor.schema';
import { Patient } from './patient.schema';
import { PrescriptionMedication } from './prescription-medication.schema';

@ObjectType()
@Entity('prescriptions')
export class Prescription {
    @Field(() => ID)
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Field(() => ID)
    @Column({ type: 'uuid', unique: true })
    consultation_id: string;

    @Field(() => Consultation, { nullable: true })
    @OneToOne(() => Consultation, { onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'consultation_id' })
    consultation?: Consultation;

    @Field(() => ID)
    @Index()
    @Column({ type: 'uuid' })
    doctor_id: string;

    @Field(() => Doctor, { nullable: true })
    @ManyToOne(() => Doctor, { onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'doctor_id' })
    doctor?: Doctor;

    @Field(() => ID)
    @Index()
    @Column({ type: 'uuid' })
    patient_id: string;

    @Field(() => Patient, { nullable: true })
    @ManyToOne(() => Patient, { onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'patient_id' })
    patient?: Patient;

    @Field()
    @Column({ type: 'text' })
    diagnosis: string;

    @Field(() => [PrescriptionMedication], { nullable: 'itemsAndList' })
    @OneToMany(() => PrescriptionMedication, (med) => med.prescription, {
        cascade: true,
    })
    medications: PrescriptionMedication[];

    @Field({ nullable: true })
    @Column({ type: 'text', nullable: true })
    digital_sig?: string;

    @Field(() => Date)
    @CreateDateColumn({ type: 'timestamp with time zone' })
    created_at: Date;
}