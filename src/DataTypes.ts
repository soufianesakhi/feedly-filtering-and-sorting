/// <reference path="./_references.d.ts" />

export enum SortingType {
    PopularityDesc,
    PopularityAsc,
    TitleDesc,
    TitleAsc,
    PublishDateNewFirst,
    PublishDateOldFirst,
    SourceAsc,
    SourceDesc,
    ReceivedDateNewFirst,
    ReceivedDateOldFirst
}

export enum FilteringType {
    RestrictedOn,
    FilteredOut
}

export enum KeywordMatchingArea {
    Title,
    Body,
    Author
}

export enum KeywordMatchingMethod {
    Simple,
    Word,
    RegExp
}

export enum ColoringRuleSource {
    SpecificKeywords,
    SourceTitle,
    RestrictingKeywords,
    FilteringKeywords
}

export enum HTMLElementType {
    SelectBox, CheckBox, NumberInput
}

export function getFilteringTypes(): FilteringType[] {
    return [FilteringType.FilteredOut, FilteringType.RestrictedOn];
}

export function getFilteringTypeId(type: FilteringType): string {
    return FilteringType[type];
}
