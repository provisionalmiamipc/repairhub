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
import { CreatePaymentLinkDto } from './dto/create-payment-link.dto';
import { ServiceOrderPaymentLinksService } from './service-order-payment-links.service';

@Controller('service-orders')
export class ServiceOrdersController {
  constructor(
    private readonly serviceOrdersService: ServiceOrdersService,
    private readonly paymentLinksService: ServiceOrderPaymentLinksService,
  ) {}

  @Post()
  @UseInterceptors(FilesInterceptor('images', 12))
  create(
    @Body() body: any,
    @Req() req: Request,
    @UploadedFiles() images: Express.Multer.File[] = [],
  ) {
    const createServiceOrderDto = this.parseBody<CreateServiceOrderDto>(body);
    const imageKinds = this.parseImageKinds(body);
    return this.serviceOrdersService.createWithImages(
      createServiceOrderDto,
      images,
      imageKinds,
      (req as any).user,
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

  @Get(':id/pdf')
  async downloadPdf(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    const order = await this.serviceOrdersService.findOne(id) as any;
    const pdf = await this.serviceOrdersService.generatePdf(id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="service-order-${order.orderCode}.pdf"`);
    return res.send(pdf);
  }

  @Get(':id/payment-links')
  findPaymentLinks(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    this.paymentLinksService.assertCanManage((req as any).user);
    return this.paymentLinksService.findByServiceOrder(id);
  }

  @Post(':id/payment-links')
  createPaymentLink(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreatePaymentLinkDto,
    @Req() req: Request,
  ) {
    return this.paymentLinksService.create(id, dto, (req as any).user);
  }

  @Post(':id/payment-links/:linkId/retry')
  retryPaymentLink(
    @Param('linkId', ParseIntPipe) linkId: number,
    @Req() req: Request,
  ) {
    return this.paymentLinksService.retry(linkId, (req as any).user);
  }

  @Delete(':id/payment-links/:linkId')
  deletePaymentLink(
    @Param('linkId', ParseIntPipe) linkId: number,
    @Req() req: Request,
  ) {
    return this.paymentLinksService.remove(linkId, (req as any).user);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.serviceOrdersService.findOne(id);
  }

  @Patch(':id')
  @UseInterceptors(FilesInterceptor('images', 12))
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: any,
    @UploadedFiles() images: Express.Multer.File[] = [],
  ) {
    const updateServiceOrderDto = this.parseBody<UpdateServiceOrderDto>(body);
    const deleteImageIds = this.parseDeleteImageIds(body);
    const imageKinds = this.parseImageKinds(body);
    return this.serviceOrdersService.updateWithImages(
      id,
      updateServiceOrderDto,
      images,
      deleteImageIds,
      imageKinds,
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

    const { deleteImageIds, imageKinds, ...dto } = body ?? {};
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

  private parseImageKinds(body: any): string[] {
    const raw = body?.imageKinds;
    if (!raw) return [];

    if (Array.isArray(raw)) return raw.map(String);
    if (typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed.map(String);
      } catch {
        return raw.split(',').map(kind => kind.trim()).filter(Boolean);
      }

      return [raw];
    }

    return [];
  }
}
