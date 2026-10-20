import { Test, TestingModule } from '@nestjs/testing';
import { PaymentResolver } from './payment.resolver';
import { PaymentService } from './payment.service';
import { CreatePaymentInput } from './dto/create-payment.input';
import { UpdatePaymentStatusInput } from './dto/update-payment-status.input';
import { Payment } from '../../schemas/payment.schema';

describe('PaymentResolver', () => {
  let resolver: PaymentResolver;
  let service: PaymentService;

  const mockPayment: Payment = {
    id: 'pay-123',
    consultation_id: 'consult-1',
    amount: 100,
    status: 'PENDING' as any,
    method: undefined,
    transaction_id: undefined,
    created_at: new Date(),
  } as any;

  const serviceMock = {
    createPayment: jest.fn().mockResolvedValue(mockPayment),
    updatePaymentStatus: jest.fn().mockResolvedValue(mockPayment),
    getPaymentById: jest.fn().mockResolvedValue(mockPayment),
    getPaymentByConsultationId: jest.fn().mockResolvedValue(mockPayment),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentResolver,
        { provide: PaymentService, useValue: serviceMock },
      ],
    }).compile();

    resolver = module.get<PaymentResolver>(PaymentResolver);
    service = module.get<PaymentService>(PaymentService);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  it('should create payment', async () => {
    const input: CreatePaymentInput = {
      consultation_id: 'consult-1',
      amount: 100,
    } as any;
    const result = await resolver.createPayment(input);
    expect(serviceMock.createPayment).toHaveBeenCalledWith(input);
    expect(result).toEqual(mockPayment);
  });

  it('should update payment status', async () => {
    const input: UpdatePaymentStatusInput = {
      id: 'pay-123',
      status: 'COMPLETED' as any,
      method: 'CREDIT_CARD' as any,
      transaction_id: 'txn-456',
    } as any;
    const result = await resolver.updatePaymentStatus(input);
    expect(serviceMock.updatePaymentStatus).toHaveBeenCalledWith(input);
    expect(result).toEqual(mockPayment);
  });

  it('should get payment by id', async () => {
    const id = 'pay-123';
    const result = await resolver.getPaymentById(id);
    expect(serviceMock.getPaymentById).toHaveBeenCalledWith(id);
    expect(result).toEqual(mockPayment);
  });

  it('should get payment by consultation id', async () => {
    const consultationId = 'consult-1';
    const result = await resolver.getPaymentByConsultation(consultationId);
    expect(serviceMock.getPaymentByConsultationId).toHaveBeenCalledWith(consultationId);
    expect(result).toEqual(mockPayment);
  });
});
