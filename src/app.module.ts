import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GalleryModule } from './gallery/gallery.module';
import { BuildModule } from './build/build.module';

@Module({
  imports: [GalleryModule, BuildModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
