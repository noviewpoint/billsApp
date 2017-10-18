import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'iskanje'
})
export class IskanjePipe implements PipeTransform {
  /* https://long2know.com/2017/04/angular-pipes-filtering-on-multiple-keys/ */
  transform(items: any, searchText: any, isAnd: Boolean): any {
    if (searchText && Array.isArray(items)) {
      let filterKeys = Object.keys(searchText);
      if (isAnd) {
        return items.filter(item =>
            filterKeys.reduce((memo, keyName) =>
                (memo && new RegExp(searchText[keyName], 'gi').test(item[keyName])) || searchText[keyName] === "", true));
      } else {
        return items.filter(item => {
          return filterKeys.some((keyName) => {
            return new RegExp(searchText[keyName], 'gi').test(item[keyName]) || searchText[keyName] === "";
          });
        });
      }
    } else {
      return items;
    }
  }

}
