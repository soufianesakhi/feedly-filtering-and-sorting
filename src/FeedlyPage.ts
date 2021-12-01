/// <reference path="./_references.d.ts" />

import { Article, EntryInfos } from "./Article";
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
declare var getStreamPage: FeedlyPage["getStreamPage"];
declare var getStreamObj: FeedlyPage["getStreamObj"];
declare var getService: FeedlyPage["getService"];
declare var disableOverrides: FeedlyPage["disableOverrides"];
declare var onClickCapture: FeedlyPage["onClickCapture"];
declare var fetchMoreEntries: FeedlyPage["fetchMoreEntries"];
declare var loadNextBatch: FeedlyPage["loadNextBatch"];
declare var getKeptUnreadEntryIds: FeedlyPage["getKeptUnreadEntryIds"];
declare var overrideLoadingEntries: FeedlyPage["overrideLoadingEntries"];
declare var overrideSorting: FeedlyPage["overrideSorting"];
declare var overrideNavigation: FeedlyPage["overrideNavigation"];
declare var onNewPageObserve: FeedlyPage["onNewPageObserve"];
declare var onNewArticleObserve: FeedlyPage["onNewArticleObserve"];
declare var sortArticlesDOM: FeedlyPage["sortArticlesDOM"];

declare var debugEnabled: boolean;

export class FeedlyPage {
  hiddingInfoClass = "FFnS_Hiding_Info";

  get = this.getFFnS;
  put = this.putFFnS;

  constructor() {
    this.put("ext", ext);
    this.put("SortingType", SortingType);
    injectClasses(EntryInfos, Article, ArticleSorter, ArticleSorterFactory);
    injectToWindow(
      this.getFFnS,
      this.putFFnS,
      this.getById,
      this.getArticleId,
      this.getReactPage,
      this.getStreamPage,
      this.getStreamObj,
      this.getService,
      this.onClickCapture,
      this.disableOverrides,
      this.fetchMoreEntries,
      this.loadNextBatch,
      this.getKeptUnreadEntryIds,
      this.getSortedVisibleArticles,
      debugLog,
      enableDebug,
      removeContent,
      this.sortArticlesDOM
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

  sortArticles(sub: Subscription) {
    this.sortArticlesDOM(sub.getArticleSorterConfig());
  }

  sortArticlesDOM(
    articleSorterConfig?: ArticleSorterConfig,
    sortedArticles?: SortedArticles
  ) {
    if (!articleSorterConfig) {
      articleSorterConfig = getFFnS(ext.articleSorterConfigId);
    }
    if (
      !articleSorterConfig.sortingEnabled &&
      !articleSorterConfig.pinHotToTop &&
      !sortedArticles
    ) {
      return;
    }
    debugLog(() => "Sorting articles at " + new Date().toTimeString());
    const sortedArticlesContainers: SortedArticlesContainer[] = [];
    if (sortedArticles) {
      const { visibleArticles, hiddenArticles } = sortedArticles;
      $(ext.articlesContainerSelector).each((_, container) => {
        const ids = $(container)
          .find(ext.articleAndGapSelector)
          .get()
          .map(getArticleId);
        const conatinerVisibleArticles = visibleArticles.filter((a) =>
          ids.includes(a.getEntryId())
        );
        const conatinerHiddenArticles = hiddenArticles.filter((a) =>
          ids.includes(a.getEntryId())
        );
        sortedArticlesContainers.push({
          container,
          sortedArticles: {
            visibleArticles: conatinerVisibleArticles,
            hiddenArticles: conatinerHiddenArticles,
          },
        });
      });
    } else {
      $(ext.articlesContainerSelector).each((_, container) => {
        const articles = $(container)
          .find(ext.articleAndGapSelector)
          .get()
          .map((e) => new Article(e));
        const sortedArticles =
          ArticleSorter.from(articleSorterConfig).sort(articles);
        sortedArticlesContainers.push({ container, sortedArticles });
      });
    }
    sortedArticlesContainers.forEach((sortedArticlesContainer) => {
      const articlesContainer = $(sortedArticlesContainer.container);
      const { visibleArticles, hiddenArticles } =
        sortedArticlesContainer.sortedArticles;
      let chunks = articlesContainer.find(ext.articlesChunkSelector);
      removeContent(chunks.find(".Heading"));
      let containerChunk = chunks.first();
      containerChunk.empty();
      let appendArticle = (article: Article) => {
        const container = article.getContainer();
        container.detach().appendTo(containerChunk);
      };
      visibleArticles.forEach(appendArticle);
      hiddenArticles.forEach(appendArticle);
    });
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
      executeWindow("Feedly-Page-FFnS-InitAutoLoad", this.autoLoad);
    }
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
    let removeChild = Node.prototype.removeChild;
    Node.prototype.removeChild = function (child) {
      try {
        debugLog(() => {
          if (!$(child).is(ext.articleSelector)) {
            return null;
          }
          return [
            `child: ${child["id"] || child["classList"] || child["tagName"]}`,
          ];
        }, "remove");
        return removeChild.apply(this, arguments);
      } catch (e) {
        if ($(this).hasClass(ext.articlesChunkClass)) {
          $(child).remove();
        } else {
          if (e.name !== "NotFoundError") {
            console.log(e);
          }
        }
      }
    };
    const insertBefore = Node.prototype.insertBefore;
    const appendChild = Node.prototype.appendChild;
    function insertArticleNode(_, node: HTMLElement, sibling?: Node) {
      const parent = sibling.parentNode;
      try {
        const id = getArticleId(node);
        const sortedIds = getService("navigo").entries.map((e) => e.id);
        let nextIndex = sortedIds.indexOf(id) + 1;
        if (nextIndex === sortedIds.length) {
          return parent.appendChild(node);
        } else if (nextIndex > 0 && nextIndex < sortedIds.length) {
          const nextId = sortedIds[nextIndex];
          sibling = getById(nextId);
        } else {
          sibling = null;
        }
      } catch (e) {
        console.log(e);
      }
      if (!sibling) {
        sibling = parent.firstChild;
      }
      debugLog(
        () => [
          `node: ${node["id"] || node["classList"] || node["tagName"]}`,
          "insertBefore",
          `siblingNode: ${
            sibling["id"] || sibling["classList"] || sibling["tagName"]
          }`,
        ],
        "insert"
      );
      return insertBefore.call(sibling.parentNode, node, sibling);
    }
    Node.prototype.insertBefore = function (node, siblingNode) {
      try {
        if (!disableOverrides() && $(this).hasClass(ext.articlesChunkClass)) {
          return insertArticleNode(this, node as any, siblingNode as any);
        } else {
          debugLog(() => {
            if (!$(node).is(ext.articleSelector)) {
              return null;
            }
            return [
              `node: ${node["id"] || node["classList"] || node["tagName"]}`,
              "insertBefore",
              `siblingNode: ${
                siblingNode["id"] ||
                siblingNode["classList"] ||
                siblingNode["tagName"]
              }`,
            ];
          }, "insert");
          return insertBefore.apply(this, arguments);
        }
      } catch (e) {
        console.log(e);
      }
    };
    Node.prototype.appendChild = function (child) {
      debugLog(() => {
        if (!$(child).is(ext.articleSelector)) {
          return null;
        }
        return [
          `child: ${child["id"] || child["classList"] || child["tagName"]}`,
        ];
      }, "append");
      return appendChild.apply(this, arguments);
    };
  }

  autoLoad() {
    var navigo = getService("navigo");
    navigo.initAutoLoad = true;
    navigo.setEntries(navigo.getEntries());
  }

  getStreamPage(): any {
    var observers = getService("navigo").observers;
    for (let i = 0, len = observers.length; i < len; i++) {
      let stream = observers[i].stream;
      if ((stream && stream.streamId) || observers[i]._streams) {
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

  getStreamObj(): any {
    let streamPage = getStreamPage();
    let streamObj = streamPage.stream;
    if (!streamObj) {
      streamObj = streamPage._streams[Object.keys(streamPage._streams)[0]];
    }
    return streamObj;
  }

  getService(name: string) {
    return window["streets"].service(name);
  }

  onNewPageObserve() {
    NodeCreationObserver.onCreation(ext.subscriptionChangeSelector, () => {
      if (disableOverrides()) {
        return;
      }
      let openCurrentFeedArticlesBtn = $("<button>", {
        title: "Open all current feed articles in a new tab",
        class:
          ext.openCurrentFeedArticlesClass + " " + ext.containerButtonClass,
        style: getFFnS(ext.openCurrentFeedArticlesId) ? "" : "display: none",
        type: "button",
      });
      let disableAllFiltersBtn = $("<button>", {
        class:
          ext.disableAllFiltersButtonClass + " " + ext.containerButtonClass,
        style: getFFnS(ext.disableAllFiltersButtonId) ? "" : "display: none",
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
              a.hasClass(ext.unreadArticleClass) ||
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
            let link = $(a).find(ext.articleUrlAnchorSelector).attr("href");
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
              a.removeClass(ext.unreadArticleClass).addClass(
                ext.readArticleClass
              );
            }
          });
        }
      });
      onClickCapture(disableAllFiltersBtn, (event: MouseEvent) => {
        event.stopPropagation();
        const newEnabled = !getFFnS(ext.disableAllFiltersEnabled, true);
        putFFnS(ext.disableAllFiltersEnabled, newEnabled, true);
        refreshDisableAllFiltersBtn(newEnabled);
        document.dispatchEvent(new Event('ensureSortedEntries'));
        $(`#${ext.forceRefreshArticlesId}`).click();
      });

      setTimeout(() =>{
        document.dispatchEvent(new Event('ensureSortedEntries'));
      }, 1000);
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
    const sortedVisibleArticles = Array.from(
      (container || document).querySelectorAll<HTMLElement>(
        ext.sortedArticlesSelector
      )
    )
      .filter((a) => a.style.display !== "none")
      .map((a) => getArticleId(a));
    return sortedVisibleArticles;
  }

  onNewArticleObserve() {
    var getLink = (a: JQuery) => {
      return a.find(ext.articleUrlAnchorSelector).attr("href");
    };
    var getMarkAsReadAboveBelowCallback = (entryId: string, above: boolean) => {
      return (event: MouseEvent) => {
        event.stopPropagation();
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
              a.removeClass(ext.unreadArticleClass).addClass(
                ext.readArticleClass
              );
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

    NodeCreationObserver.onCreation(ext.articleAndInlineSelector, (element) => {
      if (disableOverrides()) {
        return;
      }
      var a = $(element) as JQuery<HTMLElement>;

      var entryId = getArticleId(element as HTMLElement);

      let reader = getService("reader");
      var e = reader.lookupEntry(entryId);
      var entryInfos = $("<span>", {
        class: ext.entryInfosJsonClass,
        style: "display: none",
      });
      entryInfos.text(JSON.stringify(new EntryInfos(e.jsonInfo)));
      a.append(entryInfos);

      var cardsView = a.hasClass("u5");
      var magazineView = a.hasClass("u4");
      var inlineView = a.hasClass(ext.inlineViewClass);
      var titleView = a.hasClass("u0") && !inlineView;
      var buttonContainer = $("<span>");
      if (cardsView) {
        a.find(".EntryMarkAsReadButton").last().before(buttonContainer);
      } else if (magazineView) {
        a.find(".ago").after(buttonContainer);
      } else if (inlineView) {
        NodeCreationObserver.onCreation(
          `[id^='${entryId}'] .ShareBar__actions-left`,
          (e) => {
            $(e).append(buttonContainer);
          },
          true
        );
      } else {
        a.find(".CondensedToolbar .fx.tag-button").prepend(buttonContainer);
      }
      var addButton = (id: string, attributes) => {
        attributes.type = "button";
        attributes.style = getFFnS(id) ? "" : "display: none";
        attributes.class += " mark-as-read";
        if (titleView) {
          attributes.class += " CondensedToolbar__button";
        }
        var e = $("<button>", attributes);
        buttonContainer.append(e);
        return e;
      };
      var markAsReadAboveElement = addButton(ext.markAsReadAboveBelowId, {
        class: ext.markAsReadAboveBelowClass + " mark-above-as-read",
        title:
          "Mark articles above" +
          (cardsView ? " and on the left" : "") +
          " as read/unread",
      });
      var markAsReadBelowElement = addButton(ext.markAsReadAboveBelowId, {
        class: ext.markAsReadAboveBelowClass + " mark-below-as-read",
        title:
          "Mark articles below" +
          (cardsView ? " and on the right" : "") +
          " as read/unread",
      });
      var openAndMarkAsReadElement = addButton(ext.openAndMarkAsReadId, {
        class: ext.openAndMarkAsReadClass,
        title: "Open in a new window/tab and mark as read",
      });

      let openAndMarkAsRead = (event: MouseEvent) => {
        event.stopPropagation();
        let link = getLink(a);
        window.open(link, link);
        reader.askMarkEntryAsRead(entryId);
        if (inlineView) {
          $(a)
            .find(ext.articleTitleSelector)
            .addClass(ext.articleViewReadTitleClass);
        }
      };
      onClickCapture(openAndMarkAsReadElement, openAndMarkAsRead);

      let visualElement;
      if (cardsView) {
        visualElement = a.find(".visual-container");
      } else if (magazineView) {
        visualElement = a.find(".visual");
      }
      if (visualElement) {
        onClickCapture(visualElement, (e) => {
          if (getFFnS(ext.visualOpenAndMarkAsReadId)) {
            openAndMarkAsRead(e);
          }
        });
      }
      if (titleView) {
        onClickCapture(a.find(".content"), (e) => {
          if (getFFnS(ext.titleOpenAndMarkAsReadId)) {
            e.stopPropagation();
            reader.askMarkEntryAsRead(entryId);
          }
        });
      }

      onClickCapture(
        markAsReadBelowElement,
        getMarkAsReadAboveBelowCallback(entryId, false)
      );
      onClickCapture(
        markAsReadAboveElement,
        getMarkAsReadAboveBelowCallback(entryId, true)
      );
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
      if (!$(a).is(":visible")) {
        hiddenCount++;
      }
    });
    this.clearHidingInfo();
    if (hiddenCount == 0) {
      return;
    }
    $(ext.hidingInfoSibling).after(
      "<div class='col-xs-3 col-md-3 detail " +
        this.hiddingInfoClass +
        "'> (" +
        hiddenCount +
        " hidden entries)</div>"
    );
  }

  clearHidingInfo() {
    $("." + this.hiddingInfoClass).remove();
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

  getById(id: string): HTMLElement {
    return document.querySelector(`.EntryList__chunk > [id^='${id}']`);
  }

  getArticleId(e: HTMLElement) {
    return e
      .getAttribute("id")
      .replace(/_inlineFrame$/, "")
      .replace(/_main$/, "");
  }

  fetchMoreEntries(batchSize: number) {
    var autoLoadingMessageId = "FFnS_LoadingMessage";
    let stream = getStreamPage().stream;
    if ($(".message.loading").length == 0) {
      $(ext.articlesContainerSelector)
        .first()
        .before(
          $("<div>", {
            id: autoLoadingMessageId,
            class: "message loading",
            text: "Auto loading all articles",
          })
        );
    }
    stream.setBatchSize(batchSize);
    debugLog(
      () =>
        "Fetching more articles (batch size: " +
        stream._batchSize +
        ") at: " +
        new Date().toTimeString()
    );
    stream.askMoreEntries();
    stream.askingMoreEntries = false;
  }

  loadNextBatch(ev?: MouseEvent) {
    ev && ev.stopPropagation();
    let navigo = getService("navigo");
    let entries: any[] = navigo.originalEntries || navigo.getEntries();
    let markAsReadEntryIds: string[];
    if (getFFnS(ext.keepArticlesUnreadId)) {
      markAsReadEntryIds = getFFnS(ext.articlesToMarkAsReadId);
    } else {
      markAsReadEntryIds = entries
        .sort((a, b) => {
          return a.jsonInfo.crawled - b.jsonInfo.crawled;
        })
        .map<string>((e) => {
          return e.id;
        });
    }
    let keptUnreadEntryIds = getKeptUnreadEntryIds();
    markAsReadEntryIds = markAsReadEntryIds.filter((id) => {
      return keptUnreadEntryIds.indexOf(id) < 0;
    });
    let reader = getService("reader");
    reader.askMarkEntriesAsRead(markAsReadEntryIds, {});
    window.scrollTo(0, 0);
    $(ext.articlesContainerSelector).empty();
    navigo.originalEntries = null;
    navigo.entries = [];
    fetchMoreEntries(getFFnS(ext.batchSizeId, true));
  }

  overrideLoadingEntries() {
    let streamObj = getStreamObj();
    if (!streamObj) {
      setTimeout(overrideLoadingEntries, 1000);
      return;
    }
    putFFnS(ext.isNewestFirstId, streamObj._sort === "newest", true);

    var autoLoadingMessageId = "#FFnS_LoadingMessage";
    var loadNextBatchBtnId = "#FFnS_LoadNextBatchBtn";
    var secondaryMarkAsReadBtnsSelector = ".mark-as-read-button.secondary";
    var loadByBatchText = "Mark batch as read and load next batch";
    var autoLoadAllArticleDefaultBatchSize = 1000;

    var isAutoLoad: () => boolean = () => {
      try {
        return (
          getStreamPage() != null &&
          ($(ext.articleSelector).length == 0 ||
            $(ext.unreadArticlesCountSelector).length > 0) &&
          !(getStreamPage().stream.state.info.subscribed === false) &&
          getFFnS(ext.autoLoadAllArticlesId, true)
        );
      } catch (e) {
        return false;
      }
    };

    var prototype = Object.getPrototypeOf(streamObj);
    var setBatchSize: Function = prototype.setBatchSize;
    prototype.setBatchSize = function (customSize?: number) {
      if (disableOverrides()) {
        return setBatchSize.apply(this, arguments);
      }
      if (this._batchSize == customSize) {
        return;
      }
      if (isAutoLoad()) {
        this._batchSize = customSize;
      } else {
        setBatchSize.apply(this, arguments);
      }
    };

    var navigoPrototype = Object.getPrototypeOf(getService("navigo"));
    var setEntries = navigoPrototype.setEntries;
    navigoPrototype.setEntries = function (entries: any[]) {
      if (disableOverrides()) {
        return setEntries.apply(this, arguments);
      }
      try {
        if (entries.length > 0) {
          setTimeout(() => document.dispatchEvent(new Event('ensureSortedEntries')), 500);
        }
        if (
          entries.length > 0 &&
          entries[entries.length - 1].jsonInfo.unread &&
          isAutoLoad()
        ) {
          let isLoadByBatch = getFFnS(ext.loadByBatchEnabledId, true);
          let firstLoadByBatch = false;
          let navigo = getService("navigo");
          if (navigo.initAutoLoad) {
            navigo.initAutoLoad = false;
            firstLoadByBatch = isLoadByBatch;
          }
          const streamPage = getStreamPage();
          streamPage._scrollTarget.removeEventListener(
            "scroll",
            streamPage._throttledCheckMoreEntriesNeeded
          );
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
          if (
            !hasAllEntries &&
            !stream.askingMoreEntries &&
            !stream.state.isLoadingEntries &&
            isBatchLoading &&
            $(loadNextBatchBtnId).length == 0
          ) {
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
              debugLog(
                () =>
                  "End auto load all articles at: " + new Date().toTimeString()
              );
              if (isLoadByBatch) {
                $(loadNextBatchBtnId).remove();
              }
            } else if (isLoadByBatch && $(loadNextBatchBtnId).length == 0) {
              $(ext.articlesContainerSelector)
                .last()
                .after(
                  $("<button>", {
                    id: loadNextBatchBtnId.substring(1),
                    class: "full-width secondary",
                    type: "button",
                    style: "margin-top: 1%;",
                    text: loadByBatchText,
                  })
                );
              onClickCapture($(loadNextBatchBtnId), loadNextBatch);
            }
          }
        }
        setTimeout(() => {
          let markAsReadEntries = $(ext.markAsReadImmediatelySelector);
          if (markAsReadEntries.length == 0) {
            return;
          }
          let ids = $.map<HTMLElement, string>(
            markAsReadEntries.toArray(),
            (e) => getArticleId(e)
          );
          let reader = getService("reader");
          reader.askMarkEntriesAsRead(ids, {});
          markAsReadEntries
            .removeClass(ext.markAsReadImmediatelyClass)
            .each((_, e) => {
              const a = $(e);
              if (a.hasClass(ext.inlineViewClass)) {
                a.find(ext.articleTitleSelector).addClass(
                  ext.articleViewReadTitleClass
                );
              } else {
                a.removeClass(ext.unreadArticleClass).addClass(
                  ext.readArticleClass
                );
              }
            });
        }, 1000);
      } catch (e) {
        console.log(e);
      }
      return setEntries.apply(this, arguments);
    };

    NodeCreationObserver.onCreation(ext.loadingMessageSelector, (e) => {
      if (disableOverrides()) {
        return;
      }
      if ($(autoLoadingMessageId).length == 1) {
        $(e).hide();
      }
    });

    NodeCreationObserver.onCreation(secondaryMarkAsReadBtnsSelector, (e) => {
      if (disableOverrides()) {
        return;
      }
      if (getFFnS(ext.loadByBatchEnabledId, true)) {
        $(secondaryMarkAsReadBtnsSelector).attr("title", loadByBatchText);
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
          let navigo = getService("navigo");
          if (navigo.getNextURI()) {
            readingManager._jumpToNext.call(readingManager);
          } else {
            this.feedly.loadDefaultPage();
          }
        } else {
          this._askRefreshCurrentPage();
        }
      };
      if (lastEntryObject && lastEntryObject.asOf) {
        askMarkPageAsRead.call(readingManager, lastEntryObject);
      } else if (
        getFFnS(ext.loadByBatchEnabledId, true) &&
        !getStreamPage().stream.state.hasAllEntries
      ) {
        loadNextBatch();
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
    var prototype = Object.getPrototypeOf(getService("navigo"));
    function ensureSortedEntries() {
      const articleSorterConfig: ArticleSorterConfig = getFFnS(
        ext.articleSorterConfigId
      );
      if (
        !articleSorterConfig ||
        (!articleSorterConfig.sortingEnabled &&
          !articleSorterConfig.filteringEnabled &&
          !articleSorterConfig.pinHotToTop)
      ) {
        return;
      }
      debugLog(() => "start", "ensureSortedEntries");
      let navigo = getService("navigo");
      var entries: any[] = navigo.entries;
      var originalEntries: any[] = navigo.originalEntries || entries;
      navigo.originalEntries = originalEntries;

      const pageArticles = Array.from(
        document.querySelectorAll<HTMLElement>(ext.pageArticlesSelector)
      ).map((a) => getArticleId(a));
      const addedArticles = entries.filter((e) => ! pageArticles.includes(e.id))
        .map(e => e.id);

      if (articleSorterConfig.filteringEnabled) {
        const visibleArticles = getSortedVisibleArticles();
        navigo.entries = entries.filter((e) => addedArticles.includes(e.id) || visibleArticles.includes(e.id));
      }
      
      const sorter = ArticleSorter.from(articleSorterConfig);
      if (!articleSorterConfig.sortingEnabled && !articleSorterConfig.pinHotToTop) {
        const articles: Article[] = navigo.originalEntries
          .map((e) => getById(e.id))
          .filter((e) => e != null)
          .map((e) => new Article(e));
        var visibleEntryIds: string[] = getSortedVisibleArticles();
        const entryIds = articles.map((a) => a.getEntryId()).filter(id => visibleEntryIds.includes(id));
        for (var i = 0; i < visibleEntryIds.length; i++) {
          if (entryIds[i] !== visibleEntryIds[i]) {
            return sortArticlesDOM(articleSorterConfig, sorter.prepare(articles));
          }
        }
        return;
      }
      let sorted = false;
      let len = 0;
      $(ext.articlesContainerSelector).each((_, container) => {
        var sortedVisibleArticles: string[] =
          getSortedVisibleArticles(container);
        if (!sortedVisibleArticles) {
          navigo.entries = originalEntries;
          navigo.originalEntries = null;
          return;
        }
        len += sortedVisibleArticles.length;
        const visibleEntryIds = navigo.entries.map((e) => e.id as string);
        for (var i = 0; i < sortedVisibleArticles.length && sorted; i++) {
          if (visibleEntryIds[i] !== sortedVisibleArticles[i]) {
            debugLog(
              () => [
                "entries not sorted",
                "\n\t" +
                  visibleEntryIds
                    .slice(Math.max(0, i - 1), Math.min(i + 2, entries.length))
                    .map((id) => new Article(getById(id)).getTitle())
                    .join("\n\t"),
                "\nvisible:\n\t" +
                  sortedVisibleArticles
                    .slice(Math.max(0, i - 1), Math.min(i + 2, entries.length))
                    .map((id) => new Article(getById(id)).getTitle())
                    .join("\n\t"),
              ],
              "ensureSortedEntries"
            );
            sorted = false;
          }
        }
      });
      if (!sorted && len > 0) {
        debugLog(() => "sorting entries", "ensureSortedEntries");
        try {
          const articles = navigo.originalEntries.map(
            (e) => new Article(getById(e.id))
          );
          const sortedArticles = sorter.sort(articles);
          const { visibleArticles } = sortedArticles;
          const idToEntry = {};
          navigo.originalEntries.forEach((e) => (idToEntry[e.id] = e));
          entries = visibleArticles.map((a) => idToEntry[a.getEntryId()]);
          debugLog(
            () => [
              "sorted entries",
              "\n\t" +
                entries
                  .slice(0, Math.min(5, entries.length))
                  .map((e) => e.getTitle())
                  .join("\n\t"),
            ],
            "ensureSortedEntries"
          );
          navigo.entries = entries;
          sortArticlesDOM(articleSorterConfig, sortedArticles);
        } catch (e) {
          debugLog(
            () => ["!!", e.name, e.message, "!!"],
            "ensureSortedEntries"
          );
          setTimeout(ensureSortedEntries, 500);
        }
      }
      debugLog(() => "end", "ensureSortedEntries");
    }
    document.addEventListener("ensureSortedEntries", ensureSortedEntries);

    var lookupNextEntry = prototype.lookupNextEntry;
    var lookupPreviousEntry = prototype.lookupPreviousEntry;
    var getEntries = prototype.getEntries;
    var setEntries = prototype.setEntries;
    var reset = prototype.reset;

    prototype.lookupNextEntry = function (a) {
      if (disableOverrides()) {
        return lookupNextEntry.apply(this, arguments);
      }
      ensureSortedEntries();
      const result = lookupNextEntry.call(
        this,
        getFFnS(ext.hideAfterReadId) ? true : a
      );
      debugLog(
        () => [
          "this.selectedEntryId: " + this.selectedEntryId,
          "result: " + (result && result.getTitle()),
        ],
        "lookupNextEntry"
      );
      return result;
    };
    prototype.lookupPreviousEntry = function (a) {
      if (disableOverrides()) {
        return lookupPreviousEntry.apply(this, arguments);
      }
      ensureSortedEntries();
      const result = lookupPreviousEntry.call(
        this,
        getFFnS(ext.hideAfterReadId) ? true : a
      );
      debugLog(
        () => [
          "this.selectedEntryId: " + this.selectedEntryId,
          "result: " + (result && result.getTitle()),
        ],
        "lookupPreviousEntry"
      );
      return result;
    };
    prototype.getEntries = function () {
      if (disableOverrides()) {
        return getEntries.apply(this, arguments);
      }
      try {
        ensureSortedEntries();
      } catch (e) {
        console.log(e);
      }
      return getEntries.apply(this, arguments);
    };
    prototype.setEntries = function () {
      if (disableOverrides()) {
        return setEntries.apply(this, arguments);
      }
      let navigo = getService("navigo");
      navigo.originalEntries = null;
      return setEntries.apply(this, arguments);
    };
    prototype.reset = function () {
      let navigo = getService("navigo");
      navigo.originalEntries = null;
      return reset.apply(this, arguments);
    };
    const listEntryIds = prototype.listEntryIds;
    prototype.listEntryIds = function () {
      if (disableOverrides()) {
        return listEntryIds.apply(this, arguments);
      }
      let navigo = getService("navigo");
      var a = [];
      var entries: any[] = navigo.originalEntries || navigo.entries;
      return (
        entries.forEach(function (b) {
          a.push(b.getId());
        }),
        a
      );
    };
  }

  overrideNavigation() {
    var prototype = Object.getPrototypeOf(getService("navigo"));
    const collectionPrefix = "collection/content/";
    const allCategorySuffix = "category/global.all";
    const getNextURI = prototype.getNextURI;
    prototype.getNextURI = function () {
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

    const readingManager = Object.getPrototypeOf(getService("readingManager"));
    const _jumpToNext = readingManager._jumpToNext;
    readingManager._jumpToNext = () => {
      if (!disableOverrides()) {
        putFFnS(ext.navigatingToNextId, true);
      }
      return _jumpToNext.apply(getService("readingManager"), arguments);
    };
  }
}

interface SortedArticlesContainer {
  container: Element;
  sortedArticles: SortedArticles;
}

const page = typeof FeedlyPage;
