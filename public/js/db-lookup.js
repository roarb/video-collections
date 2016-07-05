
function searchMovies(name){
    console.log(name);
    
    // pass to internal IP api page for making the request out to themoviedb.org and any other sources to be added later
    
    $.post("/api/1/search/multi", { 
        query: name 
    })
        .done(function(data){
            console.log(data);
        });
    
    
    
    // $.get("http://api.themoviedb.org/3/search/multi", {
    //     api_key: 'bba1c49a8793f95b6d78dc9adcdb6ded',
    //     query: name
    // })
    //     .done(function(video){
    //         console.log(video.results);
    //         for (var i = 0; i < video.results.lenght; i++){
    //            
    //         }
    //     })
}