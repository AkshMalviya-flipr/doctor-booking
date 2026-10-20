import { Test, TestingModule } from '@nestjs/testing';
import { PrescriptionResolver } from './prescription.resolver';
import { PrescriptionService } from './prescription.service';
import { CreatePrescriptionInput } from './dto/create-prescription.input';
import { Prescription } from '../../schemas/prescription.schema';

describe('PrescriptionResolver', () => {
  let resolver: PrescriptionResolver;
  let service: PrescriptionService;

  const mockPrescription: Prescription = {
    id: 'presc-123',
    patient_id: 'pat-1',
    doctor_id: 'doc-1',
    consultation_id: 'consult-1',
    created_at: new Date(),
    medications: [],
  } as any;

  const serviceMock = {
    createPrescription: jest.fn().mockResolvedValue(mockPrescription),
    getPrescriptionById: jest.fn().mockResolvedValue(mockPrescription),
    getPrescriptionByConsultationId: jest.fn().mockResolvedValue(mockPrescription),
    getPrescriptionsByPatientId: jest.fn().mockResolvedValue([mockPrescription]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrescriptionResolver,
        { provide: PrescriptionService, useValue: serviceMock },
      ],
    }).compile();

    resolver = module.get<PrescriptionResolver>(PrescriptionResolver);
    service = module.get<PrescriptionService>(PrescriptionService);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  it('should create prescription', async () => {
    const input: CreatePrescriptionInput = {
      patient_id: 'pat-1',
      doctor_id: 'doc-1',
      consultation_id: 'consult-1',
    } as any;
    const result = await resolver.createPrescription(input);
    expect(serviceMock.createPrescription).toHaveBeenCalledWith(input);
    expect(result).toEqual(mockPrescription);
  });

  it('should get prescription by id', async () => {
    const id = 'presc-123';
    const result = await resolver.getPrescriptionById(id);
    expect(serviceMock.getPrescriptionById).toHaveBeenCalledWith(id);
    expect(result).toEqual(mockPrescription);
  });

  it('should get prescription by consultation id', async () => {
    const consultationId = 'consult-1';
    const result = await resolver.getPrescriptionByConsultation(consultationId);
    expect(serviceMock.getPrescriptionByConsultationId).toHaveBeenCalledWith(consultationId);
    expect(result).toEqual(mockPrescription);
  });

  it('should get patient prescriptions', async () => {
    const patientId = 'pat-1';
    const result = await resolver.getPatientPrescriptions(patientId);
    expect(serviceMock.getPrescriptionsByPatientId).toHaveBeenCalledWith(patientId);
    expect(result).toEqual([mockPrescription]);
  });
});
