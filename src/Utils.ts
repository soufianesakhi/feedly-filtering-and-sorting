var exported = {};

export function $id(id) {
  return $("#" + id);
}

export function onClick(
  jq: JQuery,
  handler: (eventObject: JQueryEventObject) => any,
  thisArg?
) {
  jq.click(eventObject => {
    try {
      handler.apply(thisArg, eventObject);
    } catch (e) {
      console.log(e);
    }
  });
}

interface MarkupBinding {
  name: string;
  value: any;
}

export function bindMarkup(html: string, bindings: MarkupBinding[]): string {
  bindings.forEach(binding => {
    html = html.replace(
      new RegExp("{{[ ]*" + binding.name + "[ ]*}}", "g"),
      "" + binding.value
    );
  });
  return html;
}

export function callbackBindedTo(
  thisArg: any
): (callback: (...args: any[]) => any) => any {
  return function(callback: () => any) {
    return callback.bind(this);
  }.bind(thisArg);
}

export function capitalizeFirst(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function isChecked(input: JQuery): boolean {
  return input.is(":checked");
}

export function setChecked(htmlId: string, checked: boolean) {
  $id(htmlId).prop("checked", checked);
}

export function registerAccessors(
  srcObject,
  srcFieldName: string,
  targetPrototype,
  setterCallback: (t) => void,
  setterCallbackThisArg: Object,
  fieldObjectName?: string
) {
  for (var field in srcObject) {
    var type = typeof srcObject[field];
    if (type === "object" && !$.isArray(srcObject[field])) {
      registerAccessors(
        srcObject[field],
        srcFieldName,
        targetPrototype,
        setterCallback,
        setterCallbackThisArg,
        field
      );
    } else if (type !== "function") {
      var accessorName = capitalizeFirst(field);
      if (fieldObjectName != null) {
        accessorName += "_" + capitalizeFirst(fieldObjectName);
      }
      var getterName = (type === "boolean" ? "is" : "get") + accessorName;
      var setterName = "set" + accessorName;
      (() => {
        var callbackField = field;
        var getFinalObj = function(callbackSrcObj) {
          return fieldObjectName == null
            ? callbackSrcObj
            : callbackSrcObj[fieldObjectName];
        };
        if (targetPrototype[getterName] == null) {
          targetPrototype[getterName] = function() {
            var finalObj = getFinalObj(this[srcFieldName]);
            return finalObj[callbackField];
          };
        }
        if (targetPrototype[setterName] == null) {
          targetPrototype[setterName] = function(value) {
            var callbackSrcObj = this[srcFieldName];
            var finalObj = getFinalObj(callbackSrcObj);
            finalObj[callbackField] = value;
            setterCallback.call(setterCallbackThisArg, callbackSrcObj);
          };
        }
      })();
    }
  }
}

function getOrDefault(a, b) {
  return a != null ? a : b;
}

export function deepClone<T>(
  toClone: T,
  clone: T,
  alternativeToCloneByField
): T {
  if (!toClone) {
    return clone;
  }
  var typedClone = clone;
  if (!clone) {
    clone = {} as T;
    typedClone = toClone;
  }
  for (var field in typedClone) {
    var type = typeof typedClone[field];
    if (toClone[field] == null) {
      continue;
    }
    switch (type) {
      case "object":
        if (!$.isArray(typedClone[field])) {
          clone[field] = deepClone(
            toClone[field],
            alternativeToCloneByField[field],
            alternativeToCloneByField
          );
        } else {
          var array: any = toClone[field];
          if (array.length > 0) {
            var arrayType = typeof array[0];
            if (arrayType === "object") {
              let cloneArray = [] as any;
              array.forEach(element => {
                cloneArray.push(
                  deepClone(
                    element,
                    new alternativeToCloneByField[field](),
                    alternativeToCloneByField
                  )
                );
              });
              clone[field] = cloneArray;
            } else {
              clone[field] = array.slice(0);
            }
          } else {
            clone[field] = array.slice(0);
          }
        }
        break;
      case "number":
      case "string":
        clone[field] = toClone[field] || clone[field];
        break;
      case "boolean":
        clone[field] = getOrDefault(toClone[field], clone[field]);
        break;
    }
  }
  return clone;
}

export function executeWindow(sourceName: string, ...functions: Function[]) {
  var srcTxt = "try {\n";
  for (var i = 0; i < functions.length; i++) {
    srcTxt += "(" + functions[i].toString() + ")();\n";
  }
  srcTxt += "\n} catch(e) { console.log(e) }";
  injectScriptText(srcTxt, sourceName);
}

export function injectToWindow(
  functionNames: string[],
  ...functions: Function[]
) {
  var srcTxt = "";
  for (let i = 0; i < functions.length; i++) {
    srcTxt +=
      functions[i]
        .toString()
        .replace(/^function/, "function " + functionNames[i]) + "\n";
  }
  injectScriptText(
    srcTxt,
    "FFnS-" + (functions.length == 1 ? functionNames[0] : "Functions"),
    true
  );
}

export function injectClasses(...classes: Function[]) {
  var srcTxt = "";
  for (var i = 0; i < classes.length; i++) {
    var txt = classes[i].toString();
    var className = /function ([^\(]+)/i.exec(txt)[1];
    srcTxt +=
      "var " +
      className +
      " = (function () {\n" +
      classes[i].toString() +
      "\nreturn " +
      className +
      ";" +
      "\n}());";
  }
  injectScriptText(srcTxt, "classes-" + Date.now(), true);
}

export function injectScriptText(
  srcTxt: string,
  sourceURL?: string,
  evalPermitted?: boolean
) {
  if (sourceURL) {
    srcTxt += "//# sourceURL=" + sourceURL;
  }
  if (evalPermitted && typeof InstallTrigger != "undefined") {
    srcTxt = "eval(`" + srcTxt + "`)";
  }
  var script = document.createElement("script");
  script.type = "text/javascript";
  script.text = srcTxt;
  document.body.appendChild(script);
}

export function injectStyleText(styleTxt: string, id?: string) {
  $("head").append(
    "<style" + (id ? 'id="' + id + '" ' : "") + ">" + styleTxt + "</style>"
  );
}

export function exportFile(content: string, filename?: string) {
  var textToSaveAsBlob = new Blob([content], { type: "application/json" });
  var textToSaveAsURL = window.URL.createObjectURL(textToSaveAsBlob);
  var downloadLink = document.createElement("a");
  downloadLink.download = filename ? filename : "export.json";
  downloadLink.href = textToSaveAsURL;
  downloadLink.onclick = function() {
    $(downloadLink).remove();
  };
  downloadLink.style.display = "none";
  document.body.appendChild(downloadLink);
  downloadLink.click();
}

export function getDateWithoutTime(date: Date): Date {
  let result = new Date(date.getTime());
  result.setHours(0, 0, 0, 0);
  return result;
}

export function pushIfAbsent<T>(array: T[], value: T): boolean {
  if (array.indexOf(value) < 0) {
    array.push(value);
    return true;
  }
  return false;
}

export function removeContent(elements: JQuery) {
  elements.each((i, element) => {
    var attributes = $.map(element.attributes, function(item) {
      return item.name;
    });
    $.each(attributes, function(i, item) {
      $(element).removeAttr(item);
    });
    $(element).empty();
  });
}

export function hexToRgb(hexColor: string) {
  const rgb = parseInt(hexColor.substring(1), 16);
  const r = (rgb >> 16) & 0xff;
  const g = (rgb >> 8) & 0xff;
  const b = (rgb >> 0) & 0xff;
  return [r, g, b];
}

export function isLight(rgb: number[]) {
  const luma = 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]; // per ITU-R BT.709
  return luma > 128;
}

export function shadeColor(rgb: number[], percent) {
  let R = (rgb[0] * (100 + percent)) / 100;
  let G = (rgb[1] * (100 + percent)) / 100;
  let B = (rgb[2] * (100 + percent)) / 100;

  R = R < 255 ? R : 255;
  G = G < 255 ? G : 255;
  B = B < 255 ? B : 255;

  return `rgb(${R}, ${G}, ${B})`;
}
