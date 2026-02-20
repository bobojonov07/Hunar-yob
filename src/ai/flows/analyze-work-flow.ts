'use server';
/**
 * @fileOverview AI flow to analyze an artisan's work photo and suggest a description/category.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeWorkInputSchema = z.object({
  photoDataUri: z.string().describe("A photo of the artisan's work as a data URI."),
});
export type AnalyzeWorkInput = z.infer<typeof AnalyzeWorkInputSchema>;

const AnalyzeWorkOutputSchema = z.object({
  suggestedTitle: z.string().describe('A catchy title for the listing.'),
  suggestedDescription: z.string().describe('A professional description based on the image (160-250 characters).'),
  suggestedCategory: z.string().describe('The best matching category for this work.'),
});
export type AnalyzeWorkOutput = z.infer<typeof AnalyzeWorkOutputSchema>;

export async function analyzeWork(input: AnalyzeWorkInput): Promise<AnalyzeWorkOutput> {
  return analyzeWorkFlow(input);
}

const analyzeWorkFlow = ai.defineFlow(
  {
    name: 'analyzeWorkFlow',
    inputSchema: AnalyzeWorkInputSchema,
    outputSchema: AnalyzeWorkOutputSchema,
  },
  async input => {
    const {output} = await ai.generate({
      prompt: [
        {text: "Шумо коршиноси маркетинг барои ҳунармандон ҳастед. Ин суратро таҳлил кунед ва унвони ҷолиб, тавсифи касбӣ (160-250 аломат) ва категорияи мувофиқро ба забони тоҷикӣ пешниҳод кунед. Категория бояд яке аз инҳо бошад: Барномасоз, Дӯзанда, Дуредгар, Сантехник, Барқчӣ, Меъмор, Ронанда, Ошпаз, Муаллим, Табиб, Сартарош, Рангуборчӣ, Кафшергар, Кондиционерсоз, Автомеханик, Дигар."},
        {media: {url: input.photoDataUri, contentType: 'image/jpeg'}},
      ],
      output: {schema: AnalyzeWorkOutputSchema},
    });
    return output!;
  }
);
