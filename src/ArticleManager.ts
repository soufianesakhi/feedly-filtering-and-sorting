/// <reference path="./_references.d.ts" />

import { FilteringType, SortingType, ColoringRuleSource } from "./DataTypes";
import { Subscription } from "./Subscription";
import { SettingsManager } from "./SettingsManager";
import { KeywordManager } from "./KeywordManager";
import { $id, isChecked, injectStyleText } from "./Utils";
import { FeedlyPage } from "./FeedlyPage";

export class ArticleManager {
    subscriptionManager: SettingsManager;
    articleSorterFactory: ArticleSorterFactory;
    keywordManager: KeywordManager;
    page: FeedlyPage;
    sortedArticlesCount = 0;
    lastReadArticleAge = -1;
    lastReadArticleGroup: Article[];
    articlesToMarkAsRead: Article[];

    constructor(subscriptionManager: SettingsManager, keywordManager: KeywordManager, page: FeedlyPage) {
        this.subscriptionManager = subscriptionManager;
        this.keywordManager = keywordManager;
        this.articleSorterFactory = new ArticleSorterFactory();
        this.page = page;
    }

    refreshArticles() {
        this.resetArticles();
        if ($(ext.articleSelector).length == 0) {
            return;
        }
        $(ext.articleSelector).each((i, e) => {
            this.addArticle(e, true);
        });
        this.checkLastAddedArticle();
        this.checkSortArticles();
    }

    resetArticles() {
        this.sortedArticlesCount = 0;
        this.lastReadArticleAge = -1;
        this.lastReadArticleGroup = [];
        this.articlesToMarkAsRead = [];
    }

    refreshColoring() {
        $(ext.articleSelector).each((i, e) => {
            this.applyColoringRules(new Article(e));
        });
    }

    getCurrentSub(): Subscription {
        return this.subscriptionManager.getCurrentSubscription();
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
            this.checkSortArticles();
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
                hide = hide || this.keywordManager.matchKeywords(article, sub, FilteringType.FilteredOut);
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
                    if (advControls.keepUnread && (this.lastReadArticleAge == -1 ||
                        receivedAge >= this.lastReadArticleAge)) {
                        if (receivedAge != this.lastReadArticleAge) {
                            this.lastReadArticleGroup = [article]
                        } else {
                            this.lastReadArticleGroup.push(article);
                        }
                        this.lastReadArticleAge = receivedAge;
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
            let match = this.keywordManager.matchSpecficKeywords(article, keywords, rule.matchingMethod);
            article.setColor(match ? "#" + rule.color : "");
            if (match) {
                return;
            }
        }
    }

    checkSortArticles() {
        if (this.sortedArticlesCount != this.getCurrentUnreadCount()) {
            if (this.getCurrentSub().isSortingEnabled()) {
                let msg = "Sorting articles at " + new Date().toTimeString();
                if (this.sortedArticlesCount > 0) {
                    msg += " (Previous sorted count: " + this.sortedArticlesCount + ")";
                }
                console.log(msg);
            }
            this.sortArticles();
            this.sortedArticlesCount = this.getCurrentUnreadCount();
        }
    }

    checkLastAddedArticle() {
        if ($(ext.uncheckedArticlesSelector).length == 0) {
            this.prepareMarkAsRead();
            this.page.showHiddingInfo();
        }
    }

    sortArticles() {
        let sub = this.getCurrentSub();
        var visibleArticles: Article[] = [], hiddenArticles: Article[] = [];
        (<Element[]>$(ext.articleSelector).toArray()).map<Article>(((a) => {
            return new Article(a);
        })).forEach((a) => {
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
            var articlesContainer = $(ext.articleSelector).first().parent();
            var endOfFeed = $(ext.endOfFeedSelector).detach();
            articlesContainer.empty();
            visibleArticles.forEach((article) => {
                articlesContainer.append(article.get());
            });
            hiddenArticles.forEach((article) => {
                articlesContainer.append(article.get());
            });
            if (endOfFeed) {
                articlesContainer.append(endOfFeed);
            } else {
                $(ext.endOfFeedSelector).detach().appendTo(articlesContainer);
            }
        }
        var sortedVisibleArticles = visibleArticles.map(a => a.getEntryId());
        this.page.put(ext.sortedVisibleArticlesId, sortedVisibleArticles);
    }

    prepareMarkAsRead() {
        if (this.lastReadArticleGroup.length > 0) {
            var lastReadArticle: Article;
            if (this.isOldestFirst()) {
                lastReadArticle = this.lastReadArticleGroup[this.lastReadArticleGroup.length - 1];
            } else {
                lastReadArticle = this.lastReadArticleGroup[0];
            }
            if (lastReadArticle != null) {
                this.page.put(ext.lastReadEntryId, lastReadArticle.getEntryId());
            }
        }

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
        var sortingTypes = [sub.getSortingType()].concat(sub.getAdditionalSortingTypes());
        articles.sort(this.articleSorterFactory.getSorter(sortingTypes));
    }

    isOldestFirst(): boolean {
        return !this.page.get(ext.isNewestFirstId, true);
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
        this.sorterByType[SortingType.SourceAsc] = sourceSorter(true);
        this.sorterByType[SortingType.SourceDesc] = sourceSorter(false);
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
    private entryId: string;
    title: string;
    body: string;
    author: string;
    private source: string;
    private receivedAge: number;
    private publishAge: number;
    private popularity: number;
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
                this.body = this.article.find(".summary").text().toLowerCase();
                this.author = this.article.find(".authors").text().replace("by", "").toLowerCase();
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
            this.source = source.text();
        }
    }

    get(): JQuery {
        return this.article;
    }

    getTitle(): string {
        return this.title;
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

    getPublishAge(): number {
        return this.publishAge;
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
            this.article.css("display", "none");
            let articlesContainer = this.article.parent();
            this.article.detach().appendTo(articlesContainer);
        } else {
            this.article.css("display", "");
        }
    }

    isVisible(): boolean {
        return !(this.article.css("display") === "none");
    }

    checked() {
        this.article.attr(this.checkedAttr, "");
    }

    setColor(color: string) {
        this.article.css("background-color", color);
    }

}
