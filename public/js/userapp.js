var app = angular.module("userapp", []);

app.service('userService', function ($http) {

    var self = this;

    self.initAccount = function (id){
        var url = '/api/1/user';
        url += '?id=' + id;
        $http.post(url).success(function (account) {
            console.log('account init function');
            console.log(account);
            self.account = account;
        });

    }

});

var accountCtrl = function ($scope, $http, userService) {

    $scope.userService = userService;

    $scope.userFriends = [];
    $scope.getFriendDetails = function (id) {
        console.log(id);
    }

};

app.controller(accountCtrl);