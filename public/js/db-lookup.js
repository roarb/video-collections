
function searchMovies(name, cb){
    // pass to internal IP api page for making the request out to themoviedb.org and any other sources to be added later
    
    $.post("/api/1/search/multi", { 
        query: name 
    })
        .done(function(videos){
            return cb(false, videos);
        });
    
}