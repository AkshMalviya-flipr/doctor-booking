import { Test, TestingModule } from '@nestjs/testing';
import { AvailabilitySlotResolver } from './availability-slot.resolver';
import { AvailabilitySlotService } from './availability-slot.service';
import { UpsertScheduleInput } from './dto/upsert-schedule.input';
import { DeleteScheduleInput } from './dto/delete-schedule.input';
import { GetScheduleFilterInput } from './entity/get-schedule.input';
import { DoctorSchedule } from '../../schemas/doctor-schedule.schema';

describe('AvailabilitySlotResolver', () => {
  let resolver: AvailabilitySlotResolver;
  let service: AvailabilitySlotService;

  const mockService = {
    upsertScheduleAndSlots: jest.fn(),
    deleteSchedules: jest.fn(),
    getDoctorSchedules: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AvailabilitySlotResolver,
        { provide: AvailabilitySlotService, useValue: mockService },
      ],
    }).compile();

    resolver = module.get<AvailabilitySlotResolver>(AvailabilitySlotResolver);
    service = module.get<AvailabilitySlotService>(AvailabilitySlotService);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  it('should delegate upsertDoctorSchedule to service', async () => {
    const input: UpsertScheduleInput = {
      doctor_id: 'doc-1',
      dates: ['2026-10-21'],
      start_time: '09:00',
      end_time: '10:00',
      duration_minutes: 30,
      is_available: true,
    } as UpsertScheduleInput;
    const expected: DoctorSchedule[] = [] as any;
    mockService.upsertScheduleAndSlots.mockResolvedValue(expected);
    const result = await resolver.upsertDoctorSchedule(input);
    expect(mockService.upsertScheduleAndSlots).toHaveBeenCalledWith(input);
    expect(result).toBe(expected);
  });

  it('should delegate deleteDoctorSchedules to service', async () => {
    const input: DeleteScheduleInput = {
      doctor_id: 'doc-1',
      dates: ['2026-10-21'],
    } as DeleteScheduleInput;
    mockService.deleteSchedules.mockResolvedValue(true);
    const result = await resolver.deleteDoctorSchedules(input);
    expect(mockService.deleteSchedules).toHaveBeenCalledWith(input);
    expect(result).toBe(true);
  });

  it('should delegate getDoctorSchedules to service', async () => {
    const filter: GetScheduleFilterInput = {
      doctor_id: 'doc-1',
      start_date: '2026-10-20',
      end_date: '2026-10-25',
    } as GetScheduleFilterInput;
    const expected: DoctorSchedule[] = [] as any;
    mockService.getDoctorSchedules.mockResolvedValue(expected);
    const result = await resolver.getDoctorSchedules(filter);
    expect(mockService.getDoctorSchedules).toHaveBeenCalledWith(filter);
    expect(result).toBe(expected);
  });
});
