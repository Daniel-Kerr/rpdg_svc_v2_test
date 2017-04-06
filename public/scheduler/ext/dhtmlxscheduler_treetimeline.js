/*
@license
dhtmlxScheduler v.4.4.0 Professional Evaluation

This software is covered by DHTMLX Evaluation License. Contact sales@dhtmlx.com to get Commercial or Enterprise license. Usage without proper license is prohibited.

(c) Dinamenta, UAB.
*/
Scheduler.plugin(function(e){e.attachEvent("onTimelineCreated",function(t){"tree"==t.render&&(t.y_unit_original=t.y_unit,t.y_unit=e._getArrayToDisplay(t.y_unit_original),e.attachEvent("onOptionsLoadStart",function(){t.y_unit=e._getArrayToDisplay(t.y_unit_original)}),e.form_blocks[t.name]={render:function(e){var t="<div class='dhx_section_timeline' style='overflow: hidden; height: "+e.height+"px'></div>";return t},set_value:function(t,a,i,n){var r=e._getArrayForSelect(e.matrix[n.type].y_unit_original,n.type);
t.innerHTML="";var s=document.createElement("select");t.appendChild(s);var o=t.getElementsByTagName("select")[0];!o._dhx_onchange&&n.onchange&&(o.onchange=n.onchange,o._dhx_onchange=!0);for(var d=0;d<r.length;d++){var _=document.createElement("option");_.value=r[d].key,_.value==i[e.matrix[n.type].y_property]&&(_.selected=!0),_.innerHTML=r[d].label,o.appendChild(_)}},get_value:function(e,t,a){return e.firstChild.value},focus:function(e){}})}),e.attachEvent("onBeforeSectionRender",function(t,a,i){var n={};
if("tree"==t){var r,s,o,d,_,l;d="dhx_matrix_scell",a.children?(r=i.folder_dy||i.dy,i.folder_dy&&!i.section_autoheight&&(o="height:"+i.folder_dy+"px;"),s="dhx_row_folder",d+=" folder",_="<div class='dhx_scell_expand'>"+(a.open?"-":"+")+"</div>",l=i.folder_events_available?"dhx_data_table folder_events":"dhx_data_table folder"):(r=i.dy,s="dhx_row_item",d+=" item",_="",l="dhx_data_table"),d+=e.templates[i.name+"_scaley_class"](a.key,a.label,a)?" "+e.templates[i.name+"_scaley_class"](a.key,a.label,a):"";
var c="<div class='dhx_scell_level"+a.level+"'>"+_+"<div class='dhx_scell_name'>"+(e.templates[i.name+"_scale_label"](a.key,a.label,a)||a.label)+"</div></div>";n={height:r,style_height:o,tr_className:s,td_className:d,td_content:c,table_className:l}}return n});var t;e.attachEvent("onBeforeEventChanged",function(a,i,n){if(e._isRender("tree"))for(var r=e._get_event_sections?e._get_event_sections(a):[a[e.matrix[e._mode].y_property]],s=0;s<r.length;s++){var o=e.getSection(r[s]);if(o&&o.children&&!e.matrix[e._mode].folder_events_available)return n||(a[e.matrix[e._mode].y_property]=t),
!1}return!0}),e.attachEvent("onBeforeDrag",function(a,i,n){if(e._isRender("tree")){var r,s=e._locate_cell_timeline(n);if(s&&(r=e.matrix[e._mode].y_unit[s.y].key,e.matrix[e._mode].y_unit[s.y].children&&!e.matrix[e._mode].folder_events_available))return!1;var o=e.getEvent(a),d=e.matrix[e._mode].y_property;t=o&&o[d]?o[d]:r}return!0}),e._getArrayToDisplay=function(t){var a=[],i=function(t,n){for(var r=n||0,s=0;s<t.length;s++)t[s].level=r,t[s].children&&"undefined"==typeof t[s].key&&(t[s].key=e.uid()),
a.push(t[s]),t[s].open&&t[s].children&&i(t[s].children,r+1)};return i(t),a},e._getArrayForSelect=function(t,a){var i=[],n=function(t){for(var r=0;r<t.length;r++)e.matrix[a].folder_events_available?i.push(t[r]):t[r].children||i.push(t[r]),t[r].children&&n(t[r].children,a)};return n(t),i},e._toggleFolderDisplay=function(t,a,i){var n,r=function(e,t,a,i){for(var s=0;s<t.length&&(t[s].key!=e&&!i||!t[s].children||(t[s].open="undefined"!=typeof a?a:!t[s].open,n=!0,i||!n));s++)t[s].children&&r(e,t[s].children,a,i);
},s=e.getSection(t);"undefined"!=typeof a||i||(a=!s.open),e.callEvent("onBeforeFolderToggle",[s,a,i])&&(r(t,e.matrix[e._mode].y_unit_original,a,i),e.matrix[e._mode].y_unit=e._getArrayToDisplay(e.matrix[e._mode].y_unit_original),e.callEvent("onOptionsLoad",[]),e.callEvent("onAfterFolderToggle",[s,a,i]))},e.attachEvent("onCellClick",function(t,a,i,n,r){e._isRender("tree")&&(e.matrix[e._mode].folder_events_available||"undefined"!=typeof e.matrix[e._mode].y_unit[a]&&e.matrix[e._mode].y_unit[a].children&&e._toggleFolderDisplay(e.matrix[e._mode].y_unit[a].key));
}),e.attachEvent("onYScaleClick",function(t,a,i){e._isRender("tree")&&a.children&&e._toggleFolderDisplay(a.key)}),e.getSection=function(t){if(e._isRender("tree")){var a,i=function(e,t){for(var n=0;n<t.length;n++)t[n].key==e&&(a=t[n]),t[n].children&&i(e,t[n].children)};return i(t,e.matrix[e._mode].y_unit_original),a||null}},e.deleteSection=function(t){if(e._isRender("tree")){var a=!1,i=function(e,t){for(var n=0;n<t.length&&(t[n].key==e&&(t.splice(n,1),a=!0),!a);n++)t[n].children&&i(e,t[n].children);
};return i(t,e.matrix[e._mode].y_unit_original),e.matrix[e._mode].y_unit=e._getArrayToDisplay(e.matrix[e._mode].y_unit_original),e.callEvent("onOptionsLoad",[]),a}},e.deleteAllSections=function(){e._isRender("tree")&&(e.matrix[e._mode].y_unit_original=[],e.matrix[e._mode].y_unit=e._getArrayToDisplay(e.matrix[e._mode].y_unit_original),e.callEvent("onOptionsLoad",[]))},e.addSection=function(t,a){if(e._isRender("tree")){var i=!1,n=function(e,t,r){if(a)for(var s=0;s<r.length&&(r[s].key==t&&r[s].children&&(r[s].children.push(e),
i=!0),!i);s++)r[s].children&&n(e,t,r[s].children);else r.push(e),i=!0};return n(t,a,e.matrix[e._mode].y_unit_original),e.matrix[e._mode].y_unit=e._getArrayToDisplay(e.matrix[e._mode].y_unit_original),e.callEvent("onOptionsLoad",[]),i}},e.openAllSections=function(){e._isRender("tree")&&e._toggleFolderDisplay(1,!0,!0)},e.closeAllSections=function(){e._isRender("tree")&&e._toggleFolderDisplay(1,!1,!0)},e.openSection=function(t){e._isRender("tree")&&e._toggleFolderDisplay(t,!0)},e.closeSection=function(t){
e._isRender("tree")&&e._toggleFolderDisplay(t,!1)}});