function toggleFormatOptions(e){
    var el = $(e).parent().find('.format-options');
    if ($(e).hasClass('open')){
        $(e).removeClass('open').addClass('glyphicon-plus-sign').removeClass('glyphicon-minus-sign');
        $(el).addClass('hidden');
    } else {
        $(e).addClass('open').removeClass('glyphicon-plus-sign').addClass('glyphicon-minus-sign');
        $(el).removeClass('hidden');
    }
}

function toggleVideoFormatOwned(e, action){
    console.log('fires scripts.toggleVideoFormatOwned()');
    // replaces to fix the angular text publishing to the li element.
    var format = $(e).text().replace('\n', '').replace(/\s/g, '').replace('(', ' (').replace('eP', 'e P');
    var videoId = $(e).parent().attr('data-vid');
    // todo add in error checking to make sure the add /remove button isn't sending in spammed requests.
    if (action === 'add'){
        $.post('/api/1/add/format', {
            "format": format,
            "videoId": videoId
        }).done(function(data){
            data = JSON.parse(data);
            if (data.err){
                // throw error to end user
                console.log(data.msg);
            } else {
                // add success message and update the page graphics
                console.log(data.msg);
                $(e).addClass('owned').attr("onclick", "toggleVideoFormatOwned(this, 'remove')");
            }
        })
    }

    if (action === 'remove'){
        $.post('/api/1/remove/format', {
            "format": format,
            "videoId": videoId
        }).done(function(data){
            data = JSON.parse(data);
            if (data.err){
                // throw error to end user
                console.log(data.msg);
            } else {
                // add success message and update the page graphics
                console.log(data.msg);
                $(e).removeClass('owned').attr("onclick", "toggleVideoFormatOwned(this, 'add')");
            }
        })
    }

}