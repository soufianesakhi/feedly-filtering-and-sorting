/// <reference path="./_references.d.ts" />

import { SubscriptionDTO, AdvancedControlsReceivedPeriod, ColoringRule } from "./SubscriptionDTO";
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

    isVisualOpenAndMarkAsRead(): boolean {
        return this.dto.visualOpenAndMarkAsRead;
    }

    isTitleOpenAndMarkAsRead(): boolean {
        return this.dto.titleOpenAndMarkAsRead;
    }

    isMarkAsReadAboveBelow(): boolean {
        return this.dto.markAsReadAboveBelow;
    }

    isMarkAsReadAboveBelowRead(): boolean {
        return this.dto.markAsReadAboveBelowRead;
    }

    isHideWhenMarkAboveBelow(): boolean {
        return this.dto.hideWhenMarkAboveBelow;
    }

    isOpenCurrentFeedArticles(): boolean {
        return this.dto.openCurrentFeedArticles;
    }

    isOpenCurrentFeedArticlesUnreadOnly(): boolean {
        return this.dto.openCurrentFeedArticlesUnreadOnly;
    }

    isMarkAsReadOnOpenCurrentFeedArticles(): boolean {
        return this.dto.markAsReadOnOpenCurrentFeedArticles;
    }

    getMaxOpenCurrentFeedArticles(): number {
        return this.dto.maxOpenCurrentFeedArticles;
    }

    isHideAfterRead(): boolean {
        return this.dto.hideAfterRead;
    }

    isReplaceHiddenWithGap(): boolean {
        return this.dto.replaceHiddenWithGap;
    }

    isAlwaysUseDefaultMatchingAreas(): boolean {
        return this.dto.alwaysUseDefaultMatchingAreas;
    }

    isMarkAsReadFiltered(): boolean {
        return this.dto.markAsReadFiltered;
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

    isAutoRefreshEnabled(): boolean {
        return this.dto.autoRefreshEnabled;
    }

    getAutoRefreshTime(): number {
        return this.dto.autoRefreshMinutes * 60 * 1000;
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

    getColoringRules(): ColoringRule[] {
        return this.dto.coloringRules;
    }

    setColoringRules(coloringRules: ColoringRule[]) {
        this.dto.coloringRules = coloringRules;
        this.save();
    }

    addColoringRule(coloringRule: ColoringRule) {
        this.dto.coloringRules.push(coloringRule);
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
