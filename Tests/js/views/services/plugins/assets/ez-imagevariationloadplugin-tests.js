/*
 * Copyright (C) eZ Systems AS. All rights reserved.
 * For full copyright and license information view LICENSE file distributed with this source code.
 */
YUI.add('ez-imagevariationloadplugin-tests', function (Y) {
    var tests, registerTest,
        Assert = Y.Assert, Mock = Y.Mock;

    tests = new Y.Test.Case({
        name: "eZ Image Variation Load Plugin event tests",

        setUp: function () {
            this.capi = new Mock();
            this.contentService = new Mock();
            Mock.expect(this.capi, {
                method: 'getContentService',
                returns: this.contentService
            });
            this.service = new Y.Base();

            this.view = new Y.View();
            this.view.set('loadingError', false);
            this.view.set('imageVariation', null);
            this.view.addTarget(this.service);

            this.service.set('capi', this.capi);
            this.plugin = new Y.eZ.Plugin.ImageVariationLoad({
                host: this.service,
            });

            this.variationId = 'large';
            this.variationHref = 'variation/resources/' + this.variationId;
            this.variations = {};
            this.variations[this.variationId] = {
                href: this.variationHref,
            };
            this.field = {
                fieldValue: {
                    variations: this.variations
                }
            };
        },

        tearDown: function () {
            this.plugin.destroy();
            this.view.destroy();
            this.service.destroy();
            delete this.plugin;
            delete this.view;
            delete this.service;
            delete this.capi;
        },

        "Should load the image variation info": function () {
            var variationInfo = {},
                response = {document: {ContentImageVariation: variationInfo}};

            Mock.expect(this.contentService, {
                method: 'loadImageVariation',
                args: [this.variationHref, Mock.Value.Function],
                run: function (uri, callback) {
                    callback(false, response);
                },
            });

            this.view.fire('loadImageVariation', {
                field: this.field,
                variation: 'large',
            });
            Mock.verify(this.contentService);
            Assert.areSame(
                variationInfo,
                this.view.get('imageVariation'),
                "The view should receive the variation info"
            );
            Assert.isFalse(
                this.view.get('loadingError'),
                "The loadingError flag should stay false"
            );
        },

        "Should handle loading error": function () {
            Mock.expect(this.contentService, {
                method: 'loadImageVariation',
                args: [this.variationHref, Mock.Value.Function],
                run: function (uri, callback) {
                    callback(true);
                },
            });

            this.view.fire('loadImageVariation', {
                field: this.field,
                variation: 'large',
            });
            Mock.verify(this.contentService);
            Assert.isNull(
                this.view.get('imageVariation'),
                "The view should not receive any variation info"
            );
            Assert.isTrue(
                this.view.get('loadingError'),
                "The loadingError flag should become true"
            );
        },
    });

    registerTest = new Y.Test.Case(Y.eZ.Test.PluginRegisterTest);
    registerTest.Plugin = Y.eZ.Plugin.ImageVariationLoad;
    registerTest.components = ['locationViewViewService'];

    Y.Test.Runner.setName("eZ Image Variation Load Plugin tests");
    Y.Test.Runner.add(tests);
    Y.Test.Runner.add(registerTest);
}, '', {requires: ['test', 'view', 'base', 'ez-imagevariationloadplugin', 'ez-pluginregister-tests']});
