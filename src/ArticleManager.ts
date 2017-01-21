/// <reference path="./_references.d.ts" />

import { FilteringType, SortingType } from "./DataTypes";
import { Subscription } from "./Subscription";
import { SubscriptionManager } from "./SubscriptionManager";
import { $id, isChecked } from "./Utils";
import { FeedlyPage } from "./FeedlyPage";

export class ArticleManager {
    subscriptionManager: SubscriptionManager;
    articleSorterFactory: ArticleSorterFactory;
    page: FeedlyPage;
    articlesCount = 0;
    lastReadArticleAge = -1;
    lastReadArticleGroup: Article[];
    articlesToMarkAsRead: Article[];

    constructor(subscriptionManager: SubscriptionManager, page: FeedlyPage) {
        this.subscriptionManager = subscriptionManager;
        this.articleSorterFactory = new ArticleSorterFactory();
        this.page = page;
    }

    refreshArticles() {
        this.resetArticles();
        $(ext.articleSelector).toArray().forEach(this.addArticle, this);
    }

    resetArticles() {
        this.articlesCount = 0;
        this.lastReadArticleAge = -1;
        this.lastReadArticleGroup = [];
        this.articlesToMarkAsRead = [];
    }

    getCurrentSub(): Subscription {
        return this.subscriptionManager.getCurrentSubscription();
    }

    getCurrentUnreadCount() {
        return $(ext.articleSelector).length;
    }

    addArticle(a: Element) {
        this.articlesCount++;
        var article = new Article(a);
        this.filterAndRestrict(article);
        this.advancedControls(article);
        this.checkLastAddedArticle();
    }

    filterAndRestrict(article: Article) {
        var sub = this.getCurrentSub();
        if (sub.isFilteringEnabled() || sub.isRestrictingEnabled()) {
            var hide = false;
            if (sub.isRestrictingEnabled()) {
                hide = article.matchKeywords(sub, FilteringType.RestrictedOn, true);
            }
            if (sub.isFilteringEnabled()) {
                hide = hide || article.matchKeywords(sub, FilteringType.FilteredOut);
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
                var publishAge = article.getPublishAge();
                if (publishAge <= threshold) {
                    if (advControls.keepUnread && (this.lastReadArticleAge == -1 ||
                        publishAge >= this.lastReadArticleAge)) {
                        if (publishAge != this.lastReadArticleAge) {
                            this.lastReadArticleGroup = [article]
                        } else {
                            this.lastReadArticleGroup.push(article);
                        }
                        this.lastReadArticleAge = publishAge;
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

    checkLastAddedArticle() {
        var sub = this.getCurrentSub();
        if (this.articlesCount == this.getCurrentUnreadCount()) {
            this.prepareMarkAsRead();
            this.sortArticles();
            this.page.showHiddingInfo();
        }
    }

    sortArticles() {
        var sub = this.getCurrentSub();
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
            articlesContainer.empty();
            visibleArticles.forEach((article) => {
                articlesContainer.append(article.get());
            });
            hiddenArticles.forEach((article) => {
                articlesContainer.append(article.get());
            });
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
        try {
            /* FIXME
            var firstPublishAge = new Article($(ext.articleSelector).first().get(0)).getPublishAge();
            var lastPublishAge = new Article($(ext.articleSelector).last().get(0)).getPublishAge();
            return firstPublishAge < lastPublishAge;
            */
            return false;
        } catch (err) {
            console.log(err);
            return false;
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
    constructor(jsonInfos) {
        this.body = jsonInfos.summary;
        this.author = jsonInfos.author;
        this.engagement = jsonInfos.engagement;
        this.published = jsonInfos.published;
    }
}

class Article {
    private article: JQuery;
    private entryId: string;
    private title: string;
    private source: string;
    private popularity: number;
    private entryInfos: EntryInfos;

    constructor(article: Element) {
        this.article = $(article);
        this.entryId = this.article.attr(ext.articleEntryIdAttribute);
        var infosElement = this.article.find("." + ext.entryInfosJsonClass);
        if (infosElement.length > 0) {
            this.entryInfos = JSON.parse(infosElement.text());
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

    getPublishAge(): number {
        if (this.entryInfos) {
            return this.entryInfos.published;
        }
        var ageStr = this.article.find(ext.publishAgeSpanSelector).attr(ext.publishAgeTimestampAttr);
        var publishDate = ageStr.split("--")[1].replace(/[^:]*:/, "").trim();
        return Date.parse(publishDate);
    }

    isHot(): boolean {
        var span = this.article.find(ext.popularitySelector);
        return span.hasClass("hot") || span.hasClass("onfire");
    }

    getEntryId(): string {
        return this.entryId;
    }

    setVisible(visibile?: boolean) {
        this.article.css("display", visibile == null ? "" : (visibile ? "" : "none"));
    }

    isVisible(): boolean {
        return !(this.article.css("display") === "none");
    }

    getAuthor(): string {
        if (this.entryInfos) {
            return this.entryInfos.author;
        }
        return this.article.find(".authors").text().replace("by", "");
    }

    getBody(): string {
        if (this.entryInfos) {
            return this.entryInfos.body;
        }
        return this.article.find(".summary").text();
    }

    matchKeywords(sub: Subscription, type: FilteringType, invert?: boolean): boolean {
        var keywords = sub.getFilteringList(type);
        if (keywords.length == 0) {
            return false;
        }
        for (var i = 0; i < keywords.length; i++) {
            if (this.title.indexOf(keywords[i].toLowerCase()) != -1) {
                return !invert == true;
            }
        }
        return !invert == false;
    }

}
