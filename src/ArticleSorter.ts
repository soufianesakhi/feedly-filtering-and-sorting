import { Article } from "./Article";
import { SortingType } from "./DataTypes";

export interface ArticleSorterConfig {
  sortingEnabled: boolean;
  filteringEnabled: boolean;
  pinHotToTop: boolean;
  sortingType: SortingType;
  additionalSortingTypes: SortingType[];
}

export interface SortedArticles {
  visibleArticles: Article[];
  hiddenArticles: Article[];
}

declare var articleSorterFactory: ArticleSorterFactory;

export class ArticleSorter {
  sortingTypes: SortingType[];
  constructor(
    private sortingEnabled: boolean,
    private pinHotToTop: boolean,
    private sortingType: SortingType,
    additionalSortingTypes: SortingType[],
    private sortGaps = false
  ) {
    this.sortingTypes = [sortingType].concat(additionalSortingTypes);
  }

  static from(config: ArticleSorterConfig) {
    return new ArticleSorter(
      config.sortingEnabled,
      config.pinHotToTop,
      config.sortingType,
      config.additionalSortingTypes
    );
  }

  articleVisible = this.sortGaps
    ? (a: Article) => a.isVisible() || a.isGap()
    : (a: Article) => a.isVisible();

  prepare(articles: Article[]): SortedArticles {
    let visibleArticles: Article[] = [];
    let hiddenArticles: Article[] = [];
    articles.forEach((a) => {
      if (this.articleVisible(a)) {
        visibleArticles.push(a);
      } else {
        hiddenArticles.push(a);
      }
    });
    return { visibleArticles, hiddenArticles };
  }

  sort(articles: Article[]): SortedArticles {
    let { visibleArticles, hiddenArticles } = this.prepare(articles);
    if (this.pinHotToTop) {
      var hotArticles: Article[] = [];
      var normalArticles: Article[] = [];
      visibleArticles.forEach((article) => {
        if (article.isHot()) {
          hotArticles.push(article);
        } else {
          normalArticles.push(article);
        }
      });
      if (this.sortingEnabled) {
        this.sortArray(hotArticles);
        this.sortArray(normalArticles);
      }
      visibleArticles = hotArticles.concat(normalArticles);
    } else if (this.sortingEnabled) {
      this.sortArray(visibleArticles);
    }
    return { visibleArticles, hiddenArticles };
  }

  sortArray(articles: Article[]) {
    articles.sort(articleSorterFactory.getSorter(this.sortingTypes));

    if (SortingType.SourceNewestReceiveDate == this.sortingType) {
      let sourceToArticles: { [key: string]: Article[] } = {};
      articles.forEach((a) => {
        let sourceArticles =
          (sourceToArticles[a.getSource()] ||
            (sourceToArticles[a.getSource()] = []),
          sourceToArticles[a.getSource()]);
        sourceArticles.push(a);
      });
      articles.length = 0;
      for (let source in sourceToArticles) {
        articles.push(...sourceToArticles[source]);
      }
    }
  }
}

export class ArticleSorterFactory {
  sorterByType: { [key: number]: (a: Article, b: Article) => number } = {};

  constructor() {
    function titleSorter(isAscending: boolean) {
      var multiplier = isAscending ? 1 : -1;
      return (a: Article, b: Article) => {
        return a.getTitle().localeCompare(b.getTitle()) * multiplier;
      };
    }
    function popularitySorter(isAscending: boolean) {
      var multiplier = isAscending ? 1 : -1;
      return (a: Article, b: Article) => {
        return (a.getPopularity() - b.getPopularity()) * multiplier;
      };
    }
    function receivedDateSorter(isNewFirst: boolean) {
      var multiplier = isNewFirst ? -1 : 1;
      return (a: Article, b: Article) => {
        return (a.getReceivedAge() - b.getReceivedAge()) * multiplier;
      };
    }
    function publishDateSorter(isNewFirst: boolean) {
      var multiplier = isNewFirst ? -1 : 1;
      return (a: Article, b: Article) => {
        return (a.getPublishAge() - b.getPublishAge()) * multiplier;
      };
    }
    function publishDaySorter(isNewFirst: boolean) {
      var multiplier = isNewFirst ? -1 : 1;
      return (a: Article, b: Article) => {
        let dateA = a.getPublishDate(),
          dateB = b.getPublishDate();
        let result = dateA.getFullYear() - dateB.getFullYear();
        if (result == 0) {
          result = dateA.getMonth() - dateB.getMonth();
          if (result == 0) {
            result = dateA.getDay() - dateB.getDay();
          }
        }
        return result * multiplier;
      };
    }
    function sourceSorter(isAscending: boolean) {
      var multiplier = isAscending ? 1 : -1;
      return (a: Article, b: Article) => {
        return a.getSource().localeCompare(b.getSource()) * multiplier;
      };
    }

    this.sorterByType[SortingType.TitleDesc] = titleSorter(false);
    this.sorterByType[SortingType.TitleAsc] = titleSorter(true);
    this.sorterByType[SortingType.PopularityDesc] = popularitySorter(false);
    this.sorterByType[SortingType.PopularityAsc] = popularitySorter(true);
    this.sorterByType[SortingType.ReceivedDateNewFirst] =
      receivedDateSorter(true);
    this.sorterByType[SortingType.ReceivedDateOldFirst] =
      receivedDateSorter(false);
    this.sorterByType[SortingType.PublishDateNewFirst] =
      publishDateSorter(true);
    this.sorterByType[SortingType.PublishDateOldFirst] =
      publishDateSorter(false);
    this.sorterByType[SortingType.PublishDayNewFirst] = publishDaySorter(true);
    this.sorterByType[SortingType.PublishDayOldFirst] = publishDaySorter(false);
    this.sorterByType[SortingType.SourceAsc] = sourceSorter(true);
    this.sorterByType[SortingType.SourceDesc] = sourceSorter(false);
    this.sorterByType[SortingType.SourceNewestReceiveDate] =
      receivedDateSorter(true);
    this.sorterByType[SortingType.Random] = () => {
      return Math.random() - 0.5;
    };
  }

  getSorter(sortingTypes: SortingType[]): (a: Article, b: Article) => number {
    if (sortingTypes.length == 1) {
      return this.sorterByType[sortingTypes[0]];
    }
    return (a: Article, b: Article) => {
      var res;
      for (var i = 0; i < sortingTypes.length; i++) {
        res = this.sorterByType[sortingTypes[i]](a, b);
        if (res != 0) {
          return res;
        }
      }
      return res;
    };
  }
}

articleSorterFactory = new ArticleSorterFactory();
