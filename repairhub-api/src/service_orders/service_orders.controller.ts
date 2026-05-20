import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { Res } from '@nestjs/common';
import type { Response } from 'express';
import type { Request } from 'express';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ServiceOrdersService } from './service_orders.service';
import { CreateServiceOrderDto } from './dto/create-service_order.dto';
import { UpdateServiceOrderDto } from './dto/update-service_order.dto';

@Controller('service-orders')
export class ServiceOrdersController {
  constructor(private readonly serviceOrdersService: ServiceOrdersService) {}

  @Post()
  @UseInterceptors(FilesInterceptor('images', 6))
  create(
    @Body() body: any,
    @UploadedFiles() images: Express.Multer.File[] = [],
  ) {
    const createServiceOrderDto = this.parseBody<CreateServiceOrderDto>(body);
    return this.serviceOrdersService.createWithImages(
      createServiceOrderDto,
      images,
    );
  }

  @Get()
  findAll(@Req() req: Request, @Query('customerId') customerId?: string) {
    const user = (req as any).user;
    const parsedCustomerId = customerId ? Number(customerId) : undefined;
    return this.serviceOrdersService.findAll(
      user,
      Number.isFinite(parsedCustomerId) ? parsedCustomerId : undefined,
    );
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.serviceOrdersService.findOne(id);
  }

  @Patch(':id')
  @UseInterceptors(FilesInterceptor('images', 6))
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: any,
    @UploadedFiles() images: Express.Multer.File[] = [],
  ) {
    const updateServiceOrderDto = this.parseBody<UpdateServiceOrderDto>(body);
    const deleteImageIds = this.parseDeleteImageIds(body);
    return this.serviceOrdersService.updateWithImages(
      id,
      updateServiceOrderDto,
      images,
      deleteImageIds,
    );
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.serviceOrdersService.remove(id);
  }

  @Post(':id/resend-email')
  async resendEmail(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    await this.serviceOrdersService.resendEmail(id);
    return res.json({ ok: true, message: 'Resend requested' });
  }

  private parseBody<T>(body: any): T {
    if (typeof body?.data === 'string') {
      return JSON.parse(body.data) as T;
    }

    const { deleteImageIds, ...dto } = body ?? {};
    return dto as T;
  }

  private parseDeleteImageIds(body: any): number[] {
    const raw = body?.deleteImageIds;
    if (!raw) return [];

    if (Array.isArray(raw)) return raw.map(Number).filter(Boolean);
    if (typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed.map(Number).filter(Boolean);
        const parsedNumber = Number(parsed);
        return Number.isFinite(parsedNumber) && parsedNumber > 0
          ? [parsedNumber]
          : [];
      } catch {
        return raw
          .split(',')
          .map(Number)
          .filter(Boolean);
      }
    }

    return [];
  }
}
