var app = angular.module("videoapp", []);

app.service('videoService', function ($http) {

    var self = this;
    self.catalog = [];

    self.getData = function(name) {
        if (!name){ return false; }

        // get data on run here
        var url = '/api/1/search/multi';
        url += '?query=' + name;
        $http.post(url).success(function (data) {
            self.catalog = data;
        });
    };

    self.getData();
});

app.directive('videoSearchLoad', function() {
    return function (scope, element, attrs) {
        if (scope.$last) {
            // sample example of how to run a function after the ng-repeat is finished
            // iteration is complete, do whatever post-processing
            // is necessary
            // lazyVideoPosterLoad();
        }
    };
});

app.service('videoCollection', function ($http) {

    var self  = this;
    self.collection = [];

    self.getData = function() {

        // get collection of movies here
        $http.post('/api/1/user/collection').success(function (data) {
            self.collection = data.msg;
        });
    };

    // self.getData();
});

var videoController = function ($scope, $http, $q, videoService, videoCollection, watchlistCollection, videoDetails) {
    $scope.videoService = videoService;

    $scope.formatOptions = [
        "DVD", "Blu-Ray", "Google Play",
        "iTunes",  "Digital (720)",
        "Digital (480)", "Digital (1080)",
        "Digital (4k)", "Amazon", "Plex"
    ];
    $scope.formatOptions.sort();

    $scope.MainItemClick = function () {
        var query = document.getElementById("search").value;
        videoService.getData(query);
    };

    $scope.videoCollection = videoCollection;
    $scope.videoCollectionLoad = function() {
        videoCollection.getData();
    };

    $scope.watchlistCollection = watchlistCollection;
    $scope.watchlistCollectionLoad = function() {
        watchlistCollection.getData();
    };

    $scope.videoDetails = videoDetails;
    $scope.videoDetailsLoad = function(vidId, type) {
        videoDetails.getData(vidId, type);
    };

    $scope.AddToWatchList = function(vidId, $event){
        var url = '/api/1/watchlist/toggle';
        url += '?videoId=' + vidId;
        $.post(url, function(status){
            status = JSON.parse(status);
            if (status.err) {
                // todo better error reporting here
                console.log('watchlist toggle error');
            }
            var el = $event.currentTarget;
            if (status.msg == 'add'){
                console.log($(el));
                $(el).text('Remove From Watch List');
                $(el).parent().removeClass('not-in-list').addClass('in-list');
            } else {
                console.log($(el));
                $(el).text('Add To Watch List');
                $(el).parent().removeClass('in-list').addClass('not-in-list');
            }
        });

    };

    $scope.watchListClass = function(el){ // adds class to the div wrapper for the Watch List button
        if (el) { return 'in-list'; } else { return 'not-in-list'; }
    };

    $scope.watchListText = function(el){ // Appended text to the Watch List button
        if (el) { return 'Remove From '; } else { return 'Add To '; }
    };

    $scope.trimSummary = function(summary){
        if (summary.length > 480){
           summary = summary.substring(0, 480) + '... continue';
        }

        return summary;
    }
};

app.controller(videoController);

app.service('watchlistCollection', function ($http) {

    var self  = this;
    self.collection = [];

    self.getData = function() {
        console.log('watchlistCollection getData() request');
        // get collection of movies here
        $http.post('/api/1/user/watchlist').success(function (data) {
            self.collection = data.msg;
        });
    };

    // self.getData();
});

app.service('videoDetails', function ($http, $q) {

    var self = this;

    self.getData = function(vidId, type) {
        console.log(vidId+" - "+type);
        console.log('videoDetails getData request');

        $http.post('/api/1/video/details', {"id":vidId, "type":type}).success(function (data) {
            if (data != 404) {
                self.details = data;
            }
        });

    };

    //self.getData();
});

app.filter('contains', function(){
    return function (array, needle){
        if (array){
            return array.indexOf(needle) >= 0;
        }
        return false;
    }
});

app.filter('doesNotContain', function(){
    return function (array, needle){
        if (array){
            return array.indexOf(needle) == -1;
        }
        return true;
    }
});

app.filter('bgColor', function(){
    // return function (el){
    //     return 'bgc-'+el.substring(0,2).toLowerCase()
    // }
    return function(str) {
        var hash = 0;
        for (var i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        var colour = '#';
        for (var i = 0; i < 3; i++) {
            var value = (hash >> (i * 8)) & 0xFF;
            colour += ('00' + value.toString(16)).substr(-2);
        }
        return colour;
    }
});

app.filter('voteStars', function(){
   return function (el){
       if (el == 0){
           return false;
       }
       var num = parseFloat(el).toFixed(1);
       num = num*10;
       return 'width-'+num;
   }
});

app.filter('userStars', function(){
    return function (el){
        if (el == 0){
            return false;
        }
        var num = (parseFloat(el)*2).toFixed(1);
        num = num*10;
        return 'width-'+num;
    }
});

app.filter('starsWidth', function(){
   return function (el){
       el = (parseFloat(el) / 2).toFixed(2);
       return el;
   }
});