import { Resolver, Mutation, Query, Args } from '@nestjs/graphql';
import { ConsultationService } from './consultation.service';
import { Consultation } from '../../schemas/consultation.schema';
import { SlotInput } from './dto/slot.input';
import { SlotDetailEntity, SlotDetail } from './enitiy/slot-detail.entity';

@Resolver(() => Consultation)
export class ConsultationResolver {
  constructor(private readonly consultationService: ConsultationService) { }

  @Mutation(() => Consultation)
  async bookSlot(@Args('input') input: SlotInput): Promise<Consultation> {
    const { slot_id, patient_id } = input;
    return this.consultationService.bookSlot(slot_id, patient_id!);
  }

  @Query(() => SlotDetailEntity, { nullable: true })
  async getSlot(
    @Args('input') input: SlotInput,
  ): Promise<SlotDetail | null> {
    return this.consultationService.getSlot(input.slot_id);
  }
}
