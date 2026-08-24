import {
  Body,
  Controller,
  Get,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Release } from '@prisma/client';
import { CreateReleaseDto } from './dto/create-release.dto';
import { AdminApiKeyGuard } from './guards/admin-api-key.guard';
import { OtaService } from './ota.service';

/**
 * Admin-only endpoints for publishing and inspecting OTA releases.
 * Every route here is protected by the static x-api-key header
 * (see AdminApiKeyGuard).
 */
@Controller('ota/android')
@UseGuards(AdminApiKeyGuard)
export class OtaAdminController {
  constructor(private readonly otaService: OtaService) {}

  @Get('releases')
  async listReleases(): Promise<Release[]> {
    return this.otaService.listReleases();
  }

  @Post('releases')
  @UseInterceptors(FileInterceptor('bundle'))
  async createRelease(
    @Body() dto: CreateReleaseDto,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<Release> {
    return this.otaService.createRelease(dto, file);
  }
}
