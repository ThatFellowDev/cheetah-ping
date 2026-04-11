import { z } from 'zod';
import { isSafeUrl } from '@/lib/validate-url';
import { isValidCssSelector } from '@/modules/monitoring/lib/selector-validator';

export const createMonitorSchema = z.object({
  url: z
    .string()
    .url('Must be a valid URL')
    .refine(
      (url) => url.startsWith('http://') || url.startsWith('https://'),
      'URL must start with http:// or https://'
    )
    .refine(isSafeUrl, 'URLs to private or internal networks are not allowed'),
  label: z.string().max(100).optional(),
  selector: z
    .string()
    .max(500)
    .refine((val) => isValidCssSelector(val), 'Invalid CSS selector syntax')
    .optional(),
  keyword: z.string().max(200).optional(),
  checkIntervalMinutes: z.number().int().positive(),
  // Pre-captured baseline screenshot URL from the onboarding preview.
  // The route handler verifies the prefix matches our R2 bucket before storing.
  lastScreenshotUrl: z.string().url().max(500).optional(),
});

export const updateMonitorSchema = createMonitorSchema.partial().extend({
  shareEnabled: z.boolean().optional(),
});

export type CreateMonitorInput = z.infer<typeof createMonitorSchema>;
export type UpdateMonitorInput = z.infer<typeof updateMonitorSchema>;
