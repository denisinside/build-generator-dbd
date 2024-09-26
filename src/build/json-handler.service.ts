import { Injectable } from '@nestjs/common';
import { TrickyService } from './tricky.service';
import { map } from 'rxjs/operators';
import { forkJoin, of } from 'rxjs';
import * as fs from 'fs';
import * as process from 'node:process';

@Injectable()
export class JsonHandlerService {
  private readonly fileNames = [
    'survivors.json',
    'killers.json',
    'items_and_addons.json',
    'survivor_perks.json',
    'icon_names.txt',
  ];

  constructor(private readonly trickyService: TrickyService) {}

  async checkFiles(): Promise<void> {
    let reUpload = false;
    for (let i = 0; i < this.fileNames.length; i++) {
      const filePath = `${process.cwd()}\\game-data\\${this.fileNames[i]}`;
      fs.stat(filePath, async (err, stats) => {
        if (!reUpload && (err != null || !this.isFileRecent(stats.mtime))) {
          reUpload = true;
          await this.getSurvivors();
          await this.getKillers();
          await this.getItems();
          await this.getSurvivorPerks();
          this.writeToFile(
            'icon_names.txt',
            process.env.ICON_NAMES.split('\n'),
          );
        }
      });
    }
  }

  private isFileRecent(mtime: Date): boolean {
    const now = new Date();
    const yesterday = new Date(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() - 1,
      16,
      30,
    );

    if (
      now.getUTCHours() < 16 ||
      (now.getUTCHours() === 16 && now.getUTCMinutes() < 30)
    ) {
      yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    }

    return mtime.getTime() > yesterday.getTime();
  }

  private async getSurvivors(): Promise<void> {
    this.trickyService
      .getCharacters('survivor')
      .pipe(
        map((survivors) => this.processSurvivors(survivors)),
        map((result) => this.writeToFile('survivors.json', result)),
      )
      .subscribe();
  }

  private async getKillers(): Promise<void> {
    forkJoin({
      killers: this.trickyService.getCharacters('killer'),
      powers: this.trickyService.getItems(null, 'power'),
    })
      .pipe(
        map(({ killers, powers }) => this.processKillers(killers, powers)),
        map((result) => this.writeToFile('killers.json', result)),
      )
      .subscribe();
  }

  private async getItems(): Promise<void> {
    forkJoin({
      items: this.trickyService.getItems('survivor'),
      addons: this.trickyService.getAddons('survivor'),
    })
      .pipe(
        map(({ items, addons }) => this.processItemsAndAddons(items, addons)),
        map((result) => this.writeToFile('items_and_addons.json', result)),
      )
      .subscribe();
  }

  private async getSurvivorPerks(): Promise<void> {
    this.trickyService
      .getPerks('survivor')
      .pipe(
        map((perks) => this.processPerks(perks)),
        map((result) => this.writeToFile('survivor_perks.json', result)),
      )
      .subscribe();
  }

  private async getKillerPerks(): Promise<void> {
    this.trickyService
      .getPerks('killer')
      .pipe(
        map((perks) => this.processPerks(perks)),
        map((result) => this.writeToFile('killer_perks.json', result)),
      )
      .subscribe();
  }

  private processSurvivors(survivors: any[]): any[] {
    return survivors.map((survivor) => {
      const { id, name, gender, height, story, image } = survivor;

      return {
        id,
        name,
        gender,
        height,
        story: this.cleanText(story),
        image: this.extractFileName(image),
      };
    });
  }

  private processKillers(killers: any, powers: any): any {
    return Object.values(killers).map((killer: any) => {
      const { id, name, gender, height, image, item } = killer;
      if (item != null) {
        const { description } = Object.getOwnPropertyDescriptor(
          powers,
          item,
        ).value;
        return {
          id,
          name,
          gender,
          height,
          power_description: this.cleanText(description),
          image: this.extractFileName(image),
        };
      }

      return of({
        id,
        name,
        gender,
        height,
        power_description: null,
        image: this.extractFileName(image),
      });
    });
  }

  private processItemsAndAddons(items: any, addons: any): any {
    const processedItems = this.processItems(items);
    const processedAddons = this.processAddons(addons);

    const result = {};

    Object.keys(processedItems).forEach((itemType) => {
      result[itemType] = {
        items: processedItems[itemType],
        addons: processedAddons[itemType] || [],
      };
    });

    return result;
  }

  private processItems(items: any): any {
    const result = {};

    Object.values(items).forEach((item: any) => {
      const { item_type, name, description, modifiers, rarity, image } = item;

      if (!item_type || rarity === 'specialevent') {
        return;
      }

      const processedItem = {
        item_type,
        name,
        description: this.cleanText(description),
        modifiers,
        rarity,
        image: this.extractFileName(image),
      };

      if (!result[item_type]) {
        result[item_type] = [];
      }
      result[item_type].push(processedItem);
    });

    return result;
  }

  private processAddons(addons: any): any {
    const result = {};

    Object.values(addons).forEach((addon: any) => {
      const { item_type, name, description, modifiers, rarity, image } = addon;

      if (!item_type || rarity === 'specialevent') {
        return;
      }

      const processedAddon = {
        item_type,
        name,
        description: this.cleanText(description),
        modifiers,
        rarity,
        image: this.extractFileName(image),
      };

      if (!result[item_type]) {
        result[item_type] = [];
      }
      result[item_type].push(processedAddon);
    });

    return result;
  }

  private processPerks(perks: any): any {
    return Object.values(perks).map((perk: any) => {
      const { categories, name, description, tunables, image } = perk;
      return {
        name,
        description: this.pasteTunablesToDescription(
          this.cleanText(description),
          Object.values(tunables),
        ),
        categories,
        image: this.extractFileName(image),
      };
    });
  }

  private writeToFile(filename: string, data: any): void {
    const filePath = `${process.cwd()}\\game-data\\${filename}`;

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`Data successfully written to ${filePath}`);
  }

  private cleanText(text: string): string {
    if (!text) return '';
    const textWithoutTags = text.replace(/<[^>]*>/g, '');
    return textWithoutTags.replace(/\\u[\dA-F]{4}/gi, '');
  }

  private extractFileName(filePath: string): string {
    return filePath ? filePath.split('/').pop() : '';
  }

  private pasteTunablesToDescription(
    description: string,
    tunables: string[][],
  ): string {
    tunables.forEach((tunable, index = 0) => {
      description = description.replace(
        `{${index}}`,
        tunable[tunable.length - 1],
      );
      index++;
    });
    return description;
  }
}
