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
declare var sortArticlesDOM: FeedlyPage["sortArticlesDOM"];
declare var refreshHidingInfo: FeedlyPage["refreshHidingInfo"];
declare var displaySortingAnimation: FeedlyPage["displaySortingAnimation"];
declare var isAutoLoad: FeedlyPage["isAutoLoad"];

declare var debugEnabled: boolean;

export class FeedlyPage {
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
      this.sortArticlesDOM,
      this.displaySortingAnimation,
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
    document.dispatchEvent(new Event("ensureSortedEntries"));
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

  displaySortingAnimation(visible) {
    if (visible) {
      $(".FFnS_Hiding_Info").hide();
      if ($(".FFnS-sorting,.FFnS-loading").length == 0) {
        $(ext.headerSelector).after(
          `<div class='FFnS-sorting'>
                <div class='FFnS-loading-animation'><div></div><div></div><div></div><div></div></div>
                <span>Sorting and filtering articles</span>
              </div>`
        );
      }
    } else {
      $(".FFnS-sorting").remove();
      (this.refreshHidingInfo || refreshHidingInfo)();
    }
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
    debugLog(() => "sort at " + new Date().toTimeString(), "Sorting");
    displaySortingAnimation(true);
    if (!sortedArticles) {
      const articles = $(ext.articlesContainerSelector)
        .find(ext.articleAndGapSelector)
        .get()
        .map((e) => new Article(e));
      sortedArticles = ArticleSorter.from(articleSorterConfig).sort(articles);
    }
    const { visibleArticles, hiddenArticles } = sortedArticles;
    let articlePredecessor;
    for (let e of document.querySelector(ext.articlesContainerSelector)
      .children) {
      if (
        $(e.nextSibling).is(ext.standardArticleEntrySelector) ||
        $(e.nextSibling).is(ext.inlineArticleFrameSelector)
      ) {
        articlePredecessor = e;
        break;
      }
    }
    let appendArticle = (article: Article) => {
      const container = article.getContainer();
      $(articlePredecessor).after(container);
    };
    hiddenArticles.forEach(appendArticle);
    visibleArticles.reverse().forEach(appendArticle);
    setTimeout(() => {
      displaySortingAnimation(false);
    }, 100);
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
    //   let removeChild = Node.prototype.removeChild;
    //   Node.prototype.removeChild = function (child) {
    //     try {
    //       // debugLog(() => {
    //       //   if (!$(child).is(ext.articleAndInlineSelector)) {
    //       //     return null;
    //       //   }
    //       //   return [
    //       //     `child: ${child["id"] || child["classList"] || child["tagName"]}`,
    //       //   ];
    //       // }, "remove");
    //       return removeChild.apply(this, arguments);
    //     } catch (e) {
    //       if (e.name !== "NotFoundError") {
    //         console.log(e);
    //       }
    //     }
    //   };
    //   const insertBefore = Node.prototype.insertBefore;
    //   const appendChild = Node.prototype.appendChild;
    //   window["appendChildOriginal"] = appendChild;
    //   function insertArticleNode(
    //     _,
    //     node: HTMLElement,
    //     parent: HTMLElement,
    //     originalSibling: HTMLElement | null = null
    //   ) {
    //     let sibling = null;
    //     try {
    //       let id = "";
    //       try {
    //         if (node.hasAttribute("id")) {
    //           id = getArticleId(node);
    //         } else if (originalSibling) {
    //           const siblingId = getArticleId(originalSibling);
    //           const entries: any[] = getService("reader").entries;
    //           const originalIds = entries.map((e) => e.getId());
    //           const originalSiblingIndex = originalIds.findIndex(
    //             (id) => id == siblingId
    //           );
    //           if (originalSiblingIndex > 0) {
    //             id = originalIds[originalSiblingIndex - 1];
    //           }
    //         }
    //       } catch (error) {}
    //       if (id) {
    //         const sortedIds = getService("reader").entries.map((e) => e.id);
    //         const nextIndex = sortedIds.indexOf(id) + 1;
    //         if (nextIndex === sortedIds.length) {
    //           return appendChild.call(parent, node);
    //         } else if (nextIndex > 0 && nextIndex < sortedIds.length) {
    //           let nextId = sortedIds[nextIndex];
    //           sibling = getById(nextId);
    //           if (!sibling && nextIndex + 1 < sortedIds.length) {
    //             sibling = getById(sortedIds[nextIndex + 1]);
    //           }
    //         } else {
    //           sibling = null;
    //         }
    //       }
    //     } catch (e) {
    //       console.log(e);
    //     }
    //     if (!sibling) {
    //       return appendChild.call(parent, node);
    //     }
    //     return insertBefore.call(sibling.parentNode, node, sibling);
    //   }
    //   Node.prototype.insertBefore = function (node, siblingNode) {
    //     try {
    //       if (!disableOverrides()) {
    //         return insertArticleNode(
    //           this,
    //           node as any,
    //           siblingNode.parentNode || this,
    //           siblingNode as HTMLElement
    //         );
    //       } else {
    //         return insertBefore.apply(this, arguments);
    //       }
    //     } catch (e) {
    //       console.log(e);
    //     }
    //   };
    //   Node.prototype.appendChild = function (child) {
    //     if (
    //       !disableOverrides() &&
    //       ($(child).is(ext.inlineArticleFrameSelector) ||
    //         $(child).is(ext.readArticleSelector) ||
    //         ($(child).is(ext.unreadArticleSelector) &&
    //           getFFnS(ext.navigatingEntry)))
    //     ) {
    //       return insertArticleNode(this, child as any, this);
    //     } else {
    //       const result = appendChild.apply(this, arguments);
    //       return result;
    //     }
    //   };
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
        document.dispatchEvent(new Event("ensureSortedEntries"));
        $(`#${ext.forceRefreshArticlesId}`).click();
      });

      document.dispatchEvent(new Event("ensureSortedEntries"));
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
      // $(e).closest(".MagazineLayout__content").find(".EntryMetadata .ago").after(buttonContainer);
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

      let entries = stream.state.entries;
      Object.defineProperty(stream.state, "entries", {
        get() {
          return entries;
        },
        set(_entries) {
          entries = _entries;
          if (disableOverrides()) {
            return;
          }
          debugLog(() => `set entries`, "Fetching");
          checkAutoLoad();
        },
        enumerable: true,
        configurable: true,
      });
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
        setTimeout(() => {
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
              document.dispatchEvent(new Event("ensureSortedEntries"));
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
        }, 300);
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
    reader.previousEntriesCount = Object.keys(reader.entries).length;
    setInterval(() => {
      if (Object.keys(reader.entries).length != reader.previousEntriesCount) {
        reader.previousEntriesCount = Object.keys(reader.entries).length;
        ensureSortedEntries();
        document.dispatchEvent(new Event("checkAutoLoad"));
      }
    }, 1000);

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
      $(ext.articlesH2Selector).hide();
      $(ext.headerSelector).css("margin-bottom", "20px");
      if (isAutoLoad()) {
        displaySortingAnimation(true);
      }
      let timeoutId = +localStorage.getItem("ensureSortedEntriesTimeoutId");
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        try {
          localStorage.setItem("ensureSortedEntriesTimeoutId", "");
          checkSortedEntries(articleSorterConfig);
        } finally {
          displaySortingAnimation(false);
        }
      }, 600);
      localStorage.setItem("ensureSortedEntriesTimeoutId", "" + timeoutId);
    }
    function checkSortedEntries(articleSorterConfig) {
      debugLog(() => "checking entries", "Sorting");

      const entries: any[] = Object.values(reader.entries);

      // if (articleSorterConfig.filteringEnabled) {
      //   const visibleArticles = getSortedVisibleArticles();
      //   navigo.entries = entries.filter(
      //     (e) => addedArticles.includes(e.id) || visibleArticles.includes(e.id)
      //   );
      // }

      const sorter = ArticleSorter.from(articleSorterConfig);
      if (
        !articleSorterConfig.sortingEnabled &&
        !articleSorterConfig.pinHotToTop
      ) {
        const articles: Article[] = entries
          .map((e) => getById(e.id))
          .filter((e) => e != null)
          .map((e) => new Article(e));
        const visibleEntryIds: string[] = getSortedVisibleArticles();
        const entryIds = articles
          .map((a) => a.getEntryId())
          .filter((id) => visibleEntryIds.includes(id));
        for (var i = 0; i < visibleEntryIds.length; i++) {
          if (entryIds[i] !== visibleEntryIds[i]) {
            return sortArticlesDOM(
              articleSorterConfig,
              sorter.prepare(articles)
            );
          }
        }
        return;
      }
      let sorted = false;
      let len = 0;
      const articlesContainer = $(ext.articlesContainerSelector).get(0);
      var sortedVisibleArticles: string[] =
        getSortedVisibleArticles(articlesContainer);
      if (!sortedVisibleArticles) {
        return;
      }
      len += sortedVisibleArticles.length;
      const visibleEntryIds = entries.map((e) => e.id as string);
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
            "Sorting"
          );
          sorted = false;
        }
      }
      if (!sorted && len > 0) {
        try {
          const articles = entries
            .map((e) => {
              const el = getById(e.id);
              return el ? new Article(el) : null;
            })
            .filter((a) => !!a);
          const sortedArticles = sorter.sort(articles);
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
          sortArticlesDOM(articleSorterConfig, sortedArticles);
        } catch (e) {
          debugLog(
            () => ["!!", e.name, e.message, "!!"],
            "ensureSortedEntries"
          );
        }
      }
      debugLog(() => "end", "ensureSortedEntries");
    }
    document.addEventListener("ensureSortedEntries", ensureSortedEntries);

    const feedly = getService("feedly");
    const feedlyInlineEntry = feedly.inlineEntry;
    feedly.inlineEntry = function () {
      putFFnS(ext.navigatingEntry, true);
      const result = feedlyInlineEntry.apply(this, arguments);
      putFFnS(ext.navigatingEntry, false);
      return result;
    };

    const navigoPrototype = Object.getPrototypeOf(getService("navigo"));
    const lookupNextEntry = navigoPrototype.lookupNextEntry;
    const lookupPreviousEntry = navigoPrototype.lookupPreviousEntry;
    const getEntries = navigoPrototype.getEntries;
    const setEntries = navigoPrototype.setEntries;
    const reset = navigoPrototype.reset;

    navigoPrototype.lookupNextEntry = function (a) {
      if (disableOverrides()) {
        return lookupNextEntry.apply(this, arguments);
      }
      const selectedEntryId = this.selectedEntryId;
      let result = lookupNextEntry.call(
        this,
        getFFnS(ext.hideAfterReadId) ? true : a
      );
      if (!result) {
        return result;
      }
      let entry;
      while (
        result &&
        (entry = getById(result.id)) &&
        (!$(entry).is(":visible") || entry.hasAttribute("gap-article"))
      ) {
        this.selectedEntryId = result?.id;
        result = lookupNextEntry.call(this, false);
      }
      debugLog(
        () => [
          "selectedEntryId: " + selectedEntryId,
          "nextEntryId: " + result?.id,
        ],
        "lookupNextEntry"
      );
      return result;
    };
    navigoPrototype.lookupPreviousEntry = function (a) {
      if (disableOverrides()) {
        return lookupPreviousEntry.apply(this, arguments);
      }
      const selectedEntryId = this.selectedEntryId;
      let result = lookupPreviousEntry.call(
        this,
        getFFnS(ext.hideAfterReadId) ? true : a
      );
      if (!result) {
        return result;
      }
      let entry;
      while (
        result &&
        (entry = getById(result.id)) &&
        (!$(entry).is(":visible") || entry.hasAttribute("gap-article"))
      ) {
        this.selectedEntryId = result.id;
        result = lookupPreviousEntry.call(this, false);
      }
      debugLog(
        () => [
          "selectedEntryId: " + selectedEntryId,
          "previousEntryId: " + result?.id,
        ],
        "lookupPreviousEntry"
      );
      return result;
    };
    navigoPrototype.getEntries = function () {
      if (disableOverrides()) {
        return getEntries.apply(this, arguments);
      }
      return getEntries.apply(this, arguments);
    };
    navigoPrototype.setEntries = function () {
      if (disableOverrides()) {
        return setEntries.apply(this, arguments);
      }
      let navigo = getService("navigo");
      navigo.originalEntries = null;
      try {
        document.dispatchEvent(new Event("ensureSortedEntries"));
      } catch (e) {
        console.log(e);
      }
      return setEntries.apply(this, arguments);
    };
    navigoPrototype.reset = function () {
      let navigo = getService("navigo");
      navigo.originalEntries = null;
      return reset.apply(this, arguments);
    };

    const listEntryIds = navigoPrototype.listEntryIds;
    navigoPrototype.listEntryIds = function () {
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

    const inlineEntry = navigoPrototype.inlineEntry;
    navigoPrototype.inlineEntry = function () {
      putFFnS(ext.navigatingEntry, true);
      const result = inlineEntry.apply(this, arguments);
      putFFnS(ext.navigatingEntry, false);
      return result;
    };
  }

  overrideNavigation() {
    const readingManager = Object.getPrototypeOf(getService("readingManager"));
    const collectionPrefix = "collection/content/";
    const allCategorySuffix = "category/global.all";
    const getNextURI = readingManager.getNextURI;
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

    const _jumpToNext = readingManager._jumpToNext;
    readingManager._jumpToNext = () => {
      if (!disableOverrides()) {
        putFFnS(ext.navigatingToNextId, true);
      }
      return _jumpToNext.apply(getService("readingManager"), arguments);
    };
  }
}

const page = typeof FeedlyPage;
