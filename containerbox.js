Module.define(function() {
    "use strict";
    
    var defaultOptions;
    var ContainerBox;
    var ContainerIsFullException;
    var ContainerIdConflictException;
    var ConstraintViolationException;
    
    var template = Module.importTemplate("container-box-template");

    defaultOptions = {
        remover : true,
        selector : false,
        maxContentSize : 0,
        idProp : "id",
        width : 190,
        height : 50
    };
    
    ContainerBox = function(element, options, itemTemplate) {
        if (element instanceof (typeof HTMLElement !== "undefined" ? HTMLElement : Element)) {
            //it is a plain HTML element
            this.element = element;
            this.$element = $(element);
        } else {
            //it is a jQuery object
            this.element = element[0];
            this.$element = element;
        }
        
        this.options = $.extend(defaultOptions, options);
        
        this.itemTemplate = itemTemplate || template;
        
        this.items = [];
        
        this.constraints = [];
    };
    
    ContainerIsFullException = {
        toString : function() {
            return "ContainerIsFullException: Container is full";
        }
    };
    
    ContainerIdConflictException = {
        toString : function() {
            return "ContainerIdConflictException: This container already contains an item with this id";
        }
    };
    
    ConstraintViolationException = {
        getWithName : function(name) {
            this.toString = function() {
                return "ConstraintViolationException: " + name;
            };
            return this; 
        }
    };

    ContainerBox.prototype = {
        render : function() {
            var thisBox = this;
            this.$element
                .empty()
                .html(_.template(template, $.extend(this)))
                .find(".remover").click(function() {
                    thisBox.removeItem($(this).attr('data-id'));
                });
        },
        
        addConstraint : function(constraintFn, name) {
            this.constraints.push({
                fn : function(item) {
                    if (constraintFn(item)) {
                        return {
                            valid : true
                        };
                    } else {
                        return {
                            valid : false,
                            name : name
                        };
                    }
                }.bind(this),
                name : name
            });
        },
        
        addItem : function(itemToAdd) {
            var options = this.options;
            if (this.items.some(function(item) {
                    return item[options.idProp] == itemToAdd[options.idProp]; 
                })) {
                throw ContainerIdConflictException;
            } 
            
            var canAddItem = this.canAddItem(itemToAdd); 
            if (!canAddItem.valid) {
                throw ConstraintViolationException.getWithName(canAddItem.name);
            }
            
            if (this.options.maxContentSize > 0 && (this.items.length >= this.options.maxContentSize)) {
                throw ContainerIsFullException;
            }
            
            this.items.push(itemToAdd);
            this.render();
        },
        
        removeItem : function(id) {
            var options = this.options;
            this.items = _(this.items).reject(function(item) { return item[options.idProp] == id; });
            this.render();
        },
        
        containsItem : function(filter) {
            return _.where(this.items, filter).length > 0;
        },
        
        containsItemWithId : function(id) {
            var options = this.options;
            return this.items.some(function(item) {
                return item[options.idProp] == id;
            });
        },

        canAddItem : function(itemToAdd) {
            if (this.containsItemWithId(itemToAdd[this.options.idProp])) {
                return {
                    valid : false,
                    name : "ConflictException"
                };
            }
            return ( 
                this.constraints
                    .map(function(constraint) {
                        return constraint.fn(itemToAdd);
                    })
                    .reduce(function(a, b) {
                        return $.extend(a, b);
                    })
            );
        },
        
        getItems : function() {
            return this.items;
        },
        
        clear : function() {
            this.items.length = 0;
            this.render();
        }
        
    };
    
    return {
        ContainerBox : ContainerBox,
        ContainerIsFullException : ContainerIsFullException,
        ContainerIdConflictException : ContainerIdConflictException,
        ConstraintViolationException : ConstraintViolationException
    };
});
