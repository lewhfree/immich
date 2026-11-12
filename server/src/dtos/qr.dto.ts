import z from 'zod';
import { createZodDto } from 'src/zod.js';

const AssetQrResponseSchema = z
  .object({
    assetId: z.uuidv4(),
    id: z.uuidv4(),
    payload: z.string().describe('Decoded QR code payload'),
    x1: z.number().meta({ format: 'double' }).describe('Normalized x coordinate of box corner 1 (0-1)'),
    x2: z.number().meta({ format: 'double' }).describe('Normalized x coordinate of box corner 2 (0-1)'),
    x3: z.number().meta({ format: 'double' }).describe('Normalized x coordinate of box corner 3 (0-1)'),
    x4: z.number().meta({ format: 'double' }).describe('Normalized x coordinate of box corner 4 (0-1)'),
    y1: z.number().meta({ format: 'double' }).describe('Normalized y coordinate of box corner 1 (0-1)'),
    y2: z.number().meta({ format: 'double' }).describe('Normalized y coordinate of box corner 2 (0-1)'),
    y3: z.number().meta({ format: 'double' }).describe('Normalized y coordinate of box corner 3 (0-1)'),
    y4: z.number().meta({ format: 'double' }).describe('Normalized y coordinate of box corner 4 (0-1)'),
  })
  .meta({ id: 'AssetQrResponseDto' });

export class AssetQrResponseDto extends createZodDto(AssetQrResponseSchema) {}
