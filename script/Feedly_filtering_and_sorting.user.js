// ==UserScript==
// @name        Feedly filtering and sorting
// @namespace   https://github.com/soufianesakhi/feedly-filtering-and-sorting
// @description Enhance the feedly website with advanced filtering, sorting and more
// @author      Soufiane Sakhi
// @copyright   2016-2018, Soufiane Sakhi
// @license     MIT; https://opensource.org/licenses/MIT
// @homepageURL https://github.com/soufianesakhi/feedly-filtering-and-sorting
// @supportURL  https://github.com/soufianesakhi/feedly-filtering-and-sorting/issues
// @icon        https://raw.githubusercontent.com/soufianesakhi/feedly-filtering-and-sorting/master/web-ext/icons/128.png
// @require     https://code.jquery.com/jquery-3.2.1.min.js
// @resource    jquery.min.js https://code.jquery.com/jquery-3.2.1.min.js
// @require     https://greasyfork.org/scripts/19857-node-creation-observer/code/node-creation-observer.js?version=174436
// @resource    node-creation-observer.js https://greasyfork.org/scripts/19857-node-creation-observer/code/node-creation-observer.js?version=174436
// @require     https://cdnjs.cloudflare.com/ajax/libs/jscolor/2.0.4/jscolor.min.js
// @include     *://feedly.com/*
// @version     3.14.1
// @grant       GM_setValue
// @grant       GM_getValue
// @grant       GM_deleteValue
// @grant       GM_listValues
// @grant       GM_getResourceText
// ==/UserScript==

var ext = {
    plusIconLink: "",
    eraseIconLink: "",
    closeIconLink: "",
    moveUpIconLink: "",
    moveDownIconLink: "",
    defaultUrlPrefixPattern: "https?://[^/]+/i/",
    subscriptionUrlPrefixPattern: "https?://[^/]+/i/feed/content",
    categoryUrlPrefixPattern: "https?://[^/]+/i/collection/content/user/[^/]+/",
    settingsBtnSuccessorSelector: ".button-customize-page",
    articlesContainerSelector: ".list-entries",
    articlesChunkSelector: ".EntryList__chunk",
    containerArticleSelector: " [data-entryid][data-title]:not([gap-article])",
    articleSelector: ".list-entries [data-entryid][data-title]:not([gap-article])",
    unreadArticlesCountSelector: ".list-entries .entry.unread:not([gap-article]), .list-entries .unread.u100",
    uncheckedArticlesSelector: ".list-entries [data-entryid][data-title]:not([checked-FFnS])",
    readArticleClass: "read",
    articleViewClass: "u100Entry",
    articleViewEntryContainerSelector: ".u100",
    loadingMessageSelector: ".list-entries .message.loading",
    sectionSelector: "#timeline > .section",
    publishAgeSpanSelector: ".ago, .metadata [title^=published]",
    publishAgeTimestampAttr: "title",
    articleSourceSelector: ".source, .sourceTitle",
    subscriptionChangeSelector: "header .heading",
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
    openCurrentFeedArticlesId: "isOpenCurrentFeedArticles",
    openCurrentFeedArticlesClass: "open-current-articles-in-new-tab-button",
    openCurrentFeedArticlesUnreadOnlyId: "openCurrentFeedArticlesUnreadOnly",
    markAsReadOnOpenCurrentFeedArticlesId: "isMarkAsReadOnOpenCurrentFeedArticles",
    maxOpenCurrentFeedArticlesId: "maxOpenCurrentFeedArticles"
};

var templates = {
    settingsHTML: "<div id='FFnS_settingsDivContainer'> <div id='FFnS_settingsDiv'> <img id='FFnS_CloseSettingsBtn' src='{{closeIconLink}}' /> <fieldset> <legend>General settings</legend> <div class='setting_group'> <span>Auto load all unread articles</span> <input id='FFnS_autoLoadAllArticles' type='checkbox' /> </div> <div class='setting_group'> <span>Load articles by batch</span> <input id='FFnS_loadByBatchEnabled' type='checkbox' /> <span>Batch size</span> <input id='FFnS_batchSize' class='FFnS_input MediumNumberInput' type='number' min='50' max='1000' step='50' /> </div> <div class='setting_group'> <span class='tooltip' >Always use global settings <span class='tooltiptext' >Use the same filtering and sorting settings for all subscriptions and categories. Uncheck to have specific settings for each subscription/category</span > </span> <input id='FFnS_globalSettingsEnabled' type='checkbox' /> </div> <div class='setting_group'> <span class='tooltip' >Sync settings <span class='tooltiptext' >The settings will be synced by the browser, and be available across all instances of that browser that the user is logged into (e.g. via Chrome sync, or Firefox sync), across different devices.</span > </span> <input id='FFnS_syncSettingsEnabled' type='checkbox' /> </div> </fieldset> <fieldset> <legend><span id='FFnS_settings_mode_title'></span></legend> <div class='setting_group'> <span class='tooltip' >Filtering enabled <span class='tooltiptext' >Hide the articles that contain at least one of the filtering keywords (not applied if empty)</span > </span> <input id='FFnS_FilteringEnabled' type='checkbox' /> </div> <div class='setting_group'> <span class='tooltip'> Restricting enabled <span class='tooltiptext' >Show only articles that contain at least one of the restricting keywords (not applied if empty)</span > </span> <input id='FFnS_RestrictingEnabled' type='checkbox' /> </div> <div class='setting_group'> <span>Sorting enabled</span> <input id='FFnS_SortingEnabled' type='checkbox' /> </div> {{ SortingSelect }} <ul id='FFnS_tabs_menu'> <li class='current'> <a href='#FFnS_Tab_FilteredOut'>Filtering keywords</a> </li> <li><a href='#FFnS_Tab_RestrictedOn'>Restricting keywords</a></li> <li><a href='#FFnS_Tab_KeywordControls'>Keyword controls</a></li> <li><a href='#FFnS_Tab_UIControls'>UI controls</a></li> <li><a href='#FFnS_Tab_AdvancedControls'>Advanced controls</a></li> <li><a href='#FFnS_Tab_SettingsControls'>Settings controls</a></li> </ul> <div id='FFnS_tabs_content'> {{ FilteringList.Type.FilteredOut }} {{ FilteringList.Type.RestrictedOn }} <div id='FFnS_Tab_KeywordControls' class='FFnS_Tab_Menu'> <p> The following settings are applied to the filtering and restricting </p> <fieldset> <legend>Matching area (domain)</legend> <div> <span>Search for keywords in the entry's: </span> {{ DefaultKeywordMatchingArea }} <span> (Multiple values can be selected)</span> </div> <div> <span>Always use these matching areas</span> <input id='FFnS_AlwaysUseDefaultMatchingAreas' type='checkbox' /> <span> (the area select boxes in the filtering and restricting will be invisible when this option is checked)</span > </div> </fieldset> <fieldset> <legend>Matching method</legend> <span>The keywords are treated as : </span> {{ KeywordMatchingMethod }} </fieldset> </div> <div id='FFnS_Tab_UIControls' class='FFnS_Tab_Menu'> <fieldset> <legend>Custom buttons</legend> <div> <span >Add a button to open articles in a new window/tab and mark them as read</span > <input id='FFnS_OpenAndMarkAsRead' type='checkbox' /> </div> <div> <span >Open articles in a new window/tab and mark them as read when clicking the visual image (Cards &amp; Magazine view)</span > <input id='FFnS_VisualOpenAndMarkAsRead' type='checkbox' /> </div> <div> <span >Open articles in a new window/tab and mark them as read when clicking the title (Title view)</span > <input id='FFnS_TitleOpenAndMarkAsRead' type='checkbox' /> </div> <div> <span>Add buttons to mark articles above/below as</span> <select id='FFnS_MarkAsReadAboveBelowRead' class='FFnS_input'> <option value='true' selected>read</option> <option value='false'>unread</option> </select> <input id='FFnS_MarkAsReadAboveBelow' type='checkbox' /> <span> (Also hide using the same buttons when marking as read</span > <input id='FFnS_HideWhenMarkAboveBelow' type='checkbox' /> <span>)</span> </div> <div> <span >Add button to open all current feed articles in a new tab</span > <input id='FFnS_OpenCurrentFeedArticles' type='checkbox' /> <span> unread only</span> <input id='FFnS_OpenCurrentFeedArticlesUnreadOnly' type='checkbox' /> <span class='tooltip'> maximum articles to open <span class='tooltiptext' >If set to 0, all the articles will be opened</span > </span> <input id='FFnS_MaxOpenCurrentFeedArticles' class='FFnS_input MediumNumberInput' type='number' min='0' step='1' /> <span> mark as read</span> <input id='FFnS_MarkAsReadOnOpenCurrentFeedArticles' type='checkbox' /> </div> </fieldset> <fieldset> <legend> <span class='tooltip' >Coloring rules to highlight titles <span class='tooltiptext' >For each article, only the first matching coloring rule is applied by following their order. You can move up/down the coloring rules to change this order.</span > </span> </legend> <span id='FFnS_AddColoringRule'> <img src='{{plusIconLink}}' class='FFnS_icon' title='Add a new coloring rule' /> </span> <span id='FFnS_EraseColoringRules'> <img src='{{eraseIconLink}}' class='FFnS_icon' title='Remove all the coloring rules' /> </span> <span id='FFnS_ColoringRules'></span> </fieldset> </div> <div id='FFnS_Tab_AdvancedControls' class='FFnS_Tab_Menu'> <fieldset> <legend>Recently received articles</legend> <div id='FFnS_MaxPeriod_Infos'> <span>Articles received (crawled) less than</span> <input id='FFnS_Hours_AdvancedControlsReceivedPeriod' class='FFnS_input' type='number' min='0' max='23' /> <span>hours and</span> <input id='FFnS_Days_AdvancedControlsReceivedPeriod' class='FFnS_input' type='number' min='0' /> <span>days</span> <span>ago should be:</span> </div> <div class='setting_group'> <span class='tooltip' >Kept unread if unread <span class='tooltiptext' >Only the articles that were not marked as read (manually or on scroll) will be kept unread. Please note that by enabling this option, only the loaded articles will be marked as read.</span > </span> <input id='FFnS_KeepUnread_AdvancedControlsReceivedPeriod' type='checkbox' /> </div> <div class='setting_group'> <span>Hidden</span> <input id='FFnS_Hide_AdvancedControlsReceivedPeriod' type='checkbox' /> </div> <div class='setting_group'> <span>Visible if hot or popularity superior to:</span> <input id='FFnS_MinPopularity_AdvancedControlsReceivedPeriod' class='FFnS_input MediumNumberInput' type='number' min='0' step='100' /> <input id='FFnS_ShowIfHot_AdvancedControlsReceivedPeriod' type='checkbox' /> <span class='tooltip' >Marked as read if hot or popular <span class='tooltiptext' >Mark as read the articles made visible if hot or with popularity superior to the defined value</span > </span> <input id='FFnS_MarkAsReadVisible_AdvancedControlsReceivedPeriod' type='checkbox' /> </div> </fieldset> <fieldset> <legend>Reading time</legend> <div class='setting_group'> <span>Enable filtering of articles with reading time </span> <select id='FFnS_FilterLong_FilteringByReadingTime' class='FFnS_input' > <option value='true' selected>superior</option> <option value='false'>inferior</option> </select> <span>to </span> <input id='FFnS_ThresholdMinutes_FilteringByReadingTime' class='FFnS_input MediumNumberInput' type='number' min='1' /> <span>minutes: </span> <input id='FFnS_Enabled_FilteringByReadingTime' type='checkbox' /> </div> <div class='setting_group'> <span class='tooltip' >Keep unread <span class='tooltiptext' >When this option is enabled, the filtered articles will be kept unread</span > </span> <input id='FFnS_KeepUnread_FilteringByReadingTime' type='checkbox' /> <span class='tooltip' >Reading speed : <span class='tooltiptext' >The average words read per minute</span > </span> <input id='FFnS_WordsPerMinute_FilteringByReadingTime' class='FFnS_input MediumNumberInput' type='number' min='1' /> </div> </fieldset> <fieldset> <legend> Additional sorting levels (applied when two entries have equal sorting) </legend> <span id='FFnS_AdditionalSortingTypes'></span> <span id='FFnS_AddSortingType'> <img src='{{plusIconLink}}' class='FFnS_icon' /> </span> <span id='FFnS_EraseSortingTypes'> <img src='{{eraseIconLink}}' class='FFnS_icon' /> </span> </fieldset> <fieldset> <legend>Duplicates filtering</legend> <div class='setting_group'> <span class='tooltip' >Hide duplicates <span class='tooltiptext tooltip-top' >The duplicate articles will be hidden based on the url and the title. For each duplicate article group, only the most recently published one will be kept.</span > </span> <input id='FFnS_HideDuplicates' type='checkbox' /> </div> <div class='setting_group'> <span class='tooltip' >Mark as read <span class='tooltiptext tooltip-top' >The duplicate articles will be marked as read (based on the same rules of the 'Hide duplicates' option).</span > </span> <input id='FFnS_MarkAsReadDuplicates' type='checkbox' /> </div> <div class='setting_group'> <span class='tooltip' >Highlight<span class='tooltiptext tooltip-top'> Apply a color to the newer duplicate articles</span ></span > <input id='FFnS_HighlightDuplicates' type='checkbox' /> <input id='FFnS_HighlightDuplicatesColor' class='FFnS_input jscolor' size='10' type='text' /> </div> <div class='setting_group'> <span class='tooltip' >Enable cross checking with persistence up to: <span class='tooltiptext tooltip-top' >The duplicates will be checked across all subscriptions and categories against current articles and stored articles. The url and title of all articles published less then the configured days will be stored locally (sync not supported).</span > </span> <input id='FFnS_CrossCheckDuplicatesDays' class='FFnS_input MediumNumberInput' type='number' min='0' /> <span> days </span> <input id='FFnS_CrossCheckDuplicates' type='checkbox' /> </div> </fieldset> <fieldset> <legend>Misc</legend> <div class='setting_group'> <span>Group hot articles & pin to top</span> <input id='FFnS_PinHotToTop' type='checkbox' /> </div> <div class='setting_group'> <span>Hide articles after reading them</span> <input id='FFnS_HideAfterRead' type='checkbox' /> <span class='tooltip' >Replace with gap <span class='tooltiptext tooltip-top' >Replace the hidden article with a gap with same dimensions.</span > </span> <input id='FFnS_ReplaceHiddenWithGap' type='checkbox' /> </div> <div class='setting_group'> <span>Mark as read filtered articles</span> <input id='FFnS_MarkAsReadFiltered' type='checkbox' /> </div> <div class='setting_group'> <span class='tooltip' >Auto refresh <span class='tooltiptext tooltip-top' >The articles will be reloaded periodically following the configured minutes</span > </span> <input id='FFnS_AutoRefreshEnabled' type='checkbox' /> <input id='FFnS_AutoRefreshMinutes' class='FFnS_input MediumNumberInput' type='number' min='1' /> <span>(minutes)</span> </div> </fieldset> </div> <div id='FFnS_Tab_SettingsControls' class='FFnS_Tab_Menu'> <fieldset> <legend>Import/export all settings from/to file</legend> <div class='setting_group'> <span>Import settings </span> <input id='FFnS_ImportSettings' type='file' /> </div> <button id='FFnS_ExportSettings'>Export settings</button> </fieldset> <fieldset> <legend>Subscription management</legend> <select id='FFnS_SettingsControls_SelectedSubscription' class='FFnS_input' > {{ ImportMenu.SubscriptionOptions }} </select> <button id='FFnS_SettingsControls_ImportFromOtherSub'> Import settings from selected subscription </button> <button id='FFnS_SettingsControls_DeleteSub'> Delete selected subscription </button> <div id='FFnS_SettingsControls_LinkedSubContainer'> <span id='FFnS_SettingsControls_LinkedSub'></span> <button id='FFnS_SettingsControls_UnlinkFromSub'>Unlink</button> </div> <button id='FFnS_SettingsControls_LinkToSub'> Link current subscription to selected subscription </button> </fieldset> </div> </div> </fieldset> </div> </div> ",
    filteringListHTML: "<div id='{{FilteringTypeTabId}}' class='FFnS_Tab_Menu'> {{ FilteringKeywordMatchingArea }} <input id='{{inputId}}' class='FFnS_input' size='10' type='text' /> <span id='{{plusBtnId}}'> <img src='{{plusIconLink}}' class='FFnS_icon' /> </span> <span id='{{filetringKeywordsId}}'></span> <span id='{{eraseBtnId}}'> <img src='{{eraseIconLink}}' class='FFnS_icon' /> </span> </div> ",
    keywordHTML: '<button id="{{keywordId}}" type="button" class="FFnS_keyword">{{keyword}}</button>',
    sortingSelectHTML: "<select id='{{Id}}' class='FFnS_input FFnS_select'> <option value='{{PopularityDesc}}' >Sort by popularity (highest to lowest)</option > <option value='{{PopularityAsc}}' >Sort by popularity (lowest to highest)</option > <option value='{{TitleAsc}}'>Sort by title (a -&gt; z)</option> <option value='{{TitleDesc}}'>Sort by title (z -&gt; a)</option> <option value='{{ReceivedDateNewFirst}}' >Sort by received date (new first)</option > <option value='{{ReceivedDateOldFirst}}' >Sort by received date (old first)</option > <option value='{{PublishDateNewFirst}}' >Sort by publish date (new first)</option > <option value='{{PublishDateOldFirst}}' >Sort by publish date (old first)</option > <option value='{{PublishDayNewFirst}}' >Sort by publish day (new first)</option > <option value='{{PublishDayOldFirst}}' >Sort by publish day (old first)</option > <option value='{{SourceAsc}}'>Sort by source title (a -&gt; z)</option> <option value='{{SourceDesc}}'>Sort by source title (z -&gt; a)</option> <option value='{{SourceNewestReceiveDate}}' >Sort by source title (newest received first)</option > <option value='{{Random}}'>Random sort</option> </select> ",
    keywordMatchingSelectHTML: "<select id='{{Id}}' class='FFnS_input FFnS_keywordMatchingSelect' {{attributes}} > {{ defaultOption }} <option value='{{KeywordMatchingArea.Title}}' {{selectFirst}}>Title</option> <option value='{{KeywordMatchingArea.Body}}'>Body (summary)</option> <option value='{{KeywordMatchingArea.Author}}'>Author</option> </select> ",
    keywordMatchingMethodHTML: "<select id='{{id}}' class='FFnS_input FFnS_KeywordMatchingMethod' {{size}}> <option value='{{KeywordMatchingMethod.Simple}}' selected >Strings (simple match)</option > <option value='{{KeywordMatchingMethod.Word}}' >Words (whole word match)</option > <option value='{{KeywordMatchingMethod.RegExp}}' >Regular expressions (pattern match)</option > </select> ",
    coloringRuleHTML: "<div id='{{Id}}' class='FFnS_ColoringRule'> <img class='FFnS_RemoveColoringRule FFnS_ColoringRuleManagement' title='Remove the coloring rule' src='{{eraseIconLink}}' /> <img class='FFnS_MoveUpColoringRule FFnS_ColoringRuleManagement' title='Move up the order of the coloring rule' src='{{moveUpIconLink}}' /> <img class='FFnS_MoveDownColoringRule FFnS_ColoringRuleManagement' title='Move down the order of the coloring rule' src='{{moveDownIconLink}}' /> <span>Keyword source: </span> <select class='FFnS_ColoringRule_Source FFnS_input FFnS_select'> <option value='{{SpecificKeywords}}'>Specific keywords</option> <option value='{{RestrictingKeywords}}'>Restricting keywords</option> <option value='{{FilteringKeywords}}'>Filtering keywords</option> <option value='{{SourceTitle}}'>Source title (subscription)</option> </select> <span class='FFnS_ColoringRule_Options'> <span style='display: none'>Highlight all the title</span> <input class='FFnS_HighlightAllTitle' type='checkbox' style='display: none' /> <span class='FFnS_SpecificColorGroup' >Color <input class='FFnS_SpecificColor FFnS_input jscolor' value='{{Color}}' size='10' type='text' /> </span> </span> <span class='FFnS_ColoringRule_SourceTitleInfos' >All the titles from the same source (subscription) will have the same generated color (only applied when viewing categories)</span > <div class='FFnS_ColoringRule_MatchingMethodGroup'> Keyword matching method: {{ KeywordMatchingMethod }} </div> <div class='FFnS_ColoringRule_KeywordsGroup'> <span>Specific keywords: </span> <input class='FFnS_input FFnS_ColoringRule_KeywordInput' size='10' type='text' /> <span class='FFnS_ColoringRule_AddKeyword'> <img src='{{plusIconLink}}' class='FFnS_icon' /> </span> <span class='FFnS_ColoringRuleKeywords'></span> <span class='FFnS_ColoringRule_EraseKeywords'> <img src='{{eraseIconLink}}' class='FFnS_icon' /> </span> </div> </div> ",
    optionHTML: "<option value='{{value}}'>{{value}}</option>",
    emptyOptionHTML: "<option value=''>{{value}}</option>",
    styleCSS: "#FFnS_settingsDivContainer { display: none; background: rgba(0, 0, 0, 0.9); width: 100%; height: 100%; z-index: 999; top: 0; left: 0; position: fixed; } #FFnS_settingsDiv { max-height: 87%; margin-top: 1%; margin-left: 5%; margin-right: 1%; border-radius: 25px; border: 2px solid #336699; background: #e0f5ff; padding: 2%; opacity: 1; overflow-y: auto; overflow-x: hidden; } .FFnS_input { font-size: 12px; } #FFnS_tabs_menu { display: block; clear: both; margin-top: 1%; margin-bottom: 0%; padding: 0px; text-align: center; } #FFnS_tabs_menu li { height: 30px; line-height: 30px; display: inline-block; border: 1px solid #d4d4d1; } #FFnS_tabs_menu li.current { background-color: #b9e0ed; } #FFnS_tabs_menu li a { padding: 3px; color: #2a687d; } #FFnS_tabs_content { padding: 1%; } .FFnS_Tab_Menu { display: none; width: 100%; overflow-y: auto; overflow-x: hidden; } .FFnS_icon { vertical-align: middle; height: 20px; width: 20px; cursor: pointer; } .FFnS_keyword { vertical-align: middle; background-color: #35a5e2; border-radius: 20px; color: #fff; cursor: pointer; } .tooltip { position: relative; display: inline-block; border-bottom: 1px dotted black; } .tooltip .tooltiptext { visibility: hidden; width: 120px; background-color: black; color: #fff; text-align: center; padding: 5px; border-radius: 6px; position: absolute; z-index: 1; white-space: normal; } .tooltip-top { bottom: 100%; left: 50%; } .tooltip:hover .tooltiptext { visibility: visible; } #FFnS_CloseSettingsBtn, .FFnS_ColoringRuleManagement { float: right; cursor: pointer; width: 24px; height: 24px; padding: 4px; } #FFnS_Tab_SettingsControls button, #FFnS_Tab_SettingsControls input { margin-top: 1%; font-size: 12px; vertical-align: inherit; } #FFnS_Tab_SettingsControls #FFnS_SettingsControls_UnlinkFromSub { display: inline; } #FFnS_MaxPeriod_Infos > input[type='number'] { width: 30px; margin-left: 1%; margin-right: 1%; } .MediumNumberInput { width: 45px; } #FFnS_MaxPeriod_Infos { margin: 1% 0 2% 0; } .setting_group { display: inline-block; white-space: nowrap; margin-right: 2%; } fieldset { border-color: #333690; border-style: bold; } legend { color: #333690; font-weight: bold; } fieldset + fieldset, #FFnS_Tab_SettingsControls fieldset { margin-top: 1%; } fieldset select { margin-left: 1%; } fieldset select.FFnS_keywordMatchingSelect { margin-left: 0%; margin-right: 1%; vertical-align: middle; } input { vertical-align: middle; } .ShowSettingsBtn { background-image: url('{{extension-icon}}'); background-size: 20px 20px; background-position: center center; background-repeat: no-repeat; background-color: transparent; filter: grayscale(1); font-weight: normal; min-width: 0; height: 40px; width: 40px; margin-right: 0px; } .ShowSettingsBtn:hover { color: #636363; background-color: rgba(0, 0, 0, 0.05); } .fx header h1 .detail.FFnS_Hiding_Info::before { content: ''; } .FFnS_Hiding_Info { text-align: center; } .fx .open-in-new-tab-button.mark-as-read, .fx .mark-as-read-above-below-button.mark-as-read { background-repeat: no-repeat; margin-right: 0px; } .fx .open-in-new-tab-button.mark-as-read, .fx .entry.u0 .open-in-new-tab-button.condensed-toolbar-icon { background-image: url('{{open-in-new-tab-url}}'); background-size: 18px 18px; } .fx .open-current-articles-in-new-tab-button { background-image: url('{{open-in-new-tab-url}}'); background-size: 18px 18px; background-repeat: no-repeat; background-color: white; display: block; margin-left: auto; min-width: 10px; padding: 10px; } .fx .mark-as-read-above-below-button.mark-as-read, .fx .entry.u0 .mark-as-read-above-below-button.condensed-toolbar-icon, .fx .entry.u5 .mark-as-read-above-below-button { width: 24px; height: 24px; } .fx .u100 .mark-as-read-above-below-button.mark-as-read, .fx .u100 .open-in-new-tab-button.mark-as-read { margin-left: 20px; width: 24px; height: 24px; } .fx button.mark-above-as-read.mark-as-read { background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAMAAADXqc3KAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAMAUExURQAAAAEBAQICAgMDAwQEBAUFBQYGBggICA8PDxERERMTExUVFRgYGBkZGRoaGhwcHB4eHh8fHyAgICYmJicnJygoKCoqKiwsLC4uLi8vLzAwMDExMTIyMjMzMzk5OTo6Oj09PT4+PkREREhISEtLS01NTU5OTlFRUVNTU1RUVFhYWF1dXV5eXl9fX2BgYGhoaGlpaWxsbHJycnh4eHp6enx8fAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFhUO7wAAAEAdFJOU////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////wBT9wclAAAACXBIWXMAABYlAAAWJQFJUiTwAAAAGHRFWHRTb2Z0d2FyZQBwYWludC5uZXQgNC4wLjb8jGPfAAAA1klEQVQoU3WQiVICQQwFGxBUPLgVROQQEBDFA/7/02KSyS6sVXQVyZvXNezWImfIxCx28JCJOvUUnNVlduOOKreejHFJh4s2fRnQsqg8cdBpYklHZ5eF1dJnZctvTG3EHDL0HQ/PeeEmhX/ilYtIRfFOfi6IA8wjFgU0Irn42UWuUomk8AnxIlew9+DwpsL/rwkjrxJIWcWvyAj00x1BNioeZRH3cvRU0W6tv+eoEio+tFTK0QR2v+biKxUZJr6tv0/nHH/itQo/nZAK2Po+IYlJz9cRkT+a78AFAEXS0AAAAABJRU5ErkJggg==); } .fx button.mark-below-as-read.mark-as-read { background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAMAAADXqc3KAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAMAUExURQAAAAEBAQICAgMDAwQEBAUFBQYGBgcHBwgICA8PDxERERUVFRoaGhwcHB4eHigoKCoqKiwsLC4uLjAwMDExMTIyMjMzMzk5OTo6Oj09PUhISElJSUtLS01NTVFRUVNTU1RUVFhYWF1dXV5eXl9fX2BgYGhoaGlpaWxsbG5ubnJycnR0dHV1dXh4eHp6ent7e3x8fAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACY/twoAAAEAdFJOU////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////wBT9wclAAAACXBIWXMAABYlAAAWJQFJUiTwAAAAGHRFWHRTb2Z0d2FyZQBwYWludC5uZXQgNC4wLjb8jGPfAAAAxElEQVQoU3WQhxKCMBBEF7D3gg27Inbl/3/uvLtkQNrOJLvZNxcKqEIVYFQO9q3yiaXDWwmYIua9CCbYixWAD189DxbompADAWo2ZcEJyTkDYmBjYxYAfZsUPCKb6/BsYuEC2BdpAx8NKuwY6H0DYK6VEchl8CaaA/zrUoGODMa0tXOJ+ORxd+A1I3qap7iBgpBLliuVI2M1vBRQQ8FVAH9K1EQogddN+p729OV4kCCAOnwSF92xVjcFcFb/kwGroVoqoh+q2r44+TStvAAAAABJRU5ErkJggg==); } .fx .entry.u5 .open-in-new-tab-button, .fx .entry.u5 .mark-as-read-above-below-button { filter: brightness(0) invert(1); } .fx .entry.u5 .open-in-new-tab-button { margin-right: 4px; margin-top: 4px; background-size: 32px 32px; width: 32px; height: 32px; } .ShowSettingsBtn:hover { color: #636363; background-color: rgba(0, 0, 0, 0.05); } #FFnS_Tab_KeywordControls span { vertical-align: top; } #FFnS_Tab_KeywordControls div { margin-top: 2%; } .FFnS_select { vertical-align: middle; } #FFnS_AddSortingType { margin-left: 1%; } .entry[gap-article] { visibility: hidden; } #FFnS_ImportSettings { width: 400px; } .FFnS_ColoringRule { margin-top: 1%; padding: 1%; border: 1px solid #636363; } .FFnS_ColoringRule div { margin-top: 1%; } "
};

var exported = {};
function $id(id) {
    return $("#" + id);
}
function onClick(jq, handler, thisArg) {
    jq.click(function (eventObject) {
        try {
            handler.apply(thisArg, eventObject);
        }
        catch (e) {
            console.log(e);
        }
    });
}
function bindMarkup(html, bindings) {
    bindings.forEach(function (binding) {
        html = html.replace(new RegExp("{{[ ]*" + binding.name + "[ ]*}}", "g"), "" + binding.value);
    });
    return html;
}
function callbackBindedTo(thisArg) {
    return function (callback) {
        return callback.bind(this);
    }.bind(thisArg);
}
function capitalizeFirst(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
}
function isChecked(input) {
    return input.is(":checked");
}
function setChecked(htmlId, checked) {
    $id(htmlId).prop("checked", checked);
}
function registerAccessors(srcObject, srcFieldName, targetPrototype, setterCallback, setterCallbackThisArg, fieldObjectName) {
    for (var field in srcObject) {
        var type = typeof srcObject[field];
        if (type === "object" && !$.isArray(srcObject[field])) {
            registerAccessors(srcObject[field], srcFieldName, targetPrototype, setterCallback, setterCallbackThisArg, field);
        }
        else if (type !== "function") {
            var accessorName = capitalizeFirst(field);
            if (fieldObjectName != null) {
                accessorName += "_" + capitalizeFirst(fieldObjectName);
            }
            var getterName = (type === "boolean" ? "is" : "get") + accessorName;
            var setterName = "set" + accessorName;
            (function () {
                var callbackField = field;
                var getFinalObj = function (callbackSrcObj) {
                    return fieldObjectName == null
                        ? callbackSrcObj
                        : callbackSrcObj[fieldObjectName];
                };
                if (targetPrototype[getterName] == null) {
                    targetPrototype[getterName] = function () {
                        var finalObj = getFinalObj(this[srcFieldName]);
                        return finalObj[callbackField];
                    };
                }
                if (targetPrototype[setterName] == null) {
                    targetPrototype[setterName] = function (value) {
                        var callbackSrcObj = this[srcFieldName];
                        var finalObj = getFinalObj(callbackSrcObj);
                        finalObj[callbackField] = value;
                        setterCallback.call(setterCallbackThisArg, callbackSrcObj);
                    };
                }
            })();
        }
    }
}
function getOrDefault(a, b) {
    return a != null ? a : b;
}
function deepClone(toClone, clone, alternativeToCloneByField) {
    if (!toClone) {
        return clone;
    }
    var typedClone = clone;
    if (!clone) {
        clone = {};
        typedClone = toClone;
    }
    var _loop_1 = function () {
        type = typeof typedClone[field];
        if (toClone[field] == null) {
            return "continue";
        }
        switch (type) {
            case "object":
                if (!$.isArray(typedClone[field])) {
                    clone[field] = deepClone(toClone[field], alternativeToCloneByField[field], alternativeToCloneByField);
                }
                else {
                    array = toClone[field];
                    if (array.length > 0) {
                        arrayType = typeof array[0];
                        if (arrayType === "object") {
                            var cloneArray_1 = [];
                            array.forEach(function (element) {
                                cloneArray_1.push(deepClone(element, new alternativeToCloneByField[field](), alternativeToCloneByField));
                            });
                            clone[field] = cloneArray_1;
                        }
                        else {
                            clone[field] = array.slice(0);
                        }
                    }
                    else {
                        clone[field] = array.slice(0);
                    }
                }
                break;
            case "number":
            case "string":
                clone[field] = toClone[field] || clone[field];
                break;
            case "boolean":
                clone[field] = getOrDefault(toClone[field], clone[field]);
                break;
        }
    };
    var type, array, arrayType;
    for (var field in typedClone) {
        _loop_1();
    }
    return clone;
}
function executeWindow(sourceName) {
    var functions = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        functions[_i - 1] = arguments[_i];
    }
    var srcTxt = "try {\n";
    for (var i = 0; i < functions.length; i++) {
        srcTxt += "(" + functions[i].toString() + ")();\n";
    }
    srcTxt += "\n} catch(e) { console.log(e) }";
    injectScriptText(srcTxt, sourceName);
}
function injectToWindow(functionNames) {
    var functions = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        functions[_i - 1] = arguments[_i];
    }
    var srcTxt = "";
    for (var i = 0; i < functions.length; i++) {
        srcTxt +=
            functions[i]
                .toString()
                .replace(/^function/, "function " + functionNames[i]) + "\n";
    }
    injectScriptText(srcTxt, "FFnS-" + (functions.length == 1 ? functionNames[0] : "Functions"), true);
}
function injectClasses() {
    var classes = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        classes[_i] = arguments[_i];
    }
    var srcTxt = "";
    for (var i = 0; i < classes.length; i++) {
        var txt = classes[i].toString();
        var className = /function ([^\(]+)/i.exec(txt)[1];
        srcTxt +=
            "var " +
                className +
                " = (function () {\n" +
                classes[i].toString() +
                "\nreturn " +
                className +
                ";" +
                "\n}());";
    }
    injectScriptText(srcTxt, "classes-" + Date.now(), true);
}
function injectScriptText(srcTxt, sourceURL, evalPermitted) {
    if (sourceURL) {
        srcTxt += "//# sourceURL=" + sourceURL;
    }
    if (evalPermitted && typeof InstallTrigger != "undefined") {
        srcTxt = "eval(`" + srcTxt + "`)";
    }
    var script = document.createElement("script");
    script.type = "text/javascript";
    script.text = srcTxt;
    document.body.appendChild(script);
}
function injectStyleText(styleTxt, id) {
    $("head").append("<style" + (id ? 'id="' + id + '" ' : "") + ">" + styleTxt + "</style>");
}
function exportFile(content, filename) {
    var textToSaveAsBlob = new Blob([content], { type: "application/json" });
    var textToSaveAsURL = window.URL.createObjectURL(textToSaveAsBlob);
    var downloadLink = document.createElement("a");
    downloadLink.download = filename ? filename : "export.json";
    downloadLink.href = textToSaveAsURL;
    downloadLink.onclick = function () {
        $(downloadLink).remove();
    };
    downloadLink.style.display = "none";
    document.body.appendChild(downloadLink);
    downloadLink.click();
}
function getDateWithoutTime(date) {
    var result = new Date(date.getTime());
    result.setHours(0, 0, 0, 0);
    return result;
}
function pushIfAbsent(array, value) {
    if (array.indexOf(value) < 0) {
        array.push(value);
        return true;
    }
    return false;
}
function removeContent(elements) {
    elements.each(function (i, element) {
        var attributes = $.map(element.attributes, function (item) {
            return item.name;
        });
        $.each(attributes, function (i, item) {
            $(element).removeAttr(item);
        });
        $(element).empty();
    });
}

var SortingType;
(function (SortingType) {
    SortingType[SortingType["PopularityDesc"] = 0] = "PopularityDesc";
    SortingType[SortingType["PopularityAsc"] = 1] = "PopularityAsc";
    SortingType[SortingType["TitleDesc"] = 2] = "TitleDesc";
    SortingType[SortingType["TitleAsc"] = 3] = "TitleAsc";
    SortingType[SortingType["PublishDateNewFirst"] = 4] = "PublishDateNewFirst";
    SortingType[SortingType["PublishDateOldFirst"] = 5] = "PublishDateOldFirst";
    SortingType[SortingType["SourceAsc"] = 6] = "SourceAsc";
    SortingType[SortingType["SourceDesc"] = 7] = "SourceDesc";
    SortingType[SortingType["ReceivedDateNewFirst"] = 8] = "ReceivedDateNewFirst";
    SortingType[SortingType["ReceivedDateOldFirst"] = 9] = "ReceivedDateOldFirst";
    SortingType[SortingType["SourceNewestReceiveDate"] = 10] = "SourceNewestReceiveDate";
    SortingType[SortingType["Random"] = 11] = "Random";
    SortingType[SortingType["PublishDayNewFirst"] = 12] = "PublishDayNewFirst";
    SortingType[SortingType["PublishDayOldFirst"] = 13] = "PublishDayOldFirst";
})(SortingType = exported.SortingType || (exported.SortingType = {}));
var FilteringType;
(function (FilteringType) {
    FilteringType[FilteringType["RestrictedOn"] = 0] = "RestrictedOn";
    FilteringType[FilteringType["FilteredOut"] = 1] = "FilteredOut";
})(FilteringType = exported.FilteringType || (exported.FilteringType = {}));
var KeywordMatchingArea;
(function (KeywordMatchingArea) {
    KeywordMatchingArea[KeywordMatchingArea["Title"] = 0] = "Title";
    KeywordMatchingArea[KeywordMatchingArea["Body"] = 1] = "Body";
    KeywordMatchingArea[KeywordMatchingArea["Author"] = 2] = "Author";
})(KeywordMatchingArea = exported.KeywordMatchingArea || (exported.KeywordMatchingArea = {}));
var KeywordMatchingMethod;
(function (KeywordMatchingMethod) {
    KeywordMatchingMethod[KeywordMatchingMethod["Simple"] = 0] = "Simple";
    KeywordMatchingMethod[KeywordMatchingMethod["Word"] = 1] = "Word";
    KeywordMatchingMethod[KeywordMatchingMethod["RegExp"] = 2] = "RegExp";
})(KeywordMatchingMethod = exported.KeywordMatchingMethod || (exported.KeywordMatchingMethod = {}));
var ColoringRuleSource;
(function (ColoringRuleSource) {
    ColoringRuleSource[ColoringRuleSource["SpecificKeywords"] = 0] = "SpecificKeywords";
    ColoringRuleSource[ColoringRuleSource["SourceTitle"] = 1] = "SourceTitle";
    ColoringRuleSource[ColoringRuleSource["RestrictingKeywords"] = 2] = "RestrictingKeywords";
    ColoringRuleSource[ColoringRuleSource["FilteringKeywords"] = 3] = "FilteringKeywords";
})(ColoringRuleSource = exported.ColoringRuleSource || (exported.ColoringRuleSource = {}));
var HTMLElementType;
(function (HTMLElementType) {
    HTMLElementType[HTMLElementType["SelectBox"] = 0] = "SelectBox";
    HTMLElementType[HTMLElementType["CheckBox"] = 1] = "CheckBox";
    HTMLElementType[HTMLElementType["NumberInput"] = 2] = "NumberInput";
    HTMLElementType[HTMLElementType["ColorInput"] = 3] = "ColorInput";
})(HTMLElementType = exported.HTMLElementType || (exported.HTMLElementType = {}));
function getFilteringTypes() {
    return [FilteringType.FilteredOut, FilteringType.RestrictedOn];
}
function getFilteringTypeId(type) {
    return FilteringType[type];
}

var AsyncResult = (function () {
    function AsyncResult(task, taskThisArg) {
        this.task = task;
        this.taskThisArg = taskThisArg;
    }
    AsyncResult.prototype.then = function (callback, thisArg) {
        try {
            this.resultCallback = callback;
            this.resultThisArg = thisArg;
            this.task.call(this.taskThisArg, this);
        }
        catch (e) {
            console.log(e);
        }
    };
    AsyncResult.prototype.result = function (result) {
        try {
            this.resultCallback.call(this.resultThisArg, result);
        }
        catch (e) {
            console.log(e);
        }
    };
    AsyncResult.prototype.chain = function (asyncResult) {
        this.then(function () {
            asyncResult.done();
        }, this);
    };
    AsyncResult.prototype.done = function () {
        try {
            this.resultCallback.apply(this.resultThisArg);
        }
        catch (e) {
            console.log(e);
        }
    };
    return AsyncResult;
}());

var UserScriptInitializer = (function () {
    function UserScriptInitializer() {
    }
    UserScriptInitializer.prototype.loadScript = function (name) {
        injectScriptText(GM_getResourceText(name));
    };
    UserScriptInitializer.prototype.getResourceURLs = function () {
        return {
            plusIconURL: "https://cdn0.iconfinder.com/data/icons/social-messaging-ui-color-shapes/128/add-circle-blue-128.png",
            eraseIconURL: "https://cdn2.iconfinder.com/data/icons/large-glossy-svg-icons/512/erase_delete_remove_wipe_out-128.png",
            closeIconURL: "https://cdn2.iconfinder.com/data/icons/social-productivity-line-art-1/128/close-cancel-128.png",
            moveUpIconURL: "https://cdn2.iconfinder.com/data/icons/designers-and-developers-icon-set/32/move_up-32.png",
            moveDownIconURL: "https://cdn2.iconfinder.com/data/icons/designers-and-developers-icon-set/32/move_down-32.png",
            openInNewTabURL: "http://findicons.com/files/icons/2315/default_icon/256/open_in_new_window.png",
            extensionIconURL: "https://raw.githubusercontent.com/soufianesakhi/feedly-filtering-and-sorting/master/web-ext/icons/128.png"
        };
    };
    return UserScriptInitializer;
}());
var INITIALIZER = new UserScriptInitializer();

var UserScriptStorage = (function () {
    function UserScriptStorage() {
    }
    UserScriptStorage.prototype.getAsync = function (id, defaultValue) {
        return new AsyncResult(function (p) {
            p.result(JSON.parse(GM_getValue(id, JSON.stringify(defaultValue))));
        }, this);
    };
    UserScriptStorage.prototype.getItemsAsync = function (ids) {
        return new AsyncResult(function (p) {
            var results = {};
            ids.forEach(function (id) {
                var value = GM_getValue(id, null);
                if (value != null) {
                    results[id] = JSON.parse(value);
                }
            });
            p.result(results);
        }, this);
    };
    UserScriptStorage.prototype.put = function (id, value) {
        GM_setValue(id, JSON.stringify(value));
    };
    UserScriptStorage.prototype.delete = function (id) {
        GM_deleteValue(id);
    };
    UserScriptStorage.prototype.listKeys = function () {
        return GM_listValues();
    };
    UserScriptStorage.prototype.init = function () {
        return new AsyncResult(function (p) {
            p.done();
        }, this);
    };
    UserScriptStorage.prototype.getSyncStorageManager = function () {
        return null;
    };
    UserScriptStorage.prototype.getLocalStorage = function () {
        return this;
    };
    return UserScriptStorage;
}());
var DataStore = new UserScriptStorage();

var SubscriptionDTO = (function () {
    function SubscriptionDTO(url) {
        var _this = this;
        this.filteringEnabled = false;
        this.restrictingEnabled = false;
        this.sortingEnabled = true;
        this.openAndMarkAsRead = true;
        this.visualOpenAndMarkAsRead = false;
        this.titleOpenAndMarkAsRead = false;
        this.markAsReadAboveBelow = false;
        this.markAsReadAboveBelowRead = true;
        this.hideWhenMarkAboveBelow = false;
        this.openCurrentFeedArticles = false;
        this.openCurrentFeedArticlesUnreadOnly = true;
        this.markAsReadOnOpenCurrentFeedArticles = true;
        this.maxOpenCurrentFeedArticles = 0;
        this.hideAfterRead = false;
        this.replaceHiddenWithGap = false;
        this.markAsReadFiltered = false;
        this.sortingType = SortingType.PopularityDesc;
        this.advancedControlsReceivedPeriod = new AdvancedControlsReceivedPeriod();
        this.pinHotToTop = false;
        this.additionalSortingTypes = [];
        this.filteringListsByType = {};
        this.keywordMatchingAreas = [KeywordMatchingArea.Title];
        this.alwaysUseDefaultMatchingAreas = true;
        this.keywordMatchingMethod = KeywordMatchingMethod.Simple;
        this.coloringRules = [];
        this.autoRefreshEnabled = false;
        this.autoRefreshMinutes = 60;
        this.hideDuplicates = false;
        this.markAsReadDuplicates = false;
        this.highlightDuplicates = false;
        this.highlightDuplicatesColor = "FFFF00";
        this.filteringByReadingTime = new FilteringByReadingTime();
        this.url = url;
        getFilteringTypes().forEach(function (type) {
            _this.filteringListsByType[type] = [];
        });
    }
    return SubscriptionDTO;
}());
var AdvancedControlsReceivedPeriod = (function () {
    function AdvancedControlsReceivedPeriod() {
        this.maxHours = 6;
        this.keepUnread = false;
        this.hide = false;
        this.showIfHot = false;
        this.minPopularity = 200;
        this.markAsReadVisible = false;
    }
    return AdvancedControlsReceivedPeriod;
}());
var FilteringByReadingTime = (function () {
    function FilteringByReadingTime() {
        this.enabled = false;
        this.filterLong = true;
        this.thresholdMinutes = 5;
        this.keepUnread = false;
        this.wordsPerMinute = 200;
    }
    return FilteringByReadingTime;
}());
var ColoringRule = (function () {
    function ColoringRule() {
        this.source = ColoringRuleSource.SpecificKeywords;
        this.color = "FFFF00";
        this.highlightAllTitle = true;
        this.matchingMethod = KeywordMatchingMethod.Simple;
        this.specificKeywords = [];
    }
    return ColoringRule;
}());

var Subscription = (function () {
    function Subscription(dao, dto) {
        this.dao = dao;
        if (dto) {
            this.dto = dto;
        }
    }
    Subscription.prototype.getURL = function () {
        return this.dto.url;
    };
    Subscription.prototype.isFilteringEnabled = function () {
        return this.dto.filteringEnabled;
    };
    Subscription.prototype.isRestrictingEnabled = function () {
        return this.dto.restrictingEnabled;
    };
    Subscription.prototype.isSortingEnabled = function () {
        return this.dto.sortingEnabled;
    };
    Subscription.prototype.isPinHotToTop = function () {
        return this.dto.pinHotToTop;
    };
    Subscription.prototype.isOpenAndMarkAsRead = function () {
        return this.dto.openAndMarkAsRead;
    };
    Subscription.prototype.isVisualOpenAndMarkAsRead = function () {
        return this.dto.visualOpenAndMarkAsRead;
    };
    Subscription.prototype.isTitleOpenAndMarkAsRead = function () {
        return this.dto.titleOpenAndMarkAsRead;
    };
    Subscription.prototype.isMarkAsReadAboveBelow = function () {
        return this.dto.markAsReadAboveBelow;
    };
    Subscription.prototype.isMarkAsReadAboveBelowRead = function () {
        return this.dto.markAsReadAboveBelowRead;
    };
    Subscription.prototype.isHideWhenMarkAboveBelow = function () {
        return this.dto.hideWhenMarkAboveBelow;
    };
    Subscription.prototype.isOpenCurrentFeedArticles = function () {
        return this.dto.openCurrentFeedArticles;
    };
    Subscription.prototype.isOpenCurrentFeedArticlesUnreadOnly = function () {
        return this.dto.openCurrentFeedArticlesUnreadOnly;
    };
    Subscription.prototype.isMarkAsReadOnOpenCurrentFeedArticles = function () {
        return this.dto.markAsReadOnOpenCurrentFeedArticles;
    };
    Subscription.prototype.getMaxOpenCurrentFeedArticles = function () {
        return this.dto.maxOpenCurrentFeedArticles;
    };
    Subscription.prototype.isHideAfterRead = function () {
        return this.dto.hideAfterRead;
    };
    Subscription.prototype.isReplaceHiddenWithGap = function () {
        return this.dto.replaceHiddenWithGap;
    };
    Subscription.prototype.isAlwaysUseDefaultMatchingAreas = function () {
        return this.dto.alwaysUseDefaultMatchingAreas;
    };
    Subscription.prototype.isMarkAsReadFiltered = function () {
        return this.dto.markAsReadFiltered;
    };
    Subscription.prototype.getAdvancedControlsReceivedPeriod = function () {
        return this.dto.advancedControlsReceivedPeriod;
    };
    Subscription.prototype.getSortingType = function () {
        return this.dto.sortingType;
    };
    Subscription.prototype.getFilteringList = function (type) {
        return this.dto.filteringListsByType[type];
    };
    Subscription.prototype.getKeywordMatchingAreas = function () {
        return this.dto.keywordMatchingAreas;
    };
    Subscription.prototype.getKeywordMatchingMethod = function () {
        return this.dto.keywordMatchingMethod;
    };
    Subscription.prototype.isAutoRefreshEnabled = function () {
        return this.dto.autoRefreshEnabled;
    };
    Subscription.prototype.getAutoRefreshTime = function () {
        return this.dto.autoRefreshMinutes * 60 * 1000;
    };
    Subscription.prototype.checkDuplicates = function () {
        return (this.isHideDuplicates() ||
            this.isMarkAsReadDuplicates() ||
            this.isHighlightDuplicates());
    };
    Subscription.prototype.isHideDuplicates = function () {
        return this.dto.hideDuplicates;
    };
    Subscription.prototype.isMarkAsReadDuplicates = function () {
        return this.dto.markAsReadDuplicates;
    };
    Subscription.prototype.isHighlightDuplicates = function () {
        return this.dto.highlightDuplicates;
    };
    Subscription.prototype.getHighlightDuplicatesColor = function () {
        return this.dto.highlightDuplicatesColor;
    };
    Subscription.prototype.getFilteringByReadingTime = function () {
        return this.dto.filteringByReadingTime;
    };
    Subscription.prototype.setHours_AdvancedControlsReceivedPeriod = function (hours) {
        if (hours > 23) {
            return;
        }
        var advancedPeriodDays = Math.floor(this.getAdvancedControlsReceivedPeriod().maxHours / 24);
        this.setMaxHours_AdvancedControlsReceivedPeriod(hours, advancedPeriodDays);
    };
    Subscription.prototype.setDays_AdvancedControlsReceivedPeriod = function (days) {
        var advancedPeriodHours = this.getAdvancedControlsReceivedPeriod().maxHours % 24;
        this.setMaxHours_AdvancedControlsReceivedPeriod(advancedPeriodHours, days);
    };
    Subscription.prototype.setMaxHours_AdvancedControlsReceivedPeriod = function (hours, days) {
        var maxHours = hours + 24 * days;
        this.getAdvancedControlsReceivedPeriod().maxHours = maxHours;
        this.save();
    };
    Subscription.prototype.getAdditionalSortingTypes = function () {
        return this.dto.additionalSortingTypes;
    };
    Subscription.prototype.setAdditionalSortingTypes = function (additionalSortingTypes) {
        this.dto.additionalSortingTypes = additionalSortingTypes;
        this.save();
    };
    Subscription.prototype.addAdditionalSortingType = function (additionalSortingType) {
        this.dto.additionalSortingTypes.push(additionalSortingType);
        this.save();
    };
    Subscription.prototype.getColoringRules = function () {
        return this.dto.coloringRules;
    };
    Subscription.prototype.setColoringRules = function (coloringRules) {
        this.dto.coloringRules = coloringRules;
        this.save();
    };
    Subscription.prototype.addColoringRule = function (coloringRule) {
        this.dto.coloringRules.push(coloringRule);
        this.save();
    };
    Subscription.prototype.addKeyword = function (keyword, type) {
        this.getFilteringList(type).push(keyword.trim());
        this.save();
    };
    Subscription.prototype.removeKeyword = function (keyword, type) {
        var keywordList = this.getFilteringList(type);
        var index = keywordList.indexOf(keyword);
        if (index > -1) {
            keywordList.splice(index, 1);
        }
        this.save();
    };
    Subscription.prototype.resetFilteringList = function (type) {
        this.getFilteringList(type).length = 0;
    };
    Subscription.prototype.save = function () {
        this.dao.save(this.dto);
    };
    return Subscription;
}());

var SubscriptionDAO = (function () {
    function SubscriptionDAO() {
        this.SUBSCRIPTION_ID_PREFIX = "subscription_";
        this.GLOBAL_SETTINGS_SUBSCRIPTION_URL = "---global settings---";
        registerAccessors(new SubscriptionDTO(""), "dto", Subscription.prototype, this.save, this);
    }
    SubscriptionDAO.prototype.init = function () {
        var _this = this;
        return new AsyncResult(function (p) {
            DataStore.init().then(function () {
                var t = _this;
                var onLoad = function (sub) {
                    t.defaultSubscription = sub;
                    p.done();
                };
                if (DataStore.listKeys().indexOf(_this.getSubscriptionId(_this.GLOBAL_SETTINGS_SUBSCRIPTION_URL)) > -1) {
                    _this.loadSubscription(_this.GLOBAL_SETTINGS_SUBSCRIPTION_URL).then(onLoad, _this);
                }
                else {
                    // First time installing
                    var dto = new SubscriptionDTO(_this.GLOBAL_SETTINGS_SUBSCRIPTION_URL);
                    _this.save(dto);
                    onLoad.call(_this, new Subscription(_this, dto));
                }
            }, _this);
        }, this);
    };
    SubscriptionDAO.prototype.loadSubscription = function (url, forceReloadGlobalSettings) {
        var _this = this;
        return new AsyncResult(function (p) {
            var sub = new Subscription(_this);
            if (forceReloadGlobalSettings) {
                url = _this.GLOBAL_SETTINGS_SUBSCRIPTION_URL;
            }
            _this.load(url).then(function (dto) {
                sub.dto = dto;
                if (forceReloadGlobalSettings) {
                    _this.defaultSubscription = sub;
                }
                p.result(sub);
            }, _this);
        }, this);
    };
    SubscriptionDAO.prototype.save = function (dto) {
        var url = dto.url;
        var id = this.getSubscriptionId(url);
        DataStore.put(id, dto);
        console.log("Subscription saved: " + JSON.stringify(dto));
    };
    SubscriptionDAO.prototype.saveAll = function (subscriptions) {
        for (var url in subscriptions) {
            subscriptions[url].url = url;
            this.save(subscriptions[url]);
        }
        var globalSettings = subscriptions[this.GLOBAL_SETTINGS_SUBSCRIPTION_URL];
        if (globalSettings) {
            // ensure initialization of new properties
            var defaultDTO = this.clone(globalSettings, globalSettings.url);
            this.defaultSubscription = new Subscription(this, defaultDTO);
        }
    };
    SubscriptionDAO.prototype.loadAll = function () {
        var _this = this;
        return new AsyncResult(function (p) {
            var ids = _this.getAllSubscriptionIds();
            DataStore.getItemsAsync(ids).then(function (results) {
                for (var key in results) {
                    var url = results[key].url;
                    if (!url) {
                        url = key.substring(_this.SUBSCRIPTION_ID_PREFIX.length);
                    }
                    results[url] = results[key];
                    delete results[url].url;
                    delete results[key];
                }
                p.result(results);
            }, _this);
        }, this);
    };
    SubscriptionDAO.prototype.load = function (url) {
        var _this = this;
        return new AsyncResult(function (p) {
            DataStore.getAsync(_this.getSubscriptionId(url), null).then(function (dto) {
                var cloneURL;
                if (dto) {
                    var linkedURL = dto.linkedUrl;
                    if (linkedURL != null) {
                        console.log("Loading linked subscription: " + linkedURL);
                        _this.load(linkedURL).then(function (dto) {
                            p.result(dto);
                        }, _this);
                        return;
                    }
                    else {
                        cloneURL = dto.url;
                        console.log("Loaded saved subscription: " + JSON.stringify(dto));
                    }
                }
                else {
                    dto = _this.defaultSubscription
                        ? _this.defaultSubscription.dto
                        : new SubscriptionDTO(url);
                    cloneURL = url;
                }
                dto = _this.clone(dto, cloneURL);
                p.result(dto);
            }, _this);
        }, this);
    };
    SubscriptionDAO.prototype.delete = function (url) {
        DataStore.delete(this.getSubscriptionId(url));
        console.log("Deleted: " + url);
    };
    SubscriptionDAO.prototype.clone = function (dtoToClone, cloneUrl) {
        var clone = deepClone(dtoToClone, new SubscriptionDTO(cloneUrl), {
            advancedControlsReceivedPeriod: new AdvancedControlsReceivedPeriod(),
            coloringRules: ColoringRule,
            filteringByReadingTime: new FilteringByReadingTime()
        });
        clone.url = cloneUrl;
        return clone;
    };
    SubscriptionDAO.prototype.importSettings = function (urlToImport, actualUrl) {
        var _this = this;
        return new AsyncResult(function (p) {
            _this.load(urlToImport).then(function (dto) {
                dto.url = actualUrl;
                if (_this.isURLGlobal(actualUrl)) {
                    _this.defaultSubscription.dto = dto;
                }
                _this.save(dto);
                p.done();
            }, _this);
        }, this);
    };
    SubscriptionDAO.prototype.getGlobalSettings = function () {
        return this.defaultSubscription;
    };
    SubscriptionDAO.prototype.getAllSubscriptionIds = function () {
        var _this = this;
        return DataStore.listKeys().filter(function (value) {
            return value.indexOf(_this.SUBSCRIPTION_ID_PREFIX) == 0;
        });
    };
    SubscriptionDAO.prototype.getAllSubscriptionURLs = function () {
        var _this = this;
        return this.getAllSubscriptionIds().map(function (value) {
            return value.substring(_this.SUBSCRIPTION_ID_PREFIX.length);
        });
    };
    SubscriptionDAO.prototype.getSubscriptionId = function (url) {
        return this.SUBSCRIPTION_ID_PREFIX + url;
    };
    SubscriptionDAO.prototype.linkSubscriptions = function (url, linkedURL) {
        var id = this.getSubscriptionId(url);
        var linkedSub = new LinkedSubscriptionDTO(linkedURL);
        var t = this;
        DataStore.put(id, linkedSub);
        console.log("Subscription linked: " + JSON.stringify(linkedSub));
    };
    SubscriptionDAO.prototype.isURLGlobal = function (url) {
        return url === this.GLOBAL_SETTINGS_SUBSCRIPTION_URL;
    };
    return SubscriptionDAO;
}());
var LinkedSubscriptionDTO = (function () {
    function LinkedSubscriptionDTO(linkedUrl) {
        this.linkedUrl = linkedUrl;
    }
    return LinkedSubscriptionDTO;
}());

var SettingsManager = (function () {
    function SettingsManager(uiManager) {
        this.defaultUrlPrefixPattern = new RegExp(ext.defaultUrlPrefixPattern, "i");
        this.subscriptionUrlPrefixPattern = new RegExp(ext.subscriptionUrlPrefixPattern, "i");
        this.categoryUrlPrefixPattern = new RegExp(ext.categoryUrlPrefixPattern, "i");
        this.crossCheckDuplicatesSettings = new CrossCheckDuplicatesSettings();
        this.dao = new SubscriptionDAO();
        this.uiManager = uiManager;
    }
    SettingsManager.prototype.init = function () {
        var _this = this;
        return new AsyncResult(function (p) {
            _this.dao.init().chain(p);
        }, this);
    };
    SettingsManager.prototype.loadSubscription = function (globalSettingsEnabled, forceReloadGlobalSettings) {
        var _this = this;
        return new AsyncResult(function (p) {
            var onLoad = function (sub) {
                _this.currentSubscription = sub;
                p.result(sub);
            };
            if (globalSettingsEnabled) {
                if (forceReloadGlobalSettings) {
                    _this.dao.loadSubscription(null, true).then(onLoad, _this);
                }
                else {
                    onLoad.call(_this, _this.dao.getGlobalSettings());
                }
            }
            else {
                _this.dao
                    .loadSubscription(_this.getActualSubscriptionURL())
                    .then(onLoad, _this);
            }
        }, this);
    };
    SettingsManager.prototype.linkToSubscription = function (url) {
        var currentURL = this.currentSubscription.getURL();
        if (url === currentURL) {
            alert("Linking to the same subscription URL is impossible");
        }
        else if (this.isGlobalMode()) {
            alert("Global settings can't be linked to any other subscription");
        }
        else {
            this.dao.linkSubscriptions(currentURL, url);
        }
    };
    SettingsManager.prototype.deleteSubscription = function (url) {
        this.dao.delete(url);
    };
    SettingsManager.prototype.importAllSettings = function (file) {
        var _this = this;
        var fr = new FileReader();
        fr.onload = function () {
            try {
                var settingsExport = JSON.parse(fr.result);
                _this.uiManager.autoLoadAllArticlesCB.refreshValue(settingsExport.autoLoadAllArticles);
                _this.uiManager.loadByBatchEnabledCB.refreshValue(settingsExport.loadByBatchEnabled);
                _this.uiManager.batchSizeInput.refreshValue(settingsExport.batchSize);
                _this.uiManager.globalSettingsEnabledCB.refreshValue(settingsExport.globalSettingsEnabled);
                _this.dao.saveAll(settingsExport.subscriptions);
                _this.uiManager.refreshPage();
                alert("The settings were successfully imported");
            }
            catch (e) {
                console.log(e);
                alert("The file is incorrectly formatted");
            }
        };
        fr.readAsText(file);
    };
    SettingsManager.prototype.exportAllSettings = function () {
        var _this = this;
        this.dao.loadAll().then(function (subscriptions) {
            var settingsExport = {
                autoLoadAllArticles: _this.uiManager.autoLoadAllArticlesCB.getValue(),
                loadByBatchEnabled: _this.uiManager.loadByBatchEnabledCB.getValue(),
                batchSize: _this.uiManager.batchSizeInput.getValue(),
                globalSettingsEnabled: _this.uiManager.globalSettingsEnabledCB.getValue(),
                subscriptions: subscriptions
            };
            exportFile(JSON.stringify(settingsExport, null, 4), "feedly-filtering-and-sorting.json");
        }, this);
    };
    SettingsManager.prototype.importSubscription = function (url) {
        var _this = this;
        return new AsyncResult(function (p) {
            var currentURL = _this.currentSubscription.getURL();
            _this.dao.importSettings(url, currentURL).chain(p);
        }, this);
    };
    SettingsManager.prototype.getAllSubscriptionURLs = function () {
        return this.dao.getAllSubscriptionURLs();
    };
    SettingsManager.prototype.getActualSubscriptionURL = function () {
        var url = document.URL.replace(this.subscriptionUrlPrefixPattern, "subscription")
            .replace(this.categoryUrlPrefixPattern, "")
            .replace(this.defaultUrlPrefixPattern, "");
        return decodeURIComponent(url);
    };
    SettingsManager.prototype.isGlobalMode = function () {
        return this.dao.isURLGlobal(this.currentSubscription.getURL());
    };
    SettingsManager.prototype.getCurrentSubscription = function () {
        return this.currentSubscription;
    };
    SettingsManager.prototype.getCrossCheckDuplicatesSettings = function () {
        return this.crossCheckDuplicatesSettings;
    };
    return SettingsManager;
}());
var CrossCheckDuplicatesSettings = (function () {
    function CrossCheckDuplicatesSettings() {
    }
    CrossCheckDuplicatesSettings.prototype.setChangeCallback = function (fun) {
        this.changeCallback = fun;
    };
    CrossCheckDuplicatesSettings.prototype.isEnabled = function () {
        return this.enabled;
    };
    CrossCheckDuplicatesSettings.prototype.setEnabled = function (enabled) {
        this.enabled = enabled;
        this.changeCallback();
    };
    CrossCheckDuplicatesSettings.prototype.getDays = function () {
        return this.days;
    };
    CrossCheckDuplicatesSettings.prototype.setDays = function (days) {
        this.days = days;
        this.changeCallback();
    };
    return CrossCheckDuplicatesSettings;
}());

var ArticleManager = (function () {
    function ArticleManager(settingsManager, keywordManager, page) {
        this.articlesToMarkAsRead = [];
        this.settingsManager = settingsManager;
        this.keywordManager = keywordManager;
        this.articleSorterFactory = new ArticleSorterFactory();
        this.page = page;
        this.duplicateChecker = new DuplicateChecker(this);
    }
    ArticleManager.prototype.refreshArticles = function () {
        var _this = this;
        this.resetArticles();
        if ($(ext.articleSelector).length == 0) {
            return;
        }
        $(ext.articleSelector).each(function (i, e) {
            _this.addArticle(e, true);
        });
        this.checkLastAddedArticle(true);
        this.sortArticles(true);
    };
    ArticleManager.prototype.resetArticles = function () {
        this.articlesToMarkAsRead = [];
        this.duplicateChecker.reset();
    };
    ArticleManager.prototype.refreshColoring = function () {
        var _this = this;
        $(ext.articleSelector).each(function (i, e) {
            _this.applyColoringRules(new Article(e));
        });
    };
    ArticleManager.prototype.getCurrentSub = function () {
        return this.settingsManager.getCurrentSubscription();
    };
    ArticleManager.prototype.getCurrentUnreadCount = function () {
        return $(ext.articleSelector).length;
    };
    ArticleManager.prototype.addArticle = function (a, skipCheck) {
        var article = new Article(a);
        this.filterAndRestrict(article);
        this.advancedControls(article);
        this.applyColoringRules(article);
        if (!skipCheck) {
            article.checked();
            this.checkLastAddedArticle();
            this.sortArticles();
        }
    };
    ArticleManager.prototype.filterAndRestrict = function (article) {
        var sub = this.getCurrentSub();
        if (sub.isFilteringEnabled() || sub.isRestrictingEnabled()) {
            var hide = false;
            if (sub.isRestrictingEnabled()) {
                hide = this.keywordManager.matchKeywords(article, sub, FilteringType.RestrictedOn, true);
            }
            if (sub.isFilteringEnabled()) {
                var filtered = this.keywordManager.matchKeywords(article, sub, FilteringType.FilteredOut);
                hide = hide || filtered;
                if (filtered && sub.isMarkAsReadFiltered()) {
                    article.addClass(ext.markAsReadImmediatelyClass);
                }
            }
            if (hide) {
                article.setVisible(false);
            }
            else {
                article.setVisible();
            }
        }
        else {
            article.setVisible();
        }
    };
    ArticleManager.prototype.advancedControls = function (article) {
        var sub = this.getCurrentSub();
        var advControls = sub.getAdvancedControlsReceivedPeriod();
        if (advControls.keepUnread || advControls.hide) {
            try {
                var threshold = Date.now() - advControls.maxHours * 3600 * 1000;
                var receivedAge = article.getReceivedAge();
                if (receivedAge <= threshold) {
                    if (advControls.keepUnread) {
                        this.articlesToMarkAsRead.push(article);
                    }
                }
                else {
                    if (advControls.showIfHot &&
                        (article.isHot() ||
                            article.getPopularity() >= advControls.minPopularity)) {
                        if (advControls.keepUnread && advControls.markAsReadVisible) {
                            this.articlesToMarkAsRead.push(article);
                        }
                    }
                    else if (advControls.hide) {
                        article.setVisible(false);
                    }
                }
            }
            catch (err) {
                console.log(err);
            }
        }
        this.duplicateChecker.check(article);
        var filteringByReadingTime = sub.getFilteringByReadingTime();
        if (filteringByReadingTime.enabled) {
            var thresholdWords = filteringByReadingTime.thresholdMinutes *
                filteringByReadingTime.wordsPerMinute;
            var articleWords = article.body.split(" ").length;
            if (articleWords != thresholdWords &&
                filteringByReadingTime.filterLong == articleWords > thresholdWords) {
                article.setVisible(false);
            }
            else if (filteringByReadingTime.keepUnread) {
                this.articlesToMarkAsRead.push(article);
            }
        }
    };
    ArticleManager.prototype.checkPopularityAndSort = function () {
        var popularityArr = [];
        var hotPopularityArr = [];
        $(ext.articleSelector + ":visible").each(function (i, article) {
            var engagement = $(article).find(ext.popularitySelector);
            var popularity = parsePopularity($(engagement).text());
            if ($(engagement).is(".hot, .onfire")) {
                hotPopularityArr.push(popularity);
            }
            else {
                popularityArr.push(popularity);
            }
        });
        var sorted = this.checkPopularitySorted(hotPopularityArr);
        sorted = this.checkPopularitySorted(popularityArr);
        if (!sorted) {
            console.log("Sorting by popularity after check");
            this.sortArticles(true);
        }
    };
    ArticleManager.prototype.checkPopularitySorted = function (popularityArr) {
        var sorted = true;
        var sortedCheck = this.getCurrentSub().getSortingType() == SortingType.PopularityDesc
            ? function (i) {
                return popularityArr[i] >= popularityArr[i + 1];
            }
            : function (i) {
                return popularityArr[i] <= popularityArr[i + 1];
            };
        for (var i = 0; i < popularityArr.length - 1 && sorted; i++) {
            sorted = sortedCheck(i);
        }
        return sorted;
    };
    ArticleManager.prototype.applyColoringRules = function (article) {
        var sub = this.getCurrentSub();
        var rules = sub.getColoringRules();
        for (var i = 0; i < rules.length; i++) {
            var rule = rules[i];
            var keywords = void 0;
            switch (rule.source) {
                case ColoringRuleSource.SpecificKeywords:
                    keywords = rule.specificKeywords;
                    break;
                case ColoringRuleSource.RestrictingKeywords:
                    keywords = sub.getFilteringList(FilteringType.RestrictedOn);
                    break;
                case ColoringRuleSource.FilteringKeywords:
                    keywords = sub.getFilteringList(FilteringType.FilteredOut);
                    break;
            }
            if (rule.source == ColoringRuleSource.SourceTitle) {
                article.setColor(this.generateColor(article.getSource()));
            }
            else {
                var match = this.keywordManager.matchSpecficKeywords(article, keywords, rule.matchingMethod);
                var color = article.setColor(match ? "#" + rule.color : "");
                if (match) {
                    return;
                }
            }
        }
    };
    ArticleManager.prototype.generateColor = function (id) {
        if (!id || id.length == 0) {
            return "";
        }
        var x = 0;
        for (var i = 0; i < id.length; i++) {
            x += id.charCodeAt(i);
        }
        var h = ((x % 36) + 1) * 1;
        var s = 30 + ((x % 5) + 1) * 10;
        return "hsl(" + h + ", " + s + "%, 80%)";
    };
    ArticleManager.prototype.checkLastAddedArticle = function (refresh) {
        var allArticlesChecked = $(ext.uncheckedArticlesSelector).length == 0;
        if (allArticlesChecked) {
            this.prepareMarkAsRead();
            this.page.refreshHidingInfo();
            if (!refresh) {
                this.duplicateChecker.allArticlesChecked();
            }
        }
    };
    ArticleManager.prototype.sortArticles = function (force) {
        var _this = this;
        if (!this.page.get(ext.sortArticlesId) && !force) {
            return;
        }
        this.page.put(ext.sortArticlesId, false);
        var sub = this.getCurrentSub();
        var endOfFeed;
        var sortedVisibleEntryIds = [];
        $(ext.articlesContainerSelector).each(function (i, c) {
            var visibleArticles = [];
            var hiddenArticles = [];
            var articlesContainer = $(c);
            articlesContainer.find(ext.containerArticleSelector).each(function (i, e) {
                var a = new Article(e);
                if (a.isVisible()) {
                    visibleArticles.push(a);
                }
                else {
                    hiddenArticles.push(a);
                }
            });
            if (sub.isPinHotToTop()) {
                var hotArticles = [];
                var normalArticles = [];
                visibleArticles.forEach(function (article) {
                    if (article.isHot()) {
                        hotArticles.push(article);
                    }
                    else {
                        normalArticles.push(article);
                    }
                });
                _this.sortArticleArray(hotArticles);
                _this.sortArticleArray(normalArticles);
                visibleArticles = hotArticles.concat(normalArticles);
            }
            else {
                _this.sortArticleArray(visibleArticles);
            }
            if (sub.isSortingEnabled() || sub.isPinHotToTop()) {
                console.log("Sorting articles at " + new Date().toTimeString());
                endOfFeed || (endOfFeed = $(ext.endOfFeedSelector).detach());
                removeContent(articlesContainer.find("h4"));
                var chunks = articlesContainer.find(ext.articlesChunkSelector);
                var containerChunk_1 = chunks.first();
                var h4Headings = containerChunk_1.find("h4").detach();
                containerChunk_1.empty();
                h4Headings.prependTo(containerChunk_1);
                var appendArticle = function (article) {
                    var container = article.getContainer();
                    container.detach().appendTo(containerChunk_1);
                };
                visibleArticles.forEach(appendArticle);
                hiddenArticles.forEach(appendArticle);
            }
            sortedVisibleEntryIds.push.apply(sortedVisibleEntryIds, visibleArticles.map(function (a) { return a.getEntryId(); }));
        });
        var lastContainer = $(ext.articlesContainerSelector).last();
        if (endOfFeed) {
            lastContainer.append(endOfFeed);
        }
        else {
            $(ext.endOfFeedSelector)
                .detach()
                .appendTo(lastContainer);
        }
        this.page.put(ext.sortedVisibleArticlesId, sortedVisibleEntryIds);
    };
    ArticleManager.prototype.prepareMarkAsRead = function () {
        if (this.articlesToMarkAsRead.length > 0) {
            var ids = this.articlesToMarkAsRead.map(function (article) {
                return article.getEntryId();
            });
            this.page.put(ext.articlesToMarkAsReadId, ids);
        }
    };
    ArticleManager.prototype.sortArticleArray = function (articles) {
        var sub = this.getCurrentSub();
        if (!sub.isSortingEnabled()) {
            return;
        }
        var st = sub.getSortingType();
        var sortingTypes = [st].concat(sub.getAdditionalSortingTypes());
        articles.sort(this.articleSorterFactory.getSorter(sortingTypes));
        if (SortingType.SourceNewestReceiveDate == st) {
            var sourceToArticles_1 = {};
            articles.forEach(function (a) {
                var sourceArticles = (sourceToArticles_1[a.getSource()] ||
                    (sourceToArticles_1[a.getSource()] = []),
                    sourceToArticles_1[a.getSource()]);
                sourceArticles.push(a);
            });
            articles.length = 0;
            for (var source in sourceToArticles_1) {
                articles.push.apply(articles, sourceToArticles_1[source]);
            }
        }
    };
    ArticleManager.prototype.isOldestFirst = function () {
        return !this.page.get(ext.isNewestFirstId, true);
    };
    return ArticleManager;
}());
var ArticleSorterFactory = (function () {
    function ArticleSorterFactory() {
        this.sorterByType = {};
        function titleSorter(isAscending) {
            var multiplier = isAscending ? 1 : -1;
            return function (a, b) {
                return a.getTitle().localeCompare(b.getTitle()) * multiplier;
            };
        }
        function popularitySorter(isAscending) {
            var multiplier = isAscending ? 1 : -1;
            return function (a, b) {
                return (a.getPopularity() - b.getPopularity()) * multiplier;
            };
        }
        function receivedDateSorter(isNewFirst) {
            var multiplier = isNewFirst ? -1 : 1;
            return function (a, b) {
                return (a.getReceivedAge() - b.getReceivedAge()) * multiplier;
            };
        }
        function publishDateSorter(isNewFirst) {
            var multiplier = isNewFirst ? -1 : 1;
            return function (a, b) {
                return (a.getPublishAge() - b.getPublishAge()) * multiplier;
            };
        }
        function publishDaySorter(isNewFirst) {
            var multiplier = isNewFirst ? -1 : 1;
            return function (a, b) {
                var dateA = a.getPublishDate(), dateB = b.getPublishDate();
                var result = dateA.getFullYear() - dateB.getFullYear();
                if (result == 0) {
                    result = dateA.getMonth() - dateB.getMonth();
                    if (result == 0) {
                        result = dateA.getDay() - dateB.getDay();
                    }
                }
                return result * multiplier;
            };
        }
        function sourceSorter(isAscending) {
            var multiplier = isAscending ? 1 : -1;
            return function (a, b) {
                return a.getSource().localeCompare(b.getSource()) * multiplier;
            };
        }
        this.sorterByType[SortingType.TitleDesc] = titleSorter(false);
        this.sorterByType[SortingType.TitleAsc] = titleSorter(true);
        this.sorterByType[SortingType.PopularityDesc] = popularitySorter(false);
        this.sorterByType[SortingType.PopularityAsc] = popularitySorter(true);
        this.sorterByType[SortingType.ReceivedDateNewFirst] = receivedDateSorter(true);
        this.sorterByType[SortingType.ReceivedDateOldFirst] = receivedDateSorter(false);
        this.sorterByType[SortingType.PublishDateNewFirst] = publishDateSorter(true);
        this.sorterByType[SortingType.PublishDateOldFirst] = publishDateSorter(false);
        this.sorterByType[SortingType.PublishDayNewFirst] = publishDaySorter(true);
        this.sorterByType[SortingType.PublishDayOldFirst] = publishDaySorter(false);
        this.sorterByType[SortingType.SourceAsc] = sourceSorter(true);
        this.sorterByType[SortingType.SourceDesc] = sourceSorter(false);
        this.sorterByType[SortingType.SourceNewestReceiveDate] = receivedDateSorter(true);
        this.sorterByType[SortingType.Random] = function () {
            return Math.random() - 0.5;
        };
    }
    ArticleSorterFactory.prototype.getSorter = function (sortingTypes) {
        var _this = this;
        if (sortingTypes.length == 1) {
            return this.sorterByType[sortingTypes[0]];
        }
        return function (a, b) {
            var res;
            for (var i = 0; i < sortingTypes.length; i++) {
                res = _this.sorterByType[sortingTypes[i]](a, b);
                if (res != 0) {
                    return res;
                }
            }
            return res;
        };
    };
    return ArticleSorterFactory;
}());
var EntryInfos = (function () {
    function EntryInfos(jsonInfos) {
        var bodyInfos = jsonInfos.content ? jsonInfos.content : jsonInfos.summary;
        this.body = bodyInfos ? bodyInfos.content : "";
        this.author = jsonInfos.author;
        this.engagement = jsonInfos.engagement;
        this.published = jsonInfos.published;
        this.received = jsonInfos.crawled;
    }
    return EntryInfos;
}());
var Article = (function () {
    function Article(article) {
        this.checkedAttr = "checked-FFnS";
        this.article = $(article);
        this.entryId = this.article.attr(ext.articleEntryIdAttribute);
        var infosElement = this.article.find("." + ext.entryInfosJsonClass);
        if (infosElement.length > 0) {
            this.entryInfos = JSON.parse(infosElement.text());
            if (this.entryInfos) {
                this.body = this.entryInfos.body;
                this.body = this.body ? this.body.toLowerCase() : "";
                this.author = this.entryInfos.author;
                this.author = this.author ? this.author.toLowerCase() : "";
                this.receivedAge = this.entryInfos.received;
                this.publishAge = this.entryInfos.published;
            }
            else {
                var isArticleView = $(article).hasClass(ext.articleViewClass);
                this.body = this.article
                    .find(isArticleView ? ".content" : ".summary")
                    .text()
                    .toLowerCase();
                this.author = (isArticleView
                    ? (function () {
                        var metadata = $(article)
                            .find(".metadata")
                            .text()
                            .trim()
                            .replace(/\s\s+/gi, "\n")
                            .split("\n");
                        return metadata[3] === "/" ? metadata[2] : metadata[3];
                    })()
                    : this.article.find(".authors").text())
                    .replace("by", "")
                    .trim()
                    .toLowerCase();
                var ageStr = this.article
                    .find(ext.publishAgeSpanSelector)
                    .attr(ext.publishAgeTimestampAttr);
                var ageSplit = ageStr.split("--");
                var publishDate = ageSplit[0].replace(/[^:]*:/, "").trim();
                var receivedDate = ageSplit[1].replace(/[^:]*:/, "").trim();
                this.publishAge = Date.parse(publishDate);
                this.receivedAge = Date.parse(receivedDate);
            }
        }
        // Title
        this.title = this.article
            .attr(ext.articleTitleAttribute)
            .trim()
            .toLowerCase();
        // Popularity
        this.popularity = parsePopularity(this.article.find(ext.popularitySelector).text());
        // Source
        var source = this.article.find(ext.articleSourceSelector);
        if (source != null) {
            this.source = source.text().trim();
        }
        // URL
        this.url = this.article.find(".title").attr("href");
        this.container = this.article.closest(".list-entries > .EntryList__chunk > div");
    }
    Article.prototype.addClass = function (c) {
        return this.article.addClass(c);
    };
    Article.prototype.getTitle = function () {
        return this.title;
    };
    Article.prototype.getUrl = function () {
        return this.url;
    };
    Article.prototype.getSource = function () {
        return this.source;
    };
    Article.prototype.getPopularity = function () {
        return this.popularity;
    };
    Article.prototype.getReceivedAge = function () {
        return this.receivedAge;
    };
    Article.prototype.getReceivedDate = function () {
        return new Date(this.receivedAge);
    };
    Article.prototype.getPublishAge = function () {
        return this.publishAge;
    };
    Article.prototype.getPublishDate = function () {
        return new Date(this.publishAge);
    };
    Article.prototype.isHot = function () {
        var span = this.article.find(ext.popularitySelector);
        return span.hasClass("hot") || span.hasClass("onfire") || span.hasClass("EntryEngagement--hot");
    };
    Article.prototype.getEntryId = function () {
        return this.entryId;
    };
    Article.prototype.setVisible = function (visible) {
        if (visible != null && !visible) {
            this.container.css("display", "none");
        }
        else {
            this.container.css("display", "");
        }
    };
    Article.prototype.getContainer = function () {
        return this.container;
    };
    Article.prototype.isVisible = function () {
        return !(this.container.css("display") === "none");
    };
    Article.prototype.checked = function () {
        this.article.attr(this.checkedAttr, "");
    };
    Article.prototype.setColor = function (color) {
        this.article.css("background-color", color);
    };
    return Article;
}());
function parsePopularity(popularityStr) {
    popularityStr = popularityStr.trim().replace("+", "");
    if (popularityStr.indexOf("K") > -1) {
        popularityStr = popularityStr.replace("K", "");
        popularityStr += "000";
    }
    return Number(popularityStr);
}

var DuplicateChecker = (function () {
    function DuplicateChecker(articleManager) {
        this.articleManager = articleManager;
        this.url2Article = {};
        this.title2Article = {};
        this.crossArticles = new CrossArticleManager(articleManager, this);
    }
    DuplicateChecker.prototype.reset = function () {
        this.url2Article = {};
        this.title2Article = {};
    };
    DuplicateChecker.prototype.allArticlesChecked = function () {
        this.crossArticles.save(true);
    };
    DuplicateChecker.prototype.check = function (article) {
        var sub = this.articleManager.getCurrentSub();
        if (sub.checkDuplicates()) {
            var url = article.getUrl();
            var title = article.getTitle();
            var duplicate = true;
            if (!this.checkDuplicate(article, this.url2Article[url])) {
                this.url2Article[url] = article;
                if (!this.checkDuplicate(article, this.title2Article[title])) {
                    this.title2Article[title] = article;
                    duplicate = false;
                }
            }
            this.crossArticles.addArticle(article, duplicate);
        }
    };
    DuplicateChecker.prototype.checkDuplicate = function (a, b) {
        if (!b || a.getEntryId() === b.getEntryId()) {
            return false;
        }
        var toKeep = a.getPublishAge() > b.getPublishAge() ? a : b;
        var duplicate = a.getPublishAge() > b.getPublishAge() ? b : a;
        this.title2Article[a.getTitle()] = toKeep;
        this.title2Article[b.getTitle()] = toKeep;
        this.url2Article[a.getUrl()] = toKeep;
        this.url2Article[b.getUrl()] = toKeep;
        this.setDuplicate(duplicate, toKeep);
        return true;
    };
    DuplicateChecker.prototype.setDuplicate = function (duplicate, newerDuplicate) {
        if (newerDuplicate === void 0) { newerDuplicate = duplicate; }
        var sub = this.articleManager.getCurrentSub();
        if (sub.isHideDuplicates()) {
            duplicate.setVisible(false);
            this.articleManager.page.refreshHidingInfo();
        }
        if (sub.isMarkAsReadDuplicates()) {
            this.articleManager.articlesToMarkAsRead.push(duplicate);
        }
        if (sub.isHighlightDuplicates()) {
            newerDuplicate.setColor("#" + sub.getHighlightDuplicatesColor());
        }
    };
    return DuplicateChecker;
}());
var CrossArticleManager = (function () {
    function CrossArticleManager(articleManager, duplicateChecker) {
        var _this = this;
        this.duplicateChecker = duplicateChecker;
        this.URLS_KEY_PREFIX = "cross_article_urls_";
        this.TITLES_KEY_PREFIX = "cross_article_titles_";
        this.IDS_KEY_PREFIX = "cross_article_ids_";
        this.DAYS_ARRAY_KEY = "cross_article_days";
        this.crossUrls = {};
        this.crossTitles = {};
        this.crossIds = {};
        this.daysArray = [];
        this.changedDays = [];
        this.initializing = false;
        this.ready = false;
        this.crossCheckSettings = articleManager.settingsManager.getCrossCheckDuplicatesSettings();
        this.crossCheckSettings.setChangeCallback(function () { return _this.refresh(); });
    }
    CrossArticleManager.prototype.addArticle = function (a, duplicate) {
        if (!this.crossCheckSettings.isEnabled() || !this.isReady()) {
            return;
        }
        if (!duplicate) {
            duplicate = this.checkDuplicate(a);
        }
        var articleDay = getDateWithoutTime(a.getReceivedDate()).getTime();
        if (articleDay < this.getThresholdDay()) {
            return;
        }
        this.initDay(articleDay);
        try {
            var changed = pushIfAbsent(this.crossUrls[articleDay], a.getUrl());
            changed =
                pushIfAbsent(this.crossTitles[articleDay], a.getTitle()) || changed;
            if (!duplicate) {
                changed =
                    pushIfAbsent(this.crossIds[articleDay], a.getEntryId()) || changed;
            }
            if (changed) {
                pushIfAbsent(this.changedDays, articleDay);
            }
        }
        catch (e) {
            console.error(e.message + ": " + articleDay + ". Days and urls:");
            console.log(this.daysArray.map(this.formatDay));
            console.log(this.crossUrls);
        }
    };
    CrossArticleManager.prototype.save = function (saveAll) {
        if (saveAll) {
            this.changedDays = this.daysArray;
        }
        if (!this.crossCheckSettings.isEnabled() ||
            !this.isReady() ||
            this.changedDays.length == 0) {
            return;
        }
        this.saveDaysArray();
        this.changedDays.forEach(this.saveDay, this);
        this.changedDays = [];
    };
    CrossArticleManager.prototype.checkDuplicate = function (a) {
        var _this = this;
        var id = a.getEntryId();
        var checkedNotDuplicate = this.daysArray.some(function (day) { return _this.crossIds[day].indexOf(id) > -1; });
        if (!checkedNotDuplicate) {
            var found = this.daysArray.some(function (day) {
                return (_this.crossUrls[day].indexOf(a.getUrl()) > -1 ||
                    _this.crossTitles[day].indexOf(a.getTitle()) > -1);
            }, this);
            if (found) {
                this.duplicateChecker.setDuplicate(a);
                return true;
            }
        }
        return false;
    };
    CrossArticleManager.prototype.isReady = function () {
        return this.ready;
    };
    CrossArticleManager.prototype.init = function () {
        var _this = this;
        return new AsyncResult(function (p) {
            _this.localStorage = DataStore.getLocalStorage();
            _this.localStorage
                .getAsync(_this.DAYS_ARRAY_KEY, [])
                .then(function (result) {
                console.log("[Duplicates cross checking] Loading the stored days ...");
                _this.setAndCleanDays(result);
                if (_this.daysArray.length == 0) {
                    console.log("[Duplicates cross checking] No day was stored");
                    p.done();
                }
                else {
                    _this.loadDays(_this.daysArray.slice(0)).chain(p);
                }
            }, _this);
        }, this);
    };
    CrossArticleManager.prototype.refresh = function () {
        var _this = this;
        if (this.crossCheckSettings.isEnabled()) {
            if (!this.isReady()) {
                if (this.initializing) {
                    return;
                }
                this.initializing = true;
                this.init().then(function () {
                    _this.ready = true;
                    _this.addArticles();
                    _this.save();
                    _this.initializing = false;
                }, this);
            }
            else {
                this.setAndCleanDays(this.daysArray);
                this.addArticles();
                this.save();
            }
        }
    };
    CrossArticleManager.prototype.addArticles = function () {
        var _this = this;
        $(ext.articleSelector).each(function (i, e) {
            _this.addArticle(new Article(e));
        });
    };
    CrossArticleManager.prototype.getUrlsKey = function (day) {
        return this.URLS_KEY_PREFIX + day;
    };
    CrossArticleManager.prototype.getTitlesKey = function (day) {
        return this.TITLES_KEY_PREFIX + day;
    };
    CrossArticleManager.prototype.getIdsKey = function (day) {
        return this.IDS_KEY_PREFIX + day;
    };
    CrossArticleManager.prototype.getThresholdDay = function () {
        var maxDays = this.crossCheckSettings.getDays();
        var thresholdDate = getDateWithoutTime(new Date());
        thresholdDate.setDate(thresholdDate.getDate() - maxDays);
        var thresholdDay = thresholdDate.getTime();
        return thresholdDay;
    };
    CrossArticleManager.prototype.setAndCleanDays = function (crossArticleDays) {
        this.daysArray = crossArticleDays.slice(0).filter(function (val) {
            return !isNaN(val);
        });
        var thresholdDay = this.getThresholdDay();
        crossArticleDays
            .filter(function (day) { return day < thresholdDay; })
            .forEach(this.cleanDay, this);
    };
    CrossArticleManager.prototype.initDay = function (day) {
        if (this.daysArray.indexOf(day) < 0) {
            this.daysArray.push(day);
            this.crossUrls[day] = [];
            this.crossTitles[day] = [];
            this.crossIds[day] = [];
        }
    };
    CrossArticleManager.prototype.loadDays = function (days) {
        var _this = this;
        if (days.length == 1) {
            return this.loadDay(days[0]);
        }
        else {
            return new AsyncResult(function (p) {
                _this.loadDay(days.pop()).then(function () {
                    _this.loadDays(days).chain(p);
                }, _this);
            }, this);
        }
    };
    CrossArticleManager.prototype.loadDay = function (day) {
        var _this = this;
        return new AsyncResult(function (p) {
            _this.localStorage
                .getAsync(_this.getIdsKey(day), [])
                .then(function (result) {
                _this.crossIds[day] = result;
                _this.localStorage
                    .getAsync(_this.getUrlsKey(day), [])
                    .then(function (result) {
                    _this.crossUrls[day] = result;
                    _this.localStorage
                        .getAsync(_this.getTitlesKey(day), [])
                        .then(function (result) {
                        _this.crossTitles[day] = result;
                        console.log("[Duplicates cross checking] Loaded successfully the day: " +
                            _this.formatDay(day) +
                            ", title count: " +
                            _this.crossTitles[day].length);
                        p.done();
                    }, _this);
                }, _this);
            }, _this);
        }, this);
    };
    CrossArticleManager.prototype.cleanDay = function (day) {
        console.log("[Duplicates cross checking] Cleaning the stored day: " +
            this.formatDay(day));
        this.daysArray.splice(this.daysArray.indexOf(day), 1);
        this.saveDaysArray();
        delete this.crossUrls[day];
        delete this.crossTitles[day];
        delete this.crossIds[day];
        this.localStorage.delete(this.getUrlsKey(day));
        this.localStorage.delete(this.getTitlesKey(day));
    };
    CrossArticleManager.prototype.saveDay = function (day) {
        console.log("[Duplicates cross checking] Saving the day: " +
            this.formatDay(day) +
            ", title count: " +
            this.crossTitles[day].length);
        this.localStorage.put(this.getUrlsKey(day), this.crossUrls[day]);
        this.localStorage.put(this.getTitlesKey(day), this.crossTitles[day]);
        this.localStorage.put(this.getIdsKey(day), this.crossIds[day]);
    };
    CrossArticleManager.prototype.saveDaysArray = function () {
        this.localStorage.put(this.DAYS_ARRAY_KEY, this.daysArray);
    };
    CrossArticleManager.prototype.formatDay = function (day) {
        return new Date(day).toLocaleDateString();
    };
    return CrossArticleManager;
}());

var KeywordManager = (function () {
    function KeywordManager() {
        this.separator = "#";
        this.areaPrefix = "#Area#";
        this.keywordSplitPattern = new RegExp(this.separator + "(.+)");
        this.matcherFactory = new KeywordMatcherFactory();
    }
    KeywordManager.prototype.insertArea = function (keyword, area) {
        return (this.areaPrefix + KeywordMatchingArea[area] + this.separator + keyword);
    };
    KeywordManager.prototype.matchSpecficKeywords = function (article, keywords, method) {
        var matcher = this.matcherFactory.getMatcherByMethod(method);
        for (var i = 0; i < keywords.length; i++) {
            var keyword = keywords[i];
            if (keyword.indexOf(this.areaPrefix) == 0) {
                keyword = this.splitKeywordArea(keyword)[1];
            }
            if (matcher(article.title, keyword)) {
                return true;
            }
        }
        return false;
    };
    KeywordManager.prototype.matchKeywords = function (article, sub, type, invert) {
        var keywords = sub.getFilteringList(type);
        if (keywords.length == 0) {
            return false;
        }
        var match = !invert == true;
        var matchers = this.matcherFactory.getMatchers(sub);
        for (var i = 0; i < keywords.length; i++) {
            var keyword = keywords[i];
            if (keyword.indexOf(this.areaPrefix) == 0) {
                var split = this.splitKeywordArea(keyword);
                keyword = split[1];
                if (!sub.isAlwaysUseDefaultMatchingAreas()) {
                    var area = KeywordMatchingArea[split[0]];
                    var matcher = this.matcherFactory.getMatcher(area, sub.getKeywordMatchingMethod());
                    if (matcher.match(article, keyword)) {
                        return match;
                    }
                    continue;
                }
            }
            for (var m = 0; m < matchers.length; m++) {
                if (matchers[m].match(article, keyword)) {
                    return match;
                }
            }
        }
        return !match;
    };
    KeywordManager.prototype.splitKeywordArea = function (keyword) {
        keyword = keyword.slice(this.areaPrefix.length);
        return keyword.split(this.keywordSplitPattern);
    };
    return KeywordManager;
}());
var KeywordMatcherFactory = (function () {
    function KeywordMatcherFactory() {
        var _this = this;
        this.matcherByType = {};
        this.comparerByMethod = {};
        this.comparerByMethod[KeywordMatchingMethod.Simple] = function (area, keyword) {
            return area.indexOf(keyword.toLowerCase()) != -1;
        };
        this.comparerByMethod[KeywordMatchingMethod.RegExp] = function (area, pattern) {
            return new RegExp(pattern, "i").test(area);
        };
        this.comparerByMethod[KeywordMatchingMethod.Word] = function (area, word) {
            return new RegExp("\\b" + word + "\\b", "i").test(area);
        };
        this.matcherByType[KeywordMatchingArea.Title] = function (a, k, method) {
            return _this.comparerByMethod[method](a.title, k);
        };
        this.matcherByType[KeywordMatchingArea.Body] = function (a, k, method) {
            return _this.comparerByMethod[method](a.body, k);
        };
        this.matcherByType[KeywordMatchingArea.Author] = function (a, k, method) {
            return _this.comparerByMethod[method](a.author, k);
        };
    }
    KeywordMatcherFactory.prototype.getMatcherByMethod = function (method) {
        return this.comparerByMethod[method];
    };
    KeywordMatcherFactory.prototype.getMatchers = function (sub) {
        var _this = this;
        var method = sub.getKeywordMatchingMethod();
        return sub.getKeywordMatchingAreas().map(function (a) {
            return _this.getMatcher(a, method);
        });
    };
    KeywordMatcherFactory.prototype.getMatcher = function (area, method) {
        var t = this;
        return {
            match: function (a, k) {
                return t.matcherByType[area](a, k, method);
            }
        };
    };
    return KeywordMatcherFactory;
}());

var FeedlyPage = (function () {
    function FeedlyPage() {
        this.hiddingInfoClass = "FFnS_Hiding_Info";
        this.put("ext", ext);
        injectToWindow([
            "getFFnS",
            "putFFnS",
            "getById",
            "getStreamPage",
            "onClickCapture",
            "fetchMoreEntries",
            "loadNextBatch",
            "getKeptUnreadEntryIds",
            "getSortedVisibleArticles"
        ], this.get, this.put, this.getById, this.getStreamPage, this.onClickCapture, this.fetchMoreEntries, this.loadNextBatch, this.getKeptUnreadEntryIds, this.getSortedVisibleArticles);
        injectToWindow(["overrideLoadingEntries"], this.overrideLoadingEntries);
        injectToWindow(["overrideSorting"], this.overrideSorting);
        injectToWindow(["onNewPageObserve"], this.onNewPageObserve);
        injectToWindow(["onNewArticleObserve"], this.onNewArticleObserve);
        injectClasses(EntryInfos);
        executeWindow("Feedly-Page-FFnS.js", this.initWindow, this.overrideMarkAsRead);
    }
    FeedlyPage.prototype.update = function (sub) {
        this.updateCheck(sub.isOpenAndMarkAsRead(), ext.openAndMarkAsReadId, ext.openAndMarkAsReadClass);
        this.updateCheck(sub.isMarkAsReadAboveBelow(), ext.markAsReadAboveBelowId, ext.markAsReadAboveBelowClass);
        this.updateCheck(sub.isOpenCurrentFeedArticles(), ext.openCurrentFeedArticlesId, ext.openCurrentFeedArticlesClass);
        var filteringByReadingTime = sub.getFilteringByReadingTime();
        if (sub.getAdvancedControlsReceivedPeriod().keepUnread ||
            (filteringByReadingTime.enabled && filteringByReadingTime.keepUnread)) {
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
        this.put(ext.openCurrentFeedArticlesUnreadOnlyId, sub.isOpenCurrentFeedArticlesUnreadOnly());
        this.put(ext.maxOpenCurrentFeedArticlesId, sub.getMaxOpenCurrentFeedArticles());
        this.put(ext.markAsReadOnOpenCurrentFeedArticlesId, sub.isMarkAsReadOnOpenCurrentFeedArticles());
    };
    FeedlyPage.prototype.updateCheck = function (enabled, id, className) {
        if (enabled) {
            this.put(id, true);
            $("." + className).css("display", "");
        }
        else {
            $("." + className).css("display", "none");
        }
    };
    FeedlyPage.prototype.initAutoLoad = function () {
        if (this.get(ext.autoLoadAllArticlesId, true)) {
            executeWindow("Feedly-Page-FFnS-InitAutoLoad.js", this.autoLoad);
        }
    };
    FeedlyPage.prototype.initWindow = function () {
        window["ext"] = getFFnS("ext");
        NodeCreationObserver.init("observed-page");
        overrideLoadingEntries();
        overrideSorting();
        onNewPageObserve();
        onNewArticleObserve();
        var removeChild = Node.prototype.removeChild;
        Node.prototype.removeChild = function () {
            try {
                return removeChild.apply(this, arguments);
            }
            catch (e) {
                if (e.name !== "NotFoundError") {
                    console.log(e);
                }
            }
        };
    };
    FeedlyPage.prototype.autoLoad = function () {
        var navigo = window["streets"].service("navigo");
        navigo.initAutoLoad = true;
        navigo.setEntries(navigo.getEntries());
    };
    FeedlyPage.prototype.getStreamPage = function () {
        var observers = window["streets"].service("navigo").observers;
        for (var i = 0, len = observers.length; i < len; i++) {
            var stream = observers[i].stream;
            if (stream && stream.streamId) {
                return observers[i];
            }
        }
    };
    FeedlyPage.prototype.onNewPageObserve = function () {
        NodeCreationObserver.onCreation(ext.subscriptionChangeSelector, function () {
            var streamPage = getStreamPage();
            if (streamPage) {
                putFFnS(ext.isNewestFirstId, streamPage.stream._sort === "newest", true);
            }
            var openCurrentFeedArticlesBtn = $("<button>", {
                title: "Open all current feed articles in a new tab",
                class: ext.openCurrentFeedArticlesClass,
                style: getFFnS(ext.openCurrentFeedArticlesId) ? "" : "display: none",
                type: "button"
            });
            var feedButtonsContainer = $("<div>");
            feedButtonsContainer.append(openCurrentFeedArticlesBtn);
            $("header.header")
                .parent()
                .after(feedButtonsContainer);
            onClickCapture(openCurrentFeedArticlesBtn, function (event) {
                event.stopPropagation();
                var articlesToOpen = getSortedVisibleArticles();
                if (articlesToOpen.length == 0) {
                    return;
                }
                if (getFFnS(ext.openCurrentFeedArticlesUnreadOnlyId)) {
                    articlesToOpen = articlesToOpen.filter(function (id) {
                        return $(getById(id)).hasClass("unread");
                    });
                }
                var max = getFFnS(ext.maxOpenCurrentFeedArticlesId);
                if (max && max > 0) {
                    if (max < articlesToOpen.length) {
                        articlesToOpen.length = max;
                    }
                }
                articlesToOpen
                    .map(function (id) { return getById(id); })
                    .forEach(function (a) {
                    var link = $(a)
                        .find(".title")
                        .attr("href");
                    window.open(link, link);
                });
                if (getFFnS(ext.markAsReadOnOpenCurrentFeedArticlesId)) {
                    var reader_1 = window["streets"].service("reader");
                    articlesToOpen.forEach(function (entryId) {
                        reader_1.askMarkEntryAsRead(entryId);
                        $(getById(entryId))
                            .removeClass("unread")
                            .addClass("read");
                    });
                }
            });
        });
    };
    FeedlyPage.prototype.onClickCapture = function (element, callback) {
        element.get(0).addEventListener("click", callback, true);
    };
    FeedlyPage.prototype.getKeptUnreadEntryIds = function () {
        var navigo = window["streets"].service("navigo");
        var entries = navigo.originalEntries || navigo.getEntries();
        var keptUnreadEntryIds = entries
            .filter(function (e) {
            return e.wasKeptUnread();
        })
            .map(function (e) {
            return e.id;
        });
        return keptUnreadEntryIds;
    };
    FeedlyPage.prototype.getSortedVisibleArticles = function () {
        var sortedVisibleArticles = getFFnS(ext.sortedVisibleArticlesId);
        if (!sortedVisibleArticles) {
            sortedVisibleArticles = [];
            $(ext.articleSelector).each(function (i, a) {
                sortedVisibleArticles.push($(a).attr(ext.articleEntryIdAttribute));
            });
        }
        return sortedVisibleArticles;
    };
    FeedlyPage.prototype.onNewArticleObserve = function () {
        var reader = window["streets"].service("reader");
        var getLink = function (a) {
            return a.find(".title").attr("href");
        };
        var getMarkAsReadAboveBelowCallback = function (entryId, above) {
            return function (event) {
                event.stopPropagation();
                var sortedVisibleArticles = getSortedVisibleArticles();
                var markAsRead = getFFnS(ext.markAsReadAboveBelowReadId);
                if (markAsRead) {
                    var keptUnreadEntryIds_1 = getKeptUnreadEntryIds();
                    sortedVisibleArticles = sortedVisibleArticles.filter(function (id) {
                        return keptUnreadEntryIds_1.indexOf(id) < 0;
                    });
                }
                var index = sortedVisibleArticles.indexOf(entryId);
                if (index == -1) {
                    return;
                }
                var start, endExcl;
                if (above) {
                    if (index == 0) {
                        return;
                    }
                    start = 0;
                    endExcl = index;
                }
                else {
                    if (index == sortedVisibleArticles.length) {
                        return;
                    }
                    start = index + 1;
                    endExcl = sortedVisibleArticles.length;
                }
                var hide = getFFnS(ext.hideWhenMarkAboveBelowId);
                for (var i = start; i < endExcl; i++) {
                    var id = sortedVisibleArticles[i];
                    if (markAsRead) {
                        reader.askMarkEntryAsRead(id);
                        if (hide) {
                            $(getById(id)).remove();
                        }
                    }
                    else {
                        reader.askKeepEntryAsUnread(id);
                    }
                }
            };
        };
        NodeCreationObserver.onCreation(ext.articleSelector + ", .condensed-tools .button-dropdown", function (element) {
            var notDropdown = !$(element).hasClass("button-dropdown");
            var a = $(element).closest(ext.articleSelector);
            if (notDropdown == a.hasClass("u0")) {
                return;
            }
            var entryId = a.attr(ext.articleEntryIdAttribute);
            var e = reader.lookupEntry(entryId);
            var entryInfos = $("<span>", {
                class: ext.entryInfosJsonClass,
                style: "display: none"
            });
            entryInfos.text(JSON.stringify(new EntryInfos(e.jsonInfo)));
            a.append(entryInfos);
            var cardsView = a.hasClass("u5");
            var magazineView = a.hasClass("u4");
            var titleView = a.hasClass("u0");
            var articleView = a.hasClass(ext.articleViewClass);
            var addButton = function (id, attributes) {
                attributes.type = "button";
                attributes.style = getFFnS(id) ? "" : "display: none";
                attributes.class += " mark-as-read";
                if (titleView) {
                    attributes.class += " condensed-toolbar-icon icon";
                }
                var e = $("<button>", attributes);
                if (cardsView) {
                    a.find(".mark-as-read")
                        .last()
                        .before(e);
                }
                else if (magazineView) {
                    a.find(".ago").after(e);
                }
                else if (articleView) {
                    a.find(".fx.metadata").append(e);
                }
                else {
                    $(element).prepend(e);
                }
                return e;
            };
            var markAsReadBelowElement = addButton(ext.markAsReadAboveBelowId, {
                class: ext.markAsReadAboveBelowClass + " mark-below-as-read",
                title: "Mark articles below" +
                    (cardsView ? " and on the right" : "") +
                    " as read/unread"
            });
            var markAsReadAboveElement = addButton(ext.markAsReadAboveBelowId, {
                class: ext.markAsReadAboveBelowClass + " mark-above-as-read",
                title: "Mark articles above" +
                    (cardsView ? " and on the left" : "") +
                    " as read/unread"
            });
            var openAndMarkAsReadElement = addButton(ext.openAndMarkAsReadId, {
                class: ext.openAndMarkAsReadClass,
                title: "Open in a new window/tab and mark as read"
            });
            if (articleView) {
                markAsReadBelowElement.detach().insertAfter(markAsReadAboveElement);
            }
            else if (magazineView) {
                markAsReadAboveElement.detach().insertAfter(markAsReadBelowElement);
            }
            var link = getLink(a);
            var openAndMarkAsRead = function (event) {
                event.stopPropagation();
                window.open(link, link);
                reader.askMarkEntryAsRead(entryId);
                if (articleView) {
                    $(a)
                        .closest(ext.articleViewEntryContainerSelector)
                        .removeClass("unread")
                        .addClass("read");
                }
            };
            onClickCapture(openAndMarkAsReadElement, openAndMarkAsRead);
            var visualElement;
            if (cardsView) {
                visualElement = a.find(".visual-container");
            }
            else if (magazineView) {
                visualElement = a.find(".visual");
            }
            if (visualElement) {
                onClickCapture(visualElement, function (e) {
                    if (getFFnS(ext.visualOpenAndMarkAsReadId)) {
                        openAndMarkAsRead(e);
                    }
                });
            }
            if (titleView) {
                onClickCapture(a.find(".content"), function (e) {
                    if (getFFnS(ext.titleOpenAndMarkAsReadId)) {
                        e.stopPropagation();
                        reader.askMarkEntryAsRead(entryId);
                    }
                });
            }
            onClickCapture(markAsReadBelowElement, getMarkAsReadAboveBelowCallback(entryId, false));
            onClickCapture(markAsReadAboveElement, getMarkAsReadAboveBelowCallback(entryId, true));
        });
    };
    FeedlyPage.prototype.reset = function () {
        this.clearHidingInfo();
        var i = sessionStorage.length;
        while (i--) {
            var key = sessionStorage.key(i);
            if (/^FFnS_/.test(key)) {
                sessionStorage.removeItem(key);
            }
        }
    };
    FeedlyPage.prototype.refreshHidingInfo = function () {
        var hiddenCount = 0;
        $(ext.articleSelector).each(function (i, a) {
            if (!$(a).is(":visible")) {
                hiddenCount++;
            }
        });
        this.clearHidingInfo();
        if (hiddenCount == 0) {
            return;
        }
        $(ext.hidingInfoSibling).after("<div class='col-xs-3 col-md-3 detail " +
            this.hiddingInfoClass +
            "'> (" +
            hiddenCount +
            " hidden entries)</div>");
    };
    FeedlyPage.prototype.clearHidingInfo = function () {
        $("." + this.hiddingInfoClass).remove();
    };
    FeedlyPage.prototype.put = function (id, value, persistent) {
        sessionStorage.setItem("FFnS" + (persistent ? "#" : "_") + id, JSON.stringify(value));
    };
    FeedlyPage.prototype.get = function (id, persistent) {
        return JSON.parse(sessionStorage.getItem("FFnS" + (persistent ? "#" : "_") + id));
    };
    FeedlyPage.prototype.getById = function (id) {
        return document.getElementById(id + "_main");
    };
    FeedlyPage.prototype.fetchMoreEntries = function (batchSize) {
        var autoLoadingMessageId = "FFnS_LoadingMessage";
        var stream = getStreamPage().stream;
        if ($(".message.loading").length == 0) {
            $(ext.articlesContainerSelector)
                .first()
                .before($("<div>", {
                id: autoLoadingMessageId,
                class: "message loading",
                text: "Auto loading all articles"
            }));
        }
        stream.setBatchSize(batchSize);
        console.log("Fetching more articles (batch size: " +
            stream._batchSize +
            ") at: " +
            new Date().toTimeString());
        stream.askMoreEntries();
        stream.askingMoreEntries = false;
    };
    FeedlyPage.prototype.loadNextBatch = function (ev) {
        ev && ev.stopPropagation();
        var navigo = window["streets"].service("navigo");
        var reader = window["streets"].service("reader");
        var entries = navigo.originalEntries || navigo.getEntries();
        var markAsReadEntryIds;
        if (getFFnS(ext.keepArticlesUnreadId)) {
            markAsReadEntryIds = getFFnS(ext.articlesToMarkAsReadId);
        }
        else {
            markAsReadEntryIds = entries
                .sort(function (a, b) {
                return a.jsonInfo.crawled - b.jsonInfo.crawled;
            })
                .map(function (e) {
                return e.id;
            });
        }
        var keptUnreadEntryIds = getKeptUnreadEntryIds();
        markAsReadEntryIds = markAsReadEntryIds.filter(function (id) {
            return keptUnreadEntryIds.indexOf(id) < 0;
        });
        reader.askMarkEntriesAsRead(markAsReadEntryIds, {});
        window.scrollTo(0, 0);
        $(ext.articlesContainerSelector).empty();
        navigo.originalEntries = null;
        navigo.entries = [];
        fetchMoreEntries(getFFnS(ext.batchSizeId, true));
    };
    FeedlyPage.prototype.overrideLoadingEntries = function () {
        var autoLoadingMessageId = "#FFnS_LoadingMessage";
        var loadNextBatchBtnId = "#FFnS_LoadNextBatchBtn";
        var secondaryMarkAsReadBtnsSelector = ".mark-as-read-button.secondary";
        var loadByBatchText = "Mark batch as read and load next batch";
        var navigo = window["streets"].service("navigo");
        var reader = window["streets"].service("reader");
        var autoLoadAllArticleDefaultBatchSize = 1000;
        var isAutoLoad = function () {
            try {
                return (getStreamPage() != null &&
                    ($(ext.articleSelector).length == 0 ||
                        $(ext.unreadArticlesCountSelector).length > 0) &&
                    !(getStreamPage().stream.state.info.subscribed === false) &&
                    getFFnS(ext.autoLoadAllArticlesId, true));
            }
            catch (e) {
                console.log(e);
                return false;
            }
        };
        var streamObj = getStreamPage().stream;
        var prototype = Object.getPrototypeOf(streamObj);
        var setBatchSize = prototype.setBatchSize;
        prototype.setBatchSize = function (customSize) {
            if (this._batchSize == customSize) {
                return;
            }
            if (isAutoLoad()) {
                this._batchSize = customSize;
            }
            else {
                setBatchSize.apply(this, arguments);
            }
        };
        var navigoPrototype = Object.getPrototypeOf(navigo);
        var setEntries = navigoPrototype.setEntries;
        navigoPrototype.setEntries = function (entries) {
            if (entries.length > 0) {
                putFFnS(ext.sortArticlesId, true);
            }
            if (entries.length > 0 &&
                entries[entries.length - 1].jsonInfo.unread &&
                isAutoLoad()) {
                var isLoadByBatch = getFFnS(ext.loadByBatchEnabledId, true);
                var firstLoadByBatch_1 = false;
                if (navigo.initAutoLoad) {
                    navigo.initAutoLoad = false;
                    window.removeEventListener("scroll", getStreamPage()._throttledCheckMoreEntriesNeeded);
                    firstLoadByBatch_1 = isLoadByBatch;
                }
                var isBatchLoading = true;
                var autoLoadAllArticleBatchSize_1 = autoLoadAllArticleDefaultBatchSize;
                if (isLoadByBatch) {
                    var batchSize = getFFnS(ext.batchSizeId, true);
                    autoLoadAllArticleBatchSize_1 = batchSize;
                    if (entries.length >= batchSize) {
                        isBatchLoading = false;
                    }
                }
                var stream = getStreamPage().stream;
                var hasAllEntries = stream.state.hasAllEntries;
                if (!hasAllEntries &&
                    !stream.askingMoreEntries &&
                    !stream.state.isLoadingEntries &&
                    isBatchLoading &&
                    $(loadNextBatchBtnId).length == 0) {
                    stream.askingMoreEntries = true;
                    setTimeout(function () {
                        var batchSize = autoLoadAllArticleBatchSize_1;
                        if (firstLoadByBatch_1) {
                            batchSize = batchSize - entries.length;
                        }
                        fetchMoreEntries(batchSize);
                    }, 100);
                }
                else if (hasAllEntries || !isBatchLoading) {
                    $(autoLoadingMessageId).remove();
                    if (hasAllEntries) {
                        console.log("End auto load all articles at: " + new Date().toTimeString());
                        if (isLoadByBatch) {
                            $(loadNextBatchBtnId).remove();
                        }
                    }
                    else if (isLoadByBatch && $(loadNextBatchBtnId).length == 0) {
                        $(ext.articlesContainerSelector)
                            .last()
                            .after($("<button>", {
                            id: loadNextBatchBtnId.substring(1),
                            class: "full-width secondary",
                            type: "button",
                            style: "margin-top: 1%;",
                            text: loadByBatchText
                        }));
                        onClickCapture($(loadNextBatchBtnId), loadNextBatch);
                    }
                }
            }
            setTimeout(function () {
                var markAsReadEntries = $(ext.articleSelector + "." + ext.markAsReadImmediatelyClass);
                if (markAsReadEntries.length == 0) {
                    return;
                }
                var ids = $.map(markAsReadEntries.toArray(), function (e) {
                    return $(e).attr(ext.articleEntryIdAttribute);
                });
                reader.askMarkEntriesAsRead(ids, {});
                markAsReadEntries
                    .removeClass(ext.markAsReadImmediatelyClass)
                    .removeClass("unread")
                    .addClass("read");
            }, 1000);
            return setEntries.apply(this, arguments);
        };
        NodeCreationObserver.onCreation(ext.loadingMessageSelector, function (e) {
            if ($(autoLoadingMessageId).length == 1) {
                $(e).hide();
            }
        });
        NodeCreationObserver.onCreation(secondaryMarkAsReadBtnsSelector, function (e) {
            if (getFFnS(ext.loadByBatchEnabledId, true)) {
                $(secondaryMarkAsReadBtnsSelector).attr("title", loadByBatchText);
            }
        });
    };
    FeedlyPage.prototype.overrideMarkAsRead = function () {
        var reader = window["streets"].service("reader");
        var navigo = window["streets"].service("navigo");
        var pagesPkg = window["devhd"].pkg("pages");
        var prototype = pagesPkg.ReactPage.prototype;
        var markAsRead = prototype.markAsRead;
        prototype.markAsRead = function (lastEntryObject) {
            var _this = this;
            var jumpToNext = function () {
                if (!/latest\/?$/i.test(document.URL)) {
                    if (navigo.getNextURI()) {
                        _this.feedly.jumpToNext();
                    }
                    else {
                        _this.feedly.loadDefaultPage();
                    }
                }
                else {
                    _this.feedly.jumpToNext();
                }
            };
            if (lastEntryObject && lastEntryObject.asOf) {
                markAsRead.call(this, lastEntryObject);
            }
            else if (getFFnS(ext.loadByBatchEnabledId, true) &&
                !getStreamPage().stream.state.hasAllEntries) {
                loadNextBatch();
            }
            else if (getFFnS(ext.keepArticlesUnreadId)) {
                console.log("Marking as read with keeping new articles unread");
                var idsToMarkAsRead = getFFnS(ext.articlesToMarkAsReadId);
                if (idsToMarkAsRead) {
                    var keptUnreadEntryIds_2 = getKeptUnreadEntryIds();
                    idsToMarkAsRead = idsToMarkAsRead.filter(function (id) {
                        return keptUnreadEntryIds_2.indexOf(id) < 0;
                    });
                    console.log(idsToMarkAsRead.length + " new articles will be marked as read");
                    reader.askMarkEntriesAsRead(idsToMarkAsRead, {});
                }
                else {
                    console.log("No article to mark as read");
                }
                jumpToNext();
            }
            else {
                markAsRead.call(this, lastEntryObject);
                jumpToNext();
            }
        };
    };
    FeedlyPage.prototype.overrideSorting = function () {
        var navigo = window["streets"].service("navigo");
        var prototype = Object.getPrototypeOf(navigo);
        function filterVisible(entry) {
            return !($(getById(entry.id)).css("display") === "none");
        }
        function ensureSortedEntries() {
            var entries = navigo.entries;
            var originalEntries = navigo.originalEntries || entries;
            navigo.originalEntries = originalEntries;
            var sortedVisibleArticles = getFFnS(ext.sortedVisibleArticlesId);
            if (!sortedVisibleArticles) {
                navigo.entries = originalEntries;
                navigo.originalEntries = null;
                return;
            }
            var len = sortedVisibleArticles.length;
            var sorted = len == entries.length;
            for (var i = 0; i < len && sorted; i++) {
                if (entries[i].id !== sortedVisibleArticles[i] ||
                    !filterVisible(entries[i])) {
                    sorted = false;
                }
            }
            if (!sorted) {
                entries = [].concat(originalEntries);
                entries = entries.filter(filterVisible);
                entries.sort(function (a, b) {
                    return (sortedVisibleArticles.indexOf(a.id) -
                        sortedVisibleArticles.indexOf(b.id));
                });
                navigo.entries = entries;
            }
        }
        var lookupNextEntry = prototype.lookupNextEntry;
        var lookupPreviousEntry = prototype.lookupPreviousEntry;
        var getEntries = prototype.getEntries;
        var setEntries = prototype.setEntries;
        var reset = prototype.reset;
        prototype.lookupNextEntry = function (a) {
            ensureSortedEntries();
            return lookupNextEntry.call(this, getFFnS(ext.hideAfterReadId) ? true : a);
        };
        prototype.lookupPreviousEntry = function (a) {
            ensureSortedEntries();
            return lookupPreviousEntry.call(this, getFFnS(ext.hideAfterReadId) ? true : a);
        };
        prototype.getEntries = function () {
            ensureSortedEntries();
            return getEntries.apply(this, arguments);
        };
        prototype.setEntries = function () {
            navigo.originalEntries = null;
            return setEntries.apply(this, arguments);
        };
        prototype.reset = function () {
            navigo.originalEntries = null;
            return reset.apply(this, arguments);
        };
        prototype.listEntryIds = function () {
            var a = [];
            var entries = navigo.originalEntries || navigo.entries;
            return (entries.forEach(function (b) {
                a.push(b.getId());
            }),
                a);
        };
    };
    return FeedlyPage;
}());

var UIManager = (function () {
    function UIManager() {
        this.containsReadArticles = false;
        this.forceReloadGlobalSettings = false;
        this.keywordToId = {};
        this.idCount = 1;
        this.sortingSelectId = "SortingType";
        this.htmlSettingsElements = [
            {
                type: HTMLElementType.SelectBox,
                ids: [
                    this.sortingSelectId,
                    "KeywordMatchingMethod",
                    this.getKeywordMatchingSelectId(false)
                ]
            },
            {
                type: HTMLElementType.ColorInput,
                ids: ["HighlightDuplicatesColor"]
            },
            {
                type: HTMLElementType.CheckBox,
                ids: [
                    "FilteringEnabled",
                    "RestrictingEnabled",
                    "SortingEnabled",
                    "PinHotToTop",
                    "KeepUnread_AdvancedControlsReceivedPeriod",
                    "Hide_AdvancedControlsReceivedPeriod",
                    "ShowIfHot_AdvancedControlsReceivedPeriod",
                    "MarkAsReadVisible_AdvancedControlsReceivedPeriod",
                    "OpenAndMarkAsRead",
                    "MarkAsReadAboveBelow",
                    "HideWhenMarkAboveBelow",
                    "HideAfterRead",
                    "ReplaceHiddenWithGap",
                    "AlwaysUseDefaultMatchingAreas",
                    "VisualOpenAndMarkAsRead",
                    "TitleOpenAndMarkAsRead",
                    "MarkAsReadFiltered",
                    "AutoRefreshEnabled",
                    "OpenCurrentFeedArticles",
                    "OpenCurrentFeedArticlesUnreadOnly",
                    "MarkAsReadOnOpenCurrentFeedArticles",
                    "HideDuplicates",
                    "MarkAsReadDuplicates",
                    "HighlightDuplicates",
                    "Enabled_FilteringByReadingTime",
                    "KeepUnread_FilteringByReadingTime"
                ]
            },
            {
                type: HTMLElementType.NumberInput,
                ids: [
                    "MinPopularity_AdvancedControlsReceivedPeriod",
                    "AutoRefreshMinutes",
                    "MaxOpenCurrentFeedArticles",
                    "ThresholdMinutes_FilteringByReadingTime",
                    "WordsPerMinute_FilteringByReadingTime"
                ]
            }
        ];
        this.settingsDivContainerId = this.getHTMLId("settingsDivContainer");
        this.closeBtnId = this.getHTMLId("CloseSettingsBtn");
    }
    UIManager.prototype.init = function () {
        var _this = this;
        return new AsyncResult(function (p) {
            _this.settingsManager = new SettingsManager(_this);
            _this.keywordManager = new KeywordManager();
            _this.page = new FeedlyPage();
            _this.htmlSubscriptionManager = new HTMLSubscriptionManager(_this);
            _this.settingsManager.init().then(function () {
                _this.articleManager = new ArticleManager(_this.settingsManager, _this.keywordManager, _this.page);
                _this.autoLoadAllArticlesCB = new HTMLGlobalSettings(ext.autoLoadAllArticlesId, false, _this);
                _this.globalSettingsEnabledCB = new HTMLGlobalSettings("globalSettingsEnabled", true, _this, true, false);
                _this.loadByBatchEnabledCB = new HTMLGlobalSettings(ext.loadByBatchEnabledId, false, _this);
                _this.batchSizeInput = new HTMLGlobalSettings(ext.batchSizeId, 200, _this);
                var crossCheckSettings = _this.settingsManager.getCrossCheckDuplicatesSettings();
                _this.crossCheckDuplicatesCB = new HTMLGlobalSettings("CrossCheckDuplicates", false, _this, false, false);
                _this.crossCheckDuplicatesDaysInput = new HTMLGlobalSettings("CrossCheckDuplicatesDays", 3, _this, false, false);
                _this.crossCheckDuplicatesCB.setAdditionalChangeCallback(function (val) {
                    return crossCheckSettings.setEnabled(val);
                });
                _this.crossCheckDuplicatesDaysInput.setAdditionalChangeCallback(function (val) {
                    return crossCheckSettings.setDays(val);
                });
                _this.globalSettings = [
                    _this.autoLoadAllArticlesCB,
                    _this.loadByBatchEnabledCB,
                    _this.batchSizeInput,
                    _this.globalSettingsEnabledCB,
                    _this.crossCheckDuplicatesCB,
                    _this.crossCheckDuplicatesDaysInput
                ];
                _this.initGlobalSettings(_this.globalSettings.slice(0)).then(function () {
                    _this.page.initAutoLoad();
                    _this.updateSubscription().then(function () {
                        _this.initUI();
                        _this.registerSettings();
                        _this.updateMenu();
                        _this.initSettingsCallbacks();
                        _this.postInit();
                        p.done();
                    }, _this);
                }, _this);
            }, _this);
        }, this);
    };
    UIManager.prototype.initGlobalSettings = function (settings) {
        var _this = this;
        if (settings.length == 1) {
            return settings[0].init();
        }
        else {
            return new AsyncResult(function (p) {
                settings
                    .pop()
                    .init()
                    .then(function () {
                    _this.initGlobalSettings(settings).chain(p);
                }, _this);
            }, this);
        }
    };
    UIManager.prototype.resetGlobalSettings = function (settings) {
        var _this = this;
        if (settings.length == 1) {
            return settings[0].reset();
        }
        else {
            return new AsyncResult(function (p) {
                settings
                    .pop()
                    .reset()
                    .then(function () {
                    _this.resetGlobalSettings(settings).chain(p);
                }, _this);
            }, this);
        }
    };
    UIManager.prototype.updatePage = function () {
        try {
            this.resetPage();
            this.updateSubscription().then(this.updateMenu, this);
        }
        catch (err) {
            console.log(err);
        }
    };
    UIManager.prototype.resetPage = function () {
        this.containsReadArticles = false;
        this.articleManager.resetArticles();
    };
    UIManager.prototype.refreshPage = function () {
        this.updatePage();
        this.refreshFilteringAndSorting();
    };
    UIManager.prototype.refreshFilteringAndSorting = function () {
        this.page.reset();
        this.articleManager.refreshArticles();
        this.page.update(this.subscription);
    };
    UIManager.prototype.updateSubscription = function () {
        var _this = this;
        return new AsyncResult(function (p) {
            var globalSettingsEnabled = _this.globalSettingsEnabledCB.getValue();
            _this.settingsManager
                .loadSubscription(globalSettingsEnabled, _this.forceReloadGlobalSettings)
                .then(function (sub) {
                _this.subscription = sub;
                p.done();
            }, _this);
        }, this);
    };
    UIManager.prototype.updateMenu = function () {
        var _this = this;
        this.htmlSubscriptionManager.update();
        setTimeout(function () {
            _this.refreshFilteringAndSorting();
            if ((_this.subscription.isSortingEnabled &&
                _this.subscription.getSortingType() == SortingType.PopularityAsc) ||
                _this.subscription.getSortingType() == SortingType.PopularityDesc) {
                var maxCheck_1 = 10;
                var handle_1 = setInterval(function () {
                    if (maxCheck_1-- === 0) {
                        return clearInterval(handle_1);
                    }
                    _this.articleManager.checkPopularityAndSort();
                }, 3000);
            }
        }, 500);
        getFilteringTypes().forEach(function (type) {
            _this.prepareFilteringList(type);
        });
        this.updateSettingsControls();
        // Additional sorting types
        $("#FFnS_AdditionalSortingTypes").empty();
        this.subscription.getAdditionalSortingTypes().forEach(function (s) {
            var id = _this.registerAdditionalSortingType();
            $id(id).val(s);
        });
        // coloring rules
        $("#FFnS_ColoringRules").empty();
        this.subscription
            .getColoringRules()
            .forEach(this.registerColoringRule, this);
        this.refreshColoringRuleArrows();
        this.updateSettingsModeTitle();
    };
    UIManager.prototype.updateSettingsModeTitle = function () {
        var title = this.globalSettingsEnabledCB.getValue()
            ? "Global"
            : "Subscription";
        title += " settings";
        $id("FFnS_settings_mode_title").text(title);
    };
    UIManager.prototype.updateSettingsControls = function () {
        $id("FFnS_SettingsControls_SelectedSubscription").html(this.getImportOptionsHTML());
        var linkedSubContainer = $id("FFnS_SettingsControls_LinkedSubContainer");
        var linkedSub = $id("FFnS_SettingsControls_LinkedSub");
        if ((!this.globalSettingsEnabledCB.getValue() &&
            this.subscription.getURL() !==
                this.settingsManager.getActualSubscriptionURL()) ||
            (this.globalSettingsEnabledCB.getValue() &&
                !this.settingsManager.isGlobalMode())) {
            linkedSubContainer.css("display", "");
            linkedSub.text("Subscription currently linked to: " + this.subscription.getURL());
        }
        else {
            linkedSubContainer.css("display", "none");
            linkedSub.text("");
        }
    };
    UIManager.prototype.getSettingsControlsSelectedSubscription = function () {
        return $id("FFnS_SettingsControls_SelectedSubscription").val();
    };
    UIManager.prototype.initUI = function () {
        this.initSettingsMenu();
        this.initShowSettingsBtns();
        this.globalSettings.forEach(function (globalSetting) {
            globalSetting.initUI();
        });
    };
    UIManager.prototype.initSettingsMenu = function () {
        var marginElementClass = this.getHTMLId("margin_element");
        var tabsMenuId = this.getHTMLId("tabs_menu");
        var tabsContentContainerId = this.getHTMLId("tabs_content");
        var settingsHtml = bindMarkup(templates.settingsHTML, [
            {
                name: "SortingSelect",
                value: this.getSortingSelectHTML(this.getHTMLId(this.sortingSelectId))
            },
            {
                name: "FilteringList.Type.FilteredOut",
                value: this.getFilteringListHTML(FilteringType.FilteredOut)
            },
            {
                name: "FilteringList.Type.RestrictedOn",
                value: this.getFilteringListHTML(FilteringType.RestrictedOn)
            },
            {
                name: "ImportMenu.SubscriptionOptions",
                value: this.getImportOptionsHTML()
            },
            { name: "closeIconLink", value: ext.closeIconLink },
            { name: "plusIconLink", value: ext.plusIconLink },
            { name: "eraseIconLink", value: ext.eraseIconLink },
            {
                name: "DefaultKeywordMatchingArea",
                value: this.getKeywordMatchingSelectHTML("multiple required", false)
            },
            {
                name: "KeywordMatchingMethod",
                value: this.getKeywordMatchingMethod(true)
            }
        ]);
        $("body").prepend(settingsHtml);
        // set up tabs
        $("#" + tabsMenuId + " a").click(function (event) {
            event.preventDefault();
            $(this)
                .parent()
                .addClass("current");
            $(this)
                .parent()
                .siblings()
                .removeClass("current");
            var tab = $(this).attr("href");
            $("#" + tabsContentContainerId + " > div")
                .not(tab)
                .css("display", "none");
            $(tab).show();
        });
        $("#" + tabsContentContainerId + " > div")
            .first()
            .show();
    };
    UIManager.prototype.getSortingSelectHTML = function (id) {
        return bindMarkup(templates.sortingSelectHTML, [
            { name: "Id", value: id },
            { name: "PopularityDesc", value: SortingType.PopularityDesc },
            { name: "TitleAsc", value: SortingType.TitleAsc },
            { name: "PopularityAsc", value: SortingType.PopularityAsc },
            { name: "TitleDesc", value: SortingType.TitleDesc },
            { name: "PublishDateNewFirst", value: SortingType.PublishDateNewFirst },
            { name: "PublishDateOldFirst", value: SortingType.PublishDateOldFirst },
            { name: "PublishDayNewFirst", value: SortingType.PublishDayNewFirst },
            { name: "PublishDayOldFirst", value: SortingType.PublishDayOldFirst },
            { name: "ReceivedDateNewFirst", value: SortingType.ReceivedDateNewFirst },
            { name: "ReceivedDateOldFirst", value: SortingType.ReceivedDateOldFirst },
            { name: "SourceAsc", value: SortingType.SourceAsc },
            { name: "SourceDesc", value: SortingType.SourceDesc },
            {
                name: "SourceNewestReceiveDate",
                value: SortingType.SourceNewestReceiveDate
            },
            { name: "Random", value: SortingType.Random }
        ]);
    };
    UIManager.prototype.getFilteringListHTML = function (type) {
        var ids = this.getIds(type);
        var filteringListHTML = bindMarkup(templates.filteringListHTML, [
            { name: "FilteringTypeTabId", value: this.getFilteringTypeTabId(type) },
            { name: "inputId", value: this.getHTMLId(ids.inputId) },
            { name: "plusBtnId", value: this.getHTMLId(ids.plusBtnId) },
            { name: "eraseBtnId", value: this.getHTMLId(ids.eraseBtnId) },
            { name: "filetringKeywordsId", value: ids.filetringKeywordsId },
            {
                name: "FilteringKeywordMatchingArea",
                value: this.getKeywordMatchingSelectHTML("", true, type)
            }
        ]);
        return filteringListHTML;
    };
    UIManager.prototype.getKeywordMatchingSelectHTML = function (attributes, includeDefaultOption, type) {
        var defaultOption = includeDefaultOption
            ? bindMarkup(templates.emptyOptionHTML, [
                { name: "value", value: "-- area (optional) --" }
            ])
            : "";
        var filteringListHTML = bindMarkup(templates.keywordMatchingSelectHTML, [
            { name: "Id", value: this.getKeywordMatchingSelectId(true, type) },
            { name: "attributes", value: attributes },
            { name: "defaultOption", value: defaultOption },
            { name: "selectFirst", value: includeDefaultOption ? "" : "selected" },
            { name: "KeywordMatchingArea.Title", value: KeywordMatchingArea.Title },
            { name: "KeywordMatchingArea.Body", value: KeywordMatchingArea.Body },
            { name: "KeywordMatchingArea.Author", value: KeywordMatchingArea.Author }
        ]);
        return filteringListHTML;
    };
    UIManager.prototype.getKeywordMatchingSelectId = function (html, type) {
        var suffix = type == undefined ? "s" : "_" + FilteringType[type];
        var id = "KeywordMatchingArea" + suffix;
        return html ? this.getHTMLId(id) : id;
    };
    UIManager.prototype.getKeywordMatchingMethod = function (fullSize, id) {
        id = id || "FFnS_KeywordMatchingMethod";
        return bindMarkup(templates.keywordMatchingMethodHTML, [
            { name: "id", value: id },
            {
                name: "KeywordMatchingMethod.Simple",
                value: KeywordMatchingMethod.Simple
            },
            { name: "KeywordMatchingMethod.Word", value: KeywordMatchingMethod.Word },
            {
                name: "KeywordMatchingMethod.RegExp",
                value: KeywordMatchingMethod.RegExp
            },
            { name: "size", value: fullSize ? 'size="3"' : "" }
        ]);
    };
    UIManager.prototype.getImportOptionsHTML = function () {
        var optionsHTML = "";
        var urls = this.settingsManager.getAllSubscriptionURLs();
        urls.forEach(function (url) {
            optionsHTML += bindMarkup(templates.optionHTML, [
                { name: "value", value: url }
            ]);
        });
        return optionsHTML;
    };
    UIManager.prototype.initShowSettingsBtns = function () {
        var this_ = this;
        NodeCreationObserver.onCreation(ext.settingsBtnSuccessorSelector, function (element) {
            var clone = $(element).clone();
            $(clone)
                .empty()
                .removeAttr("class")
                .attr("title", "Feedly filtering and sorting")
                .addClass("ShowSettingsBtn");
            $(element).parent().before(clone);
            $(clone).click(function () {
                $id(this_.settingsDivContainerId).toggle();
            });
        });
    };
    UIManager.prototype.registerSettings = function () {
        var _this = this;
        this.htmlSettingsElements.forEach(function (element) {
            _this.htmlSubscriptionManager.registerSettings(element.ids, element.type);
        });
        this.htmlSubscriptionManager.registerSettings([
            "Hours_AdvancedControlsReceivedPeriod",
            "Days_AdvancedControlsReceivedPeriod"
        ], HTMLElementType.NumberInput, {
            update: function (subscriptionSetting) {
                var advancedControlsReceivedPeriod = subscriptionSetting.manager.subscription.getAdvancedControlsReceivedPeriod();
                var maxHours = advancedControlsReceivedPeriod.maxHours;
                var advancedPeriodHours = maxHours % 24;
                var advancedPeriodDays = Math.floor(maxHours / 24);
                if (subscriptionSetting.id.indexOf("Hours") != -1) {
                    $id(subscriptionSetting.htmlId).val(advancedPeriodHours);
                }
                else {
                    $id(subscriptionSetting.htmlId).val(advancedPeriodDays);
                }
            }
        });
        this.htmlSubscriptionManager.registerSelectBoxBoolean(ext.markAsReadAboveBelowReadId, function (subscription) {
            return subscription.isMarkAsReadAboveBelowRead();
        });
        this.htmlSubscriptionManager.registerSelectBoxBoolean("FilterLong_FilteringByReadingTime", function (subscription) {
            return subscription.getFilteringByReadingTime().filterLong;
        });
    };
    UIManager.prototype.initSettingsCallbacks = function () {
        var _this = this;
        this.htmlSubscriptionManager.setUpCallbacks();
        $id(this.closeBtnId).click(function () {
            $id(_this.settingsDivContainerId).toggle();
        });
        var importSettings = $id("FFnS_ImportSettings");
        importSettings.change(function () {
            _this.settingsManager.importAllSettings(importSettings.prop("files")[0]);
        });
        $id("FFnS_ExportSettings").click(function () {
            _this.settingsManager.exportAllSettings();
        });
        $id("FFnS_SettingsControls_ImportFromOtherSub").click(function () {
            _this.importFromOtherSub();
        });
        $id("FFnS_SettingsControls_LinkToSub").click(function () {
            _this.linkToSub();
        });
        $id("FFnS_SettingsControls_UnlinkFromSub").click(function () {
            _this.unlinkFromSub();
        });
        $id("FFnS_SettingsControls_DeleteSub").click(function () {
            _this.deleteSub();
        });
        $id("FFnS_AddSortingType").click(function () {
            var id = _this.registerAdditionalSortingType();
            _this.subscription.addAdditionalSortingType($id(id).val());
            _this.refreshFilteringAndSorting();
        });
        $id("FFnS_EraseSortingTypes").click(function () {
            _this.subscription.setAdditionalSortingTypes([]);
            $("#FFnS_AdditionalSortingTypes").empty();
            _this.refreshFilteringAndSorting();
        });
        onClick($id("FFnS_AddColoringRule"), function () {
            var cr = new ColoringRule();
            _this.registerColoringRule(cr);
            _this.subscription.addColoringRule(cr);
            _this.articleManager.refreshColoring();
            _this.refreshColoringRuleArrows();
        });
        onClick($id("FFnS_EraseColoringRules"), function () {
            _this.subscription.setColoringRules([]);
            $id("FFnS_ColoringRules").empty();
            _this.articleManager.refreshColoring();
        });
        this.setUpFilteringListEvents();
        var useDefaultMatchingAreas = $id("FFnS_AlwaysUseDefaultMatchingAreas");
        function toggleFilteringKeywordMatchingSelects() {
            var selects = $(".FFnS_keywordMatchingSelect:not([multiple])");
            if (isChecked($(useDefaultMatchingAreas))) {
                selects.hide();
            }
            else {
                selects.show();
            }
        }
        toggleFilteringKeywordMatchingSelects();
        useDefaultMatchingAreas.change(toggleFilteringKeywordMatchingSelects);
    };
    UIManager.prototype.postInit = function () {
        var _this = this;
        var syncManager = DataStore.getSyncStorageManager();
        var syncCBId = "FFnS_syncSettingsEnabled";
        if (syncManager) {
            setChecked(syncCBId, syncManager.isSyncEnabled());
            $id(syncCBId).change(function () {
                syncManager.setSyncEnabled(isChecked($id(syncCBId)));
                _this.forceReloadGlobalSettings = true;
                _this.resetGlobalSettings(_this.globalSettings.slice(0)).then(function () {
                    _this.refreshPage();
                    _this.forceReloadGlobalSettings = false;
                }, _this);
            });
        }
        else {
            $id(syncCBId)
                .closest(".setting_group")
                .remove();
        }
        if (this.subscription.isAutoRefreshEnabled()) {
            setInterval(function () {
                $(".icon-toolbar-refresh-secondary")
                    .first()
                    .click();
            }, this.subscription.getAutoRefreshTime());
        }
    };
    UIManager.prototype.registerAdditionalSortingType = function () {
        var _this = this;
        var id = this.getHTMLId("AdditionalSortingType_" + this.idCount++);
        $("#FFnS_AdditionalSortingTypes").append(this.getSortingSelectHTML(id));
        $id(id).change(function () { return _this.updateAdditionalSortingTypes(); });
        return id;
    };
    UIManager.prototype.registerColoringRule = function (cr) {
        var _this = this;
        var ids = new ColoringRuleHTMLIds(this.getHTMLId("ColoringRule_" + this.idCount++));
        var self = this;
        // append template
        var html = bindMarkup(templates.coloringRuleHTML, [
            { name: "Id", value: ids.id },
            { name: "Color", value: cr.color },
            { name: "SpecificKeywords", value: ColoringRuleSource.SpecificKeywords },
            { name: "SourceTitle", value: ColoringRuleSource.SourceTitle },
            {
                name: "RestrictingKeywords",
                value: ColoringRuleSource.RestrictingKeywords
            },
            {
                name: "FilteringKeywords",
                value: ColoringRuleSource.FilteringKeywords
            },
            {
                name: "KeywordMatchingMethod",
                value: this.getKeywordMatchingMethod(false, ids.id + "_KeywordMatchingMethod")
            },
            { name: "plusIconLink", value: ext.plusIconLink },
            { name: "eraseIconLink", value: ext.eraseIconLink },
            { name: "moveUpIconLink", value: ext.moveUpIconLink },
            { name: "moveDownIconLink", value: ext.moveDownIconLink }
        ]);
        $("#FFnS_ColoringRules").append(html);
        // set current values
        setChecked(ids.highlightId, cr.highlightAllTitle);
        $id(ids.sourceId).val(cr.source);
        $id(ids.matchingMethodId).val(cr.matchingMethod);
        this.refreshColoringRuleSpecificKeywords(cr, ids);
        var refreshVisibility = function () {
            $id(ids.keywordGroupId).css("display", cr.source == ColoringRuleSource.SpecificKeywords ? "" : "none");
            var sourceTitle = cr.source == ColoringRuleSource.SourceTitle;
            $id(ids.matchingMethodContainerId).css("display", sourceTitle ? "none" : "");
            $id(ids.optionsSpanId).css("display", sourceTitle ? "none" : "");
            $id(ids.sourceTitleInfosId).css("display", sourceTitle ? "" : "none");
        };
        new jscolor($id(ids.colorId)[0]);
        refreshVisibility();
        // change callbacks
        function onChange(id, cb, input, click, onchange) {
            function callback() {
                try {
                    var noChange = cb.call(this);
                    if (noChange) {
                        return;
                    }
                    self.subscription.save();
                    self.articleManager.refreshColoring();
                    refreshVisibility();
                }
                catch (e) {
                    console.log(e);
                }
            }
            click
                ? onClick($id(id), callback)
                : input
                    ? ($id(id)[0].oninput = callback)
                    : $id(id).change(callback);
            if (onchange) {
                $id(id)[0].onchange = callback;
            }
        }
        onChange(ids.highlightId, function () {
            cr.highlightAllTitle = isChecked($(this));
        });
        onChange(ids.sourceId, function () {
            cr.source = Number($(this).val());
        });
        onChange(ids.matchingMethodId, function () {
            cr.matchingMethod = Number($(this).val());
        });
        onChange(ids.colorId, function () {
            var str = $(this).val();
            if (str.match(/^\W*([0-9A-F]{3}([0-9A-F]{3})?)\W*$/i)) {
                cr.color = str.toUpperCase();
            }
            else {
                $(this).val(str);
                return true;
            }
        }, true, false, true);
        onChange(ids.addBtnId, function () {
            var keyword = $id(ids.keywordInputId).val();
            if (keyword != null && keyword !== "") {
                cr.specificKeywords.push(keyword);
            }
            $id(ids.keywordInputId).val("");
            _this.refreshColoringRuleSpecificKeywords(cr, ids);
        }, false, true);
        onChange(ids.eraseBtnId, function () {
            cr.specificKeywords = [];
            $id(ids.keywordContainerId).empty();
        }, false, true);
        // Coloring rule management
        onClick($id(ids.removeColoringRuleId), function () {
            var rules = self.subscription.getColoringRules();
            var i = rules.indexOf(cr);
            if (i > -1) {
                rules.splice(i, 1);
                self.subscription.save();
                self.articleManager.refreshColoring();
            }
            $id(ids.id).remove();
            self.refreshColoringRuleArrows();
        });
        var getMoveColoringRuleCallback = function (up) {
            return function () {
                var rules = self.subscription.getColoringRules();
                var i = rules.indexOf(cr);
                if (up ? i > 0 : i < rules.length) {
                    var swapIdx = up ? i - 1 : i + 1;
                    var swap = rules[swapIdx];
                    rules[swapIdx] = rules[i];
                    rules[i] = swap;
                    self.subscription.save();
                    self.articleManager.refreshColoring();
                    var element = $id(ids.id);
                    if (up) {
                        var prev = element.prev();
                        element.detach().insertBefore(prev);
                    }
                    else {
                        var next = element.next();
                        element.detach().insertAfter(next);
                    }
                    self.refreshColoringRuleArrows();
                }
            };
        };
        onClick($id(ids.moveUpColoringRuleId), getMoveColoringRuleCallback(true));
        onClick($id(ids.moveDownColoringRuleId), getMoveColoringRuleCallback(false));
    };
    UIManager.prototype.refreshColoringRuleArrows = function () {
        $(".FFnS_MoveUpColoringRule")
            .not(":first")
            .show();
        $(".FFnS_MoveUpColoringRule:first").hide();
        $(".FFnS_MoveDownColoringRule")
            .not(":last")
            .show();
        $(".FFnS_MoveDownColoringRule:last").hide();
    };
    UIManager.prototype.refreshColoringRuleSpecificKeywords = function (cr, ids) {
        var keywords = cr.specificKeywords;
        var html = "";
        for (var i = 0; i < keywords.length; i++) {
            var keyword = keywords[i];
            var keywordId = this.getKeywordId(ids.id, keyword);
            var keywordHTML = bindMarkup(templates.keywordHTML, [
                { name: "keywordId", value: keywordId },
                { name: "keyword", value: keyword }
            ]);
            html += keywordHTML;
        }
        $id(ids.keywordContainerId).html(html);
    };
    UIManager.prototype.setUpFilteringListEvents = function () {
        getFilteringTypes().forEach(this.setUpFilteringListManagementEvents, this);
    };
    UIManager.prototype.setUpFilteringListManagementEvents = function (type) {
        var _this = this;
        var ids = this.getIds(type);
        var keywordList = this.subscription.getFilteringList(type);
        // Add button
        $id(this.getHTMLId(ids.plusBtnId)).click(function () {
            var input = $id(_this.getHTMLId(ids.inputId));
            var keyword = input.val();
            if (keyword != null && keyword !== "") {
                var area = $id(_this.getKeywordMatchingSelectId(true, type)).val();
                if (area.length > 0) {
                    keyword = _this.keywordManager.insertArea(keyword, area);
                }
                _this.subscription.addKeyword(keyword, type);
                _this.updateFilteringList(type);
                input.val("");
            }
        });
        // Erase all button
        $id(this.getHTMLId(ids.eraseBtnId)).click(function () {
            if (confirm("Erase all the keywords of this list ?")) {
                _this.subscription.resetFilteringList(type);
                _this.updateFilteringList(type);
            }
        });
        this.setUpKeywordButtonsEvents(type);
    };
    UIManager.prototype.setUpKeywordButtonsEvents = function (type) {
        var ids = this.getIds(type);
        var keywordList = this.subscription.getFilteringList(type);
        // Keyword buttons events
        var t = this;
        for (var i = 0; i < keywordList.length; i++) {
            var keywordId = this.getKeywordId(ids.typeId, keywordList[i]);
            $id(keywordId).click(function () {
                var keyword = $(this).text();
                if (confirm("Delete the keyword ?")) {
                    t.subscription.removeKeyword(keyword, type);
                    t.updateFilteringList(type);
                }
            });
        }
    };
    UIManager.prototype.updateFilteringList = function (type) {
        this.prepareFilteringList(type);
        this.refreshFilteringAndSorting();
    };
    UIManager.prototype.prepareFilteringList = function (type) {
        var ids = this.getIds(type);
        var filteringList = this.subscription.getFilteringList(type);
        var filteringKeywordsHTML = "";
        for (var i = 0; i < filteringList.length; i++) {
            var keyword = filteringList[i];
            var keywordId = this.getKeywordId(ids.typeId, keyword);
            var filteringKeywordHTML = bindMarkup(templates.keywordHTML, [
                { name: "keywordId", value: keywordId },
                { name: "keyword", value: keyword }
            ]);
            filteringKeywordsHTML += filteringKeywordHTML;
        }
        $id(ids.filetringKeywordsId).html(filteringKeywordsHTML);
        this.setUpKeywordButtonsEvents(type);
    };
    UIManager.prototype.updateAdditionalSortingTypes = function () {
        var additionalSortingTypes = [];
        $("#FFnS_AdditionalSortingTypes > select").each(function (i, e) {
            return additionalSortingTypes.push($(e).val());
        });
        this.subscription.setAdditionalSortingTypes(additionalSortingTypes);
        this.refreshFilteringAndSorting();
    };
    UIManager.prototype.addArticle = function (article) {
        var _this = this;
        try {
            this.checkReadArticles(article);
            if (this.containsReadArticles) {
                return;
            }
            this.articleManager.addArticle(article);
            var articleObserver = new MutationObserver(function (mr, observer) {
                var readClassElement = !$(article).hasClass(ext.articleViewClass)
                    ? $(article)
                    : $(article).closest(ext.articleViewEntryContainerSelector);
                if (readClassElement.hasClass(ext.readArticleClass) &&
                    !$(article).hasClass("inlineFrame")) {
                    if (_this.subscription.isHideAfterRead()) {
                        if (_this.subscription.isReplaceHiddenWithGap()) {
                            $(article).attr("gap-article", "true");
                        }
                        else {
                            $(article).remove();
                        }
                    }
                    observer.disconnect();
                }
            });
            articleObserver.observe(article, { attributes: true });
        }
        catch (err) {
            console.log(err);
        }
    };
    UIManager.prototype.addSection = function (section) {
        if (section.id === "section0") {
            $(section)
                .find("h2")
                .text(" ");
        }
        else {
            $(section).remove();
        }
    };
    UIManager.prototype.checkReadArticles = function (article) {
        if (!this.containsReadArticles) {
            this.containsReadArticles = $(article).hasClass(ext.readArticleClass);
            if (this.containsReadArticles) {
                this.articleManager.resetArticles();
            }
        }
    };
    UIManager.prototype.importFromOtherSub = function () {
        var selectedURL = this.getSettingsControlsSelectedSubscription();
        if (selectedURL &&
            confirm("Import settings from the subscription url /" + selectedURL + " ?")) {
            this.settingsManager
                .importSubscription(selectedURL)
                .then(this.refreshPage, this);
        }
    };
    UIManager.prototype.linkToSub = function () {
        var selectedURL = this.getSettingsControlsSelectedSubscription();
        if (selectedURL &&
            confirm("Link current subscription to: /" + selectedURL + " ?")) {
            this.settingsManager.linkToSubscription(selectedURL);
            this.refreshPage();
        }
    };
    UIManager.prototype.unlinkFromSub = function () {
        if (confirm("Unlink current subscription ?")) {
            this.settingsManager.deleteSubscription(this.settingsManager.getActualSubscriptionURL());
            this.refreshPage();
        }
    };
    UIManager.prototype.deleteSub = function () {
        var selectedURL = this.getSettingsControlsSelectedSubscription();
        if (selectedURL && confirm("Delete : /" + selectedURL + " ?")) {
            this.settingsManager.deleteSubscription(selectedURL);
            this.refreshPage();
        }
    };
    UIManager.prototype.getHTMLId = function (id) {
        return "FFnS_" + id;
    };
    UIManager.prototype.getKeywordId = function (keywordListId, keyword) {
        if (!(keyword in this.keywordToId)) {
            var id = this.idCount++;
            this.keywordToId[keyword] = id;
        }
        return this.getHTMLId(keywordListId + "_" + this.keywordToId[keyword]);
    };
    UIManager.prototype.getFilteringTypeTabId = function (filteringType) {
        return this.getHTMLId("Tab_" + FilteringType[filteringType]);
    };
    UIManager.prototype.getIds = function (type) {
        var id = getFilteringTypeId(type);
        return {
            typeId: "Keywords_" + id,
            inputId: "Input_" + id,
            plusBtnId: "Add_" + id,
            eraseBtnId: "DeleteAll_" + id,
            filetringKeywordsId: "FiletringKeywords_" + id
        };
    };
    return UIManager;
}());
var ColoringRuleHTMLIds = (function () {
    function ColoringRuleHTMLIds(id) {
        this.id = id;
        this.highlightId = id + " .FFnS_HighlightAllTitle";
        this.colorId = id + " .FFnS_SpecificColor";
        this.sourceId = id + " .FFnS_ColoringRule_Source";
        this.matchingMethodId = id + " .FFnS_KeywordMatchingMethod";
        this.matchingMethodContainerId =
            id + " .FFnS_ColoringRule_MatchingMethodGroup";
        this.keywordInputId = id + " .FFnS_ColoringRule_KeywordInput";
        this.addBtnId = id + " .FFnS_ColoringRule_AddKeyword";
        this.eraseBtnId = id + " .FFnS_ColoringRule_EraseKeywords";
        this.keywordContainerId = id + " .FFnS_ColoringRuleKeywords";
        this.keywordGroupId = id + " .FFnS_ColoringRule_KeywordsGroup";
        this.specificColorGroupId = id + " .FFnS_SpecificColorGroup";
        this.optionsSpanId = id + " .FFnS_ColoringRule_Options";
        this.sourceTitleInfosId = id + " .FFnS_ColoringRule_SourceTitleInfos";
        this.removeColoringRuleId = id + " .FFnS_RemoveColoringRule";
        this.moveUpColoringRuleId = id + " .FFnS_MoveUpColoringRule";
        this.moveDownColoringRuleId = id + " .FFnS_MoveDownColoringRule";
    }
    return ColoringRuleHTMLIds;
}());

var HTMLSubscriptionManager = (function () {
    function HTMLSubscriptionManager(manager) {
        var _this = this;
        this.subscriptionSettings = [];
        this.configByElementType = {};
        this.manager = manager;
        this.configByElementType[HTMLElementType.SelectBox] = {
            setUpChangeCallback: function (subscriptionSetting) {
                $id(subscriptionSetting.htmlId).change(_this.getChangeCallback(subscriptionSetting));
            },
            getHTMLValue: function (subscriptionSetting) {
                return $id(subscriptionSetting.htmlId).val();
            },
            update: function (subscriptionSetting) {
                var value = _this.manager.subscription["get" + subscriptionSetting.id]();
                $id(subscriptionSetting.htmlId).val(value);
            }
        };
        this.configByElementType[HTMLElementType.CheckBox] = {
            setUpChangeCallback: function (subscriptionSetting) {
                $id(subscriptionSetting.htmlId).change(_this.getChangeCallback(subscriptionSetting));
            },
            getHTMLValue: function (subscriptionSetting) {
                return isChecked($id(subscriptionSetting.htmlId));
            },
            update: function (subscriptionSetting) {
                var value = _this.manager.subscription["is" + subscriptionSetting.id]();
                setChecked(subscriptionSetting.htmlId, value);
            }
        };
        this.configByElementType[HTMLElementType.NumberInput] = {
            setUpChangeCallback: function (subscriptionSetting) {
                var callback = _this.getChangeCallback(subscriptionSetting);
                $id(subscriptionSetting.htmlId)[0].oninput = function (ev) {
                    callback();
                };
            },
            getHTMLValue: function (subscriptionSetting) {
                return Number($id(subscriptionSetting.htmlId).val());
            },
            update: this.configByElementType[HTMLElementType.SelectBox].update
        };
        this.configByElementType[HTMLElementType.ColorInput] = {
            setUpChangeCallback: function (subscriptionSetting) {
                var callback = _this.getChangeCallback(subscriptionSetting);
                var e = $id(subscriptionSetting.htmlId)[0];
                e.oninput = function (ev) {
                    callback();
                };
                e.onchange = e.oninput;
            },
            getHTMLValue: this.configByElementType[HTMLElementType.SelectBox]
                .getHTMLValue,
            update: function (subscriptionSetting) {
                var value = _this.manager.subscription["get" + subscriptionSetting.id]();
                var jq = $id(subscriptionSetting.htmlId);
                jq.val(value);
                if (!subscriptionSetting["jscolor"]) {
                    subscriptionSetting["jscolor"] = true;
                    new jscolor(jq[0]);
                }
            }
        };
    }
    HTMLSubscriptionManager.prototype.getChangeCallback = function (setting) {
        return function () {
            try {
                var val = setting.config.getHTMLValue(setting);
                if (val == null) {
                    return;
                }
                setting.manager.subscription["set" + setting.id](val);
                setting.manager.refreshFilteringAndSorting();
            }
            catch (e) {
                console.log(e);
            }
        };
    };
    HTMLSubscriptionManager.prototype.registerSettings = function (ids, type, subscriptionSettingConfig) {
        this.addSettings(ids, this.configByElementType[type], subscriptionSettingConfig);
    };
    HTMLSubscriptionManager.prototype.registerSelectBoxBoolean = function (id, getValueCallback) {
        this.registerSettings([id], HTMLElementType.SelectBox, {
            update: function (subscriptionSetting) {
                $id(subscriptionSetting.htmlId).val(getValueCallback(subscriptionSetting.manager.subscription) + "");
            },
            getHTMLValue: function (subscriptionSetting) {
                return $id(subscriptionSetting.htmlId).val() === "true";
            }
        });
    };
    HTMLSubscriptionManager.prototype.addSettings = function (ids, config, subscriptionSettingConfig) {
        var _this = this;
        ids.forEach(function (id) {
            var setting = new HTMLSubscriptionSetting(_this.manager, id, config, subscriptionSettingConfig);
            _this.subscriptionSettings.push(setting);
        });
    };
    HTMLSubscriptionManager.prototype.setUpCallbacks = function () {
        this.subscriptionSettings.forEach(function (subscriptionSetting) {
            subscriptionSetting.setUpCallbacks();
        });
    };
    HTMLSubscriptionManager.prototype.update = function () {
        this.subscriptionSettings.forEach(function (subscriptionSetting) {
            subscriptionSetting.update();
        });
    };
    return HTMLSubscriptionManager;
}());
var HTMLSubscriptionSetting = (function () {
    function HTMLSubscriptionSetting(manager, id, config, subscriptionSettingConfig) {
        this.manager = manager;
        this.id = id;
        this.htmlId = manager.getHTMLId(id);
        var getHTMLValue, update;
        if (subscriptionSettingConfig != null) {
            getHTMLValue = subscriptionSettingConfig.getHTMLValue;
            update = subscriptionSettingConfig.update;
        }
        getHTMLValue = getHTMLValue == null ? config.getHTMLValue : getHTMLValue;
        update = update == null ? config.update : update;
        this.config = {
            setUpChangeCallback: config.setUpChangeCallback,
            getHTMLValue: getHTMLValue,
            update: update
        };
    }
    HTMLSubscriptionSetting.prototype.update = function () {
        this.config.update(this);
    };
    HTMLSubscriptionSetting.prototype.setUpCallbacks = function () {
        this.config.setUpChangeCallback(this);
    };
    return HTMLSubscriptionSetting;
}());

var HTMLGlobalSettings = (function () {
    function HTMLGlobalSettings(id, defaultValue, uiManager, fullRefreshOnChange, sessionStore) {
        if (fullRefreshOnChange === void 0) { fullRefreshOnChange = false; }
        if (sessionStore === void 0) { sessionStore = true; }
        this.id = id;
        this.defaultValue = defaultValue;
        this.isBoolean = typeof defaultValue === "boolean";
        this.uiManager = uiManager;
        this.htmlId = uiManager.getHTMLId(id);
        this.fullRefreshOnChange = fullRefreshOnChange;
        this.sessionStoreEnabled = sessionStore;
    }
    HTMLGlobalSettings.prototype.init = function () {
        return this.load();
    };
    HTMLGlobalSettings.prototype.load = function () {
        var _this = this;
        return new AsyncResult(function (p) {
            DataStore.getAsync(_this.id, _this.defaultValue).then(function (value) {
                _this.setValue(value);
                p.done();
            }, _this);
        }, this);
    };
    HTMLGlobalSettings.prototype.reset = function () {
        var _this = this;
        return new AsyncResult(function (p) {
            _this.load().then(function () {
                _this.refreshHTMLValue();
                p.done();
            }, _this);
        }, this);
    };
    HTMLGlobalSettings.prototype.getValue = function () {
        return this.value;
    };
    HTMLGlobalSettings.prototype.setValue = function (value) {
        this.value = value;
        this.sessionStore();
    };
    HTMLGlobalSettings.prototype.refreshValue = function (value) {
        this.setValue(value);
        this.save();
        this.refreshHTMLValue();
    };
    HTMLGlobalSettings.prototype.setAdditionalChangeCallback = function (additionalChangeCallback) {
        this.additionalChangeCallback = additionalChangeCallback;
    };
    HTMLGlobalSettings.prototype.save = function () {
        DataStore.put(this.id, this.value);
    };
    HTMLGlobalSettings.prototype.sessionStore = function () {
        if (this.sessionStoreEnabled) {
            this.uiManager.page.put(this.id, this.value, true);
        }
    };
    HTMLGlobalSettings.prototype.getHTMLValue = function (e) {
        if (this.isBoolean) {
            return isChecked(e);
        }
        else {
            return Number(e.val());
        }
    };
    HTMLGlobalSettings.prototype.refreshHTMLValue = function () {
        if (this.isBoolean) {
            setChecked(this.htmlId, this.value);
        }
        else {
            return $id(this.htmlId).val(this.value);
        }
    };
    HTMLGlobalSettings.prototype.initUI = function () {
        var _this = this;
        var this_ = this;
        var additionalCallback = function () {
            if (_this.additionalChangeCallback) {
                _this.additionalChangeCallback.call(_this, this_.value);
            }
        };
        function changeCallback() {
            var val = this_.getHTMLValue($(this));
            this_.setValue(val);
            this_.save();
            if (this_.fullRefreshOnChange) {
                this_.uiManager.refreshPage();
            }
            additionalCallback();
        }
        if (this.isBoolean) {
            $id(this.htmlId).click(changeCallback);
        }
        else {
            $id(this.htmlId)[0].oninput = changeCallback;
        }
        this.refreshHTMLValue();
        additionalCallback();
    };
    return HTMLGlobalSettings;
}());

var DEBUG = false;
function initResources() {
    INITIALIZER.loadScript("jquery.min.js");
    INITIALIZER.loadScript("node-creation-observer.js");
    var urls = INITIALIZER.getResourceURLs();
    ext.plusIconLink = urls.plusIconURL;
    ext.eraseIconLink = urls.eraseIconURL;
    ext.closeIconLink = urls.closeIconURL;
    ext.moveUpIconLink = urls.moveUpIconURL;
    ext.moveDownIconLink = urls.moveDownIconURL;
    templates.styleCSS = bindMarkup(templates.styleCSS, [
        { name: "open-in-new-tab-url", value: urls.openInNewTabURL },
        { name: "extension-icon", value: urls.extensionIconURL }
    ]);
    injectStyleText(templates.styleCSS);
}
$(document).ready(function () {
    try {
        initResources();
        var uiManager = new UIManager();
        var uiManagerBind = callbackBindedTo(uiManager);
        NodeCreationObserver.onCreation(ext.subscriptionChangeSelector, function () {
            console.log("Feedly page fully loaded");
            uiManager.init().then(function () {
                NodeCreationObserver.onCreation(ext.articleSelector, uiManagerBind(uiManager.addArticle));
                NodeCreationObserver.onCreation(ext.sectionSelector, uiManagerBind(uiManager.addSection));
                NodeCreationObserver.onCreation(ext.subscriptionChangeSelector, uiManagerBind(uiManager.updatePage));
            }, this);
        }, true);
    }
    catch (e) {
        console.log(e);
    }
});
