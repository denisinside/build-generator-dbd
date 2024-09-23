import { Injectable } from '@nestjs/common';
import { TrickyService } from './tricky.service';
import { map } from 'rxjs/operators';
import { forkJoin, Observable } from 'rxjs';

@Injectable()
export class JsonHandlerService {
  constructor(private readonly trickyService: TrickyService) {}

  getSurvivors(): Observable<any> {
    return this.trickyService
      .getCharacters('survivor')
      .pipe(map((survivors) => this.processSurvivors(survivors)));
  }
  // getKillers(): Observable<any> {
  //   return this.trickyService
  //     .getCharacters('killer')
  //     .pipe(map((killers) => this.processKillers(killers)));
  // }
  getItems(): Observable<any> {
    return forkJoin({
      items: this.trickyService.getItems('survivor'),
      addons: this.trickyService.getAddons('survivor'),
    }).pipe(
      map(({ items, addons }) => this.processItemsAndAddons(items, addons)),
    );
  }

  private processSurvivors(survivors: any[]): any[] {
    return survivors.map((survivor) => {
      const { id, name, gender, height, bio, story, image } = survivor;

      return {
        id,
        name,
        gender,
        height,
        bio: this.cleanText(bio),
        story: this.cleanText(story),
        image: this.extractFileName(image),
      };
    });
  }

  // private processKillers(killers: any): any {
  //   const result = {};
  //   Object.values(killers).forEach((killer: any) => {
  //     const { id, name, gender, height, bio, story, image, item } = killer;
  //     killers.find
  //     if (item != null) {
  //       return this.trickyService.getItem(item).pipe(
  //         map((power) => {
  //           const { description } = power;
  //           return {
  //             id,
  //             name,
  //             gender,
  //             height,
  //             bio: this.cleanText(bio),
  //             story: this.cleanText(story),
  //             power_description: this.cleanText(description),
  //             image: this.extractFileName(image),
  //           };
  //         }),
  //       );
  //     }
  //
  //     return {
  //       id,
  //       name,
  //       gender,
  //       height,
  //       bio: this.cleanText(bio),
  //       story: this.cleanText(story),
  //       image: this.extractFileName(image),
  //     };
  //   });
  // }

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

  private cleanText(text: string): string {
    if (!text) return '';
    const textWithoutTags = text.replace(/<[^>]*>/g, '');
    return textWithoutTags.replace(/\\u[\dA-F]{4}/gi, '');
  }

  private extractFileName(filePath: string): string {
    return filePath ? filePath.split('/').pop() : '';
  }
}
