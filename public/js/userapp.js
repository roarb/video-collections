var app = angular.module("userapp", []);

app.service('userService', function ($http) {

    var self = this;
    self.user = [];

});

var accountCtrl = function ($scope, $http, userService){
    $scope.userService = userService;

    $scope.login = function(){
        console.log('Logging In.');
       $.ajax({
           url: '/login',
           headers: { 'Authorization': createLoginAuth() },
           type: 'POST',
           success: function(data){
               var res = JSON.parse(data);
               console.log(res);
               if (res.err){
                   console.log('we have a problem');
               } else{
                   console.log('signing in');
                   window.location.href = '/home';
               }
           }
       });
    };

};

app.controller(accountCtrl);