import { FilteringType, SortingType, getFilteringTypes, KeywordMatchingArea, KeywordMatchingMethod, ColoringRuleSource } from "./DataTypes";

export class SubscriptionDTO {
    url: string;
    filteringEnabled = false;
    restrictingEnabled = false;
    sortingEnabled = true;
    openAndMarkAsRead = true;
    visualOpenAndMarkAsRead = false;
    titleOpenAndMarkAsRead = false;
    markAsReadAboveBelow = false;
    markAsReadAboveBelowRead = true;
    hideWhenMarkAboveBelow = false;
    openCurrentFeedArticles = false;
    openCurrentFeedArticlesUnreadOnly = true;
    markAsReadOnOpenCurrentFeedArticles = true;
    maxOpenCurrentFeedArticles = 0;
    hideAfterRead = false;
    replaceHiddenWithGap = false;
    markAsReadFiltered = false;
    sortingType: SortingType = SortingType.PopularityDesc;
    advancedControlsReceivedPeriod = new AdvancedControlsReceivedPeriod();
    pinHotToTop = false;
    additionalSortingTypes: SortingType[] = [];
    filteringListsByType: { [key: number]: string[]; } = {};
    keywordMatchingAreas: KeywordMatchingArea[] = [KeywordMatchingArea.Title];
    alwaysUseDefaultMatchingAreas = true;
    keywordMatchingMethod: KeywordMatchingMethod = KeywordMatchingMethod.Simple;
    coloringRules: ColoringRule[] = [];
    autoRefreshEnabled = false;
    autoRefreshMinutes = 60;
    hideDuplicates = false;
    markAsReadDuplicates = false;
    filteringByReadingTime = new FilteringByReadingTime();

    constructor(url: string) {
        this.url = url;
        getFilteringTypes().forEach((type) => {
            this.filteringListsByType[type] = [];
        });
    }
}

export class AdvancedControlsReceivedPeriod {
    maxHours = 6;
    keepUnread = false;
    hide = false;
    showIfHot = false;
    minPopularity = 200;
    markAsReadVisible = false;
}

export class FilteringByReadingTime {
    enabled = false;
    filterLong = true;
    thresholdMinutes = 5;
    keepUnread = false;
    wordsPerMinute = 200;
}

export class ColoringRule {
    source = ColoringRuleSource.SpecificKeywords;
    color = "FFFF00";
    highlightAllTitle = true;
    matchingMethod = KeywordMatchingMethod.Simple;
    specificKeywords: string[] = [];
}
