import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentService } from './payment.service';
import { Payment } from '../../schemas/payment.schema';
import { CreatePaymentInput } from './dto/create-payment.input';
import { UpdatePaymentStatusInput } from './dto/update-payment-status.input';

describe('PaymentService', () => {
  let service: PaymentService;
  let repo: Repository<Payment>;

  const mockPayment: Payment = {
    id: 'pay-123',
    consultation_id: 'consult-1',
    amount: 100,
    status: 'PENDING' as any,
    method: undefined,
    transaction_id: undefined,
    created_at: new Date(),
  } as any;

  const repoMock = {
    create: jest.fn().mockImplementation((dto) => ({ ...dto })),
    save: jest.fn().mockResolvedValue(mockPayment),
    findOne: jest.fn().mockResolvedValue(mockPayment),
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        { provide: getRepositoryToken(Payment), useValue: repoMock },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
    repo = module.get<Repository<Payment>>(getRepositoryToken(Payment));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a payment', async () => {
    const input: CreatePaymentInput = {
      consultation_id: 'consult-1',
      amount: 100,
    } as any;
    const result = await service.createPayment(input);
    expect(repoMock.create).toHaveBeenCalledWith(input);
    expect(repoMock.save).toHaveBeenCalled();
    expect(result).toEqual(mockPayment);
  });

  it('should get payment by id', async () => {
    const id = 'pay-123';
    const result = await service.getPaymentById(id);
    expect(repoMock.findOne).toHaveBeenCalledWith({ where: { id } });
    expect(result).toEqual(mockPayment);
  });

  it('should get payment by consultation id', async () => {
    const consultationId = 'consult-1';
    const result = await service.getPaymentByConsultationId(consultationId);
    expect(repoMock.findOne).toHaveBeenCalledWith({ where: { consultation_id: consultationId } });
    expect(result).toEqual(mockPayment);
  });

  it('should update payment status', async () => {
    const input: UpdatePaymentStatusInput = {
      id: 'pay-123',
      status: 'COMPLETED' as any,
      method: 'CREDIT_CARD' as any,
      transaction_id: 'txn-456',
    } as any;
    // Mock findOne to return a payment object before update
    repoMock.findOne.mockResolvedValueOnce({ ...mockPayment });
    const result = await service.updatePaymentStatus(input);
    expect(repoMock.findOne).toHaveBeenCalledWith({ where: { id: input.id } });
    expect(repoMock.save).toHaveBeenCalled();
    expect(result).toEqual(mockPayment);
  });
});
