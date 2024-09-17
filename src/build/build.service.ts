import { Injectable, Req } from '@nestjs/common';

@Injectable()
export class BuildService {
  async renderHome(@Req() req: Request) {
    return {
      style: 'views/pages/build.hbs',
      script: 'views/pages/build.hbs',
      title: 'Головна сторінка',
    };
  }
}
