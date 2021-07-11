/// <reference path="./_references.d.ts" />

import { Article } from "./Article";
import { ArticleManager } from "./ArticleManager";
import { AsyncResult } from "./AsyncResult";
import { DataStore, StorageAdapter } from "./dao/Storage";
import { CrossCheckDuplicatesSettings } from "./SettingsManager";
import { getDateWithoutTime, pushIfAbsent } from "./Utils";

export class DuplicateChecker {
  url2Article: { [url: string]: Article } = {};
  title2Article: { [title: string]: Article } = {};
  crossArticles: CrossArticleManager;

  constructor(private articleManager: ArticleManager) {
    this.crossArticles = new CrossArticleManager(articleManager, this);
  }

  reset() {
    this.url2Article = {};
    this.title2Article = {};
  }

  allArticlesChecked() {
    this.crossArticles.save(true);
  }

  check(article: Article) {
    var sub = this.articleManager.getCurrentSub();
    if (sub.checkDuplicates()) {
      let url = article.getUrl();
      let title = article.getTitle();
      let duplicate = true;
      if (!url || !title) {
        duplicate = false;
      }
      if (!this.checkDuplicate(article, this.url2Article[url])) {
        this.url2Article[url] = article;
        if (!this.checkDuplicate(article, this.title2Article[title])) {
          this.title2Article[title] = article;
          duplicate = false;
        }
      }
      this.crossArticles.addArticle(article, duplicate);
    }
  }

  checkDuplicate(a: Article, b: Article): boolean {
    if (!b || a.getEntryId() === b.getEntryId()) {
      return false;
    }
    let toKeep = a.getPublishAge() > b.getPublishAge() ? a : b;
    let duplicate = a.getPublishAge() > b.getPublishAge() ? b : a;
    this.title2Article[a.getTitle()] = toKeep;
    this.title2Article[b.getTitle()] = toKeep;
    this.url2Article[a.getUrl()] = toKeep;
    this.url2Article[b.getUrl()] = toKeep;
    this.setDuplicate(duplicate, toKeep);
    return true;
  }

  setDuplicate(duplicate: Article, newerDuplicate = duplicate) {
    var sub = this.articleManager.getCurrentSub();
    if (sub.isHideDuplicates()) {
      duplicate.setVisible(false);
      this.articleManager.page.refreshHidingInfo();
    }
    if (sub.isMarkAsReadDuplicates()) {
      this.articleManager.articlesToMarkAsRead.push(duplicate);
    }
    if (sub.isHighlightDuplicates()) {
      newerDuplicate.setColor("#" + sub.getHighlightDuplicatesColor());
    }
  }
}

class CrossArticleManager {
  URLS_KEY_PREFIX = "cross_article_urls_";
  TITLES_KEY_PREFIX = "cross_article_titles_";
  IDS_KEY_PREFIX = "cross_article_ids_";
  DAYS_ARRAY_KEY = "cross_article_days";
  private crossUrls: { [day: number]: string[] } = {};
  private crossTitles: { [day: number]: string[] } = {};
  private crossIds: { [day: number]: string[] } = {};
  private daysArray: number[] = [];
  private changedDays: number[] = [];
  private localStorage: StorageAdapter;
  private crossCheckSettings: CrossCheckDuplicatesSettings;
  private initializing = false;
  private ready = false;

  constructor(
    articleManager: ArticleManager,
    private duplicateChecker: DuplicateChecker
  ) {
    this.crossCheckSettings =
      articleManager.settingsManager.getCrossCheckDuplicatesSettings();
    this.crossCheckSettings.setChangeCallback(() => this.refresh());
  }

  addArticle(a: Article, duplicate?: boolean) {
    if (!this.crossCheckSettings.isEnabled() || !this.isReady()) {
      return;
    }
    if (!duplicate) {
      duplicate = this.checkDuplicate(a);
    }
    const articleDay = getDateWithoutTime(a.getReceivedDate()).getTime();
    if (articleDay < this.getThresholdDay()) {
      return;
    }
    this.initDay(articleDay);
    try {
      let changed = pushIfAbsent(this.crossUrls[articleDay], a.getUrl());
      changed =
        pushIfAbsent(this.crossTitles[articleDay], a.getTitle()) || changed;
      if (!duplicate) {
        changed =
          pushIfAbsent(this.crossIds[articleDay], a.getEntryId()) || changed;
      }
      if (changed) {
        pushIfAbsent(this.changedDays, articleDay);
      }
    } catch (e) {
      console.error(e.message + ": " + articleDay + ". Days and urls:");
      console.log(this.daysArray.map(this.formatDay));
      console.log(this.crossUrls);
    }
  }

  save(saveAll?: boolean) {
    if (saveAll) {
      this.changedDays = this.daysArray;
    }
    if (
      !this.crossCheckSettings.isEnabled() ||
      !this.isReady() ||
      this.changedDays.length == 0
    ) {
      return;
    }
    this.saveDaysArray();
    this.changedDays.forEach(this.saveDay, this);
    this.changedDays = [];
  }

  checkDuplicate(a: Article) {
    const id = a.getEntryId();
    const checkedNotDuplicate = this.daysArray.some(
      (day) => this.crossIds[day].indexOf(id) > -1
    );
    if (!checkedNotDuplicate) {
      let found = this.daysArray.some((day) => {
        return (
          this.crossUrls[day].indexOf(a.getUrl()) > -1 ||
          this.crossTitles[day].indexOf(a.getTitle()) > -1
        );
      }, this);
      if (found) {
        this.duplicateChecker.setDuplicate(a);
        return true;
      }
    }
    return false;
  }

  private isReady() {
    return this.ready;
  }

  private init() {
    return new AsyncResult<any>((p) => {
      this.localStorage = DataStore.getLocalStorage();
      this.localStorage
        .getAsync<number[]>(this.DAYS_ARRAY_KEY, [])
        .then((result) => {
          console.log(
            "[Duplicates cross checking] Loading the stored days ..."
          );
          this.setAndCleanDays(result);
          if (this.daysArray.length == 0) {
            console.log("[Duplicates cross checking] No day was stored");
            p.done();
          } else {
            this.loadDays(this.daysArray.slice(0)).chain(p);
          }
        }, this);
    }, this);
  }

  private refresh() {
    if (this.crossCheckSettings.isEnabled()) {
      if (!this.isReady()) {
        if (this.initializing) {
          return;
        }
        this.initializing = true;
        this.init().then(() => {
          this.ready = true;
          this.addArticles();
          this.save();
          this.initializing = false;
        }, this);
      } else {
        this.setAndCleanDays(this.daysArray);
        this.addArticles();
        this.save();
      }
    }
  }

  private addArticles() {
    $(ext.articleSelector).each((i, e) => {
      this.addArticle(new Article(e));
    });
  }

  private getUrlsKey(day: number) {
    return this.URLS_KEY_PREFIX + day;
  }

  private getTitlesKey(day: number) {
    return this.TITLES_KEY_PREFIX + day;
  }

  private getIdsKey(day: number) {
    return this.IDS_KEY_PREFIX + day;
  }

  private getThresholdDay() {
    const maxDays = this.crossCheckSettings.getDays();
    let thresholdDate = getDateWithoutTime(new Date());
    thresholdDate.setDate(thresholdDate.getDate() - maxDays);
    let thresholdDay = thresholdDate.getTime();
    return thresholdDay;
  }

  private setAndCleanDays(crossArticleDays: number[]) {
    this.daysArray = crossArticleDays.slice(0).filter((val) => {
      return !isNaN(val);
    });
    let thresholdDay = this.getThresholdDay();
    crossArticleDays
      .filter((day) => day < thresholdDay)
      .forEach(this.cleanDay, this);
  }

  private initDay(day: number) {
    if (this.daysArray.indexOf(day) < 0) {
      this.daysArray.push(day);
      this.crossUrls[day] = [];
      this.crossTitles[day] = [];
      this.crossIds[day] = [];
    }
  }

  loadDays(days: number[]): AsyncResult<any> {
    if (days.length == 1) {
      return this.loadDay(days[0]);
    } else {
      return new AsyncResult<any>((p) => {
        this.loadDay(days.pop()).then(() => {
          this.loadDays(days).chain(p);
        }, this);
      }, this);
    }
  }

  private loadDay(day: number) {
    return new AsyncResult<any>((p) => {
      this.localStorage
        .getAsync<string[]>(this.getIdsKey(day), [])
        .then((result) => {
          this.crossIds[day] = result;
          this.localStorage
            .getAsync<string[]>(this.getUrlsKey(day), [])
            .then((result) => {
              this.crossUrls[day] = result;
              this.localStorage
                .getAsync<string[]>(this.getTitlesKey(day), [])
                .then((result) => {
                  this.crossTitles[day] = result;
                  console.log(
                    "[Duplicates cross checking] Loaded successfully the day: " +
                      this.formatDay(day) +
                      ", title count: " +
                      this.crossTitles[day].length
                  );
                  p.done();
                }, this);
            }, this);
        }, this);
    }, this);
  }

  private cleanDay(day: number) {
    console.log(
      "[Duplicates cross checking] Cleaning the stored day: " +
        this.formatDay(day)
    );
    this.daysArray.splice(this.daysArray.indexOf(day), 1);
    this.saveDaysArray();
    delete this.crossUrls[day];
    delete this.crossTitles[day];
    delete this.crossIds[day];
    this.localStorage.delete(this.getUrlsKey(day));
    this.localStorage.delete(this.getTitlesKey(day));
  }

  private saveDay(day: number) {
    console.log(
      "[Duplicates cross checking] Saving the day: " +
        this.formatDay(day) +
        ", title count: " +
        this.crossTitles[day].length
    );
    this.localStorage.put(this.getUrlsKey(day), this.crossUrls[day]);
    this.localStorage.put(this.getTitlesKey(day), this.crossTitles[day]);
    this.localStorage.put(this.getIdsKey(day), this.crossIds[day]);
  }

  private saveDaysArray() {
    this.localStorage.put(this.DAYS_ARRAY_KEY, this.daysArray);
  }

  private formatDay(day: number) {
    return new Date(day).toLocaleDateString();
  }
}
