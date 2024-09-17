import { Controller, Get, Render, Req } from '@nestjs/common';
import { BuildService } from './build.service';
import { GeminiService } from './gemini.service';

@Controller('build')
export class BuildController {
  constructor(
    private buildService: BuildService,
    private geminiService: GeminiService,
  ) {}

  //Render('pages\\build.hbs')
  @Get('')
  async getBuild(@Req() req: Request) {
    return this.geminiService.requestBuild('heal build', 'Low');
  }
}
