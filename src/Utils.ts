var exported = {};

export function $id(id) {
    return $('#' + id);
}

interface MarkupBinding {
    name: string, value: any
}

export function bindMarkup(html: string, bindings: MarkupBinding[]): string {
    bindings.forEach(binding => {
        html = html.replace(new RegExp("\{\{" + binding.name + "\}\}", "g"), "" + binding.value);
    });
    return html;
}

export function callbackBindedTo(thisArg: any): (callback: (...args: any[]) => any) => any {
    return (function (callback: () => any) {
        return callback.bind(this);
    }).bind(thisArg);
}

export function capitalizeFirst(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

export function isChecked(input: JQuery): boolean {
    return input.is(':checked');
}

export function setChecked(htmlId: string, checked: boolean) {
    $id(htmlId).prop('checked', checked);
}

export function registerAccessors(srcObject, srcFieldName: string, targetPrototype, setterCallback: (t) => void, setterCallbackThisArg: Object, fieldObjectName?: string) {
    for (var field in srcObject) {
        var type = typeof (srcObject[field]);
        if (type === "object" && !$.isArray(srcObject[field])) {
            registerAccessors(srcObject[field], srcFieldName, targetPrototype, setterCallback, setterCallbackThisArg, field);
        } else if (type !== "function") {
            var accessorName = capitalizeFirst(field);
            if (fieldObjectName != null) {
                accessorName += "_" + capitalizeFirst(fieldObjectName);
            }
            var getterName = (type === "boolean" ? "is" : "get") + accessorName;
            var setterName = "set" + accessorName;
            (() => {
                var callbackField = field;
                var getFinalObj = function (callbackSrcObj) {
                    return fieldObjectName == null ? callbackSrcObj : callbackSrcObj[fieldObjectName];
                }
                if (targetPrototype[getterName] == null) {
                    targetPrototype[getterName] = function () {
                        var finalObj = getFinalObj(this[srcFieldName])
                        return finalObj[callbackField];
                    };
                }
                if (targetPrototype[setterName] == null) {
                    targetPrototype[setterName] = function (value) {
                        var callbackSrcObj = this[srcFieldName];
                        var finalObj = getFinalObj(callbackSrcObj)
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

export function deepClone<T>(toClone: T, clone: T, alternativeToCloneByField): T {
    if (!toClone) {
        return clone;
    }
    var typedClone = clone;
    if (!clone) {
        clone = {} as T;
        typedClone = toClone;
    }
    for (var field in typedClone) {
        var type = typeof (typedClone[field]);
        if (toClone[field] == null) {
            continue;
        }
        switch (type) {
            case "object":
                if (!$.isArray(typedClone[field])) {
                    clone[field] = deepClone(toClone[field], alternativeToCloneByField[field], alternativeToCloneByField);
                } else {
                    var array: any = toClone[field];
                    clone[field] = array.slice(0);
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

export function injectToWindow(functionNames: string[], ...functions: Function[]) {
    var srcTxt = "";
    for (var i = 0; i < functions.length; i++) {
        srcTxt += functions[i].toString().replace(/^function/, "function " + functionNames[i]) + "\n";
    }
    injectScriptText(srcTxt, "window-" + Date.now());
}

export function injectClasses(...classes: Function[]) {
    var srcTxt = "";
    for (var i = 0; i < classes.length; i++) {
        var txt = classes[i].toString();
        var className = (/function ([^\(]+)/i).exec(txt)[1];
        srcTxt += "var " + className + " = (function () {\n"
            + classes[i].toString()
            + "\nreturn " + className + ";"
            + "\n}());";
    }
    injectScriptText(srcTxt, "classes-" + Date.now());
}

export function injectScriptText(srcTxt: string, sourceURL?: string) {
    if (sourceURL) {
        srcTxt += "//# sourceURL=" + sourceURL;
        if (typeof (InstallTrigger) != "undefined") {
            srcTxt = "eval(`" + srcTxt + "`)";
        }
    }
    var script = document.createElement("script");
    script.type = 'text/javascript';
    script.text = srcTxt;
    document.body.appendChild(script);
}

export function injectStyleText(styleTxt: string) {
    $("head").append("<style>" + styleTxt + "</style>");
}
