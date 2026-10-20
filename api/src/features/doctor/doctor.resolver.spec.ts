import { Test, TestingModule } from '@nestjs/testing';
import { DoctorResolver } from './doctor.resolver';
import { DoctorService } from './doctor.service';

describe('DoctorResolver', () => {
  let resolver: DoctorResolver;
  let doctorService: {
    upsertDoctorDetail: jest.Mock;
    getDoctorDetailByUserId: jest.Mock;
  };

  beforeEach(async () => {
    doctorService = {
      upsertDoctorDetail: jest.fn(),
      getDoctorDetailByUserId: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DoctorResolver,
        { provide: DoctorService, useValue: doctorService },
      ],
    }).compile();

    resolver = module.get<DoctorResolver>(DoctorResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  it('delegates doctor detail queries by user ID', async () => {
    const response = { doctor: {}, user: {} };
    doctorService.getDoctorDetailByUserId.mockResolvedValue(response);

    await expect(resolver.getDoctorDetail('user-1')).resolves.toBe(response);
    expect(doctorService.getDoctorDetailByUserId).toHaveBeenCalledWith('user-1');
  });
});
