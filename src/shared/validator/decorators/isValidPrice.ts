import {
  registerDecorator,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ async: false })
class IsValidPriceConstraint implements ValidatorConstraintInterface {
  validate(value: any) {
    const decimalPattern = /^-?\d*(\.\d{1,3})?$/;
    return decimalPattern.test(value.toString());
  }

  defaultMessage() {
    return `Invalid Price`;
  }
}

// Create Decorator for the constraint that was just created
export function IsValidPrice() {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      validator: IsValidPriceConstraint,
    });
  };
}
