import {
  registerDecorator,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationOptions,
} from 'class-validator';

@ValidatorConstraint({ async: false })
class IsSolanaAddressConstraint implements ValidatorConstraintInterface {
  validate(value: any) {
    if (Array.isArray(value)) {
      return value.every(item => this.validateAddress(item));
    }
    return this.validateAddress(value);
  }

  private validateAddress(value: string) {
    const solanaAddressPattern = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
    return solanaAddressPattern.test(value);
  }

  defaultMessage() {
    return `Invalid Solana Address`;
  }
}

export function IsSolanaAddress(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: IsSolanaAddressConstraint,
    });
  };
}
