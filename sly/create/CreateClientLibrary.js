/*******************************************************************************
 * Copyright (c) 2014 Adobe Systems Incorporated. All rights reserved.
 *
 * Licensed under the Apache License 2.0.
 * http://www.apache.org/licenses/LICENSE-2.0
 ******************************************************************************/
 define(function (require, exports, module) {
    'use strict';
    var ProjectManager                    = brackets.getModule('project/ProjectManager'),
        CommandManager                    = brackets.getModule('command/CommandManager'),
        Menus                             = brackets.getModule('command/Menus'),
        Dialogs                           = brackets.getModule('widgets/Dialogs'),
        DefaultDialogs                    = brackets.getModule('widgets/DefaultDialogs'),
        FileSystem                        = brackets.getModule('filesystem/FileSystem'),
        Strings                           = require('strings'),
        ProjectUtils                      = require('sly/ProjectUtils'),
        Forms                             = require('sly/Forms'),
        ClientLibraryDialog               = require('text!./client-library-dialog.html'),
        CMD_CREATE_CLIENT_LIBRARY         = 'sly-create-client-library',
        validators                        = {},
        selectedItem;

    validators.nodeName = Forms.required(Strings.CLIENT_LIBRARY_NODE_NAME_REQUIRED);

    function _showCreateClientLibraryDialog(errorMessage, existingData) {
        var dialog,
            templateVars,
            formData;
        templateVars = {
            Strings : Strings,
            errorMessage : errorMessage
        };
        if (existingData) {
            $.fn.extend(templateVars, existingData);
        } else {
            templateVars.hasJs = true;
            templateVars.hasCss = true;
        }

        dialog = Dialogs.showModalDialogUsingTemplate(Mustache.render(ClientLibraryDialog, templateVars));
        dialog.getElement().find('input')[0].focus();
        dialog.done(function(id) {
            if (id === Dialogs.DIALOG_BTN_OK) {
                formData = dialog.getElement().find('form').serializeArray();
                var validationResult = Forms.validateForm(formData, validators);
                if (validationResult === '') {
                    _createClientLibrary(Forms.toObject(formData));
                } else {
                    _showCreateClientLibraryDialog(validationResult, Forms.toObject(formData));
                }
            }
        });
    }

    function _createClientLibrary(formData) {
        if (selectedItem) {
            var newFolder = FileSystem.getDirectoryForPath(selectedItem.fullPath + formData.nodeName);
            newFolder.exists(function(error, exists) {
                if (error) {
                    Dialogs.showModalDialog(DefaultDialogs.DIALOG_ID_ERROR, Strings.ERROR, error);
                } else {
                    if (exists) {
                        Dialogs.showModalDialog(DefaultDialogs.DIALOG_ID_ERROR, Strings.ERROR, Strings.CLIENT_LIBRARY_EXISTS);
                    } else {
                        newFolder.create(function(error, stat) {
                            if (!error) {
                                FileSystem.getFileForPath(newFolder.fullPath + ".content.xml").write(_createContentXml(formData));
                                if (formData.hasJs) {
                                    FileSystem.getFileForPath(newFolder.fullPath + "js.txt").write("#base=js\n");
                                    FileSystem.getFolderForPath(newFolder.fullPath + "js").create();
                                }
                                if (formData.hasCss) {
                                    FileSystem.getFileForPath(newFolder.fullPath + "css.txt").write("#base=css\n");
                                    FileSystem.getFolderForPath(newFolder.fullPath + "css").create();
                                }
                            } else {
                                Dialogs.showModalDialog(DefaultDialogs.DIALOG_ID_ERROR, Strings.ERROR, error);
                            }
                        });
                    }
                }
            });

        }
    }
    
    function _outputArray(formData, jcrPropertyName, formPropertyName) {
        var str = '';
        formPropertyName = formPropertyName || jcrPropertyName;
        if (formData[formPropertyName]) {
            str += '\t' + jcrPropertyName + '="[';
            if ($.isArray(formData[formPropertyName])) {
                str += formData[formPropertyName].join(',')                 
            } else {
                str += formData[formPropertyName];
            }
            str += ']"\n';
        }
        return str;
    }

    function _createContentXml(formData) {
        var str = '<?xml version="1.0" encoding="UTF-8"?>\n';
        str += '<jcr:root xmlns:cq="http://www.day.com/jcr/cq/1.0" xmlns:jcr="http://www.jcp.org/jcr/1.0"\n';
        str += '\tjcr:primaryType="cq:ClientLibraryFolder"\n';
        str += _outputArray(formData, 'categories');
        str += _outputArray(formData, 'dependencies');
        str += _outputArray(formData, 'embed');
        str = $.trim(str) + '/>';
        return str;
    }

    function load(SLYDictionary) {
        CommandManager.register(Strings.CREATE_CLIENT_LIBRARY, CMD_CREATE_CLIENT_LIBRARY, _showCreateClientLibraryDialog);
        
        var contextMenuEntriesState = false,
             project_cmenu = Menus.getContextMenu(Menus.ContextMenuIds.PROJECT_MENU);

        function toggleMenuEntries(state) {
            if (state === contextMenuEntriesState) {
                return;
            }
            if (state) {
                project_cmenu.addMenuItem(CMD_CREATE_CLIENT_LIBRARY);
            } else {
                project_cmenu.removeMenuItem(CMD_CREATE_CLIENT_LIBRARY);
            }
            contextMenuEntriesState = state;
        }

        $(project_cmenu).on('beforeContextMenuOpen', function () {
            ProjectUtils.getJcrRoot().then(
                function (root) {
                    if (root === '') {
                        toggleMenuEntries(false);
                    } else {
                        selectedItem = ProjectManager.getSelectedItem();
                        if (!selectedItem) {
                            toggleMenuEntries(false);
                        }
                        if (selectedItem.isDirectory &&
                                selectedItem.fullPath.indexOf(root) === 0) {
                            toggleMenuEntries(true);
                        } else {
                            toggleMenuEntries(false);
                        }
                    }
                }
            ).done();
        });
    }

    exports.load = load;
});
