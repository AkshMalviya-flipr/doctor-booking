import { registerEnumType } from '@nestjs/graphql';

export enum ConsultationStatus {
    REQUESTED = 'REQUESTED',
    CONFIRMED = 'CONFIRMED',
    IN_PROGRESS = 'IN_PROGRESS',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED',
    NO_SHOW = 'NO_SHOW',
}

registerEnumType(ConsultationStatus, { name: 'ConsultationStatus' });