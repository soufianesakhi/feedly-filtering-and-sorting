/// <reference path="./_references.d.ts" />

import { AsyncResult } from "./AsyncResult";
import { ColoringRuleSource, FilteringType, SortingType } from "./DataTypes";
import { FeedlyPage } from "./FeedlyPage";
import { KeywordManager } from "./KeywordManager";
import { CrossCheckDuplicatesSettings, SettingsManager } from "./SettingsManager";
import { Subscription } from "./Subscription";
import { getDateWithoutTime, pushIfAbsent } from "./Utils";
import { DataStore, StorageAdapter } from "./dao/Storage";

export class ArticleManager {
    settingsManager: SettingsManager;
    articleSorterFactory: ArticleSorterFactory;
    keywordManager: KeywordManager;
    page: FeedlyPage;
    articlesToMarkAsRead: Article[];
    duplicateChecker: DuplicateChecker;

    constructor(settingsManager: SettingsManager, keywordManager: KeywordManager, page: FeedlyPage) {
        this.settingsManager = settingsManager;
        this.keywordManager = keywordManager;
        this.articleSorterFactory = new ArticleSorterFactory();
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
        $(ext.articleSelector).each((i, e) => {
            this.applyColoringRules(new Article(e));
        });
    }

    getCurrentSub(): Subscription {
        return this.settingsManager.getCurrentSubscription();
    }

    getCurrentUnreadCount() {
        return $(ext.articleSelector).length;
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
        var sub = this.getCurrentSub();
        if (sub.isFilteringEnabled() || sub.isRestrictingEnabled()) {
            var hide = false;
            if (sub.isRestrictingEnabled()) {
                hide = this.keywordManager.matchKeywords(article, sub, FilteringType.RestrictedOn, true);
            }
            if (sub.isFilteringEnabled()) {
                let filtered = this.keywordManager.matchKeywords(article, sub, FilteringType.FilteredOut);
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
                    if (advControls.showIfHot && (article.isHot() ||
                        article.getPopularity() >= advControls.minPopularity)) {
                        if (advControls.keepUnread && advControls.markAsReadVisible) {
                            this.articlesToMarkAsRead.push(article);
                        }
                    } else if (advControls.hide) {
                        article.setVisible(false);
                    }
                }
            } catch (err) {
                console.log(err);
            }
        }

        this.duplicateChecker.check(article);

        const filteringByReadingTime = sub.getFilteringByReadingTime();
        if (filteringByReadingTime.enabled) {
            let thresholdWords = filteringByReadingTime.thresholdMinutes * filteringByReadingTime.wordsPerMinute;
            let articleWords = article.body.split(" ").length;
            if (articleWords != thresholdWords &&
                filteringByReadingTime.filterLong == articleWords > thresholdWords) {
                article.setVisible(false);
            } else if (filteringByReadingTime.keepUnread) {
                this.articlesToMarkAsRead.push(article);
            }
        }
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
                let match = this.keywordManager.matchSpecficKeywords(article, keywords, rule.matchingMethod);
                let color =
                    article.setColor(match ? "#" + rule.color : "");
                if (match) {
                    return;
                }
            }
        }
    }

    generateColor(id: string): string {
        if (!id || id.length == 0) {
            return "";
        }
        var x = 0;
        for (var i = 0; i < id.length; i++) {
            x += id.charCodeAt(i);
        }
        let h = (x % 36 + 1) * 1;
        let s = 30 + (x % 5 + 1) * 10;
        return "hsl(" + h + ", " + s + "%, 80%)";
    }

    checkLastAddedArticle(refresh?: boolean) {
        const allArticlesChecked = $(ext.uncheckedArticlesSelector).length == 0;
        if (allArticlesChecked) {
            this.prepareMarkAsRead();
            this.page.showHidingInfo();
            if (!refresh) {
                this.duplicateChecker.allArticlesChecked();
            }
        }
    }

    sortArticles(force?: boolean) {
        if (!this.page.get(ext.sortArticlesId) && !force) {
            return;
        }
        this.page.put(ext.sortArticlesId, false);
        let sub = this.getCurrentSub();
        let endOfFeed: JQuery;
        let sortedVisibleEntryIds: string[] = [];
        $(ext.articlesContainerSelector).each((i, c) => {
            let visibleArticles: Article[] = [];
            let hiddenArticles: Article[] = [];
            let articlesContainer = $(c);
            articlesContainer.find(ext.containerArticleSelector).each((i, e) => {
                let a = new Article(e);
                if (a.isVisible()) {
                    visibleArticles.push(a);
                } else {
                    hiddenArticles.push(a);
                }
            });
            if (sub.isPinHotToTop()) {
                var hotArticles: Article[] = [];
                var normalArticles: Article[] = [];
                visibleArticles.forEach((article) => {
                    if (article.isHot()) {
                        hotArticles.push(article);
                    } else {
                        normalArticles.push(article);
                    }
                });
                this.sortArticleArray(hotArticles);
                this.sortArticleArray(normalArticles);
                visibleArticles = hotArticles.concat(normalArticles);
            } else {
                this.sortArticleArray(visibleArticles);
            }

            if (sub.isSortingEnabled() || sub.isPinHotToTop()) {
                console.log("Sorting articles at " + new Date().toTimeString());
                endOfFeed || (endOfFeed = $(ext.endOfFeedSelector).detach());
                if (articlesContainer.find("h4").length > 0 && !articlesContainer.prev().is("h4")) {
                    articlesContainer.before("<h4>Latest</h4>");
                }
                let loadingMessage = articlesContainer.find(".message.loading").detach();
                articlesContainer.empty();
                articlesContainer.append(loadingMessage);
                visibleArticles.forEach((article) => {
                    articlesContainer.append(article.getContainer());
                });
                hiddenArticles.forEach((article) => {
                    articlesContainer.append(article.getContainer());
                });
            }
            sortedVisibleEntryIds.push(...visibleArticles.map(a => a.getEntryId()));
        });

        let lastContainer = $(ext.articlesContainerSelector).last();
        if (endOfFeed) {
            lastContainer.append(endOfFeed);
        } else {
            $(ext.endOfFeedSelector).detach().appendTo(lastContainer);
        }
        this.page.put(ext.sortedVisibleArticlesId, sortedVisibleEntryIds);
    }

    prepareMarkAsRead() {
        if (this.articlesToMarkAsRead.length > 0) {
            var ids = this.articlesToMarkAsRead.map<string>((article) => {
                return article.getEntryId();
            })
            this.page.put(ext.articlesToMarkAsReadId, ids);
        }
    }

    sortArticleArray(articles: Article[]) {
        var sub = this.getCurrentSub();
        if (!sub.isSortingEnabled()) {
            return;
        }
        let st = sub.getSortingType();
        var sortingTypes = [st].concat(sub.getAdditionalSortingTypes());
        articles.sort(this.articleSorterFactory.getSorter(sortingTypes));

        if (SortingType.SourceNewestReceiveDate == st) {
            let sourceToArticles: { [key: string]: Article[] } = {};
            articles.forEach(a => {
                let sourceArticles = (sourceToArticles[a.getSource()] || (sourceToArticles[a.getSource()] = []), sourceToArticles[a.getSource()]);
                sourceArticles.push(a);
            });
            articles.length = 0;
            for (let source in sourceToArticles) {
                articles.push(...sourceToArticles[source]);
            }
        }
    }

    isOldestFirst(): boolean {
        return !this.page.get(ext.isNewestFirstId, true);
    }

}

class CrossArticleManager {
    URLS_KEY_PREFIX = "cross_article_urls_";
    TITLES_KEY_PREFIX = "cross_article_titles_";
    DAYS_ARRAY_KEY = "cross_article_days";
    private crossUrls: { [day: number]: string[] } = {};
    private crossTitles: { [day: number]: string[] } = {};
    private currentSessionNotDuplicateIds: { [id: string]: boolean } = {};
    private daysArray: number[] = [];
    private changedDays: number[] = [];
    private localStorage: StorageAdapter;
    private crossCheckSettings: CrossCheckDuplicatesSettings;
    private articlesToAdd: Article[] = [];
    private initializing = false;
    private ready = false;

    constructor(articleManager: ArticleManager, private duplicateChecker: DuplicateChecker) {
        this.crossCheckSettings = articleManager.settingsManager.getCrossCheckDuplicatesSettings();
        this.crossCheckSettings.setChangeCallback(() => this.refresh());
    }

    addArticle(a: Article, duplicate?: boolean) {
        if (!this.crossCheckSettings.isEnabled() || !this.isReady()) {
            if (!this.isReady()) {
                this.articlesToAdd.push(a);
            }
            return;
        }
        if (!duplicate) {
            this.checkDuplicate(a);
        }
        const articleDay = getDateWithoutTime(a.getReceivedDate()).getTime();
        if (articleDay < this.getThresholdDay()) {
            return;
        }
        this.initDay(articleDay);
        try {
            let changed = pushIfAbsent(this.crossUrls[articleDay], a.getUrl());
            changed = pushIfAbsent(this.crossTitles[articleDay], a.getTitle()) || changed;
            if (changed) {
                pushIfAbsent(this.changedDays, articleDay);
            }
        } catch (e) {
            console.error(e.message + ": " + articleDay + ". Days and urls:");
            console.log(this.daysArray.map(this.formatDay));
            console.log(this.crossUrls);
        }
    }

    save() {
        if (!this.crossCheckSettings.isEnabled() || !this.isReady() || this.changedDays.length == 0) {
            return;
        }
        this.saveDaysArray();
        this.changedDays.forEach(this.saveDay, this);
        this.changedDays = [];
    }

    checkDuplicate(a: Article) {
        const id = a.getEntryId();
        if (!this.currentSessionNotDuplicateIds[id]) {
            let found = this.daysArray.some(day => {
                return this.crossUrls[day].indexOf(a.getUrl()) > -1 ||
                    this.crossTitles[day].indexOf(a.getTitle()) > -1;
            }, this);
            if (found) {
                this.duplicateChecker.setDuplicate(a);
            } else {
                this.currentSessionNotDuplicateIds[id] = true;
            }
        }
    }

    private isReady() {
        return this.ready;
    }

    private init() {
        return new AsyncResult<any>((p) => {
            this.localStorage = DataStore.getLocalStorage();
            this.localStorage.getAsync<number[]>(this.DAYS_ARRAY_KEY, []).then(result => {
                console.log("[Duplicates cross checking] Loading the stored days ...");
                this.setAndCleanDays(result);
                this.loadDays(this.daysArray.slice(0)).chain(p);
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
                    this.articlesToAdd.forEach(a => this.addArticle(a));
                    this.articlesToAdd = [];
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

    private getThresholdDay() {
        const maxDays = this.crossCheckSettings.getDays();
        let thresholdDate = getDateWithoutTime(new Date());
        thresholdDate.setDate(thresholdDate.getDate() - maxDays);
        let thresholdDay = thresholdDate.getTime();
        return thresholdDay;
    }

    private setAndCleanDays(crossArticleDays: number[]) {
        this.daysArray = crossArticleDays.slice(0);
        let thresholdDay = this.getThresholdDay();
        crossArticleDays.filter(day => day < thresholdDay).forEach(this.cleanDay, this);
    }

    private initDay(day: number) {
        if (this.daysArray.indexOf(day) < 0) {
            this.daysArray.push(day);
            this.crossUrls[day] = [];
            this.crossTitles[day] = [];
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
            this.localStorage.getAsync<string[]>(this.getUrlsKey(day), []).then(result => {
                this.crossUrls[day] = result;
                this.localStorage.getAsync<string[]>(this.getTitlesKey(day), []).then(result => {
                    this.crossTitles[day] = result;
                    console.log("[Duplicates cross checking] Loaded successfully the day: " + this.formatDay(day) + ", title count: " + this.crossTitles[day].length);
                    p.done();
                }, this);
            }, this);
        }, this);
    }

    private cleanDay(day: number) {
        console.log("[Duplicates cross checking] Cleaning the stored day: " + this.formatDay(day));
        this.daysArray.splice(this.daysArray.indexOf(day), 1);
        this.saveDaysArray();
        delete this.crossUrls[day];
        delete this.crossTitles[day];
        this.localStorage.delete(this.getUrlsKey(day));
        this.localStorage.delete(this.getTitlesKey(day));
    }

    private saveDay(day: number) {
        console.log("[Duplicates cross checking] Saving the day: " + this.formatDay(day) + ", title count: " + this.crossTitles[day].length);
        this.localStorage.put(this.getUrlsKey(day), this.crossUrls[day]);
        this.localStorage.put(this.getTitlesKey(day), this.crossTitles[day]);
    }

    private saveDaysArray() {
        this.localStorage.put(this.DAYS_ARRAY_KEY, this.daysArray);
    }

    private formatDay(day: number) {
        return new Date(day).toLocaleDateString();
    }
}

class DuplicateChecker {
    url2Article: { [url: string]: Article };
    title2Article: { [title: string]: Article };
    crossArticles: CrossArticleManager;

    constructor(private articleManager: ArticleManager) {
        this.crossArticles = new CrossArticleManager(articleManager, this);
    }

    reset() {
        this.url2Article = {};
        this.title2Article = {};
    }

    allArticlesChecked() {
        this.crossArticles.save();
    }

    check(article: Article) {
        var sub = this.articleManager.getCurrentSub();
        if (sub.isHideDuplicates() || sub.isMarkAsReadDuplicates()) {
            let url = article.getUrl();
            let title = article.getTitle();
            let duplicate = true;
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
        let toKeep = (a.getPublishAge() > b.getPublishAge()) ? a : b;
        let duplicate = (a.getPublishAge() > b.getPublishAge()) ? b : a;
        this.title2Article[a.getTitle()] = toKeep;
        this.title2Article[b.getTitle()] = toKeep;
        this.url2Article[a.getUrl()] = toKeep;
        this.url2Article[b.getUrl()] = toKeep;
        this.setDuplicate(a);
        return true;
    }

    setDuplicate(duplicate: Article) {
        var sub = this.articleManager.getCurrentSub();
        if (sub.isHideDuplicates()) {
            duplicate.setVisible(false);
        }
        if (sub.isMarkAsReadDuplicates()) {
            this.articleManager.articlesToMarkAsRead.push(duplicate);
        }
    }
}

class ArticleSorterFactory {
    sorterByType: { [key: number]: (a: Article, b: Article) => number } = {};

    constructor() {
        function titleSorter(isAscending: boolean) {
            var multiplier = isAscending ? 1 : -1;
            return (a: Article, b: Article) => {
                return a.getTitle().localeCompare(b.getTitle()) * multiplier;
            }
        }
        function popularitySorter(isAscending: boolean) {
            var multiplier = isAscending ? 1 : -1;
            return (a: Article, b: Article) => {
                return (a.getPopularity() - b.getPopularity()) * multiplier;
            }
        }
        function receivedDateSorter(isNewFirst: boolean) {
            var multiplier = isNewFirst ? -1 : 1;
            return (a: Article, b: Article) => {
                return (a.getReceivedAge() - b.getReceivedAge()) * multiplier;
            }
        }
        function publishDateSorter(isNewFirst: boolean) {
            var multiplier = isNewFirst ? -1 : 1;
            return (a: Article, b: Article) => {
                return (a.getPublishAge() - b.getPublishAge()) * multiplier;
            }
        }
        function publishDaySorter(isNewFirst: boolean) {
            var multiplier = isNewFirst ? -1 : 1;
            return (a: Article, b: Article) => {
                let dateA = a.getPublishDate(), dateB = b.getPublishDate();
                let result = dateA.getFullYear() - dateB.getFullYear();
                if (result == 0) {
                    result = dateA.getMonth() - dateB.getMonth();
                    if (result == 0) {
                        result = dateA.getDay() - dateB.getDay();
                    }
                }
                return result * multiplier;
            }
        }
        function sourceSorter(isAscending: boolean) {
            var multiplier = isAscending ? 1 : -1;
            return (a: Article, b: Article) => {
                return a.getSource().localeCompare(b.getSource()) * multiplier;
            }
        }

        this.sorterByType[SortingType.TitleDesc] = titleSorter(false);
        this.sorterByType[SortingType.TitleAsc] = titleSorter(true);
        this.sorterByType[SortingType.PopularityDesc] = popularitySorter(false);
        this.sorterByType[SortingType.PopularityAsc] = popularitySorter(true);
        this.sorterByType[SortingType.ReceivedDateNewFirst] = receivedDateSorter(true);
        this.sorterByType[SortingType.ReceivedDateOldFirst] = receivedDateSorter(false);
        this.sorterByType[SortingType.PublishDateNewFirst] = publishDateSorter(true);
        this.sorterByType[SortingType.PublishDateOldFirst] = publishDateSorter(false);
        this.sorterByType[SortingType.PublishDayNewFirst] = publishDaySorter(true);
        this.sorterByType[SortingType.PublishDayOldFirst] = publishDaySorter(false);
        this.sorterByType[SortingType.SourceAsc] = sourceSorter(true);
        this.sorterByType[SortingType.SourceDesc] = sourceSorter(false);
        this.sorterByType[SortingType.SourceNewestReceiveDate] = receivedDateSorter(true);
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
        }
    }
}

export class EntryInfos {
    body: string;
    author: string;
    engagement: number;
    published: number;
    received: number;
    constructor(jsonInfos) {
        var bodyInfos = jsonInfos.content ? jsonInfos.content : jsonInfos.summary;
        this.body = bodyInfos ? bodyInfos.content : "";
        this.author = jsonInfos.author;
        this.engagement = jsonInfos.engagement;
        this.published = jsonInfos.published;
        this.received = jsonInfos.crawled;
    }
}

export class Article {
    private checkedAttr = "checked-FFnS";
    private article: JQuery;
    private container: JQuery;
    private entryId: string;
    title: string;
    body: string;
    author: string;
    private source: string;
    private receivedAge: number;
    private publishAge: number;
    private popularity: number;
    private url: string;
    private entryInfos: EntryInfos;

    constructor(article: Element) {
        this.article = $(article);
        this.entryId = this.article.attr(ext.articleEntryIdAttribute);
        var infosElement = this.article.find("." + ext.entryInfosJsonClass);
        if (infosElement.length > 0) {
            this.entryInfos = JSON.parse(infosElement.text());
            if (this.entryInfos) {
                this.body = this.entryInfos.body;
                this.body = this.body ? this.body.toLowerCase() : "";
                this.author = this.entryInfos.author;
                this.author = this.author ? this.author.toLowerCase() : "";
                this.receivedAge = this.entryInfos.received;
                this.publishAge = this.entryInfos.published;
            } else {
                let isArticleView = $(article).hasClass(ext.articleViewClass);
                this.body = this.article.find(isArticleView ? ".content" : ".summary").text().toLowerCase();
                this.author = (isArticleView ?
                    (() => {
                        let metadata = $(article).find(".metadata").text().trim().replace(/\s\s+/ig, "\n").split("\n");
                        return metadata[3] === "/" ? metadata[2] : metadata[3];
                    })() :
                    this.article.find(".authors").text()
                ).replace("by", "").trim().toLowerCase();
                var ageStr = this.article.find(ext.publishAgeSpanSelector).attr(ext.publishAgeTimestampAttr);
                var ageSplit = ageStr.split("--");
                var publishDate = ageSplit[0].replace(/[^:]*:/, "").trim();
                var receivedDate = ageSplit[1].replace(/[^:]*:/, "").trim();
                this.publishAge = Date.parse(publishDate);
                this.receivedAge = Date.parse(receivedDate);
            }
        }

        // Title
        this.title = this.article.attr(ext.articleTitleAttribute).trim().toLowerCase();

        // Popularity
        var popularityStr = this.article.find(ext.popularitySelector).text().trim();
        popularityStr = popularityStr.replace("+", "");
        if (popularityStr.indexOf("K") > -1) {
            popularityStr = popularityStr.replace("K", "");
            popularityStr += "000";
        }
        this.popularity = Number(popularityStr);

        // Source
        var source = this.article.find(ext.articleSourceSelector);
        if (source != null) {
            this.source = source.text().trim();
        }

        // URL
        this.url = this.article.find(".title").attr("href");

        this.container = this.article.closest(".list-entries > div");
    }

    addClass(c) {
        return this.article.addClass(c);
    }

    getTitle(): string {
        return this.title;
    }

    getUrl() {
        return this.url;
    }

    getSource(): string {
        return this.source;
    }

    getPopularity(): number {
        return this.popularity;
    }

    getReceivedAge(): number {
        return this.receivedAge;
    }

    getReceivedDate(): Date {
        return new Date(this.receivedAge);
    }

    getPublishAge(): number {
        return this.publishAge;
    }

    getPublishDate(): Date {
        return new Date(this.publishAge);
    }

    isHot(): boolean {
        var span = this.article.find(ext.popularitySelector);
        return span.hasClass("hot") || span.hasClass("onfire");
    }

    getEntryId(): string {
        return this.entryId;
    }

    setVisible(visible?: boolean) {
        if (visible != null && !visible) {
            this.container.css("display", "none");
            let articlesContainer = this.container.closest($(ext.articlesContainerSelector));
            this.container.detach().appendTo(articlesContainer);
        } else {
            this.container.css("display", "");
        }
    }

    getContainer() {
        return this.container;
    }

    isVisible(): boolean {
        return !(this.container.css("display") === "none");
    }

    checked() {
        this.article.attr(this.checkedAttr, "");
    }

    setColor(color: string) {
        this.article.css("background-color", color);
    }

}
