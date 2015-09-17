/*******************************************************************************
 * Copyright (c) 2014 Adobe Systems Incorporated. All rights reserved.
 *
 * Licensed under the Apache License 2.0.
 * http://www.apache.org/licenses/LICENSE-2.0
 ******************************************************************************/
 define(function (require, exports, module) {
    'use strict';

    function required(errorMessage) {
        return function(fieldValue) {
            if (fieldValue === '') {
                return errorMessage;
            }
            return '';
        };
    };

    function validateForm(formData, validators) {
        var i,
            field,
            validator;
        for (i = 0; i < formData.length; i++) {
            field = formData[i];
            validator = validators[field.name];
            if (validator) {
                if (validator instanceof Function) {
                    var result = validator.call(undefined, field.value);
                    if (result) {
                        return result;
                    }
                } else {
                    console.error('Invalid validator type detected.');
                }
            }
        }
        return '';
    }

    function toObject(formData) {
        var obj = {};
        var i,
            field,
            value;
        for (i = 0; i < formData.length; i++) {
            field = formData[i];
            if (field.value && field.value !== '') {
                value = field.value
                if (value === 'true') {
                    value = true;
                }
                if (obj[field.name]) {
                    if (!$.isArray(obj[field.name])) {
                        obj[field.name] = [ obj[field.name] ]
                    }
                    obj[field.name].push(value);
                } else {
                    obj[field.name] = value;
                }
            }
        }
        return obj;
    }
    
    exports.required = required;
    exports.validateForm = validateForm;
    exports.toObject = toObject;
});