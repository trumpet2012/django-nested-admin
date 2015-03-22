(function($) {

    var pluginName = "nestedFormset";

    var NestedFormset = Class.extend({
        opts: {
            emptyClass: 'empty-form grp-empty-form',
            predeleteClass: 'grp-predelete'
        },
        init: function(inline) {
            this.$inline = $(inline);
            this.prefix = this.$inline.djangoFormsetPrefix();
            this._$totalForms = this.$inline.find('#id_' + this.prefix + '-TOTAL_FORMS');
            this._$totalForms.attr('autocomplete', 'off');
            this._$template = $('#' + this.prefix + '-empty');

            var inlineModelClassName = this.$inline.data('inlineModel');

            this.opts = $.extend({}, this.opts, {
                addButtonSelector: '.add-handler.' + inlineModelClassName,
                removeButtonSelector: '.remove-handler.' + inlineModelClassName,
                deleteButtonSelector: '.delete-handler.' + inlineModelClassName,
                formClass: 'dynamic-form-' + inlineModelClassName
            });

            DJNesting.initRelatedFields(this.prefix, this.$inline.data());
            DJNesting.initAutocompleteFields(this.prefix, this.$inline.data());

            this._bindEvents();

            this._initializeForms();

            this.$inline.find('.nested-sortable-container:not([id*="-empty"])').trigger('djnesting:init');

            // initialize nested formsets
            this.$inline.find('.group[id$="-group"][id^="' + this.prefix + '"][data-field-names]:not([id*="-empty"])').each(function() {
                $(this)[pluginName]();
            });

            if (this.$inline.is('.djnesting-stacked-root')) {
                DJNesting.createSortable(this.$inline);
            }

            DJNesting.initSubArticleNesting(this.$inline);
        },
        _initializeForms: function() {
            var totalForms = this.mgmtVal('TOTAL_FORMS');
            for (var i = 0; i < totalForms; i++) {
                this._initializeForm('#' + this.prefix + i);
            }
        },
        _initializeForm: function(form) {
            var $form = $(form);
            var formPrefix = $form.djangoFormPrefix();
            $form.addClass(this.opts.formClass);
            if ($form.hasClass('has_original')) {
                $('#id_' + formPrefix + 'DELETE:checked').toggleClass(this.opts.predeleteClass);
            }
        },
        _bindEvents: function($el) {
            var self = this;
            if (typeof $el == 'undefined') {
                $el = this.$inline;
            }
            $el.find(this.opts.addButtonSelector).click(function(e) {
                e.preventDefault();
                e.stopPropagation();
                self.add();
            });
            $el.find(this.opts.removeButtonSelector).click(function(e) {
                e.preventDefault();
                e.stopPropagation();
                var $form = $(this).closest('.' + self.opts.formClass);
                self.remove($form);
            });
            $el.find(this.opts.deleteButtonSelector).click(function(e) {
                e.preventDefault();
                e.stopPropagation();
                var $form = $(this).closest('.' + self.opts.formClass);
                var $deleteInput = $('#id_' + $form.djangoFormPrefix() + 'DELETE');
                if (!$deleteInput.is(':checked')) {
                    self.delete($form);
                } else {
                    self.undelete($form);
                }
            });
        },
        remove: function(form) {
            var self = this;
            var $form = $(form);
            var totalForms = this.mgmtVal('TOTAL_FORMS');
            var maxForms = this.mgmtVal('MAX_NUM_FORMS') || Infinity;

            $form.remove();

            this.mgmtVal('TOTAL_FORMS', totalForms - 1);

            if (maxForms - totalForms >= 0) {
                this.$inline.find(this.opts.addButtonSelector).parents('.grp-add-item').show();
            }

            var form_re = new RegExp(DJNesting.regexQuote(this.prefix) + '\\-\\d+\\-');

            this.$inline.find("." + this.opts.formClass).each(function(i, el) {
                DJNesting.updateFormAttributes($(el), form_re, self.prefix + '-' + i + '-');
            });

            DJNesting.updatePositions(this.prefix);
        },
        delete: function(form) {
            var $form = $(form),
                formPrefix = $form.djangoFormPrefix(),
                $deleteInput = $('#id_' + formPrefix + 'DELETE');

            if ($form.parent().closest('.' + this.opts.predeleteClass).length) {
                return;
            }

            if ($form.hasClass('has_original')) {
                $deleteInput.attr('checked', 'checked');
                $form.addClass(this.opts.predeleteClass);
            }

            DJNesting.updatePositions(this.prefix);
        },
        undelete: function(form) {
            var $form = $(form),
                formPrefix = $form.djangoFormPrefix(),
                $deleteInput = $('#id_' + formPrefix + 'DELETE');

            if ($form.parent().closest('.' + this.opts.predeleteClass).length) {
                return;
            }
            if ($form.hasClass('has_original')) {
                $deleteInput.removeAttr('checked');
                $form.removeClass(this.opts.predeleteClass);
            }

            DJNesting.updatePositions(this.prefix);
        },
        add: function() {
            var self = this;
            var $form = this._$template.clone();
            var index = this.mgmtVal('TOTAL_FORMS');
            var maxForms = this.mgmtVal('MAX_NUM_FORMS') || Infinity;
            var isNested = this.$inline.hasClass('djnesting-stacked');

            $form.removeClass(this.opts.emptyClass);
            $form.attr('id', $form.attr('id').replace("-empty", index));

            if (isNested) {
                $form.wrap('<div class="nested-sortable-item"></div>').parent().insertBefore(this._$template.parent());
                $form.parent().append(DJNesting.createContainerElement());
            } else {
                $form.insertBefore(this._$template);
                $form.parent.addClass('nested-sortable-item');
            }

            this.mgmtVal('TOTAL_FORMS', index + 1);
            if (maxForms - index <= 0) {
                this.$inline.find(this.opts.addButtonSelector).parents('.grp-add-item').hide();
            }

            DJNesting.updateFormAttributes($form, /__prefix__/, index);

            DJNesting.updateNestedFormIndex($form, this.prefix);
            DJNesting.updatePositions(this.prefix);

            grappelli.reinitDateTimeFields($form);
            grappelli.updateSelectFilter($form);
            DJNesting.initRelatedFields(this.prefix);
            DJNesting.initAutocompleteFields(this.prefix);
            $form.find(".collapse").andSelf().grp_collapsible({
                toggle_handler_slctr: ".collapse-handler:first",
                closed_css: "closed grp-closed",
                open_css: "open grp-open",
                on_toggle: function(elem, options) {
                    $(document).trigger('djnesting:toggle', [self.$inline]);
                }
            });
            if (typeof $.fn.curated_content_type == 'function') {
                $form.find('.curated-content-type-select').each(function(index, element) {
                    $(element).curated_content_type();
                });
            }

            this._initializeForm($form);
            this._bindEvents($form);

            // find any nested formsets
            $form.find('.group[id$="-group"][id^="' + this.prefix + '"][data-field-names]:not([id*="-empty"])').each(function() {
                $(this)[pluginName]();
            });

            // Fire an event on the document so other javascript applications
            // can be alerted to the newly inserted inline
            $(document).trigger('djnesting:added', [this.$inline, $form]);

            return $form;
        },
        mgmtVal: function(name, newValue) {
            var $field = this.$inline.find('#id_' + this.prefix + '-' + name);
            if (typeof newValue == 'undefined') {
                return parseInt($field.val(), 10);
            } else {
                return parseInt($field.val(newValue).val(), 10);
            }
        }
    });

    $.fn[pluginName] = function() {
        var options, fn, args;
        var $el = this.eq(0);

        if (arguments.length === 0 || (arguments.length === 1 && $.type(arguments[0]) != 'string')) {
            options = arguments[0];
            var nestedFormset = $el.data(pluginName);
            if (!nestedFormset) {
                nestedFormset = new NestedFormset($el, options);
                $el.data(pluginName, nestedFormset);
            }
            return nestedFormset;
        }

        fn = arguments[0];
        args = $.makeArray(arguments).slice(1);

        if (fn in NestedFormset.prototype) {
            var nestedFormset = $el.data(pluginName);
            return nestedFormset[fn](args);
        } else {
            throw new Error("Unknown function call " + fn + " for $.fn." + pluginName);
        }
    };

})((typeof grp == 'object' && grp.jQuery) ? grp.jQuery : django.jQuery);