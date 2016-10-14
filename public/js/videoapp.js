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

var videoController = function ($scope, $http, $q, videoService, videoCollection, watchlistCollection, videoDetails, tvDetails) {
    $scope.videoService = videoService;
    $scope.searchActive = false;

    $scope.formatOptions = [
        "DVD", "Blu-Ray", "Google Play",
        "iTunes", "Digital",
        // "Digital (720)", "Digital (480)", "Digital (1080)", "Digital (4k)",
        "Amazon", "Plex"
    ];
    $scope.formatOptions.sort();

    $scope.MainItemClick = function () {
        var query = document.getElementById("search").value;
        videoService.getData(query);
        $scope.searchActive = true;
    };

    $scope.videoCollection = videoCollection;
    $scope.videoCollectionLoad = function() {
        videoCollection.getData();
    };

    $scope.watchlistCollection = watchlistCollection;
    $scope.watchlistCollectionLoad = function() {
        watchlistCollection.getData();
    };

    $scope.tvDetails = tvDetails;
    $scope.getTVDetails = function (vidId) {
        tvDetails.getDetails(vidId);
    };

    $scope.videoDetails = videoDetails;
    $scope.videoDetailsLoad = function(vidId, type) {
        videoDetails.getData(vidId, type);
    };

    $scope.toggleVideoFormatOwned = function (id, action, format) {
        var data = { "videoId": id, "format": format };
        $http({
            url: "/api/1/"+action+"/format",
            method: "POST",
            data: data
        }).then(function(rtnMsg){
            // add in error reporting here
        });
    };

    $scope.isFormatOwned = function(arr, format) {
        if (arr == null) {
            return false
        }
        return arr.indexOf(format) !== -1;
    };

    $scope.AddToWatchList = function(vid){
        vid.watchList = (vid.watchList ? false : true);
        var data = { "videoId": 'vi-'+vid.media_type+'-'+vid.id };
        $http({
            url: "/api/1/watchlist/toggle",
            method: "POST",
            data: data
        }).then(function(rtnMsg){
            // add in error reporting here
        });
    };

    $scope.watchListClass = function(el){ // adds class to the div wrapper for the Watch List button
        return (el ? 'in-list' : 'not-in-list');
    };

    $scope.watchListText = function(el){ // Appended text to the Watch List button
        return (el ? 'Remove From ' : 'Add To ');
    };

    $scope.trimSummary = function(summary){
        if (summary.length > 480){
           summary = summary.substring(0, 480) + '... ';
        }
        return summary;
    };

    $scope.dateShowYear = function(date){
        return date.split('-')[0];
    };

    $scope.minToHours = function(a){
        var hours = Math.trunc(a/60);
        var minutes = a % 60;
        var hoursStr = "hr";
        if (hours > 1){
            hoursStr = 'hrs';
        }
        return hours+' '+hoursStr+' '+minutes+' mins';
    };
};

app.controller(videoController);

app.service('videoCollection', function ($http) {

    var self  = this;
    self.collection = [];

    self.getData = function() {
        // get collection of movies here
        $http.post('/api/1/user/collection').success(function (data) {
            for (var i = 0; i < data.msg.length; i++){
                if (data.msg[i].value.format.length > 0){
                    self.collection.push(data.msg[i].value)
                }
            }
            self.collection = videoCollectionSort(self.collection);
        });
    };
    function videoCollectionSort(collection) {
        // normalize movie and tv names to a sortName string
        for (var i = 0; i < collection.length; i++){
            if (collection[i].title){
                collection[i].sortName = collection[i].title
            } else if (collection[i].original_title){
                collection[i].sortName = collection[i].original_title
            } else if (collection[i].name){
                collection[i].sortName = collection[i].name
            }
        }
        // remove 'The ' from sortName
        for (var i = 0; i < collection.length; i++){
            if (collection[i].sortName.indexOf('The ') == 0){
                collection[i].sortName = collection[i].sortName.slice(4, collection[i].sortName.length);
            }
        }

        collection.sort(function (a, b) {
            return a.sortName.localeCompare(b.sortName);
        });

        return collection;
    }
});

app.service('watchlistCollection', function ($http) {

    var self  = this;
    self.collection = [];

    self.getData = function() {
        // get collection of movies here
        $http.post('/api/1/user/watchlist').success(function (data) {
            for (var i = 0; i < data.msg.length; i++){
                self.collection.push(data.msg[i].value)
            }
            self.collection = videoCollectionSort(self.collection);
        });
    };

    function videoCollectionSort(collection) {
        // normalize movie and tv names to a sortName string
        for (var i = 0; i < collection.length; i++){
            if (collection[i].title){
                collection[i].sortName = collection[i].title
            } else if (collection[i].original_title){
                collection[i].sortName = collection[i].original_title
            } else if (collection[i].name){
                collection[i].sortName = collection[i].name
            }
        }
        // remove 'The ' from sortName
        for (var i = 0; i < collection.length; i++){
            if (collection[i].sortName.indexOf('The ') == 0){
                collection[i].sortName = collection[i].sortName.slice(4, collection[i].sortName.length);
            }
        }

        collection.sort(function (a, b) {
            return a.sortName.localeCompare(b.sortName);
        });

        return collection;
    }

});

app.service('videoDetails', function ($http, $q) {

    var self = this;
    self.details = {};
    // set the background-shadow height
    $('.background-shadow').height($(window).height()-130);
    self.getData = function(vidId, type) {
        $http.post('/api/1/video/details', {"id":vidId, "type":type}).success(function (data) {
            self.details = (data != 404 ? data : {"error": true});
        });
    };
});

app.service('tvDetails', function ($http, $q) {
    var self = this;
    self.details = {};
    self.getDetails = function(vidId){
        console.log('tv show vidId - '+vidId);
        $http.post('/api/1/video/details', {"id":vidId, "type":"tvSeason"}).success(function (data) {
            self.details = (data != 404 ? data : {"error": true});
        });
    }
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

app.directive('resize', function($window) {
   return function (scope, element, attr) {
       var w = angular.element($window);
       scope.$watch(function () {
           return {
               'h': w.height(),
               'w': w.width()
           };
       }, function (newValue, oldValue) {
           scope.windowHeight = newValue.h;
           scope.windowWidth = newValue.w;

           scope.resizeWithOffset = function (offsetH) {
               return {
                   'height': (newValue.h - offsetH) + 'px'
               };
           };
       }, true);

       w.bind('resize', function () {
           scope.$apply();
       });
   }
});