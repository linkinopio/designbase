/**
 * Embedding utilities using HuggingFace Inference SDK.
 * Model: sentence-transformers/all-MiniLM-L6-v2 (free, feature-extraction, 384 dimensions)
 */

import { HfInference } from '@huggingface/inference'

export function buildEmbeddingText(
  title: string,
  description: string,
  patternNames?: string[],
  tagNames?: string[]
): string {
  const parts = [`Title: ${title}`, `Description: ${description}`]
  if (patternNames?.length) parts.push(`Patterns: ${patternNames.join(', ')}`)
  if (tagNames?.length) parts.push(`Tags: ${tagNames.join(', ')}`)
  return parts.join('\n')
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.HUGGINGFACE_API_KEY
  if (!apiKey || apiKey === 'your_huggingface_api_key') {
    throw new Error('HUGGINGFACE_API_KEY is not configured')
  }

  const hf = new HfInference(apiKey)

  let result
  try {
    result = await hf.featureExtraction({
      model: 'sentence-transformers/all-MiniLM-L6-v2',
      inputs: text,
    })
  } catch (err) {
    console.error('Embedding error:', JSON.stringify(err, null, 2))
    throw err
  }

  // Result is a nested array, flatten to 1D
  const embedding = Array.isArray(result[0])
    ? (result as number[][])[0]
    : (result as number[])

  return embedding
}
