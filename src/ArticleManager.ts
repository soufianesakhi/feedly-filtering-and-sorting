/// <reference path="./_references.d.ts" />

import { Article } from "./Article";
import { ArticleSorter } from "./ArticleSorter";
import { ColoringRuleSource, FilteringType } from "./DataTypes";
import { DuplicateChecker } from "./DuplicatesManager";
import { FeedlyPage } from "./FeedlyPage";
import { KeywordManager } from "./KeywordManager";
import { SettingsManager } from "./SettingsManager";
import { Subscription } from "./Subscription";
import { hexToRgb, isLight, removeContent, shadeColor } from "./Utils";

export class ArticleManager {
  settingsManager: SettingsManager;
  keywordManager: KeywordManager;
  page: FeedlyPage;
  articlesToMarkAsRead: Article[] = [];
  duplicateChecker: DuplicateChecker;
  darkMode = this.isDarkMode();

  constructor(
    settingsManager: SettingsManager,
    keywordManager: KeywordManager,
    page: FeedlyPage
  ) {
    this.settingsManager = settingsManager;
    this.keywordManager = keywordManager;
    this.page = page;
    this.duplicateChecker = new DuplicateChecker(this);
  }

  refreshArticles() {
    this.resetArticles();
    if ($(ext.articleSelector).length == 0) {
      return;
    }
    $(ext.articleSelector).each((i, e) => {
      this.addArticle(e, true);
    });
    this.checkLastAddedArticle(true);
    this.sortArticles(true);
  }

  resetArticles() {
    this.articlesToMarkAsRead = [];
    this.duplicateChecker.reset();
  }

  refreshColoring() {
    this.darkMode = this.isDarkMode();
    $(ext.articleSelector).each((i, e) => {
      this.applyColoringRules(new Article(e));
    });
  }

  getCurrentSub(): Subscription {
    return this.settingsManager.getCurrentSubscription();
  }

  addArticle(a: Element, skipCheck?: boolean) {
    var article = new Article(a);
    this.filterAndRestrict(article);
    this.advancedControls(article);
    this.applyColoringRules(article);
    if (!skipCheck) {
      article.checked();
      this.checkLastAddedArticle();
      this.sortArticles();
    }
  }

  filterAndRestrict(article: Article) {
    if (this.isDisableAllFilters()) {
      return;
    }
    var sub = this.getCurrentSub();
    if (sub.isFilteringEnabled() || sub.isRestrictingEnabled()) {
      var hide = false;
      if (sub.isRestrictingEnabled()) {
        hide = this.keywordManager.matchKeywords(
          article,
          sub,
          FilteringType.RestrictedOn,
          true
        );
      }
      if (sub.isFilteringEnabled()) {
        let filtered = this.keywordManager.matchKeywords(
          article,
          sub,
          FilteringType.FilteredOut
        );
        hide = hide || filtered;
        if (filtered && sub.isMarkAsReadFiltered()) {
          article.addClass(ext.markAsReadImmediatelyClass);
        }
      }
      if (hide) {
        article.setVisible(false);
      } else {
        article.setVisible();
      }
    } else {
      article.setVisible();
    }
  }

  advancedControls(article: Article) {
    var sub = this.getCurrentSub();
    var advControls = sub.getAdvancedControlsReceivedPeriod();
    if (advControls.keepUnread || advControls.hide) {
      try {
        var threshold = Date.now() - advControls.maxHours * 3600 * 1000;
        var receivedAge = article.getReceivedAge();
        if (receivedAge <= threshold) {
          if (advControls.keepUnread) {
            this.articlesToMarkAsRead.push(article);
          }
        } else {
          if (
            advControls.showIfHot &&
            (article.isHot() ||
              article.getPopularity() >= advControls.minPopularity)
          ) {
            if (advControls.keepUnread && advControls.markAsReadVisible) {
              this.articlesToMarkAsRead.push(article);
            }
          } else if (advControls.hide && !this.isDisableAllFilters()) {
            article.setVisible(false);
          }
        }
      } catch (err) {
        console.log(err);
      }
    }

    this.duplicateChecker.check(article);

    const filteringByReadingTime = sub.getFilteringByReadingTime();
    if (filteringByReadingTime.enabled && !this.isDisableAllFilters()) {
      let thresholdWords =
        filteringByReadingTime.thresholdMinutes *
        filteringByReadingTime.wordsPerMinute;
      let articleWords = article.body.split(" ").length;
      if (
        articleWords != thresholdWords &&
        filteringByReadingTime.filterLong == articleWords > thresholdWords
      ) {
        article.setVisible(false);
      } else if (filteringByReadingTime.keepUnread) {
        this.articlesToMarkAsRead.push(article);
      }
    }
  }

  checkDisableAllFilters() {
    if (this.isDisableAllFilters()) {
      $(ext.articleSelector).css("display", "");
      this.page.clearHidingInfo();
    }
  }

  isDisableAllFilters() {
    return (
      this.page.get(ext.disableAllFiltersButtonId) &&
      this.page.get(ext.disableAllFiltersEnabled, true)
    );
  }

  applyColoringRules(article: Article) {
    let sub = this.getCurrentSub();
    let rules = sub.getColoringRules();
    for (let i = 0; i < rules.length; i++) {
      let rule = rules[i];
      let keywords: string[];
      switch (rule.source) {
        case ColoringRuleSource.SpecificKeywords:
          keywords = rule.specificKeywords;
          break;
        case ColoringRuleSource.RestrictingKeywords:
          keywords = sub.getFilteringList(FilteringType.RestrictedOn);
          break;
        case ColoringRuleSource.FilteringKeywords:
          keywords = sub.getFilteringList(FilteringType.FilteredOut);
          break;
      }
      if (rule.source == ColoringRuleSource.SourceTitle) {
        article.setColor(this.generateColor(article.getSource()));
      } else {
        let match = this.keywordManager.matchSpecficKeywords(
          article,
          keywords,
          rule.matchingMethod,
          rule.matchingArea
        );
        article.setColor(match ? this.correctDarkness("#" + rule.color) : "");
        if (match) {
          return;
        }
      }
    }
  }

  correctDarkness(hexColor: string) {
    const rgb = hexToRgb(hexColor);
    if (isLight(rgb) && this.darkMode) {
      return shadeColor(rgb, -80);
    }
    return hexColor;
  }

  generateColor(id: string): string {
    if (!id || id.length == 0) {
      return "";
    }
    var x = 0;
    for (var i = 0; i < id.length; i++) {
      x += id.charCodeAt(i);
    }
    let h = (x % 360) + 1;
    return "hsl(" + h + ", 100%, " + (this.darkMode ? "20%)" : "80%)");
  }

  isDarkMode(): boolean {
    return $("body").hasClass("theme--dark");
  }

  checkLastAddedArticle(refresh?: boolean) {
    const allArticlesChecked =
      $(ext.articleSelector).filter(ext.uncheckedArticlesSelector).length == 0;
    if (allArticlesChecked) {
      this.prepareMarkAsRead();
      this.page.refreshHidingInfo();
      if (!refresh) {
        this.duplicateChecker.allArticlesChecked();
      }
      this.checkDisableAllFilters();
    }
  }

  sortArticles(force?: boolean) {
    if (!this.page.get(ext.sortArticlesId) && !force) {
      return;
    }
    this.page.put(ext.sortArticlesId, false);
    let sub = this.getCurrentSub();
    let sortingEnabled = sub.isSortingEnabled();
    let pinHotToTop = sub.isPinHotToTop();
    if (sortingEnabled || pinHotToTop) {
      console.log("Sorting articles at " + new Date().toTimeString());
      $(ext.articlesContainerSelector).each((_, c) => {
        let articlesContainer = $(c);
        const articles = articlesContainer
          .find(ext.articleSelector)
          .get()
          .map((e) => new Article(e));
        let { visibleArticles, hiddenArticles } = new ArticleSorter(
          sortingEnabled,
          pinHotToTop,
          sub.getSortingType(),
          sub.getAdditionalSortingTypes()
        ).sort(articles);
        let chunks = articlesContainer.find(ext.articlesChunkSelector);
        removeContent(chunks.find(".Heading"));
        let containerChunk = chunks.first();
        containerChunk.empty();
        let appendArticle = (article: Article) => {
          const container = article.getContainer();
          container.detach().appendTo(containerChunk);
        };
        visibleArticles.forEach(appendArticle);
        hiddenArticles.forEach(appendArticle);
      });
    }
  }

  prepareMarkAsRead() {
    if (this.articlesToMarkAsRead.length > 0) {
      var ids = this.articlesToMarkAsRead.map<string>((article) => {
        return article.getEntryId();
      });
      this.page.put(ext.articlesToMarkAsReadId, ids);
    }
  }

  isOldestFirst(): boolean {
    return !this.page.get(ext.isNewestFirstId, true);
  }
}
