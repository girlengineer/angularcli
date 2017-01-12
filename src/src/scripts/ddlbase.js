var CM = CM || {};

(function($){
    var Table = CM.Table = function Table(el) {
        var $el    = $(el);
        var $thead = $('thead', $el);
        var $tbody = $('tbody', $el);
        var $rows  = $('tr', $tbody);
        var that   = this;
        this.init = function() {
            $('svg', $thead).attr('focusable', 'false');

            if (iOS) {
                _labelledbyConfig($el);
            }
            $('caption', $el).attr({'aria-live'  : 'polite',
                                    'aria-atomic': 'false'
                                  });
        }
        var _labelledbyConfig = function ($table) {
            var labelledbyText;
            var tableHeads = $table.find('th'); // Get all sortable table heads  
            var tableHeadsLength = tableHeads.length;
            var colHeadIDs = [];
            for (var i = 0; i < tableHeadsLength; i++) {
                if (tableHeads[i].id !== "" || tableHeads[i].id !== undefined || tableHeads[i].id !== NULL){
                    colHeadIDs.push(tableHeads[i].id);
                }
            }
            var $tds = $tbody.find('td');

            $tds.each(function () {
                var tdRole = this.getAttribute('role');

                if (tdRole === 'rowheader') {
                    labelledbyText = 'e-name';
                } else {
                    var $rowTds = $(this).closest('tr').first().find('td');
                    var index = $.inArray(this, $rowTds);
                    labelledbyText = colHeadIDs[index] + ' ' + $rowTds[0].id;
                }

                this.setAttribute('aria-describedby', labelledbyText);
            });
        }
    }
})(jQuery);
var CM = CM || {};

(function($){
    var TableSortable = CM.TableSortable = function TableSortable(el) {
        var $el    = $(el);
        var $thead = $('thead', $el);
        var $tbody = $('tbody', $el);
        var $rows  = $('tr', $tbody);
        var that   = this;
        var SORT_ORDERS  = {'up'     : 'ascending',
                            'down'   : 'descending',
                            'default': 'unsorted'};
        var CARAT_STATES = {'up'     : 'glyphicon glyphicon-triangle-top',
                            'down'   : 'glyphicon glyphicon-triangle-bottom',
                            'default': 'glyphicon glyphicon-triangle-right'};
        var sortOrder = SORT_ORDERS.default;
        this.init = function() {

            $tbody.attr('data-rows', $rows.length);
            $('.sortable', $el).on('click', _sortCol);
            $tbody.on('keydown', _keySortCol);
            $tbody.on('DOMSubtreeModified', function(e) {
                var $currentTbody = $(e.target);
                var $currentRows = $currentTbody.find('tr');
                if ($currentRows.length > Number($tbody.attr('data-rows'))) {
                    CM.TableSortable.methods.unsort($currentTbody.closest('table'));
                    $currentTbody.attr('data-rows', $currentRows.length)
                }
            });
        }
        CM.TableSortable.methods = {
            unsort: function ($tableEl) {
                $tableEl = ($tableEl instanceof jQuery) ? $tableEl: $($tableEl);
                var $sortedTh = $tableEl.find('.sorted');
                var $sortedBtn = $sortedTh.find('button');
                var $sortedSR = $sortedBtn.find('.sr-only');
                var $sortedArrow = $sortedBtn.find('.glyphicon');
                $tableEl.find('.captionUpdated').html('');
                $sortedTh.attr('aria-sort', 'none').removeClass('sorted');
                $sortedBtn.attr('data-title', 'unsorted');
                $sortedSR.html('Sort by ascending');
                $sortedArrow.attr('data-sort', 'unsorted').removeClass('glyphicon-triangle-top glyphicon-triangle-bottom').addClass('glyphicon-triangle-right');
                $tableEl.trigger('sort:reset');
                
            }
        }
        var _sortCol = function(e) {
            e.preventDefault();
            _updateSortOrder(this);
            
            var $tbody = $('tbody', $el);
            var $rows = $('tr', $tbody);
            var $captionUpdated = $('.captionUpdated', $el);
            var $screenReaders = $el.siblings('.liveForScreenReaders');

            var $allCols = $('th', $el);
            var $this = $(this);
            var lastSorted = $('.sorted-last', $el);
            var items = [];
            var sortType = this.getAttribute('data-sort');            
            var sortType2 = lastSorted.attr('data-sort');
            var thisIndex = $.inArray(this, $allCols);
            var thisIndex2 = $.inArray(lastSorted[0], $allCols);
            if (e.type === 'click') {
                $(e.currentTarget).find('button').focus();
            }

            $rows.each(function() {
                var item = {};
                var $tds = $('td', this);
                var $td = $($tds[thisIndex]);
                var $td2 = $($tds[thisIndex2]);

                item.tr = this;
                item.val = $td.text();
                item.val2 = $td2.text() == "" ? "0" : $td2.text();
                item.sort = sortType;
                item.sort2 = sortType2;
                items.push(item);
            });

            var itr = typeof(sortType2) == 'undefined' ? 1 : 2;
            while (itr > 0) {
                var whichVar = "val";
                var whichSort = sortType;
                if (itr == 2) {
                    whichVar = "val2";
                    whichSort = sortType2;
                }

                if (!whichSort || whichSort === 'text' || whichSort === 'standard') {
                    items = _textSort(items, whichVar);
                }
                else if (whichSort === 'date') {
                    items = _dateSort(items, whichVar);
                }
                else if (whichSort === 'numeric') {
                    items = _numericSort(items, whichVar);
                }
                $rows.remove();
                for (var i = 0; i < items.length; i++) {
                    $tbody.append(items[i].tr);
                }

                itr--;
            }
            $tbody.attr('aria-live', 'assertive').attr('aria-atomic', 'true');
            var sortedLastBtn = lastSorted.find('[role=button]');
            var updatedMessage = 'Sorted by ' + $this.find('[role=button]').attr('data-sort-criteria');
            if (sortedLastBtn.length > 0) {
                updatedMessage = updatedMessage + ' then ' + sortedLastBtn.attr('data-sort-criteria');
            }
            updatedMessage = ' (' + updatedMessage + ': ' + sortOrder + ')';
            $captionUpdated.text(updatedMessage);
            $screenReaders.text(updatedMessage);
            var buttonMessage = '';
            if (sortOrder === SORT_ORDERS.default) {
                buttonMessage = SORT_ORDERS.up;
            }
            if (sortOrder === SORT_ORDERS.up) {
                buttonMessage = SORT_ORDERS.down;
            }
            if (sortOrder === SORT_ORDERS.down) {
                buttonMessage = SORT_ORDERS.up;
            }
            $this.find('.sr-only').text('Sorted by '+ sortOrder +' activate to sort by '+ buttonMessage + '');
            $('tbody','.sortable-table').attr({'aria-live':'none', 'aria-atomic': 'false'});
            setTimeout(function() {
                $screenReaders.html('');
            }, 1000);
        }

        var _keySortCol = function(e) {
            if (e.which === 13 || e.which === 32) {
                this.click();
            }
        }

        var _updateSortOrder = function(el) {
            var $th    = $(el);
            var $carat = $('.glyphicon', $th);
            var order = SORT_ORDERS.default;
            var caratClass = CARAT_STATES.default;

            if ($carat.attr('data-sort') === SORT_ORDERS.up) { // Ascending -> Descending
                caratClass = CARAT_STATES.down;
                $carat.attr('data-sort', SORT_ORDERS.down);
                $carat.attr('class', caratClass);
                $carat.parent().attr('data-title', 'sort ' + SORT_ORDERS.down);
                order = SORT_ORDERS.down;
            }
            else { // No Sort -> Ascending || Descending -> Ascending
                caratClass = CARAT_STATES.up;
                $carat.attr('data-sort', SORT_ORDERS.up);
                $carat.attr('class', caratClass);
                $carat.parent().attr('data-title', 'sort ' + SORT_ORDERS.up);
                order = SORT_ORDERS.up;
            }

            $th.removeClass('sorted-last');
            $th.siblings().each(function () {
                var sibling = $(this);

                if ( !$th.hasClass('sorted') ) {
                    sibling.removeClass('sorted-last');
                }
                if ( sibling.hasClass('sorted') ) {
                    sibling.addClass('sorted-last');
                }
                console.log(caratClass);
                sibling
                .attr('aria-sort', 'none')
                .removeClass('sorted')
                .find('.glyphicon')
                .attr("data-sort", SORT_ORDERS.default)
                .attr('class', CARAT_STATES.default)
                .parent().attr(titleAttr, SORT_ORDERS.default);
                $('.sorted-last')
                    .attr('aria-sort', order)
                    .find('.glyphicon')
                    .attr('class', caratClass)
                    .attr('data-sort', order);

            });

            $th.attr('aria-sort', order)
            .addClass('sorted');

            sortOrder = order;
        }

        var _textSort = function(arr, vVal) {
            for (var i = 0; i < arr.length; i++) {
                var toCompare = arr[i];
                var compVal = toCompare[vVal].toLowerCase();

                if (sortOrder === SORT_ORDERS.up) {
                    for (var j = i; j > 0 && compVal < arr[j - 1][vVal].toLowerCase(); j--) {
                        arr[j] = arr[j - 1];
                    }
                }
                else {
                    for (var j = i; j > 0 && compVal > arr[j - 1][vVal].toLowerCase(); j--) {
                        arr[j] = arr[j - 1];
                    }
                }
                arr[j] = toCompare;
            }
            return arr;
        }
        var _formatDate = function(dateString) {
            var formattedDate = new Date(dateString);
            return formattedDate.getTime();
        }
        var _dateSort = function(arr, vVal) {
            for (var i = 0; i < arr.length; i++) {
                var toCompare = arr[i];
                var compVal = _formatDate(toCompare[vVal]);

                if (sortOrder === SORT_ORDERS.up) {
                    for (var j = i; j > 0 && compVal < _formatDate(arr[j - 1][vVal]); j--) {
                        arr[j] = arr[j - 1];
                    }
                }
                else {
                    for (var j = i; j > 0 && compVal > _formatDate(arr[j - 1][vVal]); j--) {
                        arr[j] = arr[j - 1];
                    }
                }
                arr[j] = toCompare;
            }
            return arr;
        }

        var _numericSort = function(arr, vVal) {
            for (var i = 0; i < arr.length; i++) {
                var toCompare = arr[i];
                var compVal = toCompare[vVal].replace(/[^0-9.]/g , '');

                if (sortOrder === SORT_ORDERS.up) {
                    for (var j = i; j > 0 && compVal < Number(arr[j - 1][vVal].replace(/[^0-9.]/g , '')); j--) {
                        arr[j] = arr[j - 1];
                    }
                }
                else {
                    for (var j = i; j > 0 && compVal > Number(arr[j - 1][vVal].replace(/[^0-9.]/g , '')); j--) {
                        arr[j] = arr[j - 1];
                    }
                }
                arr[j] = toCompare;
            }
            return arr;
        }

    }
})(jQuery);
var CM = CM || {};

(function($){
    var TableInput = CM.TableInput = function TableInput(el) {
        var $el    = $(el);
        var $thead = $('thead', $el);
        var $tbody = $('tbody', $el);
        var $rows  = $('tr', $tbody);
        var that   = this;
        this.init = function() {
            $('.record_table tr', $el).on('click', _clickInput);
            $("input[type='checkbox']", $el).on('change', _changeHighlightRow);
            $("input[type='radio']", $el).on('change', _changeHighlightRow);
        }

        this.impValueCheck = function() {
            var values = $(".record_table input[name=check]:checked", $el).map(function(){
                row = $(this).closest("tr");
                return { 
                    date    : $(row).find("td[class=date]").text(),
                    payee   : $(row).find("td[class=name]").text(),
                    amount  : $(row).find("td[class=monetary]").text(),
                    checkbox: $(row).find('input[type=checkbox]:checked').val() || "not selected"       
                }
            }).get();
        }

        this.impValueRadio = function(){
            var values = $(".record_table input[name=optRadio]:checked", $el).map(function(){
                row = $(this).closest("tr");
                return { 
                    date  : $(row).find("td[class=date]").text(),
                    payee : $(row).find("td[class=name]").text(),
                    amount: $(row).find("td[class=monetary]").text(),
                    radio : $(row).find('input[type=radio]:checked').val() || "not selected"       
                }
            }).get();
        }
        var _clickInput = function(e) {
            if (e.target.type !== 'checkbox' && e.target.type !== 'radio') {
                $(':checkbox', this).trigger('click');
                $(':radio', this).trigger('click');
            }
        }

        var _changeHighlightRow = function(e) {
            if ($(this).is(":radio:checked")) {
                $(this).closest('tr').addClass("highlight_row").siblings('tr').removeClass("highlight_row");
                that.impValueRadio();
            }else if ($(this).is(":checkbox:checked")) {
                $(this).closest('tr').addClass("highlight_row");
                that.impValueCheck();
            }else {
                $(this).closest('tr').removeClass("highlight_row");
            }
        }
    }
})(jQuery);
var CM = CM || {};

(function($) {

    var ExpandCollapse = CM.ExpandCollapse = function ExpandCollapse(el) {
        $el = $(el);
        $toggleContainer = $('.ec-toggle', $el);
        $toggleLink = $('a', $toggleContainer);
        $bodyContainer = $('.ec-body', $el);
        this.init = function() {
            instanceName = $(el).attr('name');
            if (typeof instanceName == typeof undefined || instanceName == false) {
                instanceName = _generateRandomInstanceName();
                $(el).attr('name', instanceName);
            }
            $($el).prepend('<a name="' + instanceName + '" class="ec-anchor" aria-hidden="true">Anchor</a> ');

            $($toggleLink).data('ec-name', instanceName);

            $($toggleLink)
                .attr('id', instanceName + '-toggle')
                .attr('data-toggle', 'collapse')
                .attr('data-target', '#' + instanceName)
                .attr('href', '#' + instanceName)
                .attr('aria-controls', instanceName);

            if ($(el).attr('data-scroll-on-toggle') == "true") {
                $($toggleLink).data('ec-scroll-on-toggle', true);
            }

            $($bodyContainer)
                .attr('data-expand-collapse-id', instanceName)
                .attr('aria-labelledby', $toggleLink.attr('id'));
            isExpanded = $($toggleLink).attr('aria-expanded');
            if (typeof isExpanded == typeof undefined || isExpanded == false) {
                isExpanded = false;
                $($toggleLink).attr('aria-expanded', 'false');
            } else {
                isExpanded = (isExpanded.toLowerCase() === 'true');
            }
            var classesForBodyContainer = 'collapse';
            if (isExpanded) {
                classesForBodyContainer += " in"
            };
            $($bodyContainer).addClass(classesForBodyContainer);

            $($bodyContainer).collapse({
                toggle: false
            });
            $(document).off('click.bs.collapse.data-api', '[data-toggle="collapse"]');
            $(document).on('click.bs.collapse.data-api', '[data-toggle="collapse"]', function(e) {
                var $target = $('.ec-body[data-expand-collapse-id="' + $(this).data('ec-name') + '"]');
                if ($(this).data('ec-scroll-on-toggle')) {
                    if ($($target).hasClass('in')) {
                        e.preventDefault();
                    }
                } else {
                    e.preventDefault();
                }

                $target.collapse('toggle');
            });
        }
        var _generateRandomInstanceName = function() {
            var uniqueName = "ec-" + Math.random().toString(36).substr(2, 9);
            return uniqueName;
        }
    }
})(jQuery);

var CM = CM || {};

(function($){
    var Accordion = CM.Accordion = function Accordion(el) {
        var el = $(el);
        var accordion = this;
        var accordionTitles = $('ul:first-of-type > li > .category', el);
        var accordionHeaders = $('.category, .form-summary, .content-summary', el);
        var accordionControls = $('[aria-controls]', el);
        var toggleAll = $('.toggle-accordion', el);
        var tabsList = el.siblings('.nav-tabs');
        this.init = function() {
        };

        this.panel = {
            tabsList: tabsList,
            preventScroll: (el.filter('[data-prevent-auto-scroll=true]').length > 0) ? true : false,
            alwaysOpen: (el.filter('[data-always-open-panel=true]').length > 0) ? true : false,
            isMultiselectable: (el.find('[aria-multiselectable=true]').length > 0) ? true : false,
            collapse: function (accordionItems, willExpand) {
                var currentAccordion = this;
                var willExpand = willExpand || false;
                accordionItems.each(function () {
                    if (!currentAccordion.alwaysOpen || (currentAccordion.alwaysOpen && willExpand) ) {
                        var accordionItem = $(this);
                        var panelSummary = accordionItem.find('.form-summary');
                        var accordionControl = accordionItem.find('[aria-controls]');
                        var accordionPanel = $('#'+accordionControl.attr('aria-controls'));

                        accordionItem.removeClass('is-expanded');
                        accordionControl.attr('aria-expanded', 'false').attr('data-title', 'Select to show').attr('aria-selected','false');
                        accordionPanel.attr('aria-hidden', 'true');
                        if (panelSummary.hasClass('.is-verified')) {
                            panelSummary.attr('aria-hidden', 'false');
                        }
                    }
                });
                if (accordionItems.length === 1) {
                    this.checkAll(accordionItems);
                }
            },
            expand: function (accordionItems, fromTabs) {
                var currentAccordion = this;
                accordionItems.each(function () {
                    var accordionItem = $(this);
                    var accordionControl = accordionItem.find('[aria-controls]');
                    var accordionPanel = $('#'+accordionControl.attr('aria-controls'));
                    var expandedPanels = accordionItem.closest('.accordion').find('.is-expanded');
                    if (!currentAccordion.isMultiselectable) {
                        currentAccordion.collapse(expandedPanels, true);
                    }

                    accordionItem.addClass('is-expanded');
                    if (accordionControl.attr('tabindex') === undefined) {
                        accordionControl.attr('tabindex', '0');
                    }
                    accordionControl.attr('aria-expanded', 'true').attr('data-title', 'Select to hide').attr('aria-selected','true');
                    accordionPanel.attr('aria-hidden', 'false');
                    if (!fromTabs && currentAccordion.tabsList.length > 0) {
                        currentAccordion.changeTab(accordionControl);
                    }
                });
                if (accordionItems.length === 1) {
                    this.checkAll(accordionItems);
                    if (!currentAccordion.preventScroll && !currentAccordion.tabsList.is(':visible')) {
                        window.setTimeout(function () {
                             $('body').animate({ scrollTop: accordionItems.find('[aria-controls]').offset().top });
                        },800);
                    }
                }
            },
            toggle: function (accordionItem) {
                if (accordionItem.hasClass('is-expanded')) {
                    accordion.panel.collapse(accordionItem);
                } else {
                    accordion.panel.expand(accordionItem);
                }
            },
            toggleAll: function (toggleBtn) {
                var accordionState = toggleBtn.getAttribute('data-accordion-state') || 'collapse';
                var allAccordionItems = $(toggleBtn).closest('.accordion').find('.level1');
                var toggleStr = toggleBtn.getAttribute('data-toggled-copy') || accordionState.charAt(0).toUpperCase() + accordionState.slice(1) + ' All Sections';
                if (accordionState === 'collapse') {
                    accordionState = 'expand';
                } else {
                    accordionState = 'collapse';
                }
                accordion.panel[accordionState](allAccordionItems);

                toggleBtn.setAttribute('data-toggled-copy', toggleBtn.innerHTML);
                toggleBtn.setAttribute('data-accordion-state', accordionState);
                toggleBtn.innerHTML = toggleStr;
            },
            checkAll: function (accordionItem) {
                var currentAccordion = accordionItem.closest('.accordion');
                var toggleBtn = currentAccordion.find('.toggle-accordion');
                if (toggleBtn.length > 0) {
                    var allAccordions = currentAccordion.find('.level1');
                    var allExpanded = currentAccordion.find('.is-expanded');
                    var accordionState = toggleBtn.attr('data-accordion-state');

                    if ((allAccordions.length === allExpanded.length && accordionState === 'collapse') || (allExpanded.length === 0 && accordionState === 'expand')) {
                        this.toggleAll(toggleBtn[0]);
                    }
                }
            },
            changeTab: function (accordionControl) {
                console.log('tabbly');
                var currentAccordion = this;
                var activeItem = currentAccordion.tabsList.find('.active');
                var desiredActiveTab = $('#'+accordionControl.attr('id')+'-tab');
                activeItem.removeClass('active').find('a').attr('aria-selected', 'false').attr('aria-expanded', 'false');
                desiredActiveTab.attr('aria-selected', 'true').attr('aria-expanded', 'true').closest('li').addClass('active');
            }
        };
        accordionHeaders.on('click', function (e) {
            var currentTarget = $(e.currentTarget);
            var accordionItem = currentTarget.closest('.parent');
            if (currentTarget.hasClass('content-summary') && accordionItem.hasClass('is-expanded')) {
                return false;
            } else if (!currentTarget.hasClass('.category')) {
                currentTarget = accordionItem.find('.category');
            }
            if ((currentTarget.is('[aria-controls]') || currentTarget.find('[aria-controls]').length > 0) && !accordionItem.hasClass('is-unselectable')) {
                accordion.panel.toggle(accordionItem);
            }
        });
        accordionControls.on('keydown', function (e) {
            var accordionItem = $(e.currentTarget).closest('.parent');
            if (!accordionItem.hasClass('is-unselectable')) {
                switch(e.keyCode){
                    case 13: //enter
                    e.preventDefault();
                    accordion.panel.toggle(accordionItem);
                    break;
                    case 32: //space
                    e.preventDefault();
                    accordion.panel.toggle(accordionItem);
                    break;
                    case 40: //down arrow
                    e.preventDefault();
                    _focusNextHeader(accordionItem);
                    break;
                    case 39: // right arrow
                    e.preventDefault();
                    _focusNextHeader(accordionItem);
                    break;
                    case 38: // up arrow
                    e.preventDefault();
                    if (e.ctrlKey) {
                        _focusFirstHeader(accordionItem);
                    } else {
                        _focusPreviousHeader(accordionItem);
                    }
                    break;
                    case 37: // left arrowcone.preventDefault();
                    _focusPreviousHeader(accordionItem);
                    break;
                }
            }
        });
        toggleAll.on('click', function (e) {
            accordion.panel.toggleAll(e.currentTarget);
            e.preventDefault();
        });
        if (tabsList.length > 0) {  
            tabsList.find('li').on('click', function (e) {
                var panelId = $(e.currentTarget).find('a').attr('data-parent');
                accordion.panel.expand($(panelId).closest('.tab-pane'), true);
            });
            tabsList.on('keyup', function (e) {
                var panelId = tabsList.find('.active > a').attr('data-parent');
                accordion.panel.expand($(panelId).closest('.tab-pane'), true);
            });
        }
        _focusFirstHeader = function (accordionItem) {
            var desiredItem = accordionItem.parent().first('.level1');
            if (desiredItem.length > 0) {
                desiredItem.find('[aria-controls]').focus();
            }
        };
        _focusPreviousHeader = function (accordionItem) {
            var desiredItem = accordionItem.prev();
            if (desiredItem.length > 0) {
                desiredItem.find('[aria-controls]').focus();
            }
        };
        _focusNextHeader = function (accordionItem) {
            var desiredItem = accordionItem.next();
            if (desiredItem.length > 0) {
                desiredItem.find('[aria-controls]').focus();
            }
        };
    }
})(jQuery);
var CM = CM || {};

(function($){
    var AccordionForm = CM.AccordionForm = function AccordionForm(el) {
        var $el = $(el);
        this.init = function() {
            var nextBtns = $('.next-step', $el);
            var prevBtns = $('.previous-step', $el);
            prevBtns.on('click', function (e) {
                e.preventDefault();
                var accordionItem = $(e.currentTarget).closest('.parent');
                var sectionHeader = accordionItem.find('.category');
                window.setTimeout(function () {
                    var prevHeader = accordionItem.prev().find('.category');
                    prevHeader.click();
                    prevHeader.find('[tabindex]').focus();
                },500);
            });

        }

        CM.AccordionForm._updateOutput = function(e) {
            e.preventDefault();
            var accordionItem = $(e.currentTarget).closest('.parent');
            var sectionHeader = accordionItem.find('.category');
            var nextAccordionItem = accordionItem.next();
            var panelSummary = accordionItem.find('.form-summary');
            var formInput = $('input, select, label', accordionItem);
            var values = {};
            if (accordionItem.find('.validation-message-danger').length === 0) {

                formInput.each(function() {
                    var inputEl = $(this);
                    var key = inputEl.attr('id');
                    var value = inputEl.val();

                    if (inputEl.is('select')) {
                        value = $('option:selected:not(:first-child)', this).text();
                    } else if (inputEl.is('label')) {
                        if (inputEl.is('[data-output-value]')) {
                            value = inputEl.attr('data-output-value');
                        } else {
                            value = inputEl.html();
                        }
                    }

                    values[key] = value;
                });

                panelSummary.addClass('is-verified');

                for (currentKey in values) {
                    var prefix = '';
                    var suffix = '';
                    var dataDest = panelSummary.find('[data-input-value='+currentKey+']');
                    if (dataDest.length > 0 && values[currentKey] !== '') {
                        if (dataDest.is('[data-suffix],[data-prefix]')) {
                            prefix = dataDest.attr('data-prefix') || '';
                            suffix = dataDest.attr('data-suffix') || '';
                        }
                        dataDest.html(prefix+values[currentKey]+suffix);
                    }
                }



                nextAccordionItem.removeClass('is-unselectable');
                window.setTimeout(function () {
                    nextAccordionItem.find('.category').click();
                    if (nextAccordionItem.length > 0) {
                        window.setTimeout(function () {
                            nextAccordionItem.find('input:first, select:first, button:first').first().focus();
                        },800);
                    } else {
                        sectionHeader.find('[tabindex]').focus();
                    }
                    if (nextAccordionItem.length == 0) {
                        sectionHeader.click();
                        sectionHeader.closest('fieldset').next().find('input, button, a').focus();
                    }
                },500);

            }

        }
    }
})(jQuery);
var CM = CM || {};

(function($){

    var Slider = CM.Slider = function Slider(el, options) {
        var $el      = $(el);
        var that     = this;
        var defaults = {
            create: function(event, ui) {
                that.uiBindInputEvents(event);
                that.uiInitalizeHandles(event);
                that.uiBindTouchEvents(event);
            },
            slide: function(event, ui){
                that.updateInput(event, ui);
            }
        };
        var settings = $.extend({}, defaults, options);
        var sliderAccepts = [
            'animate',
            'disabled',
            'max',
            'min',
            'orientation',
            'range',
            'step',
            'value',
            'values'
        ];
        this.init = function() {
            if (!$el.hasClass('custom')){
                var sliderFields = $el.closest('.row').prev().find('[data-slider]');
                $.each(sliderFields[0].attributes, function (idx, val) {
                    var simpleAttrName = String(val.nodeName);
                    if (sliderAccepts.indexOf(simpleAttrName) !== -1) {
                        if (isNaN(val.nodeValue)) {
                            if (val.nodeValue === 'true' || val.nodeValue === 'false') {
                                settings[simpleAttrName] = Boolean(val.nodeValue)
                            } else {                                
                                settings[simpleAttrName] = String(val.nodeValue);
                            }
                        } else {
                            settings[simpleAttrName] = Number(val.nodeValue)
                        }
                    }
                });
                if (sliderFields.length > 1) {
                    settings['range'] = true;
                    settings['values'] = [Number(sliderFields[0].getAttribute('value')), Number(sliderFields[1].getAttribute('value'))];
                }
                $el.slider(settings);
            }
        }
        this.updateInput = function(event, ui) {
            var querySelector = 'input';
            if (ui.values) {
                querySelector = '[data-slider='+ui.handle.getAttribute('data-handle')+']';
            }
            $(ui.handle).attr({
                'aria-valuenow': ui.value,
                'aria-valuetext': ui.value
            });
            $(ui.handle).closest('.row').prev().find(querySelector).attr({
                'aria-valuenow': ui.value,
                'aria-valuetext': ui.value
            }).val(ui.value);
        }
        this.updateSliderHandle = function (updatedVal, slider, handle) {
            var uiSlider = $(slider);
            var handles = uiSlider.find('.ui-slider-handle');
            if (handle === 'max') {
                handles.last().attr({
                    'aria-valuenow': updatedVal,
                    'aria-valuetext': updatedVal
                });
                uiSlider.slider('values', [uiSlider.slider('values')[0], updatedVal]);
            } else if (handle === 'min') {
                handles.first().attr({
                    'aria-valuenow': updatedVal,
                    'aria-valuetext': updatedVal
                });
                uiSlider.slider('values', [updatedVal, uiSlider.slider('values')[1]]);
            } else {
                handles.attr({
                    'aria-valuenow': updatedVal,
                    'aria-valuetext': updatedVal
                });
                uiSlider.slider('value', updatedVal);
                handles.removeAttr('data-position');
            }
        }
        this.touchSlide = function (handleEl, sliderEl, e) {
            e.preventDefault();
            var handle = {};
            handle.el = handleEl || e.target;
            handle.pos = handle.el.getAttribute('data-position');
            var currentPosX = e.originalEvent.touches[0].clientX;
            if (handle.pos !== null) {
                var updatedVal = 0;
                handle.which = (handle.el.getAttribute('data-handle') === 'min') ? 0 : 1;
                var slider = {}
                slider.el = sliderEl || $(handleEl).closest('.slider');
                slider.width = slider.el.innerWidth();
                slider.step = slider.el.slider('option','step');
                slider.values = slider.el.slider('option','values') || slider.el.slider('option','value');

                slider.limits = [slider.el.slider('option','min'),slider.el.slider('option','max')];
                var pointsDiff = Math.abs(slider.limits[0] - slider.limits[1])*((currentPosX - handle.pos)/slider.width);
                if (slider.values.length > 1) {

                    updatedValues = $.extend([], slider.values, false);
                    var unroundedValue = Number(handle.el.getAttribute('data-unrounded')) || slider.values[handle.which];
                    updatedValues[handle.which] = unroundedValue+pointsDiff;
                    if (handle.which === 0) {
                        if (updatedValues[handle.which] < slider.limits[0]) {
                            updatedValues[handle.which] = slider.limits[0];
                        } else if (updatedValues[handle.which] > slider.values[1]) {
                            updatedValues[handle.which] = slider.values[1];
                        } else {
                            handle.el.setAttribute('data-position', currentPosX);
                            handle.el.setAttribute('data-unrounded', updatedValues[handle.which]);
                        }
                    } else if (handle.which === 1) {
                        if (updatedValues[handle.which] > slider.limits[1]) {
                            updatedValues[handle.which] = slider.limits[1];
                        } else if (updatedValues[handle.which] < slider.values[0]) {
                            updatedValues[handle.which] = slider.values[0];
                        } else {
                            handle.el.setAttribute('data-position', currentPosX);
                            handle.el.setAttribute('data-unrounded', updatedValues[handle.which]);
                        }
                    }
                    if (updatedValues[handle.which] !== slider.values[handle.which]) {
                        updatedValues[handle.which] = Math.round(updatedValues[handle.which] / slider.step) * slider.step;
                        slider.el.slider('values',updatedValues);
                        that.updateInput(e, {handle:handle.el, value: updatedValues[handle.which], values: slider.el.slider('option','values')});
                    }
                } else {
                    updatedValues = slider.values;
                    var unroundedValue = Number(handle.el.getAttribute('data-unrounded')) || slider.values;
                    updatedValues = unroundedValue+pointsDiff;
                    if (updatedValues > slider.limits[1]) {
                        updatedValues = slider.limits[1];
                    } else if (updatedValues < slider.limits[0]) {
                        updatedValues = slider.limits[0];
                    } else {
                        handle.el.setAttribute('data-position', currentPosX);
                        handle.el.setAttribute('data-unrounded', updatedValues);
                    }
                    if (updatedValues !== slider.values) {
                        updatedValues = Math.round(updatedValues / slider.step) * slider.step;
                        slider.el.slider('value',updatedValues);
                        that.updateInput(e, {handle:handle.el, value: updatedValues});
                    }
                }


            } else {
                handle.el.setAttribute('data-position', currentPosX);
            }
        }
        this.uiBindInputEvents = function (event) {
            var currentSlider = $(event.target);
            var sliderFields = currentSlider.closest('.row').prev().find('[data-slider]');
            sliderFields.on('input', function (e) {
                window.setTimeout(function() {
                    that.updateSliderHandle(e.target.value, event.target, e.currentTarget.getAttribute('data-slider'));
                }, 5 );
            });
        }
        this.uiInitalizeHandles = function (event) {
            var currentSlider = $(event.target);
            var sliderHandles = currentSlider.find('.ui-slider-handle');
            var sliderFields = currentSlider.closest('.row').prev().find('[data-slider]');
            sliderHandles.each(function (idx, el) {
                var val = currentSlider.slider('value');
                var attrs = {
                    'role': 'slider',
                    'aria-labelledby': sliderFields[idx].getAttribute('id')
                }
                if (sliderHandles.length > 1) {
                    val = currentSlider.slider('values')[idx];
                    attrs['data-handle'] = (idx === 0) ? 'min' : 'max';
                }
                attrs['aria-valuenow'] = val;
                attrs['aria-valuetext'] = val;

                $(sliderHandles[idx]).attr(attrs).text(val);
            });
        }
        this.uiBindTouchEvents = function (event) {
            var currentSlider = $(event.target);
            var sliderHandles = currentSlider.find('.ui-slider-handle');
            sliderHandles.on('touchstart', function(e) {
                e.target.focus();
                that.touchSlide(e.target, currentSlider, e);
            })
            .on('touchmove', function(e) {
                that.touchSlide(e.target, currentSlider, e);
            })
            .on('touchend', function(e) {
                e.target.removeAttribute('data-position');
            });
        }
        var _setSliderTicks = function() {
            var max =  $el.slider('option', 'max');    
            var min =  $el.slider('option', 'min');    
            var spacing =  100 / (max - min);

            $el.find('.ui-slider-tick-mark').remove();
            for (var i = 0; i < max-min+1 ; i++) {
                $('<span class="ui-slider-tick-mark"></span>').css('left', (spacing * i) +  '%').appendTo($el); 
            }
        }
    }

})(jQuery);
var CM = CM || {};

(function($){
    var InlineAddition = CM.InlineAddition = function InlineAddition(el) {
        var $el     = $(el);
        var $toggle = $('.inline-addition-toggle', $el);
        var $icon   = $('.icon-svg', $el);
        var that    = this;
        var state = 'hidden';
        this.init = function() {
            $toggle.on('click', _toggleVisible);
        }
        var _toggleVisible = function(e) {
        }
    }
})(jQuery);
$(function() {

    var DATEPICKER_MIN_DATE = '1900-01-01';
    var DATEPICKER_MAX_DATE = '9999-12-31';

    var _suppressFocusShow = false; //suppress behaviour where datepicker shows on input focus
    var _isClosed = true;
    var _isAndroidMobile = isAndroidMobile();
    var _isIOSMobile = isIOSMobile();
    $('.datepicker').datepicker({
        showOn: 'button',
        buttonImage: '/images/icons/svgs/calender/cal_icon.svg',
        buttonImageOnly: false,
        buttonText: 'Date Picker',
        dayNamesShort: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        dayNamesMin: ["S", "M", "T", "W", "T", "F", "S"],
        dateFormat: "DD MM d, yy",
        showButtonPanel: true,
        closeText: 'Close',
        showOn: 'button', //show dp on 'both' focus of input and click of icon
        beforeShow: function(input, picker) {

            if (_suppressFocusShow) {
                return false;
            }

            _isClosed = false;

            configureDatepicker($(input), $(picker.dpDiv)); //pass refs to specific input and dp
            suppressInputFocus($(input), 500);

        },
        onClose: function(dateText, picker) {

            _isClosed = true;

            var input = $(this);
            var dp = $(picker.dpDiv);

            removeAria();
            closeCalendar(input, dp); //pass refs to specific input and dp
            input.prop("readonly", false);
        },
        onSelect: function(dateText, picker) {
        },
        onChangeMonthYear: function(year, month, picker) {
            suppressInputFocus($(this), 500);
        }
    });

    initDatepickers(); // ** ENTRY POINT ** Initialize all date pickers 

    function initDatepickers() {

        if (_isIOSMobile || _isAndroidMobile) {
            $('.input-group.datepicker-group').addClass('mobile'); //allows css to control avail of pointer events etc.
        } else {
            $('input[type="date"]').attr('type', 'text'); //do not use native datepicker unless mobile
        }
        $('.ui-datepicker-trigger').attr('aria-describedby', 'datepickerLabel');
        $('.ui-datepicker-trigger').addClass('input-group-addon');
        var input = $('input.datepicker');
        if (!input.length) {
            return false;
        }

        var dateFormat = input.attr('data-date-format');
        var prepopulateDate = null;
        var requestedDateStr = '';

        input.each(function(idx, element) {

            var _input = $(this);
            requestedDateStr = new Date(_input.attr('data-populate-date'));
            if (_isIOSMobile || _isAndroidMobile) {
                dateFormat = 'yy-mm-dd'; //without this format input will not take the date
            }
            if (typeof dateFormat != "undefined") {
                _input.datepicker('option', 'dateFormat', dateFormat);
            }
            prepopulateDate = $.datepicker.formatDate(dateFormat, requestedDateStr);

            if (!isValidDate(requestedDateStr)) {
                prepopulateDate = $.datepicker.formatDate(dateFormat, new Date());
            }
            _input.attr('min', DATEPICKER_MIN_DATE);
            _input.attr('max', DATEPICKER_MAX_DATE);
            _input.val(prepopulateDate);
        })
        $('button.ui-datepicker-trigger').attr("aria-role", "button").attr("aria-label", "pick date using calendar");
        onSelectDate(input.val());
    }

    function configureDatepicker(input, dp) {

        if (!input || !dp) {
            throw new Error("input & dp must be defined so we have something to configure");
        };

        setTimeout(function() {

            var today = dp.find('.ui-datepicker-today a')[0];

            if (!today) {
                today = dp.find('.ui-state-active')[0] ||
                    dp.find('.ui-state-default')[0];
            }
            $("main").attr('id', 'container');
            $("#container").attr('aria-hidden', 'true');
            $("#skipnav").attr('aria-hidden', 'true');
            dp.find(".ui-datepicker-current").hide();

            today.focus();
            datePickHandler(input, dp);

        }, 0);
    }

    function datePickHandler(input, dp) {
        setCalWidth(input, dp);

        var activeDate;

        if (!dp || !input) {
            return;
        }
        var container = dp;
        dp.data('associatedInput', input);

        dp.find('table').first().attr('role', 'grid');

        dp.attr('role', 'application');
        dp.attr('aria-label', 'Calendar view date-picker');
        var prev = dp.find('.ui-datepicker-prev')[0],
            next = dp.find('.ui-datepicker-next')[0];
        next.href = 'javascript:void(0)';
        prev.href = 'javascript:void(0)';

        next.setAttribute('role', 'button');
        next.removeAttribute('title');
        prev.setAttribute('role', 'button');
        prev.removeAttribute('title');

        appendOffscreenMonthText(next, input, dp);
        appendOffscreenMonthText(prev, input, dp);
        $(next).on('click', {
            input: input,
            dp: dp
        }, handleNextClicks);
        $(prev).on('click', {
            input: input,
            dp: dp
        }, handlePrevClicks);

        monthDayYearText(input, dp);
        var today = dp.find('.ui-datepicker-today a')[0];

        if (!today) {
            today = dp.find('.ui-state-active')[0] ||
                dp.find('.ui-state-default')[0];
        }

        todayLabel = $(today).attr("aria-label");
        $(today).attr("aria-label", "Calendar view date picker, " + todayLabel);
        $(today).one("blur", function() {
            $(today).attr(todayLabel);
        });
        dp.position({
            my: "left top",
            at: "left-1 bottom+2",
            of: input, // or $("#otherdiv)
            collision: "none",
            using: function(calculatedValues, objects) {
                $(this).css('top', calculatedValues.top).css('left', calculatedValues.left);

                $inputGroup = input.parent('.input-group');
                if (objects.vertical == "bottom") {
                    $(this).addClass('expanded-above');
                    $inputGroup.addClass('expanded-above');
                } else {
                    $(this).addClass('expanded-below');
                    $inputGroup.addClass('expanded-below');
                }
            }
        });
        $(window).resize(function() {
            setCalWidth(input, dp);
            dp.position({
                my: "left top",
                at: "left-1 bottom+2",
                of: input, // or $("#otherdiv)
                collision: "none"
            })
        });
        $(window).scroll(function(e) {

            if (!_isClosed) {
                closeCalendar(input, dp);
            }
        });

        setCalWidth(input, dp);
        dp.off('keydown').on('keydown', function calendarKeyboardListener(keyVent) {
            var which = keyVent.which;
            var target = keyVent.target;
            var dateCurrent = getCurrentDate(container);
            var _this = $(this);

            if (!dateCurrent) {
                dateCurrent = dp.find('a.ui-state-default')[0];
                setHighlightState(dateCurrent, dp);
            }

            if (27 === which) {
                keyVent.stopPropagation();
                return closeCalendar(input, dp);
            } else if (which === 9 && keyVent.shiftKey) { // SHIFT + TAB
                keyVent.preventDefault();
                if ($(target).hasClass('ui-datepicker-close')) { // close button
                    $('.ui-datepicker-prev')[0].focus();
                } else if ($(target).hasClass('ui-state-default')) { // a date link
                    $('.ui-datepicker-close')[0].focus();
                } else if ($(target).hasClass('ui-datepicker-prev')) { // the prev link
                    $('.ui-datepicker-next')[0].focus();
                } else if ($(target).hasClass('ui-datepicker-next')) { // the next link
                    activeDate = $(_this.find('.ui-state-active')[0]);
                    if (!activeDate || !activeDate.length) {
                        activeDate = _this.find('.ui-state-highlight')
                    }

                    if (activeDate && activeDate.length) {
                        $(activeDate).focus();
                    }
                }
            } else if (which === 9) { // TAB
                keyVent.preventDefault();
                if ($(target).hasClass('ui-datepicker-close')) { // close button
                    activeDate = $(_this.find('.ui-state-active')[0]);
                    if (!activeDate || !activeDate.length) {
                        activeDate = _this.find('.ui-state-highlight')
                    }

                    if (activeDate && activeDate.length) {
                        $(activeDate).focus();
                    }
                } else if ($(target).hasClass('ui-state-default')) {
                    dp.find('.ui-datepicker-next')[0].focus();
                } else if ($(target).hasClass('ui-datepicker-next')) {
                    dp.find('.ui-datepicker-prev')[0].focus();
                } else if ($(target).hasClass('ui-datepicker-prev')) {
                    dp.find('.ui-datepicker-close')[0].focus();
                }
            } else if (which === 37) { // LEFT arrow key
                if (!$(target).hasClass('ui-datepicker-close') && $(target).hasClass('ui-state-default')) {
                    keyVent.preventDefault();
                    previousDay(target, input, dp);
                }
            } else if (which === 39) { // RIGHT arrow key
                if (!$(target).hasClass('ui-datepicker-close') && $(target).hasClass('ui-state-default')) {
                    keyVent.preventDefault();
                    nextDay(target, input, dp);
                }
            } else if (which === 38) { // UP arrow key
                if (!$(target).hasClass('ui-datepicker-close') && $(target).hasClass('ui-state-default')) {
                    keyVent.preventDefault();
                    upHandler(target, container, prev, input);
                }
            } else if (which === 40) { // DOWN arrow key
                if (!$(target).hasClass('ui-datepicker-close') && $(target).hasClass('ui-state-default')) {
                    keyVent.preventDefault();
                    downHandler(target, container, next, input);
                }
            } else if (which === 13) { // ENTER
                if ($(target).hasClass('ui-state-default')) {
                    setTimeout(function() {
                        closeCalendar(input, dp);
                    }, 100);
                } else if ($(target).hasClass('ui-datepicker-prev')) {
                    handlePrevClicks();
                } else if ($(target).hasClass('ui-datepicker-next')) {
                    handleNextClicks(null, input, dp);
                }
            } else if (32 === which) {
                if ($(target).hasClass('ui-datepicker-prev') || $(target).hasClass('ui-datepicker-next')) {
                    target.click();
                }
            } else if (33 === which) { // PAGE UP
                moveOneMonth(target, 'prev', input, dp);
            } else if (34 === which) { // PAGE DOWN
                moveOneMonth(target, 'next', input, dp);
            } else if (36 === which) { // HOME
                var firstOfMonth = $(target).closest('tbody').find('.ui-state-default')[0];
                if (firstOfMonth) {
                    firstOfMonth.focus();
                    setHighlightState(firstOfMonth, dp);
                }
            } else if (35 === which) { // END
                var $daysOfMonth = $(target).closest('tbody').find('.ui-state-default');
                var lastDay = $daysOfMonth[$daysOfMonth.length - 1];
                if (lastDay) {
                    lastDay.focus();
                    setHighlightState(lastDay, dp);
                }
            }
            dp.find(".ui-datepicker-current").hide();
        });
    }

    function closeCalendar(input, dp) {

        dp.removeClass('expanded-above').removeClass('expanded-below');
        dp.off('keydown');

        var parent = input.parent('.input-group.datepicker-group');
        parent.removeClass('expanded-below');
        parent.removeClass('expanded-above');
        _suppressFocusShow = false; //false b/c not needed as we do not trigger datepicker show on focus

        setTimeout(allowFocusShow, 500);

        function allowFocusShow() {
            _suppressFocusShow = false;
        }
        var nextFocus = null;
        nextFocus = _isAndroidMobile ? input.closest('.datepicker-label') : input; //need to refocus the input to cause the SR to voice the new input text
        nextFocus.focus();

    }

    function removeAria() {
        $("#container").removeAttr('aria-hidden');
        $("#skipnav").removeAttr('aria-hidden');
    }

    function onSelectDate(dateText, input, dp) {

        var input = input ? input : $('input.datepicker'); //if input is null select from the dom
        var inputVal = dateText;
        var prefixStr = 'Today: ';
        if (inputVal != '' && input.val().indexOf(prefixStr) === -1) {
            var inputDate = new Date(inputVal);
            var currentDate = new Date();
            if (inputDate.setHours(0, 0, 0, 0) === currentDate.setHours(0, 0, 0, 0)) {
                input.val(prefixStr + inputVal);
            }
        }
    }

    function setCalWidth(input, dp) {
        var width = input.closest('.input-group.datepicker-group').width() + 1;
        dp.css('min-width', width);
    }

    function isOdd(num) {
        return num % 2;
    }

    function isValidDate(d) {
        if (Object.prototype.toString.call(d) !== "[object Date]")
            return false;
        return !isNaN(d.getTime());
    }

    function isAndroid() {
        return navigator.userAgent.toLowerCase().indexOf("android") > -1; //&& ua.indexOf("mobile");
    }

    function isAndroidMobile() {
        return navigator.userAgent.toLowerCase().indexOf("android") > -1 && navigator.userAgent.toLowerCase().indexOf("mobile");
    }

    function isIOSMobile() {
        return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    }

    function isIPhone() {
        return !!navigator.userAgent.match(/iPhone/i);
    }

    function isIPad() {
        return !!navigator.userAgent.match(/iPad/i);
    }

    function isIPod() {
        return !!navigator.userAgent.match(/iPod/i);
    }
    function suppressInputFocus(input, msec) {

        var time = msec ? msec : 500; //default time to suppress to 500 msec

        input.prop('readonly', true);
        input.focus(function(e) {
            e.preventDefault();
            e.stopPropagation();
        })
        setTimeout(function() {
            input.prop('readonly', false);
            input.off('focus');
        }, time);
    }


    function moveOneMonth(currentDate, dir, input, dp) {
        var button = (dir === 'next') ? dp.find('.ui-datepicker-next')[0] : dp.find('.ui-datepicker-prev')[0];

        if (!button) {
            return;
        }


        var $currentCells = dp.find('tbody td:not(.ui-state-disabled)');
        var currentIdx = $.inArray(currentDate.parentNode, $currentCells);

        button.click();
        setTimeout(function() {
            updateHeaderElements();

            var $newCells = dp.find('tbody td:not(.ui-state-disabled)');
            var newTd = $newCells[currentIdx];
            var newAnchor = newTd && $(newTd).find('a')[0];

            while (!newAnchor) {
                currentIdx--;
                newTd = $newCells[currentIdx];
                newAnchor = newTd && $(newTd).find('a')[0];
            }

            setHighlightState(newAnchor, dp[0]);
            newAnchor.focus();

        }, 0);

    }

    function handleNextClicks(e, input, dp) {

        var input = e && e.data.input ? e.data.input : input;
        var dp = e && e.data.dp ? e.data.dp : dp;

        setTimeout(function() {
            updateHeaderElements(input, dp);
            prepHighlightState();
            dp.find('.ui-datepicker-next').focus();
            dp.find(".ui-datepicker-current").hide();
        }, 0);
    }

    function handlePrevClicks(e, input, dp) {

        var input = e && e.data.input ? e.data.input : input;
        var dp = e && e.data.dp ? e.data.dp : dp;

        setTimeout(function() {
            updateHeaderElements(input, dp);
            prepHighlightState();
            dp.find('.ui-datepicker-prev').focus();
            dp.find(".ui-datepicker-current").hide();
        }, 0);
    }

    function previousDay(dateLink, input, dp) {

        if (!dateLink) {
            return;
        }
        var td = $(dateLink).closest('td');
        if (!td) {
            return;
        }

        var prevTd = $(td).prev(),
            prevDateLink = $('a.ui-state-default', prevTd)[0];

        if (prevTd && prevDateLink) {
            setHighlightState(prevDateLink, dp);
            prevDateLink.focus();
        } else {
            handlePrevious(dateLink, input, dp);
        }
    }


    function handlePrevious(target, input, dp) {

        if (!target) {
            return;
        }
        var currentRow = $(target).closest('tr');
        if (!currentRow) {
            return;
        }
        var previousRow = $(currentRow).prev();

        if (!previousRow || previousRow.length === 0) {
            previousMonth(input, dp);
        } else {
            var prevRowDates = $('td a.ui-state-default', previousRow);
            var prevRowDate = prevRowDates[prevRowDates.length - 1];

            if (prevRowDate) {
                setTimeout(function() {
                    setHighlightState(prevRowDate, dp);
                    prevRowDate.focus();
                }, 0);
            }
        }
    }

    function previousMonth(input, dp) {
        var prevLink = dp.find('.ui-datepicker-prev')[0];
        prevLink.click();
        setTimeout(function() {
            var trs = $('tr', dp),
                lastRowTdLinks = $('td a.ui-state-default', trs[trs.length - 1]),
                lastDate = lastRowTdLinks[lastRowTdLinks.length - 1];
            updateHeaderElements();

            setHighlightState(lastDate, dp);
            lastDate.focus();

        }, 0);
    }
    function nextDay(dateLink, input, dp) {

        if (!dateLink) {
            return;
        }
        var td = $(dateLink).closest('td');
        if (!td) {
            return;
        }
        var nextTd = $(td).next(),
            nextDateLink = $('a.ui-state-default', nextTd)[0];

        if (nextTd && nextDateLink) {
            setHighlightState(nextDateLink, dp);
            nextDateLink.focus(); // the next day (same row)
        } else {
            handleNext(dateLink, input, dp);
        }
    }

    function handleNext(target, input, dp) {

        if (!target) {
            return;
        }
        var currentRow = $(target).closest('tr'),
            nextRow = $(currentRow).next();

        if (!nextRow || nextRow.length === 0) {
            nextMonth(input, dp);
        } else {
            var nextRowFirstDate = $('a.ui-state-default', nextRow)[0];
            if (nextRowFirstDate) {
                setHighlightState(nextRowFirstDate, dp);
                nextRowFirstDate.focus();
            }
        }
    }

    function nextMonth(input, dp) {
        nextMon = dp.find('.ui-datepicker-next')[0];
        nextMon.click();
        setTimeout(function() {
            updateHeaderElements();

            var firstDate = $('a.ui-state-default', dp)[0];
            setHighlightState(firstDate, dp);
            firstDate.focus();
        }, 0);
    }
    function upHandler(target, cont, prevLink, input) {
        prevLink = $('.ui-datepicker-prev')[0];
        var rowContext = $(target).closest('tr');
        if (!rowContext) {
            return;
        }
        var rowTds = $('td', rowContext),
            rowLinks = $('a.ui-state-default', rowContext),
            targetIndex = $.inArray(target, rowLinks),
            prevRow = $(rowContext).prev(),
            prevRowTds = $('td', prevRow),
            parallel = prevRowTds[targetIndex],
            linkCheck = $('a.ui-state-default', parallel)[0];

        if (prevRow && parallel && linkCheck) {
            setHighlightState(linkCheck, cont);
            linkCheck.focus();
        } else {
            prevLink.click();
            setTimeout(function() {
                updateHeaderElements(input, cont); //cont === dp
                var newRows = $('tr', cont),
                    lastRow = newRows[newRows.length - 1],
                    lastRowTds = $('td', lastRow),
                    tdParallelIndex = $.inArray(target.parentNode, rowTds),
                    newParallel = lastRowTds[tdParallelIndex],
                    newCheck = $('a.ui-state-default', newParallel)[0];

                if (lastRow && newParallel && newCheck) {
                    setHighlightState(newCheck, cont);
                    newCheck.focus();
                } else {
                    var secondLastRow = newRows[newRows.length - 2],
                        secondTds = $('td', secondLastRow),
                        targetTd = secondTds[tdParallelIndex],
                        linkCheck = $('a.ui-state-default', targetTd)[0];

                    if (linkCheck) {
                        setHighlightState(linkCheck, cont);
                        linkCheck.focus();
                    }

                }
            }, 0);
        }
    }
    function downHandler(target, cont, nextLink, input) {
        nextLink = $('.ui-datepicker-next')[0];
        var targetRow = $(target).closest('tr');
        if (!targetRow) {
            return;
        }
        var targetCells = $('td', targetRow),
            cellIndex = $.inArray(target.parentNode, targetCells), // the td (parent of target) index
            nextRow = $(targetRow).next(),
            nextRowCells = $('td', nextRow),
            nextWeekTd = nextRowCells[cellIndex],
            nextWeekCheck = $('a.ui-state-default', nextWeekTd)[0];

        if (nextRow && nextWeekTd && nextWeekCheck) {
            setHighlightState(nextWeekCheck, cont);
            nextWeekCheck.focus();
        } else {
            nextLink.click();

            setTimeout(function() {
                updateHeaderElements(input, cont); //cont === dp

                var nextMonthTrs = $('tbody tr', cont),
                    firstTds = $('td', nextMonthTrs[0]),
                    firstParallel = firstTds[cellIndex],
                    firstCheck = $('a.ui-state-default', firstParallel)[0];

                if (firstParallel && firstCheck) {
                    setHighlightState(firstCheck, cont);
                    firstCheck.focus();
                } else {
                    var secondRow = nextMonthTrs[1],
                        secondTds = $('td', secondRow),
                        secondRowTd = secondTds[cellIndex],
                        secondCheck = $('a.ui-state-default', secondRowTd)[0];

                    if (secondRow && secondCheck) {
                        setHighlightState(secondCheck, cont);
                        secondCheck.focus();
                    }
                }
            }, 0);
        }
    }
    function monthDayYearText(input, dp) {
        var cleanUps = dp.find('.amaze-date');

        $(cleanUps).each(function(clean) {
            clean.parentNode.removeChild(clean);
        });
        if (!dp) {
            return;
        }

        var dates = $('a.ui-state-default', dp);

        $(dates).each(function(index, date) {
            var currentRow = $(date).closest('tr'),
                currentTds = $('td', currentRow),
                currentIndex = $.inArray(date.parentNode, currentTds),
                headThs = $('thead tr th', dp),
                dayIndex = headThs[currentIndex],
                daySpan = $('span', dayIndex)[0],
                monthName = $('.ui-datepicker-month', dp)[0].innerHTML,
                year = $('.ui-datepicker-year', dp)[0].innerHTML,
                number = date.innerHTML;

            if (!daySpan || !monthName || !number || !year) {
                return;
            }
            var dateText = monthName + ' ' + date.innerHTML + ' ' + year + ' ' + daySpan.title;
            date.setAttribute('aria-label', dateText);
        });
    }
    function updateHeaderElements(input, dp) {

        var context = dp;
        if (!context) {
            return;
        }
        setCalWidth(input, dp);

        $(context).find('table').first().attr('role', 'grid');

        prev = $('.ui-datepicker-prev', context)[0];
        next = $('.ui-datepicker-next', context)[0];
        next.href = 'javascript:void(0)';
        prev.href = 'javascript:void(0)';

        next.setAttribute('role', 'button');
        prev.setAttribute('role', 'button');
        appendOffscreenMonthText(next, input, dp);
        appendOffscreenMonthText(prev, input, dp);
        $(next).on('click', {
            input: input,
            dp: dp
        }, handleNextClicks);
        $(prev).on('click', {
            input: input,
            dp: dp
        }, handlePrevClicks);
        monthDayYearText(input, dp);
    }


    function prepHighlightState() {
        var highlight;
        var cage = document.getElementById('ui-datepicker-div');
        highlight = $('.ui-state-highlight', cage)[0] ||
            $('.ui-state-default', cage)[0];
        if (highlight && cage) {
            setHighlightState(highlight, cage);
        }
    }
    function setHighlightState(newHighlight, container) {
        var prevHighlight = getCurrentDate(container);
        $(prevHighlight).removeClass('ui-state-highlight');
        $(newHighlight).addClass('ui-state-highlight');
    }
    function getCurrentDate(container) {
        var currentDate = $('.ui-state-highlight', container)[0];
        return currentDate;
    }
    function appendOffscreenMonthText(button, input, dp) {
        var buttonText;
        var isNext = $(button).hasClass('ui-datepicker-next');
        var months = [
            'january', 'february',
            'march', 'april',
            'may', 'june', 'july',
            'august', 'september',
            'october',
            'november', 'december'
        ];

        var currentMonth = dp.find('.ui-datepicker-title .ui-datepicker-month').text().toLowerCase();
        var monthIndex = $.inArray(currentMonth.toLowerCase(), months);
        var currentYear = dp.find('.ui-datepicker-title .ui-datepicker-year').text().toLowerCase();
        var adjacentIndex = (isNext) ? monthIndex + 1 : monthIndex - 1;

        if (isNext && currentMonth === 'december') {
            currentYear = parseInt(currentYear, 10) + 1;
            adjacentIndex = 0;
        } else if (!isNext && currentMonth === 'january') {
            currentYear = parseInt(currentYear, 10) - 1;
            adjacentIndex = months.length - 1;
        }

        buttonText = (isNext) ? 'Next Month, ' + firstToCap(months[adjacentIndex]) + ' ' + currentYear : 'Previous Month, ' + firstToCap(months[adjacentIndex]) + ' ' + currentYear;

        $(button).find('.ui-icon').html(buttonText);

    }
    function firstToCap(s) {
        return s.charAt(0).toUpperCase() + s.slice(1);
    }

});
$(function() {
    'use strict';

    var $formEls = $('input, select, textarea, .input-group');
    $('body').on('keydown', function(e) {
        var openPopovers = $('.popover.in');
        if (e.keyCode === 27 && openPopovers.length > 0) {
            var toggleEl = openPopovers.prev('[data-toggle=popover]');
            CM.Tooltip.methods.hide(toggleEl, true);
        }
    });
    function applyAria(e) {
        var ariaSpacer = '';
        if (e.attr('aria-labelledby')) {
            e.attr('data-hard-labelledby', e.attr('aria-labelledby'));
            ariaSpacer = ' ';
        } else {
            e.attr('data-hard-labelledby', '');
            ariaSpacer = '';
        }
        if (e.next('button').length) {
            e.attr('aria-labelledby', e.attr('data-hard-labelledby') + ariaSpacer + e.next('button').attr('aria-describedby'));
        } else {
            e.attr('aria-labelledby', e.attr('data-hard-labelledby') + ariaSpacer + e.parent().next('button').attr('aria-describedby'));
        }
    }
    function restoreAria(e) {
        e.attr('aria-labelledby', e.attr('data-hard-labelledby'));
        e.removeAttr('data-hard-labelledby');
    }
    function adjustForms() {
        $('.row').children('.form-group').each(function(index) {
            if (typeof($(this).prevAll().first().attr('class')) != "undefined") {
                var thisOffset = $(this).offset();
                var prevOffset = $(this).prevAll().first().offset();
                var prevWidth = $(this).prevAll().first().width();
                var afterPrev = prevOffset.left + prevWidth;
                if (thisOffset.left > 0 && thisOffset.left < afterPrev) {
                    $(this).css('clear', 'left');
                } else $(this).css('clear', 'none');
            }
        });
    }

    var modalIDArr = [];
    var $body = $('body');
    var $modals = $('.modal');
    if (navigator.userAgent.match(/iPhone|iPad|iPod/i)) {
        $('.modal').on('show.bs.modal', function() {
            $(this)
                .css({
                    position: 'absolute',
                    marginTop: $(window).scrollTop() + 'px',
                    bottom: 'auto'
                });
            setTimeout(function() {
                $('.modal-backdrop').css({
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: Math.max(
                        document.body.scrollHeight, document.documentElement.scrollHeight,
                        document.body.offsetHeight, document.documentElement.offsetHeight,
                        document.body.clientHeight, document.documentElement.clientHeight
                    ) + 'px'
                });
            }, 0);
        });
    }
    $.fn.modal.Constructor.prototype.hide = function(e) {
            if (e) e.preventDefault()

            e = $.Event('hide.bs.modal')

            this.$element.trigger(e)

            if (!this.isShown || e.isDefaultPrevented()) return

            this.isShown = false

            this.escape()
            this.resize()

            $(document).off('focusin.bs.modal')

            this.$element
                .removeClass('in')
                .off('click.dismiss.bs.modal')
                .off('mouseup.dismiss.bs.modal')

            this.$dialog.off('mousedown.dismiss.bs.modal')

            $.support.transition && this.$element.hasClass('fade') ?
                this.$element
                .one('bsTransitionEnd', $.proxy(this.hideModal, this))
                .emulateTransitionEnd(300) :
                this.hideModal()
            $(document).off('keydown.bs.modal')
        }


    function onBSModalShown(e) {
        $body.find('>div, >header, >main, >section, >footer, >span, >a').not('.modal').attr('aria-hidden', 'true');
        var timeoutMS = 0;
        var $target = $(e.target);

        modalIDArr.push($target.attr('id'));

        if ($target.hasClass('modal-scrollable')) {
            var $scrollable = $target.find('.modal-body');
            $scrollable.animate({
                scrollTop: 0
            }, 'slow');
            timeoutMS = 10;
        }



        window.setTimeout(function() {
            setModalFocus(e);
        }, timeoutMS);
    }

    function onBSModalHidden(e) {
        var i = $.inArray($(e.target).attr('id'), modalIDArr);
        if (i != -1) {
            modalIDArr.splice(i, 1);
        }
        $body.find('>div, >header, >main, >footer, >span, >a').not('.modal').removeAttr('aria-hidden');
        $body.find('[data-target=#' + $(e.target).attr('id') + ']').first().focus();
    }

    function onBSModalShow(e) {}

    function onBSModalHide(e) {
        var $this = $(this);
        var vid = $(this).find('iframe.embed-responsive-item');
        
        vid.each(function (e) {
            $(this).attr('src', $(this).attr('src'));
        });
    }

    function setModalFocus(e) {
        $(e.target).find('#' + e.target.getAttribute('aria-labelledby')).focus();

        $(e.target).attr('tabindex', 1)
    }
    function resizeFormElements(e) {
        $formEls.each(function() {
            if ($(this).hasClass('with-tooltip')) {
                $(this).css('width', "100%");
            }
        });
    }
    $.each($modals, function() {
        var $modalEl = $(this);
        if ($modalEl.closest('.theme-light').length > 0) {
            $modalEl.find('.modal-dialog').addClass('theme-light');
        }
    });
    $body.append($modals);
    $modals.on('shown.bs.modal', onBSModalShown);
    $modals.on('hidden.bs.modal', onBSModalHidden);
    $modals.on('show.bs.modal', onBSModalShow);
    $modals.on('hide.bs.modal', onBSModalHide);
    $(window).on('load', resizeFormElements);
    $(window).on('resize', resizeFormElements);
    $modals.on('shown.bs.modal', function(i) {
        var $openPopovers = $('.popover.in');
        $openPopovers.fadeOut("fast");

        var $allPopoverEls = $('[data-toggle=popover]');
        var $elsToDismiss = $allPopoverEls.not(this);
        $elsToDismiss.removeAttr('data-open-method').removeAttr('data-from-close').attr('aria-expanded', 'false').popover('hide');
    })
    $(document).on('keydown', function(event) {

        var focusableElementsString = 'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, *[tabindex=0], *[contenteditable]';

        if (modalIDArr.length && event.which == 9) {
            var elementId = modalIDArr[modalIDArr.length - 1];
            var el = document.getElementById(elementId);
            var popupItems = $(el).find('*');
            var focusableItems = popupItems.filter(focusableElementsString).filter(':visible');
            var focusedItem = $(':focus');
            var numberOfFocusableItems = focusableItems.length;
            var focusedItemIndex = focusableItems.index(focusedItem);
            if (numberOfFocusableItems === 0) {
                $(el).focus();
                event.preventDefault();
            } else {
                if (event.shiftKey) {
                    if (focusedItemIndex === 0) {
                        focusableItems.get(numberOfFocusableItems - 1).focus();
                        event.preventDefault();
                    }

                } else {
                    if (focusedItemIndex == numberOfFocusableItems - 1) {
                        focusableItems.get(0).focus();
                        event.preventDefault();
                    }
                }
            }
        }
    });
});

var CM = CM || {};

$(function () {
    var FormLabel = CM.FormLabel = function FormLabel(el) {
        var formElement = $(el);

        this.init = function() {

            formElement.on('focus', function (e) {
                $(e.currentTarget).closest('.form-group').addClass('is-focused');
            })
            .on('blur', function (e) {
                $(e.currentTarget).closest('.form-group').removeClass('is-focused');
            })
            .on('input', function (e) {
                check_hasValue(e);
            })
            .on('change', function (e) {
                check_hasValue(e);
            });
        }

        var check_hasValue = function(e) {
            var currentInput = $(e.currentTarget);
            if (currentInput.val() === '') {
                currentInput.closest('.form-group').removeClass('has-value '+e.currentTarget.nodeName.toLowerCase()+'-value');
            } else {
                currentInput.closest('.form-group').addClass('has-value '+e.currentTarget.nodeName.toLowerCase()+'-value');
            }
        }
    }
});
var CM = CM || {};

$(function () {
    var FormPassword = CM.FormPassword = function FormPassword(el) {
        CM.FormPassword.fields = CM.FormPassword.fields || {};

        var passwordEl = $(el);
        if (passwordEl.attr('id') === undefined) {
            passwordEl.attr('id', 'password-input-'+Math.Random().toString().replace('.', ''));
        }
        var srCopy = {
            'no': 'Requirement will be checked on form submission ',
            'check': 'Password meets requirement ',
            'x': 'Password does not meet requirement '
        }
        var fieldId = passwordEl.attr('id');
        var predefinedRules = {
            nospaces: {
                copy: 'No Spaces',
                regexp: new RegExp('[ ]', 'g'),
                outcome: false
            },
            hasletter: {
                copy: 'At least 1 letter',
                regexp: new RegExp('[a-zA-Z]', 'g'),
                outcome: true
            },
            hasuppercaseletter: {
                copy: 'At least 1 uppercase letter',
                regexp: new RegExp('[A-Z]', 'g'),
                outcome: true
            },
            haslowercaseletter: {
                copy: 'At least 1 lowercase letter',
                regexp: new RegExp('[a-z]', 'g'),
                outcome: true
            },
            hasnumber: {
                copy: 'At least 1 number',
                regexp: new RegExp('[0-9]', 'g'),
                outcome: true
            },
            hasspecialcharacter: {
                copy: 'At least 1 special character',
                regexp: new RegExp('[,;:<>\{\}\|/!@#\$%\^\&*\)\(+=._-]', 'g'),
                outcome: true
            },
            minmax: {
                copy: 'From 6 - 50 characters',
                regexp: new RegExp('^.{6,50}$', 'g'),
                outcome: true
            },
            noconsecutive: {
                copy: 'No more than 2 consecutive characters',
                regexp: new RegExp('(.)\\1{2}', 'g'),
                outcome: false
            },
            nospecialcharacters: {
                copy: 'May contain letters and numbers',
                regexp: new RegExp('[^a-z0-9]', 'gi'),
                outcome: false
            }
        };
        var customRules = [];

        this.init = function() {

            CM.FormPassword.fields[fieldId] = CM.FormPassword.fields[fieldId] || {};
            CM.FormPassword.fields[fieldId].rules = { list:[], custom:[] };
            CM.FormPassword.fields[fieldId].copy = {};

            var customRulesStr = passwordEl.attr('data-custom-rules');
            var placement = passwordEl.attr('data-placement') || 'right auto';
            var rulesStr = passwordEl.attr('data-rules');
            var minMaxRegExp = new RegExp('min-max', 'g');
            var noConsecRegExp = new RegExp('no-consecutive', 'g');
            var rulesArr = [];
            CM.FormPassword.fields[fieldId].copy.failMsg = passwordEl.attr('data-fail-msg') || 'Your password doesn&#39;t seem to meet our requirements'
            CM.FormPassword.fields[fieldId].copy.successMsg = passwordEl.attr('data-success-msg') || 'Your password meets our requirements';
            if (customRulesStr) {
                var commaReg = [new RegExp("{'", 'g'), new RegExp("':'", 'g'), new RegExp("','", 'g'), new RegExp("'}", 'g')];
                customRulesStr = customRulesStr.replace(commaReg[0], '{"').replace(commaReg[1], '":"').replace(commaReg[2], '","').replace(commaReg[3], '"}');
                customRules = JSON.parse(customRulesStr);
                for (var k = 0; k < customRules.length; k++) {
                    if (customRules[k].outcome !== undefined) {
                        customRules[k].outcome = (customRules[k].outcome === 'true') ? true : false;
                    }
                    if (customRules[k].regexp !== undefined) {
                        var flags = 'g';
                        if (customRules[k].global !== undefined) {
                            flags = (customRules[k].global === 'true') ? 'g' : '';
                        }
                        if (customRules[k].ignorecase !== undefined) {
                            flags += (customRules[k].ignorecase === 'true') ? 'i' : '';
                        }
                        customRules[k].regexp = new RegExp(customRules[k].regexp, flags);
                    }
                    if (customRules[k].disabled !== undefined) {
                        customRules[k].disabled = (customRules[k].disabled === 'true') ? true : false;
                    }
                }
            }
            if (rulesStr) {
                rulesArr = passwordEl.attr('data-rules').split(' ');
                for (var i = rulesArr.length - 1; i >= 0; i--) {
                    if (minMaxRegExp.test(rulesArr[i])) {
                        var minMaxArr = rulesArr[i].match(/\d+/g);
                        if (minMaxArr[0] !== undefined) {

                            customRules.push({
                                copy: 'From '+minMaxArr[0]+' - '+minMaxArr[1]+' characters',
                                regexp: new RegExp('^.{'+minMaxArr[0]+','+minMaxArr[1]+'}$', 'g'),
                                outcome: true
                            });
                            rulesArr.splice(i, 1);
                        } else {
                            rulesArr[i] = rulesArr[i].replace(/[-]/g, '');
                        }
                    } else if (noConsecRegExp.test(rulesArr[i])) {
                        var consecAmount = rulesArr[i].match(/\d+/g);
                        if (consecAmount !== null) {

                            customRules.push({
                                copy: 'No more than '+consecAmount+' consecutive characters',
                                regexp: new RegExp('(.)\\1{'+consecAmount+'}', 'g'),
                                outcome: false
                            });
                            rulesArr.splice(i, 1);
                        } else {
                            rulesArr[i] = rulesArr[i].replace(/[-]/g, '');
                        }
                    } else {
                        rulesArr[i] = rulesArr[i].replace(/[-]/g, '');
                    }
                }
            }

            CM.FormPassword.fields[fieldId].rules.list = $.extend([],rulesArr);
            CM.FormPassword.fields[fieldId].rules.custom = $.extend([],customRules);
            var msgStr = (CM.FormPassword.testAllRules(passwordEl)) ? 'successMsg' : 'failMsg';

            if (passwordEl.is('[data-toggle=popover]')) {
                passwordEl.popover({
                    trigger: 'manual',
                    placement: _calcPlacement(placement, passwordEl),
                    title: 'Password Guidelines',
                    html: true,
                    content: CM.FormPassword.buildRuleList(fieldId),
                    template: '<div class="password-popover popover has-header" role="tooltip"><div class="arrow"></div><span role="alert" class="password-status">'+CM.FormPassword.fields[fieldId].copy[msgStr]+'</span><h3 class="popover-title"></h3><div class="popover-content"></div><button class="popover-close-button" tabindex="0">close</button></div>'
                })
                .on('shown.bs.popover', function () {
                    passwordEl.next().find('.popover-close-button').on('touchstart', function (e) {
                      e.preventDefault();
                      passwordEl.blur();
                    })
                })
                .on('inserted.bs.popover', function (e) {
                    CM.FormPassword.updateFieldStatus($(e.currentTarget));

                });
                passwordEl.on('focus', function (e) {
                    if (passwordEl.attr('data-from-close') !== 'true') {
                        passwordEl.popover('show');
                    } else {
                        passwordEl.removeAttr('data-from-close');
                    }
                })
                .on('blur', function (e) {
                    var self = $(this);
                    window.setTimeout(function(){
                        if (!self.next().find('.popover-close-button').is(':focus')) {
                           self.popover('hide');
                        }
                    },10);
                })
                .on('input change', function (e) {
                    var self = $(this);
                    window.setTimeout(function(){
                        CM.FormPassword.updateFieldStatus(self);
                    },10);
                })
                .one('inserted.bs.popover', function (e) {
                    $(e.currentTarget).next('.popover').find('.popover-close-button').on('click touchstart', function(e) {
                        e.preventDefault();
                        var self = $(this);
                        var $popoverContent = self.closest('.popover.in');
                        var $toggleEl = $popoverContent.prev('[data-toggle=popover]');

                        CM.Tooltip.methods.hide($toggleEl, true, true);

                        $popoverContent.attr('aria-expanded', 'false');
                    });
                });
            }

        }
        CM.FormPassword.updateFieldStatus = function (passwordField) {
            var fieldId = passwordField.attr('id');
            if (CM.FormPassword.testAllRules(passwordField)) {
                passwordField.removeClass('validation-input-danger');
                passwordField.next().find('.password-status').html(CM.FormPassword.fields[fieldId].copy.successMsg);
            } else {
                passwordField.addClass('validation-input-danger');
                passwordField.next().find('.password-status').html(CM.FormPassword.fields[fieldId].copy.failMsg);
            }
        };
        CM.FormPassword.testAllRules = function (passwordField) {
            var fieldId = passwordField.attr('id');
            var rulesList = CM.FormPassword.fields[fieldId].rules.list;
            var rules = CM.FormPassword.fields[fieldId].rules.custom;
            var allClear = true;
            var passwordVal = passwordField.val();

            if (rulesList.length > 0) {
                for (var i = 0; i < rulesList.length; i++) {
                    var currentRule = predefinedRules[rulesList[i]];
                    var ruleListItem = passwordField.next().find('[data-rule='+rulesList[i]+']');
                    var isListDisabled = (currentRule.disabled !== undefined) ? currentRule.disabled : false;
                    if (!isListDisabled) {
                        if (CM.FormPassword.testRule(currentRule, passwordVal)) {
                            ruleListItem.removeClass('x-mark').addClass('check-mark');
                            ruleListItem.find('.validation-rule-status').html(srCopy.check);
                        } else {
                            ruleListItem.removeClass('check-mark').addClass('x-mark');
                            ruleListItem.find('.validation-rule-status').html(srCopy.x);
                            allClear = false;
                        }
                    }
                }
            }
            if (rules.length > 0) {
                for (var j = 0; j < rules.length; j++) {
                    var ruleItem = passwordField.next().find('[data-rule=custom-'+j+']');
                    var isDisabled = (rules[j].disabled !== undefined) ? rules[j].disabled : false;
                    if (!isDisabled) {
                        if (CM.FormPassword.testRule(rules[j], passwordVal)) {
                            ruleItem.removeClass('x-mark').addClass('check-mark');
                            ruleItem.find('.validation-rule-status').html(srCopy.check);
                        } else {
                            ruleItem.removeClass('check-mark').addClass('x-mark');
                            ruleItem.find('.validation-rule-status').html(srCopy.x);
                            allClear = false;
                        }
                    }
                }
            }
            return allClear;
        };
        CM.FormPassword.testRule = function (currentRule, val) {
            var desiredOutcome = (currentRule.outcome !== undefined) ? currentRule.outcome : true;
            var method = currentRule.method || 'match';
            var testResult = false;

            if (currentRule !== undefined) {
                if (Boolean(val.match(currentRule.regexp)) === desiredOutcome) {
                    return true;
                } else {
                    return false;
                }
            }
        };
        CM.FormPassword.buildRuleList = function (fieldId) {
            var rulesList = CM.FormPassword.fields[fieldId].rules.list;
            var rulesArr = CM.FormPassword.fields[fieldId].rules.custom;
            var content = '<ul>';

            if (rulesList.length > 0) {
                for (var i = 0; i < rulesList.length; i++) {
                    var currentRule = predefinedRules[rulesList[i]];
                    content = content + CM.FormPassword.buildRuleItem(currentRule, rulesList[i]);
                }
            }
            if (rulesArr.length > 0) {
                for (var j = 0; j < rulesArr.length; j++) {
                    content = content + CM.FormPassword.buildRuleItem(rulesArr[j], j);
                }
            }
            content = content + '</ul>';

            return content;
        }
        CM.FormPassword.buildRuleItem = function (rule, ruleId) {
            var ruleId = ruleId;
            var desiredOutcome = (rule.outcome === undefined) ? true : rule.outcome;
            if (rule.disabled) {
                var stateStr = 'no';
            } else {
                var stateStr = (desiredOutcome) ? 'x' : 'check';
            }

            if (!isNaN(ruleId)) {
                ruleId = 'custom-'+ruleId;
            }

            return '<li class="' + stateStr + '-mark" data-rule="'+ruleId+'"><span class="validation-rule-status sr-only">'+srCopy[stateStr]+'</span>'+rule.copy+'</li>';
        }
        function _calcPlacement (desiredPlacement, el) {
            var whiteSpace = {
                right: function () {
                    return viewport.width-(elSize.width+elSize.left);
                },
                left: function () {
                    return elSize.left;
                },
                bottom: function () {
                    return viewport.height-(elSize.height+elSize.top);
                }/*,
                top: function () {
                    return elSize.top;
                }*/
            };
            var bestFit = { pos: simplePlacement, size: 0 };
            var simplePlacement = desiredPlacement.replace(/ *auto */i, '');
            var popoverWidth = 340;
            var viewport = { width:window.innerWidth, height: window.innerHeight};
            var elSize = el[0].getBoundingClientRect();

            return simplePlacement;
        }
    }

});

var CM = CM || {};

$(function() {
    var FormFormatted = CM.FormFormatted = function FormFormatted(el) {
        var formattedEl = $(el);
        var controlKeys = [8, 9, 13, 16, 17, 18, 19, 20, 27, 33, 34, 35, 36, 37, 38, 39, 40, 45, 46, 91, 92, 93, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123, 144, 145, 130, 129, 128, 127, 126, 125, 124];

        this.init = function() {

            var placeholderText = formattedEl.attr('data-format');

            var formattingText = document.createElement('span');
            var formatText = document.createElement('span');

            var formatRegex = formattedEl.attr('data-format-enforcement');

            formattingText.style.left = (formattedEl.position().left + 1) + 'px';
            formattingText.className = 'formatting-text';
            formatText.className = 'format-text';

            formattingText.setAttribute('aria-hidden', 'true');
            formattingText.setAttribute('role', 'presentation');

            formatText.innerHTML = placeholderText;

            formattingText.appendChild(formatText);
            formattedEl.after(formattingText);

            if (formatRegex !== '' || formatRegex !== null || formatRegex !== undefined) {
                formatRegex = new RegExp(formatRegex);
                formattedEl.on('keydown', function(e) {
                    if (controlKeys.indexOf(e.keyCode) === -1) {
                        var enteredChar = String.fromCharCode(e.keyCode);
                        var enteredCharFF = String.fromCharCode(e.keyCode-48);

                        if (!enteredChar.match(formatRegex) & !enteredCharFF.match(formatRegex)) {
                            return false;
                        }

                    }
                });
            }
        }
    }

});

var CM = CM || {};

(function ($) {
    var PercentageProgressIndicator = CM.PercentageProgressIndicator = function PercentageProgressIndicator(el) {
        var $container = $(el);
        var $label = $('.progress-label', $container);
        var $bar = $('.progress-bar', $container);

        this.init = function(percentageProgressIndicator) {
            if(!$container.data('percentageProgressIndicator')){
                $container.data('percentageProgressIndicator', percentageProgressIndicator);
            }
        }

        this.updateProgress = function(progress){
            try {
                if(progress < 0.0 && progress > 100.0){
                    throw 'PercentageProgressIndicator.updateProgress: method expects value between 0.0 - 100.0';   
                } else {
                    $bar.css('width', "" + progress + "%");
                    $bar.attr('aria-valuenow', progress);
                    $('.progress-percentage', $label).text(Math.round(progress) + "%");
                }
            }
            catch(err){
                console.log('ERROR: ' + err);
            }
        }
    }
})(jQuery);
var CM = CM || {};

(function ($) {
    var modal = CM.Modal = function Modal(el) {

        this.init = function () {
            $(el.getAttribute('data-target')).on('shown.bs.modal', function (e) {
                var $target = $(e.currentTarget);
                $target.find('.modal-dialog').focus();
				$(e.currentTarget).find('button').click(function(e){
					var url = $(e.target).attr('data-href');
					if(url){
						window.location.href = url;
					}
				});

            });
            var launcher = $(el);
            if(launcher.is('a')) {
                launcher.on('keypress', function (e) {
                    if(e.keyCode == 32) { //spacebar
                        e.preventDefault();
                        launcher.click();
                    }
                });
            }
        }
    }
})(jQuery);

var CM = CM || {};

$(function () {

	var DatepickerDOB = CM.DatepickerDOB = function DatepickerDOB(el) {

		var el = $(el)

		var MIN_AGE = 20;
		var MAX_RANGE = 83;

		var max_year = new Date().getFullYear() - MIN_AGE;
		var min_year = max_year - MAX_RANGE;

		this.init = function() {
			var dobYearSelect = el.find('select.dob-year');
			populateOptionsElements(dobYearSelect, dobYearSelect.attr('data-first-item-label'));
		}
		

		function populateOptionsElements(element, firstItemLabel){

			var yearOptions = [];
			var yearArr = getRangeArray(min_year, max_year).sort();
			if(firstItemLabel){
				yearOptions.push({label:firstItemLabel, value:'', disabled: false});	
			}		
			
			for (var i = yearArr.length - 1; i >= 0; i--) {
				yearOptions.push({label:yearArr[i], value:yearArr[i]})
			};

			element.html(getOptionsElements(yearOptions));

		}

		function getOptionsElements(arr){
			
			var options = [];
			var element = null;
			var classes = [];
			var disabled = false;

			arr.forEach(function(obj, idx, arr){
				classes = classes && classes.length ? obj.classes.join(' ') : '';
				disabled = obj.disabled ? true : false;
				element = $("<option>", {id: obj.id, class: classes})
					.attr('value', obj.value)
					.attr('disabled', disabled)
					.html(obj.label);
				options.push(element);
			})

			return options;
		}
		function getRangeArray(low,hi){
		  
		  function rangeRec(low, hi, vals) {
		     if(low > hi) return vals;
		     vals.push(low);
		     return rangeRec(low + 1, hi, vals);
		  }
		  
		  return rangeRec(low, hi, []);
		}

		function getDaysInMonth(month, year) {
	    	return new Date(year, month, 0).getDate();
		}	
	}

});
var CM = CM || {};

$(function () {
    var SimpleDateInput = CM.SimpleDateInput = function SimpleDateInput(el) {

        this.init = function() {
            var input = $(el);
            var formatsToTry = ['MM d, yy','MM d, y','M d, yy','M d, y','mm/dd/y','mm/dd/yy','mm-dd-y','mm-dd-yy','mm dd y','mm dd yy','dd/mm/y','dd/mm/yy','dd-mm-y','dd-mm-yy','dd mm y','dd mm yy'];
            var dateFormat = input.attr('data-format');
            var additionalDateFormats = input.attr('data-additional-formats');
            if (dateFormat.indexOf('yyyy') !== -1) {
                dateFormat = dateFormat.replace('yyyy', 'yy');
            } else if (dateFormat.indexOf('yy') !== -1) {
                dateFormat = dateFormat.replace('yy', 'y');
            }
            if (additionalDateFormats) {
                if (dateFormat) {
                    additionalDateFormats = dateFormat+'|'+additionalDateFormats;
                }
                formatsToTry = additionalDateFormats.split('|').concat(formatsToTry);
            } else if (dateFormat) {
                formatsToTry = [dateFormat].concat(formatsToTry);
            }
            input.on('blur', function () {
                var inputText = input.val().replace(/\D+(?=,)/, '');
                var inputDate = undefined;
                for (var i = 0; i < formatsToTry.length; i++) {
                    try {
                        inputDate = $.datepicker.parseDate( formatsToTry[i], inputText );
                    }
                    catch(err) {
                    }
                    if (inputDate !== undefined) {
                        break;
                    }
                };

                if(!isNaN(inputDate) && inputDate !== null){
                    var dayDate = String(inputDate.getDate());
                    var endOfDate = dayDate.charAt(dayDate.length-1)
                    var dayAddition = 'th';
                    if(endOfDate === '1' && dayDate.indexOf('11') === -1) {
                        dayAddition = 'st';
                    } else if (endOfDate === '2' && dayDate.indexOf('12') === -1) {
                        dayAddition = 'nd';
                    } else if (endOfDate === '3' && dayDate.indexOf('13') === -1) {
                        dayAddition = 'rd';
                    }

                    input.removeClass('date-invalid');
                    input.val($.datepicker.formatDate("MM d'"+dayAddition+"', yy", inputDate));
                } else {
                    input.addClass('date-invalid');
                }
            });
        }
    }
});
var CM = CM || {};

$(function () {

    var TableInternalExpand = CM.TableInternalExpand = function TableInternalExpand(el) {

        var el = $(el)

        this.init = function() {
            
            el.find('.details-button').on('click', function (e) {
                var detailsButton = $(e.currentTarget);
                var tableRow = $(e.target).closest('tr');
                if (tableRow.hasClass('is-expanded')) {
                    tableRow.removeClass('is-expanded').addClass('is-collapsed');
                    detailsButton.attr('aria-expanded','false').find('.btn-text').html('<span class="btn-text btn-link">More Details<span class="glyphicon glyphicon-triangle-bottom" aria-hidden="true"></span></span>');
                } else {
                    tableRow.addClass('is-expanded').removeClass('is-collapsed');
                    detailsButton.attr('aria-expanded','true').find('.btn-text').html('<span class="btn-text btn-link">Less Details<span class="glyphicon glyphicon-triangle-top" aria-hidden="true"></span></span>');
                }
            });
        }
    }

});
var CM = CM || {};

$(function () {
    var AssociatedInput = CM.AssociatedInput = function AssociatedInput(el) {
        var associatedInputContainer = $(el);

        this.init = function() {
            var toggleEl = associatedInputContainer.find('[type=radio],[type=checkbox]');
            var inputEl = associatedInputContainer.find('.form-control').not('[type=radio],[type=checkbox]');
            var radioContainerList = undefined;

            if (toggleEl.attr('type') === 'radio') {
                radioContainerList = associatedInputContainer.parent().find('.associated-input');
            }

            toggleEl.change(function (e) {
                if (radioContainerList !== undefined) {
                    radioContainerList.each(function () {
                        var currentRadio = $(this).find('[type=radio]');
                        var currentInput = $(this).find('.form-control').not('[type=radio],[type=checkbox]');
                        if (!currentRadio.is(':checked')) {
                            currentInput.attr('disabled','disabled');
                            currentInput.attr('tabindex','-1');
                            currentInput.closest('.focus-group').addClass('is-disabled');
                        } else {
                            currentInput.removeAttr('disabled');
                            currentInput.attr('tabindex','0');
                            currentInput.closest('.focus-group').removeClass('is-disabled');
                        }
                    });
                } else {
                    if (toggleEl.is(':checked')) {
                        inputEl.closest('.focus-group').removeClass('is-disabled');
                        inputEl.removeAttr('disabled');
                        inputEl.attr('tabindex','0');
                    } else {
                        inputEl.closest('.focus-group').addClass('is-disabled');
                        inputEl.attr('disabled','disabled');
                        inputEl.attr('tabindex','-1');
                    }
                }
            });
        }
    }
});
var CM = CM || {};

$(function () {
    var FormAddonBtn = CM.FormAddonBtn = function FormAddonBtn(el) {
        var formElement = $(el);

        this.init = function() {

            formElement.on('focus', function (e) {
                $(e.currentTarget).closest('.input-group-btn').addClass('is-focused');
            })
            .on('blur', function (e) {
                $(e.currentTarget).closest('.input-group-btn').removeClass('is-focused');
            });
        }
    }
});
var CM = CM || {};

$(function () {

    var CardSelector = CM.CardSelector = function CardSelector(el) {

        var el = $(el)

        this.init = function() {
           el.change(onCardSelected);
        }

        function onCardSelected(e){
            var id = $(this).find(':selected').attr('data-card-id');
            showCardImage(id);
            showCardInfoTable(id);
        }

        function showCardImage(id){
            var card = $(el).find(".card[data-card-id='" + id + "']");
            
            if(!card.length){
                $(el).find(".card").removeClass('active');
            } else {
                card.siblings('.card').removeClass('active');
                card.addClass('active');
            }
        }

        function showCardInfoTable(id){
            var infoTable = $(el).find(".card-info-table[data-card-id='" + id + "']");
            if(!infoTable.length){
                $(el).find(".card-info-table").removeClass('active');
            } else {
                infoTable.siblings('.card-info-table').removeClass('active');
                infoTable.addClass('active');
                infoTable.find('[tabindex]:first').focus();
            }
        }
    }

});
var CM = CM || {};

$(function () {
    var InlineContentAddition = CM.InlineContentAddition = function InlineContentAddition(el) {
        var input = $(el);

        this.init = function() {
            input.attr('aria-expanded', this.checked);

            if(input.is(':checkbox')){
                input.on('change', function (e) {
                    $(this).attr('aria-expanded', this.checked);
                });    
            }

            if(input.is(':radio')){
                input.on('change', function (e) {
                    var target = $(this);
                    target.attr('aria-expanded', this.checked);
                    $('input[name=' + target.attr('name') + ']')
                        .not(target).attr('aria-expanded', false);
                });    
            }
        }
    }
});
var CM = CM || {};

$(function () {

    var SimpleEditableTable = CM.SimpleEditableTable = function SimpleEditableTable(el) {

        var el = $(el)
        var $edit = el.next().find('.btn-simple-edit');
        var txtSave, txtEdit;

        this.init = function(save, edit) {
            txtSave = save;
            txtEdit = edit;

            $edit.on('click', function (){
                if ($edit.attr('data-toggle') == save) {
                    toEditMode(el);
                }
                else if ($edit.attr('data-toggle') == edit) {
                    toSavedMode(el);
                }
            });
        }

        var toEditMode = function(el) {
            var field = $('input, select, textarea', el);

            replaceBtnText(txtEdit, txtSave);
            el.toggleClass('edit-mode', true);
            $(field[0]).focus();
        }

        var toSavedMode = function(el) {
            var fields = $('input, select, textarea', el);
            var weGood = validate(fields);

            if (weGood) {
                fields.each(function () {
                    var $this = $(this);
                    $this.parent().prev().html('<span>'+ $this.val() +'</span>');
                    $this.removeClass('validation-input-danger');
                });
                replaceBtnText(txtSave, txtEdit);
                el.toggleClass('edit-mode', false);
            }
        }

        var replaceBtnText = function(target, replacement) {
            var btnText = $edit.text();

            $edit.text( btnText.replace(target, replacement) );
            $edit.attr('data-toggle', target);
        }

        var validate = function(fields) {
            var firstError = true;
            var weGood = true;

            fields.each(function () {
                var el = $(this);
                var value = el.val();
                var msg = 'Field cannot be blank';

                el.parent().find('span').remove();

                if (el.is('select')) {
                    value = $('option:selected:not(:first-child)', el).text();
                    msg = 'Please make a selection'
                }
                if ( $.trim(value) == '' ) {
                    weGood = false;
                    el.addClass('validation-input-danger')
                    .attr('aria-describedby', el.prop('id') + 'Error')
                    .parent().append('<span class="validation-message-danger"></span>')
                    .find('.validation-message-danger')
                    .prop('id', el.prop('id') + 'Error')
                    .html(msg);

                    if (firstError === true) {
                        firstError = false;
                        el.focus();
                    }
                }
            });
            return weGood;

        }

    }

});

var CM = CM || {};

$(function () {
    var ExpandablePanel = CM.ExpandablePanel = function ExpandablePanel(el) {
        CM.ExpandablePanel.panels = CM.ExpandablePanel.panels || {};
        var $expandablePanelEl = $(el);
        var panelObj = {
            el: el,
            $el: $(el)
        };

        this.init = function() {
            var $controlEls = $('[aria-controls='+panelObj.$el.attr('id')+']');
            $controlEls.filter('option').closest('select').on('change', function (e) {
                var $selectMenu = $(e.currentTarget);
                var $controlOptions = $('option[aria-controls]', e.currentTarget);

                $controlOptions.each(function () {
                    var $currentOption = $(this);
                    var $expandablePanelEl = $('#'+$currentOption.attr('aria-controls'));
                    if ($currentOption.is(':selected')) {
                        var $firstText = $expandablePanelEl.find('[data-focusable-text]').first();
                        if ($firstText.length === 0) {
                            $firstText = $expandablePanelEl.find('legend, p, h1, h2, h3, h4, h5, h6, input, label, button, a').first();
                        }
                        $firstText
                            .attr('tabindex', '-1')
                            .one('blur', function () {
                                $(this).removeAttr('tabindex');
                            });
                        CM.ExpandablePanel.methods.expand($expandablePanelEl, $currentOption);
                            window.setTimeout(function () {
                                $firstText.focus();
                            }, 500);
                    } else {
                        CM.ExpandablePanel.methods.collapse($expandablePanelEl, $currentOption);
                    }
                });
            });
            $controlEls.filter('button').on('click', function (e) {
                var $expandablePanelEl = $('#'+e.currentTarget.getAttribute('aria-controls'));
                CM.ExpandablePanel.methods.toggle($expandablePanelEl, $(e.currentTarget));
            });
        }
        CM.ExpandablePanel.panels[$expandablePanelEl.attr('id')] = panelObj;
    }
    CM.ExpandablePanel.methods = {
        toggle: function($panelEl, $controlEl) {
            $panelEl = ($panelEl instanceof jQuery) ? $panelEl: $($panelEl);
            $controlEl = ($controlEl instanceof jQuery) ? $controlEl: $($controlEl);
            $panelEl.trigger('toggle', { panel: $panelEl[0], control: $controlEl[0]});

            if ($panelEl.hasClass('is-expanded')) {
                CM.ExpandablePanel.methods.collapse($panelEl, $controlEl);
            } else {
                CM.ExpandablePanel.methods.expand($panelEl, $controlEl);
            }
        },
        collapse: function($panelEl, $controlEl) {
            $panelEl = ($panelEl instanceof jQuery) ? $panelEl: $($panelEl);
            $controlEl = ($controlEl instanceof jQuery) ? $controlEl: $($controlEl);
            $panelEl.trigger('collapse', { panel: $panelEl[0], control: $controlEl[0]});

            $panelEl.removeClass('is-expanded').attr('aria-hidden', 'true');
            $controlEl.attr('aria-expanded', 'false');
        },
        expand: function($panelEl, $controlEl) {
            $panelEl = ($panelEl instanceof jQuery) ? $panelEl: $($panelEl);
            $controlEl = ($controlEl instanceof jQuery) ? $controlEl: $($controlEl);
            $panelEl.trigger('expand', { panel: $panelEl[0], control: $controlEl[0]});

            $panelEl.addClass('is-expanded').removeAttr('aria-hidden');
            $controlEl.attr('aria-expanded', 'true');
        }
    }
});
var CM = CM || {};

$(function () {
	var FilterList = CM.FilterList = function FilterList(el) {
		CM.FilterList.lists = CM.FilterList.lists || {};
		var $filterList = $(el);
		var filterListName = $filterList.attr('data-filter-list');
		var $filterListItems = $filterList.find('[data-filter-list-role=item]');
		var $filterListCopy = $filterList.find('[data-filter-list-role=copy]');
		var $filterListCopyCriteriaNames = $filterListCopy.find('[data-filter-list-role=criteria-names]');
		var $filterListData = $('[data-filter-list='+filterListName+'][data-filter-list-role=data]');
		var $filterListSubmit = $('[data-filter-list='+filterListName+'][data-filter-list-role=submit]');
		var $filterListReset = $('[data-filter-list='+filterListName+'][data-filter-list-role=reset]');
		var $filterListForm = $('[data-filter-list='+filterListName+'][data-filter-list-role=form]');
		var $filterListExpandablePanels = $filterListForm.find('.expandable-panel');

		var listObj = {
			el: el,
			$el: $filterList,
			data: [],
			items: []
		};

		this.init = function() {
			listObj.items = CM.FilterList.methods.compileItemsArr($filterListItems);
			listObj.data = CM.FilterList.methods.compileDataArr($filterListData);
			listObj.$expandablePanels = $filterListExpandablePanels;
			listObj.copy = {
				$els: $filterListCopy,
				content: $filterListCopy.text(),
				criteriaNames: {
					$els: $filterListCopyCriteriaNames,
					names: []
				}
			}
			$filterListSubmit.filter('button, [role=button]').on('click', function (e) {
				CM.FilterList.methods.submit(e.currentTarget.getAttribute('data-filter-list'));
			});
			$filterListReset.filter('button, [role=button]').on('click', function (e) {
				CM.FilterList.methods.reset(e.currentTarget.getAttribute('data-filter-list'));
			});
		}
		CM.FilterList.lists[filterListName] = listObj;
	}
	CM.FilterList.methods = {
		compileItemsArr: function($filterListItems) {
			$filterListItems = ($filterListItems instanceof jQuery) ? $filterListItems: $($filterListItems);
			var itemsArr = [];
			$filterListItems.each(function () {
				var itemObj = {
					el: this,
					$el: $(this),
					active: true,
					criteria: []
				};
				var criteriaArr = itemObj.$el.attr('data-filter-list-criteria').split(',');
				for (var i = 0; i < criteriaArr.length; i++) {
					criteriaArr[i] = criteriaArr[i].replace(/^ /, '');
					itemObj.criteria.push(criteriaArr[i].split(' '));
				}
				itemsArr.push(itemObj);
			});
			return itemsArr;
		},
		compileDataArr: function($filterListData) {
			$filterListData = ($filterListData instanceof jQuery) ? $filterListData: $($filterListData);
			var dataArr = [];
			$filterListData.each(function () {
				var showCriteriaName = ($(this).is('[data-filter-list-show=true]')) ? true : false;
				var dataObj = {
					el: this,
					$el: $(this),
					showCriteriaName: showCriteriaName,
					name: function () {
						var $input = this.$el;
						if ($input.is('select')) {
							var inputName = '';
							$input.find('option').each(function () {
								if (this.getAttribute('value') === $input.val()) {
									inputName = this.innerHTML;
								}
							});
							return inputName;
						} else if ($input.is('[type=checkbox]')) {
							var $inputLabel = $('label[for='+$input.attr('id')+']');
							return $inputLabel.html();
						}
						return $input.val();
					},
					value: function () {
						var $input = this.$el;
						var isVisible = ($input.is(':visible')) ? true : false;
						var $expandablePanel = $input.closest('.expandable-panel');
						if ($expandablePanel.length > 0) {
							if (!$expandablePanel.hasClass('is-expanded')) {
								isVisible = false;
							}
						}
						if ($input.closest('.hidden').length > 0) {
								isVisible = false;
						}
						if (isVisible) {
							if ($input.is('select')) {
								if (($input.val() === null || $input.val() === '') && $input.is('[required=required]')) {
									CM.FormInput.methods.error.show($input);
									$input.one('change', function () {
										 CM.FormInput.methods.error.hide(this);
									});
									return {error: true, value: $input.val(), field: $input};
								} else {
									CM.FormInput.methods.error.hide($input);
								}
								return $input.val();
							} else if ($input.is('[type=checkbox]')) {
								if ($input.is(':checked')) {
									return $input.val();
								} else {
									return false;
								}
							}
							return $input.val();
						} else {
							return false;
						}
					},
					reset: function () {
						var $input = this.$el;
						if ($input.is('select')) {
							var defaultOption = $input.find('[selected=selected]');

							$input.closest('.form-group').removeClass('has-value')
							if (defaultOption.length > 0) {
								$input.val(defaultOption.attr('value'));
							} else {
								$input.val($input.find('option').first().attr('value'));
							}
						} else if ($input.is('[type=checkbox]')) {
							$input[0].checked = false;
						}

					}
				};
				dataArr.push(dataObj);
			});
			return dataArr;
		},
		submit: function(filterListName) {
			var currentList = CM.FilterList.lists[filterListName];
			var collectedData = [];
			var updateItems = true;
			currentList.copy.criteriaNames.names = [];
			for (var i = 0; i < currentList.data.length; i++) {
				var currentValue = currentList.data[i].value();
				if (currentValue) {
					if (typeof currentValue === 'object') {
						if (currentValue.error === true) {
							currentList.data[i].$el.focus();
							updateItems = false;
						} else {
							if (currentList.data[i].showCriteriaName) {
								currentList.copy.criteriaNames.names.push(currentList.data[i].name());
							}
							collectedData.push(currentValue.value);
						}
					} else {
						if (currentList.data[i].showCriteriaName) {
							currentList.copy.criteriaNames.names.push(currentList.data[i].name());
						}
						collectedData.push(currentValue);
					}
				}
			}
			if (updateItems) {
				for (var j = 0; j < currentList.items.length; j++) {
					var hideItem = true;
					for (var k = 0; k < currentList.items[j].criteria.length; k++) {
						if (arraysEqual(currentList.items[j].criteria[k].sort(), collectedData.sort())) {
							hideItem = false;
							currentList.items[j].active = true;
							CM.FilterList.methods.show(currentList.items[j].$el);
						}
					}
					if (hideItem) {    
						currentList.items[j].active = false;
						CM.FilterList.methods.hide(currentList.items[j].$el);
					}
				}
				currentList.copy.$els.html(currentList.copy.content + commaSeperatedList(currentList.copy.criteriaNames.names));
				currentList.copy.$els.removeClass('hidden');
				$('html, body').animate({ scrollTop: currentList.$el.offset().top }, 300, CM.FilterList.methods.focusHeader(currentList.copy.$els));
			}
		},
		focusList: function(filterListEl) {
			filterListEl.attr('tabindex', '-1');
			window.setTimeout(function () {
				filterListEl.focus();
			}, 100);
			filterListEl.one('blur' ,function () {
				$(this).removeAttr('tabindex');
			});
		},
		focusHeader: function(filterListCopy) {
			var firstCopy = filterListCopy.first();
			firstCopy.attr('tabindex', '-1');
			window.setTimeout(function () {
				firstCopy.focus();
			}, 300);
			firstCopy.one('blur' ,function () {
				$(this).removeAttr('tabindex');
			});
		},
		focusItem: function(filterListItems) {
			for (var i = 0; i < filterListItems.length; i++) {
				if (filterListItems[i].active) {
					filterListItems[i].el.setAttribute('tabindex', '-1');
					window.setTimeout(function () {
						filterListItems[i].$el.focus();
					}, 50);
					filterListItems[i].$el.one('blur' ,function () {
						$(this).removeAttr('tabindex');
					});
					break;
				}
			}
		},
		reset: function(filterListName) {
			var currentList = CM.FilterList.lists[filterListName];
			for (var i = 0; i < currentList.data.length; i++) {
				currentList.data[i].reset();
			}
			for (var j = 0; j < currentList.items.length; j++) {   
				CM.FilterList.methods.show(currentList.items[j].$el);
			}
			currentList.$expandablePanels.each(function () {
				CM.ExpandablePanel.methods.collapse(this, $('[aria-controls='+this.getAttribute('id')+']'));
			});
			currentList.copy.$els.addClass('hidden');

		},
		toggle: function($itemEl) {
			$itemEl = ($itemEl instanceof jQuery) ? $itemEl: $($itemEl);
			$itemEl.trigger('toggle', { item: $itemEl[0], control: $controlEl[0]});

			if ($itemEl.hasClass('hidden')) {
				CM.FilterList.methods.hide($itemEl);
			} else {
				CM.FilterList.methods.show($itemEl);
			}
		},
		hide: function($itemEl) {
			$itemEl = ($itemEl instanceof jQuery) ? $itemEl: $($itemEl);
			$itemEl.trigger('hide', { item: $itemEl[0]});

			$itemEl.addClass('hidden');
		},
		show: function($itemEl) {
			$itemEl = ($itemEl instanceof jQuery) ? $itemEl: $($itemEl);
			$itemEl.trigger('show', { item: $itemEl[0]});

			$itemEl.removeClass('hidden');
		}
	}
});
function commaSeperatedList(arr) {
	var listStr = '';
	for (var i = 0; i < arr.length; i++) {
		if (i === 0) {
			listStr = listStr + ' for '+arr[i];
		} else if (i === (arr.length-1)) {
			listStr = listStr + ' and '+arr[i];
		} else {
			listStr = listStr + ', '+arr[i];
		}
	}
	listStr = listStr + ':';
	return listStr;
}
function arraysEqual(arr1, arr2) {
	if(arr1.length !== arr2.length) {
		return false;
	}
	for(var i = arr1.length; i--;) {
		if(arr1[i] !== arr2[i]) {
			return false;
		}
	}

	return true;
}
var CM = CM || {};

$(function () {
    var FormInput = CM.FormInput = function FormInput(el) {
        var $formElement = $(el);

        this.init = function() {
            $formElement.on('focus', function (e) {
                var $popoverEls = $('input:not(:focus) + [data-toggle=popover][aria-expanded=true], label:not(:focus) + [data-toggle=popover][aria-expanded=true], textarea:not(:focus) + [data-toggle=popover][aria-expanded=true], input:not(:focus)[data-toggle=popover][aria-describedby]');

                if (CM.Tooltip.methods) {
                    CM.Tooltip.methods.hide($popoverEls, true);
                }
            });

        }

        CM.FormInput.methods = {
            error: {
                toggle: function($formElement) {
                    $formElement = ($formElement instanceof jQuery) ? $formElement: $($formElement);
                    $formElement.trigger('error:toggle', { item: $formElement[0], control: $controlEl[0]});

                    if ($formElement.hasClass('validation-input-danger')) {
                        CM.FilterList.methods.hide($formElement);
                    } else {
                        CM.FilterList.methods.show($formElement);
                    }
                },
                hide: function($formElement) {
                    $formElement = ($formElement instanceof jQuery) ? $formElement: $($formElement);
                    var $errorMsg = $formElement.next('.validation-message-danger');
                    $formElement.trigger('error:hide', { item: $formElement[0]});

                    $formElement.removeAttr('aria-describedby').removeClass('validation-input-danger');
                    $errorMsg.attr('aria-hidden', 'true');
                },
                show: function($formElement) {
                    $formElement = ($formElement instanceof jQuery) ? $formElement: $($formElement);
                    var $errorMsg = $formElement.next('.validation-message-danger');
                    $formElement.trigger('error:show', { item: $formElement[0]});

                    $formElement.attr('aria-describedby', $errorMsg.attr('id')).addClass('validation-input-danger');
                    $errorMsg.attr('aria-hidden', 'false');
                }
            }
        }
    }
});
var CM = CM || {};

(function($){
    var InPageNav = CM.InPageNav = function InPageNav(el) {
        var $inPageNav = $(el);
        var $pageTabs = $(el).find('.nav-pills li');
        var $pageTabControls = $pageTabs.find('a, button');
        var $pageSelectButton = $(el).find('.j-2_module-v2 button');
	    this.init = function() {
            $pageTabs.on('click', function (e) {
                if (e.target.tagName === 'LI') {
                    $(this).find('a, button').click();
                }
            });
            $pageTabControls.on('show.bs.tab', function (e) {
                var desiredSelectValue = e.currentTarget.getAttribute('id');
                $('option[value='+desiredSelectValue+']').closest('select').val(desiredSelectValue);
            });
            $pageSelectButton.on('click', function (e) {
                var $pageSelect = $(e.currentTarget).closest('form').find('select');
                $('#'+$pageSelect.val()).tab('show');
                $inPageNav.find('[role=tabpanel].active').focus();
            });

	    }

    }
})(jQuery);
var CM = CM || {};

$(function () {
    var Tooltip = CM.Tooltip = function Tooltip(el) {
        var $popoverEl = $(el);

        this.init = function() {
            if ($popoverEl.is('[data-close="button"]')) {
                var titleSrOnly = 'sr-only';

                var popoverClassnames = $popoverEl.attr('data-classnames') || '';
                if ($popoverEl.attr('data-show-title') === 'true') {
                    titleSrOnly = '';
                    popoverClassnames = popoverClassnames + ' has-header';
                }
                $popoverEl.attr('data-template', '<div class="popover ' + popoverClassnames + '" role="alert" aria-label="' + $popoverEl.attr('aria-label') + '"><div class="arrow"></div><h3 class="popover-title ' + titleSrOnly + '"></h3><div class="popover-content small"></div><button class="popover-close-button" tabindex="0" data-sigil="touchable" role="button">close</button></div>');
            }

            $popoverEl.popover({
                trigger: 'manual',
                html: true,
                content: function() {
                    return $('#popover-content').html();
                }
            });
            $popoverEl.on('click focus mouseenter keypress touchstart', function(e) {
                var self = $(this);
                if (self.attr('data-from-close') === 'true') {
                    self.removeAttr('data-from-close');
                    return false;
                }
                var keyCheck = (e.keyCode === 13 || e.type !== 'keypress') ? true : false;
                if (self.next('.popover.in').length === 0 && keyCheck && self.attr('data-open-method') !== 'click') {
                    CM.Tooltip.methods.show(self, e.type);
                } else if (self.attr('data-open-method') === 'click' && e.type === 'click') {
                    CM.Tooltip.methods.hide(self, true);
                } else if (self.attr('data-open-method') !== 'click') {
                    self.attr('data-open-method', e.type);
                }
            })
            .on('mouseout blur', function(e) {
                var self = $(this);
                if (e.type === 'blur' && self.attr('data-open-method') !== 'click') {
                    window.setTimeout(function() {
                        if (!self.next().find('.popover-close-button').is(':focus')) {
                            CM.Tooltip.methods.hide(self);
                        }
                    }, 10);
                } else {
                    if (self.attr('data-open-method') !== 'click') {
                        CM.Tooltip.methods.hide(self);
                    }
                }
            })
            .on('click focus mouseover', function(e) {
                var $otherPopovers = $('[data-toggle=popover]').not(this);
                if (e.type === 'mouseover') {
                    $otherPopovers = $otherPopovers.not('[type=password]');
                }
                CM.Tooltip.methods.hide($otherPopovers, true);
            });
            $popoverEl.one('inserted.bs.popover', function (e) {
                $(e.currentTarget).next('.popover').find('.popover-close-button').on('click touchstart', function(e) {
                    e.preventDefault();
                    var self = $(this);
                    var $popoverContent = self.closest('.popover.in');
                    var $toggleEl = $popoverContent.prev('[data-toggle=popover]');

                    CM.Tooltip.methods.hide($toggleEl, true, true);
                    
                    $popoverContent.attr('aria-expanded', 'false');

                });
            });

        }

        CM.Tooltip.methods = {
            toggle: function($popoverEl) {
                $popoverEl = ($popoverEl instanceof jQuery) ? $popoverEl: $($popoverEl);
                $popoverEl.trigger('toggle', { popover: $popoverEl[0] });

                if ($popoverEl.next('.popover.in').length) {
                    CM.Tooltip.methods.hide($popoverEl);
                } else {
                    CM.Tooltip.methods.show($popoverEl);
                }
            },
            hide: function($popoverEl, resetTrackingData, fromCloseButton) {
                $popoverEl = ($popoverEl instanceof jQuery) ? $popoverEl: $($popoverEl);
                $popoverEl.trigger('hide', { popover: $popoverEl[0] });
                $popoverEl
                    .attr('aria-expanded', 'false')
                    .removeAttr('data-from-close')
                    .popover('hide');
                if (resetTrackingData) {
                    $popoverEl.removeAttr('data-open-method');
                }
                if (fromCloseButton) {
                    $popoverEl.attr('data-from-close', 'true');
                    $popoverEl.focus();
                }
            },
            show: function($popoverEl, openEvent) {
                $popoverEl = ($popoverEl instanceof jQuery) ? $popoverEl: $($popoverEl);
                var $errorMsg = $popoverEl.next('.validation-message-danger');
                $popoverEl.trigger('show', { popover: $popoverEl[0] });
                $popoverEl.attr('data-open-method', openEvent);
                $popoverEl.attr('aria-expanded', 'true');
                $popoverEl.popover('show');
            }
        }
    }
});
var CM = CM || {};

$(function () {

    var TableComparison = CM.TableComparison = function TableComparison(el) {

        var el = $(el);
        var $tableHead = el.find('thead');
        var $tableHeadAnchors = $tableHead.find('a');
        var $tableMobileRows = el.find('.for-mobile');
        var windowWidth = 0;
        var resizeDebounce;
        var tableAccordionActive = true;

        this.init = function() {
            
            $(window).on('resize', function(e) {
                clearTimeout(resizeDebounce);
                resizeDebounce = setTimeout(function() {
                    _tableModeSwitchChecker();
                }, 100);
            });

            _tableModeSwitchChecker();

            el.on('click keyup', 'tr.for-mobile', function(e) {
                var $clickedRow, $clickedRowNext;
                if (e.keyCode !== 13 && e.keyCode !== 32 && e.keyCode !== undefined) {
                    return;
                } else {
                }
                $clickedRow = $(this),
                    $clickedRowNext = $clickedRow.next();
                if ($clickedRowNext.is(':animated')) {
                    return;
                }

                if ($clickedRow.hasClass('is-expanded')) {
                    $clickedRow.removeClass('is-expanded');
                    $clickedRow.attr("data-toggle", "collapse");

                    $clickedRowNext
                        .attr('aria-hidden', true);
                    ;
                    $clickedRow.find('span:first').attr({
                        'aria-expanded': false,
                        'aria-selected': false,
                        'data-title': 'Select to display'
                    }).blur();
                } else {
                    $clickedRow.addClass('is-expanded');
                    $clickedRow.attr("data-toggle", "expanded");

                    $clickedRowNext
                        .attr('aria-hidden', false);

                    $clickedRow.find('span:first').attr({
                        'aria-expanded': true,
                        'aria-selected': true,
                        'data-title': 'Select to hide'
                    }).focus();
                }
            });

            $('body').on('click touch', '.table-toggle-more', function(e) {
                var $this = $(this);

                if ($this.attr('aria-expanded') == 'false') {
                    $this
                        .attr('aria-expanded', 'true')
                        .addClass('expanded');
                    el.find('.table-hidden-by-default')
                        .addClass('table-show')
                        .attr('aria-hidden', 'false');
                } else {
                    $this
                        .attr('aria-expanded', 'false')
                        .removeClass('expanded');
                    el.find('.table-hidden-by-default')
                        .removeClass('table-show')
                        .attr('aria-hidden', 'true');
                }
            });
            
        }

        function _tableModeSwitchChecker() {
            windowWidth = $(window).width();
            if (windowWidth < 769) {
                el.removeClass('mode-desktop');
                el.addClass('mode-mobile');
                _tableModeSwitchToMobile();
            }
            else if (windowWidth > 768) {
                el.removeClass('mode-mobile');
                el.addClass('mode-desktop');
                _tableModeSwitchToDesktop();
            }
        }

        function _tableModeSwitchToMobile() {
            el.attr('role', 'presentation');
            $tableHeadAnchors.attr('tabindex', '-1');
            $tableHead.attr('aria-hidden', 'true');
            $tableMobileRows.each(function(i, el) {
                var $mobileRow = $(this),
                    $mobileRowNext = $mobileRow.next('.table-row');

                if ($mobileRow.hasClass('is-expanded')) {
                    $mobileRowNext.attr('aria-hidden', 'false');
                } else {
                    $mobileRowNext.attr('aria-hidden', 'true');
                }
            });
        }

        function _tableModeSwitchToDesktop() {
            el.removeAttr('role');
            $tableHeadAnchors.removeAttr('tabindex');
            $tableHead.attr('aria-hidden', 'false');
            $tableMobileRows.each(function(i, el) {
                var $mobileRow = $(this),
                    $mobileRowNext = $mobileRow.next('.table-row');
                if ($mobileRowNext.hasClass('table-show')) {
                    $mobileRowNext.attr('aria-hidden', 'false');
                }
                else if ($mobileRowNext.hasClass('table-hidden-by-default')) {
                    $mobileRowNext.attr('aria-hidden', 'true');
                }
                else {
                    $mobileRowNext.attr('aria-hidden', 'false');
                }
            });
        }
        $('.toggle-accordion-table').on('click touch', function() {
            var $this = $(this);
            var $target = $this.closest('.comparison-table-module').find($tableMobileRows);

            if (tableAccordionActive) {
                tableAccordionActive = false;
                $target.attr('data-toggle', 'expanded');
                $target.addClass("is-expanded");
                $this.find("span").text('Collapse All Sections');
                $target.find('th span').attr('aria-expanded', 'true');
                $target.find('th span').attr('aria-selected', 'true');
                $target.find('th span').attr('data-title', 'Select to hide');
                $target.find('th span').attr('data-toggle', 'expanded');
            } else {
                tableAccordionActive = true;
                $target.attr('data-toggle', 'collapse');
                $target.removeClass("is-expanded");
                $this.find("span").text('Expand All Sections');
                $target.find('th span').attr('aria-expanded', 'false');
                $target.find('th span').attr('aria-selected', 'false');
                $target.find('th span').attr('data-title', 'Select to display');
                $target.find('th span').attr('data-toggle', 'collapse');
            }
        });
        $tableMobileRows.on('click touch', function() {
            var $this = $(this);

            setTimeout(function() {
                var $expandedRows = $this.closest('.comparison-table-module').find('.is-expanded').length;
                var $count = $this.closest('.comparison-table-module').find($tableMobileRows).length;

                if ($expandedRows >= $count) {
                    $this.closest('.comparison-table-module').find(".toggle-accordion-table span").text('Collapse All Sections');
                    tableAccordionActive = false;
                } else if ($expandedRows = $count) {
                    $this.closest('.comparison-table-module').find(".toggle-accordion-table span").text('Expand All Sections');
                    tableAccordionActive = true;
                }
            }, 5)
        });
    }

});
var CM = CM || {};

$(function () {

    var VideoYT = CM.VideoYT = function VideoYT(el) {

        var el = $(el)

        this.init = function() {
            var player;
            var containerID = el.attr('id');
            var videoId = el.attr('data-videoid');

            player = new YT.Player(containerID, {
                videoId: videoId,
                events: {
                    'onReady': onPlayerReady,
                    'onStateChange': onPlayerStateChange
                }
            });
            $('#'+containerID).addClass('embed-responsive-item')
            .removeAttr('width').removeAttr('height');
            function onPlayerReady(event) {
                $('.video-modal').on('shown.bs.modal', function (e) {
                    var find = $(this).find('#'+event.target.h.id)[0];
                    if ($(find).attr('id') == event.target.h.id) {
                        event.target.playVideo();
                    }
                });
            }
            var done = false;
            function onPlayerStateChange(event) {
             if (event.data == YT.PlayerState.PLAYING && !done) {
               setTimeout(stopVideo, 6000);
               done = true;
             }
            }
            function stopVideo() {
             player.pauseVideo();
            }
        }

    }

});
var iOS = (navigator.userAgent.match(/(iPad|iPhone|iPod)/g) ? true : false );
var titleAttr = (iOS) ? 'title' : 'data-title';

$(function () {
    $('table').each(function() {
        var table = new CM.Table(this);
        table.init();
    });

    $('.sortable-table').each(function() {
        var table = new CM.TableSortable(this);
        table.init();
    });

    $('.input-table').each(function() {
        var table = new CM.TableInput(this);
        table.init();
    });

    $('.accordion').each(function() {
        var accordion = new CM.Accordion(this);
        accordion.init();
    });

    $('.accordion.form').each(function() {
        var form = new CM.AccordionForm(this);
        form.init();
    });

    $('.slider').each(function() {
        var options = {range: "min",
                       value: 1,
                       min: 1,
                       max: 5
                      };
        var slider = new CM.Slider(this, options);
        slider.init();
    });

    $('.inline-addition').each(function() {
        var addition = new CM.InlineAddition(this);
        addition.init();
    });

    $('input, .datepickerDOB select, select').each(function() {
        var formLabel = new CM.FormLabel(this);
        formLabel.init();
    });
    $('.withInlineAddition').each(function() {
        var active = new CM.InlineAddition(this);
        active.init();
    });
    $('[data-toggle="modal"]').each(function() {
        var modal = new CM.Modal(this);
        modal.init();
    });
    $('[type="password"]').each(function() {
        var formPassword = new CM.FormPassword(this);
        formPassword.init();
    });
    $('input.formatted').each(function() {
        var formFormatted = new CM.FormFormatted(this);
        formFormatted.init();
    });
    $('.percentage-progress-container').each(function(){
        var percentageProgressIndicator = new CM.PercentageProgressIndicator(this);
        percentageProgressIndicator.init(percentageProgressIndicator);
    });
    $('.input-group-btn select, .input-group-btn input').each(function() {
        var formAddonBtn = new CM.FormAddonBtn(this);
        formAddonBtn.init();
    });
    $('.associated-input').each(function() {
        var associatedInput = new CM.AssociatedInput(this);
        associatedInput.init();
    });
    $('.datepickerDOB').each(function() {
        new CM.DatepickerDOB(this).init();
    });
    $('table.internal-expand-table').each(function() {
        new CM.TableInternalExpand(this).init();
    });
    $('.dateinput-simple').each(function() {
        new CM.SimpleDateInput(this).init();
    });
    $('.expand-collapse').each(function() {
        new CM.ExpandCollapse(this).init();
    });
    $('.collapse').each(function() {
        if($(this).parents('.expand-collapse').length == 0){
            $(this).collapse({ toggle: false });
        }
    });
    $('.tabs').each(function(){
        new CM.Tabs(this).init();
    });
    $('.card-selector').each(function(){
        new CM.CardSelector(this).init();
    });
    $('.inline-addition.content-addition input:checkbox, .inline-addition.content-addition input:radio').each(function(){
        new CM.InlineContentAddition(this).init();
    });
    $('.expandable-panel').each(function(){
        new CM.ExpandablePanel(this).init();
    });
    $('.table-simple-editable').each(function(){
        new CM.SimpleEditableTable(this).init('Save','Edit');
    });
    $('[data-filter-list-role=list]').each(function(){
        new CM.FilterList(this).init();
    });
    $('input, select, textarea').each(function(){
        new CM.FormInput(this).init();
    });
    $('.in-page-nav').each(function(){
        new CM.InPageNav(this).init();
    });
    $('.tooltip-toggle[data-toggle="popover"]').each(function(){
        new CM.Tooltip(this).init();
    });
    $('table.comparison-table').each(function() {
        new CM.TableComparison(this).init();
    });
    if($('script[src="https://www.youtube.com/iframe_api"]').length == 0) {
        var tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";

        var firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }
    var datepickerOptions = {
        editable: false, //makes input readonly - you cannot type the date in
        weekdaysShort: ['S', 'M', 'T', 'W', 'T', 'F', 'S'], //configure day short forms
        showMonthsShort: false, //don't use short forms for months
        today: false, //do not show today btn
        clear: false, //do not show clear btn
        close: false, //do not show close btn

        onStart: function(context){
            var input = this.$node;
            var picker = this;
            input.click(function(e){

                if(input.is(':focus') && picker.get('open')){
                    picker.close();
                    input.blur(); //if input is still focused it prevents the next toggle open
                }
            })

            input.on("change keyup paste", function(e){
                $(e.target).focus();
            })
        },
        onSet: function(context) {
            this.$node.addClass('date-selected');
            this._hasBeenSelected = true;
        },
        onRender: function(context){
            var prefixStr = 'Today: ';
            $('.picker__nav--next, .picker__nav--prev, .picker__day').attr('tabindex','0');
            $('.picker__day--highlighted').focus(); 
            $('.picker__day').last().blur(function(e){
                $(e.target).closest('.picker__table').prev().find('.picker__nav--prev').focus();
            })
            if(!this._hasBeenSelected && this.$node.val().indexOf(prefixStr) === -1){
                var inputDate = new Date(this.get());
                var currentDate = new Date();

                if(inputDate.setHours(0,0,0,0) === currentDate.setHours(0,0,0,0)){
                    var inputValue = this.$node.val();
                    this.$node.val('Today: ' + inputValue);
                }
            }
        }

    };

});

function onYouTubeIframeAPIReady() {
    $('.yt-api-video-iframe').each(function(){
        new CM.VideoYT(this).init();    
    });
}