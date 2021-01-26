var ext = {
  plusIconLink: "",
  eraseIconLink: "",
  closeIconLink: "",
  moveUpIconLink: "",
  moveDownIconLink: "",

  defaultUrlPrefixPattern: "https?://[^/]+/i/",
  subscriptionUrlPrefixPattern: "https?://[^/]+/i/feed/content",
  categoryUrlPrefixPattern: "https?://[^/]+/i/collection/content/user/[^/]+/",

  settingsBtnPredecessorSelector: ".icon-toolbar-refresh-secondary",
  articlesContainerSelector: ".list-entries",
  articlesChunkClass: "EntryList__chunk",
  articlesChunkSelector: ".EntryList__chunk",
  articleDataSelector: " [data-entryid][data-title]:not([gap-article])",
  articleFrameSelector: ".list-entries > .EntryList__chunk > article, .list-entries > .EntryList__chunk > div",
  articleSelector:
    ".entry[data-title]:not([gap-article]), .inlineFrame .u100Entry",
  unreadArticlesCountSelector:
    ".entry--unread:not([gap-article]), .entry__title:not(.entry__title--read)",
  uncheckedArticlesSelector:
    ".entry[data-title]:not([gap-article]):not([checked-FFnS]), .inlineFrame .u100Entry:not([checked-FFnS])",
  markAsReadImmediatelySelector: ".list-entries .FFnS-mark-as-read",
  unreadArticleClass: "entry--unread",
  readArticleClass: "entry--read",
  articleViewClass: "u100Entry",
  articleViewIdContainerClass: "inlineFrame",
  articleViewTitleSelector: ".entry__title",
  articleViewReadTitleClass: "entry__title--read",
  articleViewReadSelector: "entry__title--read",
  articleViewEntryContainerSelector: ".u100",
  loadingMessageSelector: ".list-entries .message.loading",
  sectionSelector: "#timeline > .section",
  publishAgeSpanSelector: ".ago, .metadata [title^=published]",
  publishAgeTimestampAttr: "title",
  articleSourceSelector: ".entry__source",
  subscriptionChangeSelector: "#header-title",
  articleTitleAttribute: "data-title",
  articleEntryIdAttribute: "data-entryid",
  popularitySelector: ".EntryEngagement, .engagement, .nbrRecommendations",
  hidingInfoSibling: "header .right-col, header > h1 .button-dropdown",
  endOfFeedSelector: ".list-entries h4:contains(End of feed)",
  articleUrlAnchorSelector: ".entry__title",

  keepArticlesUnreadId: "keepArticlesUnread",
  articlesToMarkAsReadId: "articlesToMarkAsRead",
  sortedVisibleArticlesId: "sortedVisibleArticles",
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
  sortArticlesId: "isSortArticles",
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
  forceRefreshArticlesId: "forceRefreshArticles"
};
