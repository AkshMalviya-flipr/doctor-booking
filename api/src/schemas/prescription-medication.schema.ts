import { ObjectType, Field, ID } from '@nestjs/graphql';
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { Prescription } from './prescription.schema';

@ObjectType()
@Entity('prescription_medications')
export class PrescriptionMedication {
    @Field(() => ID)
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Field(() => ID)
    @Index()
    @Column({ type: 'uuid' })
    prescription_id: string;

    @Field(() => Prescription, { nullable: true })
    @ManyToOne(() => Prescription, (prescription) => prescription.medications, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'prescription_id' })
    prescription?: Prescription;

    @Field()
    @Column({ type: 'varchar', length: 150 })
    name: string;

    @Field()
    @Column({ type: 'varchar', length: 50 })
    dosage: string;

    @Field()
    @Column({ type: 'varchar', length: 100 })
    frequency: string;

    @Field()
    @Column({ type: 'varchar', length: 50 })
    duration: string;

    @Field({ nullable: true })
    @Column({ type: 'text', nullable: true })
    instructions?: string;
}