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

  settingsBtnPredecessorSelector: "button[title='Refresh']",
  articlesContainerSelector: ".list-entries",
  articlesChunkClass: "EntryList__chunk",
  articlesChunkSelector: ".EntryList__chunk",
  articleSelector:
    ".EntryList__chunk > [id]:not([gap-article]):not(.inlineFrame)",
  unreadArticlesCountSelector:
    ".entry--unread:not([gap-article]), .entry__title:not(.entry__title--read)",
  uncheckedArticlesSelector: ":not([gap-article]):not([checked-FFnS])",
  checkedArticlesAttribute: "checked-FFnS",
  markAsReadImmediatelySelector: ".list-entries .FFnS-mark-as-read",
  unreadArticleClass: "entry--unread",
  readArticleClass: "entry--read",
  articleTitleSelector: ".entry__title",
  inlineViewClass: "inlineFrame",
  articleViewReadTitleClass: "entry__title--read",
  articleViewReadSelector: ".entry__title--read",
  articleViewEntryContainerSelector: ".u100",
  loadingMessageSelector: ".list-entries .message.loading",
  sectionSelector: "#timeline > .section",
  publishAgeSpanSelector: ".ago, .metadata [title^=published]",
  publishAgeTimestampAttr: "title",
  articleSourceSelector: ".entry__source",
  subscriptionChangeSelector: "#header-title",
  popularitySelector: ".EntryEngagement, .engagement, .nbrRecommendations",
  hidingInfoSibling: "header .right-col, header > h1 .button-dropdown",
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
  forceRefreshArticlesId: "forceRefreshArticles",
  disablePageOverridesId: "disablePageOverrides",
};
