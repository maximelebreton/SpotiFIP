'use strict';

// Spotify
var spotifyApi = 'http://ws.spotify.com/search/1/track.json?q=';

// FIP
var fipApi = 'http://kimonolabs.com/api/7s1d5xz8?apikey=bfb617c617700d2b984e1b58cce5c544';

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
        console.log('Time changed to: ' + $scope.dt);
    };

    $rootScope.$on('startingEvent', function() {

        $scope.changed();
        console.log($rootScope.startDate);

    });

    // Disable weekend selection

    $scope.minDate = $filter('date')( new Date(new Date().getTime() - (13 * 24 * 60 * 60 * 1000)) , 'yyyy-MM-dd');
    $scope.maxDate = $filter('date')( new Date() , 'yyyy-MM-dd');

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
        console.log('Time changed to: ' + $scope.mytime);
        $rootScope.startHour = $filter('date')($scope.mytime, 'H');
    };

    $scope.clear = function() {
        $scope.mytime = null;
    };

    $rootScope.$on('startingEvent', function() {

        $scope.changed();


    });

});


App.controller('MainCtrl', function($rootScope, $scope, $http, $sce, $filter, $timeout) {


    $scope.tryNumbers = 3;


    $scope.start = function(retry) {

        $scope.loadingValue = 100;

        if (retry) {
        	console.log('retry');
        	
        	$scope.loadingType = 'warning';
        	$scope.loadingMessage = 'Tentative de reconnexion avec FIP... ('+$scope.tryNumbers+')';
        } else {

        	$scope.loadingType = 'info';
        	$scope.loadingMessage = "Connexion avec FIP...";

        }
        

        $rootScope.$emit('startingEvent');

        $scope.loading = true;
        $scope.playlist = [];

        //console.log($rootScope.startHour);
        console.log($rootScope.startDate);


        // TO DO : use the get method, and allow cross origin policy
        $http.jsonp(fipApi + '&start_hour=' + $rootScope.startHour + '&start_date=' + $rootScope.startDate + '&callback=JSON_CALLBACK').success(function(data) {

        	$scope.tryNumbers = 3;
            //$http.jsonp(fipApi).success(function(data) {
            $scope.fipDatas = data.results.collection1;

            $scope.loadingType = 'success';
            $scope.loadingMessage = "Connexion avec Spotify...";


            angular.forEach($scope.fipDatas, function(fip, key) {

                var that = fip;
                var fip_key = key;
                var spotify_key = 0;

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


                });


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
		            	console.log();
		            	$scope.start(true);
		            	$scope.tryNumbers--;
		            }
			    }, 1500);

		    }, 1500);
            
        });

        $scope.$on('test', function(ngRepeatFinishedEvent) {
            console.log('ready !');
            $scope.loading = false;
            $scope.ready = true;
            $scope.playlistHref = 'https://embed.spotify.com/?uri=spotify:trackset:FIP – '+$rootScope.startDate+ ' – ' +$rootScope.startHour+ 'h-'+ ($rootScope.startHour+1) +'h:' + $scope.playlist.join().replace(new RegExp('spotify:track:', 'g'), "");
        });

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
