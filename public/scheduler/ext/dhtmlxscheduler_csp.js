/*
@license
dhtmlxScheduler v.4.4.0 Professional Evaluation

This software is covered by DHTMLX Evaluation License. Contact sales@dhtmlx.com to get Commercial or Enterprise license. Usage without proper license is prohibited.

(c) Dinamenta, UAB.
*/
scheduler.date.date_to_str=function(e,t){return function(i){return e.replace(/%[a-zA-Z]/g,function(e){switch(e){case"%d":return t?scheduler.date.to_fixed(i.getUTCDate()):scheduler.date.to_fixed(i.getDate());case"%m":return t?scheduler.date.to_fixed(i.getUTCMonth()+1):scheduler.date.to_fixed(i.getMonth()+1);case"%j":return t?i.getUTCDate():i.getDate();case"%n":return t?i.getUTCMonth()+1:i.getMonth()+1;case"%y":return t?scheduler.date.to_fixed(i.getUTCFullYear()%100):scheduler.date.to_fixed(i.getFullYear()%100);
case"%Y":return t?i.getUTCFullYear():i.getFullYear();case"%D":return t?scheduler.locale.date.day_short[i.getUTCDay()]:scheduler.locale.date.day_short[i.getDay()];case"%l":return t?scheduler.locale.date.day_full[i.getUTCDay()]:scheduler.locale.date.day_full[i.getDay()];case"%M":return t?scheduler.locale.date.month_short[i.getUTCMonth()]:scheduler.locale.date.month_short[i.getMonth()];case"%F":return t?scheduler.locale.date.month_full[i.getUTCMonth()]:scheduler.locale.date.month_full[i.getMonth()];case"%h":
return t?scheduler.date.to_fixed((i.getUTCHours()+11)%12+1):scheduler.date.to_fixed((i.getHours()+11)%12+1);case"%g":return t?(i.getUTCHours()+11)%12+1:(i.getHours()+11)%12+1;case"%G":return t?i.getUTCHours():i.getHours();case"%H":return t?scheduler.date.to_fixed(i.getUTCHours()):scheduler.date.to_fixed(i.getHours());case"%i":return t?scheduler.date.to_fixed(i.getUTCMinutes()):scheduler.date.to_fixed(i.getMinutes());case"%a":return t?i.getUTCHours()>11?"pm":"am":i.getHours()>11?"pm":"am";case"%A":
return t?i.getUTCHours()>11?"PM":"AM":i.getHours()>11?"PM":"AM";case"%s":return t?scheduler.date.to_fixed(i.getUTCSeconds()):scheduler.date.to_fixed(i.getSeconds());case"%W":return t?scheduler.date.to_fixed(scheduler.date.getUTCISOWeek(i)):scheduler.date.to_fixed(scheduler.date.getISOWeek(i));default:return e}})}},scheduler.date.str_to_date=function(e,t){return function(i){for(var a=[0,0,1,0,0,0],r=i.match(/[a-zA-Z]+|[0-9]+/g),n=e.match(/%[a-zA-Z]/g),s=0;s<n.length;s++)switch(n[s]){case"%j":case"%d":
a[2]=r[s]||1;break;case"%n":case"%m":a[1]=(r[s]||1)-1;break;case"%y":a[0]=1*r[s]+(r[s]>50?1900:2e3);break;case"%g":case"%G":case"%h":case"%H":a[3]=r[s]||0;break;case"%i":a[4]=r[s]||0;break;case"%Y":a[0]=r[s]||0;break;case"%a":case"%A":a[3]=a[3]%12+("am"==(r[s]||"").toLowerCase()?0:12);break;case"%s":a[5]=r[s]||0;break;case"%M":a[1]=scheduler.locale.date.month_short_hash[r[s]]||0;break;case"%F":a[1]=scheduler.locale.date.month_full_hash[r[s]]||0}return t?new Date(Date.UTC(a[0],a[1],a[2],a[3],a[4],a[5])):new Date(a[0],a[1],a[2],a[3],a[4],a[5]);
}};