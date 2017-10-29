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

export class ColoringRule {
    source = ColoringRuleSource.SpecificKeywords;
    color = "FFFF00";
    highlightAllTitle = true;
    matchingMethod = KeywordMatchingMethod.Simple;
    specificKeywords: string[] = [];
}
