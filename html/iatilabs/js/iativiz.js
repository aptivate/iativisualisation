/*global _, window, jQuery, Raphael, feed, states, StateMachine */

/* glossary:

Highlighted means when the mouse hovers over part of a chart and the sector
is then "highlighted".

Selected means when the user clicks on part of a chart and that sector then stays "selected" until the chart is clicked again.

*/

// TODO: wrap all code in a self-calling anonymous function

"use strict";

// SETTINGS
var scale = 1,
    outerRadius = 100 * scale,
    innerCircleRatio = 0.48,
    chartCalloutOffset = 10 * scale,
    topMargin = 10 * scale,
    leftMargin = 200 * scale,
    rightMargin = 280 * scale,
    separation = 62 * scale,
    arrowSize = 10 * scale,
    arrowLabelMargin = 30 * scale,
    chartCentreTextSize = 20 * scale, //px
    chartCalloutTextSize = 18 * scale, //px
    chartTitleTextSize = 14 * scale, //px
    chartTitleMargin = 24 * scale, //px
    flowLabelTextSize = 16 * scale, //px
    flowLabelOffsetX = 10 * scale, //px
    flowLabelOffsetY = 10 * scale, //px
    inactiveFlowColour = "#000",
    activeFlowColour = "#a11",
    innerFill = "#000",
    highlightedCircleColour = "#a11",
    selectedCircleColour = "#e11",
    highlightedSectorColour = "#a11",
    selectedSectorColour = "#e11",
    chartCentreTextColour = "#fff",
    highlightedCalloutTextColour = "#a11",
    selectedCalloutTextColour = "#e11",    
    notesWidth = 200, //size of the notes box
    resetButton,
    resetButtonText,
    resetTextColour = "#fff",
    resetButtonColour = "#000",
    entityColours,
    animationMilliseconds = 300,

/////


// Working out some drawing stuff...    
    dX = leftMargin + outerRadius,
    dY = topMargin + outerRadius,
    rX = dX + separation + (outerRadius * 2),
    rY = dY,
    mX = dX + ((rX - dX) / 2),
    mY = Math.floor(
        Math.sqrt(Math.pow(rX - dX, 2) - Math.pow((rX - dX)/2, 2)) + dY
    ),

    resetR = 20 * scale,
    resetX = rX + outerRadius + 2 * resetR,
    resetY = mY + outerRadius - resetR,  //topMargin + 250 * scale,
    resetTextSize = 12 * scale,


/////




// OTHER VARIABLES
    viz = Raphael("viz"),
    vizElem = jQuery("#viz"),
    data,
    donorValues = [],
    recipientValues = [],
    multilateralValues = [],
    donorRefs = [],
    recipientRefs = [],
    multilateralRefs = [],
    diagram,
    charts,
    flows,
    placeHolderCalloutText = "-",
    stateMachine = new StateMachine(states, START);
    undef;


/////


// LOW-LEVEL FUNCTIONS
function formatNumber(number, currency){
    currency = currency || "$";

    if (number > 1000000000000) {
        return currency + Math.round(number/1000000000000) + "T";
    } else if (number > 1000000000) {
        return currency + Math.round(number/1000000000) + "B";
    } else if (number > 1000000) {
        return currency + Math.round(number/1000000) + "M";
    } else if (number > 1000) {
        return currency + Math.round(number/1000) + "K";
    } else {
        return currency + number;
    }
}


/////

function reverseString(str){
    return str.split("").reverse().join("");
}

function sortByReverseString(a, b){
    return reverseString(a.toLowerCase()) > reverseString(b.toLowerCase()) ? 1 : -1;
}

var objectKeys = Object.keys ?
    Object.keys :
    function(obj){
        var keys = [];
        
        jQuery.each(obj, function(key){
            keys.push(key);
        });
        return keys;
    };
    
function objectValues(obj){
    var vals = [];
        
    jQuery.each(obj, function(key, val){
        vals.push(val);
    });
    return vals;
}

function unique(array){
    var newArray = [],
        i = 0,
        len = array.length;
    
    array.sort();
    for (; i < len; i++){
        if (array[i+1] !== array[i]){
            newArray.push(array[i]);
        }
    }
    return newArray;
}

function generateColoursByReverseName(names){
    // sort by the reverse of the array element strings, e.g. compare "kramneD" with "nedewS" !
    names = unique(names).sort(sortByReverseString);

    var length = names.length,
        i = 0,
        colours = {},
        minColour = 0x33,
        maxColour = 0xee,
        increment = (maxColour - minColour) / (length - 1),
        currentColour = minColour,
        rgbComponent;
        
    for (; i < length; i++) {
        rgbComponent = parseInt(currentColour, 10);
        colours[names[i]] = "rgb(" + rgbComponent + "," + rgbComponent + "," + rgbComponent + ")";
        currentColour += increment;
    }
    return colours;
}

// Return an array of colours, given an array of entity names
function getColours(names){
    return jQuery.map(names, function(name){
        return entityColours[name];
    });
}


/////


// CLASSES
function Entity(type){
    this.type = type;
}
Entity.prototype = {
    name: "unknown",
    init: function(name){
        this.name = name;
        this.donor = {};
        this.recipient = {};
        this.multilateral = {};
        this.total = {
            donor: 0,
            recipient: 0,
            multilateral: 0,
            total: 0
        };
    },
    add: function(entity, amount){ // e.g. donor.add("recipient", "India", 43243);
        if (this[entity.type][entity.name]){
            throw "Entity.add: " + this.name + "[" + entity.type + "][" + entity.name + "] already exists";
        }
        this[entity.type][entity.name] = amount;
        this.total[entity.type] += amount;
        this.total.total += amount;
        return this;
    }
};


function Donor(name){
    this.init(name);
}
Donor.prototype = new Entity("donor");

function Recipient(name){
    this.init(name);
}
Recipient.prototype = new Entity("recipient");

function Multilateral(name){
    this.init(name);
}
Multilateral.prototype = new Entity("multilateral");


/////


function Chart(title, type, entities, x, y, r, calloutOffset){
    var absOffset = Math.abs(calloutOffset),
        offsetSign = calloutOffset / absOffset,
        xOffset = offsetSign * (absOffset + r),
        titleNode,
        titleNodeHeight,
        calloutTextNode,
        calloutTextNodeHeight;
   
    this.title = title;
    this.type = type;
    this.entities = entities;
    this.x = x;
    this.y = y;
    this.r = r;
    this.calloutOffset = calloutOffset;
    
    titleNode = this.titleNode = viz.text(this.x + xOffset, -999, title)
        .attr({
            "font-size": chartTitleTextSize + "px",
            "text-anchor": offsetSign > 0 ? "start" : "end"
        });
     
    calloutTextNode = this.calloutTextNode = viz.text(this.x + xOffset, -999, 
        placeHolderCalloutText)
        .attr({
            "font-size": chartCalloutTextSize + "px",
            "text-anchor": offsetSign > 0 ? "start" : "end",
            "fill": highlightedCalloutTextColour,
            "opacity": 0
        });
    
    titleNodeHeight = chartTitleTextSize;
    titleNode.attr("y", this.y - (titleNodeHeight / 2));
    
    calloutTextNodeHeight = chartCalloutTextSize;
    calloutTextNode.attr("y", this.y + (calloutTextNodeHeight / 2) + chartTitleMargin);
    
    this.pie = this.createPie();
    
    this.innerCircle = viz.circle(x, y, r * innerCircleRatio).attr({fill: innerFill, stroke:"none"});
    
    this.centreTextNode = viz.text(this.x, this.y, "")
        .attr({
            "font-size": chartCentreTextSize + "px",
            "fill": chartCentreTextColour
        });
        
    this.total = this._unfilteredTotal = data.total[this.type];
    this._preSelectedSectorPath = "";
}
Chart.prototype = {
    _isSelected: false,
    _selectedSector: null,
    _selectedEntity: null,
    _highlightedSector: null,
    _highlightedEntity: null,

    setCentreText: function(text, show){
        if (show) {
            this.centreTextNode.attr("text", text);
            this.centreTextNode.show();
        } else {
            this.centreTextNode.hide();
        }
        return this;
    },
    
    setCalloutText: function(text, colour, opacity){
        var maxTextWidth = 25;
        var splitText = wordWrap(text, maxTextWidth);
        
        this.calloutTextNode.attr({"text": splitText, "fill": colour, 
            "opacity": opacity});
            
        return this;
    },
    
    getSelectedSector: function(){
        return this._selectedSector;
    },
    
    getSelectedEntity: function(){
        return this._selectedEntity;
    },
    
    getHighlightedSector: function(){
        return this._highlightedSector;
    },
    
    getHighlightedEntity: function(){
        return this._highlightedEntity;
    },
    
    isSelected: function(){
        return this._isSelected;
    },
    
    selectSector: function(sector, showCentreValue){
        var coverNode = jQuery(sector),
            coverEl = coverNode.data("coverEl"),
            entity = coverNode.data("ref"),
            value = formatNumber(entity.total.total);

        coverEl.attr({
            "fill-opacity": 100, 
            "fill": selectedSectorColour});
        
        this._preSelectedSectorPath = coverEl.attr("path");
            
        var rX = this.r;
        var rY = this.r;

        var arcStartX = this.x - rX;
        var arcStartY = this.y;

        var arcEndX = arcStartX;
 
        // add a small offset to ensure something is drawn     
        var arcEndY = arcStartY + 0.1;
        var moveTo = "M" + arcStartX + "," + arcStartY;
        
        var xAxisRotation = 0;
        var largeArcFlag = 1;
        var sweepFlag = 1;
        
        var arc = "A" + rX + "," + rY + "," + xAxisRotation + "," + 
            largeArcFlag + "," + sweepFlag + "," + arcEndX + "," + arcEndY;
        var closePath = "Z";    
            
        coverEl.animate({
            "path": moveTo + arc + closePath
            }, 
            animationMilliseconds);
        
        this.setCentreText(value, showCentreValue);
        
        var opacity = 1;
        this.setCalloutText(entity.name, selectedCalloutTextColour, opacity);
        this.innerCircle.attr("fill", selectedCircleColour);
        
        this._selectedSector = sector;
        this._selectedEntity = entity;
        this._isSelected = true;
        return this;
    },
    
    unselectSector: function(showCentreValue){
        if (this._selectedSector){
            var coverNode = jQuery(this._selectedSector),
                coverEl = coverNode.data("coverEl");

            if (!this._preSelectedSectorPath == "") {
                coverEl.animate({
                    "path": this._preSelectedSectorPath
                    },
                    animationMilliseconds);
                this._preSelectedSectorPath = "";
            }
            coverEl.attr({"fill-opacity": 0});
            this.resetText(showCentreValue);
        }
        
        this._selectedSector = this._selectedEntity = null;
        this._isSelected = false;
        return this;
    },

    highlightSector: function(sector, showCentreValue){
        var coverNode = jQuery(sector),
            coverEl = coverNode.data("coverEl"),
            sectorEl = coverNode.data("sectorEl"),
            entity = coverNode.data("ref"),
            pie = this.filteredPie || this.pie,
            value = formatNumber(entity[pie.entityType][pie.entityName]),
            name = entity.name;
        
        if (sectorEl.value.others ) {
            value = formatNumber(sectorEl.value.value);
            name = "others";
        }
            
        this._highlightedSector = coverNode;
        this._highlightedEntity = entity;
        coverEl.attr({"fill-opacity": 100, "fill": highlightedSectorColour});
        
        this.setCentreText(value, showCentreValue);
        
        var opacity = 1;
        this.setCalloutText(name, highlightedCalloutTextColour, opacity);
        this.innerCircle.attr("fill", highlightedCircleColour);
    },
    
    unhighlightSector: function(showCentreValue){
        var coverNode,
            coverEl;
            
        if (this._highlightedSector) {
            coverNode = this._highlightedSector;
            coverEl = coverNode.data("coverEl");
            coverEl.attr("fill-opacity", 0);
            this.resetText(showCentreValue);
        }
        this._highlightedSector = this._highlightedEntity = null;        
    },
    
    createPie: function(entities, entityType, entityName){
        entities = entities || this.entities;
        entityType = entityType || "total";
        entityName = entityName || "total";        
        
        var values = [],
            refs = [],
            colours = getColours(objectKeys(entities).sort()),
            pie;
            
        jQuery.each(entities, function(name, entity){
            values.push(entity[entityType][entityName]);
            refs.push(entity);
        });
        
        pie = viz.g.piechart(this.x, this.y, this.r, values, {refs:refs, colors:colours});
        pie.entityType = entityType;
        pie.entityName = entityName;
        
        return pie;
    },
    
    filter: function(entities, total, entityType, entityName, showCentreValue){
        if (entities){
            //_("Applying a filter");
            this.pie.hide();
            this.filteredPie = this.createPie(entities, entityType, entityName);
            this.total = total;
            this.innerCircle.toFront();
            this.centreTextNode.toFront();
            this.setCentreText(formatNumber(total), showCentreValue);
        }
        else {
            this.pie.show();
            if (this.filteredPie){
                this.filteredPie.remove();
                this.filteredPie = null;
                this.total = this._unfilteredTotal;
            }
        }
    },
    
    resetText: function(showCentreValue) {
        this.setCentreText(formatNumber(this.total), showCentreValue);
        
        var opacity = 0;
        this.setCalloutText(placeHolderCalloutText, highlightedCalloutTextColour,
         opacity);
        this.innerCircle.attr("fill", innerFill);
    },
    
    reset: function() {
        this.unselectSector(true);
        this.unhighlightSector(true);
        this.resetText(true);
    }
};


/////


// CHARTS CONSTRUCTOR
function Charts(){
    this.collection = {};
}
Charts.prototype = {
    // Get a chart by passing its type, or set a chart by passing it in
    chart: function(chart){
        if (chart instanceof Chart){
            this.collection[chart.type] = chart;
            return this;
        }
        return this.collection[chart];
    },
    
    otherCharts: function(excludedName){
        var charts = [];
        jQuery.each(this.collection, function(type, chart){
            if (type !== excludedName){
                charts.push(chart);
            }
        });
        return charts;
    },
    
    reset: function(){
        jQuery.each(this.collection, function(type, chart){
            chart.reset();
        });
        return this;
    }    
    
};


/////


function Flow(source, dest){
    this.source = source;
    this.dest = dest;
    this.type = this.getType();
    this.arrow = this.createArrow();
    this.label = this.createLabel();
    this.show();
}

Flow.prototype = {
    getType: function() {
        return Flow.getType(this.source, this.dest);
    },
    
    createArrow: function(){
        var length = Math.floor(
                Math.sqrt(
                    Math.pow(this.dest.x - this.source.x, 2) + 
                    Math.pow(this.dest.y - this.source.y, 2)
                ) - (this.source.r + this.dest.r)
            ),
            angle = Math.atan(
                (this.dest.y - this.source.y) /
                (this.dest.x - this.source.x)
            );

        this.cx = (this.source.x + this.dest.x) / 2;
        this.cy = (this.source.y + this.dest.y) / 2;

        return viz.path(
            "M0 0" +
            "L" + length + " 0" +
            "L" + (length - arrowSize) + " " + arrowSize / 1.6 +
            "L" + (length - arrowSize) + " " + (-arrowSize / 1.6) + 
            "L" + length + " 0"
        )
        .translate(this.source.x + this.source.r, this.source.y)
        .rotate(Raphael.deg(angle), this.source.x, this.source.y)
        .attr("fill", "#000");
    },
    
    createLabel: function() {
        //get co-ordinates of diagram's centre
        var centre = diagram.getCentre(),
            centreX = centre[0],
            offsetX = flowLabelOffsetX,
            offsetY = flowLabelOffsetY,
            anchor;
        
        
        if (centreX > this.cx) {
            //anchor text right
            anchor = "end";
            offsetX = -offsetX;
        } else if (centreX < this.cx) {
            //anchor text left
            anchor = "start";
        } else {
            //anchor text centre
            anchor = "middle";
            offsetY = -offsetY * 2;
            offsetX = 0;
        }        
        
        return viz.text(this.cx + offsetX, this.cy + offsetY, "")
            .attr({
                "font-size": flowLabelTextSize + "px",
                "text-anchor": anchor
            });
    },
    
    text: function(text) {
        this.label.attr("text", text); 
        return this;
    },
    
    hide: function() {
        this.label.hide();
        this.arrow.hide();
        return this;
    },
    
    show: function() {
        this.label.show();
        this.arrow.show();
        return this;
    }
};
Flow.getType = function(source, dest){
    source = typeof source === "string" ? source : source.type;
    dest = typeof dest === "string" ? dest : dest.type;

    return (source < dest) ?
        source + "-" + dest :
        dest + "-" + source;
};


/////


function Flows(){
    this.collection = {};
}
Flows.prototype = {
    // Get or set a flow
    flow: function(source, dest){
        // set
        if (source instanceof Flow){
            this.collection[source.type] = source;
            return this;
        }
        // get
        return this.collection[Flow.getType(source, dest)];
    },
    
    hide: function() {
        jQuery.each(this.collection, function (type, flow) {
            flow.hide();
        });
        return this;
    },
    
//    show: function() {
//        jQuery.each(this.collection, function (type, flow) {
//            flow.show();
//        });
//        return this;
//    },
    
    otherFlows: function(excludedName){
        return jQuery.map(this.collection, function(flow){
            if (flow.type !== excludedName){
                return flow;
            }
        });
    }
};


/////


function Diagram() {
}
Diagram.prototype = {

    //this assumes only one selected chart is possible. 
    getSelectedChart: function() {
        for (var i in charts.collection) {
            if (charts.collection[i].isSelected()) {
                return charts.collection[i];
            }
        }
        return null;
    },
    
    isDisplayCentreText: function(chart) {
        var selectedChart = this.getSelectedChart();
        
        if (chart.type != "multilateral") {
            return true;
        } else if (selectedChart && selectedChart != chart) {
            // another chart is selected, so we know which value
            // to display in the middle
            return true;
        } else {
            // no other chart is selected, so we don't display
            // anything and let the arrows do the talking
            return false;
        }
    },

    highlightSector: function(node) {
        var entity = jQuery(node).data("ref"),
            chart = charts.chart(entity.type),
            selectedChart;
        
        chart.highlightSector(node, this.isDisplayCentreText(chart));

        this.setFlows(node);
        
        return this;
    },
    
    
    
    unhighlightSector: function(node){
        var entity = jQuery(node).data("ref"),
            chart = charts.chart(entity.type),
            selectedChart = this.getSelectedChart();    
        
        chart.unhighlightSector(this.isDisplayCentreText(chart));
        
        this.setFlows();

        return this;
    },
    
    
    selectSector: function(node){
        var entity = jQuery(node).data("ref"),
            chart = charts.chart(entity.type),
            otherCharts,
            dia = this;
        
        if (!chart.isSelected()){
            
            chart.selectSector(node, this.isDisplayCentreText(chart));
            otherCharts = charts.otherCharts(entity.type);
            
            jQuery.each(otherCharts, function(i, otherChart){
                var otherChartName = otherChart.type,
                    entities = {};
            
                // Grab full reference object for each entity
                jQuery.each(entity[otherChartName], function(name, entity){
          
                    entities[name] = data[otherChartName][name];
                });
                otherChart.filter(entities, entity.total[otherChartName], 
                    entity.type, entity.name, dia.isDisplayCentreText(otherChart));
            });
        }
        return this;
    },
    
    selectSecondSector: function(node){
        var entity = jQuery(node).data("ref"),
            chart = charts.chart(entity.type),
            otherCharts,
            otherSelectedChart,
            entities = {};

        if (!chart.isSelected()){
            
            otherCharts = charts.otherCharts(entity.type);
            
            //find the other chart that is already selected
            jQuery.each(otherCharts, function(i, otherChart){
                if (otherChart.isSelected()) {
                    otherSelectedChart = otherChart;
                    return false;
                }
            });
           
            if (otherSelectedChart) {
                chart.selectSector(node);
            }
        }
        return this;
    },
    
    unselectSector: function(node){
        var entity = jQuery(node).data("ref"),
            chart = charts.chart(entity.type),
            otherCharts;
        
        if (chart.isSelected()){

            chart.unselectSector(this.isDisplayCentreText(chart));
            otherCharts = charts.otherCharts(entity.type);

            jQuery.each(otherCharts, function(i, otherChart){
                otherChart.filter();
            });
        }
        return this;
    },

    setFlows: function(highlightedNode) {
        var activeChart;
        var entity;
        var selectedChart = this.getSelectedChart(),
            others = null,
            selectedEl = null;        
        
        //if there is a selected chart then the flows shown are the ones 
        //linked to the selected chart.
        if(selectedChart) {
            var selectedNode = selectedChart.getSelectedSector();
            selectedEl = jQuery(selectedNode).data("sectorEl"),
            activeChart = selectedChart;
        } 
        //if there is only a highlighted chart then the flows are the ones
        //linked to the highlighted chart.
        else if (highlightedNode) {
            entity = jQuery(highlightedNode).data("ref"),
            selectedEl = jQuery(highlightedNode).data("sectorEl"),
            activeChart = charts.chart(entity.type)
        }
        //if no charts are highlighted or selected then all flows are shown. 
        else {
            activeChart = null;
        }
        
        if (selectedEl && selectedEl.value.others) {
            others = selectedEl.value.othersRefs;
        }            
        
        flows.hide();

        // set the appropriate flow arrows and labels
        var diagram = this;
        if (activeChart) {
            jQuery.each(charts.otherCharts(activeChart.type), 
                function(i, otherChart){
                    var flow = flows.flow(activeChart, otherChart);
                    diagram.updateFlow(flow, others);
            });
        }
        else {
            jQuery.each(flows.collection, 
                function(i, flow){
                    diagram.updateFlow(flow);
            });
        }
        
        return this;
    },

    updateFlow: function(flow, others) {
        var sourceEntity = flow.source.getSelectedEntity() || 
                           flow.source.getHighlightedEntity();
                       
        var destEntity = flow.dest.getSelectedEntity() || 
                         flow.dest.getHighlightedEntity();

        var amount = 0;

        //hide flows for any transaction types that aren't in the data.
        if (flow.type == "donor-recipient" && ! data.typesPresent[1]) { return }
        if (flow.type == "donor-multilateral" && ! data.typesPresent[2]) { return }
        if (flow.type == "multilateral-recipient" && ! data.typesPresent[3]) { return }        

        
        //if something is selected or highlighted.
        if (sourceEntity){
            if (destEntity) {
               
               flow.show();
               return;
               
                sourceNode = flow.source.getSelectedSector() || 
                    flow.source.getHighlightedSector();
                    
                destNode = flow.dest.getSelectedSector() || 
                  flow.dest.getHighlightedSector();

                sourceValue = jQuery(sourceNode).data("sectorEl").value;
                destValue = jQuery(destNode).data("sectorEl").value;

                if (flow.source.getHighlightedSector()) {
                    amount = sourceValue.value;
                } else {
                    amount = destValue.value;
                }
                
            } else {
                // from selected source(s) to everyone
                
                var sourceEntities = others || [sourceEntity];
                
                for (var i in sourceEntities) {
                    sourceEntity = sourceEntities[i]; 
                    amount += sourceEntity.total[flow.dest.type];
                }                         
                
            }
                
        }
        else {
            if (destEntity) {
                var destEntities = others || [destEntity];

                // amount to selected dest entity(s) from everyone
                for (var i in destEntities) {
                    destEntity = destEntities[i]; 
                    amount += destEntity.total[flow.source.type];
                }                         
            } else {
                // from everyone to everyone
                amount = data.total[flow.type];
            }
        }
        
        flow.text(formatNumber(amount));
        flow.show();

    },

    
    //this only works for equalateral triangles
    getCentre: function() {
        var donor = charts.chart("donor"),
            recipient = charts.chart("recipient"),
            x = (donor.x + recipient.x) / 2,
            y = ((recipient.x - donor.x) / 2) * Math.tan(Raphael.rad(30));
        
        return [x, y];
    },
    
    reset: function() {
        jQuery.each(charts.collection, function(i, chart) {chart.filter();} ); 
        charts.reset();
        this.setFlows();
//        flows.show();
    }
};


/////



// CONVERT FEED OF TRANSACTIONS INTO LOOKUP OBJECTS
function convertTransactions(transactions){
    var data = {
        donor: {},
        recipient: {},
        multilateral: {},
        typesPresent: {},
        total: {
            donor: 0,
            recipient: 0,
            multilateral: 0,
            "donor-recipient": 0,
            "donor-multilateral": 0,
            "multilateral-recipient": 0
        }
    };

    jQuery.each(transactions, function(i, transaction){
        var from = transaction.from,
            to = transaction.to,
            amount = transaction.amount,
            total = data.total,
            donor, recipient, multilateral;

        data.typesPresent[transaction.type] = true;
        switch (transaction.type){
            // Donor -> Recipient
            case 1:
                donor = data.donor[from];
                recipient = data.recipient[to];
                
                // Create objects if they don't exist
                if (!donor){
                    donor = data.donor[from] = new Donor(from);
                }
                if (!recipient){
                    recipient = data.recipient[to] = new Recipient(to);
                }
                
                donor.add(recipient, amount);
                recipient.add(donor, amount);
                
                // Add to total
                total.donor += amount;
                total.recipient += amount;
                total["donor-recipient"] += amount;
            break;
            
            
            // Donor -> Multilateral
            case 2:
                donor = data.donor[from];
                multilateral = data.multilateral[to];
                
                // Create objects if they don't exist
                if (!donor){
                    donor = data.donor[from] = new Donor(from);
                }        
                if (!multilateral){
                    multilateral = data.multilateral[to] = new Multilateral(to);
                }
                
                donor.add(multilateral, amount);
                multilateral.add(donor, amount);
                                
                // Add to total
                total.donor += amount;
                total.multilateral += amount;
                total["donor-multilateral"] += amount;
            break;
            
            
            // Multilateral -> Recipient
            case 3:
                multilateral = data.multilateral[from];
                recipient = data.recipient[to];
                
                // Create objects if they don't exist
                if (!multilateral){
                    multilateral = data.multilateral[from] = new Multilateral(from);
                }
                if (!recipient){
                    recipient = data.recipient[to] = new Recipient(to);
                }
                
                multilateral.add(recipient, amount);
                recipient.add(multilateral, amount);

                // Add to total           
                // note that the total.multilateral is not incremented in this case as it's already done in case 2.
                // likewise the total.total is not incremented as the money is already accounted for in cases 1 and 2.                     
                total.recipient += amount;
                total["multilateral-recipient"] += amount;
            break;
                    
        }
    });
    
    return data;
}

function showFeed(feed)
{
	// Set a bunch of global variables (yuck)
	// WARNING: calling this again may leave dead SVG and other crud
	// in the page!
	vizElem.empty();
	viz = Raphael("viz");
	viz.setSize(visualisationWidth, mY + outerRadius);

	// Convert data feed into structured data
	data = convertTransactions(feed.transactions);

	entityColours = generateColoursByReverseName(
	    objectKeys(data.donor).concat(objectKeys(data.recipient), 
	    objectKeys(data.multilateral)));

	// Create diagram
	diagram = new Diagram();

	// Create charts
	charts = new Charts()
	    .chart(new Chart("Donor\nCountries", "donor", data.donor, dX, dY, outerRadius, -chartCalloutOffset))
	    .chart(new Chart("Recipient\nCountries", "recipient", data.recipient, rX, rY, outerRadius, chartCalloutOffset))
	    .chart(new Chart("Multilateral\nAgencies", "multilateral", data.multilateral, mX, mY, outerRadius, chartCalloutOffset));
	
	// Create flows
	flows = new Flows()
	    .flow(new Flow(charts.chart("donor"), charts.chart("recipient")))
	    .flow(new Flow(charts.chart("donor"), charts.chart("multilateral")))
	    .flow(new Flow(charts.chart("multilateral"), charts.chart("recipient")));

  // create the reset button

  resetButton = viz.circle(resetX, resetY, resetR)
    .attr({fill: resetButtonColour, stroke:"none"});
  resetButtonText = viz.text(resetX, resetY, "reset")
    .attr({"font-size": resetTextSize + "px", fill: resetTextColour});
        
  jQuery(resetButton.node)[0].setAttribute("id", "reset");
  jQuery(resetButtonText.node)[0].setAttribute("id", "resetText");
  jQuery(resetButtonText.node)[0].setAttribute("style", "cursor: default;");
	
	reset();
	
	$('#loading').hide();
}

// Handle state changing UI events

function handleEvent(uiEvent, node){
    var entity = jQuery(node).data("ref"),
        eventName = "",
        event = 0,
        state = null,
        previousState = null;
       

    eventName = uiEvent.toUpperCase() + "_" + entity.type.toUpperCase();
    event = eventsByName[eventName];
    
    //don't allow clicking on an "others" sector.    
    if (uiEvent == "click" && jQuery(node).data("sectorEl").value.others) {
        return;
    }
    
    //advance the state machine
    state = stateMachine.state(event);
    previousState = stateMachine.previousState();
    
    //repaint the diagram based on the current state
    if (stateMachine.state() != stateMachine.previousState()) {
        repaint(state, previousState, node);
    }
}


//The main repaint function (TODO refactor this onto the Diagram class

function repaint(state, previousState, node) {
    switch (state) {
        case START:
            diagram.reset();
        break;

        case HOVER_DONOR: case HOVER_RECIPIENT: case HOVER_MULTILATERAL:
            diagram.unselectSector(node);
            diagram.highlightSector(node);
        break;
 
        case SELECT_DONOR: case SELECT_RECIPIENT: case SELECT_MULTILATERAL:
            if (previousState == HOVER_DONOR || 
                previousState == HOVER_MULTILATERAL || 
                previousState == HOVER_RECIPIENT) {
                diagram.selectSector(node);
            } else {
                diagram.unhighlightSector(node);
            }
                
        break;
        
        case HOVER_RECIPIENT_SELECT_DONOR:
            charts.chart("recipient").unhighlightSector();
            diagram.highlightSector(node);
        break;
        case HOVER_MULTILATERAL_SELECT_DONOR:
            charts.chart("multilateral").unhighlightSector();
            diagram.highlightSector(node);
        break;
        case HOVER_DONOR_SELECT_RECIPIENT:
            charts.chart("donor").unhighlightSector();
            diagram.highlightSector(node);
        break;
        case HOVER_MULTILATERAL_SELECT_RECIPIENT:
            charts.chart("multilateral").unhighlightSector();
            diagram.highlightSector(node);
        break;
        case HOVER_RECIPIENT_SELECT_MULTILATERAL:
            charts.chart("recipient").unhighlightSector();
            diagram.highlightSector(node);
        break;
        case HOVER_DONOR_SELECT_MULTILATERAL:
            charts.chart("donor").unhighlightSector();
            diagram.highlightSector(node);
        break;

        case SELECT_DONOR_SELECT_RECIPIENT:
        break;
        case SELECT_DONOR_SELECT_MULTILATERAL:
        break;
        case SELECT_MULTILATERAL_SELECT_RECIPIENT:
        break;    
    }

}

// reset the display

function reset() {
    stateMachine.reset();
    repaint(START, null, null);
}

// set up the UI event handlers

vizElem
    .delegate(".cover", "mouseenter", function(){
        handleEvent("enter", this);
    })
    
    .delegate(".cover", "mouseleave", function(){
        handleEvent("leave", this);
    })
    
    .delegate(".cover", "click", function(){
        handleEvent("click", this);
    })

    .delegate("#reset, #resetText", "mousedown", function(){
        resetButton.attr({fill: "#f00"});
        reset();
    })

    .delegate("#reset, #resetText", "mouseup", function(){
        resetButton.attr({fill: "#a00"});
    })
        
    .delegate("#reset, #resetText", "mouseenter", function(){
            resetButton.attr({fill: "#a00"});
     })
     
    .delegate("#reset, #resetText", "mouseleave", function(){
            resetButton.attr({fill: "#000"});
     });


// Set dimensions of drawing area
var visualisationWidth = rX + outerRadius + rightMargin;
viz.setSize(visualisationWidth, mY + outerRadius);

/*jslint onevar: true, undef: true, eqeqeq: true, bitwise: true, regexp: true, newcap: true, immed: true, strict: true */
