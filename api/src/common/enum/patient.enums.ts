import { registerEnumType } from '@nestjs/graphql';

export enum Gender {
    MALE = 'MALE',
    FEMALE = 'FEMALE',
    OTHER = 'OTHER',
}

export enum BloodGroup {
    A_POSITIVE = 'A+',
    A_NEGATIVE = 'A-',
    B_POSITIVE = 'B+',
    B_NEGATIVE = 'B-',
    AB_POSITIVE = 'AB+',
    AB_NEGATIVE = 'AB-',
    O_POSITIVE = 'O+',
    O_NEGATIVE = 'O-',
}

export enum MaritalStatus {
    SINGLE = 'SINGLE',
    MARRIED = 'MARRIED',
    DIVORCED = 'DIVORCED',
    WIDOWED = 'WIDOWED',
}

export enum PatientStatus {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
    ARCHIVED = 'ARCHIVED',
}

// Register GraphQL Enums
registerEnumType(Gender, { name: 'Gender' });
registerEnumType(BloodGroup, { name: 'BloodGroup' });
registerEnumType(MaritalStatus, { name: 'MaritalStatus' });
registerEnumType(PatientStatus, { name: 'PatientStatus' });