import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FeedbackService } from './feedback.service';
import { DoctorFeedback } from '../../schemas/feedback.schema';
import { CreateDoctorFeedbackInput } from './dto/create-doctor-feedback.input';

describe('FeedbackService', () => {
  let service: FeedbackService;
  let repo: Repository<DoctorFeedback>;

  const mockFeedback: DoctorFeedback = {
    id: 'uuid-123',
    doctor_id: 'doc-1',
    patient_id: 'pat-1',
    consultancy_id: 'cons-1',
    prescription_id: undefined,
    feedback: 'Great service',
    rating: 5,
    created_at: new Date(),
  } as any;

  const feedbackRepoMock = {
    create: jest.fn().mockImplementation((dto) => ({ ...dto })),
    save: jest.fn().mockResolvedValue(mockFeedback),
    find: jest.fn().mockResolvedValue([mockFeedback]),
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeedbackService,
        { provide: getRepositoryToken(DoctorFeedback), useValue: feedbackRepoMock },
      ],
    }).compile();

    service = module.get<FeedbackService>(FeedbackService);
    repo = module.get<Repository<DoctorFeedback>>(getRepositoryToken(DoctorFeedback));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create feedback', async () => {
    const input: CreateDoctorFeedbackInput = {
      doctor_id: 'doc-1',
      patient_id: 'pat-1',
      consultancy_id: 'cons-1',
      rating: 5,
      feedback: 'Great service',
    } as any;
    const result = await service.createFeedback(input);
    expect(feedbackRepoMock.create).toHaveBeenCalledWith(input);
    expect(feedbackRepoMock.save).toHaveBeenCalled();
    expect(result).toEqual(mockFeedback);
  });

  it('should get feedbacks by doctor id', async () => {
    const doctorId = 'doc-1';
    const result = await service.getFeedbacksByDoctorId(doctorId);
    expect(feedbackRepoMock.find).toHaveBeenCalledWith({
      where: { doctor_id: doctorId },
      order: { created_at: 'DESC' },
    });
    expect(result).toEqual([mockFeedback]);
  });
});
