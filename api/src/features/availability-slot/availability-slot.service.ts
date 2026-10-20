
import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';

import { DoctorSchedule } from '../../schemas/doctor-schedule.schema';
import { DoctorSlot } from '../../schemas/doctor-slot.schema';
import { UpsertScheduleInput } from './dto/upsert-schedule.input';
import { DeleteScheduleInput } from './dto/delete-schedule.input';

import { handleServiceError } from '../../utils/error/error.util';
import { GetScheduleFilterInput } from './entity/get-schedule.input';

@Injectable()
export class AvailabilitySlotService {
  private readonly logger = new Logger(AvailabilitySlotService.name);

  constructor(
    @InjectRepository(DoctorSchedule)
    private readonly scheduleRepo: Repository<DoctorSchedule>,
    @InjectRepository(DoctorSlot)
    private readonly slotRepo: Repository<DoctorSlot>,
    private readonly dataSource: DataSource,
  ) { }

  private generateTimeSlots(
    startTime: string,
    endTime: string,
    durationMinutes: number,
  ): Array<{ start_time: string; end_time: string }> {
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);

    let currentMinutes = startH * 60 + startM;
    const totalEndMinutes = endH * 60 + endM;

    if (currentMinutes >= totalEndMinutes) {
      throw new BadRequestException('start_time must be earlier than end_time');
    }

    const slots: Array<{ start_time: string; end_time: string }> = [];

    while (currentMinutes + durationMinutes <= totalEndMinutes) {
      const nextMinutes = currentMinutes + durationMinutes;

      const format = (mins: number) => {
        const h = Math.floor(mins / 60).toString().padStart(2, '0');
        const m = (mins % 60).toString().padStart(2, '0');
        return `${h}:${m}`;
      };

      slots.push({
        start_time: format(currentMinutes),
        end_time: format(nextMinutes),
      });

      currentMinutes = nextMinutes;
    }

    return slots;
  }

  async upsertScheduleAndSlots(input: UpsertScheduleInput): Promise<DoctorSchedule[]> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const rawSlots = this.generateTimeSlots(
        input.start_time,
        input.end_time,
        input.duration_minutes,
      );

      const savedSchedules: DoctorSchedule[] = [];

      for (const date of input.dates) {
        const existingSchedule = await queryRunner.manager.findOne(DoctorSchedule, {
          where: { doctor_id: input.doctor_id, date },
          relations: { slots: true },
        });

        let activeSchedule: DoctorSchedule;

        if (existingSchedule) {
          existingSchedule.is_available = input.is_available ?? existingSchedule.is_available;
          activeSchedule = await queryRunner.manager.save(DoctorSchedule, existingSchedule);

          const bookedSlots = (existingSchedule.slots || []).filter((s) => s.is_booked);

          await queryRunner.manager
            .createQueryBuilder()
            .delete()
            .from(DoctorSlot)
            .where('schedule_id = :scheduleId AND is_booked = false', {
              scheduleId: activeSchedule.id,
            })
            .execute();

          const newSlotsToInsert = rawSlots
            .filter(
              (slot) =>
                !bookedSlots.some(
                  (b) =>
                    b.start_time.slice(0, 5) === slot.start_time &&
                    b.end_time.slice(0, 5) === slot.end_time,
                ),
            )
            .map((slot) =>
              queryRunner.manager.create(DoctorSlot, {
                schedule_id: activeSchedule.id,
                start_time: slot.start_time,
                end_time: slot.end_time,
                is_available: true,
                is_booked: false,
              }),
            );

          if (newSlotsToInsert.length > 0) {
            await queryRunner.manager.save(DoctorSlot, newSlotsToInsert);
          }
        } else {
          const newSchedule = queryRunner.manager.create(DoctorSchedule, {
            doctor_id: input.doctor_id,
            date,
            is_available: input.is_available ?? true,
          });
          activeSchedule = await queryRunner.manager.save(DoctorSchedule, newSchedule);

          const newSlots = rawSlots.map((slot) =>
            queryRunner.manager.create(DoctorSlot, {
              schedule_id: activeSchedule.id,
              start_time: slot.start_time,
              end_time: slot.end_time,
              is_available: true,
              is_booked: false,
            }),
          );

          await queryRunner.manager.save(DoctorSlot, newSlots);
        }

        // Aggregated fetch with QueryBuilder
        const aggregatedSchedule = await queryRunner.manager
          .createQueryBuilder(DoctorSchedule, 'schedule')
          .leftJoinAndSelect('schedule.slots', 'slots')
          .where('schedule.id = :id', { id: activeSchedule.id })
          .orderBy('slots.start_time', 'ASC')
          .getOne();

        if (aggregatedSchedule) {
          savedSchedules.push(aggregatedSchedule);
        }
      }

      await queryRunner.commitTransaction();
      return savedSchedules;
    } catch (error: unknown) {
      await queryRunner.rollbackTransaction();
      handleServiceError(error, this.logger, 'Failed to upsert schedule and slots');
    } finally {
      await queryRunner.release();
    }
  }

  async deleteSchedules(input: DeleteScheduleInput): Promise<boolean> {
    try {
      const schedules = await this.scheduleRepo
        .createQueryBuilder('schedule')
        .leftJoinAndSelect('schedule.slots', 'slots')
        .where('schedule.doctor_id = :doctorId', { doctorId: input.doctor_id })
        .andWhere('schedule.date IN (:...dates)', { dates: input.dates })
        .getMany();

      if (!schedules.length) {
        throw new NotFoundException('No schedules found matching the criteria');
      }

      const hasBookedSlot = schedules.some((sch) =>
        sch.slots?.some((slot) => slot.is_booked),
      );

      if (hasBookedSlot) {
        throw new BadRequestException(
          'Cannot delete schedule with existing booked appointments',
        );
      }

      const scheduleIds = schedules.map((s) => s.id);
      await this.scheduleRepo.delete(scheduleIds);

      return true;
    } catch (error: unknown) {
      handleServiceError(error, this.logger, 'Failed to delete schedules');
    }
  }

  /**
   * Aggregates doctor schedules and joined slots using QueryBuilder
   */
  async getDoctorSchedules(filter: GetScheduleFilterInput): Promise<DoctorSchedule[]> {
    try {
      const query = this.scheduleRepo
        .createQueryBuilder('schedule')
        .leftJoinAndSelect('schedule.slots', 'slots')
        .where('schedule.doctor_id = :doctorId', { doctorId: filter.doctor_id });

      if (filter.start_date && filter.end_date) {
        query.andWhere('schedule.date BETWEEN :startDate AND :endDate', {
          startDate: filter.start_date,
          endDate: filter.end_date,
        });
      } else if (filter.start_date) {
        query.andWhere('schedule.date >= :startDate', {
          startDate: filter.start_date,
        });
      } else if (filter.end_date) {
        query.andWhere('schedule.date <= :endDate', {
          endDate: filter.end_date,
        });
      }

      return await query
        .orderBy('schedule.date', 'ASC')
        .addOrderBy('slots.start_time', 'ASC')
        .getMany();
    } catch (error: unknown) {
      handleServiceError(error, this.logger, 'Failed to fetch doctor schedules');
    }
  }
}