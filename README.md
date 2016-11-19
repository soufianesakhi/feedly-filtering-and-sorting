# Feedly filtering and sorting

When this script is enabled, a filter icon will appear next to the settings icon that toggles the filtering and sorting menu.

![Toggle button](https://raw.githubusercontent.com/soufianesakhi/feedly-filtering-and-sorting/master/screenshots/toggle%20button.PNG)

![Menu](https://raw.githubusercontent.com/soufianesakhi/feedly-filtering-and-sorting/master/screenshots/menu.PNG)

![Advanced settings](https://raw.githubusercontent.com/soufianesakhi/feedly-filtering-and-sorting/master/screenshots/menu_advanced.PNG)

![Import settings](https://raw.githubusercontent.com/soufianesakhi/feedly-filtering-and-sorting/master/screenshots/settings_controls.PNG)

This script requires the `Unread Only` option to be enabled.

Additionally the `Latest` sort option must be enabled to use the script's sorting functionality (it's not required when the sorting is not enabled and the pin hot articles option is disabled).

![Feedly settings](https://raw.githubusercontent.com/soufianesakhi/feedly-filtering-and-sorting/master/screenshots/feedly_settings.PNG)

## Features

- Filtering: Hide the articles that contain at least one of the filtering keywords.
- Restricting: Show only articles that contain at least one of the restricting keywords.
- Multi level sorting: by popularity, by title, by source or by publish date.
- Auto load all unread articles.
- Advanced controls of the recently published articles.
- Pin hot articles to top.
- Import settings from other subscriptions or from global settings.
- Link settings to other subscriptions.

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

## Changelog
Can be found [here](https://github.com/soufianesakhi/feedly-filtering-and-sorting/releases).

## Requests
Please report bugs and feature requests in the following [link](https://github.com/soufianesakhi/feedly-filtering-and-sorting/issues).

Don't forget to give the project a star if you like it :)

## Installation

This script relies on the user scripts extensions like Greasemonkey or Tampermonkey.

After installing the appropriate user scripts extension, you can install the script from the following sites:
- https://greasyfork.org/en/scripts/20483-feedly-filtering-and-sorting
- https://openuserjs.org/scripts/soufianesakhi/Feedly_filtering_and_sorting

### Firefox

The [Greasemonkey](https://addons.mozilla.org/en-US/firefox/addon/greasemonkey/) extension should be installed.

###  Google Chrome

The [Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo?hl=en) extension should be installed.

## Dev Installation
Install NodeJS & NPM (https://nodejs.org/en/download).

```
npm install
npm install -g grunt
npm install -g typings
typings install

To build manually:
grunt

To automatically build on source code change:
grunt watch
```