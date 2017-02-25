/// <reference path="./_references.d.ts" />

import { Subscription } from "./Subscription";
import { SubscriptionManager } from "./SubscriptionManager";
import { EntryInfos } from "./ArticleManager";
import { executeWindow, injectToWindow, injectStyleText, injectClasses } from "./Utils";

declare var getFFnS: (id: string, persistent?: boolean) => any;
declare var putFFnS: (id: string, value: any, persistent?: boolean) => any;
declare var getById: (id: string) => any;
declare var getStreamPage: () => any;

export class FeedlyPage {
    hiddingInfoClass = "FFnS_Hiding_Info";

    constructor() {
        this.put("ext", ext);
        injectToWindow(["getFFnS", "putFFnS", "getById", "getStreamPage"],
            this.get, this.put, this.getById, this.getStreamPage);
        injectClasses(EntryInfos);
        executeWindow("Feedly-Page-FFnS.js", this.initWindow, this.overrideLoadingEntries, this.overrideMarkAsRead, this.overrideSorting, this.onNewPage, this.onNewArticle);
    }

    update(sub: Subscription) {
        this.updateCheck(sub.isOpenAndMarkAsRead(), ext.openAndMarkAsReadId, ext.openAndMarkAsReadClass);
        this.updateCheck(sub.isMarkAsReadAboveBelow(), ext.markAsReadAboveBelowId, ext.markAsReadAboveBelowClass);
        if (sub.getAdvancedControlsReceivedPeriod().keepUnread) {
            this.put(ext.keepNewArticlesUnreadId, true);
        }
        if (sub.isHideWhenMarkAboveBelow()) {
            this.put(ext.hideWhenMarkAboveBelowId, true);
        }
        if (sub.isHideAfterRead()) {
            this.put(ext.hideAfterReadId, true);
        }
        this.put(ext.markAsReadAboveBelowReadId, sub.isMarkAsReadAboveBelowRead());
    }

    updateCheck(enabled: boolean, id: string, className: string) {
        if (enabled) {
            this.put(id, true);
            $("." + className).css("display", "");
        } else {
            $("." + className).css("display", "none");
        }
    }

    initWindow() {
        window["ext"] = getFFnS("ext");
        NodeCreationObserver.init("observed-page");
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
            putFFnS(ext.isNewestFirstId, getStreamPage().stream._sort === "newest", true);
        });
    }

    onNewArticle() {
        var reader = window["streets"].service('reader');
        var onClick = (element: JQuery, callback: (event: MouseEvent) => any) => {
            element.get(0).addEventListener('click', callback, true);
        }
        var getMarkAsReadAboveBelowCallback = (entryId: string, above: boolean) => {
            return (event: MouseEvent) => {
                event.stopPropagation();
                var sortedVisibleArticles: string[] = getFFnS(ext.sortedVisibleArticlesId);
                if (!sortedVisibleArticles) {
                    sortedVisibleArticles = [];
                    $(ext.articleSelector).each((i, a) => {
                        sortedVisibleArticles.push($(a).attr(ext.articleEntryIdAttribute));
                    });
                }
                var markAsRead = getFFnS(ext.markAsReadAboveBelowReadId);
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
            var addButton = (id: string, attributes) => {
                attributes.type = "button";
                attributes.style = getFFnS(id) ? "" : "display: none";
                attributes.class += " mark-as-read";
                if (a.hasClass("u0")) {
                    attributes.class += " condensed-toolbar-icon icon";
                }
                var e = $("<button>", attributes);
                if (cardsView) {
                    a.find(".mark-as-read").last().before(e);
                } else if (a.hasClass("u4")) {
                    attributes.style += "margin-right: 10px;"
                    a.find(".ago").after(e);
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

            var link = a.find(".title").attr("href");
            onClick(openAndMarkAsReadElement, event => {
                event.stopPropagation();
                window.open(link, '_blank');
                reader.askMarkEntryAsRead(entryId);
            });
            onClick(markAsReadBelowElement, getMarkAsReadAboveBelowCallback(entryId, false));
            onClick(markAsReadAboveElement, getMarkAsReadAboveBelowCallback(entryId, true));
        });
    }

    reset() {
        this.clearHiddingInfo();
        var i = sessionStorage.length;
        while (i--) {
            var key = sessionStorage.key(i);
            if (/^FFnS_/.test(key)) {
                sessionStorage.removeItem(key);
            }
        }
    }

    showHiddingInfo() {
        var hiddenCount = 0;
        $(ext.articleSelector).each((i, a) => {
            if ($(a).css("display") === "none") {
                hiddenCount++;
            }
        })
        this.clearHiddingInfo();
        if (hiddenCount == 0) {
            return;
        }
        $(ext.hidingInfoSibling).after("<div class='detail " + this.hiddingInfoClass + "'> (" + hiddenCount + " hidden entries)</div>");
    }

    clearHiddingInfo() {
        $("." + this.hiddingInfoClass).remove();
    }

    put(id: string, value: any, persistent?: boolean) {
        sessionStorage.setItem("FFnS" + (persistent ? "#" : "_") + id, JSON.stringify(value));
    }

    get(id: string, persistent?: boolean) {
        return JSON.parse(sessionStorage.getItem("FFnS" + (persistent ? "#" : "_") + id));
    }

    getById(id: string) {
        return document.getElementById(id + "_main");
    }

    overrideLoadingEntries() {
        var autoLoadingMessageId = "#FFnS_LoadingMessage";
        var navigo = window["streets"].service("navigo");
        var stream = getStreamPage().stream;
        var autoLoadAllArticleBatchSize = 1000;

        var isAutoLoad: () => boolean = () => {
            return getStreamPage() != null &&
                ($(ext.articleSelector).length == 0 || $(ext.unreadArticlesSelector).length > 0)
                && $(ext.notFollowedPageSelector).length == 0
                && getFFnS(ext.autoLoadAllArticlesId, true);
        };

        var prototype = Object.getPrototypeOf(stream);
        var setBatchSize: Function = prototype.setBatchSize;
        prototype.setBatchSize = function () {
            if (isAutoLoad()) {
                this._batchSize = autoLoadAllArticleBatchSize;
            } else {
                setBatchSize.apply(this, arguments);
            }
        }

        var navigoPrototype = Object.getPrototypeOf(navigo);
        var setEntries = navigoPrototype.setEntries;
        navigoPrototype.setEntries = function (entries: any[]) {
            if (entries.length > 0 && entries[0].jsonInfo.unread && isAutoLoad()) {
                var stream = getStreamPage().stream;
                var hasAllEntries = stream.state.hasAllEntries;
                if (!hasAllEntries && !stream.askingMoreEntries && !stream.state.isLoadingEntries) {
                    stream.askingMoreEntries = true;
                    setTimeout(() => {
                        if ($(".message.loading").length == 0) {
                            $(ext.articleSelector).first().parent()
                                .before("<div id='FFnS_LoadingMessage' class='message loading'>Auto loading all articles</div>");
                        }
                        if (stream._batchSize != autoLoadAllArticleBatchSize) {
                            stream.setBatchSize();
                        }
                        console.log("Fetching more articles (batch size: " + stream._batchSize + ") at: " + new Date().toTimeString());
                        stream.askMoreEntries();
                        stream.askingMoreEntries = false;
                    }, 100);
                } else if (hasAllEntries && $(autoLoadingMessageId).length == 1) {
                    $(autoLoadingMessageId).remove();
                    console.log("End auto load all articles at: " + new Date().toTimeString());
                }
            }
            return setEntries.apply(this, arguments);
        };

        NodeCreationObserver.onCreation(ext.loadingMessageSelector, (e) => {
            if ($(autoLoadingMessageId).length == 1) {
                $(e).hide();
            }
        })
    }

    overrideMarkAsRead() {
        var reader = window["streets"].service('reader');
        var navigo = window["streets"].service("navigo");
        var pagesPkg = window["devhd"].pkg("pages");

        var prototype = pagesPkg.ReactPage.prototype;
        var markAsRead: Function = prototype.markAsRead;
        prototype.markAsRead = function (lastEntryObject) {
            if (getFFnS(ext.keepNewArticlesUnreadId) && !(lastEntryObject && lastEntryObject.asOf)) {
                console.log("Marking as read with keeping new articles unread");

                var idsToMarkAsRead: string[] = getFFnS(ext.articlesToMarkAsReadId);
                if (idsToMarkAsRead) {
                    console.log(idsToMarkAsRead.length + " new articles will be marked as read");
                    idsToMarkAsRead.forEach(id => {
                        reader.askMarkEntryAsRead(id);
                    });
                }
                var lastReadEntryId = getFFnS(ext.lastReadEntryId);
                console.log("The last read entry id: " + lastReadEntryId);
                if (lastReadEntryId) {
                    lastEntryObject = { lastReadEntryId: lastReadEntryId, partial: true };
                    reader.askMarkStreamAsRead(navigo.getMarkAsReadScope(), lastEntryObject, function () {
                        console.log("Marked page partially as read: " + JSON.stringify(lastEntryObject));
                    }, function (a, c) {
                        console.log(c);
                    });
                }

                navigo.getNextURI() ?
                    this.feedly.jumpToNext() :
                    this.feedly.loadDefaultPage();
            } else {
                markAsRead.call(this, lastEntryObject);
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
