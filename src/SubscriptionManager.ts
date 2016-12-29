/// <reference path="./_references.d.ts" />

import { FilteringType, SortingType } from "./DataTypes";
import { Subscription } from "./Subscription";
import { SubscriptionDAO } from "./SubscriptionDAO";
import { AsyncResult } from "./AsyncResult";

export class SubscriptionManager {
    private currentSubscription: Subscription;
    private dao: SubscriptionDAO;
    private urlPrefixPattern = new RegExp(ext.urlPrefixPattern, "i");

    constructor() {
        this.dao = new SubscriptionDAO();
    }

    init(): AsyncResult<any> {
        return new AsyncResult<any>((p) => {
            this.dao.init().chain(p);
        }, this);
    }

    loadSubscription(globalSettingsEnabled: boolean): AsyncResult<any> {
        return new AsyncResult<any>((p) => {
            var onLoad = (sub: Subscription) => {
                this.currentSubscription = sub;
                p.result(sub);
            };
            if (globalSettingsEnabled) {
                onLoad.call(this, this.dao.getGlobalSettings());
            } else {
                this.dao.loadSubscription(this.getActualSubscriptionURL()).then(onLoad, this);
            }
        }, this);
    }

    linkToSubscription(url: string) {
        var currentURL = this.currentSubscription.getURL();
        if (url === currentURL) {
            alert("Linking to the same subscription URL is impossible");
        } else if (this.isGlobalMode()) {
            alert("Global settings can't be linked to any other subscription");
        } else {
            this.dao.linkSubscriptions(currentURL, url);
        }
    }

    deleteSubscription(url: string) {
        this.dao.delete(url);
    }

    importSettings(url: string): AsyncResult<any> {
        return new AsyncResult<any>((p) => {
            var currentURL = this.currentSubscription.getURL();
            this.dao.importSettings(url, currentURL).chain(p);
        }, this);
    }

    getAllSubscriptionURLs(): string[] {
        return this.dao.getAllSubscriptionURLs();
    }

    getActualSubscriptionURL(): string {
        return document.URL.replace(this.urlPrefixPattern, "");
    }

    isGlobalMode(): boolean {
        return this.dao.isURLGlobal(this.currentSubscription.getURL());
    }

    getCurrentSubscription() {
        return this.currentSubscription;
    }
}