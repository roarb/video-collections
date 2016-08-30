var app = angular.module("userapp", []);

app.service('userService', function () {

    var self = this;

    self.initAccount = function (account){
        self.account = JSON.parse(account);
    }

});

var accountCtrl = function ($scope, $http, userService){

    $scope.userService = userService;

};

app.controller(accountCtrl);