/*
@license
dhtmlxScheduler v.4.4.0 Professional Evaluation

This software is covered by DHTMLX Evaluation License. Contact sales@dhtmlx.com to get Commercial or Enterprise license. Usage without proper license is prohibited.

(c) Dinamenta, UAB.
*/
Scheduler.plugin(function(e){e.__recurring_template='<div class="dhx_form_repeat"> <form> <div class="dhx_repeat_left"> <label><input class="dhx_repeat_radio" type="radio" name="repeat" value="day" />P&auml;ivitt&auml;in</label><br /> <label><input class="dhx_repeat_radio" type="radio" name="repeat" value="week"/>Viikoittain</label><br /> <label><input class="dhx_repeat_radio" type="radio" name="repeat" value="month" checked />Kuukausittain</label><br /> <label><input class="dhx_repeat_radio" type="radio" name="repeat" value="year" />Vuosittain</label> </div> <div class="dhx_repeat_divider"></div> <div class="dhx_repeat_center"> <div style="display:none;" id="dhx_repeat_day"> <label><input class="dhx_repeat_radio" type="radio" name="day_type" value="d"/>Joka</label><input class="dhx_repeat_text" type="text" name="day_count" value="1" />p&auml;iv&auml;<br /> <label><input class="dhx_repeat_radio" type="radio" name="day_type" checked value="w"/>Joka arkip&auml;iv&auml;</label> </div> <div style="display:none;" id="dhx_repeat_week">Toista joka<input class="dhx_repeat_text" type="text" name="week_count" value="1" />viikko n&auml;in&auml; p&auml;ivin&auml;:<br /> <table class="dhx_repeat_days"> <tr> <td> <label><input class="dhx_repeat_checkbox" type="checkbox" name="week_day" value="1" />Maanantai</label><br /> <label><input class="dhx_repeat_checkbox" type="checkbox" name="week_day" value="4" />Torstai</label> </td> <td> <label><input class="dhx_repeat_checkbox" type="checkbox" name="week_day" value="2" />Tiistai</label><br /> <label><input class="dhx_repeat_checkbox" type="checkbox" name="week_day" value="5" />Perjantai</label> </td> <td> <label><input class="dhx_repeat_checkbox" type="checkbox" name="week_day" value="3" />Keskiviikko</label><br /> <label><input class="dhx_repeat_checkbox" type="checkbox" name="week_day" value="6" />Lauantai</label> </td> <td> <label><input class="dhx_repeat_checkbox" type="checkbox" name="week_day" value="0" />Sunnuntai</label><br /><br /> </td> </tr> </table> </div> <div id="dhx_repeat_month"> <label><input class="dhx_repeat_radio" type="radio" name="month_type" value="d"/>Toista</label><input class="dhx_repeat_text" type="text" name="month_day" value="1" />p&auml;iv&auml;n&auml; joka<input class="dhx_repeat_text" type="text" name="month_count" value="1" />kuukausi<br /> <label><input class="dhx_repeat_radio" type="radio" name="month_type" checked value="w"/></label><input class="dhx_repeat_text" type="text" name="month_week2" value="1" /><select name="month_day2"><option value="1" selected >Maanantai<option value="2">Tiistai<option value="3">Keskiviikko<option value="4">Torstai<option value="5">Perjantai<option value="6">Lauantai<option value="0">Sunnuntai</select>joka<input class="dhx_repeat_text" type="text" name="month_count2" value="1" />kuukausi<br /> </div> <div style="display:none;" id="dhx_repeat_year"> <label><input class="dhx_repeat_radio" type="radio" name="year_type" value="d"/>Joka</label><input class="dhx_repeat_text" type="text" name="year_day" value="1" />p&auml;iv&auml;<select name="year_month"><option value="0" selected >Tammikuu<option value="1">Helmikuu<option value="2">Maaliskuu<option value="3">Huhtikuu<option value="4">Toukokuu<option value="5">Kes&auml;kuu<option value="6">Hein&auml;kuu<option value="7">Elokuu<option value="8">Syyskuu<option value="9">Lokakuu<option value="10">Marraskuu<option value="11">Joulukuu</select>kuukausi<br /> <label><input class="dhx_repeat_radio" type="radio" name="year_type" checked value="w"/></label><input class="dhx_repeat_text" type="text" name="year_week2" value="1" /><select name="year_day2"><option value="1" selected >Maanantai<option value="2">Tiistai<option value="3">Keskiviikko<option value="4">Torstai<option value="5">Perjantai<option value="6">Lauantai<option value="0">Sunnuntai</select><select name="year_month2"><option value="0" selected >Tammikuu<option value="1">Helmikuu<option value="2">Maaliskuu<option value="3">Huhtikuu<option value="4">Toukokuu<option value="5">Kes&auml;kuu<option value="6">Hein&auml;kuu<option value="7">Elokuu<option value="8">Syyskuu<option value="9">Lokakuu<option value="10">Marraskuu<option value="11">Joulukuu</select><br /> </div> </div> <div class="dhx_repeat_divider"></div> <div class="dhx_repeat_right"> <label><input class="dhx_repeat_radio" type="radio" name="end" checked/>Ei loppumisaikaa</label><br /> <label><input class="dhx_repeat_radio" type="radio" name="end" /></label><input class="dhx_repeat_text" type="text" name="occurences_count" value="1" />Toiston j&auml;lkeen<br /> <label><input class="dhx_repeat_radio" type="radio" name="end" />Loppuu</label><input class="dhx_repeat_date" type="text" name="date_of_end" value="'+e.config.repeat_date_of_end+'" /><br /> </div> </form> </div> <div style="clear:both"> </div>';
});