/// <reference path="./_references.d.ts" />

import { AsyncResult } from "./AsyncResult";
import { DataStore } from "./dao/Storage";
import { UIManager } from "./UIManager";
import { $id, isChecked, setChecked } from "./Utils";

export class HTMLGlobalSettings<T extends boolean | number> {
  id: string;
  htmlId: string;
  uiManager: UIManager;
  defaultValue: T;
  value: T;
  isBoolean: boolean;
  fullRefreshOnChange: boolean;
  sessionStoreEnabled: boolean;
  private additionalChangeCallback: (newValue: T) => void;

  constructor(
    id: string,
    defaultValue: T,
    uiManager: UIManager,
    fullRefreshOnChange = false,
    sessionStore = true
  ) {
    this.id = id;
    this.defaultValue = defaultValue;
    this.isBoolean = typeof defaultValue === "boolean";
    this.uiManager = uiManager;
    this.htmlId = uiManager.getHTMLId(id);
    this.fullRefreshOnChange = fullRefreshOnChange;
    this.sessionStoreEnabled = sessionStore;
  }

  init(): AsyncResult<any> {
    return this.load();
  }

  load(): AsyncResult<any> {
    return new AsyncResult<any>(p => {
      DataStore.getAsync(this.id, this.defaultValue).then(value => {
        this.setValue(value);
        p.done();
      }, this);
    }, this);
  }

  reset(): AsyncResult<any> {
    return new AsyncResult<any>(p => {
      this.load().then(() => {
        this.refreshHTMLValue();
        p.done();
      }, this);
    }, this);
  }

  getValue(): T {
    return this.value;
  }

  private setValue(value: T) {
    this.value = value;
    this.sessionStore();
  }

  public refreshValue(value: T) {
    this.setValue(value);
    this.save();
    this.refreshHTMLValue();
  }

  public setAdditionalChangeCallback(
    additionalChangeCallback: (newValue: T) => void
  ) {
    this.additionalChangeCallback = additionalChangeCallback;
  }

  save() {
    DataStore.put(this.id, this.value);
  }

  sessionStore() {
    if (this.sessionStoreEnabled) {
      this.uiManager.page.put(this.id, this.value, true);
    }
  }

  getHTMLValue(e: JQuery): any {
    if (this.isBoolean) {
      return isChecked(e);
    } else {
      return Number(e.val());
    }
  }

  refreshHTMLValue() {
    if (this.isBoolean) {
      setChecked(this.htmlId, <boolean>this.value);
    } else {
      return $id(this.htmlId).val(<number>this.value);
    }
  }

  initUI() {
    var this_ = this;
    let additionalCallback = () => {
      if (this.additionalChangeCallback) {
        this.additionalChangeCallback.call(this, this_.value);
      }
    };
    function changeCallback() {
      let val = this_.getHTMLValue($(this));
      this_.setValue(val);
      this_.save();
      if (this_.fullRefreshOnChange) {
        this_.uiManager.refreshPage();
      }
      additionalCallback();
    }
    if (this.isBoolean) {
      $id(this.htmlId).click(changeCallback);
    } else {
      $id(this.htmlId)[0].oninput = changeCallback;
    }
    this.refreshHTMLValue();
    additionalCallback();
  }
}
