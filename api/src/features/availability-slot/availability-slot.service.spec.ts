import { Test, TestingModule } from '@nestjs/testing';
import { AvailabilitySlotService } from './availability-slot.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource, QueryRunner, ObjectLiteral } from 'typeorm';
import { DoctorSchedule } from '../../schemas/doctor-schedule.schema';
import { DoctorSlot } from '../../schemas/doctor-slot.schema';
import { UpsertScheduleInput } from './dto/upsert-schedule.input';
import { DeleteScheduleInput } from './dto/delete-schedule.input';

import { BadRequestException } from '@nestjs/common';
import { GetScheduleFilterInput } from './entity/get-schedule.input';

// Helper to create a mock repository with typed methods
function createMockRepository<T extends ObjectLiteral>() {
  return {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue({
      delete: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
      execute: jest.fn(),
    }),
  } as unknown as Repository<T>;
}

// Mock DataSource and QueryRunner used by the service
function createMockDataSource() {
  // Create a mock DataSource first so we can reference it in the QueryRunner
  const dataSource = {
    // Only createQueryRunner is needed for our tests
    createQueryRunner: jest.fn(),
  } as unknown as DataSource;

  // Build a full QueryRunner mock. Provide required members and set dataSource immediately.
  const queryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue({
        delete: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        execute: jest.fn(),
      }),
    },
    dataSource,
    connection: {},
    broadcaster: {},
    data: {},
    beforeMigration: [],
    afterMigration: [],
    isReleased: false,
    isTransactionActive: false,
    query: undefined,
    parameters: undefined,
  } as unknown as QueryRunner;

  // Wire DataSource to return this QueryRunner
  (dataSource as any).createQueryRunner.mockReturnValue(queryRunner);

  return { dataSource, queryRunner };
}


describe('AvailabilitySlotService', () => {
  let service: AvailabilitySlotService;
  let scheduleRepo: Repository<DoctorSchedule>;
  let slotRepo: Repository<DoctorSlot>;
  let dataSource: DataSource;
  let queryRunner: QueryRunner;

  beforeEach(async () => {
    scheduleRepo = createMockRepository<DoctorSchedule>();
    slotRepo = createMockRepository<DoctorSlot>();
    const mocks = createMockDataSource();
    dataSource = mocks.dataSource;
    queryRunner = mocks.queryRunner;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AvailabilitySlotService,
        { provide: getRepositoryToken(DoctorSchedule), useValue: scheduleRepo },
        { provide: getRepositoryToken(DoctorSlot), useValue: slotRepo },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = module.get<AvailabilitySlotService>(AvailabilitySlotService);
  });

  // ----- generateTimeSlots -----
  it('generates correct time slots for a valid range', () => {
    const result = (service as any).generateTimeSlots('09:00', '10:30', 30);
    expect(result).toEqual([
      { start_time: '09:00', end_time: '09:30' },
      { start_time: '09:30', end_time: '10:00' },
      { start_time: '10:00', end_time: '10:30' },
    ]);
  });

  it('throws BadRequestException when start_time is not earlier than end_time', () => {
    expect(() => (service as any).generateTimeSlots('11:00', '10:00', 15)).toThrow(
      BadRequestException,
    );
  });

  // ----- upsertScheduleAndSlots -----
  it('creates a new schedule with slots when none exists', async () => {
    const input: UpsertScheduleInput = {
      doctor_id: 'doc-1',
      dates: ['2026-10-21'],
      start_time: '09:00',
      end_time: '10:00',
      duration_minutes: 30,
      is_available: true,
    } as UpsertScheduleInput;

    // schedule not found
    queryRunner.manager.findOne = jest.fn().mockResolvedValue(null);

    // mock schedule creation
    const createdSchedule = {
      id: 'sch-1',
      doctor_id: 'doc-1',
      date: '2026-10-21',
      is_available: true,
    } as DoctorSchedule;
    queryRunner.manager.create = jest.fn().mockImplementation((entity, props) => {
      if (entity === DoctorSchedule) return createdSchedule;
      if (entity === DoctorSlot) return props;
      return props;
    });
    queryRunner.manager.save = jest.fn().mockResolvedValue(createdSchedule);

    // mock slot saving
    const savedSlots: DoctorSlot[] = [];
    queryRunner.manager.save = jest.fn().mockImplementation(async (entity, data) => {
      if (Array.isArray(data)) {
        savedSlots.push(...data);
        return data;
      }
      return data;
    });

    const result = await service.upsertScheduleAndSlots(input);
    expect(result).toHaveLength(1);
    expect(result[0].slots).toHaveLength(2); // 09:00-09:30, 09:30-10:00
    expect(savedSlots).toHaveLength(2);
  });

  // ----- deleteSchedules -----
  it('deletes schedules that have no booked slots', async () => {
    const input: DeleteScheduleInput = {
      doctor_id: 'doc-1',
      dates: ['2026-10-21'],
    } as DeleteScheduleInput;

    const schedule: DoctorSchedule = {
      id: 'sch-1',
      doctor_id: 'doc-1',
      date: '2026-10-21',
      is_available: true,
      slots: [{ is_booked: false } as DoctorSlot],
    } as unknown as DoctorSchedule;

    scheduleRepo.createQueryBuilder = jest.fn().mockReturnValue({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([schedule]),
    });

    const result = await service.deleteSchedules(input);
    expect(result).toBe(true);
    expect(scheduleRepo.delete).toHaveBeenCalledWith(['sch-1']);
  });

  // ----- getDoctorSchedules -----
  it('retrieves schedules using date filters', async () => {
    const filter: GetScheduleFilterInput = {
      doctor_id: 'doc-1',
      start_date: '2026-10-20',
      end_date: '2026-10-25',
    } as GetScheduleFilterInput;

    const schedules = [
      { id: 'sch-1', doctor_id: 'doc-1', date: '2026-10-21' } as DoctorSchedule,
    ];
    scheduleRepo.find = jest.fn().mockResolvedValue(schedules);

    const result = await service.getDoctorSchedules(filter);
    expect(result).toEqual(schedules);
    expect(scheduleRepo.find).toHaveBeenCalled();
  });
});
