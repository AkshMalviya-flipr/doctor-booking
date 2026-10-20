import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { HealthService } from './health.service';
import { Health } from './entities/health.entity';
import { CreateHealthInput } from './dto/create-health.input';
import { UpdateHealthInput } from './dto/update-health.input';

@Resolver(() => Health)
export class HealthResolver {
  constructor(private readonly healthService: HealthService) {}

  @Mutation(() => Health)
  createHealth(@Args('createHealthInput') createHealthInput: CreateHealthInput) {
    return this.healthService.create(createHealthInput);
  }

  @Query(() => [Health], { name: 'health' })
  findAll() {
    return this.healthService.findAll();
  }

  @Query(() => Health, { name: 'health' })
  findOne(@Args('id', { type: () => Int }) id: number) {
    return this.healthService.findOne(id);
  }

  @Mutation(() => Health)
  updateHealth(@Args('updateHealthInput') updateHealthInput: UpdateHealthInput) {
    return this.healthService.update(updateHealthInput.id, updateHealthInput);
  }

  @Mutation(() => Health)
  removeHealth(@Args('id', { type: () => Int }) id: number) {
    return this.healthService.remove(id);
  }
}
