export class RuleError extends Error {
  status = 400;
}
export const ensure: (
  condition: unknown,
  message: string,
) => asserts condition = (condition, message) => {
  if (!condition) throw new RuleError(message);
};
