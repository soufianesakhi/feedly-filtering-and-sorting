/// <reference path="./_references.d.ts" />

import { Subscription } from "./Subscription";
import { SubscriptionManager } from "./SubscriptionManager";
import { executeWindow, injectToWindow } from "./Utils";

declare var onOpenEntryAndMarkAsRead: (event: MouseEvent) => any;
declare var getFFnS: (id: string) => any;

export class FeedlyPage {
    hiddingInfoClass = "FFnS_Hiding_Info";

    constructor(subscriptionManager: SubscriptionManager) {
        this.put("ext", ext);
        injectToWindow(["getFFnS"], this.getFFnS);
        executeWindow(this.initWindow, this.onNewArticle, this.overrideMarkAsRead, this.overrideNavigation);
    }

    update(sub: Subscription) {
        if (sub.isOpenAndMarkAsRead()) {
            this.put(ext.isOpenAndMarkAsReadId, true);
            $(".open-in-new-tab-button").show();
        }
        if (sub.getAdvancedControlsReceivedPeriod().keepUnread) {
            this.put(ext.keepNewArticlesUnreadId, true);
        }
    }

    initWindow() {
        window["ext"] = getFFnS("ext");
    }

    onNewArticle() {
        NodeCreationObserver.onCreation(ext.articleSelector + " .content", element => {
            var a = $(element).closest(ext.articleSelector);
            var style = "display: none"
            if (getFFnS(ext.isOpenAndMarkAsReadId)) {
                style = "";
            }
            var attributes = {
                class: "open-in-new-tab-button mark-as-read",
                title: "Open in a new window/tab and mark as read",
                type: "button",
                style: style
            };
            if (a.hasClass("u0")) {
                attributes.class += " tertiary button-icon-only-micro icon";
            }
            var e = $("<button>", attributes);
            if (a.hasClass("u5")) {
                a.find(".mark-as-read").before(e);
            } else if ($(a).hasClass("u4")) {
                a.find(".ago").after(e);
            } else {
                a.find(".condensed-tools .button-dropdown > :first-child").before(e);
            }

            var link = $(a).find(".title").attr("href");
            var entryId = $(a).attr(ext.articleEntryIdAttribute);
            e.get(0).addEventListener('click', event => {
                window.open(link, '_blank');
                window["streets"].service('reader').askMarkEntryAsRead(entryId);
                event.stopPropagation();
            }, true);
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
        sessionStorage.setItem("FFnS_" + id, JSON.stringify(value));
    }


    getFFnS(id: string) {
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
            this.feedly.jumpToNext();
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
        function getSortedVisibleArticles(): String[] {
            return getFFnS(ext.sortedVisibleArticlesId);
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