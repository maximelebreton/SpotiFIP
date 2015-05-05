'use strict';

// Spotify
var spotifyApi = 'http://ws.spotify.com/search/1/track.json?q=';

// FIP
var fipApi = 'https://www.kimonolabs.com/api/ondemand/9qx1un9y?apikey=bfb617c617700d2b984e1b58cce5c544';

var weatherApi = 'http://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20weather.forecast%20where%20woeid%3D23424819%20and%20u%3D%22c%22%20&format=json&callback=';

// For local testing
//var fipApi = 'http://127.0.0.1:9000/json/fip-demo.json?q=';


var App = angular.module('spotiFipApp', [
    'ngResource',
    'ngSanitize',
    'ui.bootstrap'
]);

App.directive('onFinishRender', function($timeout) {
    return {
        restrict: 'A',
        link: function(scope, element, attr) {
            if (scope.$last === true) {
                $timeout(function() {
                    scope.$emit(attr.onFinishRender);
                }, 1500); // TO DO : make a real callback...
            }
        }
    }
});

App.controller('DatepickerCtrl', function($rootScope, $scope, $filter) {
    $rootScope.startDate = $filter('date')(new Date(), 'yyyy-MM-dd');

    $scope.today = function() {
        $scope.dt = new Date();
    };
    $scope.today();

    $scope.showWeeks = true;
    $scope.toggleWeeks = function() {
        $scope.showWeeks = !$scope.showWeeks;
    };

    $scope.clear = function() {
        $scope.dt = null;
    };

    $scope.changed = function() {
        $rootScope.startDate = $filter('date')($scope.dt, 'yyyy-MM-dd');
        //console.log('Time changed to: ' + $scope.dt);
    };

    $rootScope.$on('startingEvent', function() {

        $scope.changed();
        //console.log($rootScope.startDate);

    });

    // Disable weekend selection

    $scope.minDate = $filter('date')(new Date(new Date().getTime() - (13 * 24 * 60 * 60 * 1000)), 'yyyy-MM-dd');
    $scope.maxDate = $filter('date')(new Date(), 'yyyy-MM-dd');

    $scope.open = function($event) {
        $event.preventDefault();
        $event.stopPropagation();

        $scope.opened = true;
    };

    $scope.dateOptions = {
        'year-format': "'yy'",
        'starting-day': 1
    };
});


App.controller('TimepickerCtrl', function($rootScope, $scope, $filter) {
    $rootScope.startHour = $filter('date')(new Date(), 'H');

    $scope.mytime = new Date();

    $scope.hstep = 1;
    $scope.mstep = 1;

    $scope.changed = function() {
        //console.log('Time changed to: ' + $scope.mytime);
        $rootScope.startHour = $filter('date')($scope.mytime, 'H');
    };

    $scope.clear = function() {
        $scope.mytime = null;
    };

    $rootScope.$on('startingEvent', function() {

        $scope.changed();


    });

});


App.controller('MainCtrl', function($rootScope, $scope, $http, $sce, $filter, $timeout, $q) {


    $scope.tryNumbers = 3;

    $scope.start = function(retry) {

        $scope.loadingValue = 100;
        $scope.noResults = false;

        if (retry) {
            //console.log('retry');

            $scope.loadingType = 'warning';
            $scope.loadingMessage = 'Tentative de reconnexion avec FIP... (' + $scope.tryNumbers + ')';
        } else {

            $scope.loadingType = 'info';
            $scope.loadingMessage = "Connexion avec FIP...";

        }


        $timeout(function() {
            if ($scope.loadingType != 'success') {
                $scope.loadingMessage = "Il va falloir attendre un petit peu...";
            }
        }, 3000);

        $timeout(function() {
            if ($scope.loadingType != 'success') {
                $scope.loadingMessage = "Le temps que le gars de FIP discute avec celui de Spotify...";
            }
        }, 6000);

        $timeout(function() {
            if ($scope.loadingType != 'success') {
                $scope.loadingMessage = "En attendant, je vous propose de faire un point météo !";
                $http.get(weatherApi).then(function(res) {
                    $scope.temperature = res.data.query.results.channel.item.forecast[0];
                    //console.log($scope.temperature);
                });
            }
        }, 11000);

        $timeout(function() {
            if ($scope.loadingType != 'success') {
                $scope.loadingMessage = "Pour la france, les temperatures vont de " + $scope.temperature.low + "°C pour les minimales, et " + $scope.temperature.high + "°C pour les maximales !";
            }
        }, 14000);




        $rootScope.$emit('startingEvent');

        $scope.loading = true;
        $scope.playlist = [];

        // TO DO : use the get method, and allow cross origin policy
        $http.jsonp(fipApi + '&start_hour=' + $rootScope.startHour + '&start_date=' + $rootScope.startDate + '&callback=JSON_CALLBACK').success(function(data) {

            if (data.lastrunstatus == 'failure') {
                $scope.noResults = true;
                $scope.loading = false;
                return;
            }

            $scope.tryNumbers = 3;
            //$http.jsonp(fipApi).success(function(data) {
            $scope.fipDatas = data.results.collection1;

            $scope.loadingType = 'success';
            $scope.loadingMessage = "Connexion avec Spotify...";

            var deferred = $q.defer();
            var promises = [];

            angular.forEach($scope.fipDatas, function(fip, key) {

                var that = fip;
                var fip_key = key;
                var spotify_key = 0;

                promises.push(

                  $http.get(spotifyApi + fip.track.replace(/[`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, '') + ' ' + fip.artist.replace(/[`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, '')).then(function(res) {
                      fip.spotifyDatas = res.data.tracks;

                      $scope.loadingType = 'success';
                      $scope.loadingMessage = "Terminé";

                      if (fip.spotifyDatas.length) {
                          var _break = true;
                          angular.forEach(fip.spotifyDatas, function(spotifyData, key) {

                              spotify_key = key;

                              if (_break) {
                                  //console.log(spotifyData);
                                  if (spotifyData.album.name.match(new RegExp(fip.album, "gi"))) {

                                      fip.spotify = fip.spotifyDatas[key];
                                      _break = false;

                                  } else {
                                      fip.spotify = fip.spotifyDatas[0];
                                  }
                              }

                          });

                          $scope.playlist.push(fip.spotify.href);

                          fip.spotify.trackEmbedSrc = 'https://embed.spotify.com/?uri=' + fip.spotify.href;

                      }


                  })

                );


            });

            $q.all(promises).then(function(results){

              $scope.loading = false;
              $scope.ready = true;
              $scope.playlistHref = 'https://embed.spotify.com/?uri=spotify:trackset:FIP – ' + $rootScope.startDate + ' – ' + $rootScope.startHour + 'h-' + (parseInt($rootScope.startHour) + 1) + 'h:' + $scope.playlist.join().replace(new RegExp('spotify:track:', 'g'), "");

            });

        }).error(function(data, status, headers, config) {

            $timeout(function() {
                $scope.loadingType = 'danger';
                $scope.loadingMessage = 'Erreur de connexion...';
                if ($scope.tryNumbers == 0) {
                    $scope.loadingMessage = "Hum... c'est embarrassant ! Relancez votre recherche, ou signalez moi le problème via Github.";
                }

                $timeout(function() {
                    if ($scope.tryNumbers > 0) {
                        $scope.start(true);
                        $scope.tryNumbers--;
                    }
                }, 1500);

            }, 1500);

        });

        //$scope.$on('test', function(ngRepeatFinishedEvent) {
        //    //console.log('ready !');
        //
        //});

    }


}).config(function($sceDelegateProvider) {
    $sceDelegateProvider.resourceUrlWhitelist([
        // Allow same origin resource loads.
        'self',
        // Allow loading from our assets domain.  Notice the difference between * and **.
        'https://embed.spotify.com/**'
    ]);

    // The blacklist overrides the whitelist so the open redirect here is blocked.
    $sceDelegateProvider.resourceUrlBlacklist([]);
});
