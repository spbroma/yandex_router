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
        targetPoint = new ymaps.Placemark(targetCoords, { iconContent: '' },
         { preset: 'islands#redStretchyIcon' }),

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
    // myMap.geoObjects.add(targetPoint);

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
	
	function clearTargetPoint (keepSearchResult) {
        if (!keepSearchResult) {
            searchControl.hideResult();
        }

        if (targetPoint) {
            myMap.geoObjects.remove(targetPoint);
            targetPoint = null;
        }
    }

    function onMapClick (e) {
        clearTargetPoint();
        targetCoords = e.get('coords');
        targetPoint = new ymaps.Placemark(targetCoords, { iconContent: '' }, { preset: 'islands#redStretchyIcon' }),
        myMap.geoObjects.add(targetPoint);
        console.log(['onMapClick', targetCoords]);




  //       clearSourcePoint();
		// coords = e.get('coords');
  //       sourcePoint = new ymaps.Placemark(e.get('coords'), { iconContent: 'Отсюда' }, { preset: 'islands#greenStretchyIcon' });
  //       myMap.geoObjects.add(sourcePoint);
  //       createRoute();		
  //       console.log(['src coord:', coords[0], coords[1]]);

		// dist = ymaps.coordSystem.geo.getDistance(coords, targetCoords);
  //       console.log(dist);

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
     		step = 700;
     		dcx = ymaps.coordSystem.geo.solveDirectProblem(c, [1,0], step);
     		dcy = ymaps.coordSystem.geo.solveDirectProblem(c, [0,1], step);

     		dcx = dcx.endPoint[0] - c[0];
     		dcy = dcy.endPoint[1] - c[1];
     		
     		//      		cnew = [[c[0], c[1]]];
     		cnew = [];
            R = 3000;

     		N = 9;
     		for(var i = -N; i <= N; i++){
     			for(var j = -N; j <= N; j++){    
                    if((Math.pow(i,2) + Math.pow(j,2)) < Math.pow(N,2)){
                    	if(!((i== 0) && (j== 0)))
                    	{
							x = c[0] + i*dcx;
							y = c[1] + j*dcy;
							cnew.push([x, y]);                        
                    	}
                    }
     			}
     		}

            for(var i = 0; i<10; i++)
            {
                var metric = evalMetric(cnew[i*2]);
                console.log(metric);
            }
     		console.log(['num of points',cnew.length]);

//      		dist1 = ymaps.coordSystem.geo.getDistance(cnew[0], cnew[1]);
//      		dist2 = ymaps.coordSystem.geo.getDistance(cnew[0], cnew[2]);
//      		console.log([dist1, dist2]);
     		heatmap.setData(cnew);
     	};

     	myMap.events.add('click', onHeatMapClick);
	});
	
	var pointsMetricArr = [];

	function evalMetric(sourceCoord){

        createRoute(sourceCoord);

		var routes = currentRoute.getRoutes();

        mydelay(400);

			
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
    function createRoute (sourceCoord) {
        sourcePoint = new ymaps.Placemark(sourceCoord);
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
            // referencePoints: [sourcePoint, targetPoint],
            referencePoints: ['55.726386,37.636051', '55.768659,37.63941'],
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