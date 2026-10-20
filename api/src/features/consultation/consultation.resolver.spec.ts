import { Test, TestingModule } from '@nestjs/testing';
import { ConsultationResolver } from './consultation.resolver';
import { ConsultationService } from './consultation.service';
import { SlotInput } from './dto/slot.input';

describe('ConsultationResolver', () => {
  let resolver: ConsultationResolver;
  let mockService: { bookSlot: jest.Mock; getSlot: jest.Mock };

  beforeEach(async () => {
    mockService = {
      bookSlot: jest.fn(),
      getSlot: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [ConsultationResolver, { provide: ConsultationService, useValue: mockService }],
    }).compile();

    resolver = module.get<ConsultationResolver>(ConsultationResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  it('books a slot via mutation', async () => {
    const input: SlotInput = { slot_id: 'slot-1', patient_id: 'patient-1' } as any;
    const booked = { id: 'consult-1' } as any;
    mockService.bookSlot.mockResolvedValueOnce(booked);

    const result = await resolver.bookSlot(input);
    expect(result).toBe(booked);
    expect(mockService.bookSlot).toHaveBeenCalledWith('slot-1', 'patient-1');
  });

  it('gets slot detail via query', async () => {
    const input = { slot_id: 'slot-1' } as any;
    const detail = { slot: {}, consultation: {} } as any;
    mockService.getSlot.mockResolvedValueOnce(detail);

    const result = await resolver.getSlot(input);
    expect(result).toBe(detail);
    expect(mockService.getSlot).toHaveBeenCalledWith('slot-1');
  });
});
