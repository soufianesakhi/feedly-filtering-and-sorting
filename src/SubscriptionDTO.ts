import { FilteringType, SortingType, getFilteringTypes, KeywordMatchingArea, KeywordMatchingMethod } from "./DataTypes";

export class SubscriptionDTO {
    url: string;
    filteringEnabled = false;
    restrictingEnabled = false;
    sortingEnabled = true;
    openAndMarkAsRead = true;
    markAsReadAboveBelow = false;
    hideWhenMarkAboveBelow = false;
    hideAfterRead = false;
    replaceHiddenWithGap = false;
    sortingType: SortingType = SortingType.PopularityDesc;
    advancedControlsReceivedPeriod = new AdvancedControlsReceivedPeriod();
    pinHotToTop = false;
    additionalSortingTypes: SortingType[] = [];
    filteringListsByType: { [key: number]: string[]; } = {};
    keywordMatchingAreas: KeywordMatchingArea[] = [KeywordMatchingArea.Title];
    alwaysUseDefaultMatchingAreas = true;
    keywordMatchingMethod: KeywordMatchingMethod = KeywordMatchingMethod.Simple;

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
