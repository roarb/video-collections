var app = angular.module("videoapp", []);
app.service('videoService', function ($http) {

    var self = this;
    self.catalog = [];

    self.getData = function(name) {
        if (!name){ return false; }

        // get data on run here
        console.log("videoService.getMyData");
        console.log(name);
        var url = '/api/1/search/multi';
        url += '?query=' + name;
        console.log(url);
        $http.post(url).success(function (data) {
            console.log("$http.post.success");
            self.catalog = data;
            // lazy load all the new images
            //lazyVideoPosterLoad();
        });
    };

    self.getData();
});

var videoController = function ($scope, videoService) {
    $scope.videoService = videoService;

    $scope.formatOptions = [
        "DVD", "Blu-Ray", "Google Play",
        "iTunes", "VHS", "Digital (720)",
        "Digital (480)", "Digital (1080)",
        "Digital (4k)", "Amazon"
    ];
    $scope.formatOptions.sort();

    $scope.MainItemClick = function () {
        var query = document.getElementById("search").value;
        videoService.getData(query);
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