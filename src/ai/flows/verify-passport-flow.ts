'use server';
/**
 * @fileOverview AI flow to verify if a photo is a valid passport and extract data.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const VerifyPassportInputSchema = z.object({
  photoDataUri: z.string().describe("A photo of the passport as a data URI."),
});
export type VerifyPassportInput = z.infer<typeof VerifyPassportInputSchema>;

const VerifyPassportOutputSchema = z.object({
  isPassport: z.boolean().describe('Whether the image is a valid identification document (passport/ID).'),
  isOver18: z.boolean().describe('Whether the person in the document is 18 years or older.'),
  fullName: z.string().optional().describe('Extracted full name from the document.'),
  passportNumber: z.string().optional().describe('Unique passport or ID number.'),
  errorReason: z.string().optional().describe('Reason for rejection if any.'),
});
export type VerifyPassportOutput = z.infer<typeof VerifyPassportOutputSchema>;

export async function verifyPassport(input: VerifyPassportInput): Promise<VerifyPassportOutput> {
  return verifyPassportFlow(input);
}

const verifyPassportFlow = ai.defineFlow(
  {
    name: 'verifyPassportFlow',
    inputSchema: VerifyPassportInputSchema,
    outputSchema: VerifyPassportOutputSchema,
  },
  async input => {
    const {output} = await ai.generate({
      prompt: [
        {text: "Шумо коршиноси тасдиқи ҳуҷҷатҳо ҳастед. Ин суратро таҳлил кунед. Муайян кунед, ки оё ин шиноснома ё корти идентификатсионӣ аст. Синну соли соҳиби ҳуҷҷатро санҷед (бояд аз 18 боло бошад). Рақами шиноснома ва номи пурраро хонед. Агар сурат норавшан бошад ё ҳуҷҷат набошад, 'isPassport'-ро false гузоред ва сабабро нависед."},
        {media: {url: input.photoDataUri, contentType: 'image/jpeg'}},
      ],
      output: {schema: VerifyPassportOutputSchema},
    });
    return output!;
  }
);
