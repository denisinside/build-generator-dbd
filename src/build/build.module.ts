import { Module } from '@nestjs/common';
import { BuildService } from './build.service';
import { BuildController } from './build.controller';
import { GeminiService } from './gemini.service';
import { JsonHandlerService } from './json-handler.service';
import { TrickyService } from './tricky.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  providers: [BuildService, GeminiService, JsonHandlerService, TrickyService],
  controllers: [BuildController],
})
export class BuildModule {}
