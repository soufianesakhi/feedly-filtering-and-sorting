var templates = {
    "settingsHTML": "",
    "filteringListHTML": "",
    "keywordHTML": '<button id="{{keywordId}}" type="button" class="FFnS_keyword">{{keyword}}</button>',
    "sortingSelectHTML": "",
    "keywordMatchingSelectHTML": "",
    "keywordMatchingMethodHTML": "",
    "coloringRuleHTML": "",
    "optionHTML": "<option value='{{value}}'>{{value}}</option>",
    "emptyOptionHTML": "<option value=''>{{value}}</option>",
    "styleCSS": ""
}

declare module "templates" {
    export = templates;
}
