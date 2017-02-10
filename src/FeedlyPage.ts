/// <reference path="./_references.d.ts" />

import { Subscription } from "./Subscription";
import { SubscriptionManager } from "./SubscriptionManager";
import { EntryInfos } from "./ArticleManager";
import { executeWindow, injectToWindow, injectStyleText, injecClasses } from "./Utils";

declare var getFFnS: (id: string, persistent?: boolean) => any;
declare var putFFnS: (id: string, value: any, persistent?: boolean) => any;
declare var getById: (id: string) => any;

export class FeedlyPage {
    hiddingInfoClass = "FFnS_Hiding_Info";

    constructor() {
        this.put("ext", ext);
        injectToWindow(["getFFnS", "putFFnS", "getById"], this.get, this.put, this.getById);
        injecClasses(EntryInfos);
        executeWindow("Feedly-Page-FFnS.js", this.initWindow, this.onNewPage, this.onNewArticle, this.overrideMarkAsRead, this.overrideSorting);
    }

    update(sub: Subscription) {
        this.updateCheck(sub.isOpenAndMarkAsRead(), ext.openAndMarkAsReadId, ext.openAndMarkAsReadClass);
        this.updateCheck(sub.isMarkAsReadAboveBelow(), ext.markAsReadAboveBelowId, ext.markAsReadAboveBelowClass);
        if (sub.getAdvancedControlsReceivedPeriod().keepUnread) {
            this.put(ext.keepNewArticlesUnreadId, true);
        } if (sub.isHideWhenMarkAboveBelow()) {
            this.put(ext.hideWhenMarkAboveBelowId, true);
        }
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

    onNewPage() {
        NodeCreationObserver.onCreation(ext.subscriptionChangeSelector, () => {
            var stream = window["streets"].service("navigo").observers[0].stream;
            putFFnS(ext.isNewestFirstId, stream._sort === "newest", true);
        });
    }

    onNewArticle() {
        var reader = window["streets"].service('reader');
        var navigo = window["streets"].service("navigo");
        var onClick = (element: JQuery, callback: (event: MouseEvent) => any) => {
            element.get(0).addEventListener('click', callback, true);
        }
        var getMarkAsReadAboveBelowCallback = (entryId: string, above: boolean) => {
            return (event: MouseEvent) => {
                event.stopPropagation();
                var sortedVisibleArticles: string[] = getFFnS(ext.sortedVisibleArticlesId);
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
                    reader.askMarkEntryAsRead(id);
                    if (hide) {
                        $(getById(id)).remove();
                    }
                }
            }
        }

        NodeCreationObserver.onCreation(ext.articleSelector + ", .condensed-tools .button-dropdown", element => {
            var notDropdown = !$(element).hasClass("button-dropdown");
            if (notDropdown) {
                // Auto load more entries
                var loadedUnreadEntries = navigo.entries.length;
                if ($(ext.notFollowedPageSelector).length == 0 &&
                    loadedUnreadEntries == $(ext.articleSelector).length &&
                    getFFnS(ext.autoLoadAllArticlesId, true)) {

                    var stream = navigo.observers[0].stream;
                    var unreadCount = reader.getStreamUnreadCount(stream.streamId);
                    if (unreadCount > loadedUnreadEntries) {
                        stream.askUpdateQuery({
                            unreadOnly: true,
                            featured: stream._featured,
                            sort: "newest",
                            batchSize: unreadCount
                        });
                    }
                }
            }

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
                title: "Mark articles below" + (cardsView ? " and on the right" : "") + " as read",
            });
            var markAsReadAboveElement = addButton(ext.markAsReadAboveBelowId, {
                class: ext.markAsReadAboveBelowClass + " mark-above-as-read",
                title: "Mark articles above" + (cardsView ? " and on the left" : "") + " as read"
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

    overrideMarkAsRead() {
        var pagesPkg = window["devhd"].pkg("pages");
        function markEntryAsRead(id, thisArg) {
            pagesPkg.BasePage.prototype.buryEntry.call(thisArg, id);
        }
        function getLastReadEntry(oldLastEntryObject, thisArg) {
            if ((oldLastEntryObject != null && oldLastEntryObject.asOf != null) || getFFnS(ext.keepNewArticlesUnreadId) == null) {
                return oldLastEntryObject;
            }
            var idsToMarkAsRead: string[] = getFFnS(ext.articlesToMarkAsReadId);
            if (idsToMarkAsRead != null) {
                idsToMarkAsRead.forEach(id => {
                    markEntryAsRead(id, thisArg)
                });
            }
            var lastReadEntryId = getFFnS(ext.lastReadEntryId);
            if (lastReadEntryId == null) {
                return null;
            }
            return { lastReadEntryId: lastReadEntryId };
        }

        var feedlyListPagePrototype = pagesPkg.ReactPage.prototype;
        var oldMarkAllAsRead: Function = feedlyListPagePrototype.markAsRead;
        feedlyListPagePrototype.markAsRead = function (oldLastEntryObject) {
            var lastEntryObject = getLastReadEntry(oldLastEntryObject, this);
            if (!getFFnS(ext.keepNewArticlesUnreadId) || lastEntryObject) {
                oldMarkAllAsRead.call(this, lastEntryObject);
            }
            if (!(oldLastEntryObject && oldLastEntryObject.asOf)) {
                this.feedly.jumpToNext();
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
            if ($(ext.articleSelector).length != originalEntries.length) {
                navigo.originalEntries = null;
                return;
            } else {
                navigo.originalEntries = originalEntries;
            }
            var sortedVisibleArticles: String[] = getFFnS(ext.sortedVisibleArticlesId);
            if (!sortedVisibleArticles) {
                navigo.entries = originalEntries;
                navigo.originalEntries = null;
                return;
            }
            var len = sortedVisibleArticles.length;
            var sorted = true;
            for (var i = 0; i < len && sorted; i++) {
                if (entries[i].id !== sortedVisibleArticles[i]) {
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

        prototype.lookupNextEntry = function () {
            ensureSortedEntries();
            return lookupNextEntry.apply(this, arguments);
        };
        prototype.lookupPreviousEntry = function () {
            ensureSortedEntries();
            return lookupPreviousEntry.apply(this, arguments);
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
    }
}
