import { Controller, Delete, Get, Param, ParseIntPipe, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { MediaService } from './media.service';

@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Get(':id/url')
  getVariantUrl(
    @Param('id', ParseIntPipe) id: number,
    @Query('variant') variant: 'thumbnail' | 'display' = 'display',
    @Req() req: Request,
  ) {
    return this.mediaService.getVariantUrl(
      id,
      variant === 'thumbnail' ? 'thumbnail' : 'display',
      (req as any).user,
    );
  }

  @Get(':ownerType/:ownerId')
  findByOwner(
    @Param('ownerType') ownerType: string,
    @Param('ownerId', ParseIntPipe) ownerId: number,
    @Req() req: Request,
  ) {
    return this.mediaService.findByOwner(ownerType, ownerId, (req as any).user);
  }

  @Delete(':id')
  deleteOne(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    return this.mediaService.deleteOne(id, (req as any).user);
  }
}
