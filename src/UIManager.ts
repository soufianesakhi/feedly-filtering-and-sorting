/// <reference path="./_references.d.ts" />

import { ArticleManager } from "./ArticleManager";
import { AsyncResult } from "./AsyncResult";
import { DataStore } from "./dao/Storage";
import {
  ColoringRuleSource,
  FilteringType,
  getFilteringTypeId,
  getFilteringTypes,
  HTMLElementType,
  KeywordMatchingArea,
  KeywordMatchingMethod,
  SortingType,
} from "./DataTypes";
import { FeedlyPage } from "./FeedlyPage";
import { HTMLGlobalSettings } from "./HTMLGlobalSettings";
import {
  HTMLSubscriptionManager,
  HTMLSubscriptionSetting,
} from "./HTMLSubscription";
import { KeywordManager } from "./KeywordManager";
import { SettingsManager } from "./SettingsManager";
import { Subscription } from "./Subscription";
import { ColoringRule } from "./SubscriptionDTO";
import {
  $id,
  bindMarkup,
  currentPageNotSupported,
  isChecked,
  onClick,
  setChecked,
} from "./Utils";

export class UIManager {
  page: FeedlyPage;
  settingsManager: SettingsManager;
  keywordManager: KeywordManager;
  htmlSubscriptionManager: HTMLSubscriptionManager;
  articleManager: ArticleManager;
  subscription: Subscription;
  autoLoadAllArticlesCB: HTMLGlobalSettings<boolean>;
  loadByBatchEnabledCB: HTMLGlobalSettings<boolean>;
  batchSizeInput: HTMLGlobalSettings<number>;
  globalSettingsEnabledCB: HTMLGlobalSettings<boolean>;
  crossCheckDuplicatesCB: HTMLGlobalSettings<boolean>;
  crossCheckDuplicatesDaysInput: HTMLGlobalSettings<number>;
  globalSettings: HTMLGlobalSettings<any>[];
  containsReadArticles = false;
  forceReloadGlobalSettings = false;

  keywordToId = {};
  idCount = 1;
  sortingSelectId = "SortingType";

  htmlSettingsElements = [
    {
      type: HTMLElementType.SelectBox,
      ids: [
        this.sortingSelectId,
        "KeywordMatchingMethod",
        this.getKeywordMatchingSelectId(false),
      ],
    },
    {
      type: HTMLElementType.ColorInput,
      ids: ["HighlightDuplicatesColor"],
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
        "DisplayDisableAllFiltersButton",
        "HideDuplicates",
        "MarkAsReadDuplicates",
        "HighlightDuplicates",
        "Enabled_FilteringByReadingTime",
        "KeepUnread_FilteringByReadingTime",
        "DisablePageOverrides",
      ],
    },
    {
      type: HTMLElementType.NumberInput,
      ids: [
        "MinPopularity_AdvancedControlsReceivedPeriod",
        "AutoRefreshMinutes",
        "MaxOpenCurrentFeedArticles",
        "ThresholdMinutes_FilteringByReadingTime",
        "WordsPerMinute_FilteringByReadingTime",
      ],
    },
  ];

  settingsDivContainerId = this.getHTMLId("settingsDivContainer");
  closeBtnId = this.getHTMLId("CloseSettingsBtn");

  init() {
    return new AsyncResult<any>((p) => {
      this.settingsManager = new SettingsManager(this);
      this.keywordManager = new KeywordManager();
      this.page = new FeedlyPage();
      this.htmlSubscriptionManager = new HTMLSubscriptionManager(this);
      this.settingsManager.init().then(() => {
        this.articleManager = new ArticleManager(
          this.settingsManager,
          this.keywordManager,
          this.page
        );
        this.autoLoadAllArticlesCB = new HTMLGlobalSettings<boolean>(
          ext.autoLoadAllArticlesId,
          false,
          this
        );
        this.globalSettingsEnabledCB = new HTMLGlobalSettings<boolean>(
          "globalSettingsEnabled",
          true,
          this,
          true,
          false
        );
        this.loadByBatchEnabledCB = new HTMLGlobalSettings<boolean>(
          ext.loadByBatchEnabledId,
          false,
          this
        );
        this.batchSizeInput = new HTMLGlobalSettings<number>(
          ext.batchSizeId,
          200,
          this
        );
        const crossCheckSettings =
          this.settingsManager.getCrossCheckDuplicatesSettings();
        this.crossCheckDuplicatesCB = new HTMLGlobalSettings<boolean>(
          "CrossCheckDuplicates",
          false,
          this,
          false,
          false
        );
        this.crossCheckDuplicatesDaysInput = new HTMLGlobalSettings<number>(
          "CrossCheckDuplicatesDays",
          3,
          this,
          false,
          false
        );
        this.crossCheckDuplicatesCB.setAdditionalChangeCallback((val) =>
          crossCheckSettings.setEnabled(val)
        );
        this.crossCheckDuplicatesDaysInput.setAdditionalChangeCallback((val) =>
          crossCheckSettings.setDays(val)
        );
        this.globalSettings = [
          this.autoLoadAllArticlesCB,
          this.loadByBatchEnabledCB,
          this.batchSizeInput,
          this.globalSettingsEnabledCB,
          this.crossCheckDuplicatesCB,
          this.crossCheckDuplicatesDaysInput,
        ];
        this.initGlobalSettings(this.globalSettings.slice(0)).then(() => {
          this.page.initAutoLoad();
          this.updateSubscription().then(() => {
            this.initUI();
            this.registerSettings();
            this.postUpdate();
            this.initSettingsCallbacks();
            this.postInit();
            p.done();
          }, this);
        }, this);
      }, this);
    }, this);
  }

  initGlobalSettings(settings: HTMLGlobalSettings<any>[]): AsyncResult<any> {
    if (settings.length == 1) {
      return settings[0].init();
    } else {
      return new AsyncResult<any>((p) => {
        settings
          .pop()
          .init()
          .then(() => {
            this.initGlobalSettings(settings).chain(p);
          }, this);
      }, this);
    }
  }

  resetGlobalSettings(settings: HTMLGlobalSettings<any>[]): AsyncResult<any> {
    if (settings.length == 1) {
      return settings[0].reset();
    } else {
      return new AsyncResult<any>((p) => {
        settings
          .pop()
          .reset()
          .then(() => {
            this.resetGlobalSettings(settings).chain(p);
          }, this);
      }, this);
    }
  }

  updatePage() {
    if (currentPageNotSupported()) {
      return;
    }
    try {
      this.resetPage();
      this.updateSubscription().then(this.postUpdate, this);
    } catch (err) {
      console.log(err);
    }
  }

  postUpdate() {
    if (currentPageNotSupported()) {
      return;
    }
    this.updateMenu();
    setTimeout(() => {
      this.refreshFilteringAndSorting();
    }, 500);
    if (this.subscription.isAutoRefreshEnabled()) {
      setInterval(() => {
        window.location.reload();
      }, this.subscription.getAutoRefreshTime());
    }
  }

  resetPage() {
    this.containsReadArticles = false;
    this.articleManager.resetArticles();
  }

  refreshPage() {
    this.updatePage();
    this.refreshFilteringAndSorting();
  }

  refreshFilteringAndSorting() {
    this.page.reset();
    this.page.update(this.subscription);
    this.articleManager.refreshArticles();
    document.dispatchEvent(new Event('ensureSortedEntries'));
  }

  updateSubscription(): AsyncResult<any> {
    return new AsyncResult<any>((p) => {
      if (currentPageNotSupported()) {
        p.done();
        return;
      }
      var globalSettingsEnabled = this.globalSettingsEnabledCB.getValue();
      this.settingsManager
        .loadSubscription(globalSettingsEnabled, this.forceReloadGlobalSettings)
        .then((sub) => {
          this.subscription = sub;
          p.done();
        }, this);
    }, this);
  }

  updateMenu() {
    this.htmlSubscriptionManager.update();
    getFilteringTypes().forEach((type) => {
      this.prepareFilteringList(type);
    });
    this.updateSettingsControls();

    // Additional sorting types
    $("#FFnS_AdditionalSortingTypes").empty();
    this.subscription.getAdditionalSortingTypes().forEach((s) => {
      var id = this.registerAdditionalSortingType();
      $id(id).val(s);
    });

    // coloring rules
    $("#FFnS_ColoringRules").empty();
    this.subscription
      .getColoringRules()
      .forEach(this.registerColoringRule, this);
    this.refreshColoringRuleArrows();

    this.updateSettingsModeTitle();
    this.updateFilteringKeywordMatchingSelects();
  }

  updateSettingsModeTitle() {
    var title = this.globalSettingsEnabledCB.getValue()
      ? "Global"
      : "Subscription";
    title += " settings";
    $id("FFnS_settings_mode_title").text(title);
  }

  updateSettingsControls() {
    $id("FFnS_SettingsControls_SelectedSubscription").html(
      this.getImportOptionsHTML()
    );
    var linkedSubContainer = $id("FFnS_SettingsControls_LinkedSubContainer");
    var linkedSub = $id("FFnS_SettingsControls_LinkedSub");
    if (
      (!this.globalSettingsEnabledCB.getValue() &&
        this.subscription.getURL() !==
          this.settingsManager.getActualSubscriptionURL()) ||
      (this.globalSettingsEnabledCB.getValue() &&
        !this.settingsManager.isGlobalMode())
    ) {
      linkedSubContainer.css("display", "");
      linkedSub.text(
        "Subscription currently linked to: " + this.subscription.getURL()
      );
    } else {
      linkedSubContainer.css("display", "none");
      linkedSub.text("");
    }
  }

  getSettingsControlsSelectedSubscription(): string {
    return $id("FFnS_SettingsControls_SelectedSubscription").val() as string;
  }

  initUI() {
    this.initSettingsMenu();
    this.initShowSettingsBtns();
    this.globalSettings.forEach((globalSetting) => {
      globalSetting.initUI();
    });
  }

  initSettingsMenu() {
    var marginElementClass = this.getHTMLId("margin_element");
    var tabsMenuId = this.getHTMLId("tabs_menu");
    var tabsContentContainerId = this.getHTMLId("tabs_content");

    var settingsHtml = bindMarkup(templates.settingsHTML, [
      {
        name: "SortingSelect",
        value: this.getSortingSelectHTML(this.getHTMLId(this.sortingSelectId)),
      },
      {
        name: "FilteringList.Type.FilteredOut",
        value: this.getFilteringListHTML(FilteringType.FilteredOut),
      },
      {
        name: "FilteringList.Type.RestrictedOn",
        value: this.getFilteringListHTML(FilteringType.RestrictedOn),
      },
      {
        name: "ImportMenu.SubscriptionOptions",
        value: this.getImportOptionsHTML(),
      },
      { name: "closeIconLink", value: ext.closeIconLink },
      { name: "plusIconLink", value: ext.plusIconLink },
      { name: "eraseIconLink", value: ext.eraseIconLink },
      {
        name: "DefaultKeywordMatchingArea",
        value: this.getKeywordMatchingSelectHTML("multiple required", false),
      },
      {
        name: "KeywordMatchingMethod",
        value: this.getKeywordMatchingMethod(true),
      },
    ]);
    $("body").prepend(settingsHtml);

    // set up tabs
    $("#" + tabsMenuId + " a").click(function (event) {
      event.preventDefault();
      $(this).parent().addClass("current");
      $(this).parent().siblings().removeClass("current");
      var tab = $(this).attr("href");
      $("#" + tabsContentContainerId + " > div")
        .not(tab)
        .css("display", "none");
      $(tab).show();
      focusKeywordsInput();
    });
    $("#" + tabsContentContainerId + " > div")
      .first()
      .show();

    $(document).keyup((event) => {
      if (event.key === "Escape") {
        $id(this.settingsDivContainerId).hide();
      }
      this.checkKeywordsInputEnter(event);
    });

    $("#FFnS_settingsDivContainer").click((event) => {
      if (event.target.id === "FFnS_settingsDivContainer") {
        $id(this.settingsDivContainerId).hide();
      }
    });
  }

  checkKeywordsInputEnter(event: JQuery.KeyUpEvent) {
    if (event.key !== "Enter") {
      return;
    }
    keywordInputs.forEach((e) => {
      const { input, type } = e;
      if ($(input).is(":focus")) {
        this.addKeyword($(input), type);
      }
    });
  }

  getSortingSelectHTML(id: string): string {
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
        value: SortingType.SourceNewestReceiveDate,
      },
      { name: "Random", value: SortingType.Random },
    ]);
  }

  getFilteringListHTML(type: FilteringType): string {
    var ids = this.getIds(type);
    var filteringListHTML = bindMarkup(templates.filteringListHTML, [
      { name: "FilteringTypeTabId", value: this.getFilteringTypeTabId(type) },
      { name: "inputId", value: this.getHTMLId(ids.inputId) },
      { name: "plusBtnId", value: this.getHTMLId(ids.plusBtnId) },
      { name: "eraseBtnId", value: this.getHTMLId(ids.eraseBtnId) },
      { name: "filetringKeywordsId", value: ids.filetringKeywordsId },
      {
        name: "FilteringKeywordMatchingArea",
        value: this.getKeywordMatchingSelectHTML("filtering", true, type),
      },
    ]);
    return filteringListHTML;
  }

  getKeywordMatchingSelectHTML(
    attributes: string,
    includeDefaultOption: boolean,
    type?: FilteringType,
    selectId?: string
  ): string {
    var defaultOption = includeDefaultOption
      ? bindMarkup(templates.emptyOptionHTML, [
          { name: "value", value: "-- area (optional) --" },
        ])
      : "";
    var filteringListHTML = bindMarkup(templates.keywordMatchingSelectHTML, [
      {
        name: "Id",
        value: selectId || this.getKeywordMatchingSelectId(true, type),
      },
      { name: "attributes", value: attributes },
      { name: "defaultOption", value: defaultOption },
      { name: "selectFirst", value: includeDefaultOption ? "" : "selected" },
      { name: "KeywordMatchingArea.Title", value: KeywordMatchingArea.Title },
      { name: "KeywordMatchingArea.Body", value: KeywordMatchingArea.Body },
      { name: "KeywordMatchingArea.Author", value: KeywordMatchingArea.Author },
    ]);
    return filteringListHTML;
  }

  getKeywordMatchingSelectId(html: boolean, type?: FilteringType) {
    var suffix = type == undefined ? "s" : "_" + FilteringType[type];
    var id = "KeywordMatchingArea" + suffix;
    return html ? this.getHTMLId(id) : id;
  }

  getKeywordMatchingMethod(fullSize: boolean, id?: string) {
    id = id || "FFnS_KeywordMatchingMethod";
    return bindMarkup(templates.keywordMatchingMethodHTML, [
      { name: "id", value: id },
      {
        name: "KeywordMatchingMethod.Simple",
        value: KeywordMatchingMethod.Simple,
      },
      { name: "KeywordMatchingMethod.Word", value: KeywordMatchingMethod.Word },
      {
        name: "KeywordMatchingMethod.RegExp",
        value: KeywordMatchingMethod.RegExp,
      },
      { name: "size", value: fullSize ? 'size="3"' : "" },
    ]);
  }

  getImportOptionsHTML(): string {
    var optionsHTML = "";
    var urls = this.settingsManager.getAllSubscriptionURLs();
    urls.forEach((url) => {
      optionsHTML += bindMarkup(templates.optionHTML, [
        { name: "value", value: url },
      ]);
    });
    return optionsHTML;
  }

  initShowSettingsBtns() {
    var this_ = this;
    NodeCreationObserver.onCreation(
      ext.settingsBtnPredecessorSelector,
      (predecessor) => {
        if (
          currentPageNotSupported() ||
          $(predecessor).parent().find(".ShowSettingsBtn").length > 0
        ) {
          return;
        }
        var settingsBtn = $("<div>", {
          title: "Feedly filtering and sorting",
          style: "cursor: pointer;",
          class: "ShowSettingsBtn"
        });
        $(predecessor).after(settingsBtn);
        $(settingsBtn).click(function () {
          $id(this_.settingsDivContainerId).toggle();
          focusKeywordsInput();
        });
      }
    );
  }

  registerSettings() {
    this.htmlSettingsElements.forEach((element) => {
      this.htmlSubscriptionManager.registerSettings(element.ids, element.type);
    });
    this.htmlSubscriptionManager.registerSettings(
      [
        "Hours_AdvancedControlsReceivedPeriod",
        "Days_AdvancedControlsReceivedPeriod",
      ],
      HTMLElementType.NumberInput,
      {
        update: (subscriptionSetting: HTMLSubscriptionSetting) => {
          var advancedControlsReceivedPeriod =
            subscriptionSetting.manager.subscription.getAdvancedControlsReceivedPeriod();
          var maxHours = advancedControlsReceivedPeriod.maxHours;
          var advancedPeriodHours = maxHours % 24;
          var advancedPeriodDays = Math.floor(maxHours / 24);
          if (subscriptionSetting.id.indexOf("Hours") != -1) {
            $id(subscriptionSetting.htmlId).val(advancedPeriodHours);
          } else {
            $id(subscriptionSetting.htmlId).val(advancedPeriodDays);
          }
        },
      }
    );
    this.htmlSubscriptionManager.registerSelectBoxBoolean(
      ext.markAsReadAboveBelowReadId,
      (subscription: Subscription) => {
        return subscription.isMarkAsReadAboveBelowRead();
      }
    );
    this.htmlSubscriptionManager.registerSelectBoxBoolean(
      "FilterLong_FilteringByReadingTime",
      (subscription: Subscription) => {
        return subscription.getFilteringByReadingTime().filterLong;
      }
    );
  }

  initSettingsCallbacks() {
    this.htmlSubscriptionManager.setUpCallbacks();

    $id(this.closeBtnId).click(() => {
      $id(this.settingsDivContainerId).toggle();
    });

    let importSettings = $id("FFnS_ImportSettings");
    importSettings.change(() => {
      this.settingsManager.importAllSettings(importSettings.prop("files")[0]);
    });

    $id("FFnS_ExportSettings").click(() => {
      this.settingsManager.exportAllSettings();
    });

    $id("FFnS_SettingsControls_ImportFromOtherSub").click(() => {
      this.importFromOtherSub();
    });

    $id("FFnS_SettingsControls_LinkToSub").click(() => {
      this.linkToSub();
    });

    $id("FFnS_SettingsControls_UnlinkFromSub").click(() => {
      this.unlinkFromSub();
    });

    $id("FFnS_SettingsControls_DeleteSub").click(() => {
      this.deleteSub();
    });

    $id("FFnS_AddSortingType").click(() => {
      var id = this.registerAdditionalSortingType();
      this.subscription.addAdditionalSortingType($id(id).val() as SortingType);
      this.refreshFilteringAndSorting();
    });

    $id("FFnS_EraseSortingTypes").click(() => {
      this.subscription.setAdditionalSortingTypes([]);
      $("#FFnS_AdditionalSortingTypes").empty();
      this.refreshFilteringAndSorting();
    });

    onClick($id("FFnS_AddColoringRule"), () => {
      let cr = new ColoringRule();
      this.registerColoringRule(cr);
      this.subscription.addColoringRule(cr);
      this.articleManager.refreshColoring();
      this.refreshColoringRuleArrows();
    });

    onClick($id("FFnS_EraseColoringRules"), () => {
      this.subscription.setColoringRules([]);
      $id("FFnS_ColoringRules").empty();
      this.articleManager.refreshColoring();
    });

    this.setUpFilteringListEvents();

    $id("FFnS_AlwaysUseDefaultMatchingAreas").change(
      this.updateFilteringKeywordMatchingSelects
    );
  }

  updateFilteringKeywordMatchingSelects() {
    var selects = $(".FFnS_keywordMatchingSelect[filtering]");
    if (isChecked($($id("FFnS_AlwaysUseDefaultMatchingAreas")))) {
      selects.hide();
    } else {
      selects.show();
    }
  }

  postInit() {
    let syncManager = DataStore.getSyncStorageManager();
    let syncCBId = "FFnS_syncSettingsEnabled";
    if (syncManager) {
      setChecked(syncCBId, syncManager.isSyncEnabled());
      $id(syncCBId).change(() => {
        syncManager.setSyncEnabled(isChecked($id(syncCBId)));
        this.forceReloadGlobalSettings = true;
        this.resetGlobalSettings(this.globalSettings.slice(0)).then(() => {
          this.refreshPage();
          this.forceReloadGlobalSettings = false;
        }, this);
      });
    } else {
      $id(syncCBId).closest(".setting_group").remove();
    }

    const forceRefreshArticlesBtn = $("<button>", {
      id: ext.forceRefreshArticlesId,
      style: "display: none;",
    });
    $("body").append(forceRefreshArticlesBtn);
    forceRefreshArticlesBtn.click((e) => {
      e.preventDefault();
      this.articleManager.refreshArticles();
    });

    onClick(
      $(".icon-fx-light-mode-md-black, .icon-fx-dark-mode-md-black"),
      () => {
        setTimeout(() => this.articleManager.refreshColoring(), 100);
      }
    );
  }

  registerAdditionalSortingType(): string {
    var id = this.getHTMLId("AdditionalSortingType_" + this.idCount++);
    $("#FFnS_AdditionalSortingTypes").append(this.getSortingSelectHTML(id));
    $id(id).change(() => this.updateAdditionalSortingTypes());
    return id;
  }

  registerColoringRule(cr: ColoringRule) {
    var ids = new ColoringRuleHTMLIds(
      this.getHTMLId("ColoringRule_" + this.idCount++)
    );
    let self = this;
    // append template
    let html = bindMarkup(templates.coloringRuleHTML, [
      { name: "Id", value: ids.id },
      { name: "Color", value: cr.color },
      { name: "SpecificKeywords", value: ColoringRuleSource.SpecificKeywords },
      { name: "SourceTitle", value: ColoringRuleSource.SourceTitle },
      {
        name: "RestrictingKeywords",
        value: ColoringRuleSource.RestrictingKeywords,
      },
      {
        name: "FilteringKeywords",
        value: ColoringRuleSource.FilteringKeywords,
      },
      {
        name: "KeywordMatchingMethod",
        value: this.getKeywordMatchingMethod(
          false,
          ids.id + "_KeywordMatchingMethod"
        ),
      },
      {
        name: "KeywordMatchingArea",
        value: this.getKeywordMatchingSelectHTML(
          "required",
          false,
          null,
          ids.id + "_KeywordMatchingArea"
        ),
      },
      { name: "plusIconLink", value: ext.plusIconLink },
      { name: "eraseIconLink", value: ext.eraseIconLink },
      { name: "moveUpIconLink", value: ext.moveUpIconLink },
      { name: "moveDownIconLink", value: ext.moveDownIconLink },
    ]);
    $("#FFnS_ColoringRules").append(html);

    // set current values
    setChecked(ids.highlightId, cr.highlightAllTitle);
    $id(ids.sourceId).val(cr.source);
    $id(ids.matchingMethodId).val(cr.matchingMethod);
    $id(ids.matchingAreaId).val(cr.matchingArea);
    this.refreshColoringRuleSpecificKeywords(cr, ids);
    let refreshVisibility = () => {
      $id(ids.keywordGroupId).css(
        "display",
        cr.source == ColoringRuleSource.SpecificKeywords ? "" : "none"
      );
      let sourceTitle = cr.source == ColoringRuleSource.SourceTitle;
      $id(ids.matchingMethodContainerId).css(
        "display",
        sourceTitle ? "none" : ""
      );
      $id(ids.matchingAreaContainerId).css(
        "display",
        sourceTitle ? "none" : ""
      );
      $id(ids.optionsSpanId).css("display", sourceTitle ? "none" : "");
      $id(ids.sourceTitleInfosId).css("display", sourceTitle ? "" : "none");
    };
    new jscolor($id(ids.colorId)[0]);
    refreshVisibility();

    // change callbacks
    function onChange(
      id: string,
      cb: () => void,
      input?: boolean,
      click?: boolean,
      onchange?: boolean
    ) {
      function callback() {
        try {
          let noChange = cb.call(this);
          if (noChange) {
            return;
          }
          self.subscription.save();
          self.articleManager.refreshColoring();
          refreshVisibility();
        } catch (e) {
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
    onChange(ids.matchingAreaId, function () {
      cr.matchingArea = Number($(this).val());
    });
    onChange(
      ids.colorId,
      function () {
        let str = $(this).val() as string;
        if (str.match(/^\W*([0-9A-F]{3}([0-9A-F]{3})?)\W*$/i)) {
          cr.color = str.toUpperCase();
        } else {
          $(this).val(str);
          return true;
        }
      },
      true,
      false,
      true
    );
    onChange(
      ids.addBtnId,
      () => {
        let keyword = $id(ids.keywordInputId).val() as string;
        if (keyword != null && keyword !== "") {
          cr.specificKeywords.push(keyword);
        }
        $id(ids.keywordInputId).val("");
        this.refreshColoringRuleSpecificKeywords(cr, ids);
      },
      false,
      true
    );
    onChange(
      ids.eraseBtnId,
      () => {
        cr.specificKeywords = [];
        $id(ids.keywordContainerId).empty();
      },
      false,
      true
    );

    // Coloring rule management
    onClick($id(ids.removeColoringRuleId), () => {
      let rules = self.subscription.getColoringRules();
      let i = rules.indexOf(cr);
      if (i > -1) {
        rules.splice(i, 1);
        self.subscription.save();
        self.articleManager.refreshColoring();
      }
      $id(ids.id).remove();
      self.refreshColoringRuleArrows();
    });
    let getMoveColoringRuleCallback = (up: boolean) => {
      return () => {
        let rules = self.subscription.getColoringRules();
        let i = rules.indexOf(cr);
        if (up ? i > 0 : i < rules.length) {
          let swapIdx = up ? i - 1 : i + 1;
          let swap = rules[swapIdx];
          rules[swapIdx] = rules[i];
          rules[i] = swap;
          self.subscription.save();
          self.articleManager.refreshColoring();
          let element = $id(ids.id);
          if (up) {
            let prev = element.prev();
            element.detach().insertBefore(prev);
          } else {
            let next = element.next();
            element.detach().insertAfter(next);
          }
          self.refreshColoringRuleArrows();
        }
      };
    };
    onClick($id(ids.moveUpColoringRuleId), getMoveColoringRuleCallback(true));
    onClick(
      $id(ids.moveDownColoringRuleId),
      getMoveColoringRuleCallback(false)
    );
  }

  refreshColoringRuleArrows() {
    $(".FFnS_MoveUpColoringRule").not(":first").show();
    $(".FFnS_MoveUpColoringRule:first").hide();
    $(".FFnS_MoveDownColoringRule").not(":last").show();
    $(".FFnS_MoveDownColoringRule:last").hide();
  }

  refreshColoringRuleSpecificKeywords(
    cr: ColoringRule,
    ids: ColoringRuleHTMLIds
  ) {
    var keywords = cr.specificKeywords;
    var html = "";

    for (var i = 0; i < keywords.length; i++) {
      var keyword = keywords[i];
      var keywordId = this.getKeywordId(ids.id, keyword);
      var keywordHTML = bindMarkup(templates.keywordHTML, [
        { name: "keywordId", value: keywordId },
        { name: "keyword", value: keyword },
      ]);
      html += keywordHTML;
    }

    $id(ids.keywordContainerId).html(html);
  }

  private setUpFilteringListEvents() {
    getFilteringTypes().forEach(this.setUpFilteringListManagementEvents, this);
  }

  private setUpFilteringListManagementEvents(type: FilteringType) {
    var ids = this.getIds(type);

    // Add button
    $id(this.getHTMLId(ids.plusBtnId)).click(() => {
      var input = $id(this.getHTMLId(ids.inputId));
      this.addKeyword(input, type);
    });

    // Erase all button
    $id(this.getHTMLId(ids.eraseBtnId)).click(() => {
      if (confirm("Erase all the keywords of this list ?")) {
        this.subscription.resetFilteringList(type);
        this.updateFilteringList(type);
      }
    });
  }

  private addKeyword(input: JQuery, type: FilteringType) {
    var keyword = input.val() as string;
    if (keyword != null && keyword !== "") {
      var area = $id(
        this.getKeywordMatchingSelectId(true, type)
      ).val() as string;
      if (area.length > 0) {
        keyword = this.keywordManager.insertArea(keyword, area);
      }
      this.subscription.addKeyword(keyword, type);
      this.updateFilteringList(type);
      input.val("");
    }
  }

  private setUpKeywordButtonsEvents(type: FilteringType) {
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
  }

  updateFilteringList(type: FilteringType) {
    this.prepareFilteringList(type);
    this.refreshFilteringAndSorting();
  }

  prepareFilteringList(type: FilteringType) {
    var ids = this.getIds(type);
    var filteringList = this.subscription.getFilteringList(type);
    var filteringKeywordsHTML = "";

    for (var i = 0; i < filteringList.length; i++) {
      var keyword = filteringList[i];
      var keywordId = this.getKeywordId(ids.typeId, keyword);
      var filteringKeywordHTML = bindMarkup(templates.keywordHTML, [
        { name: "keywordId", value: keywordId },
        { name: "keyword", value: keyword },
      ]);
      filteringKeywordsHTML += filteringKeywordHTML;
    }

    $id(ids.filetringKeywordsId).html(filteringKeywordsHTML);
    this.setUpKeywordButtonsEvents(type);
  }

  updateAdditionalSortingTypes() {
    var additionalSortingTypes = [] as SortingType[];
    $("#FFnS_AdditionalSortingTypes > select").each((i, e) => {
      additionalSortingTypes.push($(e).val() as SortingType);
    });
    this.subscription.setAdditionalSortingTypes(additionalSortingTypes);
    this.refreshFilteringAndSorting();
  }

  addArticle(article: HTMLElement) {
    if (currentPageNotSupported()) {
      return;
    }
    try {
      this.articleManager.addArticle(article);
      const callback = this.readArticlesMutationCallback(article);
      var articleObserver = new MutationObserver(callback);
      articleObserver.observe(article, { attributes: true });
      callback([], articleObserver);
    } catch (err) {
      console.log(err);
    }
  }

  private readArticlesMutationCallback(article: Element): MutationCallback {
    return (mr, observer) => {
      let readClassElement = !$(article).hasClass(ext.inlineViewClass)
        ? $(article)
        : $(article).closest(ext.articleViewEntryContainerSelector);
      if (
        readClassElement.hasClass(ext.readArticleClass) &&
        !$(article).hasClass(ext.inlineViewClass)
      ) {
        if (this.subscription.isHideAfterRead()) {
          if (this.subscription.isReplaceHiddenWithGap()) {
            $(article).attr("gap-article", "true");
          } else {
            $(article).remove();
          }
        }
        observer.disconnect();
      }
    };
  }

  addSection(section: Element) {
    if (currentPageNotSupported()) {
      return;
    }
    if (section.id === "section0") {
      $(section).find("h2").text(" ");
    } else {
      $(section).remove();
    }
  }

  importFromOtherSub() {
    var selectedURL = this.getSettingsControlsSelectedSubscription();
    if (
      selectedURL &&
      confirm(
        "Import settings from the subscription url /" + selectedURL + " ?"
      )
    ) {
      this.settingsManager
        .importSubscription(selectedURL)
        .then(this.refreshPage, this);
    }
  }

  linkToSub() {
    var selectedURL = this.getSettingsControlsSelectedSubscription();
    if (
      selectedURL &&
      confirm("Link current subscription to: /" + selectedURL + " ?")
    ) {
      this.settingsManager.linkToSubscription(selectedURL);
      this.refreshPage();
    }
  }

  unlinkFromSub() {
    if (confirm("Unlink current subscription ?")) {
      this.settingsManager.deleteSubscription(
        this.settingsManager.getActualSubscriptionURL()
      );
      this.refreshPage();
    }
  }

  deleteSub() {
    var selectedURL = this.getSettingsControlsSelectedSubscription();
    if (selectedURL && confirm("Delete : /" + selectedURL + " ?")) {
      this.settingsManager.deleteSubscription(selectedURL);
      this.refreshPage();
    }
  }

  public getHTMLId(id: string) {
    return "FFnS_" + id;
  }

  getKeywordId(keywordListId: string, keyword: string) {
    if (!(keyword in this.keywordToId)) {
      var id = this.idCount++;
      this.keywordToId[keyword] = id;
    }
    return this.getHTMLId(keywordListId + "_" + this.keywordToId[keyword]);
  }

  getFilteringTypeTabId(filteringType: FilteringType) {
    return this.getHTMLId("Tab_" + FilteringType[filteringType]);
  }

  getIds(type: FilteringType) {
    var id = getFilteringTypeId(type);
    return {
      typeId: "Keywords_" + id,
      inputId: "Input_" + id,
      plusBtnId: "Add_" + id,
      eraseBtnId: "DeleteAll_" + id,
      filetringKeywordsId: "FiletringKeywords_" + id,
    };
  }
}

class ColoringRuleHTMLIds {
  id: string;
  highlightId: string;
  colorId: string;
  sourceId: string;
  matchingMethodId: string;
  matchingMethodContainerId: string;
  matchingAreaId: string;
  matchingAreaContainerId: string;
  keywordInputId: string;
  addBtnId: string;
  eraseBtnId: string;
  keywordContainerId: string;
  keywordGroupId: string;
  specificColorGroupId: string;
  optionsSpanId: string;
  sourceTitleInfosId: string;
  removeColoringRuleId: string;
  moveUpColoringRuleId: string;
  moveDownColoringRuleId: string;
  constructor(id: string) {
    this.id = id;
    this.highlightId = id + " .FFnS_HighlightAllTitle";
    this.colorId = id + " .FFnS_SpecificColor";
    this.sourceId = id + " .FFnS_ColoringRule_Source";
    this.matchingMethodId = id + " .FFnS_KeywordMatchingMethod";
    this.matchingMethodContainerId =
      id + " .FFnS_ColoringRule_MatchingMethodGroup";
    this.matchingAreaId = id + " .FFnS_keywordMatchingSelect";
    this.matchingAreaContainerId = id + " .FFnS_ColoringRule_MatchingAreaGroup";
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
}

const keywordInputs = [
  { input: "#FFnS_Input_FilteredOut", type: FilteringType.FilteredOut },
  { input: "#FFnS_Input_RestrictedOn", type: FilteringType.RestrictedOn },
];

const focusKeywordsInputSelector = keywordInputs
  .map((e) => e.input + ":visible")
  .join(",");

function focusKeywordsInput() {
  $(focusKeywordsInputSelector).focus().val("");
}
