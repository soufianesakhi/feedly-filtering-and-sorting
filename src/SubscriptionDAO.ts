/// <reference path="./_references.d.ts" />

import { FilteringType, SortingType, getFilteringTypes, getFilteringTypeId } from "./DataTypes";
import { Subscription } from "./Subscription";
import { SubscriptionDTO, AdvancedControlsReceivedPeriod, ColoringRule } from "./SubscriptionDTO";
import { SettingsManager } from "./SettingsManager";
import { registerAccessors, deepClone } from "./Utils";
import { LocalStorage } from "./dao/LocalStorage";
import { AsyncResult } from "./AsyncResult";

declare var LocalPersistence: LocalStorage;

export class SubscriptionDAO {
    private SUBSCRIPTION_ID_PREFIX = "subscription_";
    private GLOBAL_SETTINGS_SUBSCRIPTION_URL = "---global settings---";
    private defaultSubscription: Subscription;

    constructor() {
        registerAccessors(new SubscriptionDTO(""), "dto", Subscription.prototype, this.save, this);
    }

    init(): AsyncResult<any> {
        return new AsyncResult<any>((p) => {
            LocalPersistence.init().then(() => {
                var t = this;
                var onLoad = function (sub: Subscription) {
                    t.defaultSubscription = sub;
                    p.done();
                };
                if (LocalPersistence.listKeys().indexOf(this.getSubscriptionId(this.GLOBAL_SETTINGS_SUBSCRIPTION_URL)) > -1) {
                    this.loadSubscription(this.GLOBAL_SETTINGS_SUBSCRIPTION_URL).then(onLoad, this);
                } else { // First time installing
                    var dto = new SubscriptionDTO(this.GLOBAL_SETTINGS_SUBSCRIPTION_URL);
                    this.save(dto);
                    onLoad.call(this, new Subscription(this, dto));
                }
            }, this);
        }, this);
    }

    loadSubscription(url: string): AsyncResult<Subscription> {
        return new AsyncResult<Subscription>((p) => {
            var sub = new Subscription(this);
            this.load(url).then((dto) => {
                sub.dto = dto;
                p.result(sub);
            }, this);
        }, this);
    };

    save(dto: SubscriptionDTO) {
        var url = dto.url;
        var id = this.getSubscriptionId(url);
        LocalPersistence.put(id, dto);
        console.log("Subscription saved: " + JSON.stringify(dto));
    }

    saveAll(subscriptions: { [key: string]: SubscriptionDTO; }) {
        for (var url in subscriptions) {
            subscriptions[url].url = url;
            this.save(subscriptions[url]);
        }
        let globalSettings = subscriptions[this.GLOBAL_SETTINGS_SUBSCRIPTION_URL];
        if (globalSettings) {
            // ensure initialization of new properties
            let defaultDTO = this.clone(globalSettings, globalSettings.url);
            this.defaultSubscription = new Subscription(this, defaultDTO);
        }
    }

    loadAll(): AsyncResult<{ [key: string]: SubscriptionDTO }> {
        return new AsyncResult<{ [key: string]: SubscriptionDTO }>((p) => {
            let ids = this.getAllSubscriptionIds();
            LocalPersistence.getItemsAsync<SubscriptionDTO>(ids).then((results) => {
                for (var key in results) {
                    var url = results[key].url;
                    if (!url) {
                        url = key.substring(this.SUBSCRIPTION_ID_PREFIX.length);
                    }
                    results[url] = results[key];
                    delete results[url].url;
                    delete results[key];
                }
                p.result(results);
            }, this);
        }, this);
    }

    load(url: string): AsyncResult<SubscriptionDTO> {
        return new AsyncResult<SubscriptionDTO>((p) => {
            LocalPersistence.getAsync(this.getSubscriptionId(url), null).then((dto) => {
                var cloneURL;
                if (dto) {
                    var linkedURL = (<LinkedSubscriptionDTO>dto).linkedUrl;
                    if (linkedURL != null) {
                        console.log("Loading linked subscription: " + linkedURL);
                        this.load(linkedURL).then((dto) => {
                            p.result(dto);
                        }, this);
                        return;
                    } else {
                        cloneURL = dto.url;
                        console.log("Loaded saved subscription: " + JSON.stringify(dto));
                    }
                } else {
                    dto = this.defaultSubscription ? this.defaultSubscription.dto : new SubscriptionDTO(url);
                    cloneURL = url;
                }
                dto = this.clone(dto, cloneURL);
                p.result(dto);
            }, this);
        }, this);
    }

    delete(url: string) {
        LocalPersistence.delete(this.getSubscriptionId(url));
        console.log("Deleted: " + url);
    }

    clone(dtoToClone: SubscriptionDTO, cloneUrl: string): SubscriptionDTO {
        var clone = deepClone(dtoToClone, new SubscriptionDTO(cloneUrl), {
            "advancedControlsReceivedPeriod": new AdvancedControlsReceivedPeriod(),
            "coloringRules": ColoringRule,
        });
        clone.url = cloneUrl;
        return clone;
    }

    importSettings(urlToImport: string, actualUrl: string): AsyncResult<any> {
        return new AsyncResult<any>((p) => {
            this.load(urlToImport).then((dto) => {
                dto.url = actualUrl;
                if (this.isURLGlobal(actualUrl)) {
                    this.defaultSubscription.dto = dto;
                }
                this.save(dto);
                p.done();
            }, this);
        }, this);
    }

    getGlobalSettings(): Subscription {
        return this.defaultSubscription;
    }

    getAllSubscriptionIds(): string[] {
        return LocalPersistence.listKeys().filter((value: string) => {
            return value.indexOf(this.SUBSCRIPTION_ID_PREFIX) == 0;
        });
    }

    getAllSubscriptionURLs(): string[] {
        return this.getAllSubscriptionIds().map<string>((value: string) => {
            return value.substring(this.SUBSCRIPTION_ID_PREFIX.length);
        });
    }

    getSubscriptionId(url: string): string {
        return this.SUBSCRIPTION_ID_PREFIX + url;
    }

    linkSubscriptions(url: string, linkedURL: string) {
        var id = this.getSubscriptionId(url);
        var linkedSub = new LinkedSubscriptionDTO(linkedURL);
        var t = this;
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