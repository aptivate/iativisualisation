var viz = Raphael("viz"),
    vizElem = jQuery("#viz"),
    button1, button2, button3,
    stateMachine, stateLabel;
    
//  REPAINT  / HANDLERS

function repaint(){
    stateLabel.attr("text", stateMachine.state());
}

function handleEvent(node, donorEvent, recipientEvent, multilateralEvent){
    var type = jQuery(node).attr("id"),
        event = ({
            donor:        donorEvent,
            recipient:    recipientEvent,
            multilateral: multilateralEvent
        })[type];
        
    stateMachine.state(event);
    repaint();
}

// create state machine
stateMachine = new StateMachine(states, START);



// Create buttons
button1 = viz.circle(250, 100, 50)
    .attr({fill: "#f22", stroke:"none"});
viz.text(250, 100, "donor");

button2 = viz.circle(400, 100, 50)
    .attr({fill: "#2f2", stroke:"none"});
viz.text(400, 100, "recipient");

button3 = viz.circle(325, 225, 50)
    .attr({fill: "#22f", stroke:"none"});
viz.text(325, 225, "multilateral");

// NOTE jQuery.addClass() and .attr("class") doesn't actually set className
jQuery(button1.node)[0].setAttribute("class", "button");
jQuery(button1.node)[0].setAttribute("id", "donor");
jQuery(button2.node)[0].setAttribute("class", "button");
jQuery(button2.node)[0].setAttribute("id", "recipient"); 
jQuery(button3.node)[0].setAttribute("class", "button");
jQuery(button3.node)[0].setAttribute("id", "multilateral");  

// create state display
stateLabel = viz.text(600, 100, "");



// Event handlers

vizElem
    .delegate("circle.button", "mouseenter", function(){
        handleEvent(this, ENTER_DONOR, ENTER_RECIPIENT, ENTER_MULTILATERAL);
    })
    
    .delegate("circle.button", "mouseleave", function(){
        handleEvent(this, LEAVE_DONOR, LEAVE_RECIPIENT, LEAVE_MULTILATERAL);
    })
    
    .delegate("circle.button", "click", function(){
        handleEvent(this, CLICK_DONOR, CLICK_RECIPIENT, CLICK_MULTILATERAL);
    });



// Set dimensions of drawing area
viz.setSize(800, 600);
