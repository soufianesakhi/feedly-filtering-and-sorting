/// <reference path="./_references.d.ts" />

import { FilteringType, SortingType, getFilteringTypes, getFilteringTypeId } from "./DataTypes";
import { Subscription } from "./Subscription";
import { SubscriptionDTO, AdvancedControlsReceivedPeriod } from "./SubscriptionDTO";
import { SubscriptionManager } from "./SubscriptionManager";
import { registerAccessors, deepClone } from "./Utils";
import { LocalStorage } from "./dao/LocalStorage";

declare var LocalPersistence: LocalStorage;

export class SubscriptionDAO {
    private SUBSCRIPTION_ID_PREFIX = "subscription_";
    private GLOBAL_SETTINGS_SUBSCRIPTION_URL = "---global settings---";
    private defaultSubscription: Subscription;

    constructor() {
        registerAccessors(new SubscriptionDTO(""), "dto", Subscription.prototype, this.save, this);
    }

    init(callback: () => void, thisArg) {
        this.loadSubscription(this.GLOBAL_SETTINGS_SUBSCRIPTION_URL, (sub) => {
            this.defaultSubscription = sub;
            callback.call(thisArg);
        }, this);
    }

    loadSubscription(url: string, callback: (sub: Subscription) => void, thisArg: any): void {
        var sub = new Subscription(this);
        this.load(url, (dto) => {
            sub.dto = dto;
            callback.call(thisArg, sub);
        }, this);
    };

    save(dto: SubscriptionDTO) {
        var url = dto.url;
        var id = this.getSubscriptionId(url);
        LocalPersistence.put(id, dto);
        console.log("Subscription saved: " + JSON.stringify(dto));
    }

    load(url: string, callback: (dto: SubscriptionDTO) => void, thisArg: any): void {
        LocalPersistence.getAsync(this.getSubscriptionId(url), null, (dto) => {
            var cloneURL;
            if (dto) {
                var linkedURL = (<LinkedSubscriptionDTO>dto).linkedUrl;
                if (linkedURL != null) {
                    console.log("Loading linked subscription: " + linkedURL);
                    this.load(linkedURL, callback, thisArg);
                    return;
                } else {
                    cloneURL = dto.url;
                    console.log("Loaded saved subscription: " + JSON.stringify(dto));
                }
            } else {
                dto = this.defaultSubscription.dto;
                cloneURL = url;
            }
            dto = this.clone(dto, cloneURL);
            callback.call(thisArg, dto);
        }, this);
    }

    delete(url: string) {
        LocalPersistence.delete(this.getSubscriptionId(url));
        console.log("Deleted: " + url);
    }

    clone(dtoToClone: SubscriptionDTO, cloneUrl: string): SubscriptionDTO {
        var clone = deepClone(dtoToClone, new SubscriptionDTO(cloneUrl), {
            "advancedControlsReceivedPeriod": new AdvancedControlsReceivedPeriod()
        });
        clone.url = cloneUrl;
        return clone;
    }

    loadGlobalSettings(callback: (Subscription) => void, thisArg: any): void {
        callback.call(thisArg, this.defaultSubscription);
    }

    getAllSubscriptionURLs(): string[] {
        var urls = GM_listValues().filter((value: string) => {
            return value.indexOf(this.SUBSCRIPTION_ID_PREFIX) == 0;
        });
        urls = urls.map<string>((value: string) => {
            return value.substring(this.SUBSCRIPTION_ID_PREFIX.length);
        });
        return urls;
    }

    getSubscriptionId(url: string): string {
        return this.SUBSCRIPTION_ID_PREFIX + url;
    }

    linkSubscriptions(url: string, linkedURL: string) {
        var id = this.getSubscriptionId(url);
        var linkedSub = new LinkedSubscriptionDTO(linkedURL);
        LocalPersistence.put(id, linkedSub);
        console.log("Subscription linked: " + JSON.stringify(linkedSub));
    }

    isURLGlobal(url: string): boolean {
        return url === this.GLOBAL_SETTINGS_SUBSCRIPTION_URL;
    }
}

class LinkedSubscriptionDTO {
    linkedUrl: string;
    constructor(linkedUrl: string) {
        this.linkedUrl = linkedUrl;
    }
}