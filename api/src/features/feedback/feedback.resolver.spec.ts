import { Test, TestingModule } from '@nestjs/testing';
import { FeedbackResolver } from './feedback.resolver';
import { FeedbackService } from './feedback.service';
import { CreateDoctorFeedbackInput } from './dto/create-doctor-feedback.input';
import { DoctorFeedback } from '../../schemas/feedback.schema';

describe('FeedbackResolver', () => {
  let resolver: FeedbackResolver;
  let service: FeedbackService;

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

  const feedbackServiceMock = {
    createFeedback: jest.fn().mockResolvedValue(mockFeedback),
    getFeedbacksByDoctorId: jest.fn().mockResolvedValue([mockFeedback]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeedbackResolver,
        { provide: FeedbackService, useValue: feedbackServiceMock },
      ],
    }).compile();

    resolver = module.get<FeedbackResolver>(FeedbackResolver);
    service = module.get<FeedbackService>(FeedbackService);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  it('should create doctor feedback', async () => {
    const input: CreateDoctorFeedbackInput = {
      doctor_id: 'doc-1',
      patient_id: 'pat-1',
      consultancy_id: 'cons-1',
      rating: 5,
      feedback: 'Great service',
    } as any;
    const result = await resolver.createDoctorFeedback(input);
    expect(feedbackServiceMock.createFeedback).toHaveBeenCalledWith(input);
    expect(result).toEqual(mockFeedback);
  });

  it('should get doctor feedbacks', async () => {
    const doctorId = 'doc-1';
    const result = await resolver.getDoctorFeedbacks(doctorId);
    expect(feedbackServiceMock.getFeedbacksByDoctorId).toHaveBeenCalledWith(doctorId);
    expect(result).toEqual([mockFeedback]);
  });
});
