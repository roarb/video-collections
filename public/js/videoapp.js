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
            self.collection = data;
        });
    };

    self.getData();
});

var videoController = function ($scope, $http, videoService, videoCollection) {
    $scope.videoService = videoService;

    $scope.formatOptions = [
        "DVD", "Blu-Ray", "Google Play",
        "iTunes",  "Digital (720)",
        "Digital (480)", "Digital (1080)",
        "Digital (4k)", "Amazon"
    ];
    $scope.formatOptions.sort();

    $scope.MainItemClick = function () {
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