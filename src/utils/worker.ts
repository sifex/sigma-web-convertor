import { convertSigmaRuleAsync } from './workerApi';

export async function convertSigmaRule(rule: string, target: string): Promise<string> {
  const { result, error } = await convertSigmaRuleAsync(rule, target);
  if (error) throw new Error(error);
  return result;
}
