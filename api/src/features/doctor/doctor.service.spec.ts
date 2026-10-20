import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { DoctorSpecialization } from '../../common/enum/doctor.enums';
import { Doctor } from '../../schemas/doctor.schema';
import { UserService } from '../user/user.service';
import { DoctorService } from './doctor.service';

describe('DoctorService', () => {
  let service: DoctorService;
  let doctorRepository: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let userService: { getUserById: jest.Mock };

  beforeEach(async () => {
    doctorRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };
    userService = { getUserById: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DoctorService,
        { provide: getRepositoryToken(Doctor), useValue: doctorRepository },
        { provide: UserService, useValue: userService },
      ],
    }).compile();

    service = module.get<DoctorService>(DoctorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('creates and saves a doctor profile when one does not exist', async () => {
    const input = {
      user_id: 'user-1',
      license_number: 'license-1',
      specialization: DoctorSpecialization.GENERAL_PHYSICIAN,
      qualification: 'MBBS',
      experience_years: 4,
      consultation_fee: 100,
    };
    const doctor = { ...input };
    doctorRepository.findOne.mockResolvedValue(null);
    doctorRepository.create.mockReturnValue(doctor);
    doctorRepository.save.mockResolvedValue(doctor);

    await expect(service.upsertDoctorDetail(input)).resolves.toBe(doctor);
    expect(doctorRepository.create).toHaveBeenCalledWith(input);
    expect(doctorRepository.save).toHaveBeenCalledWith(doctor);
  });

  it('updates and saves an existing doctor profile', async () => {
    const existingDoctor = { user_id: 'user-1', license_number: 'old-license' };
    const input = {
      user_id: 'user-1',
      license_number: 'new-license',
      specialization: DoctorSpecialization.GENERAL_PHYSICIAN,
      qualification: 'MBBS',
      experience_years: 4,
      consultation_fee: 100,
    };
    doctorRepository.findOne.mockResolvedValue(existingDoctor);
    doctorRepository.save.mockResolvedValue(existingDoctor);

    await expect(service.upsertDoctorDetail(input)).resolves.toBe(existingDoctor);
    expect(existingDoctor.license_number).toBe('new-license');
    expect(doctorRepository.create).not.toHaveBeenCalled();
  });

  it('returns doctor and user details by user ID', async () => {
    const doctor = { user_id: 'user-1' };
    const user = { first_name: 'Avery' };
    doctorRepository.findOne.mockResolvedValue(doctor);
    userService.getUserById.mockResolvedValue(user);

    await expect(service.getDoctorDetailByUserId('user-1')).resolves.toEqual({
      doctor,
      user,
    });
    expect(userService.getUserById).toHaveBeenCalledWith('user-1');
  });

  it('throws when the user has no doctor profile', async () => {
    doctorRepository.findOne.mockResolvedValue(null);

    await expect(service.getDoctorDetailByUserId('user-1')).rejects.toThrow(
      NotFoundException,
    );
    expect(userService.getUserById).not.toHaveBeenCalled();
  });
});
