/*global _, window, jQuery, Raphael, feed, states, START */

var undef;


// STATEMACHINE CLASS

function StateMachine(states, startState) {
    if (!states || startState === undef || !states[startState]){
        throw "Could not start state machine";
    }
    this.states = states;
    this._state = this._startState = startState;
}

StateMachine.prototype = {
    _state: null,
    _prevState: null,
    states: null,
    state: function(event) {
        if (event){
            var stateMachine = this,
                transitions = stateMachine.states[this.state()];
            
            stateMachine._prevState = stateMachine._state;
            
            jQuery.each(transitions, function(i, transition){
                // transition = [condition, nextState];
                if (event === transition[0]) {
                    stateMachine._state = transition[1];
                    return false;
                }
            });
        }
        return this._state;
    },
    
    previousState: function(){
        return this._prevState;
    },

    reset: function() {
        this._prevState = null;
        this._state = this._startState;
        return this;
    }
};





