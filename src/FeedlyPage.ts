/// <reference path="./_references.d.ts" />

import { Article, Entry, EntryInfos, SortableArticle } from "./Article";
import {
  ArticleSorter,
  ArticleSorterConfig,
  ArticleSorterFactory,
  SortedArticles,
} from "./ArticleSorter";
import { SortingType } from "./DataTypes";
import { enableDebug } from "./Main";
import { Subscription } from "./Subscription";
import {
  debugLog,
  executeWindow,
  injectClasses,
  injectToWindow,
  removeContent,
} from "./Utils";

declare var getFFnS: FeedlyPage["getFFnS"];
declare var putFFnS: FeedlyPage["putFFnS"];
declare var getById: FeedlyPage["getById"];
declare var getArticleId: FeedlyPage["getArticleId"];
declare var getSortedVisibleArticles: FeedlyPage["getSortedVisibleArticles"];
declare var getStream: FeedlyPage["getStream"];
declare var getService: FeedlyPage["getService"];
declare var disableOverrides: FeedlyPage["disableOverrides"];
declare var onClickCapture: FeedlyPage["onClickCapture"];
declare var fetchMoreEntries: FeedlyPage["fetchMoreEntries"];
declare var getKeptUnreadEntryIds: FeedlyPage["getKeptUnreadEntryIds"];
declare var overrideLoadingEntries: FeedlyPage["overrideLoadingEntries"];
declare var overrideSorting: FeedlyPage["overrideSorting"];
declare var overrideNavigation: FeedlyPage["overrideNavigation"];
declare var onNewPageObserve: FeedlyPage["onNewPageObserve"];
declare var onNewArticleObserve: FeedlyPage["onNewArticleObserve"];
declare var refreshHidingInfo: FeedlyPage["refreshHidingInfo"];
declare var isAutoLoad: FeedlyPage["isAutoLoad"];

declare var debugEnabled: boolean;

export class FeedlyPage {
  get = this.getFFnS;
  put = this.putFFnS;

  constructor() {
    this.put("ext", ext);
    this.put("SortingType", SortingType);
    injectClasses(
      EntryInfos,
      Entry,
      Article,
      ArticleSorter,
      ArticleSorterFactory
    );
    injectToWindow(
      this.getFFnS,
      this.putFFnS,
      this.getById,
      this.getArticleId,
      this.getReactPage,
      this.getStream,
      this.getService,
      this.onClickCapture,
      this.disableOverrides,
      this.fetchMoreEntries,
      this.getKeptUnreadEntryIds,
      this.getSortedVisibleArticles,
      debugLog,
      enableDebug,
      removeContent,
      this.isAutoLoad,
      this.refreshHidingInfo
    );
    injectToWindow(this.overrideLoadingEntries);
    injectToWindow(this.overrideSorting);
    injectToWindow(this.overrideNavigation);
    injectToWindow(this.onNewPageObserve);
    injectToWindow(this.onNewArticleObserve);
    executeWindow("Feedly-Page-FFnS", this.initWindow, this.overrideMarkAsRead);
  }

  update(sub: Subscription) {
    this.updateCheck(
      sub.isOpenAndMarkAsRead(),
      ext.openAndMarkAsReadId,
      ext.openAndMarkAsReadClass
    );
    this.updateCheck(
      sub.isMarkAsReadAboveBelow(),
      ext.markAsReadAboveBelowId,
      ext.markAsReadAboveBelowClass
    );
    this.updateCheck(
      sub.isOpenCurrentFeedArticles(),
      ext.openCurrentFeedArticlesId,
      ext.openCurrentFeedArticlesClass
    );
    this.updateCheck(
      sub.isDisplayDisableAllFiltersButton(),
      ext.disableAllFiltersButtonId,
      ext.disableAllFiltersButtonClass
    );
    const filteringByReadingTime = sub.getFilteringByReadingTime();
    if (
      sub.getAdvancedControlsReceivedPeriod().keepUnread ||
      (filteringByReadingTime.enabled && filteringByReadingTime.keepUnread)
    ) {
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
    this.put(
      ext.openCurrentFeedArticlesUnreadOnlyId,
      sub.isOpenCurrentFeedArticlesUnreadOnly()
    );
    this.put(
      ext.maxOpenCurrentFeedArticlesId,
      sub.getMaxOpenCurrentFeedArticles()
    );
    this.put(
      ext.markAsReadOnOpenCurrentFeedArticlesId,
      sub.isMarkAsReadOnOpenCurrentFeedArticles()
    );
    this.put(ext.disablePageOverridesId, sub.isDisablePageOverrides());
    this.put(ext.articleSorterConfigId, sub.getArticleSorterConfig());
  }

  sortArticles() {
    document.dispatchEvent(new Event("refreshSorting"));
  }

  isAutoLoad() {
    try {
      return (
        getStream() != null &&
        !(getStream().state.info.subscribed === false) &&
        getFFnS(ext.autoLoadAllArticlesId, true)
      );
    } catch (e) {
      return false;
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

  initAutoLoad() {
    executeWindow("Feedly-Page-FFnS-InitAutoLoad", this.autoLoad);
  }

  initWindow() {
    window["ext"] = getFFnS("ext");
    window["SortingType"] = getFFnS("SortingType");
    window["articleSorterFactory"] = new ArticleSorterFactory();
    window["debugEnabled"] = localStorage.getItem("debug_enabled") === "true";
    NodeCreationObserver.init("observed-page");
    overrideLoadingEntries();
    overrideSorting();
    overrideNavigation();
    onNewPageObserve();
    onNewArticleObserve();
  }

  autoLoad() {
    if (getService("preferences").content.autoSelectOnScroll !== "no") {
      const articleSorterConfig: ArticleSorterConfig = getFFnS(
        ext.articleSorterConfigId
      );
      if (
        articleSorterConfig &&
        (articleSorterConfig.sortingEnabled || articleSorterConfig.pinHotToTop)
      ) {
        putFFnS(ext.autoLoadAllArticlesId, true, true);
      }
    }
    if (getFFnS(ext.autoLoadAllArticlesId, true)) {
      var navigo = getService("navigo");
      navigo.initAutoLoad = true;
      navigo.setEntries(navigo.getEntries());
    }
  }

  getStream(): any {
    if (getStream["stream"]) {
      return getStream["stream"];
    }
    var observers = getService("personalcollections").observers;
    for (let i = 0, len = observers.length; i < len; i++) {
      if (observers[i].streamId && observers[i]._batchSize > 1) {
        return observers[i];
      }
    }
  }

  getReactPage(): any {
    var observers = getService("feedly").observers;
    for (let i = 0, len = observers.length; i < len; i++) {
      const prototype = Object.getPrototypeOf(observers[i]);
      if (prototype.markAsRead) {
        return observers[i];
      }
    }
  }

  getService(name: string) {
    return window["streets"].service(name);
  }

  onNewPageObserve() {
    NodeCreationObserver.onCreation(ext.subscriptionChangeSelector, () => {
      if (disableOverrides()) {
        return;
      }
      let openCurrentFeedArticlesBtn = $("<div>", {
        title: "Open all current feed articles in a new tab",
        class:
          ext.openCurrentFeedArticlesClass + " " + ext.containerButtonClass,
        style: getFFnS(ext.openCurrentFeedArticlesId)
          ? "cursor: pointer;"
          : "display: none",
        type: "button",
      });
      let disableAllFiltersBtn = $("<div>", {
        class:
          ext.disableAllFiltersButtonClass + " " + ext.containerButtonClass,
        style: getFFnS(ext.disableAllFiltersButtonId)
          ? "cursor: pointer;"
          : "display: none",
        type: "button",
      });
      function refreshDisableAllFiltersBtn(enabled: boolean) {
        disableAllFiltersBtn.attr(
          "title",
          `${enabled ? "Restore" : "Disable all"} filters`
        );
        if (enabled) {
          disableAllFiltersBtn.addClass("enabled");
        } else {
          disableAllFiltersBtn.removeClass("enabled");
        }
      }
      refreshDisableAllFiltersBtn(getFFnS(ext.disableAllFiltersEnabled, true));

      let feedButtonsContainer = $(`<div id='${ext.buttonsContainerId}'>`);
      feedButtonsContainer.append(openCurrentFeedArticlesBtn);
      feedButtonsContainer.append(disableAllFiltersBtn);
      $("header.header").parent().after(feedButtonsContainer);

      onClickCapture(openCurrentFeedArticlesBtn, (event: MouseEvent) => {
        event.stopPropagation();
        let articlesToOpen = getSortedVisibleArticles();
        if (articlesToOpen.length == 0) {
          return;
        }
        if (getFFnS(ext.openCurrentFeedArticlesUnreadOnlyId)) {
          articlesToOpen = articlesToOpen.filter((id) => {
            const a = $(getById(id));
            return (
              !a.hasClass(ext.readArticleClass) ||
              (a.hasClass(ext.inlineViewClass) &&
                a.find(ext.articleViewReadSelector).length === 0)
            );
          });
        }
        let max = getFFnS(ext.maxOpenCurrentFeedArticlesId);
        if (max && max > 0) {
          if (max < articlesToOpen.length) {
            articlesToOpen.length = max;
          }
        }
        articlesToOpen
          .map((id) => getById(id))
          .forEach((a) => {
            let link = $(a)
              .find(
                $(a).is(".titleOnly,.magazine,.cards")
                  ? "a[target='_blank']"
                  : ext.articleViewUrlAnchorSelector
              )
              .attr("href");
            window.open(link, link);
          });
        if (getFFnS(ext.markAsReadOnOpenCurrentFeedArticlesId)) {
          let reader = getService("reader");
          articlesToOpen.forEach((entryId) => {
            reader.askMarkEntryAsRead(entryId);
            const a = $(getById(entryId));
            if (a.hasClass(ext.inlineViewClass)) {
              a.find(ext.articleTitleSelector).addClass(
                ext.articleViewReadTitleClass
              );
            } else {
              a.addClass(ext.readArticleClass);
            }
          });
        }
      });
      onClickCapture(disableAllFiltersBtn, (event: MouseEvent) => {
        event.stopPropagation();
        const newEnabled = !getFFnS(ext.disableAllFiltersEnabled, true);
        putFFnS(ext.disableAllFiltersEnabled, newEnabled, true);
        refreshDisableAllFiltersBtn(newEnabled);
        document.dispatchEvent(new Event("refreshSorting"));
        $(`#${ext.forceRefreshArticlesId}`).click();
      });
    });

    NodeCreationObserver.onCreation(ext.layoutChangeSelector, (e) => {
      $(e).click(() =>
        setTimeout(() => $(`#${ext.forceRefreshArticlesId}`).click(), 1000)
      );
    });
  }

  disableOverrides(): boolean {
    let disable = getFFnS(ext.disablePageOverridesId);
    disable =
      disable || !new RegExp(ext.supportedURLsPattern, "i").test(document.URL);
    return disable;
  }

  onClickCapture(element: JQuery, callback: (event: MouseEvent) => any): void {
    element.get(0).addEventListener("click", callback, true);
  }

  getKeptUnreadEntryIds() {
    let navigo = getService("navigo");
    let entries: any[] = navigo.originalEntries || navigo.getEntries();
    let keptUnreadEntryIds = entries
      .filter((e) => {
        return e.wasKeptUnread();
      })
      .map<string>((e) => {
        return e.id;
      });
    return keptUnreadEntryIds;
  }

  getSortedVisibleArticles(container?: Element): string[] {
    const sortedVisibleArticles = getStream()
      .state.entries.sort((a, b) => b.sortingIndex - a.sortingIndex)
      .map((e) => e.id);
    return sortedVisibleArticles;
  }

  onNewArticleObserve() {
    var getLink = (a: JQuery) => {
      return a
        .find(
          a.is(".titleOnly,.magazine,.cards")
            ? "a[target='_blank']"
            : ext.articleViewUrlAnchorSelector
        )
        .attr("href");
    };
    var getMarkAsReadAboveBelowCallback = (above: boolean) => {
      return (event: MouseEvent) => {
        event.stopPropagation();
        const entryId = getArticleId(
          $(event.target as HTMLElement)
            .closest("article")
            .get(0)
        );
        var sortedVisibleArticles = getSortedVisibleArticles();
        var markAsRead = getFFnS(ext.markAsReadAboveBelowReadId);
        if (markAsRead) {
          let keptUnreadEntryIds = getKeptUnreadEntryIds();
          sortedVisibleArticles = sortedVisibleArticles.filter((id) => {
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
        let reader = getService("reader");
        for (var i = start; i < endExcl; i++) {
          var id = sortedVisibleArticles[i];
          if (markAsRead) {
            reader.askMarkEntryAsRead(id);
            const a = $(getById(id));
            if (a.hasClass(ext.inlineViewClass)) {
              a.find(ext.articleTitleSelector).addClass(
                ext.articleViewReadTitleClass
              );
            } else {
              a.addClass(ext.readArticleClass);
            }
            if (hide) {
              $(getById(id)).remove();
            }
          } else {
            reader.askKeepEntryAsUnread(id);
          }
        }
      };
    };

    const openAndMarkAsRead = (event: MouseEvent) => {
      event.stopPropagation();
      const article = $(event.target as HTMLElement).closest("article");
      const link = getLink(article);
      const entryId = getArticleId(article.get(0));
      const inlineView = article.hasClass(ext.inlineViewClass);
      const reader = getService("reader");

      window.open(link, link);
      reader.askMarkEntryAsRead(entryId);
      if (inlineView) {
        article
          .find(ext.articleTitleSelector)
          .addClass(ext.articleViewReadTitleClass);
      }
    };

    const createButtonContainer = (cardsView = false) => {
      const buttonContainer = $("<span>", {
        class: ext.buttonContainerClass,
      });

      const addButton = (id: string, attributes) => {
        attributes.type = "button";
        attributes.style = getFFnS(id) ? "cursor: pointer;" : "display: none";
        attributes.class += " mark-as-read";
        var e = $("<div>", attributes);
        buttonContainer.append(e);
        return e;
      };

      const markAsReadAboveElement = addButton(ext.markAsReadAboveBelowId, {
        class: ext.markAsReadAboveBelowClass + " mark-above-as-read",
        title:
          "Mark articles above" +
          (cardsView ? " and on the left" : "") +
          " as read/unread",
      });
      const markAsReadBelowElement = addButton(ext.markAsReadAboveBelowId, {
        class: ext.markAsReadAboveBelowClass + " mark-below-as-read",
        title:
          "Mark articles below" +
          (cardsView ? " and on the right" : "") +
          " as read/unread",
      });
      const openAndMarkAsReadElement = addButton(ext.openAndMarkAsReadId, {
        class: ext.openAndMarkAsReadClass,
        title: "Open in a new window/tab and mark as read",
      });

      onClickCapture(openAndMarkAsReadElement, openAndMarkAsRead);
      onClickCapture(
        markAsReadBelowElement,
        getMarkAsReadAboveBelowCallback(false)
      );
      onClickCapture(
        markAsReadAboveElement,
        getMarkAsReadAboveBelowCallback(true)
      );

      return buttonContainer;
    };

    NodeCreationObserver.onCreation(".CardEntry__toolbar", (e) => {
      const buttonContainer = createButtonContainer(true);
      $(e).prepend(buttonContainer);
    });
    NodeCreationObserver.onCreation(".TitleOnlyEntry__toolbar", (e) => {
      const buttonContainer = createButtonContainer();
      $(e).prepend(buttonContainer);
    });
    NodeCreationObserver.onCreation(".MagazineLayout__toolbar", (e) => {
      const buttonContainer = createButtonContainer();
      $(e).prepend(buttonContainer);
    });

    NodeCreationObserver.onCreation(ext.articleAndInlineSelector, (element) =>
      setTimeout(() => {
        if (disableOverrides()) {
          return;
        }
        var a = $(element) as JQuery<HTMLElement>;

        let articleIdElement = element as HTMLElement;
        if (!a.is(ext.articleIdFromFrameSelector)) {
          articleIdElement = a.find(ext.articleIdFromFrameSelector).get(0);
        }
        var entryId = getArticleId(articleIdElement);

        let reader = getService("reader");
        var e = reader.lookupEntry(entryId);
        var entryInfos = $("<span>", {
          class: ext.entryInfosJsonClass,
          style: "display: none",
        });
        entryInfos.text(JSON.stringify(e ? new EntryInfos(e.jsonInfo) : {}));
        a.append(entryInfos);

        var cardsView = a.hasClass("cards");
        var magazineView = a.hasClass("magazine");
        var inlineView = a.hasClass(ext.inlineViewClass);
        var titleView = a.hasClass("titleOnly") && !inlineView;

        if (inlineView) {
          const buttonContainer = createButtonContainer();
          a.find(".ShareBar__actions-left").after(buttonContainer);
        }
        if (cardsView || magazineView) {
          let visualElement = a.find(ext.articleVisualSelector);
          onClickCapture(visualElement, (e) => {
            if (getFFnS(ext.visualOpenAndMarkAsReadId)) {
              openAndMarkAsRead(e);
            }
          });
        }
        if (titleView) {
          onClickCapture(a.find(ext.articleTitleSelector), (e) => {
            if (getFFnS(ext.titleOpenAndMarkAsReadId)) {
              e.stopPropagation();
              e.preventDefault();
              const link = getLink(a);
              window.open(link, link);
              reader.askMarkEntryAsRead(entryId);
            }
          });
        }
      }, 900)
    );
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
    if ($(".FFnS-sorting,.FFnS-loading").length > 0) {
      return;
    }
    var hiddenCount = 0;
    $(ext.articleSelector).each((i, a) => {
      if (!$(a).is(":visible")) {
        hiddenCount++;
      }
    });
    $(".FFnS_Hiding_Info").remove();
    if (hiddenCount == 0) {
      return;
    }
    $(ext.hidingInfoSibling).after(
      "<div class='col-xs-3 col-md-3 detail FFnS_Hiding_Info'> (" +
        hiddenCount +
        " hidden entries)</div>"
    );
  }

  clearHidingInfo() {
    $(".FFnS_Hiding_Info").remove();
  }

  putFFnS(id: string, value: any, persistent?: boolean) {
    sessionStorage.setItem(
      "FFnS" + (persistent ? "#" : "_") + id,
      JSON.stringify(value)
    );
  }

  getFFnS(id: string, persistent?: boolean) {
    return JSON.parse(
      sessionStorage.getItem("FFnS" + (persistent ? "#" : "_") + id)
    );
  }

  getById(id: string) {
    const article = document.querySelector(`article[id^='${id}']`);
    const container = $(article).closest(ext.articleSelector).get(0);
    return container as HTMLElement;
  }

  getArticleId(e: HTMLElement) {
    return e.getAttribute("id").replace(/_main$/, "");
  }

  fetchMoreEntries() {
    let stream = getStream();
    stream.setAutoLoadBatchSize();
    $(".FFnS-sorting").remove();
    if ($(".FFnS-loading").length == 0) {
      $(ext.headerSelector).after(
        `<div class='FFnS-loading'>
              <div class='FFnS-loading-animation'><div></div><div></div><div></div><div></div></div>
              <span>Auto loading all articles</span>
            </div>`
      );
    }
    debugLog(
      () =>
        "[Fetching] load with batch size: " +
        stream._batchSize +
        " at: " +
        new Date().toTimeString()
    );
    stream.askMoreEntries();
  }

  overrideLoadingEntries() {
    function overrideStream() {
      let stream = getStream();
      if (!stream) {
        setTimeout(overrideStream, 1000);
        return;
      }
      putFFnS(ext.isNewestFirstId, stream._sort === "newest", true);
      var autoLoadAllArticleDefaultBatchSize = 1000;

      let batchSize = stream._batchSize;
      Object.defineProperty(stream, "_batchSize", {
        get() {
          return batchSize;
        },
        set(_batchSize) {
          batchSize = _batchSize;
        },
        enumerable: true,
        configurable: true,
      });
      stream.setAutoLoadBatchSize = () => {
        batchSize = Math.min(
          stream.state.info.unreadCount,
          autoLoadAllArticleDefaultBatchSize
        );
      };
    }

    function checkAutoLoad() {
      try {
        let entries = getStream().state.entries;
        if (!entries?.length) {
          return;
        }
        if (!getStream().setAutoLoadBatchSize) {
          overrideStream();
        }
        var stream = getStream();
        if (isAutoLoad()) {
          if (!stream.state.hasAllEntries) {
            setTimeout(() => {
              $(".FFnS_Hiding_Info").hide();
              fetchMoreEntries();
            }, 100);
          } else {
            debugLog(() => `[Fetching] End at: ${new Date().toTimeString()}`);
            $(".FFnS-loading").remove();
            setTimeout(() => refreshHidingInfo, 200);
          }
        }

        // Mark as read filtered articles (advanced settings)
        let reader = getService("reader");
        let markAsReadEntries = $(ext.markAsReadImmediatelySelector);
        if (markAsReadEntries.length == 0) {
          return;
        }
        let ids = $.map<Element, string>(markAsReadEntries.toArray(), (e) =>
          $(e)
            .attr("id")
            .replace(/_main$/, "")
        );
        ids.forEach((id) => {
          reader.askMarkEntryAsRead(id);
          const a = $(getById(id));
          if (a.hasClass(ext.inlineViewClass)) {
            a.find(ext.articleTitleSelector).addClass(
              ext.articleViewReadTitleClass
            );
          } else {
            a.addClass(ext.readArticleClass);
          }
        });
      } catch (e) {
        console.log(e);
      }
    }
    document.addEventListener("checkAutoLoad", checkAutoLoad);

    NodeCreationObserver.onCreation(ext.loadingMessageSelector, (e) => {
      if (disableOverrides()) {
        return;
      }
      if ($(ext.loadingElementSelector).length > 0) {
        $(e).hide();
      }
    });
  }

  overrideMarkAsRead() {
    var prototype = Object.getPrototypeOf(getService("readingManager"));
    var askMarkPageAsRead: Function = prototype.askMarkPageAsRead;
    prototype.askMarkPageAsRead = function (lastEntryObject) {
      let readingManager = getService("readingManager");
      if (disableOverrides()) {
        return askMarkPageAsRead.apply(readingManager, arguments);
      }
      let jumpToNext = () => {
        if (document.URL.indexOf("category/global.") < 0) {
          readingManager._jumpToNext.call(readingManager);
        } else {
          this._askRefreshCurrentPage();
        }
      };
      if (lastEntryObject && lastEntryObject.asOf) {
        askMarkPageAsRead.call(readingManager, lastEntryObject);
      } else if (getFFnS(ext.keepArticlesUnreadId)) {
        debugLog(() => "Marking as read with keeping new articles unread");

        var idsToMarkAsRead: string[] = getFFnS(ext.articlesToMarkAsReadId);
        if (idsToMarkAsRead) {
          let keptUnreadEntryIds = getKeptUnreadEntryIds();
          idsToMarkAsRead = idsToMarkAsRead.filter((id) => {
            return keptUnreadEntryIds.indexOf(id) < 0;
          });
          debugLog(
            () =>
              idsToMarkAsRead.length + " new articles will be marked as read"
          );
          let reader = getService("reader");
          reader.askMarkEntriesAsRead(idsToMarkAsRead, {});
        } else {
          debugLog(() => "No article to mark as read");
        }
        jumpToNext();
      } else {
        askMarkPageAsRead.call(readingManager, lastEntryObject);
      }
    };
  }

  overrideSorting() {
    const reader = getService("reader");
    const prototype = Object.getPrototypeOf(reader);
    const lookupStream: Function = prototype.lookupStream;
    prototype.lookupStream = function () {
      const stream = lookupStream.apply(this, arguments);
      if (disableOverrides()) {
        return stream;
      }
      const prototype = Object.getPrototypeOf(stream);
      const _updateState: Function = prototype._updateState;
      if (!prototype._updateState["FFnS_override"]) {
        prototype._updateState = function (key, value, ...args) {
          if (key === "entries") {
            const articleSorterConfig: ArticleSorterConfig = getFFnS(
              ext.articleSorterConfigId
            );
            if (
              articleSorterConfig &&
              (articleSorterConfig.sortingEnabled ||
                articleSorterConfig.pinHotToTop)
            ) {
              const entries: Entry[] = value.map((e) => new Entry(e));
              const sorter = ArticleSorter.from<Entry>(articleSorterConfig);
              const { visibleArticles } = sorter.sort(entries);
              value = visibleArticles.map((e) => e.get());
              setTimeout(() => {
                document.dispatchEvent(new Event("checkAutoLoad"));
              }, 100);
            }
          }
          _updateState.apply(this, [key, value, ...args]);
        };
        prototype._updateState["FFnS_override"] = true;
      }
      getStream["stream"] = stream;
      return stream;
    };

    function refreshSorting() {
      const sortingConfig =
        document.URL + JSON.stringify(getFFnS(ext.articleSorterConfigId));
      if (refreshSorting["sortingConfig"] != sortingConfig) {
        refreshSorting["sortingConfig"] = sortingConfig;
        getService("pageManager").refreshPage();
      }
    }
    document.addEventListener("refreshSorting", refreshSorting);
    refreshSorting();
  }

  overrideNavigation() {
    const readingManager = getService("readingManager");
    const readingManagerPrototype = Object.getPrototypeOf(
      getService("readingManager")
    );
    const collectionPrefix = "collection/content/";
    const allCategorySuffix = "category/global.all";
    const getNextURI = readingManagerPrototype.getNextURI;
    readingManager.getNextURI = function () {
      if (disableOverrides()) {
        return getNextURI.apply(this, arguments);
      }
      let nextURI = this.nextURI;
      if (getFFnS(ext.navigatingToNextId)) {
        putFFnS(ext.navigatingToNextId, false);
        const currentCategory = document.URL.replace(
          new RegExp(ext.categoryUrlPrefixPattern, "i"),
          ""
        );
        if (
          nextURI &&
          nextURI.endsWith(allCategorySuffix) &&
          currentCategory == allCategorySuffix
        ) {
          nextURI = null;
        }
        if (!nextURI) {
          try {
            let categories = JSON.parse(
              getService("preferences").getPreference("categoriesOrderingId")
            );
            return collectionPrefix + categories[0];
          } catch (e) {
            console.log(e);
          }
        }
      }
      return nextURI;
    };

    const _jumpToNext = readingManagerPrototype._jumpToNext;
    readingManager._jumpToNext = () => {
      if (!disableOverrides()) {
        putFFnS(ext.navigatingToNextId, true);
      }
      return _jumpToNext.apply(getService("readingManager"), arguments);
    };
  }
}

const page = typeof FeedlyPage;
