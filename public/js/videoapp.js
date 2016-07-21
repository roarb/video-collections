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
            // lazy load all the new images
            //lazyVideoPosterLoad();
        });
    };

    self.getData();
});

app.service('videoCollection', function ($http) {

    var self  = this;
    self.collection = [];

    self.getData = function() {

        // get collection of movies here
        $http.post('/api/1/user/collection').success(function (data) {
            self.collection = data;
        });
    };

    self.getData();
});

var videoController = function ($scope, videoService, videoCollection) {
    $scope.videoService = videoService;

    $scope.formatOptions = [
        "DVD", "Blu-Ray", "Google Play",
        "iTunes", "VHS", "Digital (720)",
        "Digital (480)", "Digital (1080)",
        "Digital (4k)", "Amazon"
    ];
    $scope.formatOptions.sort();

    $scope.MainItemClick = function () {
        console.log('$scope.MainItemClick function runs within the videoapp');
        var query = document.getElementById("search").value;
        videoService.getData(query);
    };

    $scope.videoCollection = videoCollection;
    $scope.CollectionLoad = function() {
        videoCollection.getData();
    };

};

app.controller(videoController);

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

app.filter('firstLetter', function(){
    return function (el){
        return 'bgc-'+el.substring(0,1).toLowerCase()
    }
});

app.filter('voteStars', function(){
   return function (el){
       return (parseFloat(el) / 2).toFixed(2);
   }
});