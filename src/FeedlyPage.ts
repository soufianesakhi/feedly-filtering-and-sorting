/// <reference path="./_references.d.ts" />

import { Subscription } from "./Subscription";
import { SubscriptionManager } from "./SubscriptionManager";
import { EntryInfos } from "./ArticleManager";
import { executeWindow, injectToWindow, injectStyleText, injecClasses } from "./Utils";

declare var onOpenEntryAndMarkAsRead: (event: MouseEvent) => any;
declare var getFFnS: (id: string) => any;
declare var putFFnS: (id: string, value: any) => void;

export class FeedlyPage {
    hiddingInfoClass = "FFnS_Hiding_Info";

    constructor() {
        this.put("ext", ext);
        injectToWindow(["getFFnS", "putFFnS"], this.get, this.put);
        injecClasses(EntryInfos);
        executeWindow("Feedly-Page-FFnS.js", this.initWindow, this.onNewArticle, this.overrideMarkAsRead, this.overrideNavigation);
    }

    update(sub: Subscription) {
        this.updateCheck(sub.isOpenAndMarkAsRead(), ext.openAndMarkAsReadId, ext.openAndMarkAsReadClass);
        this.updateCheck(sub.isMarkAsReadAboveBelow(), ext.markAsReadAboveBelowId, ext.markAsReadAboveBelowClass);
        if (sub.getAdvancedControlsReceivedPeriod().keepUnread) {
            this.put(ext.keepNewArticlesUnreadId, true);
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
    }

    onNewArticle() {
        var reader = window["streets"].service('reader');
        var onClick = (element: JQuery, callback: (event: MouseEvent) => any) => {
            element.get(0).addEventListener('click', callback, true);
        }
        var getMarkAsReadAboveBelowCallback = (entryId: string, above: boolean) => {
            return (event: MouseEvent) => {
                event.stopPropagation();
                var sortedVisibleArticles: String[] = getFFnS(ext.sortedVisibleArticlesId);
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
                for (var i = start; i < endExcl; i++) {
                    reader.askMarkEntryAsRead(sortedVisibleArticles[i]);
                }
            }
        }

        NodeCreationObserver.onCreation(ext.articleSelector + " .content", element => {
            var a = $(element).closest(ext.articleSelector);
            var entryId = a.attr(ext.articleEntryIdAttribute);

            var e = reader.lookupEntry(entryId);
            putFFnS(entryId, new EntryInfos(e.jsonInfo));

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
                    a.find(".condensed-tools .button-dropdown > :first-child").before(e);
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

    put(id: string, value: any) {
        sessionStorage.setItem("FFnS_" + id, JSON.stringify(value));
    }


    get(id: string) {
        return JSON.parse(sessionStorage.getItem("FFnS_" + id));
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

    overrideNavigation() {
        function getId(id) {
            return document.getElementById(id + "_main");
        }
        function isRead(id) {
            return $(getId(id)).hasClass(ext.readArticleClass);
        }
        function removed(id): boolean {
            return getId(id) == null;
        }
        function lookupEntry(unreadOnly, isPrevious: boolean) {
            var selectedEntryId = this.navigo.selectedEntryId;
            var found = false;
            this.getSelectedEntryId() || (found = true);
            var sortedVisibleArticles: String[] = getFFnS(ext.sortedVisibleArticlesId);
            var len = sortedVisibleArticles.length;
            for (var c = 0; c < len; c++) {
                var index = isPrevious ? len - 1 - c : c;
                var entry = sortedVisibleArticles[index];
                if (found) {
                    if (removed(entry)) {
                        continue;
                    }
                    if (unreadOnly) {
                        if (!isRead(entry)) return entry;
                        continue;
                    }
                    return entry;
                }
                entry === this.getSelectedEntryId() && (found = true)
            }
            return null;
        }
        var prototype = window["devhd"].pkg("pages").ReactPage.prototype;
        var onEntry = function (unreadOnly, b, isPrevious: boolean) {
            var entryId = lookupEntry.call(this, unreadOnly, isPrevious);
            entryId
                ? b ? (this.uninlineEntry(), this.selectEntry(entryId, 'toview'), this.shouldMarkAsReadOnNP() && this.reader.askMarkEntryAsRead(entryId))
                    : this.inlineEntry(entryId, !0)
                : this.signs.setMessage(isPrevious ? 'At start' : 'At end')
        }
        prototype.onPreviousEntry = function (unreadOnly, b) {
            onEntry.call(this, unreadOnly, b, true);
        }
        prototype.onNextEntry = function (unreadOnly, b) {
            onEntry.call(this, unreadOnly, b, false);
        }
    }
}
