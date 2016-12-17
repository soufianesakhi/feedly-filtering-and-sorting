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
        if (url === this.getActualSubscriptionURL()) {
            alert("Linking to the same subscription URL is impossible");
        } else {
            this.dao.linkSubscriptions(this.getActualSubscriptionURL(), url);
        }
    }

    deleteSubscription(url: string) {
        this.dao.delete(url);
    }

    importSettings(url: string): AsyncResult<any> {
        return new AsyncResult<any>((p) => {
            this.dao.loadSubscription(url).then((sub) => {
                this.currentSubscription = sub;
                p.done();
            }, this);
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