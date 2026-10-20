import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { DoctorSlot } from '../../schemas/doctor-slot.schema';
import { DoctorSchedule } from '../../schemas/doctor-schedule.schema';
import { Consultation } from '../../schemas/consultation.schema';
import { ConsultationStatus } from '../../common/enum/consultation.enums';
import { SlotDetail } from './enitiy/slot-detail.entity';

@Injectable()
export class ConsultationService {
  private readonly logger = new Logger(ConsultationService.name);

  constructor(
    @InjectRepository(DoctorSlot)
    private readonly slotRepo: Repository<DoctorSlot>,
    @InjectRepository(Consultation)
    private readonly consultationRepo: Repository<Consultation>,
    private readonly dataSource: DataSource,
  ) { }

  async bookSlot(slotId: string, patientId: string): Promise<Consultation> {
    try {
      return await this.dataSource.transaction(async (manager) => {
        // 1. Acquire a row-level lock (SELECT ... FOR UPDATE) to prevent double-booking race conditions
        const slot = await manager.findOne(DoctorSlot, {
          where: { id: slotId },
          lock: { mode: 'pessimistic_write' },
        });

        if (!slot) {
          throw new NotFoundException('Slot not found');
        }

        if (slot.is_booked) {
          throw new BadRequestException('Slot already booked');
        }

        // 2. Resolve doctor_id via parent schedule if needed
        let doctorId = slot.schedule_id;
        const schedule = await manager.findOne(DoctorSchedule, {
          where: { id: slot.schedule_id },
        });
        if (schedule) {
          doctorId = schedule.doctor_id;
        }

        // 3. Update slot status
        slot.is_booked = true;
        await manager.save(DoctorSlot, slot);

        // 4. Create and persist consultation record
        const consultation = manager.create(Consultation, {
          patient_id: patientId,
          doctor_id: doctorId,
          slot_id: slotId,
          status: ConsultationStatus.CONFIRMED,
          scheduled_at: new Date(),
        });

        return await manager.save(Consultation, consultation);
      });
    } catch (error) {
      this.logger.error('Failed to book slot', error);
      throw error;
    }
  }

  async getSlot(slotId: string): Promise<SlotDetail | null> {
    try {
      const slot = await this.slotRepo.findOne({ where: { id: slotId } });
      if (!slot) {
        return null;
      }

      const consultation = await this.consultationRepo.findOne({
        where: { slot_id: slotId },
      });

      const dto: SlotDetail = {
        slot,
        consultation: consultation ?? undefined,
      };

      return dto;
    } catch (error) {
      this.logger.error('Failed to get slot details', error);
      throw error;
    }
  }
}