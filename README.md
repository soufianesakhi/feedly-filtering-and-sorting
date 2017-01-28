# Feedly filtering and sorting

When this extension/script is enabled, a filter icon will appear next to the settings icon that toggles the filtering and sorting menu.

![Toggle button](https://raw.githubusercontent.com/soufianesakhi/feedly-filtering-and-sorting/master/screenshots/toggle%20button.PNG)

![Menu](https://raw.githubusercontent.com/soufianesakhi/feedly-filtering-and-sorting/master/screenshots/menu.PNG)

![Keyword settings](https://raw.githubusercontent.com/soufianesakhi/feedly-filtering-and-sorting/master/screenshots/keyword_controls.PNG)

![UI settings](https://raw.githubusercontent.com/soufianesakhi/feedly-filtering-and-sorting/master/screenshots/ui_controls.PNG)

![Advanced settings](https://raw.githubusercontent.com/soufianesakhi/feedly-filtering-and-sorting/master/screenshots/menu_advanced.PNG)

![Import settings](https://raw.githubusercontent.com/soufianesakhi/feedly-filtering-and-sorting/master/screenshots/settings_controls.PNG)

The `Unread Only` option is required to be enabled.

Additionally the `Latest` sort option must be enabled to use sorting functionality (it's not required when the sorting is not enabled and the pin hot articles option is disabled).

![Feedly settings](https://raw.githubusercontent.com/soufianesakhi/feedly-filtering-and-sorting/master/screenshots/feedly_settings.PNG)

## Features

- Filtering: Hide the articles that contain at least one of the filtering keywords.
- Restricting: Show only articles that contain at least one of the restricting keywords.
- Advanced keyword matching: Specify areas to search, searching method (simple, pattern (RegExp), ...)
- Multi level sorting: by popularity, by title, by source or by publish date.
- Auto load all unread articles.
- Advanced controls (keep recently published articles unread, ...).
- Pin hot articles to top.
- Advanced settings management (Import from / link to an other subscription).
- Tweak the page (Add a button to open an entry in a new tab and mark it as read, ...).

Two settings modes are available: 
- Global settings: same settings used for all subscriptions and categories.
- Subscription settings:
  - Subscription and category specific settings
  - The default settings values are the global settings.
  - A group of subscriptions can share the same settings by linking them to the same subscription.

Presentation support:
- The `Title Only`, `Magazine` and `Cards` views are fully supported.
- The `Full Articles` view is not currently supported (does not use the same rendering engine as the other views).

A page refresh is required when changing the presentation.

## [Changelog](https://github.com/soufianesakhi/feedly-filtering-and-sorting/releases)

## Requests
Please report bugs and feature requests in the following [link](https://github.com/soufianesakhi/feedly-filtering-and-sorting/issues).

## Installation

Two options are available:

### Install as an extension

- Google Chrome: https://chrome.google.com/webstore/detail/feedly-filtering-and-sort/anknmaofbemimfabppdffklbfiecikgo

### Install as a user script
This script relies on the user scripts extensions like [Greasemonkey](https://addons.mozilla.org/en-US/firefox/addon/greasemonkey/) or [Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo?hl=en).

After installing the appropriate user scripts extension, you can install the script from the following sites:
- https://greasyfork.org/en/scripts/20483-feedly-filtering-and-sorting
- https://openuserjs.org/scripts/soufianesakhi/Feedly_filtering_and_sorting
