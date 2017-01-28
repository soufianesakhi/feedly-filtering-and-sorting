/// <reference path="./_references.d.ts" />

import { SubscriptionDTO, AdvancedControlsReceivedPeriod } from "./SubscriptionDTO";
import { SubscriptionDAO } from "./SubscriptionDAO";
import { FilteringType, SortingType, getFilteringTypes, KeywordMatchingArea, KeywordMatchingMethod } from "./DataTypes";

export class Subscription {
    dto: SubscriptionDTO;
    private dao: SubscriptionDAO;

    constructor(dao: SubscriptionDAO, dto?: SubscriptionDTO) {
        this.dao = dao;
        if (dto) {
            this.dto = dto;
        }
    }

    getURL(): string {
        return this.dto.url;
    }

    isFilteringEnabled(): boolean {
        return this.dto.filteringEnabled;
    }

    isRestrictingEnabled(): boolean {
        return this.dto.restrictingEnabled;
    }

    isSortingEnabled(): boolean {
        return this.dto.sortingEnabled;
    }

    isPinHotToTop(): boolean {
        return this.dto.pinHotToTop;
    }

    isOpenAndMarkAsRead(): boolean {
        return this.dto.openAndMarkAsRead;
    }

    isMarkAsReadAboveBelow(): boolean {
        return this.dto.markAsReadAboveBelow;
    }

    isHideWhenMarkAboveBelow(): boolean {
        return this.dto.hideWhenMarkAboveBelow;
    }

    isAlwaysUseDefaultMatchingAreas(): boolean {
        return this.dto.alwaysUseDefaultMatchingAreas;
    }

    getAdvancedControlsReceivedPeriod(): AdvancedControlsReceivedPeriod {
        return this.dto.advancedControlsReceivedPeriod;
    }

    getSortingType(): SortingType {
        return this.dto.sortingType;
    }

    getFilteringList(type: FilteringType): string[] {
        return this.dto.filteringListsByType[type];
    }

    getKeywordMatchingAreas(): KeywordMatchingArea[] {
        return this.dto.keywordMatchingAreas;
    }

    getKeywordMatchingMethod(): KeywordMatchingMethod {
        return this.dto.keywordMatchingMethod;
    }

    setHours_AdvancedControlsReceivedPeriod(hours: number) {
        if (hours > 23) {
            return;
        }
        var advancedPeriodDays = Math.floor(this.getAdvancedControlsReceivedPeriod().maxHours / 24);
        this.setMaxHours_AdvancedControlsReceivedPeriod(hours, advancedPeriodDays);
    }

    setDays_AdvancedControlsReceivedPeriod(days: number) {
        var advancedPeriodHours = this.getAdvancedControlsReceivedPeriod().maxHours % 24;
        this.setMaxHours_AdvancedControlsReceivedPeriod(advancedPeriodHours, days);
    }

    setMaxHours_AdvancedControlsReceivedPeriod(hours: number, days: number) {
        var maxHours = hours + 24 * days;
        this.getAdvancedControlsReceivedPeriod().maxHours = maxHours;
        this.save();
    }

    getAdditionalSortingTypes(): SortingType[] {
        return this.dto.additionalSortingTypes;
    }

    setAdditionalSortingTypes(additionalSortingTypes: SortingType[]) {
        this.dto.additionalSortingTypes = additionalSortingTypes;
        this.save();
    }

    addAdditionalSortingType(additionalSortingType: SortingType) {
        this.dto.additionalSortingTypes.push(additionalSortingType);
        this.save();
    }

    addKeyword(keyword: string, type: FilteringType) {
        this.getFilteringList(type).push(keyword.trim());
        this.save();
    }

    removeKeyword(keyword: string, type: FilteringType) {
        var keywordList = this.getFilteringList(type);
        var index = keywordList.indexOf(keyword);
        if (index > -1) {
            keywordList.splice(index, 1);
        }
        this.save();
    }

    resetFilteringList(type: FilteringType) {
        this.getFilteringList(type).length = 0;
    }

    save() {
        this.dao.save(this.dto);
    }
}
