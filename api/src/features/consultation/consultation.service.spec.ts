import { Test, TestingModule } from '@nestjs/testing';
import { ConsultationService } from './consultation.service';
import { Repository, DataSource, QueryRunner, EntityManager } from 'typeorm';
import { DoctorSlot } from '../../schemas/doctor-slot.schema';
import { Consultation } from '../../schemas/consultation.schema';
import { SlotDetail } from './enitiy/slot-detail.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConsultationStatus } from '../../common/enum/consultation.enums';

type MockType<T> = {
  [P in keyof T]?: jest.Mock;
};

type MockQueryRunner = Omit<MockType<QueryRunner>, 'manager'> & {
  manager: MockType<EntityManager>;
};

describe('ConsultationService', () => {
  let service: ConsultationService;
  let mockSlotRepo: MockType<Repository<DoctorSlot>>;
  let mockConsultRepo: MockType<Repository<Consultation>>;
  let mockManager: MockType<EntityManager>;
  let mockQueryRunner: MockQueryRunner;
  let mockDataSource: MockType<DataSource>;

  beforeEach(async () => {
    mockSlotRepo = {
      findOne: jest.fn(),
    };

    mockConsultRepo = {
      findOne: jest.fn(),
    };

    mockManager = {
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
    };

    mockQueryRunner = {
      manager: mockManager,
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
    };

    mockDataSource = {
      createQueryRunner: jest
        .fn()
        .mockReturnValue(mockQueryRunner as unknown as QueryRunner),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConsultationService,
        {
          provide: getRepositoryToken(DoctorSlot),
          useValue: mockSlotRepo,
        },
        {
          provide: getRepositoryToken(Consultation),
          useValue: mockConsultRepo,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<ConsultationService>(ConsultationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('bookSlot', () => {
    const slotId = 'slot-123';
    const patientId = 'patient-456';
    const doctorSlot: DoctorSlot = {
      id: slotId,
      schedule_id: 'doc-1',
      is_booked: false,
    } as DoctorSlot;

    const savedConsultation: Consultation = {
      id: 'consult-1',
      patient_id: patientId,
      doctor_id: doctorSlot.schedule_id,
      slot_id: slotId,
      status: ConsultationStatus.CONFIRMED,
      scheduled_at: new Date(),
    } as Consultation;

    it('books a slot successfully', async () => {
      (mockManager.findOne as jest.Mock).mockResolvedValueOnce(doctorSlot);
      (mockManager.save as jest.Mock).mockResolvedValueOnce(doctorSlot);
      (mockManager.create as jest.Mock).mockReturnValueOnce({
        patient_id: patientId,
        doctor_id: doctorSlot.schedule_id,
        slot_id: slotId,
        status: ConsultationStatus.CONFIRMED,
        scheduled_at: expect.any(Date),
      });
      (mockManager.save as jest.Mock).mockResolvedValueOnce(savedConsultation);

      const result = await service.bookSlot(slotId, patientId);

      expect(result).toBe(savedConsultation);
      expect(mockManager.findOne).toHaveBeenCalledWith(DoctorSlot, { where: { id: slotId } });
      expect(mockManager.save).toHaveBeenCalledTimes(2);
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
    });

    it('throws NotFoundException when slot does not exist', async () => {
      (mockManager.findOne as jest.Mock).mockResolvedValueOnce(null);

      await expect(service.bookSlot(slotId, patientId)).rejects.toBeInstanceOf(NotFoundException);
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('throws BadRequestException when slot already booked', async () => {
      const bookedSlot: DoctorSlot = { ...doctorSlot, is_booked: true };
      (mockManager.findOne as jest.Mock).mockResolvedValueOnce(bookedSlot);

      await expect(service.bookSlot(slotId, patientId)).rejects.toBeInstanceOf(BadRequestException);
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });
  });

  describe('getSlot', () => {
    const slotId = 'slot-123';
    const doctorSlot: DoctorSlot = {
      id: slotId,
      schedule_id: 'doc-1',
      is_booked: false,
    } as DoctorSlot;

    const consultation: Consultation = {
      id: 'consult-1',
      slot_id: slotId,
    } as Consultation;

    it('returns slot detail with consultation', async () => {
      (mockSlotRepo.findOne as jest.Mock).mockResolvedValueOnce(doctorSlot);
      (mockConsultRepo.findOne as jest.Mock).mockResolvedValueOnce(consultation);

      const result = await service.getSlot(slotId);
      const expected: SlotDetail = { slot: doctorSlot, consultation };
      expect(result).toEqual(expected);
    });

    it('returns slot detail without consultation when none exists', async () => {
      (mockSlotRepo.findOne as jest.Mock).mockResolvedValueOnce(doctorSlot);
      (mockConsultRepo.findOne as jest.Mock).mockResolvedValueOnce(undefined);

      const result = await service.getSlot(slotId);
      const expected: SlotDetail = { slot: doctorSlot, consultation: undefined };
      expect(result).toEqual(expected);
    });

    it('returns null when slot not found', async () => {
      (mockSlotRepo.findOne as jest.Mock).mockResolvedValueOnce(null);

      const result = await service.getSlot(slotId);
      expect(result).toBeNull();
    });
  });
});