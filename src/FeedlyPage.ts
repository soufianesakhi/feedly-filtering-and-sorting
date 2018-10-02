/// <reference path="./_references.d.ts" />

import { EntryInfos } from "./ArticleManager";
import { Subscription } from "./Subscription";
import { executeWindow, injectClasses, injectToWindow } from "./Utils";

declare var getFFnS: (id: string, persistent?: boolean) => any;
declare var putFFnS: (id: string, value: any, persistent?: boolean) => any;
declare var getById: (id: string) => HTMLElement;
declare var getSortedVisibleArticles: () => string[];
declare var getStreamPage: () => any;
declare var onClickCapture: (element: JQuery, callback: (event: MouseEvent) => any) => void;
declare var fetchMoreEntries: (batchSize: number) => void;
declare var loadNextBatch: (ev?: MouseEvent) => void;
declare var getKeptUnreadEntryIds: () => string[];

export class FeedlyPage {
    hiddingInfoClass = "FFnS_Hiding_Info";

    constructor() {
        this.put("ext", ext);
        injectToWindow(["getFFnS", "putFFnS", "getById", "getStreamPage", "onClickCapture", "fetchMoreEntries", "loadNextBatch", "getKeptUnreadEntryIds", "getSortedVisibleArticles"],
            this.get, this.put, this.getById, this.getStreamPage, this.onClickCapture, this.fetchMoreEntries, this.loadNextBatch, this.getKeptUnreadEntryIds, this.getSortedVisibleArticles);
        injectClasses(EntryInfos);
        executeWindow("Feedly-Page-FFnS.js", this.initWindow, this.overrideLoadingEntries, this.overrideMarkAsRead, this.overrideSorting, this.onNewPage, this.onNewArticle);
    }

    update(sub: Subscription) {
        this.updateCheck(sub.isOpenAndMarkAsRead(), ext.openAndMarkAsReadId, ext.openAndMarkAsReadClass);
        this.updateCheck(sub.isMarkAsReadAboveBelow(), ext.markAsReadAboveBelowId, ext.markAsReadAboveBelowClass);
        this.updateCheck(sub.isOpenCurrentFeedArticles(), ext.openCurrentFeedArticlesId, ext.openCurrentFeedArticlesClass);
        const filteringByReadingTime = sub.getFilteringByReadingTime();
        if (sub.getAdvancedControlsReceivedPeriod().keepUnread ||
            (filteringByReadingTime.enabled && filteringByReadingTime.keepUnread)) {
            this.put(ext.keepArticlesUnreadId, true);
        }
        if (sub.isHideWhenMarkAboveBelow()) {
            this.put(ext.hideWhenMarkAboveBelowId, true);
        }
        if (sub.isHideAfterRead()) {
            this.put(ext.hideAfterReadId, true);
        }
        this.put(ext.markAsReadAboveBelowReadId, sub.isMarkAsReadAboveBelowRead());
        this.put(ext.visualOpenAndMarkAsReadId, sub.isVisualOpenAndMarkAsRead());
        this.put(ext.titleOpenAndMarkAsReadId, sub.isTitleOpenAndMarkAsRead());
        this.put(ext.openCurrentFeedArticlesUnreadOnlyId, sub.isOpenCurrentFeedArticlesUnreadOnly());
        this.put(ext.maxOpenCurrentFeedArticlesId, sub.getMaxOpenCurrentFeedArticles());
        this.put(ext.markAsReadOnOpenCurrentFeedArticlesId, sub.isMarkAsReadOnOpenCurrentFeedArticles());
    }

    updateCheck(enabled: boolean, id: string, className: string) {
        if (enabled) {
            this.put(id, true);
            $("." + className).css("display", "");
        } else {
            $("." + className).css("display", "none");
        }
    }

    initAutoLoad() {
        if (this.get(ext.autoLoadAllArticlesId, true)) {
            executeWindow("Feedly-Page-FFnS-InitAutoLoad.js", this.autoLoad);
        }
    }

    initWindow() {
        window["ext"] = getFFnS("ext");
        NodeCreationObserver.init("observed-page");
    }

    autoLoad() {
        var navigo = window["streets"].service("navigo");
        navigo.setEntries(navigo.getEntries());
    }

    getStreamPage(): any {
        var observers = window["streets"].service("navigo").observers;
        for (let i = 0, len = observers.length; i < len; i++) {
            let stream = observers[i].stream;
            if (stream && stream.streamId) {
                return observers[i];
            }
        }
    }

    onNewPage() {
        NodeCreationObserver.onCreation(ext.subscriptionChangeSelector, () => {
            var streamPage = getStreamPage();
            if (streamPage) {
                putFFnS(ext.isNewestFirstId, streamPage.stream._sort === "newest", true);
            }

            let openCurrentFeedArticlesBtn = $("<button>", {
                title: "Open all current feed articles in a new tab",
                class: ext.openCurrentFeedArticlesClass,
                style: getFFnS(ext.openCurrentFeedArticlesId) ? "" : "display: none",
                type: "button"
            });
            let feedButtonsContainer = $("<div>");
            feedButtonsContainer.append(openCurrentFeedArticlesBtn);
            $("header.header").parent().after(feedButtonsContainer);
            onClickCapture(openCurrentFeedArticlesBtn, (event: MouseEvent) => {
                event.stopPropagation();
                let articlesToOpen = getSortedVisibleArticles();
                if (articlesToOpen.length == 0) {
                    return;
                }
                if (getFFnS(ext.openCurrentFeedArticlesUnreadOnlyId)) {
                    articlesToOpen = articlesToOpen.filter(id => {
                        return $(getById(id)).hasClass("unread");
                    });
                }
                let max = getFFnS(ext.maxOpenCurrentFeedArticlesId);
                if (max && max > 0) {
                    if (max < articlesToOpen.length) {
                        articlesToOpen.length = max;
                    }
                }
                articlesToOpen.map(id => getById(id)).forEach(a => {
                    let link = $(a).find(".title").attr("href");
                    window.open(link, link);
                });
                if (getFFnS(ext.markAsReadOnOpenCurrentFeedArticlesId)) {
                    let reader = window["streets"].service('reader');
                    articlesToOpen.forEach(entryId => {
                        reader.askMarkEntryAsRead(entryId);
                        $(getById(entryId)).removeClass("unread").addClass("read");
                    });
                }
            });
        });
    }

    onClickCapture(element: JQuery, callback: (event: MouseEvent) => any): void {
        element.get(0).addEventListener('click', callback, true);
    }

    getKeptUnreadEntryIds() {
        var navigo = window["streets"].service("navigo");
        let entries: any[] = navigo.originalEntries || navigo.getEntries();
        let keptUnreadEntryIds = entries.filter(e => {
            return e.wasKeptUnread();
        }).map<string>(e => {
            return e.id;
        });
        return keptUnreadEntryIds;
    }

    getSortedVisibleArticles(): string[] {
        var sortedVisibleArticles: string[] = getFFnS(ext.sortedVisibleArticlesId);
        if (!sortedVisibleArticles) {
            sortedVisibleArticles = [];
            $(ext.articleSelector).each((i, a) => {
                sortedVisibleArticles.push($(a).attr(ext.articleEntryIdAttribute));
            });
        }
        return sortedVisibleArticles;
    }

    onNewArticle() {
        var reader = window["streets"].service('reader');
        var getLink = (a: JQuery) => {
            return a.find(".title").attr("href");
        };
        var getMarkAsReadAboveBelowCallback = (entryId: string, above: boolean) => {
            return (event: MouseEvent) => {
                event.stopPropagation();
                var sortedVisibleArticles = getSortedVisibleArticles();
                var markAsRead = getFFnS(ext.markAsReadAboveBelowReadId);
                if (markAsRead) {
                    let keptUnreadEntryIds = getKeptUnreadEntryIds();
                    sortedVisibleArticles = sortedVisibleArticles.filter(id => {
                        return keptUnreadEntryIds.indexOf(id) < 0;
                    });
                }
                var index = sortedVisibleArticles.indexOf(entryId);
                if (index == -1) {
                    return;
                }
                var start: number, endExcl: number;
                if (above) {
                    if (index == 0) {
                        return;
                    }
                    start = 0;
                    endExcl = index;
                } else {
                    if (index == sortedVisibleArticles.length) {
                        return;
                    }
                    start = index + 1;
                    endExcl = sortedVisibleArticles.length;
                }
                var hide = getFFnS(ext.hideWhenMarkAboveBelowId);
                for (var i = start; i < endExcl; i++) {
                    var id = sortedVisibleArticles[i];
                    if (markAsRead) {
                        reader.askMarkEntryAsRead(id);
                        if (hide) {
                            $(getById(id)).remove();
                        }
                    } else {
                        reader.askKeepEntryAsUnread(id);
                    }
                }
            }
        }

        NodeCreationObserver.onCreation(ext.articleSelector + ", .condensed-tools .button-dropdown", element => {
            var notDropdown = !$(element).hasClass("button-dropdown");
            var a = $(element).closest(ext.articleSelector);
            if (notDropdown == a.hasClass("u0")) {
                return;
            }

            var entryId = a.attr(ext.articleEntryIdAttribute);

            var e = reader.lookupEntry(entryId);
            var entryInfos = $("<span>", {
                class: ext.entryInfosJsonClass,
                style: "display: none"
            });
            entryInfos.text(JSON.stringify(new EntryInfos(e.jsonInfo)))
            a.append(entryInfos);

            var cardsView = a.hasClass("u5");
            var magazineView = a.hasClass("u4");
            var titleView = a.hasClass("u0");
            var articleView = a.hasClass(ext.articleViewClass);
            var addButton = (id: string, attributes) => {
                attributes.type = "button";
                attributes.style = getFFnS(id) ? "" : "display: none";
                attributes.class += " mark-as-read";
                if (titleView) {
                    attributes.class += " condensed-toolbar-icon icon";
                }

                var e = $("<button>", attributes);
                if (cardsView) {
                    a.find(".mark-as-read").last().before(e);
                } else if (magazineView) {
                    a.find(".ago").after(e);
                } else if (articleView) {
                    a.find(".metadata").append(e);
                } else {
                    $(element).prepend(e)
                }
                return e;
            }
            var markAsReadBelowElement = addButton(ext.markAsReadAboveBelowId, {
                class: ext.markAsReadAboveBelowClass + " mark-below-as-read",
                title: "Mark articles below" + (cardsView ? " and on the right" : "") + " as read/unread",
            });
            var markAsReadAboveElement = addButton(ext.markAsReadAboveBelowId, {
                class: ext.markAsReadAboveBelowClass + " mark-above-as-read",
                title: "Mark articles above" + (cardsView ? " and on the left" : "") + " as read/unread"
            });
            var openAndMarkAsReadElement = addButton(ext.openAndMarkAsReadId, {
                class: ext.openAndMarkAsReadClass,
                title: "Open in a new window/tab and mark as read"
            });

            if (articleView) {
                markAsReadBelowElement.detach().insertAfter(markAsReadAboveElement);
            } else if (magazineView) {
                markAsReadAboveElement.detach().insertAfter(markAsReadBelowElement);
            }

            var link = getLink(a);
            let openAndMarkAsRead = (event: MouseEvent) => {
                event.stopPropagation();
                window.open(link, link);
                reader.askMarkEntryAsRead(entryId);
                if (articleView) {
                    $(a).closest(ext.articleViewEntryContainerSelector).removeClass("unread").addClass("read");
                }
            }
            onClickCapture(openAndMarkAsReadElement, openAndMarkAsRead);

            let visualElement;
            if (cardsView) {
                visualElement = a.find(".visual-container");
            } else if (magazineView) {
                visualElement = a.find(".visual");
            }
            if (visualElement) {
                onClickCapture(visualElement, e => {
                    if (getFFnS(ext.visualOpenAndMarkAsReadId)) {
                        openAndMarkAsRead(e);
                    }
                });
            }
            if (titleView) {
                onClickCapture(a.find(".content"), e => {
                    if (getFFnS(ext.titleOpenAndMarkAsReadId)) {
                        e.stopPropagation();
                        reader.askMarkEntryAsRead(entryId);
                    }
                });
            }

            onClickCapture(markAsReadBelowElement, getMarkAsReadAboveBelowCallback(entryId, false));
            onClickCapture(markAsReadAboveElement, getMarkAsReadAboveBelowCallback(entryId, true));
        });
    }

    reset() {
        this.clearHidingInfo();
        var i = sessionStorage.length;
        while (i--) {
            var key = sessionStorage.key(i);
            if (/^FFnS_/.test(key)) {
                sessionStorage.removeItem(key);
            }
        }
    }

    refreshHidingInfo() {
        var hiddenCount = 0;
        $(ext.articleSelector).each((i, a) => {
            if (!$(a).is(':visible')) {
                hiddenCount++;
            }
        })
        this.clearHidingInfo();
        if (hiddenCount == 0) {
            return;
        }
        $(ext.hidingInfoSibling).after("<div class='col-xs-3 col-md-3 detail " + this.hiddingInfoClass + "'> (" + hiddenCount + " hidden entries)</div>");
    }

    clearHidingInfo() {
        $("." + this.hiddingInfoClass).remove();
    }

    put(id: string, value: any, persistent?: boolean) {
        sessionStorage.setItem("FFnS" + (persistent ? "#" : "_") + id, JSON.stringify(value));
    }

    get(id: string, persistent?: boolean) {
        return JSON.parse(sessionStorage.getItem("FFnS" + (persistent ? "#" : "_") + id));
    }

    getById(id: string): HTMLElement {
        return document.getElementById(id + "_main");
    }

    fetchMoreEntries(batchSize: number) {
        var autoLoadingMessageId = "FFnS_LoadingMessage";
        let stream = getStreamPage().stream;
        if ($(".message.loading").length == 0) {
            $(ext.articlesContainerSelector).first().before($("<div>", {
                id: autoLoadingMessageId,
                class: "message loading",
                text: "Auto loading all articles"
            }));
        }
        stream.setBatchSize(batchSize);
        console.log("Fetching more articles (batch size: " + stream._batchSize + ") at: " + new Date().toTimeString());
        stream.askMoreEntries();
        stream.askingMoreEntries = false;
    }

    loadNextBatch(ev?: MouseEvent) {
        ev && ev.stopPropagation();
        var navigo = window["streets"].service("navigo");
        var reader = window["streets"].service('reader');
        let entries: any[] = navigo.originalEntries || navigo.getEntries();
        let markAsReadEntryIds: string[];
        if (getFFnS(ext.keepArticlesUnreadId)) {
            markAsReadEntryIds = getFFnS(ext.articlesToMarkAsReadId);
        } else {
            markAsReadEntryIds = entries.sort((a, b) => {
                return a.jsonInfo.crawled - b.jsonInfo.crawled;
            }).map<string>(e => {
                return e.id;
            });
        }
        let keptUnreadEntryIds = getKeptUnreadEntryIds();
        markAsReadEntryIds = markAsReadEntryIds.filter(id => {
            return keptUnreadEntryIds.indexOf(id) < 0;
        });
        reader.askMarkEntriesAsRead(markAsReadEntryIds, {});
        window.scrollTo(0, 0);
        $(ext.articlesContainerSelector).empty();
        navigo.originalEntries = null;
        navigo.entries = [];
        fetchMoreEntries(getFFnS(ext.batchSizeId, true));
    }

    overrideLoadingEntries() {
        var autoLoadingMessageId = "#FFnS_LoadingMessage";
        var loadNextBatchBtnId = "#FFnS_LoadNextBatchBtn";
        var secondaryMarkAsReadBtnsSelector = ".mark-as-read-button.secondary";
        var loadByBatchText = "Mark batch as read and load next batch";
        var navigo = window["streets"].service("navigo");
        var reader = window["streets"].service('reader');
        var streamId = reader.listSubscriptions()[0].id;
        var autoLoadAllArticleDefaultBatchSize = 1000;

        var isAutoLoad: () => boolean = () => {
            try {
                return getStreamPage() != null &&
                    ($(ext.articleSelector).length == 0 || $(ext.unreadArticlesCountSelector).length > 0)
                    && !(getStreamPage().stream.state.info.subscribed === false)
                    && getFFnS(ext.autoLoadAllArticlesId, true);
            } catch (e) {
                console.log(e);
                return false;
            }
        };

        let streamObj = reader.lookupStream(streamId, { unreadOnly: true, featured: 0, sort: "newest", batchSize: 40 });
        var prototype = Object.getPrototypeOf(streamObj);
        var setBatchSize: Function = prototype.setBatchSize;
        prototype.setBatchSize = function (customSize?: number) {
            if (this._batchSize == customSize) {
                return;
            }
            if (isAutoLoad()) {
                this._batchSize = customSize;
            } else {
                setBatchSize.apply(this, arguments);
            }
        }

        var navigoPrototype = Object.getPrototypeOf(navigo);
        var setEntries = navigoPrototype.setEntries;
        navigoPrototype.setEntries = function (entries: any[]) {
            if (entries.length > 0) {
                putFFnS(ext.sortArticlesId, true);
            }
            if (entries.length > 0 && entries[entries.length - 1].jsonInfo.unread && isAutoLoad()) {
                let isLoadByBatch = getFFnS(ext.loadByBatchEnabledId, true);
                let firstLoadByBatch = false;
                if (this.entries.length == 0) {
                    window.removeEventListener("scroll", getStreamPage()._throttledCheckMoreEntriesNeeded)
                    firstLoadByBatch = isLoadByBatch;
                }
                let isBatchLoading = true;
                let autoLoadAllArticleBatchSize = autoLoadAllArticleDefaultBatchSize;
                if (isLoadByBatch) {
                    let batchSize = getFFnS(ext.batchSizeId, true);
                    autoLoadAllArticleBatchSize = batchSize;
                    if (entries.length >= batchSize) {
                        isBatchLoading = false;
                    }
                }

                var stream = getStreamPage().stream;
                var hasAllEntries = stream.state.hasAllEntries;
                if (!hasAllEntries && !stream.askingMoreEntries && !stream.state.isLoadingEntries && isBatchLoading && $(loadNextBatchBtnId).length == 0) {
                    stream.askingMoreEntries = true;
                    setTimeout(() => {
                        let batchSize = autoLoadAllArticleBatchSize;
                        if (firstLoadByBatch) {
                            batchSize = batchSize - entries.length;
                        }
                        fetchMoreEntries(batchSize);
                    }, 100);
                } else if (hasAllEntries || !isBatchLoading) {
                    $(autoLoadingMessageId).remove();
                    if (hasAllEntries) {
                        console.log("End auto load all articles at: " + new Date().toTimeString());
                        if (isLoadByBatch) {
                            $(loadNextBatchBtnId).remove();
                        }
                    } else if (isLoadByBatch && $(loadNextBatchBtnId).length == 0) {
                        $(ext.articlesContainerSelector).last().after($('<button>', {
                            id: loadNextBatchBtnId.substring(1),
                            class: "full-width secondary",
                            type: "button",
                            style: "margin-top: 1%;",
                            text: loadByBatchText
                        }));
                        onClickCapture($(loadNextBatchBtnId), loadNextBatch);
                    }
                }
            }
            setTimeout(() => {
                let markAsReadEntries = $(ext.articleSelector + "." + ext.markAsReadImmediatelyClass);
                if (markAsReadEntries.length == 0) {
                    return;
                }
                let ids = $.map<Element, string>(markAsReadEntries.toArray(), e => $(e).attr(ext.articleEntryIdAttribute));
                reader.askMarkEntriesAsRead(ids, {});
                markAsReadEntries.removeClass(ext.markAsReadImmediatelyClass).removeClass("unread").addClass("read");
            }, 1000);
            return setEntries.apply(this, arguments);
        };

        NodeCreationObserver.onCreation(ext.loadingMessageSelector, (e) => {
            if ($(autoLoadingMessageId).length == 1) {
                $(e).hide();
            }
        });

        NodeCreationObserver.onCreation(secondaryMarkAsReadBtnsSelector, e => {
            if (getFFnS(ext.loadByBatchEnabledId, true)) {
                $(secondaryMarkAsReadBtnsSelector).attr("title", loadByBatchText);
            }
        });
    }

    overrideMarkAsRead() {
        var reader = window["streets"].service('reader');
        var navigo = window["streets"].service("navigo");
        var pagesPkg = window["devhd"].pkg("pages");

        var prototype = pagesPkg.ReactPage.prototype;
        var markAsRead: Function = prototype.markAsRead;
        prototype.markAsRead = function (lastEntryObject) {
            let jumpToNext = () => {
                if (!/latest\/?$/i.test(document.URL)) {
                    navigo.getNextURI() ? this.feedly.jumpToNext() : this.feedly.loadDefaultPage();
                } else {
                    this.feedly.jumpToNext();
                }
            }
            if (lastEntryObject && lastEntryObject.asOf) {
                markAsRead.call(this, lastEntryObject);
            } else if (getFFnS(ext.loadByBatchEnabledId, true) && !getStreamPage().stream.state.hasAllEntries) {
                loadNextBatch();
            } else if (getFFnS(ext.keepArticlesUnreadId)) {
                console.log("Marking as read with keeping new articles unread");

                var idsToMarkAsRead: string[] = getFFnS(ext.articlesToMarkAsReadId);
                if (idsToMarkAsRead) {
                    let keptUnreadEntryIds = getKeptUnreadEntryIds();
                    idsToMarkAsRead = idsToMarkAsRead.filter(id => {
                        return keptUnreadEntryIds.indexOf(id) < 0;
                    });
                    console.log(idsToMarkAsRead.length + " new articles will be marked as read");
                    reader.askMarkEntriesAsRead(idsToMarkAsRead, {});
                } else {
                    console.log("No article to mark as read");
                }
                jumpToNext();
            } else {
                markAsRead.call(this, lastEntryObject);
                jumpToNext();
            }
        }
    }

    overrideSorting() {
        var navigo = window["streets"].service("navigo");
        var prototype = Object.getPrototypeOf(navigo);
        function filterVisible(entry) {
            return !($(getById(entry.id)).css("display") === "none");
        }
        function ensureSortedEntries() {
            var entries: any[] = navigo.entries;
            var originalEntries: any[] = navigo.originalEntries || entries;
            navigo.originalEntries = originalEntries;
            var sortedVisibleArticles: String[] = getFFnS(ext.sortedVisibleArticlesId);
            if (!sortedVisibleArticles) {
                navigo.entries = originalEntries;
                navigo.originalEntries = null;
                return;
            }
            var len = sortedVisibleArticles.length;
            var sorted = len == entries.length;
            for (var i = 0; i < len && sorted; i++) {
                if (entries[i].id !== sortedVisibleArticles[i] || !filterVisible(entries[i])) {
                    sorted = false;
                }
            }
            if (!sorted) {
                entries = [].concat(originalEntries);
                entries = entries.filter(filterVisible);
                entries.sort((a, b) => {
                    return sortedVisibleArticles.indexOf(a.id) - sortedVisibleArticles.indexOf(b.id)
                });
                navigo.entries = entries;
            }
        }

        var lookupNextEntry = prototype.lookupNextEntry;
        var lookupPreviousEntry = prototype.lookupPreviousEntry;
        var getEntries = prototype.getEntries;
        var setEntries = prototype.setEntries;
        var reset = prototype.reset;

        prototype.lookupNextEntry = function (a) {
            ensureSortedEntries();
            return lookupNextEntry.call(this, this, getFFnS(ext.hideAfterReadId) ? true : a);
        };
        prototype.lookupPreviousEntry = function (a) {
            ensureSortedEntries();
            return lookupPreviousEntry.call(this, getFFnS(ext.hideAfterReadId) ? true : a);
        };
        prototype.getEntries = function () {
            ensureSortedEntries();
            return getEntries.apply(this, arguments);
        };
        prototype.setEntries = function () {
            navigo.originalEntries = null;
            return setEntries.apply(this, arguments);
        };
        prototype.reset = function () {
            navigo.originalEntries = null;
            return reset.apply(this, arguments);
        };
        prototype.listEntryIds = function () {
            var a = [];
            var entries: any[] = navigo.originalEntries || navigo.entries;
            return entries.forEach(function (b) {
                a.push(b.getId())
            }), a;
        };
    }
}
