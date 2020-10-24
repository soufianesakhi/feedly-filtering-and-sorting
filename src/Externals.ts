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
  articleFrameSelector: ".list-entries > .EntryList__chunk > div",
  articleSelector:
    ".entry[data-title]:not([gap-article]), .inlineFrame [data-title]",
  unreadArticlesCountSelector:
    ".list-entries .entry.unread:not([gap-article]), .list-entries .inlineFrame.unread",
  uncheckedArticlesSelector:
    ".entry[data-title]:not([gap-article]):not([checked-FFnS]), .inlineFrame [data-title]:not([checked-FFnS])",
  markAsReadImmediatelySelector: ".list-entries .FFnS-mark-as-read",
  readArticleClass: "read",
  articleViewClass: "u100Entry",
  articleViewEntryContainerSelector: ".u100",
  loadingMessageSelector: ".list-entries .message.loading",
  sectionSelector: "#timeline > .section",
  publishAgeSpanSelector: ".ago, .metadata [title^=published]",
  publishAgeTimestampAttr: "title",
  articleSourceSelector: ".source, .sourceTitle",
  subscriptionChangeSelector: "#header-title",
  articleTitleAttribute: "data-title",
  articleEntryIdAttribute: "data-entryid",
  popularitySelector: ".EntryEngagement, .engagement, .nbrRecommendations",
  hidingInfoSibling: "header .right-col, header > h1 .button-dropdown",
  endOfFeedSelector: ".list-entries h4:contains(End of feed)",

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
