import { registerEnumType } from '@nestjs/graphql';
import { UserRole } from '../../../common/enum/user-role.enum';
import { UserStatus } from '../../../common/enum/user-status.enum';
import { Gender } from '../../../common/enum/gender.enum';

registerEnumType(UserRole, {
  name: 'UserRole',
  description: 'Role assigned to the user (e.g. PATIENT, DOCTOR, ADMIN)',
});

registerEnumType(UserStatus, {
  name: 'UserStatus',
  description: 'Account status (e.g. ACTIVE, INACTIVE, SUSPENDED)',
});

registerEnumType(Gender, {
  name: 'Gender',
  description: 'Biological gender designation',
});
