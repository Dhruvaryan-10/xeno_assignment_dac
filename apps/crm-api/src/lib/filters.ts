import { Channel } from "../store.js";
import type { AudienceFilters } from "../types.js";

export function normalizeFilters(input: Partial<AudienceFilters>): AudienceFilters {
  const filters: AudienceFilters = {};
  if (Number.isFinite(input.minSpend)) filters.minSpend = Number(input.minSpend);
  if (Number.isFinite(input.maxSpend)) filters.maxSpend = Number(input.maxSpend);
  if (Number.isFinite(input.inactiveDays)) filters.inactiveDays = Number(input.inactiveDays);
  if (input.city) filters.city = String(input.city);
  if (Number.isFinite(input.minAge)) filters.minAge = Number(input.minAge);
  if (Number.isFinite(input.maxAge)) filters.maxAge = Number(input.maxAge);
  if (input.preferredChannel) filters.preferredChannel = input.preferredChannel;
  return filters;
}

export function fallbackFilters(prompt: string): AudienceFilters {
  const lower = prompt.toLowerCase();
  const minSpendMatch = lower.match(/(?:over|above|more than|spent)\s*(?:inr|rs\.?|₹)?\s*([0-9,]+)/);
  const inactiveMatch = lower.match(/(?:not purchased|inactive|no purchase|not bought).*?(\d+)\s*days?/);
  const city = ["mumbai", "delhi", "bengaluru", "hyderabad", "chennai", "pune", "kolkata", "ahmedabad", "jaipur", "lucknow"].find((item) =>
    lower.includes(item)
  );
  const channel = Object.values(Channel).find((item) => lower.includes(item.toLowerCase()));
  return normalizeFilters({
    minSpend: minSpendMatch?.[1] ? Number(minSpendMatch[1].replace(/,/g, "")) : undefined,
    inactiveDays: inactiveMatch?.[1] ? Number(inactiveMatch[1]) : undefined,
    city,
    preferredChannel: channel
  });
}
