/*jslint white:true, devel:true*/
/*global mx, , require, browser, console */
/*mendix */
/*
    BootstrapDatepicker
    ========================

    @file      : BootstrapDatepicker.js
    @version   : 1.05
    @author    : Chris de Gelder
    @date      : 1-4-2015
    @copyright : Chris de Gelder
    @license   : Apache 2
	based on http://eternicode.github.io/bootstrap-datepicker
*/
// Required module list. Remove unnecessary modules, you can always get them back from the boilerplate.
require({
    packages: [{ name: 'jquery', location: '../../widgets/BootstrapDatepicker/lib', main: 'jquery-1.11.2' },
        { name: 'btdatepicker', location: '../../widgets/BootstrapDatepicker/lib', main: 'bootstrap-datepicker' },
    ]
}, [
    'dojo/_base/declare',
    'mxui/widget/_WidgetBase',
    'dijit/_TemplatedMixin',
    'mxui/dom',
    'dojo/dom-construct',
    'dojo/_base/lang',
    'dojo/text',
    'dojo/_base/kernel',
    'dojo/dom-class',
    'jquery',
    'btdatepicker'
], function(declare, _WidgetBase, _TemplatedMixin, dom, domConstruct, lang, text, kernel, domClass, jQuery, btdatepicker) {
    'use strict';
    var $ = jQuery.noConflict(true);
    // Declare widget's prototype.
    return declare('BootstrapDatepicker.widget.BootstrapDatepicker', [_WidgetBase, ], {

        // Internal variables. Non-primitives created in the prototype are shared between all widget instances.
        _handle: [],
        _contextObj: null,
        selector: null,
        enabled: true,
        date1: null,
        date2: null,

        constructor: function() {
            dom.addCss('widgets/BootstrapDatepicker/widget/ui/bootstrap-datepicker3.css');
            $.fn.datepicker.dates['nl'] = {
                days: ["Zondag", "Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag", "Zaterdag", "Zondag"],
                daysShort: ["Zo", "Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"],
                daysMin: ["Zo", "Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"],
                months: ["Januari", "Februari", "Maart", "April", "Mei", "Juni", "Juli", "Augustus", "September", "Oktober", "November", "December"],
                monthsShort: ["Jan", "Feb", "Mrt", "Apr", "Mei", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dec"],
                today: "Vandaag",
                clear: "Wissen",
                weekStart: 1,
                format: "dd-mm-yyyy"
            };
        },

        postCreate: function() {
            var id = this.id + "_cal";
            var div = dom.create('div', { 'id': id });
            this.domNode.appendChild(div);
            this.selector = '#' + id + ' input';
            if (this.displaytype === "range" && (this.dateattrto === null || this.dateattrto === undefined || this.dateattr === this.dateattrto)) {
                this.displaytype = "textinput";
                logger.debug("range without second date attribute provided: fallback to text input");
            }
            var ro = this.readonly ? { readonly: 'true' } : {};
            switch (this.displaytype) {
                case "textinput":
                    this.selector = '#' + id + ' input';
                    div.appendChild(dom.create('input', $.extend({ 'class': 'form-control', 'type': 'text' }, ro)));
                    break;
                case "component":
                    this.selector = '#' + id + ' .input-group.date';
                    var groupdiv = div.appendChild(dom.create('div', { 'class': 'input-group date' }));
                    groupdiv.appendChild(dom.create('input', $.extend({ 'class': 'form-control', 'type': 'text' }, ro)));
                    var span = dom.create('span', { 'class': 'input-group-addon' });
                    groupdiv.appendChild(span);
                    span.appendChild(dom.create('i', { 'class': 'glyphicon glyphicon-th' }));
                    break;
                case "embedded":
                    this.selector = '#' + id + ' .div';
                    div.appendChild(dom.create('div', { 'class': 'embedded', 'data-date': "12/03/2012" }));
                    break;
                case "range":
                    this.selector = '#' + id + ' .input-daterange';
                    var rangediv = div.appendChild(dom.create('div', { 'class': 'input-daterange input-group', 'id': 'datepicker' }));
                    rangediv.appendChild(dom.create('input', $.extend({ 'class': 'input-sm form-control', 'type': 'text', 'name': 'start', 'id': 'startTime' }, ro)));
                    rangediv.appendChild(dom.create('span', { 'class': 'input-group-addon' }, this.totext || "To"));
                    rangediv.appendChild(dom.create('input', $.extend({ 'class': 'input-sm form-control', 'type': 'text', 'name': 'end', 'id': 'endTime' }, ro)));
                    break;
            }

        },

        getLocale: function() {
            if (kernel) {
                return kernel.locale;
            }
            return mx.ui.getLocale();
        },

        dateChanged: function(ev) {
            logger.debug('datechanged', ev);
            var d = new Date(ev.date);
            if (this._contextObj && ev.type == "changeDate" && ev.date && (!isNaN(d.getTime())) && (d.getYear() > 0)) {
                ev.date.setHours(this.defaulthours);
                // second field for range?
                if (ev.target.attributes.name && ev.target.attributes.name.value == "end" && this.dateattrto) {
                    this._contextObj.set(this.dateattrto, ev.date);
                } else {
                    logger.debug('set date', ev.date);
                    this._contextObj.set(this.dateattr, ev.date);
                }
                this.callmf();
            }
        },

        callmf: function() {
            if (this.mfToExecute) {
                mx.data.action({
                    params: {
                        applyto: 'selection',
                        actionname: this.mfToExecute,
                        guids: [this._contextObj.getGuid()]
                    },
                    callback: function(obj) {},
                    error: function(error) {
                        logger.debug(this.id + ': An error occurred while executing microflow: ' + error.description);
                    }
                }, this);
            }
        },

        update: function(obj, callback) {
            var locale = this.getLocale();
            logger.debug('btdatepicker', btdatepicker, locale);
            logger.debug('$', $.fn.datepicker);
            this.dp = $(this.selector).datepicker({
                language: locale,
                calendarWeeks: this.calendarweeks,
                weekStart: this.weekstart,
                todayBtn: this.todaybutton === true ? "Linked" : false,
                clearBtn: this.clearbutton,
                autoclose: this.autoclose,
                daysOfWeekDisabled: this.daysofweekdisabled,
                todayHighlight: this.todayhighlight,
                startDate: this.limitstart,
                endDate: this.limitend,
                enableOnReadonly: false
            }).on('changeDate', dojo.hitch(this, this.dateChanged));
            logger.debug('update');
            if (this._contextObj != obj) {
                this._contextObj = obj;
                this.resetSubscriptions();
            }
            this._updateRendering(obj);

            if (callback) {
                callback();
            }
        },

        _updateRendering: function() {
            var obj = this._contextObj;
            var date1 = obj.get(this.dateattr);
            var enabled = true;
            if (this.editableattr) {
                enabled = obj.get(this.editableattr);
            }
            if (enabled) {
                this.enable();
            } else {
                this.disable();
            }
            if (this.limitStartDate) {
                var newMin = new Date(obj.get(this.limitStartDate));
                this.dp.datepicker('setStartDate', newMin);
            }
            if (this.limitEndDate) {
                var newMax = new Date(obj.get(this.limitEndDate));
                this.dp.datepicker('setEndDate', newMax);
            }
            if (this.displaytype == "range" && this.dateattrto) {
                // undocumented feature to set start end: https://groups.google.com/forum/#!msg/bootstrap-datepicker/9q5n35QCpgg/sznmzU7-yaYJ
                if (date1) {
                    $(this.selector).find('#startTime').datepicker('update', new Date(date1));
                }
                var date2 = obj.get(this.dateattrto);
                if (date2) {
                    $(this.selector).find('#endTime').datepicker('update', new Date(obj.get(this.dateattrto)));
                }
                $(this.selector).data('datepicker').updateDates();
            } else {
                if (date1 != this.date1) {
                    $("#" + this.id).datepicker('update', new Date(date1));
                    this.date1 = date1;
                }
            }
            this._clearValidations();
        },

        enable: function() {
            if (!this.readonly) {
                this.enabled = true;
                $(this.selector).removeAttr("readonly");
                $(this.selector).add("readonly");
                domClass.remove(this.domNode, "btdatepicker-disabled");
            }
        },

        disable: function() {
            this.enabled = false;
            $(this.selector).attr("readonly", "true");
            domClass.add(this.domNode, "btdatepicker-disabled");
        },

        uninitialize: function() {
            if (this._handles) {
                this._handles.forEach(function(handle, i) {
                    if (handle) {
                        mx.data.unsubscribe(handle);
                    }
                });
            }
        },

        _handleValidation: function(validations) {
            this._clearValidations();

            var val = validations[0];
            var msg = val.getReasonByAttribute(this.dateattr);

            if (this.readOnly) {
                val.removeAttribute(this.dateattr);
            } else {
                if (msg) {
                    this._addValidation(msg);
                    val.removeAttribute(this.dateattr);
                }
            }
        },

        _clearValidations: function() {
            domConstruct.destroy(this._alertdiv);
        },

        _addValidation: function(msg) {
            this._alertdiv = domConstruct.create("div", {
                'class': 'alert alert-danger',
                innerHTML: msg
            });

            this.domNode.appendChild(this._alertdiv);
        },

        resetSubscriptions: function() {
            var objHandle = null,
                attrHandle = null,
                attrHandleTo = null,
                validationHandle = null,
                attrHandle2 = null;

            // Release handles on previous object, if any.
            if (this._handles) {
                this._handles.forEach(function(handle, i) {
                    mx.data.unsubscribe(handle);
                });
            }

            if (this._contextObj) {
                objHandle = this.subscribe({
                    guid: this._contextObj.getGuid(),
                    callback: lang.hitch(this, function(guid) {
                        this._updateRendering();
                    })
                });

                attrHandle = this.subscribe({
                    guid: this._contextObj.getGuid(),
                    attr: this.dateattr,
                    callback: lang.hitch(this, function(guid, attr, attrValue) {
                        logger.debug('update attr', new Date(attrValue), this.id, this.selector);
                        $("#" + this.id).datepicker('update', new Date(attrValue));
                        this.date1 = attrValue;
                        //this._updateRendering();
                    })
                });
                if (this.dateattrto) {
                    attrHandleTo = this.subscribe({
                        guid: this._contextObj.getGuid(),
                        attr: this.dateattrto,
                        callback: lang.hitch(this, function(guid, attr, attrValue) {
                            $(this.selector).find('#endTime').datepicker('update', new Date(attrValue));
                            logger.debug('update attr', attr, attrValue);
                            this._updateRendering();
                        })
                    });
                }
                if (this.editableattr) {
                    attrHandle2 = this.subscribe({
                        guid: this._contextObj.getGuid(),
                        attr: this.editableattr,
                        callback: lang.hitch(this, function(guid, attr, attrValue) {
                            if (attrValue) {
                                this.enable();
                            } else {
                                this.disable();
                            }
                        })
                    });
                }

                validationHandle = mx.data.subscribe({
                    guid: this._contextObj.getGuid(),
                    val: true,
                    callback: lang.hitch(this, this._handleValidation)
                });

                this._handles = [objHandle, attrHandle, validationHandle, attrHandle2, attrHandleTo];
            }
        }


    });
});