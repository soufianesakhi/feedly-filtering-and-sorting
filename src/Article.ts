import { debugLog } from "./Utils";

export class EntryInfos {
  body: string;
  author: string;
  engagement: number;
  published: number;
  received: number;
  constructor(jsonInfos) {
    var bodyInfos = jsonInfos.content ? jsonInfos.content : jsonInfos.summary;
    this.body = bodyInfos ? bodyInfos.content : "";
    this.author = jsonInfos.author;
    this.engagement = jsonInfos.engagement;
    this.published = jsonInfos.published;
    this.received = jsonInfos.crawled;
  }
}

export interface SortableArticle {
  getEntryId(): string;
  getPublishDate(): Date;
  getPublishAge(): number;
  getReceivedAge(): number;
  getPopularity(): number;
  getTitle(): string;
  getSource(): string;
  isHot(): boolean;
  isGap(): boolean;
  isVisible(): boolean;
}

export class Article implements SortableArticle {
  private container: JQuery;
  private entryId: string;
  articleIdElement: JQuery;
  title: string;
  body: string;
  author: string;
  private source: string;
  private receivedAge: number;
  private publishAge: number;
  private popularity: number;
  private url: string;
  private entryInfos: EntryInfos;

  constructor(articleContainer: HTMLElement) {
    this.container = $(articleContainer);
    this.articleIdElement = this.container;
    if (!this.container.is(ext.articleIdFromFrameSelector)) {
      this.articleIdElement = this.container.find(
        ext.articleIdFromFrameSelector
      );
    }
    this.entryId = this.articleIdElement.attr("id").replace(/_main$/, "");
    (window["onClickCapture"] || (() => {}))(this.container, () => {
      window["currentArticleId"] = this.entryId;
    });

    var infosElement = this.container.find("." + ext.entryInfosJsonClass);
    if (infosElement.length > 0) {
      this.entryInfos = JSON.parse(infosElement.text());
    }
    if (this.entryInfos) {
      this.body = this.entryInfos.body;
      this.body = this.body ? this.body.toLowerCase() : "";
      this.author = this.entryInfos.author;
      this.author = this.author ? this.author.toLowerCase() : "";
      this.receivedAge = this.entryInfos.received;
      this.publishAge = this.entryInfos.published;
    } else {
      let isInlineView = this.container.find(ext.inlineViewClass).length > 0;
      this.body = this.container
        .find(isInlineView ? ".content" : ".EntrySummary")
        .text()
        .toLowerCase();
      this.author = this.container
        .find(".authors")
        .text()
        .replace("by", "")
        .trim()
        .toLowerCase();
      var ageStr = this.container
        .find(ext.publishAgeSpanSelector)
        .attr(ext.publishAgeTimestampAttr);
      var ageSplit = ageStr.split("\n");
      var publishDate = ageSplit[0].replace(/[^:]*:/, "").trim();
      var receivedDate = ageSplit[1].replace(/[^:]*:/, "").trim();
      this.publishAge = Date.parse(publishDate);
      this.receivedAge = Date.parse(receivedDate);
    }

    // Title
    this.title = this.container
      .find(ext.articleTitleSelector)
      .text()
      .trim()
      .toLowerCase();

    // Popularity
    this.popularity = this.parsePopularity(
      this.container.find(ext.popularitySelector).text()
    );

    // Source
    var source = this.container.find(ext.articleSourceSelector);
    if (source != null) {
      this.source = source.text().trim();
    }

    // URL
    this.url = this.container
      .find(
        this.container.is(".titleOnly,.magazine,.cards")
          ? "a[target='_blank']"
          : ext.articleViewUrlAnchorSelector
      )
      .attr("href");
  }

  addClass(c) {
    return this.container.addClass(c);
  }

  getTitle(): string {
    return this.title;
  }

  getUrl() {
    return this.url;
  }

  getSource(): string {
    return this.source;
  }

  getPopularity(): number {
    return this.popularity;
  }

  getReceivedAge(): number {
    return this.receivedAge;
  }

  getReceivedDate(): Date {
    return new Date(this.receivedAge);
  }

  getPublishAge(): number {
    return this.publishAge;
  }

  getPublishDate(): Date {
    return new Date(this.publishAge);
  }

  isHot(): boolean {
    var span = this.container.find(ext.popularitySelector);
    return (
      span.hasClass("hot") ||
      span.hasClass("onfire") ||
      span.hasClass("EntryEngagement--hot")
    );
  }

  getEntryId(): string {
    return this.entryId;
  }

  setVisible(visible?: boolean) {
    if (visible != null && !visible) {
      this.container.css("display", "none");
    } else {
      this.container.css("display", "");
    }
  }

  getContainer() {
    return this.container;
  }

  isVisible(): boolean {
    return !(this.container.css("display") === "none");
  }

  isGap(): boolean {
    return this.container.attr("gap-article") === "true";
  }

  checked() {
    this.container.attr(ext.checkedArticlesAttribute, "");
  }

  setColor(color: string) {
    this.container.css("background-color", color);
  }

  parsePopularity(popularityStr: String) {
    popularityStr = popularityStr.trim().replace("+", "");
    if (popularityStr.indexOf("K") > -1) {
      popularityStr = popularityStr.replace("K", "");
      popularityStr += "000";
    }
    return Number(popularityStr);
  }
}

export class Entry implements SortableArticle {
  private entry;
  private metadata;
  private jsonInfo;
  constructor(entry) {
    this.entry = entry;
    this.metadata = entry.metadata;
    this.jsonInfo = entry.jsonInfo;
  }
  get() {
    return this.entry;
  }
  getEntryId(): string {
    return this.jsonInfo.id;
  }
  getPublishAge(): number {
    return this.jsonInfo.published;
  }
  getReceivedAge(): number {
    return this.jsonInfo.crawled;
  }
  getPublishDate(): Date {
    return new Date(this.getPublishAge());
  }
  getPopularity(): number {
    return this.jsonInfo.engagement ?? 0;
  }
  getTitle(): string {
    return this.jsonInfo.title ?? this.entry._titleHtml ?? "";
  }
  getSource(): string {
    return this.metadata.sourceTitle;
  }
  isHot(): boolean {
    return (
      !this.metadata.garbage &&
      this.jsonInfo.engagement &&
      this.jsonInfo.engagementRate &&
      ((this.jsonInfo.engagement > 100 && this.jsonInfo.engagementRate > 3) ||
        (this.jsonInfo.engagement > 25 && this.jsonInfo.engagementRate > 7))
    );
  }
  isGap(): boolean {
    return false;
  }
  isVisible(): boolean {
    return true;
  }
}
