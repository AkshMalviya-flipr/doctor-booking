// prescription.resolver.ts
import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { ParseUUIDPipe } from '@nestjs/common';
import { PrescriptionService } from './prescription.service';
import { CreatePrescriptionInput } from './dto/create-prescription.input';
import { Prescription } from '../../schemas/prescription.schema';

@Resolver(() => Prescription)
export class PrescriptionResolver {
  constructor(private readonly prescriptionService: PrescriptionService) { }

  @Mutation(() => Prescription)
  async createPrescription(
    @Args('createPrescriptionInput') input: CreatePrescriptionInput,
  ): Promise<Prescription> {
    return await this.prescriptionService.createPrescription(input);
  }

  @Query(() => Prescription)
  async getPrescriptionById(
    @Args('id', { type: () => ID }, ParseUUIDPipe) id: string,
  ): Promise<Prescription> {
    return await this.prescriptionService.getPrescriptionById(id);
  }

  @Query(() => Prescription)
  async getPrescriptionByConsultation(
    @Args('consultationId', { type: () => ID }, ParseUUIDPipe)
    consultationId: string,
  ): Promise<Prescription> {
    return await this.prescriptionService.getPrescriptionByConsultationId(
      consultationId,
    );
  }

  @Query(() => [Prescription])
  async getPatientPrescriptions(
    @Args('patientId', { type: () => ID }, ParseUUIDPipe) patientId: string,
  ): Promise<Prescription[]> {
    return await this.prescriptionService.getPrescriptionsByPatientId(patientId);
  }
}