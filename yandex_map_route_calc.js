	// var addressDOM = document.getElementsByName('address'); -->
	// var button = document.querySelector("button"); -->
	  // button.addEventListener("click", function() { -->
		// address = addressDOM[0].value;		 -->
		// console.log(address); -->
	  // }); -->
	  

	function init () {
		
    // Координаты, к которым будем строить маршруты.
    // Укажите здесь, к примеру, координаты вашего офиса.
    var targetCoords = [55.848527, 37.583103],

    // Инициализируем карту.
        myMap = new ymaps.Map('map', {
            center: targetCoords,
            zoom: 11
        }, {
            // Ограничиваем количество результатов поиска.
            searchControlResults: 1,

            // Отменяем автоцентрирование к найденным адресам.
            searchControlNoCentering: true,

            // Разрешаем кнопкам нужную длину.
            buttonMaxWidth: 150
        }),

    // Метка для конечной точки маршрута.
        targetPoint = new ymaps.Placemark(targetCoords, { iconContent: 'Работа' }, { preset: 'islands#redStretchyIcon' }),

    // Получаем ссылки на нужные элементы управления.
        searchControl = myMap.controls.get('searchControl'),
        geolocationControl = myMap.controls.get('geolocationControl'),


    // Метка для начальной точки маршрута.
        sourcePoint,
	
	// Тепловая карта
		heatmap,

    // Переменные, в которых будут храниться ссылки на текущий маршрут.
        currentRoute,
        currentRoutingMode;

    // Добавляем конечную точку на карту.
    myMap.geoObjects.add(targetPoint);

    // Подписываемся на события, информирующие о трёх типах выбора начальной точки маршрута:
    // клик по карте, отображение результата поиска или геолокация.
    myMap.events.add('click', onMapClick);
//     myMap.events.add('click', onHeatMapClick);
    searchControl.events.add('resultshow', onSearchShow);
    geolocationControl.events.add('locationchange', onGeolocate);

    /*
     * Следующие функции реагируют на нужные события, удаляют с карты предыдущие результаты,
     * переопределяют точку отправления и инициируют перестроение маршрута.
     */
	 
	// multiRouter.MultiRoute.activeroutechange  -->
	// function multiRouter.MultiRoute.activeroutechange(){ -->
		// console.log('activeroutechange'); -->
	// } -->
	
	function updateHeatMap(data){
		heatmap.setData(data);
	}

	

    function onMapClick (e) {
        clearSourcePoint();
		coords = e.get('coords');
        sourcePoint = new ymaps.Placemark(e.get('coords'), { iconContent: 'Отсюда' }, { preset: 'islands#greenStretchyIcon' });
        myMap.geoObjects.add(sourcePoint);
        createRoute();		
        console.log(['src coord:', coords[0], coords[1]]);

		dist = ymaps.coordSystem.geo.getDistance(coords, targetCoords);
        console.log(dist);

		// updateHeatMap(coords);
    }

    function onSearchShow (e) {
        clearSourcePoint(true);
        sourcePoint = searchControl.getResultsArray()[e.get('index')];
        createRoute();
    }

    function onGeolocate (e) {
        clearSourcePoint();
        sourcePoint = e.get('geoObjects').get(0);
        createRoute();
    }

    function clearSourcePoint (keepSearchResult) {
        if (!keepSearchResult) {
            searchControl.hideResult();
        }

        if (sourcePoint) {
            myMap.geoObjects.remove(sourcePoint);
            sourcePoint = null;
        }
    }
	
	var myMultiRoute = new ymaps.multiRouter.MultiRoute(
	{
		referencePoints: [ '55.726386,37.636051', '55.768659,37.63941']
	});
	
	ymaps.modules.require(['Heatmap'], function (Heatmap) {
		var data = [[55.848527, 37.583103], [55.848528, 37.583104]],
         heatmap = new Heatmap(data);
     heatmap.setMap(myMap);


     	function onHeatMapClick(e){
     		c = e.get('coords');
     		dcx = ymaps.coordSystem.geo.solveDirectProblem(c, [1,0], 1000);
     		dcy = ymaps.coordSystem.geo.solveDirectProblem(c, [0,1], 1000);

     		dcx = dcx.endPoint[0] - c[0];
     		dcy = dcy.endPoint[1] - c[1];
     		
     		cnew = [[c[0], c[1]]];
     		N = 3;
     		for(var i = -N; i <= N; i++){
     			for(var j = -N; j <= N; j++){     			
     				cnew.push([c[0] + i*dcx, c[1] + j*dcy]);
     			}
     		}

//      		dist1 = ymaps.coordSystem.geo.getDistance(cnew[0], cnew[1]);
//      		dist2 = ymaps.coordSystem.geo.getDistance(cnew[0], cnew[2]);
//      		console.log([dist1, dist2]);
     		heatmap.setData(cnew);
     	};

     	myMap.events.add('click', onHeatMapClick);
	});
	
	var pointsMetricArr = [];

	function evalMetric(currentRoute){
		var routes = currentRoute.getRoutes();


			
		console.clear();
		var resultStr = '';
		var durationArr = [];
		for (var i = 0; i<routes.getLength(); i++)
		{
			var duration_text=routes.get(i).properties.get('duration.text');
			var duration_val=routes.get(i).properties.get('duration.value');
			durationArr[i] = duration_val;
			console.log(duration_text);		

			var walkDist = routes.get(i).properties.get('rawProperties.RouteMetaData.WalkingDistance.value');
			var walkDur = walkDist/5000*60;

			resultStr += duration_text + '<br>';				
		}

		var minVal = Math.min.apply(null, durationArr)/60;


		return minVal;
	};


    /*
     * Функция, создающая маршрут.
     */
    function createRoute (routingMode) {
		routingMode = 'masstransit';

        // Если начальная точка маршрута еще не выбрана, ничего не делаем.
        if (!sourcePoint) {
            currentRoutingMode = routingMode;
            geolocationControl.events.fire('press');
            return;
        }

        // Стираем предыдущий маршрут.
        clearRoute();

        currentRoutingMode = routingMode;

        // Создаём маршрут нужного типа из начальной в конечную точку.
        currentRoute = new ymaps.multiRouter.MultiRoute({
            referencePoints: [sourcePoint, targetPoint],
            params: { routingMode: routingMode},
        }, {
            boundsAutoApply: true
        });
		
		currentRoute.options.set(
            // routeMarkerIconContentLayout - чтобы показывать время для всех сегментов.
            "routeWalkMarkerIconContentLayout",
            ymaps.templateLayoutFactory.createClass('{{ properties.duration.text }}')
        );
		

        // Добавляем маршрут на карту.
        myMap.geoObjects.add(currentRoute);		
				
		currentRoute.events.add("activeroutechange", function (event) {
			var m = evalMetric(currentRoute);
			startCoord = currentRoute.properties._data.waypoints[0].coordinates;
			

			pointsMetricArr.push([startCoord[0], startCoord[1], m]);
		});
	
    }


		
    function clearRoute () {
        myMap.geoObjects.remove(currentRoute);
        currentRoute = currentRoutingMode = null;
    }
	
	// var duration_text=myMultiRoute.getActiveRoute().properties.get('duration.text'); -->
	// console.log(duration_text); -->
	

	
	// var route_button = new ymaps.control.Button({ -->
		// data: { content: 'Посчитать'}}); -->
	// myMap.controls.add(route_button); -->
	
	function duration_calc(){ 
		var duration_text=currentRoute.getActiveRoute().properties.get('duration.text');
		var durationInTraffic_text=currentRoute.getActiveRoute().properties.get('durationInTraffic.text');                                                
		var duration_value=currentRoute.getActiveRoute().properties.get('duration.value');
		var durationInTraffic_value=currentRoute.getActiveRoute().properties.get('durationInTraffic.value');                                                
		alert('duration_text:'+duration_text+'\rduration_value:'+duration_value+'\rdurationInTraffic_text:'+durationInTraffic_text+'\rdurationInTraffic_value:'+durationInTraffic_value); 													 
	};
			
	
	// route_button.events.add('select', duration_calc); -->
	

	
	// duration_calc(); -->

	}

	ymaps.ready(init);