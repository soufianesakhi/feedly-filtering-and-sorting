/// <reference path="./_references.d.ts" />

import { AsyncResult } from "./AsyncResult";
import { Subscription } from "./Subscription";
import { SubscriptionDAO } from "./SubscriptionDAO";
import { SubscriptionDTO } from "./SubscriptionDTO";
import { UIManager } from "./UIManager";
import { exportFile } from "./Utils";

export class SettingsManager {
    private currentSubscription: Subscription;
    private dao: SubscriptionDAO;
    private urlPrefixPattern = new RegExp(ext.urlPrefixPattern, "i");
    private uiManager: UIManager;
    private crossCheckDuplicatesSettings = new CrossCheckDuplicatesSettings();

    constructor(uiManager: UIManager) {
        this.dao = new SubscriptionDAO();
        this.uiManager = uiManager;
    }

    init(): AsyncResult<any> {
        return new AsyncResult<any>((p) => {
            this.dao.init().chain(p);
        }, this);
    }

    loadSubscription(globalSettingsEnabled: boolean, forceReloadGlobalSettings: boolean): AsyncResult<Subscription> {
        return new AsyncResult<Subscription>((p) => {
            var onLoad = (sub: Subscription) => {
                this.currentSubscription = sub;
                p.result(sub);
            };
            if (globalSettingsEnabled) {
                if (forceReloadGlobalSettings) {
                    this.dao.loadSubscription(null, true).then(onLoad, this);
                } else {
                    onLoad.call(this, this.dao.getGlobalSettings());
                }
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

    importAllSettings(file: File) {
        let fr = new FileReader();
        fr.onload = () => {
            try {
                let settingsExport: SettingsExport = JSON.parse(fr.result);
                this.uiManager.autoLoadAllArticlesCB.refreshValue(settingsExport.autoLoadAllArticles);
                this.uiManager.loadByBatchEnabledCB.refreshValue(settingsExport.loadByBatchEnabled);
                this.uiManager.batchSizeInput.refreshValue(settingsExport.batchSize);
                this.uiManager.globalSettingsEnabledCB.refreshValue(settingsExport.globalSettingsEnabled);
                this.dao.saveAll(settingsExport.subscriptions);
                this.uiManager.refreshPage();
                alert("The settings were successfully imported");
            } catch (e) {
                console.log(e);
                alert("The file is incorrectly formatted");
            }
        };
        fr.readAsText(file);
    }

    exportAllSettings() {
        this.dao.loadAll().then((subscriptions) => {
            let settingsExport: SettingsExport = {
                autoLoadAllArticles: this.uiManager.autoLoadAllArticlesCB.getValue(),
                loadByBatchEnabled: this.uiManager.loadByBatchEnabledCB.getValue(),
                batchSize: this.uiManager.batchSizeInput.getValue(),
                globalSettingsEnabled: this.uiManager.globalSettingsEnabledCB.getValue(),
                subscriptions: subscriptions
            }
            exportFile(JSON.stringify(settingsExport, null, 4), "feedly-filtering-and-sorting.json");
        }, this);
    }

    importSubscription(url: string): AsyncResult<any> {
        return new AsyncResult<any>((p) => {
            var currentURL = this.currentSubscription.getURL();
            this.dao.importSettings(url, currentURL).chain(p);
        }, this);
    }

    getAllSubscriptionURLs(): string[] {
        return this.dao.getAllSubscriptionURLs();
    }

    getActualSubscriptionURL(): string {
        return decodeURIComponent(document.URL.replace(this.urlPrefixPattern, ""));
    }

    isGlobalMode(): boolean {
        return this.dao.isURLGlobal(this.currentSubscription.getURL());
    }

    getCurrentSubscription() {
        return this.currentSubscription;
    }

    getCrossCheckDuplicatesSettings() {
        return this.crossCheckDuplicatesSettings;
    }
}

interface SettingsExport {
    autoLoadAllArticles: boolean;
    loadByBatchEnabled: boolean;
    batchSize: number;
    globalSettingsEnabled: boolean;
    subscriptions: { [key: string]: SubscriptionDTO; };
}

export class CrossCheckDuplicatesSettings {
    enabled: boolean;
    days: number;
    changeCallback: Function;

    setChangeCallback(fun: Function) {
        this.changeCallback = fun;
    }

    isEnabled(): boolean {
        return this.enabled;
    }

    setEnabled(enabled: boolean) {
        this.enabled = enabled;
        this.changeCallback();
    }

    getDays() {
        return this.days;
    }

    setDays(days: number) {
        this.days = days;
        this.changeCallback();
    }
}
