import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { CreateDoctorFeedbackInput } from './dto/create-doctor-feedback.input';
import { ParseUUIDPipe } from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { DoctorFeedback } from '../../schemas/feedback.schema';

@Resolver(() => DoctorFeedback)
export class FeedbackResolver {
  constructor(private readonly feedbackService: FeedbackService) { }

  @Mutation(() => DoctorFeedback)
  async createDoctorFeedback(
    @Args('createDoctorFeedbackInput') input: CreateDoctorFeedbackInput,
  ): Promise<DoctorFeedback> {
    return await this.feedbackService.createFeedback(input);
  }

  @Query(() => [DoctorFeedback])
  async getDoctorFeedbacks(
    @Args('doctorId', { type: () => ID }, ParseUUIDPipe) doctorId: string,
  ): Promise<DoctorFeedback[]> {
    return await this.feedbackService.getFeedbacksByDoctorId(doctorId);
  }
}