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
        //This code loads the YouTube IFrame Player API code asynchronously
        //Calls onYouTubeIframeAPIReady
        var tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";

        var firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }

    /*
     * See http://amsul.ca/pickadate.js/date/ for description of datepicker options 
     */
    
    //configure datepicker options
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
                
                /* Toggle Logic
                 * if the inout has focus  
                 * AND the picker is already open && we have just had a click
                 * then close the datepicker
                 ***/

                if(input.is(':focus') && picker.get('open')){
                    picker.close();
                    input.blur(); //if input is still focused it prevents the next toggle open
                }
            })

            input.on("change keyup paste", function(e){
                $(e.target).focus();
            })
        },

        // change input text color to blue when user makes a selection
        //TODO it does not appear possible to 'un-select' a date
        onSet: function(context) {
            this.$node.addClass('date-selected');
            this._hasBeenSelected = true;
        },

        //Add 'Today: ' to date if its === to today and a value hasn't been selected yet
        onRender: function(context){
            var prefixStr = 'Today: ';

           //give tab indexes to next/prev month & each day on the calendar
            $('.picker__nav--next, .picker__nav--prev, .picker__day').attr('tabindex','0');
            //focus whichever day recieves the datepikcer focus
            $('.picker__day--highlighted').focus(); 
            
            //handle blur on last day and return focus to first element
            //user can loop back to top and choose next/prev month or tab through again
            //user can press esc to leave the datepicker
            $('.picker__day').last().blur(function(e){
                $(e.target).closest('.picker__table').prev().find('.picker__nav--prev').focus();
            })

            //do not add today prefix it already exists
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

    //initialize all datepickers
    //$('.datepicker').pickadate(datepickerOptions);

});

function onYouTubeIframeAPIReady() {
    $('.yt-api-video-iframe').each(function(){
        new CM.VideoYT(this).init();    
    });
}