var ext = {
  plusIconLink: "",
  eraseIconLink: "",
  closeIconLink: "",
  moveUpIconLink: "",
  moveDownIconLink: "",

  supportedURLsPattern:
    "^https?://[^/]+/i/(?:subscription|collection/content/user)/.*$",
  defaultUrlPrefixPattern: "https?://[^/]+/i/",
  subscriptionUrlPrefixPattern: "https?://[^/]+/i/feed/content",
  categoryUrlPrefixPattern: "https?://[^/]+/i/collection/content/user/[^/]+/",

  settingsBtnPredecessorSelector: ".header .MarkAsReadButton",
  headerSelector: ".StreamPage header",
  articlesContainerSelector:
    ".StreamPage:not(.presentation-magazine), .presentation-magazine > .row > div:first-child",
  articlesH2Selector: ".StreamPage h2",
  articleSelector:
    ".StreamPage > .SelectedEntryScroller, article.entry:not(.Article--inlined):not([gap-article])",
  articleAndGapSelector:
    ".StreamPage > .SelectedEntryScroller, article.entry:not(.Article--inlined)",
  articleIdFromFrameSelector: "article[id]",
  sortedArticlesSelector:
    "article.entry:not(.Article--inlined):not([gap-article])",
  articleAndInlineSelector:
    ".StreamPage > .SelectedEntryScroller, article.entry:not(.Article--inlined):not([gap-article])",
  standardArticleEntrySelector: "article.entry",
  inlineArticleFrameSelector: ".SelectedEntryScroller",
  readArticleSelector: "article[id].entry--read",
  unreadArticleSelector: "article[id]:not(.entry--read)",
  unreadArticlesCountSelector:
    ".entry:not(.entry--read):not([gap-article]), .Article__title:not(.Article__title--read)",
  uncheckedArticlesSelector: ":not([gap-article]):not([checked-FFnS])",
  checkedArticlesAttribute: "checked-FFnS",
  markAsReadImmediatelySelector: ".StreamPage .FFnS-mark-as-read",
  readArticleClass: "entry--read",
  articleTitleSelector: ".EntryTitle,.Article__title",
  articleViewUrlAnchorSelector: ".Article__title",
  articleVisualSelector: ".EntryVisual",
  inlineViewClass: "Article--inlined",
  articleViewReadTitleClass: "Article__title--read",
  articleViewReadSelector: ".Article__title--read",
  loadingMessageSelector: ".StreamPage .EntryList__loading",
  publishAgeSpanSelector: ".ago, .metadata [title^=published]",
  publishAgeTimestampAttr: "title",
  articleSourceSelector: ".EntryMetadataSource",
  subscriptionChangeSelector: "#header-title",
  popularitySelector: ".EntryEngagement, .engagement, .nbrRecommendations",
  hidingInfoSibling: "header .right-col, header > h1 .button-dropdown",

  keepArticlesUnreadId: "keepArticlesUnread",
  articlesToMarkAsReadId: "articlesToMarkAsRead",
  openAndMarkAsReadId: "isOpenAndMarkAsRead",
  openAndMarkAsReadClass: "open-in-new-tab-button",
  visualOpenAndMarkAsReadId: "isVisualOpenAndMarkAsRead",
  titleOpenAndMarkAsReadId: "isTitleOpenAndMarkAsRead",
  markAsReadAboveBelowId: "isMarkAsReadAboveBelowId",
  markAsReadAboveBelowClass: "mark-as-read-above-below-button",
  entryInfosJsonClass: "entryInfosJson",
  hideWhenMarkAboveBelowId: "isHideWhenMarkAboveBelow",
  hideAfterReadId: "isHideAfterRead",
  autoLoadAllArticlesId: "autoLoadAllArticles",
  batchSizeId: "batchSize",
  loadByBatchEnabledId: "loadByBatchEnabled",
  isNewestFirstId: "isNewestFirst",
  markAsReadAboveBelowReadId: "MarkAsReadAboveBelowRead",
  markAsReadImmediatelyClass: "FFnS-mark-as-read",
  buttonsContainerId: "FFnS-buttons-container",
  containerButtonClass: "FFnS-UI-button",
  openCurrentFeedArticlesId: "isOpenCurrentFeedArticles",
  openCurrentFeedArticlesClass: "open-current-articles-in-new-tab-button",
  disableAllFiltersButtonId: "isDisableAllFiltersButton",
  disableAllFiltersEnabled: "isDisableAllFiltersEnabled",
  disableAllFiltersButtonClass: "disable-all-filters-button",
  openCurrentFeedArticlesUnreadOnlyId: "openCurrentFeedArticlesUnreadOnly",
  markAsReadOnOpenCurrentFeedArticlesId:
    "isMarkAsReadOnOpenCurrentFeedArticles",
  maxOpenCurrentFeedArticlesId: "maxOpenCurrentFeedArticles",
  forceRefreshArticlesId: "forceRefreshArticles",
  disablePageOverridesId: "disablePageOverrides",
  articleSorterConfigId: "articleSorterConfig",
  navigatingToNextId: "navigatingToNext",
  navigatingEntry: "navigatingEntry",
  layoutChangeSelector: "input[id^='layout-']",
  loadingElementSelector: ".FFnS-loading",
  buttonContainerClass: "FFnS-buttonContainer",
};
