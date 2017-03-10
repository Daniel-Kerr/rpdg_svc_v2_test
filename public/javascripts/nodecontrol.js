/**
 * Created by Nick on 11/2/2016.
 */

function initsliders(sliders) {

    for ( var i = 0; i < sliders.length; i++ ) {

        noUiSlider.create(sliders[i], {
            start: 127,
            tooltips: true,
            connect: [true, false],
            orientation: "vertical",
            range: {
                'min': 0,
                'max': 255
            },
            format: wNumb({
                decimals: 0
            })
        });

        // Bind the color changing function
        // to the slide event.
        // sliders[i].noUiSlider.on('slide', setSliderToHost);
        sliders[i].noUiSlider.on('set', setSliderToHost);
    }

}


function sendlevelstohost(sliders)
{
    // var  sliders = document.getElementsByClassName('sliders');
    var d =  { slidervals: []};
    for ( var i = 0; i < sliders.length; i++ ) {
        var currval = sliders[i].noUiSlider.get();
        d.slidervals.push({'slider': i+1 , 'val' : currval});
    }

    var dataset = JSON.stringify(d);
    $.ajax({
        url: "/set",
        type: 'post',
        data: dataset,

        contentType: "application/json; charset=utf-8",
        success: function (result) {
            switch (result) {
                case "OK":
                    noty({ text: 'New Level Set', type: 'success'});
                    break;
                default:
                    noty({ text: 'Error setting new level ', type: 'error'});
                    break;
            }
        },
        error: function (xhr, ajaxOptions, thrownError) {
            noty({ text: 'Error setting new level ', type: 'error'});
        }
    });
}

