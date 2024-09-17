import { Injectable } from '@nestjs/common';
import { TrickyService } from './tricky.service';

@Injectable()
export class JsonValidatorService {
  constructor(private readonly trickyService: TrickyService) {}
}
