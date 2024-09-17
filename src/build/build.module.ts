import { Module } from '@nestjs/common';
import { BuildService } from './build.service';
import { BuildController } from './build.controller';
import { GeminiService } from './gemini.service';

@Module({
  providers: [BuildService, GeminiService],
  controllers: [BuildController]
})
export class BuildModule {}
