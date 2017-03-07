// AutoComplete input widget
// Attaches to an <input> 
// Options:

// author : michael chamoures
// date : 3/6/2017




/// model for widget
const AutoCompleteModel = class {
  
  // constructor
  constructor(options) {
    _.bindAll(this, 'updateResults');
    
    // attributes
    this.attributes = _.extend({}, this.getDefaults(), options);

    // events
    this.events = {};
    this.on('change:searchText', this.updateResults);
  }
  
  get(key) {
    return this.attributes[key];
  }
  
  set(key, value) {
    
    // set that key to the new value
    this.attributes[key] = value;
    
    // fire two events, basic change and specific change of this key
    this.eventHandler(['change', 'change:'+key]);
    
    return this;
  }
  
  on(event, callback) {
    
    if(_.isFunction(callback)) {
      if(this.events[event] !== undefined) {
        this.events[event].push(callback);
      } else {
        this.events[event] = [callback];
      }
    }
    
    return this;
  }
  
  eventHandler(events) {
    
    // got a list of event names..get callbacks for those and execute
    let callbacks = _.map(events, event => this.events[event]);

    _.each(_.flatten(callbacks), (callback) => {
      
      if(_.isFunction(callback)) {
        
        callback(true);
      }
      
    });
    
    
  }
  
  // triggered when searchText attrib changes...searches URL for new result set
  updateResults() {
    // scope and stuff
    let _this = this;
    console.log("hey");
    // reset the currentIndex so focus is back in input
    this.set('currentIndex', -1);
    
    // replaces spaces with encoded since it's GET request
    let encodedSearchText = this.get('searchText').replace(' ', '%20');
    
    $.ajax({
      method : 'GET',
      url : _this.get('searchUrl') + '?city_like=' + encodedSearchText
    })
    .done(data => _this.set('results', _.map(data, result => result.city)))
    .fail(err => console.log('Search failed'));
    
  }
  
  getDefaults() {
    
    return {
      hintLimit : 5,
      searchUrl : "",
      searchText : "",
      results : [],
      currentIndex : -1, 
    }
    
  }
  
  
};


// prototype constructor
const AutoComplete = function AutoComplete(target, options) {
  
  // declare target el
  this.$target = $(target);
  
  // total element
  this.$el = null;
  
  if(this.$target.is('input')) {
    this.init(options);
  } else {
    console.log("Must be declared on input el");
  }
  
  
}


AutoComplete.prototype = {
  
  constructor : AutoComplete,
  
  init(options) {
    
    _.bindAll(this, "drawSuggestionsListEl", "keyupEventHandler", "createEl", "createSuggestionsEl");
    
    // new model
    this.model = new AutoCompleteModel(options);
    
     //model events
    this.model.on('change:results', this.drawSuggestionsListEl);  
    
    // dom events
    this.events = {};
    this.$target.on('keyup', this.keyupEventHandler);
    
    //create component el
    this.createEl();
    this.createSuggestionsEl();
    
    
  },
  
  createEl() {
    // wrap the input
    this.$el = this.$target.wrap($('<div>').addClass('form-group row col-sm-4')).parent();
    
  },
  
  createSuggestionsEl : function() {
    
    this.$suggestionsEl = $('<ul>').addClass('list-group').appendTo(this.$el);
    
  },
  
  keyupEventHandler : function(event) {
    
    let eventKey = event.key;
    let currentIndex = this.model.get('currentIndex');
  
    switch(eventKey) {
        
      case 'ArrowUp' :
        // check which suggestion to highlight by checking currentIndex
        if(currentIndex >= 0) {
          this.model.set('currentIndex', currentIndex-1);
        } else {
          this.model.set('currentIndex', this.$suggestionsEl.children().length-1);
        }
        this.drawSuggestionsListEl(false);
        break;
      case 'ArrowDown' :
        if(currentIndex < this.$suggestionsEl.children().length - 1) {
          this.model.set('currentIndex', currentIndex+1);
        } else {
          this.model.set('currentIndex', -1);
        }
        this.drawSuggestionsListEl(false);
        break;
      default : 
        
        // check if search text has changed
        if(this.model.get('searchText') !== this.$target.val()) {
          // update the model's search text, which will trigger event to search data
          this.model.set('searchText', this.$target.val());
        }
        
        break;
       
        
    }
  },
  
  drawSuggestionsListEl : function(isResultsRefreshed) {
    
    if(isResultsRefreshed) {
      // results have changes so need to redraw the list items
      // reset suggestions el
      this.$suggestionsEl.html("");
      
      // check the length of the search text 
      if(this.model.get('searchText').length > 0) {
        
        let results = this.model.get('results');
        let hintLimit = this.model.get('hintLimit');
        let newHtml = "";
        _.each(results, (result, index) => {
          
          if(index < hintLimit) {
            newHtml = newHtml +  '<li class="list-group-item" id="hint-' + index + '">' + result + '</li>';
          }
        });
        
        this.$suggestionsEl.html(newHtml);
        
      }   
    } else {
      // same results..arrow key change so change which suggesiton is highlighted
      let currentIndex = this.model.get('currentIndex');
      
      //remove all active highlighted existing hint list
      this.$suggestionsEl.children().removeClass('active');
      
      if(currentIndex !== -1) {
        
        let $newActiveEl = $(this.$suggestionsEl.children()[currentIndex]);
        $newActiveEl.addClass('active');
        this.$target.val($newActiveEl.text());
        
        
      } else {
        
        //update target with new search text
        this.$target.val(this.model.get('searchText'));
      }
      
      
    }
    
  }
  
  
  
}

$.fn.autocomplete = function(options) {
  
  return this.each(function() {
    //hold ref to this
    let $this = $(this);
    // check if widget is already instantiated
    let data = $this.data('autocomplete');
    if(!data) {
      
      $this.data('autocomplete', new AutoComplete($this, options))
      
    } else {
      console.log("autoComplete already instantiated");
    }
  });
  
};


// Example:

// let options = {
  
//   hintLimit : 10,
//   searchUrl :  'http://localhost:3000/listings',
  
// };

// $('#autocomplete-test-input').autocomplete(options);




