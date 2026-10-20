import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PrescriptionService } from './prescription.service';
import { Prescription } from '../../schemas/prescription.schema';
import { CreatePrescriptionInput } from './dto/create-prescription.input';

describe('PrescriptionService', () => {
  let service: PrescriptionService;
  let repo: Repository<Prescription>;

  const mockPrescription: Prescription = {
    id: 'presc-123',
    patient_id: 'pat-1',
    doctor_id: 'doc-1',
    consultation_id: 'consult-1',
    created_at: new Date(),
    medications: [],
  } as any;

  const repoMock = {
    create: jest.fn().mockImplementation((dto) => ({ ...dto })),
    save: jest.fn().mockResolvedValue(mockPrescription),
    findOne: jest.fn().mockResolvedValue(mockPrescription),
    find: jest.fn().mockResolvedValue([mockPrescription]),
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrescriptionService,
        { provide: getRepositoryToken(Prescription), useValue: repoMock },
      ],
    }).compile();

    service = module.get<PrescriptionService>(PrescriptionService);
    repo = module.get<Repository<Prescription>>(getRepositoryToken(Prescription));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a prescription', async () => {
    const input: CreatePrescriptionInput = {
      patient_id: 'pat-1',
      doctor_id: 'doc-1',
      consultation_id: 'consult-1',
    } as any;
    const result = await service.createPrescription(input);
    expect(repoMock.create).toHaveBeenCalledWith(input);
    expect(repoMock.save).toHaveBeenCalled();
    expect(result).toEqual(mockPrescription);
  });

  it('should get prescription by id', async () => {
    const id = 'presc-123';
    const result = await service.getPrescriptionById(id);
    expect(repoMock.findOne).toHaveBeenCalledWith({
      where: { id },
      relations: {
        medications: true,
        doctor: true,
        patient: true,
        consultation: true,
      },
    });
    expect(result).toEqual(mockPrescription);
  });

  it('should get prescription by consultation id', async () => {
    const consultationId = 'consult-1';
    const result = await service.getPrescriptionByConsultationId(consultationId);
    expect(repoMock.findOne).toHaveBeenCalledWith({
      where: { consultation_id: consultationId },
      relations: {
        medications: true,
        doctor: true,
        patient: true,
      },
    });
    expect(result).toEqual(mockPrescription);
  });

  it('should get prescriptions by patient id', async () => {
    const patientId = 'pat-1';
    const result = await service.getPrescriptionsByPatientId(patientId);
    expect(repoMock.find).toHaveBeenCalledWith({
      where: { patient_id: patientId },
      relations: { medications: true, doctor: true },
      order: { created_at: 'DESC' },
    });
    expect(result).toEqual([mockPrescription]);
  });
});
