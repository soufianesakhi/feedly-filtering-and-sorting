var ext = {
    "plusIconLink": "https://cdn0.iconfinder.com/data/icons/social-messaging-ui-color-shapes/128/add-circle-blue-128.png",
    "eraseIconLink": "https://cdn2.iconfinder.com/data/icons/large-glossy-svg-icons/512/erase_delete_remove_wipe_out-128.png",
    "closeIconLink": "https://cdn2.iconfinder.com/data/icons/social-productivity-line-art-1/128/close-cancel-128.png",
    "urlPrefixPattern": "https?:\/\/[^\/]+\/i\/",
    "settingsBtnPredecessorSelector": ".button-refresh",
    "articleSelector": ".list-entries > .entry",
    "sectionSelector": "#timeline > .section",
    "publishAgeSpanSelector": ".ago",
    "publishAgeTimestampAttr": "title",
    "readArticleClass": "read",
    "articleSourceSelector": ".source",
    "subscriptionChangeSelector": "header .heading",
    "articleTitleAttribute": "data-title",
    "articleEntryIdAttribute": "data-entryid",
    "popularitySelector": ".engagement",
    "hidingInfoSibling": "header > h1 > .button-dropdown",
    "fullyLoadedArticlesSelector": ".giant-mark-as-read",
    "notFollowedPageSelector": "button.follow",
    "lastReadEntryId": "lastReadEntry",
    "keepNewArticlesUnreadId": "keepNewArticlesUnread",
    "articlesToMarkAsReadId": "articlesToMarkAsRead",
    "sortedVisibleArticlesId": "sortedVisibleArticles"
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
function isRadioChecked(input) {
    return input.is(':checked');
}
function setRadioChecked(htmlId, checked) {
    $id(htmlId).prop('checked', checked);
}
function registerAccessors(srcObject, srcFieldName, targetPrototype, setterCallback, setterCallbackThisArg, fieldObjectName) {
    for (var field in srcObject) {
        var type = typeof (srcObject[field]);
        if (type === "object") {
            if (!$.isArray(srcObject[field])) {
                registerAccessors(srcObject[field], srcFieldName, targetPrototype, setterCallback, setterCallbackThisArg, field);
            }
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
                    clone[field] = toClone[field].slice(0);
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

(function (SortingType) {
    SortingType[SortingType["PopularityDesc"] = 0] = "PopularityDesc";
    SortingType[SortingType["PopularityAsc"] = 1] = "PopularityAsc";
    SortingType[SortingType["TitleDesc"] = 2] = "TitleDesc";
    SortingType[SortingType["TitleAsc"] = 3] = "TitleAsc";
    SortingType[SortingType["PublishDateNewFirst"] = 4] = "PublishDateNewFirst";
    SortingType[SortingType["PublishDateOldFirst"] = 5] = "PublishDateOldFirst";
    SortingType[SortingType["SourceAsc"] = 6] = "SourceAsc";
    SortingType[SortingType["SourceDesc"] = 7] = "SourceDesc";
})(exported.SortingType || (exported.SortingType = {}));
var SortingType = exported.SortingType;
(function (FilteringType) {
    FilteringType[FilteringType["RestrictedOn"] = 0] = "RestrictedOn";
    FilteringType[FilteringType["FilteredOut"] = 1] = "FilteredOut";
})(exported.FilteringType || (exported.FilteringType = {}));
var FilteringType = exported.FilteringType;
(function (HTMLElementType) {
    HTMLElementType[HTMLElementType["SelectBox"] = 0] = "SelectBox";
    HTMLElementType[HTMLElementType["CheckBox"] = 1] = "CheckBox";
    HTMLElementType[HTMLElementType["NumberInput"] = 2] = "NumberInput";
})(exported.HTMLElementType || (exported.HTMLElementType = {}));
var HTMLElementType = exported.HTMLElementType;
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

var WebExtLocalStorage = (function () {
    function WebExtLocalStorage() {
        this.storage = browser.storage.local;
        this.keys = [];
        this.onError = function (e) {
            throw e;
        };
        this.onSave = function () {
            if (DEBUG) {
                console.log("Storage save success");
            }
        };
    }
    WebExtLocalStorage.prototype.getAsync = function (id, defaultValue) {
        var _this = this;
        return new AsyncResult(function (p) {
            _this.storage.get(id).then(function (result) {
                var data = result[0][id];
                if (data == null) {
                    data = defaultValue;
                }
                p.result(data);
            }, _this.onError);
        }, this);
    };
    WebExtLocalStorage.prototype.put = function (id, value, replace) {
        if (this.keys.indexOf(id) == -1) {
            this.keys.push(id);
        }
        var toStore = {};
        toStore[id] = value;
        this.storage.set(toStore).then(this.onSave, this.onError);
    };
    WebExtLocalStorage.prototype.delete = function (id) {
        var i = this.keys.indexOf(id);
        if (i > -1) {
            this.keys.splice(i, 1);
        }
        this.storage.remove(id).then(this.onSave, this.onError);
    };
    WebExtLocalStorage.prototype.listKeys = function () {
        return this.keys;
    };
    WebExtLocalStorage.prototype.init = function () {
        var _this = this;
        return new AsyncResult(function (p) {
            var t = _this;
            _this.storage.get(null).then(function (result) {
                t.keys = t.keys.concat(Object.keys(result[0]));
                console.log("Stored keys: " + t.keys);
                p.done();
            }, function (e) {
                throw e;
            });
        }, this);
    };
    return WebExtLocalStorage;
}());
var LocalPersistence = new WebExtLocalStorage();

var SubscriptionDTO = (function () {
    function SubscriptionDTO(url) {
        var _this = this;
        this.filteringEnabled = false;
        this.restrictingEnabled = false;
        this.sortingEnabled = true;
        this.openAndMarkAsRead = true;
        this.sortingType = SortingType.PopularityDesc;
        this.advancedControlsReceivedPeriod = new AdvancedControlsReceivedPeriod();
        this.pinHotToTop = false;
        this.additionalSortingTypes = [];
        this.filteringListsByType = {};
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
    Subscription.prototype.getAdvancedControlsReceivedPeriod = function () {
        return this.dto.advancedControlsReceivedPeriod;
    };
    Subscription.prototype.getSortingType = function () {
        return this.dto.sortingType;
    };
    Subscription.prototype.getFilteringList = function (type) {
        return this.dto.filteringListsByType[type];
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
        this.getFilteringList(type).push(keyword);
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
    SubscriptionDAO.prototype.getGlobalSettings = function () {
        return this.defaultSubscription;
    };
    SubscriptionDAO.prototype.getAllSubscriptionURLs = function () {
        var _this = this;
        var urls = LocalPersistence.listKeys().filter(function (value) {
            return value.indexOf(_this.SUBSCRIPTION_ID_PREFIX) == 0;
        });
        urls = urls.map(function (value) {
            return value.substring(_this.SUBSCRIPTION_ID_PREFIX.length);
        });
        return urls;
    };
    SubscriptionDAO.prototype.getSubscriptionId = function (url) {
        return this.SUBSCRIPTION_ID_PREFIX + url;
    };
    SubscriptionDAO.prototype.linkSubscriptions = function (url, linkedURL) {
        var id = this.getSubscriptionId(url);
        var linkedSub = new LinkedSubscriptionDTO(linkedURL);
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

var SubscriptionManager = (function () {
    function SubscriptionManager() {
        this.urlPrefixPattern = new RegExp(ext.urlPrefixPattern, "i");
        this.dao = new SubscriptionDAO();
    }
    SubscriptionManager.prototype.init = function () {
        var _this = this;
        return new AsyncResult(function (p) {
            _this.dao.init().chain(p);
        }, this);
    };
    SubscriptionManager.prototype.loadSubscription = function (globalSettingsEnabled) {
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
    SubscriptionManager.prototype.linkToSubscription = function (url) {
        if (url === this.getActualSubscriptionURL()) {
            alert("Linking to the same subscription URL is impossible");
        }
        else {
            this.dao.linkSubscriptions(this.getActualSubscriptionURL(), url);
        }
    };
    SubscriptionManager.prototype.deleteSubscription = function (url) {
        this.dao.delete(url);
    };
    SubscriptionManager.prototype.importSettings = function (url) {
        var _this = this;
        return new AsyncResult(function (p) {
            _this.dao.loadSubscription(url).then(function (sub) {
                _this.currentSubscription = sub;
                p.done();
            }, _this);
        }, this);
    };
    SubscriptionManager.prototype.getAllSubscriptionURLs = function () {
        return this.dao.getAllSubscriptionURLs();
    };
    SubscriptionManager.prototype.getActualSubscriptionURL = function () {
        return document.URL.replace(this.urlPrefixPattern, "");
    };
    SubscriptionManager.prototype.isGlobalMode = function () {
        return this.dao.isURLGlobal(this.currentSubscription.getURL());
    };
    SubscriptionManager.prototype.getCurrentSubscription = function () {
        return this.currentSubscription;
    };
    return SubscriptionManager;
}());

var ArticleManager = (function () {
    function ArticleManager(subscriptionManager, page) {
        this.articlesCount = 0;
        this.lastReadArticleAge = -1;
        this.subscriptionManager = subscriptionManager;
        this.articleSorterFactory = new ArticleSorterFactory();
        this.page = page;
    }
    ArticleManager.prototype.refreshArticles = function () {
        this.resetArticles();
        $(ext.articleSelector).toArray().forEach(this.addArticle, this);
    };
    ArticleManager.prototype.resetArticles = function () {
        this.articlesCount = 0;
        this.lastReadArticleAge = -1;
        this.lastReadArticleGroup = [];
        this.articlesToMarkAsRead = [];
        this.page.reset();
    };
    ArticleManager.prototype.getCurrentSub = function () {
        return this.subscriptionManager.getCurrentSubscription();
    };
    ArticleManager.prototype.getCurrentUnreadCount = function () {
        return $(ext.articleSelector).length;
    };
    ArticleManager.prototype.addArticle = function (a) {
        this.articlesCount++;
        var article = new Article(a);
        this.filterAndRestrict(article);
        this.advancedControls(article);
        this.checkLastAddedArticle();
    };
    ArticleManager.prototype.filterAndRestrict = function (article) {
        var sub = this.getCurrentSub();
        var title = article.getTitle();
        if (sub.isFilteringEnabled() || sub.isRestrictingEnabled()) {
            var restrictedOnKeywords = sub.getFilteringList(FilteringType.RestrictedOn);
            var filteredOutKeywords = sub.getFilteringList(FilteringType.FilteredOut);
            var hide = false;
            var restrictedCount = restrictedOnKeywords.length;
            if (sub.isRestrictingEnabled() && restrictedCount > 0) {
                hide = true;
                for (var i = 0; i < restrictedCount && hide; i++) {
                    if (title.indexOf(restrictedOnKeywords[i].toLowerCase()) != -1) {
                        hide = false;
                    }
                }
            }
            if (sub.isFilteringEnabled()) {
                for (var i = 0; i < filteredOutKeywords.length && !hide; i++) {
                    if (title.indexOf(filteredOutKeywords[i].toLowerCase()) != -1) {
                        hide = true;
                    }
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
                var publishAge = article.getPublishAge();
                if (publishAge <= threshold) {
                    if (advControls.keepUnread && (this.lastReadArticleAge == -1 ||
                        publishAge >= this.lastReadArticleAge)) {
                        if (publishAge != this.lastReadArticleAge) {
                            this.lastReadArticleGroup = [article];
                        }
                        else {
                            this.lastReadArticleGroup.push(article);
                        }
                        this.lastReadArticleAge = publishAge;
                    }
                }
                else {
                    if (advControls.hide) {
                        if (advControls.showIfHot && (article.isHot()
                            || article.getPopularity() >= advControls.minPopularity)) {
                            if (advControls.keepUnread && advControls.markAsReadVisible) {
                                this.articlesToMarkAsRead.push(article);
                            }
                        }
                        else {
                            article.setVisible(false);
                        }
                    }
                }
            }
            catch (err) {
                console.log(err);
            }
        }
    };
    ArticleManager.prototype.checkLastAddedArticle = function () {
        var sub = this.getCurrentSub();
        if (this.articlesCount == this.getCurrentUnreadCount()) {
            this.prepareMarkAsRead();
            this.sortArticles();
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
            articlesContainer.empty();
            visibleArticles.forEach(function (article) {
                articlesContainer.append(article.get());
            });
            hiddenArticles.forEach(function (article) {
                articlesContainer.append(article.get());
            });
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
        if (this.getCurrentSub().getAdvancedControlsReceivedPeriod().keepUnread) {
            this.page.put(ext.keepNewArticlesUnreadId, true);
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
        try {
            var firstPublishAge = new Article($(ext.articleSelector).first().get(0)).getPublishAge();
            var lastPublishAge = new Article($(ext.articleSelector).last().get(0)).getPublishAge();
            return firstPublishAge < lastPublishAge;
        }
        catch (err) {
            console.log(err);
            return false;
        }
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
var Article = (function () {
    function Article(article) {
        this.article = $(article);
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
        // Publish age
        var ageStr = this.article.find(ext.publishAgeSpanSelector).attr(ext.publishAgeTimestampAttr);
        if (ageStr != null) {
            var publishDate = ageStr.split("--")[1].replace(/[^:]*:/, "").trim();
            this.publishAge = Date.parse(publishDate);
        }
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
    Article.prototype.getPublishAge = function () {
        return this.publishAge;
    };
    Article.prototype.isHot = function () {
        var span = this.article.find(ext.popularitySelector);
        return span.hasClass("hot") || span.hasClass("onfire");
    };
    Article.prototype.getEntryId = function () {
        return this.article.attr(ext.articleEntryIdAttribute);
    };
    Article.prototype.setVisible = function (visibile) {
        this.article.css("display", visibile == null ? "" : (visibile ? "" : "none"));
    };
    Article.prototype.isVisible = function () {
        return !(this.article.css("display") === "none");
    };
    return Article;
}());

var templates = {
    "settingsHTML": "<div id='FFnS_settingsDivContainer'> <div id='FFnS_settingsDiv'> <img id='FFnS_CloseSettingsBtn' src='{{closeIconLink}}' class='pageAction requiresLogin'> <fieldset> <legend>General settings</legend> <span class='setting_group'> <span class='tooltip'> Auto load all unread articles <span class='tooltiptext'>Not applied if there are no unread articles</span> </span> <input id='FFnS_autoLoadAllArticles' type='checkbox'> </span> <span class='setting_group'> <span class='tooltip'> Always use global settings <span class='tooltiptext'>Use the same filtering and sorting settings for all subscriptions and categories. Uncheck to have specific settings for each subscription/category</span> </span> <input id='FFnS_globalSettingsEnabled' type='checkbox'> </span> </fieldset> <fieldset> <legend><span id='FFnS_subscription_title'></span></legend> <span class='setting_group'> <span class='tooltip'> Filtering enabled <span class='tooltiptext'>Hide the articles that contain at least one of the filtering keywords (not applied if empty)</span> </span> <input id='FFnS_FilteringEnabled' type='checkbox'> </span> <span class='setting_group'> <span class='tooltip'> Restricting enabled <span class='tooltiptext'>Show only articles that contain at least one of the restricting keywords (not applied if empty)</span> </span> <input id='FFnS_RestrictingEnabled' type='checkbox'> </span> <span class='setting_group'> <span>Sorting enabled</span> <input id='FFnS_SortingEnabled' type='checkbox' /> {{SortingSelect}} </span> <ul id='FFnS_tabs_menu'> <li class='current'> <a href='#FFnS_Tab_FilteredOut'>Filtering keywords</a> </li> <li> <a href='#FFnS_Tab_RestrictedOn'>Restricting keywords</a> </li> <li> <a href='#FFnS_Tab_UIControls'>UI controls</a> </li> <li> <a href='#FFnS_Tab_AdvancedControls'>Advanced controls</a> </li> <li> <a href='#FFnS_Tab_SettingsControls'>Settings controls</a> </li> </ul> <div id='FFnS_tabs_content'> {{FilteringList.Type.FilteredOut}} {{FilteringList.Type.RestrictedOn}} <div id='FFnS_Tab_UIControls' class='FFnS_Tab_Menu'> <span>Add a button to open articles in a new window/tab and mark them as read</span> <input id='FFnS_OpenAndMarkAsRead' type='checkbox'> </div> <div id='FFnS_Tab_AdvancedControls' class='FFnS_Tab_Menu'> <fieldset> <legend>Recently published articles</legend> <div id='FFnS_MaxPeriod_Infos'> <span>Articles published less than</span> <input id='FFnS_Hours_AdvancedControlsReceivedPeriod' class='FFnS_input' type='number' min='0' max='23'> <span>hours and</span> <input id='FFnS_Days_AdvancedControlsReceivedPeriod' class='FFnS_input' type='number' min='0'> <span>days</span> <span>ago should be:</span> </div> <span class='setting_group'> <span>Kept unread</span> <input id='FFnS_KeepUnread_AdvancedControlsReceivedPeriod' type='checkbox'> </span> <span class='setting_group'> <span>Hidden</span> <input id='FFnS_Hide_AdvancedControlsReceivedPeriod' type='checkbox'> </span> <span class='setting_group'> <span>Visible if hot or popularity superior to:</span> <input id='FFnS_MinPopularity_AdvancedControlsReceivedPeriod' class='FFnS_input' type='number' min='0' step='100'> <input id='FFnS_ShowIfHot_AdvancedControlsReceivedPeriod' type='checkbox'> </span> <span class='setting_group'> <span>Marked as read if visible:</span> <input id='FFnS_MarkAsReadVisible_AdvancedControlsReceivedPeriod' type='checkbox'> </span> </fieldset> <fieldset> <legend>Hot articles</legend> <span class='setting_group'> <span>Group hot articles & pin to top</span> <input id='FFnS_PinHotToTop' type='checkbox'> </span> </fieldset> <fieldset> <legend>Additional sorting levels (applied when two entries have equal sorting)</legend> <span id='FFnS_AdditionalSortingTypes'></span> <span id='FFnS_AddSortingType'> <img src='{{plusIconLink}}' class='FFnS_icon' /> </span> <span id='FFnS_EraseSortingTypes'> <img src='{{eraseIconLink}}' class='FFnS_icon' /> </span> </fieldset> </div> <div id='FFnS_Tab_SettingsControls' class='FFnS_Tab_Menu'> <span>Selected subscription:</span> <select id='FFnS_SettingsControls_SelectedSubscription' class='FFnS_input'> {{ImportMenu.SubscriptionOptions}} </select> <button id='FFnS_SettingsControls_ImportFromOtherSub'>Import settings from selected subscription</button> <button id='FFnS_SettingsControls_DeleteSub'>Delete selected subscription</button> <fieldset> <legend>Linking</legend> <div id='FFnS_SettingsControls_LinkedSubContainer'> <span id='FFnS_SettingsControls_LinkedSub'></span> <button id='FFnS_SettingsControls_UnlinkFromSub'>Unlink</button> </div> <button id='FFnS_SettingsControls_LinkToSub'>Link current subscription to selected subscription</button> </fieldset> </div> </div> </fieldset> </div> </div>",
    "filteringListHTML": "<div id='{{FilteringTypeTabId}}' class='FFnS_Tab_Menu'> <input id='{{inputId}}' class='FFnS_input' size='10' type='text'> <span id='{{plusBtnId}}'> <img src='{{plusIconLink}}' class='FFnS_icon' /> </span> <span id='{{filetringKeywordsId}}'></span> <span id='{{eraseBtnId}}'> <img src='{{eraseIconLink}}' class='FFnS_icon' /> </span> </div>",
    "filteringKeywordHTML": "<button id='{{keywordId}}' type='button' class='FFnS_keyword'>{{keyword}}</button>",
    "sortingSelectHTML": "<select id='{{Id}}' class='FFnS_input'> <option value='{{PopularityDesc}}'>Sort by popularity (highest to lowest)</option> <option value='{{PopularityAsc}} '>Sort by popularity (lowest to highest)</option> <option value='{{TitleAsc}}'>Sort by title (a -&gt; z)</option> <option value='{{TitleDesc}}'>Sort by title (z -&gt; a)</option> <option value='{{PublishDateNewFirst}}'>Sort by publish date (new first)</option> <option value='{{PublishDateOldFirst}}'>Sort by publish date (old first)</option> <option value='{{SourceAsc}}'>Sort by source title (a -&gt; z)</option> <option value='{{SourceDesc}}'>Sort by source title (z -&gt; a)</option> </select>",
    "optionHTML": "<option value='{{value}}'>{{value}}</option>",
    "styleCSS": "#FFnS_settingsDivContainer { display: none; background: rgba(0,0,0,0.9); width: 100%; height: 100%; z-index: 500; top: 0; left: 0; position: fixed; } #FFnS_settingsDiv { max-height: 500px; margin-top: 1%; margin-left: 15%; margin-right: 1%; border-radius: 25px; border: 2px solid #336699; background: #E0F5FF; padding: 2%; opacity: 1; } .FFnS_input { font-size:12px; } #FFnS_tabs_menu { height: 30px; clear: both; margin-top: 1%; margin-bottom: 0%; padding: 0px; text-align: center; } #FFnS_tabs_menu li { height: 30px; line-height: 30px; display: inline-block; border: 1px solid #d4d4d1; } #FFnS_tabs_menu li.current { background-color: #B9E0ED; } #FFnS_tabs_menu li a { padding: 10px; color: #2A687D; } #FFnS_tabs_content { padding: 1%; } .FFnS_Tab_Menu { display: none; width: 100%; max-height: 300px; overflow-y: auto; overflow-x: hidden; } .FFnS_icon { vertical-align: middle; height: 20px; width: 20px; cursor: pointer; } .FFnS_keyword { vertical-align: middle; background-color: #35A5E2; border-radius: 20px; color: #FFF; cursor: pointer; } .tooltip { position: relative; display: inline-block; border-bottom: 1px dotted black; } .tooltip .tooltiptext { visibility: hidden; width: 120px; background-color: black; color: #fff; text-align: center; padding: 5px; border-radius: 6px; position: absolute; z-index: 1; white-space: normal; } .tooltip:hover .tooltiptext { visibility: visible; } #FFnS_CloseSettingsBtn { float:right; width: 24px; height: 24px; } #FFnS_Tab_SettingsControls button { margin-top: 1%; font-size: 12px; display: block; } #FFnS_Tab_SettingsControls #FFnS_SettingsControls_UnlinkFromSub { display: inline; } #FFnS_MaxPeriod_Infos > input[type=number]{ width: 30px; margin-left: 1%; margin-right: 1%; } #FFnS_MinPopularity_AdvancedControlsReceivedPeriod { width: 45px; } #FFnS_MaxPeriod_Infos { margin: 1% 0 2% 0; } .setting_group { white-space: nowrap; margin-right: 2%; } fieldset { border-color: #333690; border-style: sold; } legend { color: #333690; font-weight: bold; } fieldset + fieldset, #FFnS_Tab_SettingsControls fieldset { margin-top: 1%; } fieldset select { margin-left: 2% } input { vertical-align: middle; } .ShowSettingsBtn { background-image: url('http://megaicons.net/static/img/icons_sizes/8/178/512/objects-empty-filter-icon.png'); background-size: 20px 20px; background-position: center center; background-repeat: no-repeat; color: #757575; background-color: transparent; font-weight: normal; min-width: 0; height: 40px; width: 40px; margin-right: 0px; } .ShowSettingsBtn:hover { color: #636363; background-color: rgba(0,0,0,0.05); } .header + div > div:first-child > div h4 { display: none; } .fx header h1 .detail.FFnS_Hiding_Info::before { content: ''; } .fx .mark-as-read.open-in-new-tab-button { background:url(http://s3.feedly.com/production/head/images/condensed-visit-black.png); background-size: 32px 32px; background-repeat: no-repeat; margin-right: 0px; } .fx .entry.u5 .mark-as-read.open-in-new-tab-button { filter: brightness(0) invert(1); margin-right: 4px; margin-top: 4px; } .fx .entry.u0 .mark-as-read.open-in-new-tab-button { background-size: 28px 28px; }"
};

var FeedlyPage = (function () {
    function FeedlyPage(subscriptionManager) {
        this.eval = window["eval"];
        this.hiddingInfoClass = "FFnS_Hiding_Info";
        this.subscriptionManager = subscriptionManager;
        this.eval("(" + this.overrideMarkAsRead.toString() + ")();");
        this.eval("(" + this.overrideNavigation.toString() + ")();");
        this.eval("window.ext = (" + JSON.stringify(ext).replace(/\s+/g, ' ') + ");");
        this.reader = new FeedlyReader(this);
        this.initStyling();
    }
    FeedlyPage.prototype.onNewArticle = function (a) {
        if (!this.subscriptionManager.getCurrentSubscription().isOpenAndMarkAsRead()) {
            return;
        }
        var reader = this.reader;
        var link = $(a).find(".title").attr("href");
        var entryId = $(a).attr(ext.articleEntryIdAttribute);
        var attributes = {
            class: "open-in-new-tab-button mark-as-read",
            title: "Open in a new window/tab and mark as read",
            type: "button"
        };
        if ($(a).hasClass("u0")) {
            attributes.class += " tertiary button-icon-only-micro icon";
        }
        var e = $("<button>", attributes);
        this.onClick(e.get(0), function (event) {
            window.open(link, '_blank');
            reader.askMarkEntryAsRead(entryId);
            event.stopPropagation();
        });
        if ($(a).hasClass("u5")) {
            $(a).find(".mark-as-read").before(e);
        }
        else if ($(a).hasClass("u4")) {
            $(a).find(".ago").after(e);
        }
        else {
            $(a).find(".condensed-tools .button-dropdown > :first-child").before(e);
        }
    };
    FeedlyPage.prototype.onClick = function (e, listener) {
        e.addEventListener('click', listener, true);
    };
    FeedlyPage.prototype.initStyling = function () {
        NodeCreationObserver.onCreation("header > h1", function (e) {
            $(e).removeClass("col-md-4").addClass("col-md-6");
        });
    };
    FeedlyPage.prototype.reset = function () {
        this.clearHiddingInfo();
        this.eval("window.FFnS = ({});");
    };
    FeedlyPage.prototype.showHiddingInfo = function () {
        var hiddenCount = 0;
        $(ext.articleSelector).each(function (i, a) {
            if ($(a).css("display") === "none") {
                hiddenCount++;
            }
        });
        if (hiddenCount == 0) {
            return;
        }
        this.clearHiddingInfo();
        $(ext.hidingInfoSibling).after("<div class='detail " + this.hiddingInfoClass + "'> (" + hiddenCount + " hidden entries)</div>");
    };
    FeedlyPage.prototype.clearHiddingInfo = function () {
        $("." + this.hiddingInfoClass).remove();
    };
    FeedlyPage.prototype.put = function (id, value) {
        this.eval("window.FFnS['" + id + "'] = " + JSON.stringify(value) + ";");
    };
    FeedlyPage.prototype.overrideMarkAsRead = function () {
        var pagesPkg = window["devhd"].pkg("pages");
        function get(id) {
            return window["FFnS"][id];
        }
        function markEntryAsRead(id, thisArg) {
            pagesPkg.BasePage.prototype.buryEntry.call(thisArg, id);
        }
        function getLastReadEntry(oldLastEntryObject, thisArg) {
            if ((oldLastEntryObject != null && oldLastEntryObject.asOf != null) || get(ext.keepNewArticlesUnreadId) == null) {
                return oldLastEntryObject;
            }
            var idsToMarkAsRead = get(ext.articlesToMarkAsReadId);
            if (idsToMarkAsRead != null) {
                idsToMarkAsRead.forEach(function (id) {
                    markEntryAsRead(id, thisArg);
                });
            }
            var lastReadEntryId = get(ext.lastReadEntryId);
            if (lastReadEntryId == null) {
                return null;
            }
            return { lastReadEntryId: lastReadEntryId };
        }
        var feedlyListPagePrototype = pagesPkg.ReactPage.prototype;
        var oldMarkAllAsRead = feedlyListPagePrototype.markAsRead;
        feedlyListPagePrototype.markAsRead = function (oldLastEntryObject) {
            var lastEntryObject = getLastReadEntry(oldLastEntryObject, this);
            if (!get(ext.keepNewArticlesUnreadId) || lastEntryObject) {
                oldMarkAllAsRead.call(this, lastEntryObject);
            }
            this.feedly.jumpToNext();
        };
    };
    FeedlyPage.prototype.overrideNavigation = function () {
        function get(id) {
            return document.getElementById(id + "_main");
        }
        function isRead(id) {
            return $(get(id)).hasClass(ext.readArticleClass);
        }
        function removed(id) {
            return get(id) == null;
        }
        function getSortedVisibleArticles() {
            return window["FFnS"][ext.sortedVisibleArticlesId];
        }
        function lookupEntry(unreadOnly, isPrevious) {
            var selectedEntryId = this.navigo.selectedEntryId;
            var found = false;
            this.getSelectedEntryId() || (found = true);
            var sortedVisibleArticles = getSortedVisibleArticles();
            var len = sortedVisibleArticles.length;
            for (var c = 0; c < len; c++) {
                var index = isPrevious ? len - 1 - c : c;
                var entry = sortedVisibleArticles[index];
                if (found) {
                    if (removed(entry)) {
                        continue;
                    }
                    if (unreadOnly) {
                        if (!isRead(entry))
                            return entry;
                        continue;
                    }
                    return entry;
                }
                entry === this.getSelectedEntryId() && (found = true);
            }
            return null;
        }
        var prototype = window["devhd"].pkg("pages").ReactPage.prototype;
        var onEntry = function (unreadOnly, b, isPrevious) {
            var entryId = lookupEntry.call(this, unreadOnly, isPrevious);
            entryId
                ? b ? (this.uninlineEntry(), this.selectEntry(entryId, 'toview'), this.shouldMarkAsReadOnNP() && this.reader.askMarkEntryAsRead(entryId))
                    : this.inlineEntry(entryId, !0)
                : this.signs.setMessage(isPrevious ? 'At start' : 'At end');
        };
        prototype.onPreviousEntry = function (unreadOnly, b) {
            onEntry.call(this, unreadOnly, b, true);
        };
        prototype.onNextEntry = function (unreadOnly, b) {
            onEntry.call(this, unreadOnly, b, false);
        };
    };
    return FeedlyPage;
}());
var FeedlyReader = (function () {
    function FeedlyReader(page) {
        this.eval = page.eval;
    }
    FeedlyReader.prototype.askMarkEntryAsRead = function (entryId) {
        this.eval("window.streets.service('reader').askMarkEntryAsRead('" + entryId + "');");
    };
    return FeedlyReader;
}());

var UIManager = (function () {
    function UIManager() {
        this.containsReadArticles = false;
        this.keywordToId = {};
        this.idCount = 1;
        this.sortingSelectId = "SortingType";
        this.htmlSettingsElements = [
            {
                type: HTMLElementType.SelectBox, ids: [this.sortingSelectId]
            },
            {
                type: HTMLElementType.CheckBox,
                ids: ["FilteringEnabled", "RestrictingEnabled", "SortingEnabled", "PinHotToTop",
                    "KeepUnread_AdvancedControlsReceivedPeriod", "Hide_AdvancedControlsReceivedPeriod",
                    "ShowIfHot_AdvancedControlsReceivedPeriod", "MarkAsReadVisible_AdvancedControlsReceivedPeriod",
                    "OpenAndMarkAsRead"]
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
            _this.subscriptionManager = new SubscriptionManager();
            _this.page = new FeedlyPage(_this.subscriptionManager);
            _this.articleManager = new ArticleManager(_this.subscriptionManager, _this.page);
            _this.htmlSubscriptionManager = new HTMLSubscriptionManager(_this);
            _this.subscriptionManager.init().then(function () {
                _this.autoLoadAllArticlesCB = new GlobalSettingsCheckBox("autoLoadAllArticles", _this, false);
                _this.globalSettingsEnabledCB = new GlobalSettingsCheckBox("globalSettingsEnabled", _this);
                _this.updateSubscription().then(function () {
                    _this.initUI();
                    _this.registerSettings();
                    _this.updateMenu();
                    _this.initSettingsCallbacks();
                    p.done();
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
        this.articleManager.refreshArticles();
    };
    UIManager.prototype.updateSubscription = function () {
        var _this = this;
        return new AsyncResult(function (p) {
            var globalSettingsEnabled = _this.globalSettingsEnabledCB.isEnabled();
            _this.subscriptionManager.loadSubscription(globalSettingsEnabled).then(function (sub) {
                _this.subscription = sub;
                _this.updateSubscriptionTitle(globalSettingsEnabled);
                p.done();
            }, _this);
        }, this);
    };
    UIManager.prototype.updateMenu = function () {
        var _this = this;
        this.htmlSubscriptionManager.update();
        getFilteringTypes().forEach(function (type) {
            _this.updateFilteringList(type);
        });
        this.updateSettingsControls();
        // Additional sorting types
        $("#FFnS_AdditionalSortingTypes").empty();
        this.subscription.getAdditionalSortingTypes().forEach(function (s) {
            var id = _this.registerAdditionalSortingType();
            $id(id).val(s);
        });
    };
    UIManager.prototype.updateSubscriptionTitle = function (globalSettingsEnabled) {
        var title = globalSettingsEnabled ? "Global" : "Subscription";
        title += " settings";
        $id("FFnS_subscription_title").text(title);
    };
    UIManager.prototype.updateSettingsControls = function () {
        $id("FFnS_SettingsControls_SelectedSubscription").html(this.getImportOptionsHTML());
        var linkedSubContainer = $id("FFnS_SettingsControls_LinkedSubContainer");
        var linkedSub = $id("FFnS_SettingsControls_LinkedSub");
        if (((!this.globalSettingsEnabledCB.isEnabled()) && this.subscription.getURL() !== this.subscriptionManager.getActualSubscriptionURL()) ||
            (this.globalSettingsEnabledCB.isEnabled() && !this.subscriptionManager.isGlobalMode())) {
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
            { name: "eraseIconLink", value: ext.eraseIconLink }
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
            { name: "filetringKeywordsId", value: ids.filetringKeywordsId }
        ]);
        return filteringListHTML;
    };
    UIManager.prototype.getImportOptionsHTML = function () {
        var optionsHTML = "";
        var urls = this.subscriptionManager.getAllSubscriptionURLs();
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
    };
    UIManager.prototype.initSettingsCallbacks = function () {
        var _this = this;
        var this_ = this;
        this.htmlSubscriptionManager.setUpCallbacks();
        $id(this.closeBtnId).click(function () {
            $id(this_.settingsDivContainerId).toggle();
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
        this.refreshFilteringAndSorting();
        this.setUpKeywordButtonsEvents(type);
    };
    UIManager.prototype.updateAdditionalSortingTypes = function () {
        var additionalSortingTypes = $("#FFnS_AdditionalSortingTypes > select").map(function (i, e) { return $(e).val(); }).toArray();
        this.subscription.setAdditionalSortingTypes(additionalSortingTypes);
        this.refreshFilteringAndSorting();
    };
    UIManager.prototype.addArticle = function (article) {
        try {
            this.checkReadArticles(article);
            if (this.containsReadArticles) {
                return;
            }
            this.articleManager.addArticle(article);
            this.page.onNewArticle(article);
            this.tryAutoLoadAllArticles();
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
                window.scrollTo(0, 0);
            }
        }
    };
    UIManager.prototype.tryAutoLoadAllArticles = function () {
        if (!this.autoLoadAllArticlesCB.isEnabled() || $(ext.notFollowedPageSelector).length > 0) {
            return;
        }
        if (this.isVisible($(ext.fullyLoadedArticlesSelector))) {
            window.scrollTo(0, 0);
            return;
        }
        var currentScrollHeight = document.body.scrollHeight;
        window.scrollTo(0, currentScrollHeight);
    };
    UIManager.prototype.importFromOtherSub = function () {
        var selectedURL = this.getSettingsControlsSelectedSubscription();
        if (selectedURL && confirm("Import settings from the subscription url /" + selectedURL + " ?")) {
            this.subscriptionManager.importSettings(selectedURL).then(this.refreshPage, this);
        }
    };
    UIManager.prototype.linkToSub = function () {
        var selectedURL = this.getSettingsControlsSelectedSubscription();
        if (selectedURL && confirm("Link current subscription to: /" + selectedURL + " ?")) {
            this.subscriptionManager.linkToSubscription(selectedURL);
            this.refreshPage();
        }
    };
    UIManager.prototype.unlinkFromSub = function () {
        if (confirm("Unlink current subscription ?")) {
            this.subscriptionManager.deleteSubscription(this.subscriptionManager.getActualSubscriptionURL());
            this.refreshPage();
        }
    };
    UIManager.prototype.deleteSub = function () {
        var selectedURL = this.getSettingsControlsSelectedSubscription();
        if (selectedURL && confirm("Delete : /" + selectedURL + " ?")) {
            this.subscriptionManager.deleteSubscription(selectedURL);
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
    UIManager.prototype.isVisible = function (e) {
        var displayProp = e.css('display');
        return displayProp != null && displayProp != 'none';
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
                return isRadioChecked($id(subscriptionSetting.htmlId));
            },
            update: function (subscriptionSetting) {
                var value = _this.manager.subscription["is" + subscriptionSetting.id]();
                setRadioChecked(subscriptionSetting.htmlId, value);
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
            setting.manager.subscription["set" + setting.id](setting.config.getHTMLValue(setting));
            setting.manager.refreshFilteringAndSorting();
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
    function GlobalSettingsCheckBox(id, uiManager, fullRefreshOnChange) {
        var _this = this;
        this.fullRefreshOnChange = true;
        this.id = id;
        this.uiManager = uiManager;
        this.htmlId = uiManager.getHTMLId(id);
        LocalPersistence.getAsync(this.id, true).then(function (enabled) {
            _this.enabled = enabled;
            setRadioChecked(_this.htmlId, _this.enabled);
        }, this);
    }
    GlobalSettingsCheckBox.prototype.isEnabled = function () {
        return this.enabled;
    };
    GlobalSettingsCheckBox.prototype.setEnabled = function (enabled) {
        LocalPersistence.put(this.id, enabled);
        this.enabled = enabled;
        this.refreshUI();
    };
    GlobalSettingsCheckBox.prototype.initUI = function () {
        var this_ = this;
        $id(this.htmlId).click(function () {
            this_.setEnabled(isRadioChecked($(this)));
            this_.uiManager.refreshPage();
        });
        this.refreshUI();
    };
    GlobalSettingsCheckBox.prototype.refreshUI = function () {
        setRadioChecked(this.htmlId, this.enabled);
    };
    return GlobalSettingsCheckBox;
}());

var DEBUG = true;
function injectResources() {
    $("head").append("<style>" + templates.styleCSS + "</style>");
    var head = document.getElementsByTagName("head")[0];
    var script = document.createElement("script");
    script.src = "//code.jquery.com/jquery.min.js";
    head.appendChild(script);
}
$(document).ready(function () {
    var uiManager = new UIManager();
    var uiManagerBind = callbackBindedTo(uiManager);
    injectResources();
    NodeCreationObserver.onCreation(ext.subscriptionChangeSelector, function () {
        console.log("Feedly page fully loaded");
        uiManager.init().then(function () {
            NodeCreationObserver.onCreation(ext.articleSelector, uiManagerBind(uiManager.addArticle));
            NodeCreationObserver.onCreation(ext.sectionSelector, uiManagerBind(uiManager.addSection));
            NodeCreationObserver.onCreation(ext.subscriptionChangeSelector, uiManagerBind(uiManager.updatePage));
        }, this);
    }, true);
});
