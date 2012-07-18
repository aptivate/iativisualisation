var viz = Raphael("viz"),
    vizElem = jQuery("#viz");

// Create buttons
viz.rect(0, 0, 200, 500, 10).attr("fill", "#559");
viz.circle(200, 200, 100).attr({fill: "#f22", stroke:"none"});
viz.circle(400, 200, 100).attr({fill: "#2f2", stroke:"none"});
viz.circle(300, 400, 100).attr({fill: "#22f", stroke:"none"});


// Set dimensions of drawing area
viz.setSize(600, 600);

