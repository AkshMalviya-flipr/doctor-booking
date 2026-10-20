import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { UserRole } from '../common/enum/role.enum';


@ObjectType('User')
@Entity({ name: 'users' })
export class User {
    @Field(() => ID)
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Field()
    @Column({ type: 'varchar', length: 100, nullable: true })
    first_name?: string;

    @Field({ nullable: true })
    @Column({ type: 'varchar', length: 100, nullable: true })
    middle_name?: string;

    @Field()
    @Column({ type: 'varchar', length: 100, nullable: true })
    last_name?: string;

    @Field()
    @Column({ type: 'varchar', length: 255, unique: true, nullable: false })
    email: string;

    @Field()
    @Column({ type: 'varchar', length: 20, unique: true, nullable: false })
    phone: string;

    @Field()
    @Column({ name: 'password', type: 'varchar', length: 255, nullable: false })
    password: string;

    @Field(() => UserRole)
    @Column({
        type: 'enum',
        enum: UserRole,
        default: UserRole.PATIENT,
    })
    role: UserRole;

    @Field()
    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;

    @Field()
    @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
    updatedAt: Date;
}