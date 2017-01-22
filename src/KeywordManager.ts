
import { KeywordMatchingArea, KeywordMatchingMethod, FilteringType } from "./DataTypes";
import { Article } from "./ArticleManager";
import { Subscription } from "./Subscription";

export class KeywordManager {
    private matcherFactory: KeywordMatcherFactory;
    private separator = "#";
    private areaPrefix = "#Area#";
    private keywordSplitPattern = new RegExp(this.separator + "(.+)");

    constructor() {
        this.matcherFactory = new KeywordMatcherFactory();
    }

    insertArea(keyword: string, area: string) {
        return this.areaPrefix + KeywordMatchingArea[area] + this.separator + keyword
    }

    matchKeywords(article: Article, sub: Subscription, type: FilteringType, invert?: boolean): boolean {
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
    }
}

interface KeywordMatcher {
    match(a: Article, k: string): boolean;
}

class KeywordMatcherFactory {
    private matcherByType: { [key: number]: (a: Article, k: string, method: KeywordMatchingMethod) => boolean } = {};
    private comparerByMethod: { [key: number]: (a: string, b: string) => boolean } = {};

    constructor() {
        this.comparerByMethod[KeywordMatchingMethod.Simple] = (area: string, keyword: string) => {
            return area.indexOf(keyword.toLowerCase()) != -1;
        };
        this.comparerByMethod[KeywordMatchingMethod.RegExp] = (area: string, pattern: string) => {
            return new RegExp(pattern, "i").test(area);
        };
        this.comparerByMethod[KeywordMatchingMethod.Word] = (area: string, word: string) => {
            return new RegExp("\\b" + word + "\\b", "i").test(area);
        };

        this.matcherByType[KeywordMatchingArea.Title] = (a: Article, k: string, method: KeywordMatchingMethod) => {
            return this.comparerByMethod[method](a.title, k);
        };
        this.matcherByType[KeywordMatchingArea.Body] = (a: Article, k: string, method: KeywordMatchingMethod) => {
            return this.comparerByMethod[method](a.body, k);
        };
        this.matcherByType[KeywordMatchingArea.Author] = (a: Article, k: string, method: KeywordMatchingMethod) => {
            return this.comparerByMethod[method](a.author, k);
        };
    }

    getMatchers(sub: Subscription): KeywordMatcher[] {
        var method = sub.getKeywordMatchingMethod();
        return sub.getKeywordMatchingAreas().map(a => {
            return this.getMatcher(a, method);
        }, this);
    }

    getMatcher(area: KeywordMatchingArea, method: KeywordMatchingMethod): KeywordMatcher {
        var t = this;
        return {
            match(a: Article, k: string): boolean {
                return t.matcherByType[area](a, k, method);
            }
        }
    }

}
