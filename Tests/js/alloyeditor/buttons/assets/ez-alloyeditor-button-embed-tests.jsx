/*
 * Copyright (C) eZ Systems AS. All rights reserved.
 * For full copyright and license information view LICENSE file distributed with this source code.
 */
/* global CKEDITOR */
YUI.add('ez-alloyeditor-button-embed-tests', function (Y) {
    var renderTest, clickTest,
        AlloyEditor = Y.eZ.AlloyEditor,
        ReactDOM = Y.eZ.ReactDOM,
        React = Y.eZ.React,
        Assert = Y.Assert, Mock = Y.Mock;

    renderTest = new Y.Test.Case({
        name: "eZ AlloyEditor embed button render test",

        setUp: function () {
            this.container = Y.one('.container').getDOMNode();
            this.editor = new Mock();
            this.nativeEditor = new Mock();
            this.nativeEditor.ezembed = new Mock();

            Mock.expect(this.editor, {
                method: 'get',
                args: ['nativeEditor'],
                returns: this.nativeEditor
            });
        },

        tearDown: function () {
            ReactDOM.unmountComponentAtNode(this.container);
            delete this.editor;
            delete this.nativeEditor;
        },

        "Should render a enabled button": function () {
            var button;

            Mock.expect(this.nativeEditor.ezembed, {
                method: 'canBeAdded',
                args: [],
                returns: true,
            });

            button = ReactDOM.render(
                <AlloyEditor.ButtonEmbed editor={this.editor} />,
                this.container
            );

            Assert.isNotNull(
                ReactDOM.findDOMNode(button),
                "The button should be rendered"
            );
            Assert.areEqual(
                "BUTTON", ReactDOM.findDOMNode(button).tagName,
                "The component should generate a button"
            );
            Assert.areEqual(
                false, ReactDOM.findDOMNode(button).disabled,
                "The button should not be disabled"
            );
        },

        "Should render a disabled button": function () {
            var button;

            Mock.expect(this.nativeEditor.ezembed, {
                method: 'canBeAdded',
                args: [],
                returns: false,
            });

            button = ReactDOM.render(
                <AlloyEditor.ButtonEmbed editor={this.editor} />,
                this.container
            );

            Assert.isNotNull(
                ReactDOM.findDOMNode(button),
                "The button should be rendered"
            );
            Assert.areEqual(
                "BUTTON", ReactDOM.findDOMNode(button).tagName,
                "The component should generate a button"
            );
            Assert.areEqual(
                true, ReactDOM.findDOMNode(button).disabled,
                "The button should be disabled"
            );
        },
    });

    clickTest= new Y.Test.Case({
        name: "eZ AlloyEditor embed button click test",

        "async:init": function () {
            var startTest = this.callback();

            CKEDITOR.plugins.addExternal('lineutils', '../../../lineutils/');
            CKEDITOR.plugins.addExternal('widget', '../../../widget/');
            this.container = Y.one('.container');
            this.editor = AlloyEditor.editable(
                Y.one('.editorContainer').getDOMNode(), {
                    extraPlugins: AlloyEditor.Core.ATTRS.extraPlugins.value + ',ezembed',
                }
            );
            this.editor.get('nativeEditor').on('instanceReady', function () {
                startTest();
            });
        },

        destroy: function () {
            this.editor.destroy();
        },

        tearDown: function () {
            ReactDOM.unmountComponentAtNode(this.container.getDOMNode());
        },

        "Should fire the contentDiscover event": function () {
            var button,
                contentDiscoverFired = false;

            this.editor.get('nativeEditor').on('contentDiscover', function (evt) {
                contentDiscoverFired = true;

                Assert.isObject(
                    evt.data.config,
                    "The event should provide a config for the UDW"
                );
                Assert.isFalse(
                    evt.data.config.multiple,
                    "The UDW should be configured with multiple false"
                );
                Assert.isFunction(
                    evt.data.config.contentDiscoveredHandler,
                    "The UDW should be configured with a contentDiscoveredHandler"
                );
            });
            button = ReactDOM.render(
                <AlloyEditor.ButtonEmbed editor={this.editor} />,
                this.container.getDOMNode()
            );

            this.container.one('button').simulate('click');

            Assert.isTrue(
                contentDiscoverFired,
                "The contentDiscover event should have been fired"
            );
        },

        "Should add the embed after choosing the content": function () {
            var button, contentInfo = new Mock(),
                contentId = 42,
                updatedEmbed = false,
                selection = {contentInfo: contentInfo};

            Mock.expect(contentInfo, {
                method: 'get',
                args: [Mock.Value.String],
                run: function (attr) {
                    if ( attr === 'contentId' ) {
                        return contentId;
                    }
                    Assert.fail("Unexpected call to get for attribute " + attr);
                }
            });

            this.editor.get('nativeEditor').on('updatedEmbed', function (e) {
                updatedEmbed = true;

                Assert.areSame(
                    selection,
                    e.data.embedStruct,
                    "The updatedEmbed event parameters should contain the selection"
                );
            });

            this.editor.get('nativeEditor').on('contentDiscover', function (evt) {
                var wrapper, widget;

                evt.data.config.contentDiscoveredHandler.call(this, {
                    selection: selection,
                });

                wrapper = this.element.findOne('.cke_widget_element');
                widget = this.widgets.getByElement(wrapper);

                Assert.areEqual(
                    'ezembed', widget.name,
                    "An ezembed widget should have been added"
                );
                Assert.areEqual(
                    'ezcontent://' + contentId,
                    widget.element.data('href'),
                    "The data-href should be build with the contentId"
                );
                Assert.areEqual(
                    "",
                    widget.element.getText(),
                    "The ezembed should be emptied"
                );
                Assert.areSame(
                    widget, this.widgets.focused,
                    "The ezembed widget should have the focus"
                );
            });
            button = ReactDOM.render(
                <AlloyEditor.ButtonEmbed editor={this.editor} />,
                this.container.getDOMNode()
            );

            this.container.one('button').simulate('click');
            Assert.isTrue(updatedEmbed, "The updatedEmbed event should have been fired");
        },
    });

    Y.Test.Runner.setName("eZ AlloyEditor embed button tests");
    Y.Test.Runner.add(renderTest);
    Y.Test.Runner.add(clickTest);
}, '', {requires: ['test', 'node', 'node-event-simulate', 'ez-alloyeditor-button-embed', 'ez-alloyeditor-plugin-embed']});
