/// <reference path="./_references.d.ts" />

import { SubscriptionManager } from "./SubscriptionManager";

export class FeedlyPage {
    public eval = window["eval"];
    hiddingInfoClass = "FFnS_Hiding_Info";
    reader: FeedlyReader;
    subscriptionManager: SubscriptionManager;

    constructor(subscriptionManager: SubscriptionManager) {
        this.subscriptionManager = subscriptionManager;
        this.eval("(" + this.overrideMarkAsRead.toString() + ")();");
        this.eval("(" + this.overrideNavigation.toString() + ")();");
        this.eval("window.ext = (" + JSON.stringify(ext).replace(/\s+/g, ' ') + ");");
        this.reader = new FeedlyReader(this);
        this.initStyling();
    }

    onNewArticle(a: Element) {
        var reader = this.reader;
        var link = $(a).find(".title").attr("href");
        var entryId = $(a).attr(ext.articleEntryIdAttribute);
        var attributes = {
            class: "open-in-new-tab-button mark-as-read",
            title: "Open in a new window/tab and mark as read",
            type: "button"
        };
        if ($(a).hasClass("u0")) {
            attributes.class += " tertiary button-icon-only-micro icon";
        }
        var e = $("<button>", attributes);
        this.onClick(e.get(0), event => {
            window.open(link, '_blank');
            reader.askMarkEntryAsRead(entryId);
            event.stopPropagation();
        });
        if ($(a).hasClass("u5")) {
            $(a).find(".mark-as-read").before(e);
        } else if ($(a).hasClass("u4")) {
            $(a).find(".ago").after(e);
        } else {
            $(a).find(".condensed-tools .button-dropdown > :first-child").before(e);
        }
    }

    onClick(e: Element, listener: (event: MouseEvent) => any) {
        e.addEventListener('click', listener, true);
    }

    initStyling() {
        NodeCreationObserver.onCreation("header > h1", (e) => {
            $(e).removeClass("col-md-4").addClass("col-md-6");
        })
    }

    reset() {
        this.clearHiddingInfo();
        this.eval("window.FFnS = ({});");
    }

    showHiddingInfo() {
        var hiddenCount = 0;
        $(ext.articleSelector).each((i, a) => {
            if ($(a).css("display") === "none") {
                hiddenCount++;
            }
        })
        if (hiddenCount == 0) {
            return;
        }
        this.clearHiddingInfo();
        $(ext.hidingInfoSibling).after("<div class='detail " + this.hiddingInfoClass + "'> (" + hiddenCount + " hidden entries)</div>");
    }

    clearHiddingInfo() {
        $("." + this.hiddingInfoClass).remove();
    }

    put(id: string, value: any) {
        this.eval("window.FFnS['" + id + "'] = " + JSON.stringify(value) + ";");
    }

    overrideMarkAsRead() {
        var pagesPkg = window["devhd"].pkg("pages");
        function get(id: string) {
            return window["FFnS"][id];
        }
        function markEntryAsRead(id, thisArg) {
            pagesPkg.BasePage.prototype.buryEntry.call(thisArg, id);
        }
        function getLastReadEntry(oldLastEntryObject, thisArg) {
            if ((oldLastEntryObject != null && oldLastEntryObject.asOf != null) || get(ext.keepNewArticlesUnreadId) == null) {
                return oldLastEntryObject;
            }
            var idsToMarkAsRead: string[] = get(ext.articlesToMarkAsReadId);
            if (idsToMarkAsRead != null) {
                idsToMarkAsRead.forEach(id => {
                    markEntryAsRead(id, thisArg)
                });
            }
            var lastReadEntryId = get(ext.lastReadEntryId);
            if (lastReadEntryId == null) {
                return null;
            }
            return { lastReadEntryId: lastReadEntryId };
        }

        var feedlyListPagePrototype = pagesPkg.ReactPage.prototype;
        var oldMarkAllAsRead: Function = feedlyListPagePrototype.markAsRead;
        feedlyListPagePrototype.markAsRead = function (oldLastEntryObject) {
            var lastEntryObject = getLastReadEntry(oldLastEntryObject, this);
            if (!get(ext.keepNewArticlesUnreadId) || lastEntryObject) {
                oldMarkAllAsRead.call(this, lastEntryObject);
            }
            this.feedly.jumpToNext();
        }
    }

    overrideNavigation() {
        function get(id) {
            return document.getElementById(id + "_main");
        }
        function isRead(id) {
            return $(get(id)).hasClass(ext.readArticleClass);
        }
        function removed(id): boolean {
            return get(id) == null;
        }
        function getSortedVisibleArticles(): String[] {
            return window["FFnS"][ext.sortedVisibleArticlesId];
        }
        function lookupEntry(unreadOnly, isPrevious: boolean) {
            var selectedEntryId = this.navigo.selectedEntryId;
            var found = false;
            this.getSelectedEntryId() || (found = true);
            var sortedVisibleArticles = getSortedVisibleArticles();
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

class FeedlyReader {
    eval;
    constructor(page: FeedlyPage) {
        this.eval = page.eval;
    }
    askMarkEntryAsRead(entryId: string) {
        this.eval("window.streets.service('reader').askMarkEntryAsRead('" + entryId + "');");
    }
}