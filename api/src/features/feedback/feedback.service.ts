// doctor-feedback.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateDoctorFeedbackInput } from './dto/create-doctor-feedback.input';
import { DoctorFeedback } from '../../schemas/feedback.schema';

@Injectable()
export class FeedbackService {
  constructor(
    @InjectRepository(DoctorFeedback)
    private readonly feedbackModel: Repository<DoctorFeedback>,
  ) { }

  async createFeedback(input: CreateDoctorFeedbackInput): Promise<DoctorFeedback> {
    const feedback = this.feedbackModel.create(input);
    return await this.feedbackModel.save(feedback);
  }

  async getFeedbacksByDoctorId(doctorId: string): Promise<DoctorFeedback[]> {
    return await this.feedbackModel.find({
      where: { doctor_id: doctorId },
      order: { created_at: 'DESC' },
    });
  }
}