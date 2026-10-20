import { registerEnumType } from '@nestjs/graphql';

export enum SlotStatus {
    AVAILABLE = 'AVAILABLE',
    LOCKED = 'LOCKED',
    BOOKED = 'BOOKED',
    CANCELLED = 'CANCELLED',
}

registerEnumType(SlotStatus, { name: 'SlotStatus' });