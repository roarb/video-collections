var app = angular.module("userapp", []);

app.service('userService', function ($http) {

    var self = this;
    self.user = [];

    self.getData = function() {
        // get data on run here
        $http.post('/api/1/get/user').success(function(data) {
            self.user = data;
        });
    };

    self.getData();
});

var userController = function ($scope, $http, userService){
    $scope.userService = userService;
};

app.controller(userController);