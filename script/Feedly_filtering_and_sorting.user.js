// ==UserScript==
// @name        Feedly filtering and sorting
// @namespace   https://github.com/soufianesakhi/feedly-filtering-and-sorting
// @description Enhance the feedly website with advanced filtering, sorting and more
// @author      Soufiane Sakhi
// @license     MIT licensed, Copyright (c) 2016 Soufiane Sakhi (https://opensource.org/licenses/MIT)
// @homepageURL https://github.com/soufianesakhi/feedly-filtering-and-sorting
// @supportURL  https://github.com/soufianesakhi/feedly-filtering-and-sorting/issues
// @icon        https://raw.githubusercontent.com/soufianesakhi/feedly-filtering-and-sorting/master/web-ext/icons/128.png
// @require     http://code.jquery.com/jquery.min.js
// @resource    jquery.min.js http://code.jquery.com/jquery.min.js
// @require     https://greasyfork.org/scripts/19857-node-creation-observer/code/node-creation-observer.js?version=174436
// @resource    node-creation-observer.js https://greasyfork.org/scripts/19857-node-creation-observer/code/node-creation-observer.js?version=174436
// @include     *://feedly.com/*
// @version     2.7.1
// @grant       GM_setValue
// @grant       GM_getValue
// @grant       GM_deleteValue
// @grant       GM_listValues
// @grant       GM_getResourceText
// ==/UserScript==

var ext = {
    "plusIconLink": "https://cdn0.iconfinder.com/data/icons/social-messaging-ui-color-shapes/128/add-circle-blue-128.png",
    "eraseIconLink": "https://cdn2.iconfinder.com/data/icons/large-glossy-svg-icons/512/erase_delete_remove_wipe_out-128.png",
    "closeIconLink": "https://cdn2.iconfinder.com/data/icons/social-productivity-line-art-1/128/close-cancel-128.png",
    "urlPrefixPattern": "https?:\/\/[^\/]+\/i\/",
    "settingsBtnPredecessorSelector": ".button-refresh",
    "articleSelector": ".list-entries > .entry:not([gap-article])",
    "unreadArticlesSelector": ".list-entries > .entry.unread:not([gap-article])",
    "uncheckedArticlesSelector": ".list-entries > .entry:not([checked-FFnS])",
    "readArticleClass": "read",
    "loadingMessageSelector": ".list-entries .message.loading",
    "sectionSelector": "#timeline > .section",
    "publishAgeSpanSelector": ".ago",
    "publishAgeTimestampAttr": "title",
    "articleSourceSelector": ".source",
    "subscriptionChangeSelector": "header .heading",
    "articleTitleAttribute": "data-title",
    "articleEntryIdAttribute": "data-entryid",
    "popularitySelector": ".engagement",
    "hidingInfoSibling": "header > h1 > .button-dropdown",
    "endOfFeedSelector": ".list-entries h4:contains(End of feed)",
    "notFollowedPageSelector": "button.follow",
    "lastReadEntryId": "lastReadEntry",
    "keepNewArticlesUnreadId": "keepNewArticlesUnread",
    "articlesToMarkAsReadId": "articlesToMarkAsRead",
    "sortedVisibleArticlesId": "sortedVisibleArticles",
    "openAndMarkAsReadId": "isOpenAndMarkAsRead",
    "openAndMarkAsReadClass": "open-in-new-tab-button",
    "markAsReadAboveBelowId": "isMarkAsReadAboveBelowId",
    "markAsReadAboveBelowClass": "mark-as-read-above-below-button",
    "entryInfosJsonClass": "entryInfosJson",
    "hideWhenMarkAboveBelowId": "isHideWhenMarkAboveBelow",
    "hideAfterReadId": "isHideAfterRead",
    "autoLoadAllArticlesId": "autoLoadAllArticles",
    "isNewestFirstId": "isNewestFirst",
    "markAsReadAboveBelowReadId": "MarkAsReadAboveBelowRead",
};

var exported = {};
function $id(id) {
    return $('#' + id);
}
function bindMarkup(html, bindings) {
    bindings.forEach(function (binding) {
        html = html.replace(new RegExp("\{\{" + binding.name + "\}\}", "g"), "" + binding.value);
    });
    return html;
}
function callbackBindedTo(thisArg) {
    return (function (callback) {
        return callback.bind(this);
    }).bind(thisArg);
}
function capitalizeFirst(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
}
function isChecked(input) {
    return input.is(':checked');
}
function setChecked(htmlId, checked) {
    $id(htmlId).prop('checked', checked);
}
function registerAccessors(srcObject, srcFieldName, targetPrototype, setterCallback, setterCallbackThisArg, fieldObjectName) {
    for (var field in srcObject) {
        var type = typeof (srcObject[field]);
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
                    return fieldObjectName == null ? callbackSrcObj : callbackSrcObj[fieldObjectName];
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
    for (var field in typedClone) {
        var type = typeof (typedClone[field]);
        if (toClone[field] == null) {
            continue;
        }
        switch (type) {
            case "object":
                if (!$.isArray(typedClone[field])) {
                    clone[field] = deepClone(toClone[field], alternativeToCloneByField[field], alternativeToCloneByField);
                }
                else {
                    var array = toClone[field];
                    clone[field] = array.slice(0);
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
        srcTxt += functions[i].toString().replace(/^function/, "function " + functionNames[i]) + "\n";
    }
    injectScriptText(srcTxt, "window-" + Date.now());
}
function injectClasses() {
    var classes = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        classes[_i] = arguments[_i];
    }
    var srcTxt = "";
    for (var i = 0; i < classes.length; i++) {
        var txt = classes[i].toString();
        var className = (/function ([^\(]+)/i).exec(txt)[1];
        srcTxt += "var " + className + " = (function () {\n"
            + classes[i].toString()
            + "\nreturn " + className + ";"
            + "\n}());";
    }
    injectScriptText(srcTxt, "classes-" + Date.now());
}
function injectScriptText(srcTxt, sourceURL) {
    if (sourceURL) {
        srcTxt += "//# sourceURL=" + sourceURL;
        if (typeof (InstallTrigger) != "undefined") {
            srcTxt = "eval(`" + srcTxt + "`)";
        }
    }
    var script = document.createElement("script");
    script.type = 'text/javascript';
    script.text = srcTxt;
    document.body.appendChild(script);
}
function injectStyleText(styleTxt) {
    $("head").append("<style>" + styleTxt + "</style>");
}
function exportFile(content, filename) {
    var textToSaveAsBlob = new Blob([content], { type: "application/json" });
    var textToSaveAsURL = window.URL.createObjectURL(textToSaveAsBlob);
    var downloadLink = document.createElement("a");
    downloadLink.download = filename ? filename : "export.json";
    downloadLink.innerHTML = "Download File";
    downloadLink.href = textToSaveAsURL;
    downloadLink.onclick = function () {
        $(downloadLink).remove();
    };
    downloadLink.style.display = "none";
    document.body.appendChild(downloadLink);
    downloadLink.click();
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
var HTMLElementType;
(function (HTMLElementType) {
    HTMLElementType[HTMLElementType["SelectBox"] = 0] = "SelectBox";
    HTMLElementType[HTMLElementType["CheckBox"] = 1] = "CheckBox";
    HTMLElementType[HTMLElementType["NumberInput"] = 2] = "NumberInput";
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
    ;
    AsyncResult.prototype.result = function (result) {
        try {
            this.resultCallback.call(this.resultThisArg, result);
        }
        catch (e) {
            console.log(e);
        }
    };
    ;
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
    UserScriptStorage.prototype.loadScript = function (name) {
        injectScriptText(GM_getResourceText(name));
    };
    return UserScriptStorage;
}());
var LocalPersistence = new UserScriptStorage();

var SubscriptionDTO = (function () {
    function SubscriptionDTO(url) {
        var _this = this;
        this.filteringEnabled = false;
        this.restrictingEnabled = false;
        this.sortingEnabled = true;
        this.openAndMarkAsRead = true;
        this.markAsReadAboveBelow = false;
        this.markAsReadAboveBelowRead = true;
        this.hideWhenMarkAboveBelow = false;
        this.hideAfterRead = false;
        this.replaceHiddenWithGap = false;
        this.sortingType = SortingType.PopularityDesc;
        this.advancedControlsReceivedPeriod = new AdvancedControlsReceivedPeriod();
        this.pinHotToTop = false;
        this.additionalSortingTypes = [];
        this.filteringListsByType = {};
        this.keywordMatchingAreas = [KeywordMatchingArea.Title];
        this.alwaysUseDefaultMatchingAreas = true;
        this.keywordMatchingMethod = KeywordMatchingMethod.Simple;
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
    Subscription.prototype.isMarkAsReadAboveBelow = function () {
        return this.dto.markAsReadAboveBelow;
    };
    Subscription.prototype.isMarkAsReadAboveBelowRead = function () {
        return this.dto.markAsReadAboveBelowRead;
    };
    Subscription.prototype.isHideWhenMarkAboveBelow = function () {
        return this.dto.hideWhenMarkAboveBelow;
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
            LocalPersistence.init().then(function () {
                var t = _this;
                var onLoad = function (sub) {
                    t.defaultSubscription = sub;
                    p.done();
                };
                if (LocalPersistence.listKeys().indexOf(_this.getSubscriptionId(_this.GLOBAL_SETTINGS_SUBSCRIPTION_URL)) > -1) {
                    _this.loadSubscription(_this.GLOBAL_SETTINGS_SUBSCRIPTION_URL).then(onLoad, _this);
                }
                else {
                    var dto = new SubscriptionDTO(_this.GLOBAL_SETTINGS_SUBSCRIPTION_URL);
                    _this.save(dto);
                    onLoad.call(_this, new Subscription(_this, dto));
                }
            }, _this);
        }, this);
    };
    SubscriptionDAO.prototype.loadSubscription = function (url) {
        var _this = this;
        return new AsyncResult(function (p) {
            var sub = new Subscription(_this);
            _this.load(url).then(function (dto) {
                sub.dto = dto;
                p.result(sub);
            }, _this);
        }, this);
    };
    ;
    SubscriptionDAO.prototype.save = function (dto) {
        var url = dto.url;
        var id = this.getSubscriptionId(url);
        LocalPersistence.put(id, dto);
        console.log("Subscription saved: " + JSON.stringify(dto));
    };
    SubscriptionDAO.prototype.saveAll = function (subscriptions) {
        for (var url in subscriptions) {
            subscriptions[url].url = url;
            this.save(subscriptions[url]);
        }
        var globalSettings = subscriptions[this.GLOBAL_SETTINGS_SUBSCRIPTION_URL];
        if (globalSettings) {
            this.defaultSubscription = new Subscription(this, globalSettings);
        }
    };
    SubscriptionDAO.prototype.loadAll = function () {
        var _this = this;
        return new AsyncResult(function (p) {
            var ids = _this.getAllSubscriptionIds();
            LocalPersistence.getItemsAsync(ids).then(function (results) {
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
            LocalPersistence.getAsync(_this.getSubscriptionId(url), null).then(function (dto) {
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
                    dto = _this.defaultSubscription ? _this.defaultSubscription.dto : new SubscriptionDTO(url);
                    cloneURL = url;
                }
                dto = _this.clone(dto, cloneURL);
                p.result(dto);
            }, _this);
        }, this);
    };
    SubscriptionDAO.prototype.delete = function (url) {
        LocalPersistence.delete(this.getSubscriptionId(url));
        console.log("Deleted: " + url);
    };
    SubscriptionDAO.prototype.clone = function (dtoToClone, cloneUrl) {
        var clone = deepClone(dtoToClone, new SubscriptionDTO(cloneUrl), {
            "advancedControlsReceivedPeriod": new AdvancedControlsReceivedPeriod()
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
        return LocalPersistence.listKeys().filter(function (value) {
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
        LocalPersistence.put(id, linkedSub);
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
        this.urlPrefixPattern = new RegExp(ext.urlPrefixPattern, "i");
        this.dao = new SubscriptionDAO();
        this.uiManager = uiManager;
    }
    SettingsManager.prototype.init = function () {
        var _this = this;
        return new AsyncResult(function (p) {
            _this.dao.init().chain(p);
        }, this);
    };
    SettingsManager.prototype.loadSubscription = function (globalSettingsEnabled) {
        var _this = this;
        return new AsyncResult(function (p) {
            var onLoad = function (sub) {
                _this.currentSubscription = sub;
                p.result(sub);
            };
            if (globalSettingsEnabled) {
                onLoad.call(_this, _this.dao.getGlobalSettings());
            }
            else {
                _this.dao.loadSubscription(_this.getActualSubscriptionURL()).then(onLoad, _this);
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
        return document.URL.replace(this.urlPrefixPattern, "");
    };
    SettingsManager.prototype.isGlobalMode = function () {
        return this.dao.isURLGlobal(this.currentSubscription.getURL());
    };
    SettingsManager.prototype.getCurrentSubscription = function () {
        return this.currentSubscription;
    };
    return SettingsManager;
}());

var ArticleManager = (function () {
    function ArticleManager(subscriptionManager, keywordManager, page) {
        this.sortedArticlesCount = 0;
        this.lastReadArticleAge = -1;
        this.subscriptionManager = subscriptionManager;
        this.keywordManager = keywordManager;
        this.articleSorterFactory = new ArticleSorterFactory();
        this.page = page;
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
        this.checkLastAddedArticle();
    };
    ArticleManager.prototype.resetArticles = function () {
        this.sortedArticlesCount = 0;
        this.lastReadArticleAge = -1;
        this.lastReadArticleGroup = [];
        this.articlesToMarkAsRead = [];
    };
    ArticleManager.prototype.getCurrentSub = function () {
        return this.subscriptionManager.getCurrentSubscription();
    };
    ArticleManager.prototype.getCurrentUnreadCount = function () {
        return $(ext.articleSelector).length;
    };
    ArticleManager.prototype.addArticle = function (a, skipCheck) {
        var article = new Article(a);
        this.filterAndRestrict(article);
        this.advancedControls(article);
        if (!skipCheck) {
            article.checked();
            this.checkLastAddedArticle();
        }
        this.checkSortArticles();
    };
    ArticleManager.prototype.filterAndRestrict = function (article) {
        var sub = this.getCurrentSub();
        if (sub.isFilteringEnabled() || sub.isRestrictingEnabled()) {
            var hide = false;
            if (sub.isRestrictingEnabled()) {
                hide = this.keywordManager.matchKeywords(article, sub, FilteringType.RestrictedOn, true);
            }
            if (sub.isFilteringEnabled()) {
                hide = hide || this.keywordManager.matchKeywords(article, sub, FilteringType.FilteredOut);
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
                    if (advControls.keepUnread && (this.lastReadArticleAge == -1 ||
                        receivedAge >= this.lastReadArticleAge)) {
                        if (receivedAge != this.lastReadArticleAge) {
                            this.lastReadArticleGroup = [article];
                        }
                        else {
                            this.lastReadArticleGroup.push(article);
                        }
                        this.lastReadArticleAge = receivedAge;
                    }
                }
                else {
                    if (advControls.showIfHot && (article.isHot() ||
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
    };
    ArticleManager.prototype.checkSortArticles = function () {
        if (this.sortedArticlesCount != this.getCurrentUnreadCount()) {
            if (this.getCurrentSub().isSortingEnabled()) {
                var msg = "Sorting articles at " + new Date().toTimeString();
                if (this.sortedArticlesCount > 0) {
                    msg += " (Previous sorted count: " + this.sortedArticlesCount + ")";
                }
                console.log(msg);
            }
            this.sortArticles();
            this.sortedArticlesCount = this.getCurrentUnreadCount();
        }
    };
    ArticleManager.prototype.checkLastAddedArticle = function () {
        if ($(ext.uncheckedArticlesSelector).length == 0) {
            this.prepareMarkAsRead();
            this.page.showHiddingInfo();
        }
    };
    ArticleManager.prototype.sortArticles = function () {
        var sub = this.getCurrentSub();
        var visibleArticles = [], hiddenArticles = [];
        $(ext.articleSelector).toArray().map((function (a) {
            return new Article(a);
        })).forEach(function (a) {
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
            this.sortArticleArray(hotArticles);
            this.sortArticleArray(normalArticles);
            visibleArticles = hotArticles.concat(normalArticles);
        }
        else {
            this.sortArticleArray(visibleArticles);
        }
        if (sub.isSortingEnabled() || sub.isPinHotToTop()) {
            var articlesContainer = $(ext.articleSelector).first().parent();
            var endOfFeed = $(ext.endOfFeedSelector).detach();
            articlesContainer.empty();
            visibleArticles.forEach(function (article) {
                articlesContainer.append(article.get());
            });
            hiddenArticles.forEach(function (article) {
                articlesContainer.append(article.get());
            });
            if (endOfFeed) {
                articlesContainer.append(endOfFeed);
            }
            else {
                $(ext.endOfFeedSelector).detach().appendTo(articlesContainer);
            }
        }
        var sortedVisibleArticles = visibleArticles.map(function (a) { return a.getEntryId(); });
        this.page.put(ext.sortedVisibleArticlesId, sortedVisibleArticles);
    };
    ArticleManager.prototype.prepareMarkAsRead = function () {
        if (this.lastReadArticleGroup.length > 0) {
            var lastReadArticle;
            if (this.isOldestFirst()) {
                lastReadArticle = this.lastReadArticleGroup[this.lastReadArticleGroup.length - 1];
            }
            else {
                lastReadArticle = this.lastReadArticleGroup[0];
            }
            if (lastReadArticle != null) {
                this.page.put(ext.lastReadEntryId, lastReadArticle.getEntryId());
            }
        }
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
        var sortingTypes = [sub.getSortingType()].concat(sub.getAdditionalSortingTypes());
        articles.sort(this.articleSorterFactory.getSorter(sortingTypes));
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
        this.sorterByType[SortingType.SourceAsc] = sourceSorter(true);
        this.sorterByType[SortingType.SourceDesc] = sourceSorter(false);
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
                this.body = this.article.find(".summary").text().toLowerCase();
                this.author = this.article.find(".authors").text().replace("by", "").toLowerCase();
                var ageStr = this.article.find(ext.publishAgeSpanSelector).attr(ext.publishAgeTimestampAttr);
                var ageSplit = ageStr.split("--");
                var publishDate = ageSplit[0].replace(/[^:]*:/, "").trim();
                var receivedDate = ageSplit[1].replace(/[^:]*:/, "").trim();
                this.publishAge = Date.parse(publishDate);
                this.receivedAge = Date.parse(receivedDate);
            }
        }
        // Title
        this.title = this.article.attr(ext.articleTitleAttribute).trim().toLowerCase();
        // Popularity
        var popularityStr = this.article.find(ext.popularitySelector).text().trim();
        popularityStr = popularityStr.replace("+", "");
        if (popularityStr.indexOf("K") > -1) {
            popularityStr = popularityStr.replace("K", "");
            popularityStr += "000";
        }
        this.popularity = Number(popularityStr);
        // Source
        var source = this.article.find(ext.articleSourceSelector);
        if (source != null) {
            this.source = source.text();
        }
    }
    Article.prototype.get = function () {
        return this.article;
    };
    Article.prototype.getTitle = function () {
        return this.title;
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
    Article.prototype.getPublishAge = function () {
        return this.publishAge;
    };
    Article.prototype.isHot = function () {
        var span = this.article.find(ext.popularitySelector);
        return span.hasClass("hot") || span.hasClass("onfire");
    };
    Article.prototype.getEntryId = function () {
        return this.entryId;
    };
    Article.prototype.setVisible = function (visible) {
        if (visible != null && !visible) {
            this.article.css("display", "none");
            var articlesContainer = this.article.parent();
            this.article.detach().appendTo(articlesContainer);
        }
        else {
            this.article.css("display", "");
        }
    };
    Article.prototype.isVisible = function () {
        return !(this.article.css("display") === "none");
    };
    Article.prototype.checked = function () {
        this.article.attr(this.checkedAttr, "");
    };
    return Article;
}());

var KeywordManager = (function () {
    function KeywordManager() {
        this.separator = "#";
        this.areaPrefix = "#Area#";
        this.keywordSplitPattern = new RegExp(this.separator + "(.+)");
        this.matcherFactory = new KeywordMatcherFactory();
    }
    KeywordManager.prototype.insertArea = function (keyword, area) {
        return this.areaPrefix + KeywordMatchingArea[area] + this.separator + keyword;
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
                keyword = keyword.slice(this.areaPrefix.length);
                var split = keyword.split(this.keywordSplitPattern);
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

var templates = {
    "settingsHTML": "<div id='FFnS_settingsDivContainer'> <div id='FFnS_settingsDiv'> <img id='FFnS_CloseSettingsBtn' src='{{closeIconLink}}' class='pageAction requiresLogin'> <fieldset> <legend>General settings</legend> <div class='setting_group'> <span>Auto load all unread articles</span> <input id='FFnS_autoLoadAllArticles' type='checkbox'> </div> <div class='setting_group'> <span class='tooltip'>Always use global settings <span class='tooltiptext'>Use the same filtering and sorting settings for all subscriptions and categories. Uncheck to have specific settings for each subscription/category</span> </span> <input id='FFnS_globalSettingsEnabled' type='checkbox'> </div> </fieldset> <fieldset> <legend><span id='FFnS_settings_mode_title'></span></legend> <div class='setting_group'> <span class='tooltip'>Filtering enabled <span class='tooltiptext'>Hide the articles that contain at least one of the filtering keywords (not applied if empty)</span> </span> <input id='FFnS_FilteringEnabled' type='checkbox'> </div> <div class='setting_group'> <span class='tooltip'> Restricting enabled <span class='tooltiptext'>Show only articles that contain at least one of the restricting keywords (not applied if empty)</span> </span> <input id='FFnS_RestrictingEnabled' type='checkbox'> </div> <div class='setting_group'> <span>Sorting enabled</span> <input id='FFnS_SortingEnabled' type='checkbox' /> </div> {{SortingSelect}} <ul id='FFnS_tabs_menu'> <li class='current'> <a href='#FFnS_Tab_FilteredOut'>Filtering keywords</a> </li> <li> <a href='#FFnS_Tab_RestrictedOn'>Restricting keywords</a> </li> <li> <a href='#FFnS_Tab_KeywordControls'>Keyword controls</a> </li> </li> <li> <a href='#FFnS_Tab_UIControls'>UI controls</a> </li> <li> <a href='#FFnS_Tab_AdvancedControls'>Advanced controls</a> </li> <li> <a href='#FFnS_Tab_SettingsControls'>Settings controls</a> </li> </ul> <div id='FFnS_tabs_content'> {{FilteringList.Type.FilteredOut}} {{FilteringList.Type.RestrictedOn}} <div id='FFnS_Tab_KeywordControls' class='FFnS_Tab_Menu'> <p>The following settings are applied to the filtering and restricting</p> <fieldset> <legend>Matching area (domain)</legend> <div> <span>Search for keywords in the entry's: </span> {{DefaultKeywordMatchingArea}} <span> (Multiple values can be selected)</span> </div> <div> <span>Always use these matching areas</span> <input id='FFnS_AlwaysUseDefaultMatchingAreas' type='checkbox'> <span> (the area select boxes in the filtering and restring will be invisible when this option is checked)</span> </div> </fieldset> <fieldset> <legend>Matching method</legend> <span>The keywords are treated as : </span> <select id='FFnS_KeywordMatchingMethod' class='FFnS_input' size='3'> <option value='{{KeywordMatchingMethod.Simple}}' selected>Strings (simple match)</option> <option value='{{KeywordMatchingMethod.Word}}'>Words (whole word match)</option> <option value='{{KeywordMatchingMethod.RegExp}}'>Regular expressions (pattern match)</option> </select> </fieldset> </div> <div id='FFnS_Tab_UIControls' class='FFnS_Tab_Menu'> <div> <span>Add a button to open articles in a new window/tab and mark them as read</span> <input id='FFnS_OpenAndMarkAsRead' type='checkbox'> </div> <div> <span>Add buttons to mark articles above/below as</span> <select id='FFnS_MarkAsReadAboveBelowRead' class='FFnS_input'> <option value='true' selected>read</option> <option value='false'>unread</option> </select> <input id='FFnS_MarkAsReadAboveBelow' type='checkbox'> <span> (Also hide using the same buttons when marking as read</span> <input id='FFnS_HideWhenMarkAboveBelow' type='checkbox'> <span>)</span> </div> </div> <div id='FFnS_Tab_AdvancedControls' class='FFnS_Tab_Menu'> <fieldset> <legend>Recently received articles</legend> <div id='FFnS_MaxPeriod_Infos'> <span>Articles received (crawled) less than</span> <input id='FFnS_Hours_AdvancedControlsReceivedPeriod' class='FFnS_input' type='number' min='0' max='23'> <span>hours and</span> <input id='FFnS_Days_AdvancedControlsReceivedPeriod' class='FFnS_input' type='number' min='0'> <span>days</span> <span>ago should be:</span> </div> <div class='setting_group'> <span class='tooltip'>Kept unread if unread <span class='tooltiptext'>Only the articles that were not marked as read (manually or on scroll) will be kept unread</span> </span> <input id='FFnS_KeepUnread_AdvancedControlsReceivedPeriod' type='checkbox'> </div> <div class='setting_group'> <span>Hidden</span> <input id='FFnS_Hide_AdvancedControlsReceivedPeriod' type='checkbox'> </div> <div class='setting_group'> <span>Visible if hot or popularity superior to:</span> <input id='FFnS_MinPopularity_AdvancedControlsReceivedPeriod' class='FFnS_input' type='number' min='0' step='100'> <input id='FFnS_ShowIfHot_AdvancedControlsReceivedPeriod' type='checkbox'> <span class='tooltip'>Marked as read if hot or popular <span class='tooltiptext'>Mark as read the articles made visible if hot or with popularity superior to the defined value</span> </span> <input id='FFnS_MarkAsReadVisible_AdvancedControlsReceivedPeriod' type='checkbox'> </div> </fieldset> <fieldset> <legend>Additional sorting levels (applied when two entries have equal sorting)</legend> <span id='FFnS_AdditionalSortingTypes'></span> <span id='FFnS_AddSortingType'> <img src='{{plusIconLink}}' class='FFnS_icon' /> </span> <span id='FFnS_EraseSortingTypes'> <img src='{{eraseIconLink}}' class='FFnS_icon' /> </span> </fieldset> <fieldset> <legend>Misc</legend> <div class='setting_group'> <span>Group hot articles & pin to top</span> <input id='FFnS_PinHotToTop' type='checkbox'> </div> <div class='setting_group'> <span>Hide articles after reading them</span> <input id='FFnS_HideAfterRead' type='checkbox'> <span class='tooltip'>Replace with gap <span class='tooltiptext tooltip-top'>Replace the hidden article with a gap with same dimensions.</span> </span> <input id='FFnS_ReplaceHiddenWithGap' type='checkbox'> </div> </fieldset> </div> <div id='FFnS_Tab_SettingsControls' class='FFnS_Tab_Menu'> <fieldset> <legend>Import/export all settings from/to file</legend> <div class='setting_group'> <span>Import settings </span> <input id='FFnS_ImportSettings' type='file' /> </div> <button id='FFnS_ExportSettings'>Export settings</button> </fieldset> <fieldset> <legend>Subscription management</legend> <select id='FFnS_SettingsControls_SelectedSubscription' class='FFnS_input'> {{ImportMenu.SubscriptionOptions}} </select> <button id='FFnS_SettingsControls_ImportFromOtherSub'>Import settings from selected subscription</button> <button id='FFnS_SettingsControls_DeleteSub'>Delete selected subscription</button> <div id='FFnS_SettingsControls_LinkedSubContainer'> <span id='FFnS_SettingsControls_LinkedSub'></span> <button id='FFnS_SettingsControls_UnlinkFromSub'>Unlink</button> </div> <button id='FFnS_SettingsControls_LinkToSub'>Link current subscription to selected subscription</button> </fieldset> </div> </div> </fieldset> </div> </div>",
    "filteringListHTML": "<div id='{{FilteringTypeTabId}}' class='FFnS_Tab_Menu'> {{FilteringKeywordMatchingArea}} <input id='{{inputId}}' class='FFnS_input' size='10' type='text'> <span id='{{plusBtnId}}'> <img src='{{plusIconLink}}' class='FFnS_icon' /> </span> <span id='{{filetringKeywordsId}}'></span> <span id='{{eraseBtnId}}'> <img src='{{eraseIconLink}}' class='FFnS_icon' /> </span> </div>",
    "filteringKeywordHTML": "<button id='{{keywordId}}' type='button' class='FFnS_keyword'>{{keyword}}</button>",
    "sortingSelectHTML": "<select id='{{Id}}' class='FFnS_input FFnS_sortingSelect'> <option value='{{PopularityDesc}}'>Sort by popularity (highest to lowest)</option> <option value='{{PopularityAsc}}'>Sort by popularity (lowest to highest)</option> <option value='{{TitleAsc}}'>Sort by title (a -&gt; z)</option> <option value='{{TitleDesc}}'>Sort by title (z -&gt; a)</option> <option value='{{ReceivedDateNewFirst}}'>Sort by received date (new first)</option> <option value='{{ReceivedDateOldFirst}}'>Sort by received date (old first)</option> <option value='{{PublishDateNewFirst}}'>Sort by publish date (new first)</option> <option value='{{PublishDateOldFirst}}'>Sort by publish date (old first)</option> <option value='{{SourceAsc}}'>Sort by source title (a -&gt; z)</option> <option value='{{SourceDesc}}'>Sort by source title (z -&gt; a)</option> </select>",
    "keywordMatchingSelectHTML": "<select id='{{Id}}' class='FFnS_input FFnS_keywordMatchingSelect' {{attributes}}> {{defaultOption}} <option value='{{KeywordMatchingArea.Title}}' {{selectFirst}}>Title</option> <option value='{{KeywordMatchingArea.Body}}'>Body (summary)</option> <option value='{{KeywordMatchingArea.Author}}'>Author</option> </select>",
    "optionHTML": "<option value='{{value}}'>{{value}}</option>",
    "emptyOptionHTML": "<option value=''>{{value}}</option>",
    "styleCSS": "#FFnS_settingsDivContainer { display: none; background: rgba(0,0,0,0.9); width: 100%; height: 100%; z-index: 500; top: 0; left: 0; position: fixed; } #FFnS_settingsDiv { max-height: 500px; margin-top: 1%; margin-left: 15%; margin-right: 1%; border-radius: 25px; border: 2px solid #336699; background: #E0F5FF; padding: 2%; opacity: 1; } .FFnS_input { font-size:12px; } #FFnS_tabs_menu { height: 30px; clear: both; margin-top: 1%; margin-bottom: 0%; padding: 0px; text-align: center; } #FFnS_tabs_menu li { height: 30px; line-height: 30px; display: inline-block; border: 1px solid #d4d4d1; } #FFnS_tabs_menu li.current { background-color: #B9E0ED; } #FFnS_tabs_menu li a { padding: 10px; color: #2A687D; } #FFnS_tabs_content { padding: 1%; } .FFnS_Tab_Menu { display: none; width: 100%; max-height: 300px; overflow-y: auto; overflow-x: hidden; } .FFnS_icon { vertical-align: middle; height: 20px; width: 20px; cursor: pointer; } .FFnS_keyword { vertical-align: middle; background-color: #35A5E2; border-radius: 20px; color: #FFF; cursor: pointer; } .tooltip { position: relative; display: inline-block; border-bottom: 1px dotted black; } .tooltip .tooltiptext { visibility: hidden; width: 120px; background-color: black; color: #fff; text-align: center; padding: 5px; border-radius: 6px; position: absolute; z-index: 1; white-space: normal; } .tooltip-top { bottom: 100%; left: 50%; margin-left: -60px; } .tooltip:hover .tooltiptext { visibility: visible; } #FFnS_CloseSettingsBtn { float:right; width: 24px; height: 24px; } #FFnS_Tab_SettingsControls button, #FFnS_Tab_SettingsControls input { margin-top: 1%; font-size: 12px; vertical-align: inherit; } #FFnS_Tab_SettingsControls #FFnS_SettingsControls_UnlinkFromSub { display: inline; } #FFnS_MaxPeriod_Infos > input[type=number]{ width: 30px; margin-left: 1%; margin-right: 1%; } #FFnS_MinPopularity_AdvancedControlsReceivedPeriod, #FFnS_autoLoadBatchSize { width: 45px; } #FFnS_MaxPeriod_Infos { margin: 1% 0 2% 0; } .setting_group { display: inline-block; white-space: nowrap; margin-right: 2%; } fieldset { border-color: #333690; border-style: bold; } legend { color: #333690; font-weight: bold; } fieldset + fieldset, #FFnS_Tab_SettingsControls fieldset { margin-top: 1%; } fieldset select { margin-left: 1% } fieldset select.FFnS_keywordMatchingSelect { margin-left: 0%; margin-right: 1%; vertical-align: middle; } input { vertical-align: middle; } .ShowSettingsBtn { background-image: url('http://megaicons.net/static/img/icons_sizes/8/178/512/objects-empty-filter-icon.png'); background-size: 20px 20px; background-position: center center; background-repeat: no-repeat; color: #757575; background-color: transparent; font-weight: normal; min-width: 0; height: 40px; width: 40px; margin-right: 0px; } .ShowSettingsBtn:hover { color: #636363; background-color: rgba(0,0,0,0.05); } .fx header h1 .detail.FFnS_Hiding_Info::before { content: ''; } .fx .open-in-new-tab-button.mark-as-read, .fx .mark-as-read-above-below-button.mark-as-read { background-repeat: no-repeat; margin-right: 0px; } .fx .open-in-new-tab-button.mark-as-read, .fx .entry.u0 .open-in-new-tab-button.condensed-toolbar-icon { background-size: 32px 32px; } .fx .mark-as-read-above-below-button.mark-as-read, .fx .entry.u0 .mark-as-read-above-below-button.condensed-toolbar-icon, .fx .entry.u5 .mark-as-read-above-below-button { width: 24px; height: 24px; } .fx .open-in-new-tab-button.mark-as-read { background: url(http://s3.feedly.com/production/head/images/condensed-visit-black.png); } .fx .mark-above-as-read { background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAMAAADXqc3KAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAMAUExURQAAAAEBAQICAgMDAwQEBAUFBQYGBggICA8PDxERERMTExUVFRgYGBkZGRoaGhwcHB4eHh8fHyAgICYmJicnJygoKCoqKiwsLC4uLi8vLzAwMDExMTIyMjMzMzk5OTo6Oj09PT4+PkREREhISEtLS01NTU5OTlFRUVNTU1RUVFhYWF1dXV5eXl9fX2BgYGhoaGlpaWxsbHJycnh4eHp6enx8fAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFhUO7wAAAEAdFJOU////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////wBT9wclAAAACXBIWXMAABYlAAAWJQFJUiTwAAAAGHRFWHRTb2Z0d2FyZQBwYWludC5uZXQgNC4wLjb8jGPfAAAA1klEQVQoU3WQiVICQQwFGxBUPLgVROQQEBDFA/7/02KSyS6sVXQVyZvXNezWImfIxCx28JCJOvUUnNVlduOOKreejHFJh4s2fRnQsqg8cdBpYklHZ5eF1dJnZctvTG3EHDL0HQ/PeeEmhX/ilYtIRfFOfi6IA8wjFgU0Irn42UWuUomk8AnxIlew9+DwpsL/rwkjrxJIWcWvyAj00x1BNioeZRH3cvRU0W6tv+eoEio+tFTK0QR2v+biKxUZJr6tv0/nHH/itQo/nZAK2Po+IYlJz9cRkT+a78AFAEXS0AAAAABJRU5ErkJggg==); } .fx .mark-below-as-read { background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAMAAADXqc3KAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAMAUExURQAAAAEBAQICAgMDAwQEBAUFBQYGBgcHBwgICA8PDxERERUVFRoaGhwcHB4eHigoKCoqKiwsLC4uLjAwMDExMTIyMjMzMzk5OTo6Oj09PUhISElJSUtLS01NTVFRUVNTU1RUVFhYWF1dXV5eXl9fX2BgYGhoaGlpaWxsbG5ubnJycnR0dHV1dXh4eHp6ent7e3x8fAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACY/twoAAAEAdFJOU////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////wBT9wclAAAACXBIWXMAABYlAAAWJQFJUiTwAAAAGHRFWHRTb2Z0d2FyZQBwYWludC5uZXQgNC4wLjb8jGPfAAAAxElEQVQoU3WQhxKCMBBEF7D3gg27Inbl/3/uvLtkQNrOJLvZNxcKqEIVYFQO9q3yiaXDWwmYIua9CCbYixWAD189DxbompADAWo2ZcEJyTkDYmBjYxYAfZsUPCKb6/BsYuEC2BdpAx8NKuwY6H0DYK6VEchl8CaaA/zrUoGODMa0tXOJ+ORxd+A1I3qap7iBgpBLliuVI2M1vBRQQ8FVAH9K1EQogddN+p729OV4kCCAOnwSF92xVjcFcFb/kwGroVoqoh+q2r44+TStvAAAAABJRU5ErkJggg==); } .fx .entry.u5 .open-in-new-tab-button, .fx .entry.u5 .mark-as-read-above-below-button { filter: brightness(0) invert(1); } .fx .entry.u5 .open-in-new-tab-button { margin-right: 4px; margin-top: 4px; background-size: 32px 32px; width: 32px; height: 32px; } .ShowSettingsBtn:hover { color: #636363; background-color: rgba(0,0,0,0.05); } #FFnS_Tab_KeywordControls span { vertical-align: top; } #FFnS_Tab_KeywordControls div { margin-top: 2%; } .FFnS_sortingSelect { vertical-align: middle; } #FFnS_AddSortingType { margin-left: 1%; } .entry[gap-article] { visibility: hidden; } #FFnS_ImportSettings { width: 400px; } "
};

var FeedlyPage = (function () {
    function FeedlyPage() {
        this.hiddingInfoClass = "FFnS_Hiding_Info";
        this.put("ext", ext);
        injectToWindow(["getFFnS", "putFFnS", "getById", "getStreamPage"], this.get, this.put, this.getById, this.getStreamPage);
        injectClasses(EntryInfos);
        executeWindow("Feedly-Page-FFnS.js", this.initWindow, this.overrideLoadingEntries, this.overrideMarkAsRead, this.overrideSorting, this.onNewPage, this.onNewArticle);
    }
    FeedlyPage.prototype.update = function (sub) {
        this.updateCheck(sub.isOpenAndMarkAsRead(), ext.openAndMarkAsReadId, ext.openAndMarkAsReadClass);
        this.updateCheck(sub.isMarkAsReadAboveBelow(), ext.markAsReadAboveBelowId, ext.markAsReadAboveBelowClass);
        if (sub.getAdvancedControlsReceivedPeriod().keepUnread) {
            this.put(ext.keepNewArticlesUnreadId, true);
        }
        if (sub.isHideWhenMarkAboveBelow()) {
            this.put(ext.hideWhenMarkAboveBelowId, true);
        }
        if (sub.isHideAfterRead()) {
            this.put(ext.hideAfterReadId, true);
        }
        this.put(ext.markAsReadAboveBelowReadId, sub.isMarkAsReadAboveBelowRead());
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
    FeedlyPage.prototype.initWindow = function () {
        window["ext"] = getFFnS("ext");
        NodeCreationObserver.init("observed-page");
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
    FeedlyPage.prototype.onNewPage = function () {
        NodeCreationObserver.onCreation(ext.subscriptionChangeSelector, function () {
            var streamPage = getStreamPage();
            if (streamPage) {
                putFFnS(ext.isNewestFirstId, streamPage.stream._sort === "newest", true);
            }
        });
    };
    FeedlyPage.prototype.onNewArticle = function () {
        var reader = window["streets"].service('reader');
        var onClick = function (element, callback) {
            element.get(0).addEventListener('click', callback, true);
        };
        var getMarkAsReadAboveBelowCallback = function (entryId, above) {
            return function (event) {
                event.stopPropagation();
                var sortedVisibleArticles = getFFnS(ext.sortedVisibleArticlesId);
                if (!sortedVisibleArticles) {
                    sortedVisibleArticles = [];
                    $(ext.articleSelector).each(function (i, a) {
                        sortedVisibleArticles.push($(a).attr(ext.articleEntryIdAttribute));
                    });
                }
                var markAsRead = getFFnS(ext.markAsReadAboveBelowReadId);
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
            var addButton = function (id, attributes) {
                attributes.type = "button";
                attributes.style = getFFnS(id) ? "" : "display: none";
                attributes.class += " mark-as-read";
                if (a.hasClass("u0")) {
                    attributes.class += " condensed-toolbar-icon icon";
                }
                var e = $("<button>", attributes);
                if (cardsView) {
                    a.find(".mark-as-read").last().before(e);
                }
                else if (a.hasClass("u4")) {
                    attributes.style += "margin-right: 10px;";
                    a.find(".ago").after(e);
                }
                else {
                    $(element).prepend(e);
                }
                return e;
            };
            var markAsReadBelowElement = addButton(ext.markAsReadAboveBelowId, {
                class: ext.markAsReadAboveBelowClass + " mark-below-as-read",
                title: "Mark articles below" + (cardsView ? " and on the right" : "") + " as read/unread",
            });
            var markAsReadAboveElement = addButton(ext.markAsReadAboveBelowId, {
                class: ext.markAsReadAboveBelowClass + " mark-above-as-read",
                title: "Mark articles above" + (cardsView ? " and on the left" : "") + " as read/unread"
            });
            var openAndMarkAsReadElement = addButton(ext.openAndMarkAsReadId, {
                class: ext.openAndMarkAsReadClass,
                title: "Open in a new window/tab and mark as read"
            });
            var link = a.find(".title").attr("href");
            onClick(openAndMarkAsReadElement, function (event) {
                event.stopPropagation();
                window.open(link, '_blank');
                reader.askMarkEntryAsRead(entryId);
            });
            onClick(markAsReadBelowElement, getMarkAsReadAboveBelowCallback(entryId, false));
            onClick(markAsReadAboveElement, getMarkAsReadAboveBelowCallback(entryId, true));
        });
    };
    FeedlyPage.prototype.reset = function () {
        this.clearHiddingInfo();
        var i = sessionStorage.length;
        while (i--) {
            var key = sessionStorage.key(i);
            if (/^FFnS_/.test(key)) {
                sessionStorage.removeItem(key);
            }
        }
    };
    FeedlyPage.prototype.showHiddingInfo = function () {
        var hiddenCount = 0;
        $(ext.articleSelector).each(function (i, a) {
            if ($(a).css("display") === "none") {
                hiddenCount++;
            }
        });
        this.clearHiddingInfo();
        if (hiddenCount == 0) {
            return;
        }
        $(ext.hidingInfoSibling).after("<div class='detail " + this.hiddingInfoClass + "'> (" + hiddenCount + " hidden entries)</div>");
    };
    FeedlyPage.prototype.clearHiddingInfo = function () {
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
    FeedlyPage.prototype.overrideLoadingEntries = function () {
        var autoLoadingMessageId = "#FFnS_LoadingMessage";
        var navigo = window["streets"].service("navigo");
        var reader = window["streets"].service('reader');
        var autoLoadAllArticleBatchSize = 1000;
        var isAutoLoad = function () {
            return getStreamPage() != null &&
                ($(ext.articleSelector).length == 0 || $(ext.unreadArticlesSelector).length > 0)
                && $(ext.notFollowedPageSelector).length == 0
                && getFFnS(ext.autoLoadAllArticlesId, true);
        };
        var streamId = reader.listSubscriptions()[0].id;
        var stream = reader.lookupStream(streamId, { unreadOnly: true, featured: 0, sort: "newest", batchSize: 40 });
        var prototype = Object.getPrototypeOf(stream);
        var setBatchSize = prototype.setBatchSize;
        prototype.setBatchSize = function () {
            if (isAutoLoad()) {
                this._batchSize = autoLoadAllArticleBatchSize;
            }
            else {
                setBatchSize.apply(this, arguments);
            }
        };
        var navigoPrototype = Object.getPrototypeOf(navigo);
        var setEntries = navigoPrototype.setEntries;
        navigoPrototype.setEntries = function (entries) {
            if (entries.length > 0 && entries[0].jsonInfo.unread && isAutoLoad()) {
                var stream = getStreamPage().stream;
                var hasAllEntries = stream.state.hasAllEntries;
                if (!hasAllEntries && !stream.askingMoreEntries && !stream.state.isLoadingEntries) {
                    stream.askingMoreEntries = true;
                    setTimeout(function () {
                        if ($(".message.loading").length == 0) {
                            $(ext.articleSelector).first().parent()
                                .before("<div id='FFnS_LoadingMessage' class='message loading'>Auto loading all articles</div>");
                        }
                        if (stream._batchSize != autoLoadAllArticleBatchSize) {
                            stream.setBatchSize();
                        }
                        console.log("Fetching more articles (batch size: " + stream._batchSize + ") at: " + new Date().toTimeString());
                        stream.askMoreEntries();
                        stream.askingMoreEntries = false;
                    }, 100);
                }
                else if (hasAllEntries && $(autoLoadingMessageId).length == 1) {
                    $(autoLoadingMessageId).remove();
                    console.log("End auto load all articles at: " + new Date().toTimeString());
                }
            }
            return setEntries.apply(this, arguments);
        };
        NodeCreationObserver.onCreation(ext.loadingMessageSelector, function (e) {
            if ($(autoLoadingMessageId).length == 1) {
                $(e).hide();
            }
        });
    };
    FeedlyPage.prototype.overrideMarkAsRead = function () {
        var reader = window["streets"].service('reader');
        var navigo = window["streets"].service("navigo");
        var pagesPkg = window["devhd"].pkg("pages");
        var prototype = pagesPkg.ReactPage.prototype;
        var markAsRead = prototype.markAsRead;
        prototype.markAsRead = function (lastEntryObject) {
            if (getFFnS(ext.keepNewArticlesUnreadId) && !(lastEntryObject && lastEntryObject.asOf)) {
                console.log("Marking as read with keeping new articles unread");
                var idsToMarkAsRead = getFFnS(ext.articlesToMarkAsReadId);
                if (idsToMarkAsRead) {
                    console.log(idsToMarkAsRead.length + " new articles will be marked as read");
                    idsToMarkAsRead.forEach(function (id) {
                        reader.askMarkEntryAsRead(id);
                    });
                }
                var lastReadEntryId = getFFnS(ext.lastReadEntryId);
                console.log("The last read entry id: " + lastReadEntryId);
                if (lastReadEntryId) {
                    lastEntryObject = { lastReadEntryId: lastReadEntryId, partial: true };
                    reader.askMarkStreamAsRead(navigo.getMarkAsReadScope(), lastEntryObject, function () {
                        console.log("Marked page partially as read: " + JSON.stringify(lastEntryObject));
                    }, function (a, c) {
                        console.log(c);
                    });
                }
                navigo.getNextURI() ?
                    this.feedly.jumpToNext() :
                    this.feedly.loadDefaultPage();
            }
            else {
                markAsRead.call(this, lastEntryObject);
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
                if (entries[i].id !== sortedVisibleArticles[i] || !filterVisible(entries[i])) {
                    sorted = false;
                }
            }
            if (!sorted) {
                entries = [].concat(originalEntries);
                entries = entries.filter(filterVisible);
                entries.sort(function (a, b) {
                    return sortedVisibleArticles.indexOf(a.id) - sortedVisibleArticles.indexOf(b.id);
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
            return lookupNextEntry.call(this, this, getFFnS(ext.hideAfterReadId) ? true : a);
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
            return entries.forEach(function (b) {
                a.push(b.getId());
            }), a;
        };
    };
    return FeedlyPage;
}());

var UIManager = (function () {
    function UIManager() {
        this.containsReadArticles = false;
        this.keywordToId = {};
        this.idCount = 1;
        this.sortingSelectId = "SortingType";
        this.htmlSettingsElements = [
            {
                type: HTMLElementType.SelectBox, ids: [
                    this.sortingSelectId, "KeywordMatchingMethod", this.getKeywordMatchingSelectId(false)
                ]
            },
            {
                type: HTMLElementType.CheckBox,
                ids: ["FilteringEnabled", "RestrictingEnabled", "SortingEnabled", "PinHotToTop",
                    "KeepUnread_AdvancedControlsReceivedPeriod", "Hide_AdvancedControlsReceivedPeriod",
                    "ShowIfHot_AdvancedControlsReceivedPeriod", "MarkAsReadVisible_AdvancedControlsReceivedPeriod",
                    "OpenAndMarkAsRead", "MarkAsReadAboveBelow", "HideWhenMarkAboveBelow", "HideAfterRead",
                    "ReplaceHiddenWithGap", "AlwaysUseDefaultMatchingAreas"]
            },
            {
                type: HTMLElementType.NumberInput, ids: ["MinPopularity_AdvancedControlsReceivedPeriod"]
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
            _this.articleManager = new ArticleManager(_this.settingsManager, _this.keywordManager, _this.page);
            _this.htmlSubscriptionManager = new HTMLSubscriptionManager(_this);
            _this.settingsManager.init().then(function () {
                _this.autoLoadAllArticlesCB = new GlobalSettingsCheckBox(ext.autoLoadAllArticlesId, _this, false, true);
                _this.globalSettingsEnabledCB = new GlobalSettingsCheckBox("globalSettingsEnabled", _this);
                _this.autoLoadAllArticlesCB.init(true).then(function () {
                    _this.globalSettingsEnabledCB.init(true).then(function () {
                        _this.updateSubscription().then(function () {
                            _this.initUI();
                            _this.registerSettings();
                            _this.updateMenu();
                            _this.initSettingsCallbacks();
                            p.done();
                        }, _this);
                    }, _this);
                }, _this);
            }, _this);
        }, this);
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
            _this.settingsManager.loadSubscription(globalSettingsEnabled).then(function (sub) {
                _this.subscription = sub;
                p.done();
            }, _this);
        }, this);
    };
    UIManager.prototype.updateMenu = function () {
        var _this = this;
        this.htmlSubscriptionManager.update();
        this.refreshFilteringAndSorting();
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
        this.updateSettingsModeTitle();
    };
    UIManager.prototype.updateSettingsModeTitle = function () {
        var title = this.globalSettingsEnabledCB.getValue() ? "Global" : "Subscription";
        title += " settings";
        $id("FFnS_settings_mode_title").text(title);
    };
    UIManager.prototype.updateSettingsControls = function () {
        $id("FFnS_SettingsControls_SelectedSubscription").html(this.getImportOptionsHTML());
        var linkedSubContainer = $id("FFnS_SettingsControls_LinkedSubContainer");
        var linkedSub = $id("FFnS_SettingsControls_LinkedSub");
        if (((!this.globalSettingsEnabledCB.getValue()) && this.subscription.getURL() !== this.settingsManager.getActualSubscriptionURL()) ||
            (this.globalSettingsEnabledCB.getValue() && !this.settingsManager.isGlobalMode())) {
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
        this.autoLoadAllArticlesCB.initUI();
        this.globalSettingsEnabledCB.initUI();
    };
    UIManager.prototype.initSettingsMenu = function () {
        var marginElementClass = this.getHTMLId("margin_element");
        var tabsMenuId = this.getHTMLId("tabs_menu");
        var tabsContentContainerId = this.getHTMLId("tabs_content");
        var settingsHtml = bindMarkup(templates.settingsHTML, [
            { name: "SortingSelect", value: this.getSortingSelectHTML(this.getHTMLId(this.sortingSelectId)) },
            { name: "FilteringList.Type.FilteredOut", value: this.getFilteringListHTML(FilteringType.FilteredOut) },
            { name: "FilteringList.Type.RestrictedOn", value: this.getFilteringListHTML(FilteringType.RestrictedOn) },
            { name: "ImportMenu.SubscriptionOptions", value: this.getImportOptionsHTML() },
            { name: "closeIconLink", value: ext.closeIconLink },
            { name: "plusIconLink", value: ext.plusIconLink },
            { name: "eraseIconLink", value: ext.eraseIconLink },
            { name: "KeywordMatchingMethod.Simple", value: KeywordMatchingMethod.Simple },
            { name: "KeywordMatchingMethod.Word", value: KeywordMatchingMethod.Word },
            { name: "KeywordMatchingMethod.RegExp", value: KeywordMatchingMethod.RegExp },
            { name: "DefaultKeywordMatchingArea", value: this.getKeywordMatchingSelectHTML("multiple required", false) }
        ]);
        $("body").prepend(settingsHtml);
        // set up tabs
        $("#" + tabsMenuId + " a").click(function (event) {
            event.preventDefault();
            $(this).parent().addClass("current");
            $(this).parent().siblings().removeClass("current");
            var tab = $(this).attr("href");
            $("#" + tabsContentContainerId + " > div").not(tab).css("display", "none");
            $(tab).show();
        });
        $("#" + tabsContentContainerId + " > div").first().show();
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
            { name: "ReceivedDateNewFirst", value: SortingType.ReceivedDateNewFirst },
            { name: "ReceivedDateOldFirst", value: SortingType.ReceivedDateOldFirst },
            { name: "SourceAsc", value: SortingType.SourceAsc },
            { name: "SourceDesc", value: SortingType.SourceDesc }
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
            { name: "FilteringKeywordMatchingArea", value: this.getKeywordMatchingSelectHTML("", true, type) }
        ]);
        return filteringListHTML;
    };
    UIManager.prototype.getKeywordMatchingSelectHTML = function (attributes, includeDefaultOption, type) {
        var defaultOption = includeDefaultOption ? bindMarkup(templates.emptyOptionHTML, [
            { name: "value", value: "-- area (optional) --" },
        ]) : "";
        var filteringListHTML = bindMarkup(templates.keywordMatchingSelectHTML, [
            { name: "Id", value: this.getKeywordMatchingSelectId(true, type) },
            { name: "attributes", value: attributes },
            { name: "defaultOption", value: defaultOption },
            { name: "selectFirst", value: includeDefaultOption ? "" : "selected" },
            { name: "KeywordMatchingArea.Title", value: KeywordMatchingArea.Title },
            { name: "KeywordMatchingArea.Body", value: KeywordMatchingArea.Body },
            { name: "KeywordMatchingArea.Author", value: KeywordMatchingArea.Author },
        ]);
        return filteringListHTML;
    };
    UIManager.prototype.getKeywordMatchingSelectId = function (html, type) {
        var suffix = type == undefined ? "s" : "_" + FilteringType[type];
        var id = "KeywordMatchingArea" + suffix;
        return html ? this.getHTMLId(id) : id;
    };
    UIManager.prototype.getImportOptionsHTML = function () {
        var optionsHTML = "";
        var urls = this.settingsManager.getAllSubscriptionURLs();
        urls.forEach(function (url) {
            optionsHTML += bindMarkup(templates.optionHTML, [{ name: "value", value: url }]);
        });
        return optionsHTML;
    };
    UIManager.prototype.initShowSettingsBtns = function () {
        var this_ = this;
        NodeCreationObserver.onCreation(ext.settingsBtnPredecessorSelector, function (element) {
            var clone = $(element).clone();
            $(clone).empty().removeAttr('class').removeAttr('title').addClass("ShowSettingsBtn");
            $(element).after(clone);
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
        this.htmlSubscriptionManager.registerSettings(["Hours_AdvancedControlsReceivedPeriod", "Days_AdvancedControlsReceivedPeriod"], HTMLElementType.NumberInput, {
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
        this.htmlSubscriptionManager.registerSettings([ext.markAsReadAboveBelowReadId], HTMLElementType.SelectBox, {
            update: function (subscriptionSetting) {
                $id(subscriptionSetting.htmlId).val(subscriptionSetting.manager.subscription.isMarkAsReadAboveBelowRead() + "");
            },
            getHTMLValue: function (subscriptionSetting) {
                return $id(subscriptionSetting.htmlId).val() === "true";
            },
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
            _this.settingsManager.importAllSettings(importSettings.prop('files')[0]);
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
    UIManager.prototype.registerAdditionalSortingType = function () {
        var _this = this;
        var id = this.getHTMLId("AdditionalSortingType_" + (this.idCount++));
        $("#FFnS_AdditionalSortingTypes").append(this.getSortingSelectHTML(id));
        $id(id).change(function () { return _this.updateAdditionalSortingTypes(); });
        return id;
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
            var filteringKeywordHTML = bindMarkup(templates.filteringKeywordHTML, [
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
        $("#FFnS_AdditionalSortingTypes > select").each(function (i, e) { return additionalSortingTypes.push($(e).val()); });
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
                if ($(article).hasClass(ext.readArticleClass) && !$(article).hasClass("inlineFrame")) {
                    if (_this.subscription.isHideAfterRead()) {
                        if (_this.subscription.isReplaceHiddenWithGap()) {
                            $(article).attr('gap-article', "true");
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
            $(section).find("h2").text(" ");
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
        if (selectedURL && confirm("Import settings from the subscription url /" + selectedURL + " ?")) {
            this.settingsManager.importSubscription(selectedURL).then(this.refreshPage, this);
        }
    };
    UIManager.prototype.linkToSub = function () {
        var selectedURL = this.getSettingsControlsSelectedSubscription();
        if (selectedURL && confirm("Link current subscription to: /" + selectedURL + " ?")) {
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

var GlobalSettingsCheckBox = (function () {
    function GlobalSettingsCheckBox(id, uiManager, fullRefreshOnChange, sessionStore) {
        this.id = id;
        this.uiManager = uiManager;
        this.htmlId = uiManager.getHTMLId(id);
        this.fullRefreshOnChange = fullRefreshOnChange != null ? fullRefreshOnChange : true;
        this.sessionStoreEnabled = sessionStore != null ? sessionStore : false;
    }
    GlobalSettingsCheckBox.prototype.init = function (defaultValue) {
        var _this = this;
        this.isBoolean = typeof (defaultValue) === "boolean";
        return new AsyncResult(function (p) {
            LocalPersistence.getAsync(_this.id, defaultValue).then(function (value) {
                _this.setValue(value);
                p.done();
            }, _this);
        }, this);
    };
    GlobalSettingsCheckBox.prototype.getValue = function () {
        return this.value;
    };
    GlobalSettingsCheckBox.prototype.setValue = function (value) {
        this.value = value;
        this.sessionStore();
    };
    GlobalSettingsCheckBox.prototype.refreshValue = function (value) {
        this.setValue(value);
        this.save();
        this.refreshHTMLValue();
    };
    GlobalSettingsCheckBox.prototype.save = function () {
        LocalPersistence.put(this.id, this.value);
    };
    GlobalSettingsCheckBox.prototype.sessionStore = function () {
        if (this.sessionStoreEnabled) {
            this.uiManager.page.put(this.id, this.value, true);
        }
    };
    GlobalSettingsCheckBox.prototype.getHTMLValue = function (e) {
        if (this.isBoolean) {
            return isChecked(e);
        }
        else {
            return Number(e.val());
        }
    };
    GlobalSettingsCheckBox.prototype.refreshHTMLValue = function () {
        if (this.isBoolean) {
            setChecked(this.htmlId, this.value);
        }
        else {
            return $id(this.htmlId).val(this.value);
        }
    };
    GlobalSettingsCheckBox.prototype.initUI = function (callback, thisArg) {
        var this_ = this;
        var applyCallback = function () {
            if (callback) {
                callback.call(thisArg, this_.value);
            }
        };
        $id(this.htmlId).click(function () {
            var val = this_.getHTMLValue($(this));
            this_.setValue(val);
            this_.save();
            if (this_.fullRefreshOnChange) {
                this_.uiManager.refreshPage();
            }
            applyCallback();
        });
        this.refreshHTMLValue();
        applyCallback();
    };
    return GlobalSettingsCheckBox;
}());

var DEBUG = false;
function injectResources() {
    injectStyleText(templates.styleCSS);
    LocalPersistence.loadScript("jquery.min.js");
    LocalPersistence.loadScript("node-creation-observer.js");
}
$(document).ready(function () {
    injectResources();
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
});
