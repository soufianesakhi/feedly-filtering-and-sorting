/// <reference path="./_references.d.ts" />

import { FilteringType, SortingType } from "./DataTypes";
import { Subscription } from "./Subscription";
import { SubscriptionDAO } from "./SubscriptionDAO";

export class SubscriptionManager {
    private currentSubscription: Subscription;
    private dao: SubscriptionDAO;
    private urlPrefixPattern = new RegExp(ext.urlPrefixPattern, "i");

    constructor() {
        this.dao = new SubscriptionDAO();
    }

    loadSubscription(globalSettingsEnabled: boolean, callback: (Subscription) => void, thisArg: any): void {
        var onLoad = (sub: Subscription) => {
            this.currentSubscription = sub;
            callback.call(thisArg, sub)
        };
        if (globalSettingsEnabled) {
            this.dao.loadGlobalSettings(onLoad, this);
        } else {
            this.dao.loadSubscription(this.getActualSubscriptionURL(), onLoad, this);
        }
    }

    linkToSubscription(url: string) {
        if (url === this.getActualSubscriptionURL()) {
            alert("Linking to the same subscription URL is impossible");
        } else {
            this.dao.linkSubscriptions(this.getActualSubscriptionURL(), url);
        }
    }

    deleteSubscription(url: string) {
        this.dao.delete(url);
    }

    importSettings(url: string, callback: () => void, thisArg: any) {
        this.dao.loadSubscription(url, (sub) => {
            this.currentSubscription = sub;
            callback.call(thisArg);
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