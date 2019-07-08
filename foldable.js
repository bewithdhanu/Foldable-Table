"use strict";
$.fn.foldableTable = function (t) {
    var table = this;
    var expanded=[];
    var params = $.extend({
        fieldName : null,
        filter: false,
        filter_row:1,
        rowIndex:false,
        multiPaste:false,
        pasteInCollapse:true,
        collapsableHead:false,
        defaultCollapse:false,
        filter_except:[],
        methodName: function () {}
    }, t); 
    
    if(params.filter){
        var hrows = table.find("thead tr").length;
        if(params.filter_row>0 && hrows>=params.filter_row){
            table.find("thead tr:eq("+(params.filter_row-1)+") th").each(function(index){
                if($.inArray(index, params.filter_except)){
                    $(this).append("<select class='selectpicker'></select>")
                }
            });
        }else{
            console.error("filter_row:"+params.filter_row+" is not available")
        }
    }
    if(params.rowIndex){
        var hrows = table.find("thead tr th").length;
        table.find("thead tr").each(function(index){
            if(hrows-1==index){
                $(this).prepend("<th></th>");
            }else{
                $(this).prepend("<th>#</th>");
            }
        });
        table.find("tbody tr").each(function(index){
            $(this).prepend("<td>"+(index+1)+"</td>");
        });
    }
    if(params.multiPaste){
        enableMultiPaste(table); 
    }
    if(params.collapsableHead){
        var ocols=0;
        table.find("thead tr td,thead tr th").each(function(index){
            if($(this).hasAttr("colspan")){
                $(this).prepend("<span style='border: 1px solid #636363;background: #797979;color: #fff;border-radius: 3px;padding: 0px 4px;cursor: pointer;margin-right: 5px;font-weight: bold;' data-index='"+index+"' class='collapsableHead' id='collapsableHead"+index+"' data-collapse='on' data-ocols='"+ocols+"' data-colspan='"+$(this).attr("colspan")+"'>-</span>");
                enableCollapsableHead(table.find("#collapsableHead"+index),table);
                ocols += parseInt($(this).attr("colspan"));
            }else{
                ocols += 1;
            }
        });
    }
    if(params.defaultCollapse){
        table.find(".collapsableHead").each(function(){
            if($(this).data("collapse")=="on"){ 
                $(this).click();
            }
        });
    }
    this.addRow = function(cols,callback) {
        var content = "<tr>";
        if(params.rowIndex){
            var rows = table.find("tbody tr").length;
            content += "<td>"+(rows+1)+"</td>";
        }
        $(cols).each(function(index,value){
            content += "<td>"+value+"</td>";
        });
        content += "</tr>";
        if(params.collapsableHead){
            this.expandAllColumns();
        }
        var tbody = table.find("tbody").append(content);
        if(typeof callback !== 'undefined'){
            callback.complete(tbody.find("tr:last"));
        }
        if(params.multiPaste){
            enableMultiPaste(table);
        }
        if(params.collapsableHead){
            this.revertAllColumns();
        }
    };
    this.copyRow = function(callback) {
        var cols = [];
        table.find("tbody tr:eq(0) td").each(function(index){
            if((params.rowIndex && index>0) || !params.rowIndex){
                cols.push($(this).html());
            }
        });
        this.addRow(cols,callback);
    };
    this.deleteRow = function(index){
        table.find("tbody tr").each(function(i){
            if(i==index){
                $(this).remove();
            }
        });
        if(params.rowIndex){
            table.find("tbody tr").each(function(index){
                $(this).find("td:eq(0)").html(index+1)
            });
        }
    };
    this.revertAllColumns = function(){
        $.each(expanded,function(ind,ele){
            table.find("#"+ele).click();
        });
        expanded = [];
    };
    this.expandAllColumns = function(){
        table.find(".collapsableHead").each(function(){
            if($(this).data("collapse")=="off"){ 
                $(this).click();
                expanded.push($(this).attr("id"));
            }
        });
    };
    function enableMultiPaste(table){
        table.find('input').unbind('paste');
        table.find('input').bind('paste', null, function (e) {
            var ele = $(this);
            setTimeout(function(){
                var currentColIndex = ele.closest("td").index() - 1;
                var currentRowIndex = ele.closest("tr").index();
                var tbody = ele.closest("tbody");
                var row = clipboardData.split("\n");
                var parts = clipboardData.split(/\s+/);
                if(parts.length>0){
                    tbody.find("tr").each(function(i){
                        if(i>=currentRowIndex){
                            if(typeof row[i-currentRowIndex]  !== 'undefined' && !row[i-currentRowIndex].isEmpty()){
                                var columns = row[i-currentRowIndex].split(/\s+/);
                                if(!params.pasteInCollapse){
                                    $(this).find("td:not(.disable) input").each(function(j){
                                        if(j>=currentColIndex && j<currentColIndex+columns.length){
                                            $(this).val(columns[j-currentColIndex]);
                                            $(this).trigger("change");
                                        }
                                    });
                                }else{
                                    $(this).find("td input").each(function(j){
                                        if(j>=currentColIndex && j<currentColIndex+columns.length){
                                            $(this).val(columns[j-currentColIndex]);
                                            $(this).trigger("change");
                                        }
                                    });
                                }
                            }
                        }
                    });
                }   
            }, 10);
        });
    }
    function enableCollapsableHead(ele,table){
        ele.off('clock');
        ele.on('click',function(){
            var cele = $(this);
            var index = cele.data("index");
            var ocols = cele.data("ocols");
            var curSpan = cele.data("colspan");
            if(cele.data("collapse")=="on"){
                cele.data("collapse","off");
                cele.html("+");
                cele.closest("td,th").attr("colspan","1");
            }else{
                cele.data("collapse","on");
                cele.html("-");
                cele.closest("td,th").attr("colspan",curSpan);
            }
            if(table.find("thead tr,tbody tr").length>1){
                table.find("thead tr,tbody tr").each(function(i){
                    if(i>0){
                        var ccols =0;
                        var cindex = 0;
                        $(this).find("th,td").each(function(){
                            if(ccols<ocols){
                                if($(this).hasAttr("colspan")){
                                    ccols += parseInt($(this).attr("colspan"));
                                }else{
                                    ccols += 1; 
                                }
                            }else{
                                return false;
                            }
                            cindex += 1;
                        });
                        var mspan=0;
                        while(mspan<curSpan-1){
                            var mele = $(this).find("td:eq("+(cindex+mspan+1)+"),th:eq("+(cindex+mspan+1)+")");
                            if(mele.hasAttr("colspan")){
                                mspan += parseInt(mele.attr("colspan"));
                            }else{
                                mspan +=1;
                            }
                            if(cele.data("collapse")=="off"){
                                mele.css("display","none");
                                mele.addClass("disable");
                            }else{
                                mele.css("display","table-cell");
                                mele.removeClass("enable");
                            }
                        }
                    }
                });
            }
        });
    }
    return this;
};
$.fn.hasAttr = function(attr) {
    var at = $(this).attr(attr);
    return (typeof at  !== 'undefined');
}; 
String.prototype.isEmpty = function(text) {
    return (typeof text  !== 'undefined' && text.trim().length>0);
};
