import { registerEnumType } from '@nestjs/graphql';

export enum DoctorSpecialization {
    GENERAL_PHYSICIAN = 'GENERAL_PHYSICIAN',
    AYURVEDA = 'AYURVEDA',
    HOMEOPATHY = 'HOMEOPATHY',
    DERMATOLOGIST = 'DERMATOLOGIST',
    CARDIOLOGIST = 'CARDIOLOGIST',
    PEDIATRICIAN = 'PEDIATRICIAN',
    GYNECOLOGIST = 'GYNECOLOGIST',
    ORTHOPEDIC = 'ORTHOPEDIC',
    NEUROLOGIST = 'NEUROLOGIST',
    PSYCHIATRIST = 'PSYCHIATRIST',
    OTHER = 'OTHER',
}

registerEnumType(DoctorSpecialization, { name: 'DoctorSpecialization' });