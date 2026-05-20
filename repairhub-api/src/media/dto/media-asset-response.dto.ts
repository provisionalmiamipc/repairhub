import { MediaAssetStatus } from '../entities/media-asset.entity';

export interface MediaAssetResponseDto {
  id: number;
  ownerType: string;
  ownerId: number;
  status: MediaAssetStatus;
  originalName: string;
  mimeType?: string;
  displaySize?: number;
  thumbnailSize?: number;
  width?: number;
  height?: number;
  thumbnailUrl?: string;
  displayUrl?: string;
  error?: string | null;
}
