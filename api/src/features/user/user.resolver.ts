import { Resolver, Mutation, Args, Context } from '@nestjs/graphql';
import type { Response } from 'express';
import { UserService } from './user.service';
import { SignupInput } from './dto/signup.input';
import { LoginInput } from './dto/login.input';
import { SuccessResponse } from './entity/success-response.entity';
import { Public } from '../../common/decorator/public.decorator';

@Resolver()
export class UserResolver {
  constructor(private readonly userService: UserService) { }

  @Public()
  @Mutation(() => SuccessResponse)
  async signup(
    @Args('input') input: SignupInput,
    @Context('res') res: Response,
  ): Promise<SuccessResponse> {
    return this.userService.signup(input, res);
  }

  @Public()
  @Mutation(() => SuccessResponse)
  async login(
    @Args('input') input: LoginInput,
    @Context('res') res: Response,
  ): Promise<SuccessResponse> {
    return this.userService.login(input, res);
  }

  @Public()
  @Mutation(() => SuccessResponse)
  async logout(@Context('res') res: Response): Promise<SuccessResponse> {
    return this.userService.logout(res);
  }
}