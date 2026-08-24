import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { CheckUpdateQueryDto } from './dto/check-update.dto';
import { CheckUpdateResponseDto } from './dto/check-update-response.dto';
import { OtaService } from './ota.service';

/**
 * Public endpoints consumed directly by the Android app. No auth required.
 */
@Controller('ota/android')
export class OtaController {
  constructor(private readonly otaService: OtaService) {}

  @Get('check')
  async checkForUpdate(
    @Query() query: CheckUpdateQueryDto,
  ): Promise<CheckUpdateResponseDto> {
    return this.otaService.checkForUpdate(
      query.nativeVersion,
      query.otaVersion,
    );
  }

  @Get('download/:version')
  async download(@Param('version') version: string, @Res() res: Response) {
    const { stream, fileName, fileSizeBytes } =
      await this.otaService.getBundleStream(version);

    res.set({
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Content-Length': fileSizeBytes,
    });

    stream.pipe(res);
  }
}
