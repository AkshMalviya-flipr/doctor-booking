import { Injectable } from '@nestjs/common';
import { CreateHealthInput } from './dto/create-health.input';
import { UpdateHealthInput } from './dto/update-health.input';

@Injectable()
export class HealthService {
  create(createHealthInput: CreateHealthInput) {
    return 'This action adds a new health';
  }

  findAll() {
    return `This action returns all health`;
  }

  findOne(id: number) {
    return `This action returns a #${id} health`;
  }

  update(id: number, updateHealthInput: UpdateHealthInput) {
    return `This action updates a #${id} health`;
  }

  remove(id: number) {
    return `This action removes a #${id} health`;
  }
}
