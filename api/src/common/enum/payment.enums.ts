import { registerEnumType } from '@nestjs/graphql';

export enum PaymentStatus {
    PENDING = 'PENDING',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
    REFUNDED = 'REFUNDED',
}

export enum PaymentMethod {
    CARD = 'CARD',
    UPI = 'UPI',
    NET_BANKING = 'NET_BANKING',
    WALLET = 'WALLET',
}

registerEnumType(PaymentStatus, { name: 'PaymentStatus' });
registerEnumType(PaymentMethod, { name: 'PaymentMethod' });