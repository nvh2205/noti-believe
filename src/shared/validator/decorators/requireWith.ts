import { isDefined, ValidateIf } from 'class-validator';
import { IsSiblingOf } from './isSiblingOf';

export function RequireWith(siblings: string[]) {
  const sibling = IsSiblingOf(siblings);
  const validateIf = ValidateIf(siblingsPresent(siblings));
  return function (target: any, key: string) {
    sibling(target, key);
    validateIf(target, key);
  };
}
// Helper function for determining if a prop should be validated
function siblingsPresent(siblings: string[]) {
  return function (o, v) {
    return Boolean(
      isDefined(v) || // Validate if prop has value
        siblings.every((prop) => isDefined(o[prop])), // Validate if all incompatible siblings are not defined
    );
  };
}
